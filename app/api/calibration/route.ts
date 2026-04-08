import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import type { CalibrationLogPayload } from '@/types/calibration';

const LOG_DIR = path.join(process.cwd(), '.data');
const LOG_FILE = path.join(LOG_DIR, 'calibration-log.jsonl');

function isValidPayload(payload: unknown): payload is CalibrationLogPayload {
  if (!payload || typeof payload !== 'object') return false;

  const candidate = payload as Partial<CalibrationLogPayload>;
  if (!candidate.skyWindow || typeof candidate.skyWindow !== 'object') return false;

  const {
    name,
    lat,
    lng,
    azimuthMin,
    azimuthMax,
    altitudeMin,
    altitudeMax,
    crossesNorth,
  } = candidate.skyWindow;

  return (
    typeof name === 'string' &&
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    typeof azimuthMin === 'number' &&
    Number.isFinite(azimuthMin) &&
    typeof azimuthMax === 'number' &&
    Number.isFinite(azimuthMax) &&
    typeof altitudeMin === 'number' &&
    Number.isFinite(altitudeMin) &&
    typeof altitudeMax === 'number' &&
    Number.isFinite(altitudeMax) &&
    typeof crossesNorth === 'boolean'
  );
}

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();

    if (!isValidPayload(payload)) {
      return NextResponse.json({ error: 'Invalid calibration payload' }, { status: 400 });
    }

    await mkdir(LOG_DIR, { recursive: true });

    const entry = {
      ...payload,
      recordedAt: payload.recordedAt ?? new Date().toISOString(),
    };

    await appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, 'utf8');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Calibration log error:', error);
    return NextResponse.json({ error: 'Failed to log calibration' }, { status: 500 });
  }
}
