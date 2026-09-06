import assert from "node:assert/strict";
import test from "node:test";

import {
  IDLE_LIMIT_MS,
  SESSION_REFRESH_INTERVAL_MS,
  hasSessionGoneIdle,
  shouldRefreshSession,
} from "../src/lib/idleSession.ts";

test("a session becomes idle exactly ten minutes after the last activity", () => {
  const lastActivityAt = 1_000;

  assert.equal(hasSessionGoneIdle(lastActivityAt, lastActivityAt + IDLE_LIMIT_MS - 1), false);
  assert.equal(hasSessionGoneIdle(lastActivityAt, lastActivityAt + IDLE_LIMIT_MS), true);
});

test("active sessions are refreshed no more than once per minute", () => {
  const lastRefreshAt = 1_000;

  assert.equal(
    shouldRefreshSession(lastRefreshAt, lastRefreshAt + SESSION_REFRESH_INTERVAL_MS - 1),
    false,
  );
  assert.equal(
    shouldRefreshSession(lastRefreshAt, lastRefreshAt + SESSION_REFRESH_INTERVAL_MS),
    true,
  );
});
