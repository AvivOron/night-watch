interface TimeMarkerProps {
  x: number;
}

export function TimeMarker({ x }: TimeMarkerProps) {
  return (
    <div
      className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-10"
      style={{ left: x }}
    >
      <div className="w-2 h-2 rounded-full bg-gold-400 -translate-x-1/2 ring-2 ring-gold-400/30" />
      <div className="w-px flex-1 bg-gold-400/60" />
      <span className="text-[9px] text-gold-400 font-mono -translate-x-1/2 bg-navy-950 px-1 rounded">
        NOW
      </span>
    </div>
  );
}
