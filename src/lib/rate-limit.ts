/** Rate limit en mémoire : max tentatives par IP par fenêtre. */
const store = new Map<
  string,
  { count: number; resetAt: number }
>();

const WINDOW_MS = 60 * 60 * 1000; // 1 heure
const MAX_ATTEMPTS = 5;

export function checkLoginRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}
