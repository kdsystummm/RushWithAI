import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Trophy, Heart } from 'lucide-react';
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
  }, []);

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

  return (
    <div className="min-h-screen gradient-hero">
      <header className="border-b bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Weekly Challenge</h1>
            <p className="text-sm text-muted-foreground">Show your creativity</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {challenge && (
            <Card className="p-6 gradient-card">
              <div className="flex items-start gap-4 mb-4">
                <Trophy className="h-8 w-8 text-accent" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">{challenge.title}</h2>
                  <p className="text-muted-foreground">{challenge.description}</p>
                </div>
              </div>

              {user && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Enter your best line here..."
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button
                    onClick={handleSubmitEntry}
                    disabled={!newEntry.trim()}
                    className="w-full"
                  >
                    Submit Entry
                  </Button>
                </div>
              )}
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="text-xl font-bold">Entries</h3>
            {entries.map((entry) => (
              <Card key={entry.id} className="p-4 gradient-card">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-sm text-muted-foreground">
                    {entry.users?.username || 'Anonymous'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(entry.id)}
                    disabled={!user}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {entry.likes}
                  </Button>
                </div>
                <p className="text-lg">{entry.entry_text}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Challenges;