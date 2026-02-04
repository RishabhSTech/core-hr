import { useState } from 'react';
import { Settings, UserPlus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SuperAdminLayout from './SuperAdminLayout';
import { z } from 'zod';

const addSuperAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const SuperAdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = addSuperAdminSchema.safeParse({
      email: newAdminEmail,
      password: newAdminPassword,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      // First, create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdminEmail,
        password: newAdminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/super-admin`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Add to super_admins table
        const { error: saError } = await supabase
          .from('super_admins')
          .insert({
            user_id: authData.user.id,
            email: newAdminEmail,
          });

        if (saError) throw saError;

        // Add super_admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'super_admin',
          });

        if (roleError) {
          console.error('Role creation error:', roleError);
        }

        toast.success('Super admin added successfully');
        setNewAdminEmail('');
        setNewAdminPassword('');
      }
    } catch (err: any) {
      console.error('Failed to add super admin:', err);
      toast.error(err.message || 'Failed to add super admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure super admin settings</p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add Super Admin
              </CardTitle>
              <CardDescription>
                Create a new super admin account with full platform access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSuperAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Super Admin'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Settings
              </CardTitle>
              <CardDescription>
                Global platform configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Trial Period</p>
                  <p className="text-sm text-muted-foreground">
                    Default trial period for new companies
                  </p>
                </div>
                <span className="font-medium">14 days</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Default Plan</p>
                  <p className="text-sm text-muted-foreground">
                    Default plan for new registrations
                  </p>
                </div>
                <span className="font-medium">Free</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSettings;
