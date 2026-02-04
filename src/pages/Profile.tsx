import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Building2, Calendar, CreditCard, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Profile() {
  const { profile, role, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    phone: profile?.phone || '',
    address: profile?.address || '',
  });

  if (!profile) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
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
    return colors[role || 'employee'] || colors.employee;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone || null,
          address: formData.address || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            View and update your profile information
          </p>
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
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {profile.phone || 'Not provided'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {profile.address || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <Button 
                  variant={editing ? "default" : "outline"} 
                  size="sm"
                  onClick={() => editing ? handleSave() : setEditing(true)}
                  disabled={saving}
                >
                  {editing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </>
                  ) : (
                    'Edit'
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input value={profile.first_name} disabled />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input value={profile.last_name} disabled />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={profile.email} disabled />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editing}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!editing}
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-medium text-foreground">{profile.employee_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium text-foreground">
                      {profile.department?.name || 'Not assigned'}
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
                    <p className="text-sm text-muted-foreground">Reporting Manager</p>
                    <p className="font-medium text-foreground">
                      {profile.reporting_manager 
                        ? `${profile.reporting_manager.first_name} ${profile.reporting_manager.last_name}`
                        : 'Not assigned'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  Salary Information
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
    </AppLayout>
  );
}
