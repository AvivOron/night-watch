'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Clock, Monitor, Star } from 'lucide-react';
import type { CelestialEvent } from '@/types/astronomy';
import { GlassCard } from '@/components/ui/GlassCard';
import { VisibilityDot } from '@/components/ui/VisibilityDot';

interface RecommendationCardProps {
  event: CelestialEvent | null;
  loading?: boolean;
}

const BODY_EMOJIS: Record<string, string> = {
  Moon: '🌙',
  Venus: '✨',
  Mars: '🔴',
  Jupiter: '🪐',
  Saturn: '💫',
  Mercury: '⚫',
  Uranus: '🔵',
  Neptune: '💙',
  M31: '🌌',
  M42: '🌠',
  M45: '⭐',
  M13: '✦',
};

function formatDuration(mins?: number): string {
  if (!mins) return '';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function RecommendationCard({ event, loading }: RecommendationCardProps) {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(pointer: fine)');
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  if (loading) {
    return (
      <GlassCard className="p-5 space-y-3 animate-pulse">
        <div className="h-6 w-1/3 rounded-full bg-white/10" />
        <div className="h-10 w-2/3 rounded-full bg-white/10" />
        <div className="h-4 w-full rounded-full bg-white/10" />
      </GlassCard>
    );
  }

  if (!event) {
    return (
      <GlassCard className="p-5 text-center space-y-2">
        <Star className="w-8 h-8 text-white/30 mx-auto" />
        <p className="text-white/50 text-sm">No visible objects in your window tonight</p>
        <p className="text-white/30 text-xs">Try recalibrating or check back after sunset</p>
      </GlassCard>
    );
  }

  const { body, time, visibilityScore, durationInWindow } = event;
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const now = new Date();
  const visibleUntil =
    durationInWindow && event.type === 'visible'
      ? new Date(time.getTime() + durationInWindow * 60000)
      : null;
  const isVisibleNow = event.type === 'visible' && time <= now && (!!visibleUntil ? now < visibleUntil : true);

  return (
    <GlassCard
      glow={visibilityScore === 'excellent'}
      className="p-5 relative overflow-hidden"
    >
      {/* Gold gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">
              {isVisibleNow ? 'Visible Now' : 'Best Tonight'}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{BODY_EMOJIS[body.name] ?? '⭐'}</span>
              <div>
                <h2 className="text-2xl font-bold text-white">{body.displayName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <VisibilityDot score={visibilityScore} showLabel />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/60 text-sm leading-relaxed">{body.description}</p>

        <div className="flex items-center gap-4 text-sm">
          {!isVisibleNow && (
            <div className="flex items-center gap-1.5 text-white/60">
              <Clock className="w-4 h-4 text-gold-400" />
              <span>At {timeStr}</span>
            </div>
          )}
          {durationInWindow && (
            <div className="flex items-center gap-1.5 text-white/60">
              <span className="text-gold-400">◷</span>
              <span>For {formatDuration(durationInWindow)}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push(isDesktop ? `/window-view?body=${body.name}` : `/sky?body=${body.name}`)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 font-medium text-sm active:scale-95 transition-transform"
        >
          {isDesktop ? <Monitor className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          {isDesktop ? 'View in Window' : 'View in AR Mode'}
        </button>
      </div>
    </GlassCard>
  );
}
