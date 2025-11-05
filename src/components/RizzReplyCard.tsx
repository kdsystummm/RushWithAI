import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RizzReplyCardProps {
  reply: string;
  score: number;
  index: number;
}

const RizzReplyCard = ({ reply, score, index }: RizzReplyCardProps) => {
  const { toast } = useToast();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-primary';
    if (score >= 75) return 'text-accent';
    return 'text-muted-foreground';
  };

  const getScoreRemark = (score: number) => {
    if (score >= 95) return '🔥 Legendary rizz!';
    if (score >= 90) return '🔥 Dangerous charm alert!';
    if (score >= 80) return '✨ Smooth operator';
    if (score >= 70) return '💫 Solid choice';
    return '🎯 Good start';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reply);
    toast({
      title: "Copied to clipboard!",
      description: "Reply is ready to send 🚀",
    });
  };

  return (
    <Card className="p-6 gradient-card shadow-card hover:shadow-primary transition-smooth">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-sm font-medium text-muted-foreground">Option {index + 1}</span>
          <div className={`text-3xl font-bold ${getScoreColor(score)} mt-1`}>
            {score}
          </div>
          <p className="text-sm mt-1">{getScoreRemark(score)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="hover:bg-primary hover:text-white transition-smooth"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hover:bg-primary hover:text-white transition-smooth"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <p className="text-lg leading-relaxed">{reply}</p>
    </Card>
  );
};

export default RizzReplyCard;
