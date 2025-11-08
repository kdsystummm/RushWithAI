import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Edit2, Save, X, User, Trophy, Calendar, Award, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BadgeDisplay } from '@/components/BadgeDisplay';
import type { BadgeId } from '@/lib/badges';

interface UserProfile {
  id: string;
  username: string | null;
  points: number;
  weekly_points: number;
  badges: BadgeId[] | null;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchProfile();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, username, points, weekly_points, badges, created_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile({
          ...data,
          badges: (data.badges as unknown as BadgeId[]) || []
        });
        setEditedUsername(data?.username || '');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedUsername(profile?.username || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUsername(profile?.username || '');
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    const trimmedUsername = editedUsername.trim();
    
    if (!trimmedUsername) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (trimmedUsername.length < 3) {
      toast({
        title: "Error",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (trimmedUsername.length > 20) {
      toast({
        title: "Error",
        description: "Username must be 20 characters or less",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ username: trimmedUsername })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, username: trimmedUsername });
      setIsEditing(false);
      
      toast({
        title: "Success!",
        description: "Username updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating username:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Profile not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          <Card className="p-8 shadow-primary">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gradient mb-2">Profile</h1>
                <p className="text-muted-foreground">Manage your account and view your stats</p>
              </div>
              {!isEditing && (
                <Button onClick={handleEdit} variant="outline">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Username Section */}
            <div className="mb-8 pb-8 border-b">
              <div className="flex items-center gap-4 mb-4">
                <User className="h-5 w-5 text-primary" />
                <Label className="text-lg font-semibold">Username</Label>
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    value={editedUsername}
                    onChange={(e) => setEditedUsername(e.target.value)}
                    placeholder="Enter username"
                    minLength={3}
                    maxLength={20}
                    className="max-w-md"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" disabled={saving}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xl font-medium">{profile.username || 'No username set'}</p>
              )}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <h3 className="text-lg font-semibold">Total Points</h3>
                </div>
                <p className="text-3xl font-bold text-gradient">{profile.points || 0}</p>
                <p className="text-sm text-muted-foreground mt-2">All-time points earned</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-6 w-6 text-blue-500" />
                  <h3 className="text-lg font-semibold">Weekly Points</h3>
                </div>
                <p className="text-3xl font-bold text-gradient">{profile.weekly_points || 0}</p>
                <p className="text-sm text-muted-foreground mt-2">Points earned this week</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-6 w-6 text-purple-500" />
                  <h3 className="text-lg font-semibold">Badges</h3>
                </div>
                <div className="mt-2">
                  {profile.badges && profile.badges.length > 0 ? (
                    <BadgeDisplay badgeIds={profile.badges} size="md" />
                  ) : (
                    <p className="text-muted-foreground">No badges yet. Keep playing to earn badges!</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-semibold">Member Since</h3>
                </div>
                <p className="text-lg font-medium">{formatDate(profile.created_at)}</p>
                <p className="text-sm text-muted-foreground mt-2">Account creation date</p>
              </Card>
            </div>

            {/* Account Info - Private Section */}
            <div className="pt-8 border-t">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Private Account Information</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Only visible to you</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                  </div>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">User ID:</span>
                  </div>
                  <span className="font-mono text-xs">{user?.id}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                This information is private and only visible to you. Other users cannot see your email address.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;

