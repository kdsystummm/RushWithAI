-- Add INSERT policy for rush_lines table
CREATE POLICY "Users can insert their own lines"
ON public.rush_lines FOR INSERT
WITH CHECK (auth.uid() = user_id);



