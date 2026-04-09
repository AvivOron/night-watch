import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://avivo.dev/night-watch'),
  title: {
    default: 'Night Watch — See What\'s Visible in Your Sky Tonight',
    template: '%s | Night Watch',
  },
  description: 'See exactly what celestial objects are visible through your window tonight. Personalized stargazing with AR overlay, real-time celestial positions, and weather-adjusted visibility.',
  keywords: ['stargazing', 'astronomy', 'night sky', 'celestial', 'planets', 'stars', 'AR', 'augmented reality', 'telescope'],
  manifest: '/night-watch/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Night Watch',
  },
  openGraph: {
    type: 'website',
    siteName: 'Night Watch',
    title: 'Night Watch — See What\'s Visible in Your Sky Tonight',
    description: 'See exactly what celestial objects are visible through your window tonight. Personalized stargazing with AR overlay and real-time celestial positions.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Night Watch — See What\'s Visible in Your Sky Tonight',
    description: 'See exactly what celestial objects are visible through your window tonight.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#020817',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} h-full`}>
      <body className="h-full overflow-x-hidden">{children}</body>
    </html>
  );
}
