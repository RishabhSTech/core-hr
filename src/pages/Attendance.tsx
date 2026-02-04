import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';
import { AttendanceActions } from '@/components/attendance/AttendanceActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceSession } from '@/types/hrms';
import { startOfMonth, endOfMonth, format, isSameDay } from 'date-fns';

export default function Attendance() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    presentDays: 0,
    absentDays: 0,
    halfDays: 0,
    totalHours: 0,
  });

  const fetchAttendance = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      const { data } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('sign_in_time', `${monthStart}T00:00:00`)
        .lte('sign_in_time', `${monthEnd}T23:59:59`)
        .order('sign_in_time', { ascending: false });

      if (data) {
        setSessions(data as AttendanceSession[]);
        
        // Check for current session
        const todaySession = data.find((s) =>
          isSameDay(new Date(s.sign_in_time), now) && !s.sign_out_time
        );
        setCurrentSession(todaySession as AttendanceSession | null);

        // Calculate stats
        const presentCount = data.filter(s => s.status === 'present').length;
        const halfDayCount = data.filter(s => s.status === 'half_day').length;
        const lateCount = data.filter(s => s.status === 'late').length;
        
        let totalHours = 0;
        data.forEach(s => {
          if (s.sign_out_time) {
            const start = new Date(s.sign_in_time);
            const end = new Date(s.sign_out_time);
            totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }
        });

        setStats({
          presentDays: presentCount + lateCount,
          absentDays: 0,
          halfDays: halfDayCount,
          totalHours: Math.round(totalHours * 10) / 10,
        });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">
            Track your daily attendance and working hours
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AttendanceCalendar sessions={sessions} />
          </div>
          
          <div className="space-y-6">
            <AttendanceActions 
              currentSession={currentSession} 
              onSessionUpdate={fetchAttendance}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Present Days</span>
                    <span className="font-medium text-foreground">{stats.presentDays}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Half Days</span>
                    <span className="font-medium text-foreground">{stats.halfDays}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Hours</span>
                    <span className="font-medium text-foreground">{stats.totalHours}h</span>
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
