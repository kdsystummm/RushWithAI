// Badge definitions and award logic

export type BadgeId = 
  | 'first_steps'      // Generate first line
  | 'social_butterfly' // Share first line
  | 'centurion'        // Reach 100 points
  | 'champion'         // Reach 500 points
  | 'legend'           // Reach 1000 points
  | 'weekly_winner'    // Win weekly leaderboard
  | 'commenter'        // Post 10 comments
  | 'generator'        // Generate 50 lines
  | 'sharer'           // Share 10 lines
  | 'liked'            // Get 10 likes on shared lines
  | 'top_contributor'; // Top 3 in weekly leaderboard

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const BADGES: Record<BadgeId, Badge> = {
  first_steps: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Generated your first line',
    emoji: '👶',
    rarity: 'common',
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Shared your first line',
    emoji: '🦋',
    rarity: 'common',
  },
  centurion: {
    id: 'centurion',
    name: 'Centurion',
    description: 'Reached 100 points',
    emoji: '💯',
    rarity: 'rare',
  },
  champion: {
    id: 'champion',
    name: 'Champion',
    description: 'Reached 500 points',
    emoji: '🏆',
    rarity: 'epic',
  },
  legend: {
    id: 'legend',
    name: 'Legend',
    description: 'Reached 1000 points',
    emoji: '👑',
    rarity: 'legendary',
  },
  weekly_winner: {
    id: 'weekly_winner',
    name: 'Weekly Winner',
    description: 'Won the weekly leaderboard',
    emoji: '⭐',
    rarity: 'epic',
  },
  commenter: {
    id: 'commenter',
    name: 'Commenter',
    description: 'Posted 10 comments',
    emoji: '💬',
    rarity: 'common',
  },
  generator: {
    id: 'generator',
    name: 'Generator',
    description: 'Generated 50 lines',
    emoji: '⚡',
    rarity: 'rare',
  },
  sharer: {
    id: 'sharer',
    name: 'Sharer',
    description: 'Shared 10 lines',
    emoji: '📤',
    rarity: 'rare',
  },
  liked: {
    id: 'liked',
    name: 'Liked',
    description: 'Got 10 likes on shared lines',
    emoji: '❤️',
    rarity: 'epic',
  },
  top_contributor: {
    id: 'top_contributor',
    name: 'Top Contributor',
    description: 'Top 3 in weekly leaderboard',
    emoji: '🥇',
    rarity: 'legendary',
  },
};

export const getBadgeEmoji = (badgeId: BadgeId): string => {
  return BADGES[badgeId]?.emoji || '🏅';
};

export const getBadgeName = (badgeId: BadgeId): string => {
  return BADGES[badgeId]?.name || 'Unknown Badge';
};

export const getRarityColor = (rarity: Badge['rarity']): string => {
  switch (rarity) {
    case 'common':
      return 'text-gray-500';
    case 'rare':
      return 'text-blue-500';
    case 'epic':
      return 'text-purple-500';
    case 'legendary':
      return 'text-yellow-500';
    default:
      return 'text-gray-500';
  }
};



