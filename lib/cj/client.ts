import { prisma } from "../prisma";
import { CjApiError } from "./errors";
import type { CjAccessToken, CjEnvelope } from "./types";

/**
 * CJ Dropshipping API v2 client.
 *
 * Responsibilities:
 *  - Auth token lifecycle (getAccessToken / refreshAccessToken) with caching.
 *  - Enforce CJ's global rate limit of 1 request/second (QPS = 1).
 *  - Unwrap the standard `{ code, result, message, data, requestId }` envelope
 *    and throw a typed CjApiError on failure.
 *
 * Docs: https://developers.cjdropshipping.cn/en/api/api2/
 *
 * Token storage: an in-memory cache (L1) backed by the `CjAuth` table (L2) so the
 * token survives restarts and is shared across instances. DB access degrades
 * gracefully — if the `CjAuth` table doesn't exist yet (pre-migration), the client
 * still works using the in-memory cache only.
 */

const BASE_URL = (
  process.env.CJ_API_BASE || "https://developers.cjdropshipping.com/api2.0/v1"
).replace(/\/$/, "");

const API_KEY = process.env.CJ_API_KEY;

// Refresh the access token this many ms before it actually expires.
const EXPIRY_SKEW_MS = 60 * 60 * 1000; // 1 hour

// ── Token cache (in-memory L1 + CjAuth table L2) ──────────────────
interface CachedToken {
  accessToken: string;
  accessExpiresAt: number; // epoch ms
  refreshToken: string;
  refreshExpiresAt: number; // epoch ms
}

let tokenStore: CachedToken | null = null;
let inflightToken: Promise<CachedToken> | null = null;

const CJ_AUTH_ID = "cj"; // single-row pk

async function loadTokenFromDb(): Promise<CachedToken | null> {
  try {
    const row = await prisma.cjAuth.findUnique({ where: { id: CJ_AUTH_ID } });
    if (!row) return null;
    return {
      accessToken: row.accessToken,
      accessExpiresAt: row.accessExpiresAt.getTime(),
      refreshToken: row.refreshToken,
      refreshExpiresAt: row.refreshExpiresAt.getTime(),
    };
  } catch {
    // Table missing (pre-migration) or DB unreachable — fall back to memory.
    return null;
  }
}

async function saveTokenToDb(t: CachedToken): Promise<void> {
  const data = {
    accessToken: t.accessToken,
    refreshToken: t.refreshToken,
    accessExpiresAt: new Date(t.accessExpiresAt),
    refreshExpiresAt: new Date(t.refreshExpiresAt),
  };
  try {
    await prisma.cjAuth.upsert({
      where: { id: CJ_AUTH_ID },
      create: { id: CJ_AUTH_ID, ...data },
      update: data,
    });
  } catch {
    // Persistence is best-effort; in-memory cache still serves the token.
  }
}

// ── 1 QPS throttle ────────────────────────────────────────────────
// Every request is chained onto a single promise so calls run sequentially,
// with at least MIN_GAP_MS between the start of consecutive requests.
const MIN_GAP_MS = 1000;
let throttleChain: Promise<unknown> = Promise.resolve();
let lastStart = 0;

function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = throttleChain.then(async () => {
    const wait = Math.max(0, lastStart + MIN_GAP_MS - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastStart = Date.now();
    return fn();
  });
  // Keep the chain alive even if a call rejects.
  throttleChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function parseExpiry(value: string | undefined, fallbackMs: number): number {
  if (!value) return Date.now() + fallbackMs;
  const t = Date.parse(value);
  return Number.isNaN(t) ? Date.now() + fallbackMs : t;
}

// ── Auth ──────────────────────────────────────────────────────────

async function rawAuthCall<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await throttle(() =>
    fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

  const json = (await res.json()) as CjEnvelope<T>;
  if (!res.ok || !json.result) {
    throw new CjApiError(
      json?.message || `CJ auth request failed (${res.status})`,
      json?.code ?? res.status,
      json?.requestId
    );
  }
  return json.data;
}

async function fetchFreshToken(): Promise<CachedToken> {
  if (!API_KEY) {
    throw new CjApiError(
      "CJ_API_KEY is not set. Add it to your environment.",
      "AUTH_MISSING"
    );
  }

  // Prefer refreshing if we still hold a valid refresh token.
  if (tokenStore && tokenStore.refreshExpiresAt > Date.now()) {
    try {
      const refreshed = await rawAuthCall<CjAccessToken>(
        "/authentication/refreshAccessToken",
        { refreshToken: tokenStore.refreshToken }
      );
      return toCached(refreshed);
    } catch {
      // Refresh failed (e.g. revoked) — fall through to a full login.
    }
  }

  const data = await rawAuthCall<CjAccessToken>(
    "/authentication/getAccessToken",
    { apiKey: API_KEY }
  );
  return toCached(data);
}

function toCached(t: CjAccessToken): CachedToken {
  return {
    accessToken: t.accessToken,
    accessExpiresAt: parseExpiry(t.accessTokenExpiryDate, 15 * 24 * 3600_000),
    refreshToken: t.refreshToken,
    refreshExpiresAt: parseExpiry(t.refreshTokenExpiryDate, 180 * 24 * 3600_000),
  };
}

function isAccessValid(t: CachedToken | null): t is CachedToken {
  return !!t && t.accessExpiresAt - EXPIRY_SKEW_MS > Date.now();
}

/**
 * Resolves a valid token: in-memory → DB → refresh/login. Persists fresh tokens.
 */
async function resolveToken(): Promise<CachedToken> {
  // L2: hydrate from DB if memory is cold.
  if (!tokenStore) {
    const fromDb = await loadTokenFromDb();
    if (fromDb) tokenStore = fromDb;
  }
  if (isAccessValid(tokenStore)) return tokenStore;

  const fresh = await fetchFreshToken();
  await saveTokenToDb(fresh);
  return fresh;
}

/** Returns a valid access token, fetching/refreshing as needed. */
async function getAccessToken(): Promise<string> {
  if (isAccessValid(tokenStore)) return tokenStore.accessToken;
  // De-dupe concurrent token requests.
  if (!inflightToken) {
    inflightToken = resolveToken().finally(() => {
      inflightToken = null;
    });
  }
  tokenStore = await inflightToken;
  return tokenStore.accessToken;
}

// ── Authenticated requests ────────────────────────────────────────

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  opts: { query?: Query; body?: unknown } = {}
): Promise<T> {
  const token = await getAccessToken();

  const res = await throttle(() =>
    fetch(buildUrl(path, opts.query), {
      method,
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": token,
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  );

  let json: CjEnvelope<T>;
  try {
    json = (await res.json()) as CjEnvelope<T>;
  } catch {
    throw new CjApiError(
      `CJ request failed: non-JSON response (${res.status})`,
      res.status
    );
  }

  if (!res.ok || !json.result) {
    throw new CjApiError(
      json?.message || `CJ request failed (${res.status})`,
      json?.code ?? res.status,
      json?.requestId,
      { method, path }
    );
  }
  return json.data;
}

export const cj = {
  getAccessToken,
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown, query?: Query) =>
    request<T>("POST", path, { body, query }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>("PATCH", path, { body }),
  delete: <T>(path: string, query?: Query) =>
    request<T>("DELETE", path, { query }),
};
