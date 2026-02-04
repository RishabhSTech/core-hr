-- Create holidays table
CREATE TABLE public.holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  date date NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'restricted', 'optional')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can view holidays
CREATE POLICY "Holidays are viewable by authenticated users"
  ON public.holidays
  FOR SELECT
  USING (true);

-- Only admins can manage holidays
CREATE POLICY "Admins can manage holidays"
  ON public.holidays
  FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add some common Indian holidays for 2025
INSERT INTO public.holidays (name, date, type) VALUES
('Republic Day', '2025-01-26', 'public'),
('Holi', '2025-03-14', 'public'),
('Good Friday', '2025-04-18', 'public'),
('Independence Day', '2025-08-15', 'public'),
('Gandhi Jayanti', '2025-10-02', 'public'),
('Diwali', '2025-10-20', 'public'),
('Christmas', '2025-12-25', 'public');