import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react';

interface SharedLine {
  id: string;
  generated_reply: string;
  tone: string;
  likes: number;
  comments_count: number;
  created_at: string;
  users?: { username: string | null };
}

const Feed = () => {
  const navigate = useNavigate();
  const [lines, setLines] = useState<SharedLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchSharedLines();
  }, []);

  const fetchSharedLines = async () => {
    try {
      const { data, error } = await supabase
        .from('rush_lines')
        .select('*, users(username)')
        .eq('shared', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLines(data || []);
    } catch (error) {
      console.error('Error fetching shared lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (lineId: string) => {
    if (!user) return;

    const line = lines.find(l => l.id === lineId);
    if (!line) return;

    try {
      const { error } = await supabase
        .from('rush_lines')
        .update({ likes: line.likes + 1 })
        .eq('id', lineId);

      if (error) throw error;
      fetchSharedLines();
    } catch (error) {
      console.error('Error liking line:', error);
    }
  };

  const getToneEmoji = (tone: string) => {
    const emojiMap: Record<string, string> = {
      flirty: '😏',
      funny: '😂',
      teasing: '😜',
      savage: '😎',
      polite: '😊',
      smart: '🤓',
      emotional: '💔',
      respectful: '🙏',
    };
    return emojiMap[tone] || '💬';
  };

  return (
    <div className="min-h-screen gradient-hero">
      <header className="border-b bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Rush Feed</h1>
            <p className="text-sm text-muted-foreground">Community's best lines</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : lines.length === 0 ? (
            <Card className="p-12 text-center gradient-card">
              <p className="text-xl">No shared lines yet</p>
              <p className="text-muted-foreground mt-2">Be the first to share!</p>
            </Card>
          ) : (
            lines.map((line) => (
              <Card key={line.id} className="p-6 gradient-card hover:shadow-neon transition-smooth">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">
                      {line.users?.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getToneEmoji(line.tone)} {line.tone}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(line.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <p className="text-lg mb-4">{line.generated_reply}</p>
                
                <div className="flex gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(line.id)}
                    disabled={!user}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {line.likes}
                  </Button>
                  <Button variant="ghost" size="sm" disabled>
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {line.comments_count}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Feed;