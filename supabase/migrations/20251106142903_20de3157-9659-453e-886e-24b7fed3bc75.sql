-- Update users table to support new points system
ALTER TABLE public.users 
DROP COLUMN IF EXISTS average_rizz_score,
DROP COLUMN IF EXISTS total_battles_won,
DROP COLUMN IF EXISTS total_battles_lost,
DROP COLUMN IF EXISTS rizz_personality;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS weekly_points integer DEFAULT 0;

-- Update rizz_replies table to rush_lines
ALTER TABLE public.rizz_replies RENAME TO rush_lines;

ALTER TABLE public.rush_lines
DROP COLUMN IF EXISTS rizz_score,
DROP COLUMN IF EXISTS input_message;

ALTER TABLE public.rush_lines
ADD COLUMN IF NOT EXISTS screenshot_url text,
ADD COLUMN IF NOT EXISTS shared boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- Create weekly_challenges table
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges"
ON public.weekly_challenges FOR SELECT
USING (true);

-- Create challenge_entries table
CREATE TABLE IF NOT EXISTS public.challenge_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid REFERENCES public.weekly_challenges(id),
  user_id uuid REFERENCES public.users(id),
  entry_text text NOT NULL,
  likes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.challenge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenge entries"
ON public.challenge_entries FOR SELECT
USING (true);

CREATE POLICY "Users can create their own entries"
ON public.challenge_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update likes on entries"
ON public.challenge_entries FOR UPDATE
USING (true);

-- Create comments table for social feed
CREATE TABLE IF NOT EXISTS public.line_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id uuid REFERENCES public.rush_lines(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  comment_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.line_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
ON public.line_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON public.line_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for rush_lines to support sharing
DROP POLICY IF EXISTS "Users can view their own replies" ON public.rush_lines;

CREATE POLICY "Users can view their own lines and shared lines"
ON public.rush_lines FOR SELECT
USING (auth.uid() = user_id OR shared = true);

CREATE POLICY "Users can update their own lines"
ON public.rush_lines FOR UPDATE
USING (auth.uid() = user_id);

-- Drop old battle tables
DROP TABLE IF EXISTS public.battle_entries CASCADE;
DROP TABLE IF EXISTS public.battles CASCADE;
DROP TABLE IF EXISTS public.community_board CASCADE;