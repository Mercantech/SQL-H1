const AUTH_BASE = "https://auth.mercantec.tech";
const TOKEN_TIMEOUT_MS = 20_000;

function callbackRedirectUri() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  return "http://localhost:5173/auth/callback";
}

export const authConfig = {
  issuer: AUTH_BASE,
  authorizeUrl: `${AUTH_BASE}/oauth/authorize`,
  tokenUrl: `${AUTH_BASE}/oauth/token`,
  signoutUrl: `${AUTH_BASE}/signout`,
  clientId: import.meta.env.VITE_AUTH_CLIENT_ID || "sqlh1",
  get redirectUri() {
    return callbackRedirectUri();
  },
  apiBase: import.meta.env.VITE_API_BASE_URL || "/api",
  get tokenProxyUrl() {
    return `${import.meta.env.VITE_API_BASE_URL || "/api"}/auth/token`;
  },
};

const KEYS = {
  verifier: "sqlh1_pkce_verifier",
  state: "sqlh1_oauth_state",
  access: "sqlh1_access_token",
  refresh: "sqlh1_refresh_token",
  expiresAt: "sqlh1_expires_at",
  exchangeLock: "sqlh1_oauth_exchange_lock",
  returnTo: "sqlh1_oauth_return_to",
};

/** Kun relative app-stier — undgå open redirect. */
export function safeReturnPath(path: string | null | undefined, fallback = "/") {
  if (!path) return fallback;
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.startsWith("/auth/callback")) return fallback;
  return path;
}

function currentAppPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function randomString(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return base64Url(arr);
}

function base64Url(data: Uint8Array | ArrayBuffer) {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(plain: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
}

export async function beginLogin(returnTo?: string) {
  const verifier = randomString(48);
  const state = randomString(24);
  const challenge = base64Url(await sha256(verifier));
  sessionStorage.setItem(KEYS.verifier, verifier);
  sessionStorage.setItem(KEYS.state, state);
  sessionStorage.removeItem(KEYS.exchangeLock);
  const dest = safeReturnPath(returnTo ?? currentAppPath());
  sessionStorage.setItem(KEYS.returnTo, dest);
  const url = new URL(authConfig.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", authConfig.clientId);
  url.searchParams.set("redirect_uri", authConfig.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  window.location.assign(url.toString());
}

/** Hent og ryd gemt post-login sti. */
export function consumeReturnPath(fallback = "/") {
  const saved = sessionStorage.getItem(KEYS.returnTo);
  sessionStorage.removeItem(KEYS.returnTo);
  return safeReturnPath(saved, fallback);
}

function storeTokens(data: {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}) {
  if (!data.access_token) throw new Error("Token-svar mangler access_token");
  sessionStorage.setItem(KEYS.access, data.access_token);
  if (data.refresh_token) sessionStorage.setItem(KEYS.refresh, data.refresh_token);
  const expiresAt =
    Date.now() + Math.max(30, Number(data.expires_in || 900) - 30) * 1000;
  sessionStorage.setItem(KEYS.expiresAt, String(expiresAt));
}

export function clearTokens() {
  Object.values(KEYS).forEach((k) => sessionStorage.removeItem(k));
}

export function getAccessToken() {
  return sessionStorage.getItem(KEYS.access);
}

export function isLoggedIn() {
  return Boolean(getAccessToken());
}

export function decodeJwtPayload(token = getAccessToken()) {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getUserProfile() {
  const payload = decodeJwtPayload();
  if (!payload?.sub) return null;
  return {
    sub: String(payload.sub),
    name: payload.name ? String(payload.name) : null,
    email: payload.email ? String(payload.email) : null,
  };
}

async function postToken(body: Record<string, string>) {
  const res = await fetch(authConfig.tokenProxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.error_description || data.error || "Token-udveksling fejlede",
    );
  }
  storeTokens(data);
  return data;
}

export async function handleAuthCallback(
  searchParams = new URLSearchParams(window.location.search),
) {
  const error = searchParams.get("error");
  if (error) {
    clearTokens();
    throw new Error(searchParams.get("error_description") || error);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expected = sessionStorage.getItem(KEYS.state);
  const verifier = sessionStorage.getItem(KEYS.verifier);

  if (isLoggedIn() && (!verifier || !expected)) {
    return { already: true };
  }

  if (!code || !state || !expected || state !== expected || !verifier) {
    clearTokens();
    throw new Error("Ugyldigt login-svar. Prøv at logge ind igen.");
  }

  const lock = `${KEYS.exchangeLock}:${code}`;
  if (sessionStorage.getItem(lock) === "done") return { already: true };
  if (sessionStorage.getItem(lock) === "pending") {
    await new Promise((r) => setTimeout(r, 500));
    if (isLoggedIn()) return { already: true };
    throw new Error("Login er allerede i gang.");
  }
  sessionStorage.setItem(lock, "pending");

  try {
    await postToken({
      grant_type: "authorization_code",
      code,
      redirect_uri: authConfig.redirectUri,
      client_id: authConfig.clientId,
      code_verifier: verifier,
    });
    sessionStorage.setItem(lock, "done");
    sessionStorage.removeItem(KEYS.verifier);
    sessionStorage.removeItem(KEYS.state);
    return { ok: true };
  } catch (err) {
    sessionStorage.removeItem(lock);
    throw err;
  }
}

async function refreshAccessToken() {
  const refresh = sessionStorage.getItem(KEYS.refresh);
  if (!refresh) throw new Error("Ingen refresh-token");
  await postToken({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: authConfig.clientId,
  });
}

export async function ensureFreshAccessToken() {
  const token = getAccessToken();
  if (!token) return null;
  const expiresAt = Number(sessionStorage.getItem(KEYS.expiresAt) || 0);
  if (Date.now() < expiresAt) return token;
  try {
    await refreshAccessToken();
    return getAccessToken();
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http")
    ? path
    : `${authConfig.apiBase}${path.startsWith("/") ? path : `/${path}`}`;

  async function once(forceRefresh = false) {
    if (forceRefresh) await refreshAccessToken();
    else await ensureFreshAccessToken();
    const token = getAccessToken();
    if (!token) {
      const err = new Error("Ikke logget ind") as Error & { status?: number };
      err.status = 401;
      throw err;
    }
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(url, {
      ...options,
      headers,
      signal: options.signal || AbortSignal.timeout(60_000),
    });
  }

  let res = await once(false);
  if (res.status === 401) {
    try {
      res = await once(true);
    } catch {
      clearTokens();
      const err = new Error("Session udløbet — log ind igen") as Error & {
        status?: number;
      };
      err.status = 401;
      throw err;
    }
  }
  return res;
}

export function logout() {
  clearTokens();
  const returnUrl = encodeURIComponent(window.location.origin + "/");
  window.location.assign(`${authConfig.signoutUrl}?returnUrl=${returnUrl}`);
}

export async function publicFetch(path: string) {
  const url = `${authConfig.apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url);
}
