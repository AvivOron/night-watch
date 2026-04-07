import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', glow = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md',
        glow ? 'shadow-gold ring-1 ring-gold-400/30' : '',
        onClick ? 'cursor-pointer active:scale-95 transition-transform' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
