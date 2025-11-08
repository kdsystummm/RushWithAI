import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trophy, Medal, User } from 'lucide-react';
import { BadgeDisplay } from '@/components/BadgeDisplay';
import type { BadgeId } from '@/lib/badges';

interface LeaderboardEntry {
  id: string;
  username: string | null;
  points: number;
  weekly_points: number;
  badges: BadgeId[] | null;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'weekly'>('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      const sortBy = timeframe === 'weekly' ? 'weekly_points' : 'points';
      const { data, error } = await supabase
        .from('users')
        .select('id, username, points, weekly_points, badges')
        .order(sortBy, { ascending: false })
        .limit(50);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-700" />;
    return <span className="text-muted-foreground">#{index + 1}</span>;
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
              <h1 className="text-3xl font-bold text-gradient">Leaderboard</h1>
              <p className="text-sm text-muted-foreground">Top performers</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex gap-2 justify-center">
            <Button
              variant={timeframe === 'all' ? 'default' : 'outline'}
              onClick={() => setTimeframe('all')}
            >
              All Time
            </Button>
            <Button
              variant={timeframe === 'weekly' ? 'default' : 'outline'}
              onClick={() => setTimeframe('weekly')}
            >
              This Week
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <Card key={entry.id} className="p-4 gradient-card">
                  <div className="flex items-center gap-4">
                    <div className="w-12 text-center">
                      {getRankIcon(index)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{entry.username || 'Anonymous'}</p>
                      {entry.badges && entry.badges.length > 0 && (
                        <div className="mt-1">
                          <BadgeDisplay badgeIds={entry.badges} size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {timeframe === 'weekly' ? entry.weekly_points : entry.points}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;