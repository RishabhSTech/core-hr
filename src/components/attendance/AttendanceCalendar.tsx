import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import { AttendanceSession } from '@/types/hrms';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
}

interface AttendanceCalendarProps {
  sessions: AttendanceSession[];
}

export function AttendanceCalendar({ sessions }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    fetchHolidays();
  }, [currentMonth]);

  const fetchHolidays = async () => {
    const startDate = format(monthStart, 'yyyy-MM-dd');
    const endDate = format(monthEnd, 'yyyy-MM-dd');
    
    const { data } = await supabase
      .from('holidays')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');
    
    if (data) {
      setHolidays(data);
    }
  };

  const getHolidayForDay = (day: Date) => {
    return holidays.find(h => isSameDay(new Date(h.date), day));
  };

  const getStatusForDay = (day: Date) => {
    const daySession = sessions.find(s => 
      isSameDay(new Date(s.sign_in_time), day)
    );
    return daySession?.status || null;
  };

  const getSessionForDay = (day: Date) => {
    return sessions.find(s => isSameDay(new Date(s.sign_in_time), day));
  };

  const getStatusColor = (status: string | null, holiday: Holiday | undefined) => {
    if (holiday) return 'bg-purple-100 text-purple-700 border-purple-200';
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700 border-green-200';
      case 'half_day': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'absent': return 'bg-red-100 text-red-700 border-red-200';
      case 'on_leave': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'late': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-background text-foreground border-border';
    }
  };

  const selectedSession = selectedDay ? getSessionForDay(selectedDay) : null;
  const selectedHoliday = selectedDay ? getHolidayForDay(selectedDay) : null;

  const calculateWorkingHours = (session: AttendanceSession) => {
    if (!session.sign_out_time) return 'In progress';
    const start = new Date(session.sign_in_time);
    const end = new Date(session.sign_out_time);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `${hours.toFixed(1)} hours`;
  };

  // Get upcoming holidays for the sidebar
  const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date());

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map(day => {
              const status = getStatusForDay(day);
              const holiday = getHolidayForDay(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-md text-sm font-medium border transition-colors relative",
                    getStatusColor(status, holiday),
                    isToday(day) && "ring-2 ring-primary ring-offset-2",
                    "hover:opacity-80"
                  )}
                  title={holiday?.name}
                >
                  {format(day, 'd')}
                  {holiday && (
                    <div className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-purple-500" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
              <span className="text-xs text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" />
              <span className="text-xs text-muted-foreground">Half Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
              <span className="text-xs text-muted-foreground">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
              <span className="text-xs text-muted-foreground">On Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200" />
              <span className="text-xs text-muted-foreground">Holiday</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Holidays */}
      {upcomingHolidays.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PartyPopper className="h-4 w-4" />
              Upcoming Holidays
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingHolidays.slice(0, 5).map(holiday => (
              <div key={holiday.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{holiday.name}</span>
                <Badge variant="outline" className="text-xs">
                  {format(new Date(holiday.date), 'MMM d')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          {selectedHoliday ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 border border-purple-200">
              <PartyPopper className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-semibold text-purple-700">{selectedHoliday.name}</p>
                <p className="text-sm text-purple-600 capitalize">{selectedHoliday.type} Holiday</p>
              </div>
            </div>
          ) : selectedSession ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sign In</p>
                  <p className="font-medium">{format(new Date(selectedSession.sign_in_time), 'h:mm a')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sign Out</p>
                  <p className="font-medium">
                    {selectedSession.sign_out_time 
                      ? format(new Date(selectedSession.sign_out_time), 'h:mm a')
                      : 'Not signed out'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="font-medium">{calculateWorkingHours(selectedSession)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{selectedSession.status.replace('_', ' ')}</p>
                </div>
              </div>
              {selectedSession.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedSession.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No attendance record for this day</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}