// src/services/settingsService.ts
import { BaseService, PaginationParams } from './baseService';

interface CompanySettings {
  id: string;
  company_id: string;
  timezone?: string;
  currency?: string;
  financial_year_start?: string;
  working_days?: string[];
  office_hours_start?: string;
  office_hours_end?: string;
  geofencing_enabled?: boolean;
  geofence_radius?: number;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  created_at: string;
  updated_at: string;
}

interface Holiday {
  id: string;
  company_id: string;
  name: string;
  date: string;
  is_optional?: boolean;
  created_at: string;
  updated_at: string;
}

class SettingsService extends BaseService {
  async getCompanySettings(companyId: string): Promise<CompanySettings> {
    const cacheKey = `company_settings:${companyId}`;
    const cached = this.getCache<CompanySettings>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('company_settings')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        return this.createCompanySettings(companyId);
      }

      this.setCache(cacheKey, data);
      return data as CompanySettings;
    }, `Get company settings ${companyId}`);
  }

  async updateCompanySettings(companyId: string, settings: Partial<CompanySettings>): Promise<CompanySettings> {
    return this.withRetry(async () => {
      const existing = await this.getCompanySettings(companyId);

      const { data, error } = await this.client
        .from('company_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`company_settings:${companyId}`);
      return data as CompanySettings;
    }, `Update company settings ${companyId}`);
  }

  async createCompanySettings(companyId: string): Promise<CompanySettings> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('company_settings')
        .insert([{
          company_id: companyId,
          timezone: 'UTC',
          currency: 'USD',
          financial_year_start: '01-01',
          working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          office_hours_start: '09:00',
          office_hours_end: '18:00',
          geofencing_enabled: false,
          geofence_radius: 500,
          email_notifications: true,
          sms_notifications: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data as CompanySettings;
    }, `Create company settings ${companyId}`);
  }

  async getHolidays(companyId: string): Promise<Holiday[]> {
    const cacheKey = `holidays:${companyId}`;
    const cached = this.getCache<Holiday[]>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('holidays')
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: true });

      if (error) throw error;
      this.setCache(cacheKey, data || []);
      return (data || []) as Holiday[];
    }, `Get holidays ${companyId}`);
  }

  async addHoliday(companyId: string, holiday: Omit<Holiday, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<Holiday> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('holidays')
        .insert([{
          company_id: companyId,
          ...holiday,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`holidays:${companyId}`);
      return data as Holiday;
    }, `Add holiday ${holiday.name}`);
  }

  async updateHoliday(holidayId: string, companyId: string, updates: Partial<Holiday>): Promise<Holiday> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('holidays')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', holidayId)
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`holidays:${companyId}`);
      return data as Holiday;
    }, `Update holiday ${holidayId}`);
  }

  async deleteHoliday(holidayId: string, companyId: string): Promise<void> {
    return this.withRetry(async () => {
      const { error } = await this.client
        .from('holidays')
        .delete()
        .eq('id', holidayId);

      if (error) throw error;
      this.clearCache(`holidays:${companyId}`);
    }, `Delete holiday ${holidayId}`);
  }

  async getDepartments(companyId: string): Promise<any[]> {
    const cacheKey = `departments:${companyId}`;
    const cached = this.getCache<any[]>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) throw error;
      this.setCache(cacheKey, data || []);
      return (data || []) as any[];
    }, `Get departments ${companyId}`);
  }

  async addDepartment(companyId: string, name: string, description?: string): Promise<any> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('departments')
        .insert([{
          company_id: companyId,
          name,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`departments:${companyId}`);
      return data;
    }, `Add department ${name}`);
  }

  async updateDepartment(departmentId: string, companyId: string, updates: any): Promise<any> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('departments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', departmentId)
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`departments:${companyId}`);
      return data;
    }, `Update department ${departmentId}`);
  }

  async deleteDepartment(departmentId: string, companyId: string): Promise<void> {
    return this.withRetry(async () => {
      const { error } = await this.client
        .from('departments')
        .delete()
        .eq('id', departmentId);

      if (error) throw error;
      this.clearCache(`departments:${companyId}`);
    }, `Delete department ${departmentId}`);
  }
}

export const settingsService = new SettingsService();
