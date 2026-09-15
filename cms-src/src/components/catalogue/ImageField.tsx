"use client"

import { createContext, useContext, useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ImagePlus, Upload, X } from "lucide-react"
import { uploadMedia } from "@/lib/api/media"

// ── Upload context ────────────────────────────────────────────
// ImageField cannot know which listing it sits in; the editor page can. The provider
// carries the productId once, each call site names its section, and the two become the
// storage-key hints (products/{uid}/{section}/…). Screens with no provider fall back to
// the service's uploads/ prefix — correct for anything that is not a product's media.
export const MediaUploadContext = createContext<{ productId?: number }>({})

// Aspect + "where it renders" label for every image slot in the storefront.
// The preview box is constrained to `ratio` so editors judge the real crop/fit.
export const PRESETS = {
    hero: { ratio: "16 / 9", label: "PDP / category hero" },
    banner: { ratio: "3 / 1", label: "Wide banner" },
    square: { ratio: "1 / 1", label: "Product / gallery / variant" },
    portrait: { ratio: "4 / 5", label: "Product portrait" },
    og: { ratio: "1.91 / 1", label: "Social share (OG)" },
    thumbnail: { ratio: "1 / 1", label: "Thumbnail" },
} as const

// SEO/AEO best practice: keep alt text concise (~125 chars) so screen readers
// and search engines get the full description without truncation.
const ALT_MAX = 125

function AltInput({
    label,
    value,
    onChange,
    dir,
}: {
    label: string
    value: string | undefined
    onChange: (v: string) => void
    dir?: "rtl" | "ltr"
}) {
    const len = (value ?? "").length
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <Label className="text-xs">{label}</Label>
                <span className="text-xs text-muted-foreground tabular-nums">{len}/{ALT_MAX}</span>
            </div>
            <Input
                dir={dir}
                maxLength={ALT_MAX}
                value={value ?? ""}
                onChange={e => onChange(e.target.value)}
                className={dir === "rtl" ? "h-8 text-xs text-right" : "h-8 text-xs"}
            />
        </div>
    )
}

export function ImageField({
    label,
    value,
    onChange,
    altEn,
    altAr,
    onAltEnChange,
    onAltArChange,
    preset,
    mediaKind = "image",
    section,
}: {
    label?: string
    value?: string
    onChange: (url: string) => void
    /** The service's key-folder vocabulary: gallery | influencer | why-superior | reviews. */
    section?: string
    altEn?: string
    altAr?: string
    onAltEnChange?: (v: string) => void
    onAltArChange?: (v: string) => void
    preset: keyof typeof PRESETS
    /** what kind of media this slot accepts — image (default) or video */
    mediaKind?: "image" | "video"
}) {
    const { ratio, label: presetLabel } = PRESETS[preset]
    const inputRef = useRef<HTMLInputElement>(null)
    const isVideo = mediaKind === "video"

    // Upload flow: the operator picks a file, the backend stores it in S3 and
    // returns a URL, and we persist only that URL. While the upload endpoint is
    // still pending we fall back to a local preview and say so — better than
    // silently writing a data URI into a field the storefront will render.
    const { productId } = useContext(MediaUploadContext)
    const [uploading, setUploading] = useState(false)
    const [previewOnly, setPreviewOnly] = useState(false)
    const [localPreview, setLocalPreview] = useState<string | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const onFile = async (file?: File) => {
        if (!file) return
        setUploadError(null)
        setUploading(true)
        try {
            const res = await uploadMedia(file, { productId, section })
            if (res.source === "s3" && res.url) {
                setPreviewOnly(false)
                setLocalPreview(prev => { if (prev) URL.revokeObjectURL(prev); return null })
                onChange(res.url)
                return
            }
            // Endpoint not available yet — preview locally, flag it clearly. The preview
            // stays in COMPONENT state as an object URL and never reaches the listing:
            // a base64 data URI in the listing meant megabytes re-serialised by the
            // dirty tracker on every render, and a localStorage quota bomb in the local
            // store. Not-saved must LOOK not-saved, not ride along invisibly.
            setLocalPreview(prev => {
                if (prev) URL.revokeObjectURL(prev)
                return URL.createObjectURL(file)
            })
            setPreviewOnly(true)
        } catch (e) {
            setUploadError(e instanceof Error ? e.message : "Upload failed.")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}

            <div className="max-w-md space-y-2">
                {/* Compact preview, constrained to the exact storefront aspect ratio.
                    `shown` may be an unsaved object-URL preview — previewOnly says so. */}
                <div
                    className={`w-full max-w-[200px] overflow-hidden rounded-md bg-muted/30 ${(value || localPreview) ? "border" : "border-2 border-dashed"}`}
                    style={{ aspectRatio: ratio }}
                >
                    {(value || localPreview) ? (
                        isVideo ? (
                            <video src={value || localPreview || undefined} controls className="h-full w-full object-cover" />
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={value || localPreview || undefined}
                                alt={altEn || "Image preview"}
                                className="h-full w-full object-cover"
                            />
                        )
                    ) : (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                            <ImagePlus className="h-6 w-6" />
                            <span className="text-xs">Upload {isVideo ? "video" : "image"}</span>
                        </button>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept={isVideo ? "video/webm,.webm" : "image/webp,.webp"}
                    className="hidden"
                    onChange={e => { void onFile(e.target.files?.[0]); e.target.value = "" }}
                />

                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
                        <Upload className="mr-2 h-3.5 w-3.5" /> {value ? "Change" : "Upload"}
                    </Button>
                    {value && (
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange("")}>
                            <X className="mr-1 h-3.5 w-3.5" /> Remove
                        </Button>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    Renders as {presetLabel} · {ratio}
                    {uploading && <> · <span className="text-foreground">Uploading…</span></>}
                </p>
                {previewOnly && !uploadError && (
                    <p className="text-xs text-amber-700">
                        Local preview only — the upload endpoint is not live yet, so this file has not been stored.
                    </p>
                )}
                {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            </div>

            {(onAltEnChange || onAltArChange) && (
                <div className="max-w-md space-y-2">
                    {onAltEnChange && (
                        <AltInput label="Alt text (EN)" value={altEn} onChange={onAltEnChange} />
                    )}
                    {onAltArChange && (
                        <AltInput label="Alt text (AR)" value={altAr} onChange={onAltArChange} dir="rtl" />
                    )}
                    <p className="text-xs text-muted-foreground">
                        Describe the image for screen readers &amp; search
                    </p>
                </div>
            )}
        </div>
    )
}
