-- Function to award weekly winner and top contributor badges
-- This should be called after weekly points reset

CREATE OR REPLACE FUNCTION public.award_weekly_badges()
RETURNS TABLE(user_id uuid, badges_awarded text[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  weekly_winner_id uuid;
  top_3_ids uuid[];
  user_badges jsonb;
  new_badges jsonb;
  awarded_badges text[];
BEGIN
  -- Get weekly winner (user with highest weekly_points before reset)
  -- Note: This should be called BEFORE reset_weekly_points()
  SELECT id INTO weekly_winner_id
  FROM public.users
  WHERE weekly_points = (
    SELECT MAX(weekly_points)
    FROM public.users
    WHERE weekly_points > 0
  )
  ORDER BY created_at ASC
  LIMIT 1;

  -- Get top 3 contributors
  SELECT ARRAY_AGG(id) INTO top_3_ids
  FROM (
    SELECT id
    FROM public.users
    WHERE weekly_points > 0
    ORDER BY weekly_points DESC, created_at ASC
    LIMIT 3
  ) top_users;

  -- Award Weekly Winner badge
  IF weekly_winner_id IS NOT NULL THEN
    SELECT badges INTO user_badges
    FROM public.users
    WHERE id = weekly_winner_id;

    -- Check if badge already exists
    IF user_badges IS NULL OR NOT (user_badges ? 'weekly_winner') THEN
      new_badges := COALESCE(user_badges, '[]'::jsonb) || '["weekly_winner"]'::jsonb;
      
      UPDATE public.users
      SET badges = new_badges
      WHERE id = weekly_winner_id;
      
      awarded_badges := array_append(awarded_badges, 'weekly_winner');
    END IF;
  END IF;

  -- Award Top Contributor badges to top 3
  IF top_3_ids IS NOT NULL THEN
    FOR i IN 1..array_length(top_3_ids, 1) LOOP
      SELECT badges INTO user_badges
      FROM public.users
      WHERE id = top_3_ids[i];

      -- Check if badge already exists
      IF user_badges IS NULL OR NOT (user_badges ? 'top_contributor') THEN
        new_badges := COALESCE(user_badges, '[]'::jsonb) || '["top_contributor"]'::jsonb;
        
        UPDATE public.users
        SET badges = new_badges
        WHERE id = top_3_ids[i];
        
        awarded_badges := array_append(awarded_badges, 'top_contributor');
      END IF;
    END LOOP;
  END IF;

  -- Return results
  RETURN QUERY
  SELECT weekly_winner_id, awarded_badges
  WHERE weekly_winner_id IS NOT NULL OR array_length(awarded_badges, 1) > 0;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.award_weekly_badges() TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_weekly_badges() TO service_role;

-- Update reset function to award badges before resetting
CREATE OR REPLACE FUNCTION public.reset_weekly_points_with_badges()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Award weekly badges BEFORE resetting points
  PERFORM public.award_weekly_badges();
  
  -- Reset weekly points
  UPDATE public.users
  SET weekly_points = 0
  WHERE weekly_points > 0;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.reset_weekly_points_with_badges() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_weekly_points_with_badges() TO service_role;

