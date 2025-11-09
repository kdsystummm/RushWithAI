import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Trophy, Heart, User, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}

interface Entry {
  id: string;
  entry_text: string;
  likes: number;
  user_id: string;
  users?: { username: string | null };
}

const Challenges = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchCurrentChallenge();
    checkAndAwardBadges();
  }, []);

  const checkAndAwardBadges = async () => {
    try {
      await supabase.functions.invoke('award-challenge-badges');
    } catch (error) {
      console.error('Error checking for badge awards:', error);
    }
  };

  const fetchCurrentChallenge = async () => {
    try {
      const { data: challengeData, error: challengeError } = await supabase
        .from('weekly_challenges')
        .select('*')
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (challengeError) throw challengeError;
      setChallenge(challengeData);

      if (challengeData) {
        const { data: entriesData, error: entriesError } = await supabase
          .from('challenge_entries')
          .select('*, users(username)')
          .eq('challenge_id', challengeData.id)
          .order('likes', { ascending: false });

        if (entriesError) throw entriesError;
        setEntries(entriesData || []);
      }
    } catch (error) {
      console.error('Error fetching challenge:', error);
    }
  };

  const handleSubmitEntry = async () => {
    if (!user || !challenge || !newEntry.trim()) return;

    try {
      const { error } = await supabase.from('challenge_entries').insert({
        challenge_id: challenge.id,
        user_id: user.id,
        entry_text: newEntry.trim(),
      });

      if (error) throw error;

      toast({
        title: "Entry submitted!",
        description: "Your entry has been added to the challenge.",
      });

      setNewEntry('');
      fetchCurrentChallenge();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLike = async (entryId: string) => {
    if (!user) return;

    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    try {
      const { error } = await supabase
        .from('challenge_entries')
        .update({ likes: entry.likes + 1 })
        .eq('id', entryId);

      if (error) throw error;
      fetchCurrentChallenge();
    } catch (error) {
      console.error('Error liking entry:', error);
    }
  };

  const handleShare = async (entry: Entry) => {
    const shareText = `Check out this entry: "${entry.entry_text}" - Join the challenge on Rush With AI!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
          url: window.location.href,
        });
        
        toast({
          title: "Shared!",
          description: "Thanks for spreading the word!",
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard!",
        description: "Share this with your friends!",
      });
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <header className="border-b bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold text-gradient truncate">Weekly Challenge</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Show your creativity</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="shrink-0">
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {challenge && (
            <Card className="p-4 sm:p-6 gradient-card">
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-accent shrink-0" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold mb-2">{challenge.title}</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">{challenge.description}</p>
                  <p className="text-xs sm:text-sm text-accent mt-2">
                    Share your entry to inspire others! 🚀
                  </p>
                </div>
              </div>

              {user ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Enter your best line here..."
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                  />
                  <Button
                    onClick={handleSubmitEntry}
                    disabled={!newEntry.trim()}
                    className="w-full"
                  >
                    Submit Entry
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Sign in to participate in the challenge!</p>
                  <Button onClick={() => navigate('/auth')} className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </div>
              )}
            </Card>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold">Entries ({entries.length})</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Like & share the best ones!</p>
            </div>
            {entries.length === 0 ? (
              <Card className="p-6 sm:p-8 gradient-card text-center">
                <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-accent mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Be the first to submit an entry!</p>
              </Card>
            ) : (
              entries.map((entry) => (
                <Card key={entry.id} className="p-3 sm:p-4 gradient-card">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <p className="font-semibold text-xs sm:text-sm text-muted-foreground">
                      {entry.users?.username || 'Anonymous'}
                    </p>
                    <div className="flex gap-1 sm:gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(entry.id)}
                        disabled={!user}
                        className="h-8 px-2 sm:px-3"
                      >
                        <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="text-xs sm:text-sm">{entry.likes}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(entry)}
                        className="h-8 px-2 sm:px-3"
                      >
                        <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm sm:text-lg break-words">{entry.entry_text}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Challenges;