-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can manage their own attendance" ON public.attendance_sessions;

-- Create new INSERT policy allowing owners/admins to add for any user
CREATE POLICY "Users can insert their own attendance"
  ON public.attendance_sessions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    OR has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Create work_sessions table for company-defined sessions
CREATE TABLE public.work_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

-- Everyone can view sessions
CREATE POLICY "Sessions are viewable by authenticated users"
  ON public.work_sessions
  FOR SELECT
  USING (true);

-- Only admins can manage sessions
CREATE POLICY "Admins can manage work sessions"
  ON public.work_sessions
  FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add session_id to attendance_sessions
ALTER TABLE public.attendance_sessions 
ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.work_sessions(id);

-- Insert default work sessions
INSERT INTO public.work_sessions (name, start_time, end_time) VALUES
('Morning Shift', '09:00', '13:00'),
('Afternoon Shift', '14:00', '18:00'),
('Full Day', '09:00', '18:00');

-- Create trigger for updated_at on work_sessions
CREATE TRIGGER update_work_sessions_updated_at
  BEFORE UPDATE ON public.work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();