import { ImageResponse } from 'next/og';

export const alt = 'Night Watch — Your Personal Sky Guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020817',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Star dots */}
        {[
          [80, 60], [200, 120], [350, 40], [500, 90], [670, 55], [820, 130],
          [950, 70], [1100, 50], [140, 280], [420, 310], [600, 200], [780, 260],
          [1020, 200], [300, 500], [700, 450], [900, 510], [1100, 400],
          [60, 400], [450, 580], [1050, 560],
        ].map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              borderRadius: '50%',
              background: i % 5 === 0 ? '#f4c842' : 'rgba(255,255,255,0.6)',
            }}
          />
        ))}

        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,200,66,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Telescope icon (simplified SVG) */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'rgba(244,200,66,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f4c842" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="11" r="3" />
            <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 11h3M19 11h3M4.22 17.78l2.12-2.12M17.66 6.34l2.12-2.12" />
          </svg>
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-2px',
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          Night Watch
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: '#f4c842',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            marginBottom: 32,
          }}
        >
          Your Sky, Personalized
        </div>

        <div
          style={{
            fontSize: 24,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          See exactly which planets, stars, and galaxies are visible through your window — right now.
        </div>
      </div>
    ),
    size,
  );
}
