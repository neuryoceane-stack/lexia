/** Rate limit en mémoire : max tentatives par IP par fenêtre. */

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function checkRateLimit(ip: string): { blocked: false } | { blocked: true; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { blocked: false };
  }

  if (now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { blocked: false };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { blocked: true, retryAfter };
  }

  entry.count += 1;
  return { blocked: false };
}

export function resetRateLimit(ip: string): void {
  store.delete(ip);
}
