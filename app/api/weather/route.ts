import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('hourly', 'cloud_cover,visibility,precipitation_probability,weather_code');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '16');

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 }, // 30 min cache
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=1800, stale-while-revalidate=300' },
    });
  } catch (e) {
    console.error('Weather fetch error:', e);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 502 });
  }
}
