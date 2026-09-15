"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crown, X, AlertTriangle, ChevronUp, ChevronDown, Plus } from "lucide-react"
import type { CoachRole, Listing, ListingCoach, Practitioner } from "@/types"
import { bookableCoaches, coachGaps, resolveFollowUp } from "@/lib/consultation"

/**
 * The coaches on a consultation listing — a MASTER COACH PACKAGE.
 *
 * `practitionerIds` was a flat array, which could not say who leads, whose
 * follow-up the customer gets, or who is actually bookable. All three are real
 * questions for a package several coaches deliver, and a flat list answered
 * none of them.
 *
 * Two rules, both decided rather than inferred:
 *   · the PRIMARY owns the package's default follow-up; a coach may override it
 *     for themselves, and the row says which applies and why
 *   · the CUSTOMER picks from the bookable coaches, so `isBookable` is real —
 *     a coach named for credibility who does not take sessions is excluded from
 *     the calendar rather than quietly appearing in it
 */
export function CoachRoster({
    coaches, team, consultListings, requiredRole, onChange,
}: {
    coaches: ListingCoach[] | undefined
    team: Practitioner[]
    /** Listings that can be sold as a follow-up. */
    consultListings: Pick<Listing, "id" | "displayNameEn" | "internalName">[]
    requiredRole?: CoachRole
    onChange: (coaches: ListingCoach[]) => void
}) {
    const list = useMemo(
        () => [...(coaches ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        [coaches])
    const byId = useMemo(() => new Map(team.map(p => [p.id, p])), [team])
    const gaps = coachGaps(list, team, requiredRole)
    const bookable = bookableCoaches(list)

    const write = (next: ListingCoach[]) =>
        onChange(next.map((c, i) => ({ ...c, sortOrder: i })))

    const patch = (id: string, p: Partial<ListingCoach>) =>
        write(list.map(c => (c.practitionerId === id ? { ...c, ...p } : c)))

    /** Exactly one primary: promoting one demotes the rest in the same write. */
    const makePrimary = (id: string) =>
        write(list.map(c => ({ ...c, isPrimary: c.practitionerId === id })))

    const move = (i: number, dir: -1 | 1) => {
        const next = [...list]
        const j = i + dir
        if (j < 0 || j >= next.length) return
        ;[next[i], next[j]] = [next[j], next[i]]
        write(next)
    }

    const addable = team.filter(p => !list.some(c => c.practitionerId === p.id))
    const nameOf = (id?: string) =>
        consultListings.find(l => l.id === id)?.displayNameEn
        ?? consultListings.find(l => l.id === id)?.internalName
        ?? id

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">Coaches on this package</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                        {bookable.length} bookable of {list.length}
                    </Badge>
                </div>
                <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                    Several coaches can deliver one package. The primary owns its default follow-up;
                    a customer books whichever coach they choose from the bookable ones.
                </p>
            </CardHeader>
            <CardContent className="space-y-3">
                {gaps.length > 0 && (
                    <div className="space-y-1 rounded-md border-l-2 border-red-400 bg-red-50/60 px-3 py-2">
                        {gaps.map((g, i) => (
                            <p key={i} className="flex gap-2 text-[11px] text-red-900">
                                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{g}
                            </p>
                        ))}
                    </div>
                )}

                {list.map((c, i) => {
                    const p = byId.get(c.practitionerId)
                    const fu = resolveFollowUp(c, list, team, requiredRole)
                    return (
                        <div key={c.practitionerId}
                            className={`space-y-2 rounded-md border p-3 ${c.isPrimary ? "border-primary bg-primary/5" : ""}`}>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">
                                    {p?.nameEn ?? <span className="text-red-600">{c.practitionerId} — missing</span>}
                                </span>
                                {c.isPrimary && (
                                    <Badge className="gap-1 text-[10px]"><Crown className="h-2.5 w-2.5" /> primary</Badge>
                                )}
                                {!c.isPrimary && (
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
                                        onClick={() => makePrimary(c.practitionerId)}>
                                        Make primary
                                    </Button>
                                )}
                                <div className="ml-auto flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6"
                                        disabled={i === 0} onClick={() => move(i, -1)}>
                                        <ChevronUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6"
                                        disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                        onClick={() => write(list.filter(x => x.practitionerId !== c.practitionerId))}>
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-3 pl-1 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px]">Bookable</Label>
                                    <div className="flex h-8 items-center gap-2">
                                        <Switch checked={c.isBookable !== false}
                                            onCheckedChange={v => patch(c.practitionerId, { isBookable: v })} />
                                        <span className="text-[10px] text-muted-foreground">
                                            {c.isBookable === false
                                                ? "Named on the page, takes no sessions"
                                                : "A customer can book them"}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[10px]">Follow-up package</Label>
                                    <Select value={c.followUpListingId ?? ""}
                                        onValueChange={v => patch(c.practitionerId, {
                                            followUpListingId: v || undefined,
                                        })}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder={
                                                c.isPrimary
                                                    ? "None — set the package default here"
                                                    : "Inherit from the primary"
                                            } />
                                        </SelectTrigger>
                                        <SelectContent className="w-96">
                                            {consultListings.map(l => (
                                                <SelectItem key={l.id} value={l.id}>
                                                    {l.displayNameEn || l.internalName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {/* Always say which follow-up actually applies. A blank
                                        select that silently inherits is how a coach ends up
                                        selling something nobody chose for them. */}
                                    <p className="text-[10px] text-muted-foreground">
                                        {fu.source === "none"
                                            ? <span className="text-red-600">Nothing is sold after a session.</span>
                                            : <>Sells <strong>{nameOf(fu.listingId)}</strong> — from {fu.source}.</>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {!list.length && (
                    <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                        No coach mapped yet. Add one below — the first becomes the primary.
                    </p>
                )}

                {addable.length > 0 && (
                    <div className="space-y-1.5">
                        <Label className="text-[10px]">Add a coach</Label>
                        <Select value="" onValueChange={v => write([
                            ...list,
                            // The first coach added is the primary: a package with
                            // coaches and no lead has no default follow-up, and making
                            // someone tick a box to reach a legal state is friction.
                            { practitionerId: v, isPrimary: list.length === 0 },
                        ])}>
                            <SelectTrigger className="h-8 w-full max-w-md text-xs">
                                <SelectValue placeholder="Pick from Health Team" />
                            </SelectTrigger>
                            <SelectContent>
                                {addable.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.nameEn}
                                        {!p.userServiceId?.trim() ? " · no User Service link" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
