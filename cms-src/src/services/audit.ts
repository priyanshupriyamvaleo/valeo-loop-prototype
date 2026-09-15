import type { AuditLogEntry, AuditActor, AuditFilter } from "@/types"

// In-memory audit store (prototype stand-in for a DB), mirroring the catalogue
// listings store. Imports ONLY from @/types so the dependency graph stays
// one-way: api.ts → audit.ts and auth.tsx → audit.ts (no cycle).

const MOCK_DELAY = 600
let AUDIT_SEQ = 0
// Fallback until AuthProvider injects the real user (pre-hydration race).
let CURRENT_ACTOR: AuditActor = { id: "system", name: "System" }

const SHREEDHAR: AuditActor = { id: "u_1", name: "Shreedhar M", email: "shreedhar.m@feelvaleo.com", role: "admin" }
const RITWIK: AuditActor = { id: "u_2", name: "Ritwik Gupta", email: "ritwik.gupta@feelvaleo.com", role: "admin" }

// Seeded history so the screen and its filters are populated on first load.
const SEED_AUDIT: AuditLogEntry[] = [
    {
        id: "aud-seed-1", entityType: "listing", entityId: "p1", entityName: "Vitamin D3 Boost",
        action: "status_change", actor: SHREEDHAR, timestamp: "2026-07-20T09:12:00.000Z",
        changes: [{ field: "status", label: "Status", oldValue: "draft", newValue: "active" }],
    },
    {
        id: "aud-seed-2", entityType: "listing", entityId: "p1", entityName: "Vitamin D3 Boost",
        action: "update", actor: RITWIK, timestamp: "2026-07-20T08:40:00.000Z",
        changes: [
            { field: "subscriptionDiscountPct", label: "Subscription Discount %", oldValue: "—", newValue: "{\"monthly\":10,\"quarterly\":15}" },
            { field: "seoTitleEn", label: "SEO Title (EN)", oldValue: "—", newValue: "Vitamin D3 5000 IU — 60 Capsules | Valeo" },
        ],
    },
    {
        id: "aud-seed-3", entityType: "listing", entityId: "l-glp1", entityName: "Semaglutide (GLP-1)",
        action: "update", actor: SHREEDHAR, timestamp: "2026-07-19T14:05:00.000Z",
        changes: [
            { field: "medicineType", label: "Medicine Type", oldValue: "—", newValue: "glp1" },
            { field: "fulfilmentPath", label: "Fulfilment Path", oldValue: "supplement", newValue: "supplement" },
        ],
    },
    {
        id: "aud-seed-4", entityType: "category", entityId: "cat-goals", entityName: "Shop by Goal",
        action: "update", actor: RITWIK, timestamp: "2026-07-18T11:20:00.000Z",
        changes: [{ field: "heroHeadlineEn", label: "Hero Headline (EN)", oldValue: "Your goals", newValue: "Shop by your health goal" }],
    },
    {
        id: "aud-seed-5", entityType: "journey", entityId: "jr-weightloss", entityName: "Weight Loss Journey",
        action: "update", actor: SHREEDHAR, timestamp: "2026-07-17T16:33:00.000Z",
        changes: [{ field: "pageBlocks", label: "Page Blocks", oldValue: "4 items", newValue: "6 items" }],
    },
    {
        id: "aud-seed-6", entityType: "partner", entityId: "pt-noon", entityName: "Noon Health",
        action: "create", actor: RITWIK, timestamp: "2026-07-16T10:00:00.000Z",
        changes: [],
    },
    {
        id: "aud-seed-7", entityType: "listing", entityId: "l-blood", entityName: "Comprehensive Male Profile",
        action: "create", actor: SHREEDHAR, timestamp: "2026-07-15T09:00:00.000Z",
        changes: [],
    },
]

const AUDIT_STORE: AuditLogEntry[] = [...SEED_AUDIT]

export const auditStore = {
    setActor(a: AuditActor | null) {
        CURRENT_ACTOR = a ?? { id: "system", name: "System" }
    },
    getActor(): AuditActor {
        return CURRENT_ACTOR
    },
    // Synchronous — called from inside the async create/update; must not be awaited.
    record(e: Omit<AuditLogEntry, "id" | "timestamp" | "actor"> & { actor?: AuditActor; timestamp?: string }): AuditLogEntry {
        const entry: AuditLogEntry = {
            id: `aud-${Date.now().toString(36)}-${(++AUDIT_SEQ).toString(36)}`,
            timestamp: e.timestamp ?? new Date().toISOString(),
            actor: e.actor ?? CURRENT_ACTOR,
            entityType: e.entityType,
            entityId: e.entityId,
            entityName: e.entityName,
            action: e.action,
            changes: e.changes,
        }
        AUDIT_STORE.unshift(entry)
        return entry
    },
    async list(filter: AuditFilter = {}): Promise<AuditLogEntry[]> {
        let rows = AUDIT_STORE.filter(r =>
            (!filter.entityType || r.entityType === filter.entityType) &&
            (!filter.entityId || r.entityId === filter.entityId) &&
            (!filter.actorId || r.actor.id === filter.actorId) &&
            (!filter.action || r.action === filter.action) &&
            (!filter.since || r.timestamp >= filter.since) &&
            (!filter.until || r.timestamp <= filter.until))
        if (filter.limit) rows = rows.slice(0, filter.limit)
        return new Promise(res => setTimeout(() => res(rows), MOCK_DELAY))
    },
}
