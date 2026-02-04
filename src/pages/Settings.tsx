import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Settings2, Shield, Clock, Plus, Trash2, Calculator } from 'lucide-react';
import { HolidayCalendar } from '@/components/settings/HolidayCalendar';
import { z } from 'zod';

// Validation schema for work sessions
const sessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').max(50, 'Session name must be less than 50 characters'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid start time format'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid end time format'),
}).refine(
  (data) => data.start_time < data.end_time,
  { message: 'End time must be after start time' }
);

interface PayrollConfig {
  pf_enabled: boolean;
  pf_percentage: number;
  esic_enabled: boolean;
  esic_percentage: number;
  epf_enabled: boolean;
  epf_percentage: number;
  pt_enabled: boolean;
  pt_amount: number;
}

interface WorkSession {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function Settings() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [newSession, setNewSession] = useState({ name: '', start_time: '09:00', end_time: '18:00' });
  const [config, setConfig] = useState<PayrollConfig>({
    pf_enabled: false,
    pf_percentage: 12,
    esic_enabled: false,
    esic_percentage: 0.75,
    epf_enabled: false,
    epf_percentage: 12,
    pt_enabled: false,
    pt_amount: 200,
  });

  useEffect(() => {
    fetchSettings();
    fetchWorkSessions();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .eq('setting_key', 'payroll_config')
        .maybeSingle();

      if (data?.setting_value) {
        setConfig(prev => ({ ...prev, ...(data.setting_value as unknown as PayrollConfig) }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkSessions = async () => {
    const { data } = await supabase
      .from('work_sessions')
      .select('*')
      .order('start_time');
    if (data) setWorkSessions(data);
  };

  const handleAddSession = async () => {
    // Validate with Zod schema
    const validation = sessionSchema.safeParse(newSession);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const { error } = await supabase.from('work_sessions').insert([{
      name: newSession.name.trim(),
      start_time: newSession.start_time,
      end_time: newSession.end_time,
    }]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Session added');
      setNewSession({ name: '', start_time: '09:00', end_time: '18:00' });
      fetchWorkSessions();
    }
  };

  const handleDeleteSession = async (id: string) => {
    const { error } = await supabase.from('work_sessions').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Session deleted');
      fetchWorkSessions();
    }
  };

  const handleSave = async () => {
    if (role !== 'owner' && role !== 'admin') {
      toast.error('Only owners and admins can modify settings');
      return;
    }

    setSaving(true);
    try {
      // Check if setting exists
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .eq('setting_key', 'payroll_config')
        .maybeSingle();

      const jsonValue = JSON.parse(JSON.stringify(config));

      if (existing) {
        const { error } = await supabase
          .from('company_settings')
          .update({
            setting_value: jsonValue,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', 'payroll_config');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_settings')
          .insert([{
            setting_key: 'payroll_config',
            setting_value: jsonValue,
          }]);
        if (error) throw error;
      }
      
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Calculate preview values
  const baseSalary = 50000;
  const pfAmount = config.pf_enabled ? baseSalary * config.pf_percentage / 100 : 0;
  const esicAmount = config.esic_enabled ? baseSalary * config.esic_percentage / 100 : 0;
  const ptAmount = config.pt_enabled ? config.pt_amount : 0;
  const totalDeductions = pfAmount + esicAmount + ptAmount;
  const netSalary = baseSalary - totalDeductions;

  if (role !== 'owner' && role !== 'admin') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Access Restricted</h2>
            <p className="text-muted-foreground mt-2">Only owners and admins can access settings</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Settings</h1>
          <p className="text-muted-foreground mt-1">Configure work sessions, payroll deductions and company policies</p>
        </div>

        {/* Work Sessions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Work Sessions
            </CardTitle>
            <CardDescription>
              Define work sessions that employees can select when marking attendance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {workSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/30">
                  <div>
                    <p className="font-medium text-foreground">{session.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSession(session.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {workSessions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No work sessions defined yet</p>
              )}
            </div>
            <div className="pt-4 border-t border-border">
              <Label className="text-sm font-medium mb-3 block">Add New Session</Label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input
                  placeholder="Session name"
                  value={newSession.name}
                  onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))}
                  className="sm:col-span-2"
                />
                <Input
                  type="time"
                  value={newSession.start_time}
                  onChange={(e) => setNewSession(prev => ({ ...prev, start_time: e.target.value }))}
                />
                <Input
                  type="time"
                  value={newSession.end_time}
                  onChange={(e) => setNewSession(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
              <Button onClick={handleAddSession} className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Statutory Deductions
            </CardTitle>
            <CardDescription>
              Configure PF, ESIC, PT and other deductions. These will be automatically calculated during payroll processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <>
                {/* PF Configuration */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-accent/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={config.pf_enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, pf_enabled: checked }))}
                      />
                      <Label className="text-base font-medium">Provident Fund (PF)</Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Employee contribution towards PF</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={config.pf_percentage}
                      onChange={(e) => setConfig(prev => ({ ...prev, pf_percentage: parseFloat(e.target.value) || 0 }))}
                      className="w-20 text-right"
                      disabled={!config.pf_enabled}
                      step="0.01"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                {/* ESIC Configuration */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-accent/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={config.esic_enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, esic_enabled: checked }))}
                      />
                      <Label className="text-base font-medium">ESIC</Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Employee State Insurance contribution</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={config.esic_percentage}
                      onChange={(e) => setConfig(prev => ({ ...prev, esic_percentage: parseFloat(e.target.value) || 0 }))}
                      className="w-20 text-right"
                      disabled={!config.esic_enabled}
                      step="0.01"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                {/* PT Configuration */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-accent/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={config.pt_enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, pt_enabled: checked }))}
                      />
                      <Label className="text-base font-medium">Professional Tax (PT)</Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">State-level professional tax deduction</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={config.pt_amount}
                      onChange={(e) => setConfig(prev => ({ ...prev, pt_amount: parseFloat(e.target.value) || 0 }))}
                      className="w-24 text-right"
                      disabled={!config.pt_enabled}
                    />
                  </div>
                </div>

                {/* EPF Configuration */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-accent/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={config.epf_enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, epf_enabled: checked }))}
                      />
                      <Label className="text-base font-medium">EPF (Employer)</Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Employer contribution to Provident Fund</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={config.epf_percentage}
                      onChange={(e) => setConfig(prev => ({ ...prev, epf_percentage: parseFloat(e.target.value) || 0 }))}
                      className="w-20 text-right"
                      disabled={!config.epf_enabled}
                      step="0.01"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Calculation Preview
            </CardTitle>
            <CardDescription>
              Example calculation for ₹50,000 base salary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Base Salary</span>
                <span className="font-medium">₹{baseSalary.toLocaleString()}</span>
              </div>
              {config.pf_enabled && (
                <div className="flex justify-between py-2 border-b border-border text-destructive">
                  <span>PF Deduction ({config.pf_percentage}%)</span>
                  <span>- ₹{Math.round(pfAmount).toLocaleString()}</span>
                </div>
              )}
              {config.esic_enabled && (
                <div className="flex justify-between py-2 border-b border-border text-destructive">
                  <span>ESIC Deduction ({config.esic_percentage}%)</span>
                  <span>- ₹{Math.round(esicAmount).toLocaleString()}</span>
                </div>
              )}
              {config.pt_enabled && (
                <div className="flex justify-between py-2 border-b border-border text-destructive">
                  <span>Professional Tax</span>
                  <span>- ₹{config.pt_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-3 font-semibold text-base bg-accent/50 rounded-lg px-3 -mx-3">
                <span>Net Salary</span>
                <span className="text-green-600">
                  ₹{Math.round(netSalary).toLocaleString()}
                </span>
              </div>
              {config.epf_enabled && (
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Employer EPF Contribution:</strong> ₹{Math.round(baseSalary * config.epf_percentage / 100).toLocaleString()} (not deducted from employee salary)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Holiday Calendar */}
        <HolidayCalendar />
      </div>
    </AppLayout>
  );
}
