'use client';

import { useEffect, useRef, useState } from 'react';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { getAltAz } from '@/lib/astronomy/calculations';
import { CELESTIAL_BODIES } from '@/lib/astronomy/bodies';
import type { CelestialEvent, SkyWindow } from '@/types/astronomy';
import { computeVisibilityScore, isInWindow, minutesInWindowFromNow } from '@/lib/astronomy/visibility';
import { ObjectDetails } from '@/components/recommendation/ObjectDetails';

interface AROverlayProps {
  lat: number;
  lon: number;
  skyWindow: SkyWindow | null;
  targetBody?: string;
}

const FOV_DEGREES = 60;
const BODY_COLORS: Record<string, string> = {
  Moon: '#FFFDE7',
  Venus: '#FFF9C4',
  Mars: '#EF9A9A',
  Jupiter: '#FFE0B2',
  Saturn: '#FFF8E1',
  Mercury: '#B0BEC5',
  Uranus: '#B2EBF2',
  Neptune: '#90CAF9',
  Sirius: '#E3F2FD',
  Canopus: '#FFF8E1',
  Arcturus: '#FFE0B2',
  Vega: '#E1F5FE',
  Capella: '#FFFDE7',
  Rigel: '#E8EAF6',
  Procyon: '#FFFDE7',
  Betelgeuse: '#FFCCBC',
  Aldebaran: '#FFCC80',
  Spica: '#E3F2FD',
  Altair: '#FAFAFA',
  Deneb: '#ECEFF1',
};

export function AROverlay({ lat, lon, skyWindow, targetBody }: AROverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const orientation = useDeviceOrientation();
  const orientationRawRef = orientation.rawRef; // stable ref object, safe to capture in closure
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CelestialEvent | null>(null);
  const hitTargetsRef = useRef<Array<{ x: number; y: number; radius: number; event: CelestialEvent }>>([]);

  // Keep latest props in refs so the draw loop (runs once) can always read current values
  const skyWindowRef = useRef(skyWindow);
  const targetBodyRef = useRef(targetBody);
  useEffect(() => { skyWindowRef.current = skyWindow; }, [skyWindow]);
  useEffect(() => { targetBodyRef.current = targetBody; }, [targetBody]);

  // Start camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true);
          };
          videoRef.current.play();
        }
      } catch (e) {
        setCameraError(e instanceof Error ? e.message : 'Camera unavailable');
      }
    }
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  // Draw loop — runs once, reads everything from refs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hitTargetsRef.current = [];

      const deviceHeading = orientationRawRef.current.heading ?? 0;
      const centerAlt = orientationRawRef.current.altitude ?? 0;
      const sw = skyWindowRef.current;
      const tb = targetBodyRef.current;
      const now = new Date();
      const pxPerDegree = canvas.width / FOV_DEGREES;


      for (const body of CELESTIAL_BODIES) {
        const altAz = getAltAz(body.name, lat, lon, now);

        let azDiff = altAz.azimuth - deviceHeading;
        if (azDiff > 180) azDiff -= 360;
        if (azDiff < -180) azDiff += 360;
        const altDiff = altAz.altitude - centerAlt;

        if (Math.abs(azDiff) > FOV_DEGREES / 2 + 5 || Math.abs(altDiff) > FOV_DEGREES / 2 + 5) continue;

        const x = canvas.width / 2 + azDiff * pxPerDegree;
        const y = canvas.height / 2 - altDiff * pxPerDegree;

        const inWindow = sw ? isInWindow(altAz, sw) : false;
        const isTarget = body.name === tb;
        const color = BODY_COLORS[body.name] ?? '#FFFFFF';

        const dotR = body.magnitude < 0 ? 8 : body.magnitude < 3 ? 5 : 3;
        const durationInWindow = sw && inWindow
          ? minutesInWindowFromNow(body.name, lat, lon, sw, now)
          : undefined;
        const event: CelestialEvent = {
          id: `${body.name}-ar-${Math.round(now.getTime() / 60000)}`,
          body,
          type: 'visible',
          time: now,
          altAz,
          inSkyWindow: inWindow,
          visibilityScore: sw
            ? computeVisibilityScore(altAz, sw, 0, 0, body.magnitude, body.category)
            : 'not-visible',
          durationInWindow,
        };

        hitTargetsRef.current.push({
          x,
          y,
          radius: Math.max(18, dotR + 10),
          event,
        });

        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (inWindow || isTarget) {
          ctx.beginPath();
          ctx.arc(x, y, dotR + 6, 0, Math.PI * 2);
          ctx.strokeStyle = isTarget ? '#F4C842' : 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        if (body.magnitude < 6) {
          ctx.font = '12px system-ui';
          ctx.fillStyle = inWindow ? '#F4C842' : 'rgba(255,255,255,0.8)';
          ctx.textAlign = 'center';
          ctx.fillText(body.displayName, x, y - dotR - 6);
        }
      }

      // Sky window boundary
      if (sw) {
        const winMinX = canvas.width / 2 + (sw.azimuthMin - deviceHeading) * pxPerDegree;
        const winMaxX = canvas.width / 2 + (sw.azimuthMax - deviceHeading) * pxPerDegree;
        const winMinY = canvas.height / 2 - (sw.altitudeMin - centerAlt) * pxPerDegree;
        const winMaxY = canvas.height / 2 - (sw.altitudeMax - centerAlt) * pxPerDegree;

        ctx.strokeStyle = 'rgba(244,200,66,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(winMinX, winMaxY, winMaxX - winMinX, winMinY - winMaxY);
        ctx.setLineDash([]);

        const cs = 12;
        ctx.strokeStyle = 'rgba(244,200,66,0.8)';
        ctx.lineWidth = 2;
        [[winMinX, winMaxY], [winMaxX, winMaxY], [winMinX, winMinY], [winMaxX, winMinY]].forEach(
          ([cx2, cy2], i) => {
            const sx = i % 2 === 0 ? 1 : -1;
            const sy = i < 2 ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(cx2! + sx * cs, cy2!);
            ctx.lineTo(cx2!, cy2!);
            ctx.lineTo(cx2!, cy2! + sy * cs);
            ctx.stroke();
          }
        );
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  // lat/lon are stable — draw loop runs once and reads everything else via refs
  // orientationRawRef is a stable ref object — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, orientationRawRef]);

  if (cameraError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy-950 text-center px-6">
        <div className="space-y-4">
          <p className="text-white/60 text-lg">Camera unavailable</p>
          <p className="text-white/40 text-sm">{cameraError}</p>
          <p className="text-white/30 text-xs">AR mode requires HTTPS and camera permission</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        style={{ opacity: cameraReady ? 1 : 0 }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          let best: { distance: number; event: CelestialEvent } | null = null;
          for (const target of hitTargetsRef.current) {
            const distance = Math.hypot(target.x - x, target.y - y);
            if (distance > target.radius) continue;
            if (!best || distance < best.distance) {
              best = { distance, event: target.event };
            }
          }

          if (best) {
            setSelectedEvent(best.event);
          }
        }}
      />
      {!cameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy-950">
          <div className="text-white/50 animate-pulse">Starting camera…</div>
        </div>
      )}
      {selectedEvent && (
        <ObjectDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
