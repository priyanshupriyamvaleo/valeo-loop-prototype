"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import type { AuditAction, AuditActor, AuditEntityType } from "@/types"

export type DatePreset = "all" | "today" | "7d" | "30d"

const ENTITY_TYPES: { value: AuditEntityType; label: string }[] = [
    { value: "listing", label: "Listing" },
    { value: "category", label: "Category" },
    { value: "journey", label: "Journey" },
    { value: "protocol", label: "Protocol" },
    { value: "partner", label: "Partner" },
    { value: "subDepartment", label: "Sub-department" },
    { value: "internalCategory", label: "Internal Category" },
]

const ACTIONS: { value: AuditAction; label: string }[] = [
    { value: "create", label: "Created" },
    { value: "update", label: "Updated" },
    { value: "status_change", label: "Status change" },
    { value: "delete", label: "Deleted" },
]

export interface AuditFiltersValue {
    entityType: AuditEntityType | "all"
    actorId: string | "all"
    action: AuditAction | "all"
    datePreset: DatePreset
    search: string
}

export function AuditFilters({
    value,
    actors,
    onEntityTypeChange,
    onActorChange,
    onActionChange,
    onDatePresetChange,
    onSearchChange,
}: {
    value: AuditFiltersValue
    actors: AuditActor[]
    onEntityTypeChange: (v: AuditEntityType | "all") => void
    onActorChange: (v: string | "all") => void
    onActionChange: (v: AuditAction | "all") => void
    onDatePresetChange: (v: DatePreset) => void
    onSearchChange: (v: string) => void
}) {
    return (
        <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    value={value.search}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder="Search name or field…"
                    className="h-9 pl-8 text-sm"
                />
            </div>

            <Select value={value.entityType} onValueChange={v => onEntityTypeChange(v as AuditEntityType | "all")}>
                <SelectTrigger className="h-9 w-full text-sm sm:w-44"><SelectValue placeholder="Entity" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All entities</SelectItem>
                    {ENTITY_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
            </Select>

            <Select value={value.actorId} onValueChange={v => onActorChange(v)}>
                <SelectTrigger className="h-9 w-full text-sm sm:w-44"><SelectValue placeholder="Actor" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All actors</SelectItem>
                    {actors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
            </Select>

            <Select value={value.action} onValueChange={v => onActionChange(v as AuditAction | "all")}>
                <SelectTrigger className="h-9 w-full text-sm sm:w-40"><SelectValue placeholder="Action" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
            </Select>

            <Select value={value.datePreset} onValueChange={v => onDatePresetChange(v as DatePreset)}>
                <SelectTrigger className="h-9 w-full text-sm sm:w-36"><SelectValue placeholder="Date" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
            </Select>
        </Card>
    )
}
