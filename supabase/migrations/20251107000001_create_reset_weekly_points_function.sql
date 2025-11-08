-- Create function to reset weekly points for all users
CREATE OR REPLACE FUNCTION public.reset_weekly_points()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.users
  SET weekly_points = 0
  WHERE weekly_points > 0;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Grant execute permission to authenticated users (or service role)
GRANT EXECUTE ON FUNCTION public.reset_weekly_points() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_weekly_points() TO service_role;

-- Optional: Set up pg_cron to run weekly (uncomment and adjust schedule as needed)
-- Requires pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule(
--   'reset-weekly-points',
--   '0 0 * * 1', -- Every Monday at midnight UTC
--   $$SELECT public.reset_weekly_points()$$
-- );



