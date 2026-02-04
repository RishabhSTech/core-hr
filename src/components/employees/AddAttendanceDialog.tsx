import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, eachDayOfInterval, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { useCompany } from '@/contexts/CompanyContext';

type AttendanceStatus = Database['public']['Enums']['attendance_status'];

interface WorkSession {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
}

interface AddAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  employeeName: string;
  onSuccess: () => void;
}

export function AddAttendanceDialog({ open, onOpenChange, userId, employeeName, onSuccess }: AddAttendanceDialogProps) {
  const { company } = useCompany();
  const [loading, setLoading] = useState(false);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [mode, setMode] = useState<'single' | 'range'>('single');
  const [singleDate, setSingleDate] = useState<Date | undefined>(subDays(new Date(), 1));
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 20));
  const [endDate, setEndDate] = useState<Date | undefined>(subDays(new Date(), 1));
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [sessionId, setSessionId] = useState<string>('');
  const [skipWeekends, setSkipWeekends] = useState(true);

  useEffect(() => {
    if (open) {
      fetchWorkSessions();
    }
  }, [open]);

  const fetchWorkSessions = async () => {
    const { data } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('is_active', true)
      .order('start_time');
    
    if (data && data.length > 0) {
      setWorkSessions(data);
      setSessionId(data[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      toast.error('Please select a work session');
      return;
    }

    setLoading(true);

    try {
      let dates: Date[] = [];
      
      if (mode === 'single' && singleDate) {
        dates = [singleDate];
      } else if (mode === 'range' && startDate && endDate) {
        dates = eachDayOfInterval({ start: startDate, end: endDate });
        if (skipWeekends) {
          dates = dates.filter(d => !isWeekend(d));
        }
      }

      if (dates.length === 0) {
        toast.error('Please select valid dates');
        return;
      }

      const selectedSession = workSessions.find(s => s.id === sessionId);
      if (!selectedSession) {
        toast.error('Invalid session selected');
        return;
      }

      const records = dates.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return {
          user_id: userId,
          sign_in_time: `${dateStr}T${selectedSession.start_time}`,
          sign_out_time: `${dateStr}T${selectedSession.end_time}`,
          status,
          session_id: sessionId,
          company_id: company?.id,
        };
      });

      const { error } = await supabase.from('attendance_sessions').insert(records);

      if (error) throw error;

      toast.success(`Added ${dates.length} attendance record(s) for ${employeeName}`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Attendance for {employeeName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'single' | 'range')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Day</SelectItem>
                <SelectItem value="range">Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'single' ? (
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !singleDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {singleDate ? format(singleDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={singleDate} onSelect={setSingleDate} disabled={(date) => date > new Date()} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left font-normal text-xs', !startDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {startDate ? format(startDate, 'PP') : 'Pick'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(date) => date > new Date()} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left font-normal text-xs', !endDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {endDate ? format(endDate, 'PP') : 'Pick'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => date > new Date()} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="skipWeekends"
                  checked={skipWeekends}
                  onCheckedChange={(checked) => setSkipWeekends(!!checked)}
                />
                <Label htmlFor="skipWeekends" className="text-sm">Skip weekends</Label>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Work Session</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {workSessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name} ({session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !sessionId}>
              {loading ? 'Adding...' : 'Add Attendance'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}