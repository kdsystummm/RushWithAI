import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Heart, MessageCircle, Send, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkAndAwardBadges } from '@/lib/badgeAward';
import { getBadgeEmoji, getBadgeName } from '@/lib/badges';

interface SharedLine {
  id: string;
  generated_reply: string;
  tone: string;
  likes: number;
  comments_count: number;
  created_at: string;
  users?: { username: string | null };
}

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  users?: { username: string | null };
}

const Feed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lines, setLines] = useState<SharedLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [postingComment, setPostingComment] = useState<string | null>(null);

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

  const fetchComments = async (lineId: string, force = false) => {
    if (comments[lineId] && !force) return; // Already loaded

    setLoadingComments(prev => ({ ...prev, [lineId]: true }));
    try {
      const { data, error } = await supabase
        .from('line_comments')
        .select('*, users(username)')
        .eq('line_id', lineId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(prev => ({ ...prev, [lineId]: data || [] }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments.",
        variant: "destructive",
      });
    } finally {
      setLoadingComments(prev => ({ ...prev, [lineId]: false }));
    }
  };

  const handlePostComment = async (lineId: string) => {
    if (!user || !commentText[lineId]?.trim()) return;

    setPostingComment(lineId);
    try {
      const { error } = await supabase
        .from('line_comments')
        .insert({
          line_id: lineId,
          user_id: user.id,
          comment_text: commentText[lineId].trim(),
        });

      if (error) throw error;

      // Comments count is automatically updated by database trigger
      // Refresh comments and feed
      await fetchComments(lineId, true);
      setCommentText(prev => ({ ...prev, [lineId]: '' }));
      
      // Refresh feed to update comments count display
      fetchSharedLines();

      // Check and award badges for commenting
      const { data: userData } = await supabase
        .from('users')
        .select('points, weekly_points, badges')
        .eq('id', user.id)
        .single();

      if (userData) {
        const newBadges = await checkAndAwardBadges({
          userId: user.id,
          userStats: {
            points: userData.points || 0,
            weekly_points: userData.weekly_points || 0,
            badges: (userData.badges || []) as any,
          },
          action: 'comment',
        });

        if (newBadges.length > 0) {
          toast({
            title: "Badge earned! 🏅",
            description: `You earned: ${newBadges.map(id => `${getBadgeEmoji(id)} ${getBadgeName(id)}`).join(', ')}`,
          });
        }
      }

      toast({
        title: "Comment posted! 💬",
        description: "Your comment has been added.",
      });
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post comment.",
        variant: "destructive",
      });
    } finally {
      setPostingComment(null);
    }
  };

  const handleOpenComments = async (lineId: string) => {
    setSelectedLineId(lineId);
    await fetchComments(lineId);
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Rush Feed</h1>
              <p className="text-sm text-muted-foreground">Community's best lines</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenComments(line.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {line.comments_count || 0}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Comments</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        {/* Comment Input */}
                        {user && (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Write a comment..."
                              value={commentText[line.id] || ''}
                              onChange={(e) => setCommentText(prev => ({ ...prev, [line.id]: e.target.value }))}
                              className="min-h-[80px]"
                            />
                            <Button
                              onClick={() => handlePostComment(line.id)}
                              disabled={!commentText[line.id]?.trim() || postingComment === line.id}
                              className="w-full"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {postingComment === line.id ? 'Posting...' : 'Post Comment'}
                            </Button>
                          </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-3">
                          {loadingComments[line.id] ? (
                            <p className="text-center text-muted-foreground">Loading comments...</p>
                          ) : comments[line.id]?.length > 0 ? (
                            comments[line.id].map((comment) => (
                              <Card key={comment.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <p className="font-semibold text-sm">
                                    {comment.users?.username || 'Anonymous'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-sm">{comment.comment_text}</p>
                              </Card>
                            ))
                          ) : (
                            <p className="text-center text-muted-foreground py-4">
                              No comments yet. Be the first to comment!
                            </p>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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