"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, CalendarDays, Info, ShieldAlert } from "lucide-react"
import { ApiService } from "@/services/api"
import {
    Composition, Country, Listing, Practitioner, ProgramConfig, ProgramMilestone,
} from "@/types"
import { unitLabel } from "@/lib/composition"

const rid = () => Math.random().toString(36).slice(2, 9)

/**
 * Authoring a program TEMPLATE. Deliberately contains no per-customer controls:
 * pausing or cancelling one enrolment is an ops action on an order. What is set
 * here is whether ops MAY pause, for how long, how often, and what that does to
 * the schedule — the policy travels to ops rather than ops inventing it.
 */
export function ProgramBuilder({ config, onChange, compositionId, countries }: {
    config: ProgramConfig
    onChange: (patch: Partial<ProgramConfig>) => void
    compositionId?: string
    countries: Country[]
}) {
    const [comp, setComp] = useState<Composition | null>(null)
    const [listings, setListings] = useState<Listing[]>([])
    const [team, setTeam] = useState<Practitioner[]>([])

    useEffect(() => {
        Promise.allSettled([
            ApiService.catalogue.compositions(),
            ApiService.catalogue.listings(),
            ApiService.catalogue.healthTeam(),
        ]).then(([c, l, h]) => {
            if (c.status === "fulfilled" && compositionId) {
                setComp(c.value.find(x => x.id === compositionId) ?? null)
            }
            if (l.status === "fulfilled") setListings(l.value)
            if (h.status === "fulfilled") setTeam(h.value)
        })
    }, [compositionId])

    const milestones = [...(config.milestones ?? [])].sort((a, b) => a.dayOffset - b.dayOffset)
    const pause = config.pausePolicy ?? { allowed: false, extendsEndDate: true }
    const cancel = config.cancellationPolicy ?? { afterCoolingOff: "pro_rata_undelivered" as const, deliveredItemsNonRefundable: true }
    const setPause = (p: Partial<typeof pause>) => onChange({ pausePolicy: { ...pause, ...p } })
    const setCancel = (p: Partial<typeof cancel>) => onChange({ cancellationPolicy: { ...cancel, ...p } })
    const setMilestone = (id: string, p: Partial<ProgramMilestone>) =>
        onChange({ milestones: (config.milestones ?? []).map(m => (m.id === id ? { ...m, ...p } : m)) })

    const weeks = config.durationWeeks ?? 0
    const overrun = milestones.filter(m => weeks > 0 && m.dayOffset > weeks * 7)

    return (
        <div className="space-y-4">
            {/* ── deliverables live on the Composition, not here ── */}
            <Card className="border-l-4 border-l-violet-500">
                <CardHeader className="py-3">
                    <span className="text-sm font-semibold">Deliverables</span>
                    <p className="text-xs text-muted-foreground">
                        What the customer receives is the program&apos;s <strong>Composition</strong> — the same
                        primitive combos use, so a program can span a blood panel, shipped supplements and coach
                        sessions without a second mechanism.
                    </p>
                </CardHeader>
                <CardContent className="pt-0">
                    {!compositionId ? (
                        <div className="flex gap-2 rounded-md border border-dashed bg-muted/10 p-3 text-xs">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <p>No composition linked yet. Create one in{" "}
                                <Link href="/catalogue/compositions" className="underline">Compositions</Link>{" "}
                                (kind: Program) and link it here — that is where members and pricing live.</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {(comp?.members ?? []).map(m => (
                                <div key={m.id} className="flex flex-wrap items-center gap-2 rounded border px-2 py-1.5 text-[11px]">
                                    <span>{unitLabel(m.ref, listings)}</span>
                                    <Badge variant="outline" className="text-[9px]">{m.ref.kind.replace("_", " ")}</Badge>
                                    {!m.required && <Badge variant="outline" className="text-[9px]">optional</Badge>}
                                    <span className="ml-auto text-muted-foreground">
                                        {m.dayOffset !== undefined ? `day ${m.dayOffset}` : "no schedule"}
                                    </span>
                                </div>
                            ))}
                            {(comp?.members ?? []).length === 0 && (
                                <p className="text-[11px] text-muted-foreground">
                                    The linked composition has no members yet.
                                </p>
                            )}
                            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                                <Link href="/catalogue/compositions">Edit deliverables →</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── schedule ── */}
            <Card>
                <CardHeader className="py-3">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                        <CalendarDays className="h-4 w-4 text-primary" /> Schedule
                    </span>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Duration (weeks)</Label>
                            <Input type="number" className="h-8 text-xs" value={config.durationWeeks ?? ""}
                                onChange={e => onChange({ durationWeeks: e.target.value === "" ? undefined : Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Start mode</Label>
                            <Select value={config.startMode ?? "rolling"}
                                onValueChange={v => onChange({ startMode: v as ProgramConfig["startMode"] })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rolling">Rolling — starts when they buy</SelectItem>
                                    <SelectItem value="cohort">Cohort — fixed intake dates</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Transferable</Label>
                            <div className="flex h-8 items-center gap-2">
                                <Switch checked={config.transferable ?? false}
                                    onCheckedChange={v => onChange({ transferable: v })} />
                                <span className="text-[11px] text-muted-foreground">
                                    {config.transferable ? "Can be handed to another person" : "Named to the buyer"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <Label className="text-xs">Milestones</Label>
                            <Button size="sm" variant="outline" className="h-6 text-[10px]"
                                onClick={() => onChange({
                                    milestones: [...(config.milestones ?? []), {
                                        id: rid(), dayOffset: 0, titleEn: "",
                                    }],
                                })}>
                                <Plus className="mr-1 h-3 w-3" /> Add milestone
                            </Button>
                        </div>
                        {milestones.length === 0 ? (
                            <p className="rounded-md border border-dashed bg-muted/10 px-3 py-3 text-center text-[11px] text-muted-foreground">
                                No milestones. A 12-week program usually has a baseline panel on day 0, check-ins,
                                and a follow-up panel at the end.
                            </p>
                        ) : milestones.map(m => (
                            <div key={m.id} className="mb-1.5 grid grid-cols-[70px_1fr_auto_auto] items-center gap-2">
                                <Input type="number" className="h-8 text-xs" value={m.dayOffset}
                                    onChange={e => setMilestone(m.id, { dayOffset: Number(e.target.value) })} />
                                <Input className="h-8 text-xs" placeholder="e.g. Baseline blood panel"
                                    value={m.titleEn} onChange={e => setMilestone(m.id, { titleEn: e.target.value })} />
                                <label className="flex items-center gap-1 text-[10px]">
                                    <input type="checkbox" checked={m.isGate ?? false}
                                        onChange={e => setMilestone(m.id, { isGate: e.target.checked })} />
                                    gate
                                </label>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                    onClick={() => onChange({ milestones: (config.milestones ?? []).filter(x => x.id !== m.id) })}>
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                        {overrun.length > 0 && (
                            <p className="mt-1 text-[11px] text-amber-700">
                                {overrun.length} milestone(s) fall after the program ends (day {weeks * 7}) — the
                                customer would never reach them.
                            </p>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                            Day offsets are relative to enrolment, so one template serves every start date. A
                            <strong> gate</strong> milestone must be completed before later ones unlock.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* ── coaching ── */}
            <Card>
                <CardHeader className="py-3">
                    <span className="text-sm font-semibold">Coaching</span>
                    <p className="text-xs text-muted-foreground">
                        Who <em>may</em> be assigned. The actual assignment happens per enrolment in ops — a template
                        cannot know which coach a given customer gets.
                    </p>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                    <label className="flex items-start gap-2 rounded-md border p-2.5">
                        <Switch checked={config.requiresCoachAssignment ?? false}
                            onCheckedChange={v => onChange({ requiresCoachAssignment: v })} />
                        <span>
                            <span className="block text-xs font-medium">A coach must be assigned before it starts</span>
                            <span className="block text-[11px] text-muted-foreground">
                                Blocks fulfilment until ops assigns someone, rather than starting coachless.
                            </span>
                        </span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {(config.coachPractitionerIds ?? []).map(id => (
                            <Badge key={id} variant="outline" className="gap-1 py-1 text-[11px]">
                                {team.find(t => t.id === id)?.nameEn ?? id}
                                <button type="button" onClick={() => onChange({
                                    coachPractitionerIds: (config.coachPractitionerIds ?? []).filter(x => x !== id),
                                })}><X className="h-3 w-3" /></button>
                            </Badge>
                        ))}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 text-xs">
                                <Plus className="mr-1 h-3 w-3" /> Eligible coach
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-h-64 w-72 overflow-y-auto">
                            <DropdownMenuLabel className="text-xs">Health Team</DropdownMenuLabel>
                            {team.filter(t => !(config.coachPractitionerIds ?? []).includes(t.id)).map(t => (
                                <DropdownMenuItem key={t.id} className="text-xs"
                                    onClick={() => onChange({
                                        coachPractitionerIds: [...(config.coachPractitionerIds ?? []), t.id],
                                    })}>
                                    {t.nameEn}
                                    <span className="ml-auto text-[10px] text-muted-foreground">{t.kind.replace("_", " ")}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardContent>
            </Card>

            {/* ── the policies ops must follow ── */}
            <Card className="border-l-4 border-l-amber-500">
                <CardHeader className="py-3">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                        <ShieldAlert className="h-4 w-4 text-amber-600" /> Pause, cancel &amp; renewal policy
                    </span>
                    <p className="text-xs text-muted-foreground">
                        Set the <strong>rules</strong> here; ops applies them to an individual enrolment in the order
                        tool. Nothing on this screen pauses or refunds anybody — authoring policy here and executing
                        it there is what stops one customer&apos;s exception becoming everybody&apos;s rule.
                    </p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    <label className="flex items-start gap-2 rounded-md border p-2.5">
                        <Switch checked={pause.allowed} onCheckedChange={v => setPause({ allowed: v })} />
                        <span>
                            <span className="block text-xs font-medium">
                                {pause.allowed ? "Ops may pause an enrolment" : "Pausing is not permitted"}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                                Travel, illness and Ramadan are the usual reasons. If pausing is off, ops has to
                                cancel and re-sell instead — which is usually worse for everyone.
                            </span>
                        </span>
                    </label>

                    {pause.allowed && (
                        <>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-1">
                                    <Label className="text-[11px]">Max days per pause</Label>
                                    <Input type="number" className="h-8 text-xs" value={pause.maxDaysPerPause ?? ""}
                                        onChange={e => setPause({ maxDaysPerPause: e.target.value === "" ? undefined : Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px]">Max pauses per enrolment</Label>
                                    <Input type="number" className="h-8 text-xs" value={pause.maxPausesPerEnrolment ?? ""}
                                        onChange={e => setPause({ maxPausesPerEnrolment: e.target.value === "" ? undefined : Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px]">Refuse below … days remaining</Label>
                                    <Input type="number" className="h-8 text-xs" value={pause.minDaysRemaining ?? ""}
                                        onChange={e => setPause({ minDaysRemaining: e.target.value === "" ? undefined : Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px]">While paused, the end date…</Label>
                                <Select value={pause.extendsEndDate ? "extend" : "fixed"}
                                    onValueChange={v => setPause({ extendsEndDate: v === "extend" })}>
                                    <SelectTrigger className="h-8 text-xs sm:w-96"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="extend">Moves out by the paused days — they keep the full program</SelectItem>
                                        <SelectItem value="fixed">Stays fixed — they lose the paused time</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground">
                                    This is the field that decides whether a pause is generous or punitive, and it is
                                    the one ops will be asked about. Milestone day-offsets shift with it.
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px]">Note shown to ops when they pause</Label>
                                <Input className="h-8 text-xs" value={pause.opsNoteEn ?? ""}
                                    placeholder="e.g. Confirm the customer still has undelivered supplement shipments"
                                    onChange={e => setPause({ opsNoteEn: e.target.value })} />
                            </div>
                        </>
                    )}

                    <Separator />

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                            <Label className="text-[11px]">Cooling-off (days, full refund)</Label>
                            <Input type="number" className="h-8 text-xs" value={cancel.coolingOffDays ?? ""}
                                onChange={e => setCancel({ coolingOffDays: e.target.value === "" ? undefined : Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                            <Label className="text-[11px]">After cooling off</Label>
                            <Select value={cancel.afterCoolingOff}
                                onValueChange={v => setCancel({ afterCoolingOff: v as typeof cancel.afterCoolingOff })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pro_rata_undelivered">Refund what has not been delivered</SelectItem>
                                    <SelectItem value="fee">Refund minus a fixed fee</SelectItem>
                                    <SelectItem value="no_refund">No refund</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {cancel.afterCoolingOff === "fee" && (
                        <div className="space-y-1">
                            <Label className="text-[11px]">Cancellation fee</Label>
                            <Input type="number" className="h-8 w-32 text-xs" value={cancel.feeAmount ?? ""}
                                onChange={e => setCancel({ feeAmount: e.target.value === "" ? undefined : Number(e.target.value) })} />
                        </div>
                    )}
                    <label className="flex items-start gap-2 rounded-md border p-2.5">
                        <Switch checked={cancel.deliveredItemsNonRefundable}
                            onCheckedChange={v => setCancel({ deliveredItemsNonRefundable: v })} />
                        <span>
                            <span className="block text-xs font-medium">Delivered physical items are non-refundable</span>
                            <span className="block text-[11px] text-muted-foreground">
                                A shipped supplement cannot come back. Without this, a pro-rata refund quietly gives
                                away goods that already left the warehouse.
                            </span>
                        </span>
                    </label>

                    <Separator />

                    <label className="flex items-start gap-2 rounded-md border p-2.5">
                        <Switch checked={config.autoRenews ?? false}
                            onCheckedChange={v => onChange({ autoRenews: v })} />
                        <span>
                            <span className="block text-xs font-medium">Auto-renews at the end of the term</span>
                            <span className="block text-[11px] text-muted-foreground">
                                Renewal is usually priced differently from acquisition.
                            </span>
                        </span>
                    </label>
                    {config.autoRenews && (
                        <div className="grid gap-2 sm:grid-cols-4">
                            {countries.map(c => {
                                const row = (config.renewalPrices ?? []).find(r => r.country === c)
                                return (
                                    <div key={c} className="space-y-1">
                                        <Label className="text-[11px]">{c} renewal</Label>
                                        <Input type="number" className="h-8 text-xs" value={row?.price ?? ""}
                                            onChange={e => {
                                                const rest = (config.renewalPrices ?? []).filter(r => r.country !== c)
                                                onChange({
                                                    renewalPrices: e.target.value === "" ? rest
                                                        : [...rest, { country: c, price: Number(e.target.value) }],
                                                })
                                            }} />
                                    </div>
                                )
                            })}
                            {countries.length === 0 && (
                                <p className="text-[11px] text-muted-foreground">Enable a country first.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
