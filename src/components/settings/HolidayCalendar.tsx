import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
}

interface HolidayCalendarProps {
  onUpdate?: () => void;
}

export function HolidayCalendar({ onUpdate }: HolidayCalendarProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: undefined as Date | undefined, type: 'public' });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    const { data } = await supabase
      .from('holidays')
      .select('*')
      .order('date');
    
    if (data) {
      setHolidays(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newHoliday.name.trim() || !newHoliday.date) {
      toast.error('Please enter holiday name and date');
      return;
    }

    const { error } = await supabase.from('holidays').insert([{
      name: newHoliday.name,
      date: format(newHoliday.date, 'yyyy-MM-dd'),
      type: newHoliday.type,
    }]);

    if (error) {
      if (error.code === '23505') {
        toast.error('A holiday already exists for this date');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Holiday added');
      setNewHoliday({ name: '', date: undefined, type: 'public' });
      fetchHolidays();
      onUpdate?.();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Holiday deleted');
      fetchHolidays();
      onUpdate?.();
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'public': return 'bg-purple-100 text-purple-700';
      case 'restricted': return 'bg-orange-100 text-orange-700';
      case 'optional': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PartyPopper className="h-5 w-5" />
          Holiday Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new holiday */}
        <div className="space-y-3 p-4 rounded-lg border border-border">
          <Label className="text-sm font-medium">Add Holiday</Label>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input
              placeholder="Holiday name"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
              className="sm:col-span-2"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('justify-start text-left font-normal', !newHoliday.date && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newHoliday.date ? format(newHoliday.date, 'MMM d, yyyy') : 'Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newHoliday.date}
                  onSelect={(date) => setNewHoliday(prev => ({ ...prev, date }))}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Select value={newHoliday.type} onValueChange={(v) => setNewHoliday(prev => ({ ...prev, type: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Holiday
          </Button>
        </div>

        {/* Holiday list */}
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : holidays.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No holidays configured</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {holidays.map(holiday => (
              <div key={holiday.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[50px]">
                    <p className="text-xs text-muted-foreground">{format(new Date(holiday.date), 'MMM')}</p>
                    <p className="text-lg font-bold">{format(new Date(holiday.date), 'd')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{holiday.name}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded capitalize', getTypeBadgeColor(holiday.type))}>
                      {holiday.type}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(holiday.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}