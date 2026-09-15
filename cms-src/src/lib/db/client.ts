// ── Postgres client (Neon) ────────────────────────────────────
// Lazy on purpose. `neon()` throws when DATABASE_URL is unset, and Next
// evaluates top-level module code at BUILD time — so initialising eagerly
// crashes `next build` on any deploy where the env var is not yet present.
//
// A plain function rather than a Proxy wrapper: a Proxy intercepts the property
// and method checks that libraries do on a db handle, and the failure mode is a
// hang with no error.

import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

let _sql: NeonQueryFunction<false, false> | null = null

export function getSql(): NeonQueryFunction<false, false> {
    if (!_sql) {
        const url = process.env.DATABASE_URL
        if (!url) throw new Error("DATABASE_URL is not set — the Neon integration is not linked.")
        _sql = neon(url)
    }
    return _sql
}

/** True when the database is configured at all, for callers that degrade. */
export const hasDb = () => !!process.env.DATABASE_URL
