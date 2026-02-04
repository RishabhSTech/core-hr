-- Allow users to delete their own pending leave requests (withdraw)
CREATE POLICY "Users can delete their own pending requests"
  ON public.leave_requests
  FOR DELETE
  USING (user_id = auth.uid() AND status = 'pending');