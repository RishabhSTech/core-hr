import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, Clock, Timer, Zap } from 'lucide-react';
import { AttendanceSession } from '@/types/hrms';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSignIn, useSignOut } from '@/hooks/useAttendance';

interface AttendanceActionsProps {
  currentSession: AttendanceSession | null;
  onSessionUpdate: () => void;
}

export function AttendanceActions({ currentSession, onSessionUpdate }: AttendanceActionsProps) {
  const { user } = useAuth();
  const [elapsedTime, setElapsedTime] = useState('0h 0m 0s');
  const [currentTime, setCurrentTime] = useState(new Date());
  const signInMutation = useSignIn();
  const signOutMutation = useSignOut();

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live timer effect for session
  useEffect(() => {
    if (!currentSession) {
      setElapsedTime('0h 0m 0s');
      return;
    }

    const updateTimer = () => {
      const start = new Date(currentSession.sign_in_time);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setElapsedTime(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentSession]);

  const getSessionType = () => {
    if (!currentSession) return null;
    const hour = new Date(currentSession.sign_in_time).getHours();
    if (hour < 12) return { label: 'Morning', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    if (hour < 17) return { label: 'Afternoon', color: 'bg-primary/10 text-primary border-primary/20' };
    return { label: 'Evening', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
  };

  const handleSignIn = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await signInMutation.mutateAsync({
        userId: user.id,
      });
      toast.success('🚀 Session started! Have a productive day!');
      onSessionUpdate();
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.message?.includes('Already signed in')) {
        toast.error('You are already signed in today');
      } else {
        toast.error(error.message || 'Failed to start session');
      }
    }
  };

  const handleSignOut = async () => {
    if (!currentSession?.id) {
      toast.error('No active session found');
      return;
    }

    try {
      const signOutTime = new Date();
      const signInTime = new Date(currentSession.sign_in_time);
      const hoursWorked = (signOutTime.getTime() - signInTime.getTime()) / (1000 * 60 * 60);

      await signOutMutation.mutateAsync({
        attendanceId: currentSession.id,
      });
      toast.success(`Great work! You logged ${hoursWorked.toFixed(1)} hours today 💪`);
      onSessionUpdate();
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error(error.message || 'Failed to end session');
    }
  };

  const sessionType = getSessionType();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Today's Session
          </CardTitle>
          {currentSession && sessionType && (
            <Badge variant="outline" className={sessionType.color}>{sessionType.label}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {currentSession ? (
          <>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="p-2.5 rounded-full bg-green-500/20 animate-pulse">
                <Timer className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-700">Session Active</p>
                <p className="text-xs text-green-600/80">
                  Started at {format(new Date(currentSession.sign_in_time), 'h:mm a')}
                </p>
              </div>
            </div>
            
            <div className="text-center py-8 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Time Elapsed</span>
              </div>
              <p className="text-4xl font-bold text-foreground font-mono tracking-wider">
                {elapsedTime}
              </p>
            </div>

            <Button 
              className="w-full h-12 text-base font-semibold" 
              variant="destructive" 
              onClick={handleSignOut}
              disabled={signOutMutation.isPending}
            >
              <LogOut className="h-5 w-5 mr-2" />
              {signOutMutation.isPending ? 'Ending Session...' : 'End Session'}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
              <div className="p-2.5 rounded-full bg-muted-foreground/10">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No Active Session</p>
                <p className="text-xs text-muted-foreground">Click below to start working</p>
              </div>
            </div>
            
            <div className="text-center py-8 bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground mb-2">Current Time</p>
              <p className="text-3xl font-bold text-foreground font-mono">
                {format(currentTime, 'h:mm:ss a')}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {format(currentTime, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>

            <Button 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
              onClick={handleSignIn}
              disabled={signInMutation.isPending}
            >
              <LogIn className="h-5 w-5 mr-2" />
              {signInMutation.isPending ? 'Starting Session...' : 'Start Session'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
