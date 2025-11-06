import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { LogOut, Zap, Trophy, Users, TrendingUp, Moon, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ToneSelector from '@/components/ToneSelector';
import LineCard from '@/components/LineCard';
import { ImageUpload } from '@/components/ImageUpload';

type ToneType = 'flirty' | 'funny' | 'teasing' | 'savage' | 'polite' | 'smart' | 'emotional' | 'respectful';

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState<ToneType>('flirty');
  const [replies, setReplies] = useState<Array<{ text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [extractingText, setExtractingText] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

  const handleImageSelect = async (file: File) => {
    setSelectedImage(file);
    setExtractingText(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('extract-text-from-image', {
          body: { image: base64Image }
        });

        if (error) throw error;
        
        setMessage(data.text || '');
        toast({
          title: "Text extracted! 📸",
          description: "You can edit the message before generating replies",
        });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error extracting text:', error);
      toast({
        title: "Error",
        description: "Failed to extract text from image. Please try typing instead.",
        variant: "destructive",
      });
    } finally {
      setExtractingText(false);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setMessage('');
  };

  const generateReplies = async () => {
    if (!message.trim() && !selectedImage) {
      toast({
        title: "Empty message",
        description: "Please enter a message or upload a screenshot!",
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

      // Award points for generating lines
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('points')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          await supabase
            .from('users')
            .update({ points: (userData.points || 0) + 10 })
            .eq('id', user.id);
        }
      }
      
      toast({
        title: "Lines generated! 🔥",
        description: `${data.replies?.length || 0} replies ready. +10 points earned!`,
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
            <h1 className="text-3xl font-bold text-gradient">Rush With AI</h1>
            <p className="text-sm text-muted-foreground">Never run out of lines again</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/leaderboard')}>
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/challenges')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Challenges
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/feed')}>
              <Users className="h-4 w-4 mr-2" />
              Feed
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
              Got stuck in a chat? <span className="text-gradient">💬</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Upload a screenshot or type the message—AI will give you the perfect reply
            </p>
          </div>

          {/* Input Section */}
          <Card className="p-8 shadow-primary">
            <div className="space-y-6">
              <div>
                <label className="text-lg font-semibold mb-2 block">Their Message</label>
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  onClear={handleClearImage}
                  selectedImage={selectedImage}
                />
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or type manually</span>
                  </div>
                </div>
                <Textarea
                  placeholder="Type or paste their message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px] text-lg"
                  disabled={extractingText}
                />
              </div>

              <div>
                <label className="text-lg font-semibold mb-4 block">Choose Your Vibe</label>
                <ToneSelector selectedTone={selectedTone} onToneChange={setSelectedTone} />
              </div>

              <Button
                onClick={generateReplies}
                disabled={loading || extractingText}
                className="w-full py-6 text-lg bg-primary text-primary-foreground shadow-neon hover:shadow-glow transition-smooth"
              >
                <Zap className="mr-2 h-5 w-5" />
                {extractingText ? 'Extracting text...' : loading ? 'Generating...' : 'Generate Replies'}
              </Button>
            </div>
          </Card>

          {/* Replies Section */}
          {replies.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-center">Your Reply Options 💬</h3>
              <div className="space-y-4">
                {replies.map((reply, index) => (
                  <LineCard
                    key={index}
                    reply={reply.text}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {replies.length === 0 && !loading && (
            <Card className="p-12 text-center gradient-card">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-semibold mb-2">Ready to Rush with AI?</h3>
              <p className="text-muted-foreground">
                Type or upload a screenshot—get perfect replies in seconds
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
