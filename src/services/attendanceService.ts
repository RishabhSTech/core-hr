// src/services/attendanceService.ts
import { BaseService, PaginationParams } from './baseService';
import { AttendanceSession, AttendanceStatus } from '@/types/hrms';

class AttendanceService extends BaseService {
  async getAttendance(filters: any = {}): Promise<{ data: AttendanceSession[] }> {
    return this.withRetry(async () => {
      let query = this.client.from('attendance_sessions').select('*');

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.startDate) {
        query = query.gte('sign_in_time', `${filters.startDate}T00:00:00`);
      }
      if (filters.endDate) {
        query = query.lte('sign_in_time', `${filters.endDate}T23:59:59`);
      }

      const { data, error } = await query.order('sign_in_time', { ascending: false });

      if (error) throw error;
      return { data: (data || []) as AttendanceSession[] };
    }, 'Get attendance');
  }

  async getAttendanceById(id: string): Promise<AttendanceSession> {
    const cacheKey = `attendance:${id}`;
    const cached = this.getCache<AttendanceSession>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('attendance_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      this.setCache(cacheKey, data);
      return data as AttendanceSession;
    }, `Get attendance ${id}`);
  }

  async signIn(userId: string, lat?: number, lng?: number): Promise<AttendanceSession> {
    return this.withRetry(async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      // Get user's company_id
      const { data: profile, error: profileError } = await this.client
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.company_id) {
        throw new Error('User company context not found');
      }

      // Check if already signed in today (has active session with no sign_out_time)
      const { data: existing, error: checkError } = await this.client
        .from('attendance_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', profile.company_id)
        .is('sign_out_time', null)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (checkError) {
        console.error('Error checking existing session:', checkError);
      }

      if (existing && existing.length > 0) {
        throw new Error('Already signed in today');
      }

      // Create new attendance session
      const { data, error } = await this.client
        .from('attendance_sessions')
        .insert({
          user_id: userId,
          company_id: profile.company_id,
          sign_in_time: now.toISOString(),
          status: 'present',
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error inserting attendance:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create attendance record');
      }

      this.clearCache(`user_attendance:${userId}`);
      return data as AttendanceSession;
    }, `Sign in ${userId}`);
  }

  async signOut(attendanceId: string, lat?: number, lng?: number): Promise<AttendanceSession> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('attendance_sessions')
        .update({
          sign_out_time: new Date().toISOString(),
        })
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`attendance:${attendanceId}`);
      return data as AttendanceSession;
    }, `Sign out ${attendanceId}`);
  }

  async getUserAttendance(userId: string, limit: number = 30): Promise<AttendanceSession[]> {
    const cacheKey = `user_attendance:${userId}`;
    const cached = this.getCache<AttendanceSession[]>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('attendance_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('sign_in_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      this.setCache(cacheKey, data || []);
      return (data || []) as AttendanceSession[];
    }, `Get user attendance ${userId}`);
  }

  async getTodayAttendance(): Promise<AttendanceSession[]> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `attendance_today:${today}`;
    const cached = this.getCache<AttendanceSession[]>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('attendance_sessions')
        .select('*')
        .gte('sign_in_time', `${today}T00:00:00`)
        .lte('sign_in_time', `${today}T23:59:59`)
        .order('sign_in_time', { ascending: false });

      if (error) throw error;
      this.setCache(cacheKey, data || []);
      return (data || []) as AttendanceSession[];
    }, 'Get today attendance');
  }

  async markAbsent(userId: string, date?: string): Promise<AttendanceSession> {
    return this.withRetry(async () => {
      // Get user's company_id
      const { data: profile, error: profileError } = await this.client
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.company_id) {
        throw new Error('User company context not found');
      }

      const attendanceDate = date ? `${date}T09:00:00Z` : new Date().toISOString();

      const { data, error } = await this.client
        .from('attendance_sessions')
        .insert([{
          user_id: userId,
          company_id: profile.company_id,
          sign_in_time: attendanceDate,
          status: 'absent' as AttendanceStatus,
        }])
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`user_attendance:${userId}`);
      return data as AttendanceSession;
    }, `Mark absent ${userId}`);
  }

  async getAttendanceReport(startDate: string, endDate: string): Promise<any[]> {
    const cacheKey = `attendance_report:${startDate}:${endDate}`;
    const cached = this.getCache<any[]>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('attendance_sessions')
        .select('*')
        .gte('sign_in_time', `${startDate}T00:00:00`)
        .lte('sign_in_time', `${endDate}T23:59:59`)
        .order('sign_in_time', { ascending: false });

      if (error) throw error;
      this.setCache(cacheKey, data || []);
      return (data || []) as any[];
    }, `Get attendance report ${startDate} to ${endDate}`);
  }

  async updateAttendanceStatus(attendanceId: string, status: AttendanceStatus): Promise<AttendanceSession> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('attendance_sessions')
        .update({
          status,
        })
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`attendance:${attendanceId}`);
      return data as AttendanceSession;
    }, `Update attendance status ${attendanceId}`);
  }

  async bulkMarkAttendance(
    attendanceData: Array<{ userId: string; status: AttendanceStatus; date?: string }>
  ): Promise<AttendanceSession[]> {
    return this.withRetry(async () => {
      if (!attendanceData || attendanceData.length === 0) {
        return [];
      }

      // Get company_id from first user's profile
      const { data: profile, error: profileError } = await this.client
        .from('profiles')
        .select('company_id')
        .eq('id', attendanceData[0].userId)
        .single();

      if (profileError || !profile?.company_id) {
        throw new Error('User company context not found');
      }

      const today = new Date().toISOString();
      
      const records = attendanceData.map(item => {
        const dateTime = item.date ? `${item.date}T09:00:00Z` : today;
        return {
          user_id: item.userId,
          company_id: profile.company_id,
          sign_in_time: dateTime,
          status: item.status,
        };
      });

      const { data, error } = await this.client
        .from('attendance_sessions')
        .insert(records)
        .select();

      if (error) throw error;
      
      // Clear caches
      attendanceData.forEach(item => {
        this.clearCache(`user_attendance:${item.userId}`);
      });

      return (data || []) as AttendanceSession[];
    }, 'Bulk mark attendance');
  }
}

export const attendanceService = new AttendanceService();
