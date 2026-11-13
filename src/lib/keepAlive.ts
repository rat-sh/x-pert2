/**
 * keepAlive.ts
 *
 * Self-pinger that prevents Render free-tier services from spinning down.
 * Imported in app/layout.tsx (server component) so it initializes once per process.
 */

const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const globalForKeepAlive = globalThis as typeof globalThis & {
  __keepAliveStarted?: boolean;
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  const port = process.env.PORT ?? '3000';
  return `http://localhost:${port}`;
}

async function ping(): Promise<void> {
  const url = `${getBaseUrl()}/api/health`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      console.log(`[keep-alive] ✅ ${new Date().toISOString()} — ${url} → ${res.status}`);
    } else {
      console.warn(`[keep-alive] ⚠️  ${new Date().toISOString()} — ${url} → ${res.status}`);
    }
  } catch (err) {
    console.error(`[keep-alive] ❌ ${new Date().toISOString()} — failed to ping ${url}:`, err);
  }
}

export function startKeepAlive(): void {
  if (typeof window !== 'undefined') return;
  if (globalForKeepAlive.__keepAliveStarted) return;

  globalForKeepAlive.__keepAliveStarted = true;
  console.log(`[keep-alive] 🚀 Started — pinging /api/health every ${PING_INTERVAL_MS / 60_000} minutes`);

  setTimeout(ping, 5_000);
  setInterval(ping, PING_INTERVAL_MS);
}
