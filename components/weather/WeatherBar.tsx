import { Cloud, CloudSun, Sun, CloudRain } from 'lucide-react';
import type { WeatherData } from '@/types/weather';

interface WeatherBarProps {
  weather: WeatherData | null;
  loading?: boolean;
}

function WeatherIcon({ cloud, className }: { cloud: number; className?: string }) {
  if (cloud < 10) return <Sun className={className} />;
  if (cloud < 40) return <CloudSun className={className} />;
  if (cloud < 80) return <Cloud className={className} />;
  return <CloudRain className={className} />;
}

const QUALITY_COLORS: Record<string, string> = {
  excellent: 'text-emerald-400',
  good: 'text-gold-400',
  fair: 'text-orange-400',
  poor: 'text-red-400',
};

export function WeatherBar({ weather, loading }: WeatherBarProps) {
  if (loading && !weather) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-navy-900/60 backdrop-blur-md">
        <div className="h-4 w-32 rounded-full bg-white/10 animate-pulse" />
        <div className="h-4 w-20 rounded-full bg-white/10 animate-pulse" />
      </div>
    );
  }

  if (!weather) return null;

  const qualityColor = QUALITY_COLORS[weather.seeingQuality] ?? 'text-white/60';

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-navy-900/60 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <WeatherIcon cloud={weather.currentCloudCover} className="w-4 h-4 text-white/60" />
        <span className="text-white/60 text-sm">{weather.currentCloudCover}% cloud cover</span>
      </div>
      <span className={`text-sm font-medium ${qualityColor}`}>
        {weather.seeingLabel}
      </span>
    </div>
  );
}
