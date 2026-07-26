/**
 * Holds the JWT access token in memory only (per proposal 3.6: "The
 * access token is stored in memory to reduce exposure to attacks").
 * It is deliberately never written to localStorage/sessionStorage.
 * The refresh token lives in an httpOnly cookie set by our own
 * app/api/auth/* route handlers, which proxy to the Django backend —
 * client-side JS never sees it.
 */
let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}
