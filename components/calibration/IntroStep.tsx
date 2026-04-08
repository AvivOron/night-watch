import { Telescope, MapPin, Compass } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface IntroStepProps {
  onNext: () => void;
  isDesktop?: boolean;
}

export function IntroStep({ onNext, isDesktop = false }: IntroStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 mx-auto rounded-full bg-gold-400/20 flex items-center justify-center mb-6">
          <Telescope className="w-10 h-10 text-gold-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Calibrate Your Sky</h1>
        <p className="text-white/60 text-lg leading-relaxed max-w-sm mx-auto">
          {isDesktop
            ? "Night Watch is built for mobile sensors and camera. On desktop we'll set a simplified viewing window."
            : "We'll map exactly what's visible from your window or balcony. Takes about 30 seconds."}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <GlassCard className="p-4 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-gold-400/20 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{isDesktop ? 'Choose a facing direction' : 'Sweep left and right'}</p>
            <p className="text-white/50 text-sm mt-0.5">
              {isDesktop
                ? 'Set the center direction and width of the view from your desktop window.'
                : 'Pan your phone across your view to map the horizontal span'}
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-gold-400/20 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{isDesktop ? 'Set your visible height' : 'Tilt up and down'}</p>
            <p className="text-white/50 text-sm mt-0.5">
              {isDesktop
                ? 'Choose the lowest and highest altitude you can actually see.'
                : 'Tilt your phone from the horizon to the top of your window'}
            </p>
          </div>
        </GlassCard>
      </div>

      <button
        onClick={onNext}
        className="w-full max-w-sm py-4 rounded-2xl bg-gold-400 text-navy-950 font-bold text-lg active:scale-95 transition-transform"
      >
        Start Calibration
      </button>
    </div>
  );
}
