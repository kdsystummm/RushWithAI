// Badge award logic
import { supabase } from '@/integrations/supabase/client';
import type { BadgeId } from './badges';

interface UserStats {
  points: number;
  weekly_points: number;
  badges: BadgeId[];
}

interface BadgeCheckContext {
  userId: string;
  userStats: UserStats;
  action: 'generate' | 'share' | 'comment' | 'points_update' | 'weekly_reset';
}

/**
 * Check and award badges based on user actions
 */
export async function checkAndAwardBadges(context: BadgeCheckContext): Promise<BadgeId[]> {
  const { userId, userStats, action } = context;
  const currentBadges = (userStats.badges || []) as BadgeId[];
  const newBadges: BadgeId[] = [];

  // Get additional stats if needed
  let sharedCount = 0;
  let generatedCount = 0;
  let commentsCount = 0;
  let totalLikes = 0;

  if (action === 'share' || action === 'generate') {
    // Get count of shared lines (after database operations complete)
    const { count: shared } = await supabase
      .from('rush_lines')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('shared', true);
    sharedCount = shared || 0;

    // Get count of generated lines (all lines, including shared and unshared)
    const { count: generated } = await supabase
      .from('rush_lines')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    generatedCount = generated || 0;

    // Get total likes on shared lines
    const { data: sharedLines } = await supabase
      .from('rush_lines')
      .select('likes')
      .eq('user_id', userId)
      .eq('shared', true);
    totalLikes = sharedLines?.reduce((sum, line) => sum + (line.likes || 0), 0) || 0;
  }

  if (action === 'comment') {
    const { count: comments } = await supabase
      .from('line_comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    commentsCount = comments || 0;
  }

  // Check badge conditions
  // First Steps - First generation
  if (action === 'generate' && generatedCount >= 1 && !currentBadges.includes('first_steps')) {
    newBadges.push('first_steps');
  }

  // Social Butterfly - First share
  if (action === 'share' && sharedCount >= 1 && !currentBadges.includes('social_butterfly')) {
    newBadges.push('social_butterfly');
  }

  // Points-based badges (check on any action that might change points)
  if (userStats.points >= 100 && !currentBadges.includes('centurion')) {
    newBadges.push('centurion');
  }

  if (userStats.points >= 500 && !currentBadges.includes('champion')) {
    newBadges.push('champion');
  }

  if (userStats.points >= 1000 && !currentBadges.includes('legend')) {
    newBadges.push('legend');
  }

  // Generator - 50 generated lines
  if (generatedCount >= 50 && !currentBadges.includes('generator')) {
    newBadges.push('generator');
  }

  // Sharer - 10 shared lines
  if (sharedCount >= 10 && !currentBadges.includes('sharer')) {
    newBadges.push('sharer');
  }

  // Liked - 10 total likes on shared lines
  if (totalLikes >= 10 && !currentBadges.includes('liked')) {
    newBadges.push('liked');
  }

  // Commenter - 10 comments posted
  if (action === 'comment' && commentsCount >= 10 && !currentBadges.includes('commenter')) {
    newBadges.push('commenter');
  }

  // Weekly Winner and Top Contributor badges are checked during weekly reset
  // They require checking the leaderboard, so they're handled separately

  // Award new badges
  if (newBadges.length > 0) {
    const updatedBadges = [...currentBadges, ...newBadges];
    await supabase
      .from('users')
      .update({ badges: updatedBadges })
      .eq('id', userId);
  }

  return newBadges;
}



