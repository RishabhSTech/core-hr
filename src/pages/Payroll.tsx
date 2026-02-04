import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Payroll as PayrollType, Profile } from '@/types/hrms';
import { DollarSign, TrendingUp, Calendar, Users, Calculator, CheckCircle } from 'lucide-react';
import { ProcessPayrollDialog } from '@/components/payroll/ProcessPayrollDialog';

export default function Payroll() {
  const { user, profile, isAdmin, role } = useAuth();
  const [payrolls, setPayrolls] = useState<PayrollType[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(`${new Date().getMonth() + 1}`);
  const [selectedYear, setSelectedYear] = useState<string>(`${new Date().getFullYear()}`);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Employees only see their own payroll
      const payrollQuery = isAdmin
        ? supabase.from('payroll').select('*').order('created_at', { ascending: false })
        : supabase.from('payroll').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

      const { data: payrollData } = await payrollQuery;
      if (payrollData) {
        setPayrolls(payrollData as PayrollType[]);
      }

      // Only admins can see all profiles for payroll overview
      if (isAdmin) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .order('first_name');
        if (profilesData) {
          setAllProfiles(profilesData as unknown as Profile[]);
        }
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getPayrollForEmployee = (userId: string) => {
    return payrolls.find(
      p => p.user_id === userId && p.month === parseInt(selectedMonth) && p.year === parseInt(selectedYear)
    );
  };

  const currentPayroll = payrolls.find(
    p => p.user_id === user?.id && p.month === parseInt(selectedMonth) && p.year === parseInt(selectedYear)
  );

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
      case 'processed':
        return <Badge className="bg-blue-100 text-blue-700">Processed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Pending</Badge>;
    }
  };

  const handleProcessPayroll = (emp: Profile) => {
    setSelectedEmployee(emp);
    setProcessDialogOpen(true);
  };

  // Calculate totals for admin view
  const totalSalaryBudget = allProfiles.reduce((sum, p) => sum + Number(p.monthly_salary || 0), 0);
  const processedCount = allProfiles.filter(emp => getPayrollForEmployee(emp.user_id)?.status === 'processed' || getPayrollForEmployee(emp.user_id)?.status === 'paid').length;
  const estimatedSalary = profile?.monthly_salary || 0;
  const perDaySalary = Number(estimatedSalary) / 30;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isAdmin ? 'Payroll Management' : 'My Payroll'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'Process and manage employee payroll' : 'View your salary and payroll details'}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, i) => (
                  <SelectItem key={month} value={`${i + 1}`}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={`${year}`}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isAdmin ? (
          // Admin View - Payroll Overview
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Monthly Budget</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        ₹{totalSalaryBudget.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Employees</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {allProfiles.length}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Processed</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {processedCount} / {allProfiles.length}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Salary</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        ₹{Math.round(totalSalaryBudget / Math.max(allProfiles.length, 1)).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Employee Payroll - {months[parseInt(selectedMonth) - 1]} {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : allProfiles.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No employees found</p>
                ) : (
                  <div className="space-y-3">
                    {allProfiles.map((emp) => {
                      const empPayroll = getPayrollForEmployee(emp.user_id);
                      return (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {emp.first_name?.[0]}{emp.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">
                                {emp.first_name} {emp.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{emp.employee_id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              {empPayroll ? (
                                <>
                                  <p className="font-semibold text-foreground">
                                    ₹{Number(empPayroll.net_salary || 0).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Base: ₹{Number(emp.monthly_salary || 0).toLocaleString()}
                                  </p>
                                </>
                              ) : (
                                <p className="font-semibold text-foreground">
                                  ₹{Number(emp.monthly_salary || 0).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="w-24 text-center">
                              {getStatusBadge(empPayroll?.status)}
                            </div>
                            {(role === 'owner' || role === 'admin') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProcessPayroll(emp)}
                              >
                                <Calculator className="h-4 w-4 mr-1" />
                                {empPayroll ? 'Edit' : 'Process'}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          // Non-admin view - Show message that payroll is managed by admins
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Payroll Management</h3>
                <p className="text-muted-foreground">
                  Payroll information is managed by administrators. Please contact your HR department for payroll queries.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedEmployee && (
        <ProcessPayrollDialog
          open={processDialogOpen}
          onOpenChange={setProcessDialogOpen}
          employee={selectedEmployee}
          month={parseInt(selectedMonth)}
          year={parseInt(selectedYear)}
          onSuccess={fetchData}
        />
      )}
    </AppLayout>
  );
}