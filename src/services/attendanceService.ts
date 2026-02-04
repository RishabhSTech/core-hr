// src/services/attendanceService.ts
import { BaseService, PaginationParams } from './baseService';
import { AttendanceSession, AttendanceStatus } from '@/types/hrms';

class AttendanceService extends BaseService {
  async getAttendance(filters: PaginationParams = {}): Promise<any> {
    return this.fetchPaginated<AttendanceSession>('attendance_sessions', filters);
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
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already signed in today
      const { data: existing } = await this.client
        .from('attendance_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (existing) {
        throw new Error('Already signed in today');
      }

      const { data, error } = await this.client
        .from('attendance_sessions')
        .insert([{
          user_id: userId,
          date: today,
          sign_in_time: new Date().toISOString(),
          sign_in_lat: lat,
          sign_in_lng: lng,
          status: 'present',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
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
          sign_out_lat: lat,
          sign_out_lng: lng,
          updated_at: new Date().toISOString(),
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
        .order('date', { ascending: false })
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
        .eq('date', today)
        .order('sign_in_time', { ascending: false });

      if (error) throw error;
      this.setCache(cacheKey, data || []);
      return (data || []) as AttendanceSession[];
    }, 'Get today attendance');
  }

  async markAbsent(userId: string, date?: string): Promise<AttendanceSession> {
    const attendanceDate = date || new Date().toISOString().split('T')[0];

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('attendance_sessions')
        .insert([{
          user_id: userId,
          date: attendanceDate,
          status: 'absent' as AttendanceStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

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
          updated_at: new Date().toISOString(),
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
      const today = new Date().toISOString().split('T')[0];
      
      const records = attendanceData.map(item => ({
        user_id: item.userId,
        date: item.date || today,
        status: item.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

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
