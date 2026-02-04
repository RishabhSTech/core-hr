import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from '@/types/hrms';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  currentRole: string;
  onSuccess: () => void;
}

interface Department {
  id: string;
  name: string;
}

interface Manager {
  id: string;
  first_name: string;
  last_name: string;
  user_id: string;
}

export function EditEmployeeDialog({ open, onOpenChange, profile, currentRole, onSuccess }: EditEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [formData, setFormData] = useState({
    department_id: 'none',
    reporting_manager_id: 'none',
    monthly_salary: '',
    role: 'employee' as AppRole,
  });

  useEffect(() => {
    if (open && profile) {
      setFormData({
        department_id: profile.department_id || 'none',
        reporting_manager_id: profile.reporting_manager_id || 'none',
        monthly_salary: String(profile.monthly_salary || 0),
        role: currentRole as AppRole,
      });
      fetchDepartmentsAndManagers();
    }
  }, [open, profile, currentRole]);

  const fetchDepartmentsAndManagers = async () => {
    const [deptRes, managerRes] = await Promise.all([
      supabase.from('departments').select('id, name').order('name'),
      supabase.from('profiles').select('id, first_name, last_name, user_id').order('first_name'),
    ]);

    if (deptRes.data) setDepartments(deptRes.data);
    if (managerRes.data) setManagers(managerRes.data.filter(m => m.id !== profile?.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          department_id: formData.department_id === 'none' ? null : formData.department_id,
          reporting_manager_id: formData.reporting_manager_id === 'none' ? null : formData.reporting_manager_id,
          monthly_salary: parseFloat(formData.monthly_salary) || 0,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: formData.role })
        .eq('user_id', profile.user_id);

      if (roleError) throw roleError;

      toast.success('Employee updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>Update employee details and role assignment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={formData.department_id} onValueChange={(v) => setFormData(prev => ({ ...prev, department_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reporting Manager</Label>
            <Select value={formData.reporting_manager_id} onValueChange={(v) => setFormData(prev => ({ ...prev, reporting_manager_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {managers.map((mgr) => (
                  <SelectItem key={mgr.id} value={mgr.id}>
                    {mgr.first_name} {mgr.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Monthly Salary (₹)</Label>
            <Input
              type="number"
              value={formData.monthly_salary}
              onChange={(e) => setFormData(prev => ({ ...prev, monthly_salary: e.target.value }))}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={formData.role} onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as AppRole }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}