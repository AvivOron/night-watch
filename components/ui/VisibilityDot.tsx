import type { VisibilityScore } from '@/types/astronomy';

interface VisibilityDotProps {
  score: VisibilityScore;
  showLabel?: boolean;
}

const CONFIG: Record<VisibilityScore, { color: string; label: string }> = {
  excellent: { color: 'bg-emerald-400', label: 'Excellent' },
  good: { color: 'bg-gold-400', label: 'Good' },
  low: { color: 'bg-orange-400', label: 'Low' },
  'not-visible': { color: 'bg-white/30', label: 'Not Visible' },
};

export function VisibilityDot({ score, showLabel = false }: VisibilityDotProps) {
  const { color, label } = CONFIG[score];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block w-2 h-2 rounded-full ${color} ${
          score !== 'not-visible' ? 'animate-pulse' : ''
        }`}
      />
      {showLabel && (
        <span className="text-xs text-white/60">{label}</span>
      )}
    </span>
  );
}
