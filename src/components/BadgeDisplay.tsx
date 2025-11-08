import { Badge as BadgeComponent } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getBadgeEmoji, getBadgeName, getRarityColor, type BadgeId, BADGES } from '@/lib/badges';

interface BadgeDisplayProps {
  badgeIds: BadgeId[];
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const BadgeDisplay = ({ badgeIds, size = 'md', showTooltip = true }: BadgeDisplayProps) => {
  if (!badgeIds || badgeIds.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const content = (
    <div className="flex flex-wrap gap-2">
      {badgeIds.map((badgeId) => {
        const badge = BADGES[badgeId];
        if (!badge) return null;

        const badgeElement = (
          <BadgeComponent
            key={badgeId}
            variant="outline"
            className={`${getRarityColor(badge.rarity)} border-current ${sizeClasses[size]}`}
          >
            <span className="mr-1">{badge.emoji}</span>
            {size !== 'sm' && <span>{badge.name}</span>}
          </BadgeComponent>
        );

        if (showTooltip) {
          return (
            <TooltipProvider key={badgeId}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {badgeElement}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return badgeElement;
      })}
    </div>
  );

  return content;
};



