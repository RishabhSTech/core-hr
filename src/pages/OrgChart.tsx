import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { OrgChartNode } from '@/components/orgchart/OrgChartNode';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Profile, UserRole } from '@/types/hrms';

export default function OrgChart() {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profilesResult, rolesResult] = await Promise.all([
          supabase.from('profiles').select('*, department:departments(*)'),
          supabase.from('user_roles').select('*'),
        ]);

        if (profilesResult.data) {
          setProfiles(profilesResult.data as unknown as Profile[]);
        }

        if (rolesResult.data) {
          const rolesMap: Record<string, string> = {};
          rolesResult.data.forEach((r: UserRole) => {
            rolesMap[r.user_id] = r.role;
          });
          setRoles(rolesMap);
        }
      } catch (error) {
        console.error('Error fetching org data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Build hierarchy
  const owner = profiles.find(p => roles[p.user_id] === 'owner');
  const admins = profiles.filter(p => roles[p.user_id] === 'admin');
  const managers = profiles.filter(p => roles[p.user_id] === 'manager');
  const employees = profiles.filter(p => roles[p.user_id] === 'employee');

  const getReportees = (managerId: string) => {
    return profiles.filter(p => p.reporting_manager_id === managerId);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organization Chart</h1>
          <p className="text-muted-foreground mt-1">
            Visual hierarchy of your organization
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <Card>
            <CardContent className="p-8 overflow-x-auto">
              <div className="flex flex-col items-center min-w-max">
                {owner && (
                  <div className="flex flex-col items-center">
                    <OrgChartNode 
                      profile={owner} 
                      role="owner" 
                      roles={roles}
                      isClickable={isAdmin}
                    />
                    
                    {(admins.length > 0 || managers.length > 0) && (
                      <>
                        <div className="w-px h-8 bg-border" />
                        <div className="flex gap-8">
                          {admins.map(admin => (
                            <div key={admin.id} className="flex flex-col items-center">
                              <div className="w-px h-4 bg-border" />
                              <OrgChartNode 
                                profile={admin} 
                                role="admin"
                                children={getReportees(admin.id)}
                                roles={roles}
                                isClickable={isAdmin}
                              />
                            </div>
                          ))}
                          {managers.map(manager => (
                            <div key={manager.id} className="flex flex-col items-center">
                              <div className="w-px h-4 bg-border" />
                              <OrgChartNode 
                                profile={manager} 
                                role="manager"
                                children={getReportees(manager.id)}
                                roles={roles}
                                isClickable={isAdmin}
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {employees.length > 0 && managers.length === 0 && admins.length === 0 && (
                      <>
                        <div className="w-px h-8 bg-border" />
                        <div className="flex gap-4 flex-wrap justify-center max-w-4xl">
                          {employees.map(emp => (
                            <div key={emp.id} className="flex flex-col items-center">
                              <div className="w-px h-4 bg-border" />
                              <OrgChartNode 
                                profile={emp} 
                                role="employee"
                                roles={roles}
                                isClickable={isAdmin}
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {!owner && profiles.length > 0 && (
                  <div className="flex gap-4 flex-wrap justify-center">
                    {profiles.map(p => (
                      <OrgChartNode 
                        key={p.id}
                        profile={p} 
                        role={roles[p.user_id] || 'employee'}
                        roles={roles}
                        isClickable={isAdmin}
                      />
                    ))}
                  </div>
                )}

                {profiles.length === 0 && (
                  <p className="text-muted-foreground text-center py-12">
                    No employees in the organization yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
