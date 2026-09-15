// ── Typed fetch wrapper ───────────────────────────────────────
// Talks to the same-origin proxy at /api/cms/*, which attaches the bearer
// token server-side. Every non-2xx is thrown as ApiError so callers can show
// the service's own field-level messages instead of inventing their own.

export interface ApiFieldError { field: string; message: string }

export class ApiError extends Error {
    readonly status: number
    readonly code: string
    readonly details: ApiFieldError[]

    constructor(status: number, code: string, message: string, details: ApiFieldError[] = []) {
        super(message)
        this.name = "ApiError"
        this.status = status
        this.code = code
        this.details = details
    }

    /** field -> message, for binding straight onto form inputs. */
    fieldErrors(): Record<string, string> {
        return this.details.reduce<Record<string, string>>((acc, d) => {
            if (d.field) acc[d.field] = d.message
            return acc
        }, {})
    }
}

const BASE = "/api/cms"

// A request that never answers must FAIL, not hang the Save spinner forever. 20s is
// far above the slowest observed upstream (~700ms per write) while still short enough
// that an operator sees an error instead of assuming the save landed.
const TIMEOUT_MS = 20_000

/** The caller's signal (if any) and the timeout, merged — portable, no AbortSignal.any. */
function deadline(signal?: AbortSignal): { signal: AbortSignal; done: () => void } {
    const ctrl = new AbortController()
    const timer = setTimeout(
        () => ctrl.abort(new DOMException("The request timed out.", "TimeoutError")), TIMEOUT_MS)
    if (signal?.aborted) ctrl.abort(signal.reason)
    else signal?.addEventListener("abort", () => ctrl.abort(signal.reason), { once: true })
    return { signal: ctrl.signal, done: () => clearTimeout(timer) }
}

const RETRYABLE = new Set([502, 503, 504])

async function request<T>(method: string, path: string, body?: unknown, whole = false,
                          signal?: AbortSignal, attempt = 0): Promise<T> {
    const startedAt = performance.now()
    // GETs are safe to repeat, so a network drop, a timeout or a gateway 5xx gets ONE
    // second try. Writes never retry: a timed-out PUT may well have landed.
    const retryable = method === "GET" && attempt === 0 && !signal?.aborted
    const retry = () => new Promise<T>(resolve => setTimeout(resolve, 300))
        .then(() => request<T>(method, path, body, whole, signal, attempt + 1))

    const guard = deadline(signal)
    let res: Response
    try {
        res = await fetch(`${BASE}/${path.replace(/^\//, "")}`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
            cache: "no-store",
            signal: guard.signal,
        })
    } catch (e) {
        if (signal?.aborted) throw new ApiError(0, "ABORTED", "The request was cancelled.")
        if (retryable) return retry()
        const timedOut = e instanceof DOMException && e.name === "TimeoutError"
        throw new ApiError(0, timedOut ? "TIMEOUT" : "NETWORK",
            timedOut ? "The content service did not answer in time."
                     : "Could not reach the content service.")
    } finally {
        guard.done()
    }
    if (retryable && RETRYABLE.has(res.status)) return retry()

    // ── Timing, client side ───────────────────────────────────────────────────
    // The proxy's Server-Timing header is the authoritative number (it measures the
    // content service directly). This adds the ROUND TRIP the user actually waited,
    // which includes the proxy hop and Next's own middleware — a gap between the two
    // is itself the finding.
    const elapsedMs = performance.now() - startedAt
    if (process.env.NODE_ENV !== "production" && typeof console !== "undefined") {
        const timing = res.headers.get("Server-Timing")
        const upstream = timing?.match(/upstream;[^,]*dur=([\d.]+)/)?.[1]
        const requestId = res.headers.get("X-Request-Id")
        const slow = elapsedMs >= 1000
        const line = `[api] ${method} ${path} -> ${res.status} `
            + `${elapsedMs.toFixed(0)}ms round trip`
            + (upstream ? ` · ${Number(upstream).toFixed(0)}ms upstream` : "")
            + (requestId ? ` · id=${requestId}` : "")
        // Slow calls are warnings so they survive a console filtered to warn+.
        if (slow) console.warn(line)
        else console.debug(line)
    }

    const text = await res.text()
    let json: any = null
    if (text) { try { json = JSON.parse(text) } catch { /* non-JSON body */ } }

    if (!res.ok) {
        const err = json?.error
        throw new ApiError(
            res.status,
            err?.code ?? `HTTP_${res.status}`,
            err?.message ?? `Request failed (${res.status}).`,
            Array.isArray(err?.details) ? err.details : [],
        )
    }
    // The service wraps every success as { data, meta, error }. `whole` keeps the
    // envelope for callers that need `meta` — see requestPaged.
    if (whole) return json as T
    return (json?.data ?? json) as T
}

/**
 * A paged read, keeping `meta`.
 *
 * `request()` unwraps the envelope down to `data`, which is right for every other
 * endpoint and wrong for a list: the pager needs totalItems and totalPages, and
 * they live beside `data`, not inside it. This is the one place that reads the
 * envelope whole.
 */
async function requestPaged<T>(path: string, signal?: AbortSignal): Promise<PagedResponse<T>> {
    const raw = await request<unknown>("GET", path, undefined, true, signal)
    const envelope = raw as { data?: T[]; meta?: PageMeta } | null
    return {
        data: envelope?.data ?? [],
        // A service that answers without meta is not an error — it just cannot be
        // paged, and one page of whatever came back is the honest reading.
        meta: envelope?.meta ?? null,
    }
}

export interface PageMeta { page: number; pageSize: number; totalItems: number; totalPages: number }
export interface PagedResponse<T> { data: T[]; meta: PageMeta | null }

export const api = {
    get: <T>(path: string, signal?: AbortSignal) => request<T>("GET", path, undefined, false, signal),
    getPaged: <T>(path: string, signal?: AbortSignal) => requestPaged<T>(path, signal),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
    del: <T>(path: string) => request<T>("DELETE", path),
}
