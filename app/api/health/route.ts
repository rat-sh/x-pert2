import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Health-check endpoint used to keep the Render free-tier service alive.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 },
  );
}
