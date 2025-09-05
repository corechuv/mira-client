// src/lib/cookies.ts

export type CookieOptions = {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
};

const isBrowser = typeof document !== "undefined";

export function setCookie(name: string, value: string, opts: CookieOptions = {}) {
  if (!isBrowser) return;
  const {
    days = 365,
    path = "/",
    domain,
    sameSite = "Lax",
    secure = (typeof location !== "undefined" && location.protocol === "https:")
  } = opts;

  const expires =
    typeof days === "number"
      ? "; Expires=" + new Date(Date.now() + days * 864e5).toUTCString()
      : "";

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; Path=${path}`;
  if (domain) cookie += `; Domain=${domain}`;
  if (secure || sameSite === "None") cookie += `; Secure`;
  cookie += `; SameSite=${sameSite}`;

  document.cookie = cookie;
}

export function getCookie(name: string): string | null {
  if (!isBrowser) return null;
  const nameEQ = encodeURIComponent(name) + "=";
  const parts = document.cookie.split(";");
  for (let c of parts) {
    c = c.trim();
    if (c.startsWith(nameEQ)) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
}

export function deleteCookie(name: string, path = "/", domain?: string) {
  if (!isBrowser) return;
  let cookie = `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}`;
  if (domain) cookie += `; Domain=${domain}`;
  cookie += `; SameSite=Lax`;
  document.cookie = cookie;
}
