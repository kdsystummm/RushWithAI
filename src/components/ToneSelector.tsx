import { Button } from '@/components/ui/button';

type ToneType = 'flirty' | 'funny' | 'teasing' | 'savage' | 'polite' | 'smart' | 'emotional' | 'respectful';

interface ToneSelectorProps {
  selectedTone: ToneType;
  onToneChange: (tone: ToneType) => void;
}

const tones = [
  { value: 'flirty', emoji: '😏', label: 'Flirty', description: 'Smooth & Charming' },
  { value: 'funny', emoji: '😂', label: 'Funny', description: 'Witty & Humorous' },
  { value: 'teasing', emoji: '😜', label: 'Teasing', description: 'Playful Banter' },
  { value: 'savage', emoji: '😎', label: 'Savage', description: 'Bold & Direct' },
  { value: 'polite', emoji: '😊', label: 'Polite', description: 'Kind & Respectful' },
  { value: 'smart', emoji: '🤓', label: 'Smart', description: 'Intellectual' },
  { value: 'emotional', emoji: '💔', label: 'Emotional', description: 'Deep & Sincere' },
  { value: 'respectful', emoji: '🙏', label: 'Respectful', description: 'Thoughtful' },
];

const ToneSelector = ({ selectedTone, onToneChange }: ToneSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tones.map((tone) => (
        <Button
          key={tone.value}
          variant={selectedTone === tone.value ? 'default' : 'outline'}
          className={`h-auto flex-col py-3 transition-smooth ${
            selectedTone === tone.value
              ? 'bg-primary text-primary-foreground shadow-neon border-0'
              : 'hover:border-primary hover:bg-primary/10'
          }`}
          onClick={() => onToneChange(tone.value as ToneType)}
        >
          <span className="text-2xl mb-1">{tone.emoji}</span>
          <span className="font-semibold text-xs">{tone.label}</span>
          <span className="text-[10px] opacity-70 mt-0.5">{tone.description}</span>
        </Button>
      ))}
    </div>
  );
};

export default ToneSelector;
