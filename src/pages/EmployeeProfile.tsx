import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, CreditCard, User, Pencil, CalendarPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/hrms';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { EditEmployeeDialog } from '@/components/employees/EditEmployeeDialog';
import { AddAttendanceDialog } from '@/components/employees/AddAttendanceDialog';

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, role: currentUserRole } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string>('employee');
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);

  const fetchProfile = async () => {
    if (!id) return;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, department:departments(*)')
        .eq('id', id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as unknown as Profile);
        
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profileData.user_id)
          .maybeSingle();
        
        if (roleData) {
          setRole(roleData.role);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Employee not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  const getInitials = () => {
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  };

  const getRoleBadge = () => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-700',
      admin: 'bg-blue-100 text-blue-700',
      manager: 'bg-green-100 text-green-700',
      employee: 'bg-gray-100 text-gray-700',
    };
    return colors[role] || colors.employee;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {isAdmin && (
            <div className="flex gap-2">
              {currentUserRole === 'owner' && (
                <Button variant="outline" onClick={() => setAttendanceDialogOpen(true)}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add Attendance
                </Button>
              )}
              <Button onClick={() => setEditDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Employee
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-foreground">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-muted-foreground">{profile.employee_id}</p>
                <Badge className={`mt-2 ${getRoleBadge()}`}>{role}</Badge>
                
                <Separator className="my-6" />
                
                <div className="w-full space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{profile.phone}</span>
                    </div>
                  )}
                  {profile.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{profile.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  Employment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium text-foreground">
                      {profile.department?.name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reporting Manager</p>
                    <p className="font-medium text-foreground">
                      {profile.reporting_manager 
                        ? `${profile.reporting_manager.first_name} ${profile.reporting_manager.last_name}`
                        : 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Joining</p>
                    <p className="font-medium text-foreground">
                      {profile.date_of_joining 
                        ? format(new Date(profile.date_of_joining), 'MMMM d, yyyy')
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium text-foreground capitalize">{role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Bank Name</p>
                    <p className="font-medium text-foreground">
                      {profile.bank_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium text-foreground">
                      {profile.bank_account_number 
                        ? `****${profile.bank_account_number.slice(-4)}`
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">IFSC Code</p>
                    <p className="font-medium text-foreground">
                      {profile.bank_ifsc || 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Payroll Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Salary</p>
                    <p className="font-medium text-foreground">
                      ₹{Number(profile.monthly_salary || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Salary Type</p>
                    <p className="font-medium text-foreground capitalize">
                      {profile.salary_type || 'Fixed'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EditEmployeeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        currentRole={role}
        onSuccess={fetchProfile}
      />

      {profile && (
        <AddAttendanceDialog
          open={attendanceDialogOpen}
          onOpenChange={setAttendanceDialogOpen}
          userId={profile.user_id}
          employeeName={`${profile.first_name} ${profile.last_name}`}
          onSuccess={fetchProfile}
        />
      )}
    </AppLayout>
  );
}
