interface LoadingPulseProps {
  className?: string;
  lines?: number;
}

export function LoadingPulse({ className = '', lines = 1 }: LoadingPulseProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-full bg-white/10 animate-pulse"
          style={{ width: i === 0 ? '100%' : `${60 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 animate-pulse">
      <div className="h-5 w-1/2 rounded-full bg-white/10" />
      <div className="h-4 w-3/4 rounded-full bg-white/10" />
      <div className="h-4 w-2/3 rounded-full bg-white/10" />
    </div>
  );
}
