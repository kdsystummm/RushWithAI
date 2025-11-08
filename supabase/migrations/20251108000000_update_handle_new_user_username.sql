-- Update function to handle username from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_username TEXT;
BEGIN
  -- Try to get username from metadata (for email signup with username)
  IF NEW.raw_user_meta_data->>'username' IS NOT NULL THEN
    user_username := NEW.raw_user_meta_data->>'username';
  -- Try to get name from OAuth providers (Google, etc.)
  ELSIF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
    user_username := NEW.raw_user_meta_data->>'full_name';
  ELSIF NEW.raw_user_meta_data->>'name' IS NOT NULL THEN
    user_username := NEW.raw_user_meta_data->>'name';
  -- Fallback to email username part
  ELSIF NEW.email IS NOT NULL THEN
    user_username := split_part(NEW.email, '@', 1);
  ELSE
    user_username := 'User';
  END IF;

  INSERT INTO public.users (id, username)
  VALUES (NEW.id, user_username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

