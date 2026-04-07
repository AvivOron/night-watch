type FilterType = 'all' | 'planet' | 'moon' | 'dso';

interface TimelineFiltersProps {
  active: FilterType;
  onChange: (f: FilterType) => void;
}

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'planet', label: 'Planets' },
  { id: 'moon', label: 'Moon' },
  { id: 'dso', label: 'Deep Sky' },
];

export function TimelineFilters({ active, onChange }: TimelineFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {FILTERS.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={[
            'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
            active === f.id
              ? 'bg-gold-400 text-navy-950'
              : 'bg-white/10 text-white/60 border border-white/10',
          ].join(' ')}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export type { FilterType };
