import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { usePayroll, useProcessPayroll } from '@/hooks/usePayroll';
import { useEmployees } from '@/hooks/useEmployees';
import { DollarSign, TrendingUp, Calendar, Users, Calculator, CheckCircle, AlertCircle } from 'lucide-react';
import { ProcessPayrollDialog } from '@/components/payroll/ProcessPayrollDialog';
import { QueryErrorHandler } from '@/components/QueryErrorHandler';
import { TableSkeleton, CardSkeleton } from '@/components/Skeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useState, useMemo as useMemoState } from 'react';

export default function Payroll() {
  const { user, profile, isAdmin } = useAuth();
  const { company } = useCompany();
  const [selectedMonth, setSelectedMonth] = useState<string>(`${new Date().getMonth() + 1}`);
  const [selectedYear, setSelectedYear] = useState<string>(`${new Date().getFullYear()}`);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);

  // Fetch payroll data
  const { data: payrollData, isLoading: payrollLoading, error: payrollError, refetch } = usePayroll({
    companyId: company?.id,
    month: parseInt(selectedMonth),
    year: parseInt(selectedYear),
    limit: 100
  });

  // Fetch all employees for this company
  const { data: employeesData, isLoading: employeesLoading } = useEmployees({ 
    companyId: company?.id,
    pageSize: 100 
  });

  // Calculate metrics efficiently
  const metrics = useMemoState(() => {
    if (!employeesData?.data) {
      return { totalBudget: 0, processedCount: 0, avgSalary: 0, totalPayroll: 0 };
    }

    const employees = employeesData.data;
    const payrolls = payrollData?.data || [];

    const totalBudget = employees.reduce((sum, emp) => sum + Number(emp.monthly_salary || 0), 0);
    const processedCount = payrolls.filter(p => p.status === 'processed' || p.status === 'paid').length;
    const avgSalary = employees.length > 0 ? Math.round(totalBudget / employees.length) : 0;
    const totalPayroll = payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);

    return { totalBudget, processedCount, avgSalary, totalPayroll };
  }, [employeesData?.data, payrollData?.data]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getPayrollForEmployee = (userId: string) => {
    return (payrollData?.data || []).find(p => p.user_id === userId);
  };

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

  const isLoading = payrollLoading || employeesLoading;

  if (!isAdmin) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Payroll Management</h3>
              <p className="text-muted-foreground">
                Payroll information is managed by administrators. Contact HR for details.
              </p>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <ErrorBoundary>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Payroll Management</h1>
              <p className="text-muted-foreground mt-1">Process and manage employee payroll</p>
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

          {/* Error Handler */}
          <QueryErrorHandler error={payrollError} onRetry={refetch} />

          {/* Metrics Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Monthly Budget</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        ₹{metrics.totalBudget.toLocaleString()}
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
                        {employeesData?.data?.length || 0}
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
                        {metrics.processedCount} / {employeesData?.data?.length || 0}
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
                        ₹{metrics.avgSalary.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payroll List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Employee Payroll - {months[parseInt(selectedMonth) - 1]} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton rows={5} />
              ) : (employeesData?.data?.length || 0) === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No employees found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {employeesData?.data?.map((emp) => {
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setProcessDialogOpen(true);
                            }}
                          >
                            <Calculator className="h-4 w-4 mr-1" />
                            {empPayroll ? 'Edit' : 'Process'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedEmployee && (
          <ProcessPayrollDialog
            open={processDialogOpen}
            onOpenChange={setProcessDialogOpen}
            employee={selectedEmployee}
            month={parseInt(selectedMonth)}
            year={parseInt(selectedYear)}
            onSuccess={refetch}
          />
        )}
      </AppLayout>
    </ErrorBoundary>
  );
}