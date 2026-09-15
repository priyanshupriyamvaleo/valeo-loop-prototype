// Small local helper: turn an ISO timestamp into a compact relative label
// like "2h ago" / "3d ago". Shared by the audit row and the history sheet.
export function relativeTime(iso: string): string {
    const then = new Date(iso).getTime()
    if (Number.isNaN(then)) return "—"
    const diff = Date.now() - then
    if (diff < 0) return "just now"
    const sec = Math.floor(diff / 1000)
    if (sec < 60) return "just now"
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    const day = Math.floor(hr / 24)
    if (day < 7) return `${day}d ago`
    const wk = Math.floor(day / 7)
    if (wk < 5) return `${wk}w ago`
    const mo = Math.floor(day / 30)
    if (mo < 12) return `${mo}mo ago`
    const yr = Math.floor(day / 365)
    return `${yr}y ago`
}
