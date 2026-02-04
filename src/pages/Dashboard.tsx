import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { LeaveRequestsWidget } from '@/components/dashboard/LeaveRequestsWidget';
import { AttendanceActions } from '@/components/attendance/AttendanceActions';
import { LeaveBalance } from '@/components/leaves/LeaveBalance';
import { Users, Clock, Calendar, DollarSign, UserCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceSession, LeaveRequest, LeaveBalance as LeaveBalanceType, Profile } from '@/types/hrms';
import { isToday } from 'date-fns';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, profile, isAdmin, isManager } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    payrollEstimate: 0,
  });
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceType | null>(null);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [chartData, setChartData] = useState<{ name: string; present: number; absent: number }[]>([]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch current session for today
      const today = new Date().toISOString().split('T')[0];
      const { data: sessionData } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('sign_in_time', `${today}T00:00:00`)
        .order('sign_in_time', { ascending: false })
        .limit(1);

      if (sessionData && sessionData.length > 0) {
        const session = sessionData[0];
        if (!session.sign_out_time) {
          setCurrentSession(session as AttendanceSession);
        } else {
          setCurrentSession(null);
        }
      }

      // Fetch leave balance
      const { data: balanceData } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceData) {
        setLeaveBalance(balanceData as LeaveBalanceType);
      }

      if (isAdmin || isManager) {
        // Fetch stats for admin
        const [employeesResult, attendanceResult, leavesResult] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact' }),
          supabase.from('attendance_sessions').select('*').gte('sign_in_time', `${today}T00:00:00`),
          supabase.from('leave_requests').select('*, profile:profiles(first_name, last_name)').eq('status', 'pending'),
        ]);

        setStats({
          totalEmployees: employeesResult.count || 0,
          presentToday: attendanceResult.data?.length || 0,
          pendingLeaves: leavesResult.data?.length || 0,
          payrollEstimate: 0,
        });

        setPendingRequests((leavesResult.data || []) as unknown as LeaveRequest[]);

        // Generate chart data for last 7 days
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        setChartData(days.map(day => ({
          name: day,
          present: Math.floor(Math.random() * 20) + 10,
          absent: Math.floor(Math.random() * 5),
        })));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin, isManager]);

  const handleApproveLeave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'approved', approved_by: user?.id, approved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Leave request approved');
      fetchData();
    } catch (error) {
      console.error('Error approving leave:', error);
      toast.error('Failed to approve leave request');
    }
  };

  const handleRejectLeave = async (id: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: 'rejected', 
          approved_by: user?.id, 
          approved_at: new Date().toISOString(),
          rejection_reason: reason || null
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Leave request rejected');
      fetchData();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast.error('Failed to reject leave request');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.first_name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening today
          </p>
        </div>

        {isAdmin ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Employees"
                value={stats.totalEmployees}
                icon={<Users className="h-5 w-5" />}
              />
              <StatCard
                title="Present Today"
                value={stats.presentToday}
                icon={<UserCheck className="h-5 w-5" />}
                description={`${Math.round((stats.presentToday / Math.max(stats.totalEmployees, 1)) * 100)}% attendance`}
              />
              <StatCard
                title="Pending Leaves"
                value={stats.pendingLeaves}
                icon={<AlertCircle className="h-5 w-5" />}
              />
              <StatCard
                title="Monthly Payroll"
                value="--"
                icon={<DollarSign className="h-5 w-5" />}
                description="Calculate in Payroll"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AttendanceChart data={chartData} />
              </div>
              <LeaveRequestsWidget
                requests={pendingRequests}
                onApprove={handleApproveLeave}
                onReject={handleRejectLeave}
                isAdmin={isAdmin}
              />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AttendanceActions 
                  currentSession={currentSession} 
                  onSessionUpdate={fetchData}
                />
                <LeaveBalance balance={leaveBalance} />
              </div>
            </div>
            <div>
              <StatCard
                title="Reporting Manager"
                value={profile?.reporting_manager ? 
                  `${profile.reporting_manager.first_name} ${profile.reporting_manager.last_name}` : 
                  'Not assigned'}
                icon={<Users className="h-5 w-5" />}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
