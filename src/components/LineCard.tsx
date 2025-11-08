import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Share2, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LineCardProps {
  reply: string;
  index: number;
  onShare?: () => void;
  isSharing?: boolean;
}

const LineCard = ({ reply, index, onShare, isSharing }: LineCardProps) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(reply);
    toast({
      title: "Copied!",
      description: "Line copied to clipboard 🚀",
    });
  };

  return (
    <Card className="p-6 gradient-card hover:shadow-neon transition-smooth">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-medium text-muted-foreground">Option {index + 1}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="hover:bg-primary hover:text-primary-foreground transition-smooth"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {onShare && (
            <Button
              variant="outline"
              size="icon"
              onClick={onShare}
              disabled={isSharing}
              className="hover:bg-accent hover:text-accent-foreground transition-smooth"
            >
              <Share2 className={`h-4 w-4 ${isSharing ? 'animate-pulse' : ''}`} />
            </Button>
          )}
        </div>
      </div>
      
      <p className="text-lg leading-relaxed">{reply}</p>
    </Card>
  );
};

export default LineCard;