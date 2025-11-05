import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { LogOut, Zap, Trophy, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ToneSelector from '@/components/ToneSelector';
import RizzReplyCard from '@/components/RizzReplyCard';

type ToneType = 'flirty' | 'funny' | 'teasing' | 'dominant' | 'romantic';

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState<ToneType>('flirty');
  const [replies, setReplies] = useState<Array<{ text: string; score: number }>>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const generateReplies = async () => {
    if (!message.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message first!",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-rizz-reply', {
        body: { message, tone: selectedTone }
      });

      if (error) throw error;
      
      setReplies(data.replies || []);
      
      toast({
        title: "Rizz generated! 🔥",
        description: `${data.replies?.length || 0} smooth replies ready to use.`,
      });
    } catch (error: any) {
      console.error('Error generating replies:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate replies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gradient">RizzAI</h1>
            <p className="text-sm text-muted-foreground">Never get left on read again</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </Button>
            <Button variant="ghost" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Battles
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4">
              What did they say? <span className="text-gradient">👀</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Let AI help you craft the perfect response
            </p>
          </div>

          {/* Input Section */}
          <Card className="p-8 shadow-primary">
            <div className="space-y-6">
              <div>
                <label className="text-lg font-semibold mb-2 block">Their Message</label>
                <Textarea
                  placeholder="Type or paste their message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px] text-lg"
                />
              </div>

              <div>
                <label className="text-lg font-semibold mb-4 block">Choose Your Vibe</label>
                <ToneSelector selectedTone={selectedTone} onToneChange={setSelectedTone} />
              </div>

              <Button
                onClick={generateReplies}
                disabled={loading}
                className="w-full py-6 text-lg gradient-primary text-white shadow-primary hover:shadow-glow transition-smooth"
              >
                <Zap className="mr-2 h-5 w-5" />
                {loading ? 'Generating Magic...' : 'Generate Rizz Replies'}
              </Button>
            </div>
          </Card>

          {/* Replies Section */}
          {replies.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-center">Your Rizz Options 🔥</h3>
              <div className="space-y-4">
                {replies.map((reply, index) => (
                  <RizzReplyCard
                    key={index}
                    reply={reply.text}
                    score={reply.score}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {replies.length === 0 && !loading && (
            <Card className="p-12 text-center gradient-card">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-2xl font-semibold mb-2">Ready to level up your chat game?</h3>
              <p className="text-muted-foreground">
                Paste their message above and let AI generate the perfect responses
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
