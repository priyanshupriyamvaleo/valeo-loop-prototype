"use client"

import { useEffect, useRef, useState } from "react"

/**
 * A numeric input that keeps its own text WHILE FOCUSED and commits as you type (debounced),
 * as well as on blur and Enter.
 *
 * Every editor here normalises on write — retail clamps up to the selling price, a pack
 * price clamps down to sessions × the single, a tier threshold clamps up to 2, a discount
 * is refused outside 0–100. Committing on each keystroke makes those rules fight the
 * typist: typing "400" clamps at the first character and the next keypress appends to the
 * clamped value, which is how a 300 became "3004".
 *
 * Holding the text until blur lets a partial number be partial. The rules still apply —
 * they just apply to what was meant rather than to its first digit.
 *
 * `Escape` abandons the edit; `Enter` commits and leaves the field.
 */
export function NumCell({
    value, placeholder, muted, className, title, onCommit,
}: {
    value: number | undefined
    placeholder?: string
    muted?: boolean
    className?: string
    /**
     * Hover text. Needed where the number shown is DERIVED rather than stored — a tier cell
     * displays a price computed from a stored percent, so the figure can sit a few fils from
     * the one that was typed and the cell has to be able to say so.
     */
    title?: string
    /** Raw text — "" means the field was cleared, which callers treat as a removal. */
    onCommit: (raw: string) => void
}) {
    const [text, setText] = useState<string | null>(null)
    const asString = value === undefined ? "" : String(value)
    const shown = text ?? asString

    /**
     * Live commit, debounced.
     *
     * Committing on blur alone meant every edit needed a click elsewhere before the row's
     * derived cells (% off, the tier price, the country counters) caught up — so the sheet
     * looked unresponsive while typing was working fine.
     *
     * Debounced rather than per-keystroke because a commit is not free: MasterSheet takes an
     * UNDO SNAPSHOT on each one, and typing "240" would otherwise write 2, then 24, then 240
     * — three snapshots, and two of them nonsense values that the tier maths would happily
     * turn into 99.7% and 96.4% off.
     */
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const cancel = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }
    useEffect(() => cancel, [])

    const commit = () => {
        cancel()
        if (text !== null && text !== asString) onCommit(text)
        // Cleared so the input falls back to the value the store now holds — which for a
        // derived cell may differ from what was typed, and should.
        setText(null)
    }

    const onChange = (next: string) => {
        setText(next)
        cancel()
        // Not cleared here: `text` stays so the caret and the half-typed value survive the
        // re-render the commit causes.
        timer.current = setTimeout(() => { if (next !== asString) onCommit(next) }, 400)
    }

    return (
        <input title={title} type="number"
            className={className
                ?? `w-16 rounded border bg-white px-1 py-0.5 text-right tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 ${muted ? "text-muted-foreground" : ""}`}
            value={shown}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
                if (e.key === "Enter") { commit(); (e.target as HTMLInputElement).blur() }
                if (e.key === "Escape") { cancel(); setText(null) }
            }} />
    )
}
