"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ApiService } from "@/services/api"
import type { AuditAction, AuditActor, AuditEntityType, AuditFilter, AuditLogEntry } from "@/types"
import { AuditFilters, type AuditFiltersValue, type DatePreset } from "@/components/audit/AuditFilters"
import { AuditLogTable } from "@/components/audit/AuditLogTable"

// Local midnight for "today"; rolling windows for 7d / 30d; null = all time.
function presetSince(preset: DatePreset): number | null {
    if (preset === "all") return null
    if (preset === "today") { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() }
    const day = 24 * 60 * 60 * 1000
    if (preset === "7d") return Date.now() - 7 * day
    if (preset === "30d") return Date.now() - 30 * day
    return null
}

function AuditInner() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // URL is the source of truth for every filter (shareable + deep-linkable).
    const entityType = (searchParams.get("entityType") as AuditEntityType | null) ?? "all"
    const entityId = searchParams.get("entityId") ?? ""
    const actorId = searchParams.get("actorId") ?? "all"
    const action = (searchParams.get("action") as AuditAction | null) ?? "all"
    const datePreset = (searchParams.get("date") as DatePreset | null) ?? "all"
    const search = searchParams.get("q") ?? ""

    const [entries, setEntries] = useState<AuditLogEntry[]>([])
    const [allEntries, setAllEntries] = useState<AuditLogEntry[]>([])
    const [loading, setLoading] = useState(true)

    // Stable, unfiltered snapshot — powers the actor dropdown so it never
    // collapses to the currently-selected actor.
    useEffect(() => {
        ApiService.catalogue.audit.list().then(setAllEntries)
    }, [])

    // Server-side filter (entityType / entityId / actorId / action). Date + search
    // are applied client-side below, so they don't retrigger the load.
    useEffect(() => {
        const filter: AuditFilter = {
            ...(entityType !== "all" ? { entityType } : {}),
            ...(entityId ? { entityId } : {}),
            ...(actorId !== "all" ? { actorId } : {}),
            ...(action !== "all" ? { action } : {}),
        }
        setLoading(true)
        let cancelled = false
        ApiService.catalogue.audit.list(filter).then(rows => {
            if (cancelled) return
            setEntries(rows)
            setLoading(false)
        })
        return () => { cancelled = true }
    }, [entityType, entityId, actorId, action])

    const actors = useMemo<AuditActor[]>(() => {
        const byId = new Map<string, AuditActor>()
        for (const e of allEntries) if (!byId.has(e.actor.id)) byId.set(e.actor.id, e.actor)
        return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
    }, [allEntries])

    const visible = useMemo(() => {
        const sinceMs = presetSince(datePreset)
        const q = search.trim().toLowerCase()
        return entries.filter(e => {
            if (sinceMs && new Date(e.timestamp).getTime() < sinceMs) return false
            if (q) {
                const inName = e.entityName.toLowerCase().includes(q)
                const inLabels = (e.changes ?? []).some(c => c.label.toLowerCase().includes(q))
                if (!inName && !inLabels) return false
            }
            return true
        })
    }, [entries, datePreset, search])

    const setParam = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (!value || value === "all") params.delete(key)
        else params.set(key, value)
        const qs = params.toString()
        router.replace(qs ? `/audit?${qs}` : "/audit")
    }

    const filtersValue: AuditFiltersValue = { entityType, actorId, action, datePreset, search }
    const anyFilterActive = entityType !== "all" || !!entityId || actorId !== "all" || action !== "all" || datePreset !== "all" || search.trim() !== ""
    const resetAll = () => router.replace("/audit")

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold">Audit Log</h2>
                <p className="text-sm text-muted-foreground">Every change to catalogue entities — who, what, and when.</p>
            </div>

            <AuditFilters
                value={filtersValue}
                actors={actors}
                onEntityTypeChange={v => setParam("entityType", v)}
                onActorChange={v => setParam("actorId", v)}
                onActionChange={v => setParam("action", v)}
                onDatePresetChange={v => setParam("date", v)}
                onSearchChange={v => setParam("q", v)}
            />

            {loading ? (
                <div className="py-16 text-center text-sm text-muted-foreground">Loading audit log…</div>
            ) : (
                <AuditLogTable
                    entries={visible}
                    emptyVariant={allEntries.length === 0 && !anyFilterActive ? "cold" : "no-match"}
                    onReset={resetAll}
                />
            )}
        </div>
    )
}

export default function AuditPage() {
    return (
        <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>}>
            <AuditInner />
        </Suspense>
    )
}
