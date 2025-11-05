import { Button } from '@/components/ui/button';

type ToneType = 'flirty' | 'funny' | 'teasing' | 'dominant' | 'romantic';

interface ToneSelectorProps {
  selectedTone: ToneType;
  onToneChange: (tone: ToneType) => void;
}

const tones = [
  { value: 'flirty', emoji: '😏', label: 'Romantic Lover', description: 'Smooth & Charming' },
  { value: 'funny', emoji: '😂', label: 'Funny Guy', description: 'Meme Energy' },
  { value: 'teasing', emoji: '😈', label: 'Teasing Devil', description: 'Playful & Risky' },
  { value: 'dominant', emoji: '💪', label: 'Alpha', description: 'Confident & Short' },
  { value: 'romantic', emoji: '❤️', label: 'Smooth Operator', description: 'Calm & Cool' },
];

const ToneSelector = ({ selectedTone, onToneChange }: ToneSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tones.map((tone) => (
        <Button
          key={tone.value}
          variant={selectedTone === tone.value ? 'default' : 'outline'}
          className={`h-auto flex-col py-4 transition-smooth ${
            selectedTone === tone.value
              ? 'gradient-primary text-white shadow-primary border-0'
              : 'hover:border-primary hover:shadow-card'
          }`}
          onClick={() => onToneChange(tone.value as ToneType)}
        >
          <span className="text-3xl mb-2">{tone.emoji}</span>
          <span className="font-semibold text-sm">{tone.label}</span>
          <span className="text-xs opacity-80 mt-1">{tone.description}</span>
        </Button>
      ))}
    </div>
  );
};

export default ToneSelector;
