-- Create users table for storing user stats and progress
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT,
  average_rizz_score DECIMAL(5,2) DEFAULT 0,
  total_battles_won INTEGER DEFAULT 0,
  total_battles_lost INTEGER DEFAULT 0,
  rizz_personality TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rizz_replies table for storing generated replies
CREATE TABLE public.rizz_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  input_message TEXT NOT NULL,
  tone TEXT NOT NULL,
  generated_reply TEXT NOT NULL,
  rizz_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create battles table for multiplayer battles
CREATE TABLE public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_message TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create battle_entries table for user submissions in battles
CREATE TABLE public.battle_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reply TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_board table for top rizz lines
CREATE TABLE public.community_board (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rizz_reply_id UUID REFERENCES public.rizz_replies(id) ON DELETE CASCADE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rizz_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_board ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for rizz_replies
CREATE POLICY "Users can view their own replies"
  ON public.rizz_replies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own replies"
  ON public.rizz_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for battles
CREATE POLICY "Anyone can view battles"
  ON public.battles FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create battles"
  ON public.battles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for battle_entries
CREATE POLICY "Anyone can view battle entries"
  ON public.battle_entries FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own battle entries"
  ON public.battle_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update votes on battle entries"
  ON public.battle_entries FOR UPDATE
  USING (true);

-- RLS Policies for community_board
CREATE POLICY "Anyone can view community board"
  ON public.community_board FOR SELECT
  USING (true);

CREATE POLICY "Users can upvote community posts"
  ON public.community_board FOR UPDATE
  USING (true);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();