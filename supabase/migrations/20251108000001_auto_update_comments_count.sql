-- Create trigger function to automatically update comments_count
CREATE OR REPLACE FUNCTION public.update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count when a comment is added
    UPDATE public.rush_lines
    SET comments_count = COALESCE(comments_count, 0) + 1
    WHERE id = NEW.line_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count when a comment is deleted
    UPDATE public.rush_lines
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
    WHERE id = OLD.line_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS trigger_update_comments_count_insert ON public.line_comments;
CREATE TRIGGER trigger_update_comments_count_insert
  AFTER INSERT ON public.line_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comments_count();

-- Create trigger for DELETE (if comments can be deleted in the future)
DROP TRIGGER IF EXISTS trigger_update_comments_count_delete ON public.line_comments;
CREATE TRIGGER trigger_update_comments_count_delete
  AFTER DELETE ON public.line_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comments_count();

