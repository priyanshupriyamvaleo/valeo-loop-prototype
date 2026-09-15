// ── Media upload ──────────────────────────────────────────────
// The operator picks a file, the service stores it (S3 or GCS behind its BlobStore
// port) and returns a URL, and the CMS keeps only that URL. The prototype never
// holds bytes — a data URI in a content field would be shipped to the storefront.
//
// The two optional hints shape the storage key server-side
// (products/{uid}/{section}/{slug}-{suffix}.{ext}): productId is resolved to the
// product's immutable uid BY THE SERVICE, section names the folder. Neither is
// required — an upload with no product yet files under the sweep-lifecycled
// uploads/ prefix, which is exactly what "draft with no product" should mean.

export interface UploadResult {
    /** The stored URL to persist. Empty when the upload did not happen. */
    url: string
    /** How the URL was obtained — drives what the UI tells the operator. */
    source: "s3" | "pending"
}

export interface UploadContext {
    productId?: number
    /** gallery | influencer | why-superior | reviews — the service's vocabulary. */
    section?: string
}

/**
 * Baked at BUILD time (NEXT_PUBLIC_*): the pipeline must set it before `next build`.
 * Empty = the upload feature is off and every ImageField stays preview-only.
 */
export const MEDIA_UPLOAD_PATH = process.env.NEXT_PUBLIC_MEDIA_UPLOAD_PATH ?? ""

/**
 * The storefront's media standards, enforced at the one door every upload passes
 * through — checked BEFORE the feature flag on purpose: a non-conforming file
 * must be refused even in preview-only mode, or it previews fine locally and
 * fails the day uploads are live.
 *
 *   image  WebP only, ≤ 500 KB   (what the storefront serves)
 *   video  WebM only, ≤ 25 MB    ("reasonable" pinned to a number: a product
 *                                  loop should stream, not download)
 *   pdf    ≤ 10 MB
 *
 * One constant each, so a standards change is a one-line diff.
 */
const MAX_IMAGE_BYTES = 500 * 1024
const MAX_VIDEO_BYTES = 25 * 1024 * 1024
const MAX_PDF_BYTES = 10 * 1024 * 1024

const ext = (name: string) => name.split(".").pop()?.toLowerCase() ?? ""
const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`
const mb = (n: number) => `${(n / (1024 * 1024)).toFixed(1)} MB`

export function validateUploadFile(file: File): string | null {
    const kind = file.type || ext(file.name)
    if (file.type.startsWith("video/") || ["webm", "mp4", "mov", "avi", "mkv"].includes(ext(file.name)) && !file.type) {
        const isWebm = file.type === "video/webm" || (!file.type && ext(file.name) === "webm")
        if (!isWebm) {
            return `Only WebM video is accepted (this is ${kind}). Convert it to .webm — `
                + "it streams smaller at the same quality."
        }
        if (file.size > MAX_VIDEO_BYTES) {
            return `Video is ${mb(file.size)} — the limit is 25 MB. Trim it or re-encode at a lower bitrate.`
        }
        return null
    }
    if (file.type === "application/pdf" || (!file.type && ext(file.name) === "pdf")) {
        if (file.size > MAX_PDF_BYTES) {
            return `PDF is ${mb(file.size)} — the limit is 10 MB. Compress it or split it.`
        }
        return null
    }
    const isWebp = file.type === "image/webp" || (!file.type && ext(file.name) === "webp")
    if (!isWebp) {
        return `Only WebP images are accepted (this is ${kind || "unknown"}). `
            + "Convert it to .webp — smaller files, same quality, and what the storefront serves."
    }
    if (file.size > MAX_IMAGE_BYTES) {
        return `Image is ${kb(file.size)} — the limit is 500 KB. `
            + "Re-export at a lower quality or smaller dimensions."
    }
    return null
}

export async function uploadMedia(file: File, ctx: UploadContext = {}): Promise<UploadResult> {
    const invalid = validateUploadFile(file)
    if (invalid) throw new Error(invalid)
    if (!MEDIA_UPLOAD_PATH) return { url: "", source: "pending" }

    const form = new FormData()
    form.append("file", file, file.name)
    // Appended only when REAL: FormData.append('productId', undefined) sends the string
    // "undefined", which the service refuses loudly (INVALID_UPLOAD) — rightly.
    if (ctx.productId != null && Number.isFinite(ctx.productId)) {
        form.append("productId", String(ctx.productId))
    }
    if (ctx.section) form.append("section", ctx.section)

    const res = await fetch(`/api/cms/${MEDIA_UPLOAD_PATH}`, { method: "POST", body: form })
    const json = await res.json().catch(() => null)

    if (!res.ok) {
        // 503 MEDIA_NOT_CONFIGURED = the environment has no bucket yet — the same situation
        // as the feature being off: preview-only, not a crash. ONLY that code: a transient
        // gateway 503 must surface as a failure the operator will retry, not silently
        // downgrade to "the endpoint is not live yet".
        if (res.status === 503 && json?.error?.code === "MEDIA_NOT_CONFIGURED") {
            return { url: "", source: "pending" }
        }
        // The service writes its messages for the operator toast — surface them verbatim.
        const message: string | undefined = json?.error?.message
        throw new Error(message ?? `Upload failed (${res.status}).`)
    }

    const data = json?.data ?? json
    const url: string | undefined = data?.url ?? data?.location ?? data?.link
    if (!url) throw new Error("Upload succeeded but no URL was returned.")
    return { url, source: "s3" }
}
