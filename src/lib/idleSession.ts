export const IDLE_LIMIT_MS = 10 * 60 * 1000;
export const SESSION_REFRESH_INTERVAL_MS = 60 * 1000;

export function hasSessionGoneIdle(
  lastActivityAt: number,
  now: number,
): boolean {
  return now - lastActivityAt >= IDLE_LIMIT_MS;
}

export function shouldRefreshSession(
  lastRefreshAt: number,
  now: number,
): boolean {
  return now - lastRefreshAt >= SESSION_REFRESH_INTERVAL_MS;
}
