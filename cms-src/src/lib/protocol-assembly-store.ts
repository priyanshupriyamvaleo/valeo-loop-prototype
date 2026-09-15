// ── The assembled orders, per protocol ───────────────────────
//
// WHY A STORE AND NOT A FIELD ON THE PROTOCOL. The catalogue API answers with
// a `Protocol`, and this shape is not in it yet. The repo already keeps three
// authored things this way — tasks, metrics and plans — so a fourth follows
// the same pattern rather than inventing a second one.
//
// The tech team reads the assembled orders out of here, and the contract they
// build against is generated from it. Nothing in the API changes until they
// have agreed the shape.

import { useMemo, useSyncExternalStore } from "react"
import type { Block } from "@/lib/protocol-assembly"

const KEY = "valeo_cms_protocol_assembly_v1"

type AssemblyMap = Record<string, Block[]>

/**
 * A CACHED SNAPSHOT, because `useSyncExternalStore` compares by identity. A
 * `read()` that built a fresh object every call would re-render for ever.
 */
let cache: AssemblyMap | null = null
const EMPTY: AssemblyMap = {}
const NONE: Block[] = []

function read(): AssemblyMap {
    if (typeof window === "undefined") return EMPTY
    if (cache) return cache
    try {
        const raw = window.localStorage.getItem(KEY)
        const parsed = raw ? JSON.parse(raw) : null
        cache = (parsed && typeof parsed === "object") ? (parsed as AssemblyMap) : EMPTY
    } catch {
        cache = EMPTY
    }
    return cache
}

const listeners = new Set<() => void>()

function write(map: AssemblyMap) {
    cache = map
    try { window.localStorage.setItem(KEY, JSON.stringify(map)) } catch { /* quota */ }
    listeners.forEach(fn => fn())
}

export const assemblyStore = {
    subscribe(fn: () => void) {
        listeners.add(fn)
        return () => { listeners.delete(fn) }
    },
    getSnapshot(): AssemblyMap { return read() },
    getServerSnapshot(): AssemblyMap { return EMPTY },
    get(protocolId: string): Block[] { return read()[protocolId] ?? NONE },
    save(protocolId: string, blocks: Block[]) {
        write({ ...read(), [protocolId]: blocks })
    },
}

export function useAssembly(protocolId: string): Block[] {
    const all = useSyncExternalStore(
        assemblyStore.subscribe, assemblyStore.getSnapshot, assemblyStore.getServerSnapshot,
    )
    return useMemo(() => all[protocolId] ?? NONE, [all, protocolId])
}
