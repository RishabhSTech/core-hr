import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { LeaveRequestsWidget } from '@/components/dashboard/LeaveRequestsWidget';
import { AttendanceActions } from '@/components/attendance/AttendanceActions';
import { LeaveBalance } from '@/components/leaves/LeaveBalance';
import { Users, Clock, Calendar, DollarSign, UserCheck, AlertCircle } from 'lucide-react';
import { useDashboardMetrics, useLeaveAnalytics } from '@/hooks/useAnalytics';
import { useUserAttendance, useTodayAttendance } from '@/hooks/useAttendance';
import { useLeaveBalance, usePendingLeaveRequests } from '@/hooks/useLeaves';
import { AttendanceSession, LeaveRequest, LeaveBalance as LeaveBalanceType } from '@/types/hrms';
import { toast } from 'sonner';
import { Skeleton, CardSkeleton } from '@/components/Skeleton';
import QueryErrorHandler from '@/components/QueryErrorHandler';

export default function Dashboard() {
  const { user, profile, isAdmin, isManager } = useAuth();
  const { company } = useCompany();
  const [errorState, setErrorState] = useState<Error | null>(null);

  // Fetch dashboard metrics with caching
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useDashboardMetrics(company?.id || null);
  
  // Fetch today's attendance for live updates
  const { data: todayAttendance, isLoading: attendanceLoading } = useTodayAttendance();
  
  // Fetch user's leave balance
  const { data: leaveBalance, isLoading: leaveBalanceLoading } = useLeaveBalance(user?.id || null);
  
  // Fetch pending leave requests (for managers)
  const { data: pendingLeaves, isLoading: pendingLoading } = usePendingLeaveRequests();
  
  // Fetch user's attendance history
  const { data: userAttendance } = useUserAttendance(user?.id || null, 30);

  // Get current session from user's attendance
  const currentSession = userAttendance?.[0] || null;

  useEffect(() => {
    if (metricsError) setErrorState(metricsError as Error);
  }, [metricsError]);

  const renderStatCards = () => {
    if (metricsLoading) {
      return (
        <>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </>
      );
    }

    return (
      <>
        <StatCard
          title="Total Employees"
          value={metrics?.totalEmployees || 0}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Present Today"
          value={metrics?.presentToday || 0}
          icon={<UserCheck className="h-5 w-5" />}
          description={`${metrics?.attendanceRate || 0}% attendance rate`}
        />
        <StatCard
          title="Pending Leaves"
          value={metrics?.pendingLeaves || 0}
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Monthly Payroll"
          value={`$${(metrics?.payrollEstimate || 0).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.first_name || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening today
          </p>
        </div>

        <QueryErrorHandler 
          error={errorState} 
          onDismiss={() => setErrorState(null)}
        />

        {isAdmin ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderStatCards()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {metricsLoading ? <CardSkeleton /> : (
                  <AttendanceChart 
                    data={Object.entries(metrics?.departmentCounts || {}).map(([name, count]) => ({
                      name,
                      present: count as number,
                      absent: 0
                    }))}
                  />
                )}
              </div>
              <LeaveRequestsWidget
                requests={pendingLeaves || []}
                isLoading={pendingLoading}
                isAdmin={isAdmin}
              />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AttendanceActions 
                  currentSession={currentSession as AttendanceSession | null | undefined} 
                />
                {leaveBalanceLoading ? <CardSkeleton /> : (
                  <LeaveBalance balance={leaveBalance} />
                )}
              </div>
            </div>
            <div>
              {metricsLoading ? <CardSkeleton /> : (
                <StatCard
                  title="Reporting Manager"
                  value={profile?.reporting_manager ? 
                    `${profile.reporting_manager.first_name} ${profile.reporting_manager.last_name}` : 
                    'Not assigned'}
                  icon={<Users className="h-5 w-5" />}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
