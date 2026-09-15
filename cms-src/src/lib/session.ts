// ── Operator session ──────────────────────────────────────────
// Server-only. Never import from a "use client" module: it reads cookies and
// the content service's address, neither of which belongs in the bundle.
//
// The session IS the content service's access token. We do not mint our own —
// a second token format would mean two things to expire and two to revoke.

import type { NextResponse } from "next/server"

export const ACCESS_COOKIE = "valeo_cms_access"
export const REFRESH_COOKIE = "valeo_cms_refresh"
export const USER_COOKIE = "valeo_cms_user"

/** Display identity. Authorisation is never decided from this — the access token is. */
export interface SessionUser {
    id: string
    email: string
    name: string
    avatar?: string
}

// The content service issues tokens with a 1825-day lifetime (matching the legacy
// Django issuer). We deliberately do NOT hold a browser session that long: the
// cookie expires in a week and the operator signs in again. Shortening this is
// safe; lengthening it past the token's own TTL is not.
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

const secure = process.env.NODE_ENV === "production"

export const CONTENT_API_BASE =
    process.env.CONTENT_API_BASE ?? "https://contentservice-dev.feelvaleo.com/api/v1/admin"

/**
 * Where the auth endpoints live. They sit at /api/v1/validate/... — a different
 * prefix from CONTENT_API_BASE's /api/v1/admin — so we take the origin rather
 * than string-trimming a path that is not guaranteed to be a suffix.
 */
export function contentServiceOrigin(): string {
    const explicit = process.env.CONTENT_API_ORIGIN
    if (explicit) return explicit.replace(/\/+$/, "")
    return new URL(CONTENT_API_BASE).origin
}

// ── Development bypass ────────────────────────────────────────
// Google sign-in cannot complete on localhost unless the origin is listed under
// the OAuth client's "Authorized JavaScript origins", and it is not. So local
// work meant hand-setting two cookies in the devtools console, which is both
// tedious and the kind of trick that gets pasted into a shared doc and then
// into somewhere it should never run.
//
// ⚠️ TWO INDEPENDENT LOCKS, BOTH REQUIRED. The env flag alone is not enough:
// a flag can be copied into a production environment by accident, and then the
// whole app is open. The NODE_ENV check makes that harmless, because a
// production BUILD can never take this path whatever the flag says.
//
//   1. NODE_ENV !== "production"   — structural, not configurable at runtime
//   2. AUTH_DEV_BYPASS === "1"     — explicit opt-in, so a plain `npm run dev`
//                                    is still gated by default
//
// What it does NOT do: mint a content-service token. The session IS that token,
// so a bypassed session reads the biomarker, panel and build-your-own screens
// fine — those are Postgres and LOINC, neither of which needs one — while every
// content-service call still 401s. That is honest rather than convenient.
//
// For the screens that DO need the service (listings, the master sheet), use the
// escape hatch the proxy already has rather than a second one here:
//   CONTENT_API_TOKEN=<a real token>
//   CONTENT_API_ALLOW_SHARED_TOKEN=true
// Every write then attributes to that token's user, which is why it is opt-in.

export const DEV_BYPASS_USER: SessionUser = {
    id: "dev-bypass",
    email: "dev@localhost",
    // Named so it is unmistakable in the header and the audit trail. A bypassed
    // session must never look like a real operator.
    name: "Dev bypass (not signed in)",
}

export function isDevBypassEnabled(): boolean {
    return process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_BYPASS === "1"
}

export function setSessionCookies(
    res: NextResponse,
    tokens: { access: string; refresh?: string },
    user: SessionUser,
): void {
    const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: SESSION_MAX_AGE }
    res.cookies.set(ACCESS_COOKIE, tokens.access, base)
    if (tokens.refresh) res.cookies.set(REFRESH_COOKIE, tokens.refresh, base)
    // httpOnly too: the client asks /api/auth/session for its own identity rather
    // than reading a cookie it could edit. It is display data, but a name the user
    // controls ends up in the audit UI looking authoritative.
    res.cookies.set(USER_COOKIE, JSON.stringify(user), base)
}

export function clearSessionCookies(res: NextResponse): void {
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE]) {
        res.cookies.set(name, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 })
    }
}

/**
 * Claims from a Google ID token, for display only.
 *
 * Called ONLY after the content service has verified the very same token — it
 * checks the signature, audience, issuer, expiry and email_verified. Decoding an
 * unverified token to decide anything would be a hole; decoding one that has just
 * been verified, to read the name for an avatar, is not.
 */
export function readIdTokenClaims(idToken: string): { name?: string; picture?: string; email?: string } {
    const payload = idToken.split(".")[1]
    if (!payload) return {}
    try {
        const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
        const claims = JSON.parse(json) as { name?: string; picture?: string; email?: string }
        return { name: claims.name, picture: claims.picture, email: claims.email }
    } catch {
        return {}
    }
}
