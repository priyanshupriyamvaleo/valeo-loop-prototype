"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, ExternalLink, Stethoscope } from "lucide-react"
import {
    COACH_ROLES, CONSULTATION_KINDS, CONSULTATION_MODES, CoachRole, ConsultationConfig, ConsultationEligibility, ConsultationKind, ConsultationMode, ConsultationVisit, Country, Listing, ListingCoach, Practitioner, Questionnaire,
} from "@/types"
import { ApiService } from "@/services/api"
import { coachIds, consultationNotes, followUpListingsFor, questionnaireForCountry, questionnairesFor } from "@/lib/consultation"
import { CountrySwitcher } from "@/components/catalogue/CountrySwitcher"
import { Button } from "@/components/ui/button"
import { describeInferences, parseConsultationName } from "@/lib/consultation-import"
import { explainProposedAxes, proposeConsultationAxes } from "@/lib/consultation-variants"
import { CoachRoster } from "@/components/catalogue/CoachRoster"

/**
 * The Consultation section, authored against the real schema.
 *
 * Three tables, and the section is deliberately no wider than they are:
 *   coach_role_mapping         → the delivering role, and its follow-up package
 *   valeo_professional_details → read-only here; authored on the Health Team profile
 *   questionnaires             → referenced per market, never authored here
 *
 * What is NOT here, on purpose: questions, options, fact cards, answer_config,
 * attachment_mode, is_suggestion_decider. Those are question-grain columns on tables
 * that hang off `questionnaires`, so they belong to the questionnaire module. Putting
 * them here would put question-grain fields at listing grain and duplicate a module.
 */
export function ConsultationFields({
    listing, team, onChange, onPatchListing, consultListings = [], onSetVariantOptions, onGoToVariants,
}: {
    listing: Listing
    team: Practitioner[]
    onChange: (patch: Partial<ConsultationConfig>) => void
    /**
     * Patches the LISTING, not its consultation config. The coach roster lives
     * on `Listing.coaches` because a package's coaches are a property of the
     * package, and `practitionerIds` is derived from it.
     */
    onPatchListing?: (patch: Partial<Listing>) => void
    /** Listings that can be sold as a follow-up. */
    consultListings?: Pick<Listing, "id" | "displayNameEn" | "internalName">[]
    /** Seeds the variant axes so pricing becomes a grid rather than new listings. */
    onSetVariantOptions?: (options: Listing["variantOptions"]) => void
    onGoToVariants?: () => void
}) {
    const cfg = listing.consultation ?? {}
    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
    const activeCountries = useMemo(
        () => (listing.countryConfig ?? []).filter(c => c.status === "active").map(c => c.country),
        [listing.countryConfig])
    const [country, setCountry] = useState<Country>(activeCountries[0] ?? "UAE")

    useEffect(() => {
        ApiService.catalogue.questionnaires().then(setQuestionnaires).catch(() => setQuestionnaires([]))
    }, [])
    useEffect(() => {
        if (activeCountries.length > 0 && !activeCountries.includes(country)) setCountry(activeCountries[0])
    }, [activeCountries, country])

    const mapped = (listing.practitionerIds ?? [])
        .map(id => team.find(t => t.id === id))
        .filter((x): x is Practitioner => !!x)
    const notes = consultationNotes(listing, team)
    const eligible = questionnairesFor(questionnaires, country)
    const selectedId = questionnaireForCountry(cfg, country)

    const setQuestionnaire = (qid: string) => {
        const rest = (cfg.questionnaires ?? []).filter(q => q.country !== country)
        onChange({ questionnaires: [...rest, { country, questionnaireId: qid }] })
    }

    return (
        <Card>
            {/* The master-package roster: who leads, who is bookable, what each
                sells afterwards. Writes Listing.coaches and keeps the derived
                practitionerIds in step so every existing reader is unaffected. */}
            {onPatchListing && (
                <CoachRoster
                    coaches={listing.coaches}
                    team={team}
                    consultListings={consultListings}
                    requiredRole={cfg.requiredRole}
                    onChange={(coaches: ListingCoach[]) => onPatchListing({
                        coaches,
                        practitionerIds: coachIds(coaches),
                    })}
                />
            )}
            <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Stethoscope className="h-4 w-4 text-primary" /> Consultation
                </CardTitle>
                <CardDescription>
                    Who delivers it, and what the customer is asked before they can book. The delivering
                    role is a two-value database enum — not the same thing as a person&apos;s profession.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                {/* ── delivering role: coach_role_mapping.role ── */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Delivered by</Label>
                        <Select value={cfg.requiredRole ?? ""}
                            onValueChange={v => onChange({ requiredRole: v as CoachRole })}>
                            <SelectTrigger className="h-9 text-xs">
                                <span className="truncate">
                                    {cfg.requiredRole
                                        ? COACH_ROLES.find(r => r.id === cfg.requiredRole)?.label
                                        : "Pick a role"}
                                </span>
                            </SelectTrigger>
                            <SelectContent className="w-96">
                                {COACH_ROLES.map(r => (
                                    <SelectItem key={r.id} value={r.id} className="flex-col items-start gap-0.5 py-1.5">
                                        <span className="text-xs font-medium">{r.label}</span>
                                        <span className="text-[10px] text-muted-foreground">{r.blurb}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                            <code>coach_role_mapping.role</code> — only DOCTOR and WEIGHTLOSS_COACH exist in the
                            database. A dietitian may hold the coach role; profession and role are separate.
                        </p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Session length (minutes)</Label>
                        <Input type="number" className="h-9 text-xs" value={cfg.sessionMinutes ?? ""}
                            placeholder="e.g. 30"
                            onChange={e => onChange({
                                sessionMinutes: e.target.value === "" ? undefined : Number(e.target.value),
                            })} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Buffer after session (minutes)</Label>
                        <Input type="number" className="h-9 text-xs" value={cfg.bufferMinutes ?? ""}
                            placeholder="e.g. 10"
                            onChange={e => onChange({
                                bufferMinutes: e.target.value === "" ? undefined : Number(e.target.value),
                            })} />
                        <p className="text-[10px] text-muted-foreground">
                            Legacy <code>bufferDuration</code> — the booking service reads it alongside
                            the slot length.
                        </p>
                    </div>

                    {/* ── The four facts the legacy titles were carrying as prose ── */}
                    <div className="space-y-1">
                        <Label className="text-xs">Consultation type</Label>
                        <Select value={cfg.consultationType ?? ""}
                            onValueChange={v => onChange({ consultationType: v as ConsultationKind })}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Pick a type" /></SelectTrigger>
                            <SelectContent className="w-80">
                                {CONSULTATION_KINDS.map(k => (
                                    <SelectItem key={k.id} value={k.id} className="flex-col items-start gap-0.5 py-1.5">
                                        <span className="text-xs font-medium">{k.label}</span>
                                        <span className="text-[10px] leading-snug text-muted-foreground">{k.blurb}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Delivered</Label>
                        <Select value={cfg.mode ?? ""}
                            onValueChange={v => onChange({ mode: v as ConsultationMode })}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Online / in clinic / at home" /></SelectTrigger>
                            <SelectContent>
                                {CONSULTATION_MODES.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="text-xs">{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Visit</Label>
                        <Select value={cfg.visitType ?? ""}
                            onValueChange={v => onChange({ visitType: v as ConsultationVisit })}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Initial or follow-up" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INITIAL" className="text-xs">Initial</SelectItem>
                                <SelectItem value="FOLLOW_UP" className="text-xs">Follow-up</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Who can buy</Label>
                        <Select value={cfg.eligibility ?? ""}
                            onValueChange={v => onChange({ eligibility: v as ConsultationEligibility })}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Anyone" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ANYONE" className="text-xs">Anyone</SelectItem>
                                <SelectItem value="NEW_CUSTOMERS" className="text-xs">New customers only</SelectItem>
                                <SelectItem value="EXISTING_CUSTOMERS" className="text-xs">Existing customers only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Sessions included</Label>
                        <Input type="number" min={1} className="h-9 text-xs" value={cfg.sessionCount ?? ""}
                            placeholder="1"
                            onChange={e => onChange({
                                sessionCount: e.target.value === "" ? undefined : Number(e.target.value),
                            })} />
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-2.5">
                        <div>
                            <Label className="text-xs">Paid consultation</Label>
                            <p className="text-[10px] text-muted-foreground">
                                Off means free — a real product at zero, not an absent price.
                            </p>
                        </div>
                        <Switch checked={cfg.isPaid !== false}
                            onCheckedChange={v => onChange({ isPaid: v })} />
                    </div>
                </div>

                {/* ── Recovering the fields the legacy title was carrying ── */}
                <LegacyTitleRecovery listing={listing} cfg={cfg} onChange={onChange} />
                <ConsultationPricingSetup listing={listing} cfg={cfg}
                    onSetVariantOptions={onSetVariantOptions} onGoToVariants={onGoToVariants} />

                {/* ── who qualifies, from the role mapping ── */}
                <div className="rounded-md border bg-muted/10 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold">
                            Mapped Health Team ({mapped.length})
                        </p>
                        <Link href="/health-team" className="text-[10px] text-muted-foreground underline">
                            author roles and follow-up packages <ExternalLink className="mb-0.5 inline h-2.5 w-2.5" />
                        </Link>
                    </div>
                    {mapped.length === 0 ? (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                            None yet — map profiles in the Health Team section above. The listing references
                            people; it never duplicates them.
                        </p>
                    ) : (
                        <div className="mt-2 space-y-1">
                            {followUpListingsFor(cfg, mapped).map(({ practitioner: p, listingId }) => {
                                const holds = (p.coachRoles ?? []).some(r => r.role === cfg.requiredRole)
                                return (
                                    <div key={p.id} className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                        <span className="font-medium">{p.nameEn}</span>
                                        {cfg.requiredRole && !holds && (
                                            <Badge variant="outline"
                                                className="border-amber-200 bg-amber-50 text-[9px] text-amber-800">
                                                <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                                                does not hold {cfg.requiredRole}
                                            </Badge>
                                        )}
                                        {!p.userServiceId?.trim() && (
                                            <Badge variant="outline"
                                                className="border-amber-200 bg-amber-50 text-[9px] text-amber-800">
                                                no User Service link
                                            </Badge>
                                        )}
                                        <span className="ml-auto text-muted-foreground">
                                            {cfg.followUpIncluded
                                                ? "follow-up included"
                                                : listingId
                                                    ? `follow-up: ${listingId}`
                                                    : "no follow-up package on their role"}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    <p className="mt-2 text-[10px] text-muted-foreground">
                        The follow-up package hangs off <code>(user_id, role)</code> in the database, so it is a
                        property of the person&apos;s role — not of this listing. That is why it is shown here and
                        edited there.
                    </p>
                </div>

                <label className="flex items-start gap-2 rounded-md border p-3">
                    <Switch checked={cfg.followUpIncluded === true}
                        onCheckedChange={v => onChange({ followUpIncluded: v })} />
                    <span>
                        <span className="block text-xs font-medium">
                            {cfg.followUpIncluded ? "Follow-up included in this price" : "Follow-up sold separately"}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                            When sold separately, the customer is offered the follow-up package mapped on the
                            practitioner&apos;s role.
                        </span>
                    </span>
                </label>

                {/* ── questionnaire per market ── */}
                <div className="space-y-2 rounded-md border bg-muted/10 p-3">
                    <p className="text-[11px] font-semibold">Pre-booking questionnaire</p>
                    <p className="text-[10px] text-muted-foreground">
                        Mapped per market, because <code>questionnaires.country_id</code> is per country — one
                        consultation legitimately asks different questions in KSA than in UAE.
                    </p>
                    {activeCountries.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground">
                            Enable a country under Country Availability first.
                        </p>
                    ) : (
                        <>
                            <CountrySwitcher countries={activeCountries} value={country} onChange={setCountry}
                                counts={Object.fromEntries(activeCountries.map(c => [
                                    c, questionnaireForCountry(cfg, c) ? "✓" : "—",
                                ]))} />
                            <div className="space-y-1">
                                <Label className="text-xs">Questionnaire in {country}</Label>
                                <Select value={selectedId ?? ""} onValueChange={setQuestionnaire}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Pick a questionnaire" />
                                    </SelectTrigger>
                                    <SelectContent className="w-96">
                                        {eligible.map(q => (
                                            <SelectItem key={q.id} value={q.id} className="flex-col items-start gap-0.5 py-1.5">
                                                <span className="text-xs font-medium">{q.internalName}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {q.questionCount} questions ·{" "}
                                                    {q.country ? `${q.country} only` : "all markets"}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {eligible.length === 0 && (
                                    <p className="text-[10px] text-amber-700">
                                        No ACTIVE questionnaire is available in {country}.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                        Questions, options and fact cards belong to the questionnaire itself and are authored in
                        Clinical — a fact card exists purely by having a row, so an &ldquo;enabled but empty&rdquo;
                        card is impossible by construction.
                    </p>
                </div>

                {notes.length > 0 && (
                    <div className="space-y-0.5 rounded-md border border-blue-200 bg-blue-50/40 p-2">
                        {notes.map(n => (
                            <p key={n} className="text-[10px] text-blue-900">· {n}</p>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


/**
 * 135 consultation listings migrated carrying almost nothing but a title, and
 * 64 of those titles encode facts that belong in fields. This reads the title
 * and offers the values — it never applies them silently, because a regex that
 * mis-prices a clinical product is worse than an empty field.
 */
function LegacyTitleRecovery({ listing, cfg, onChange }: {
    listing: Listing
    cfg: ConsultationConfig
    onChange: (patch: Partial<ConsultationConfig>) => void
}) {
    const title = listing.displayNameEn || listing.internalName || ""
    const parsed = useMemo(() => parseConsultationName(title), [title])
    const lines = describeInferences(parsed)

    // Only offer values the operator has not already set.
    const patch: Partial<ConsultationConfig> = {}
    if (parsed.consultationType && !cfg.consultationType) patch.consultationType = parsed.consultationType.value
    if (parsed.mode && !cfg.mode) patch.mode = parsed.mode.value
    if (parsed.visitType && !cfg.visitType) patch.visitType = parsed.visitType.value
    if (parsed.eligibility && !cfg.eligibility) patch.eligibility = parsed.eligibility.value
    if (parsed.isPaid && cfg.isPaid === undefined) patch.isPaid = parsed.isPaid.value
    if (parsed.sessionCount && !cfg.sessionCount) patch.sessionCount = parsed.sessionCount.value

    const count = Object.keys(patch).length
    if (!title || (parsed.isBareName && !parsed.practitionerName)) return null

    return (
        <div className="rounded-md border border-dashed bg-muted/10 p-3">
            <p className="text-[11px] font-semibold">Recover from the legacy title</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
                Read from &ldquo;{title}&rdquo;. Confirm before applying — these are inferences, not data.
            </p>
            <ul className="mt-2 space-y-0.5">
                {lines.map(l => (
                    <li key={l} className="text-[10px] text-muted-foreground">· {l}</li>
                ))}
            </ul>
            <Button size="sm" variant="outline" className="mt-2 h-7 text-[10px]"
                disabled={count === 0}
                onClick={() => onChange(patch)}>
                {count === 0 ? "Nothing left to fill" : `Apply ${count} field${count === 1 ? "" : "s"}`}
            </Button>
        </div>
    )
}


/**
 * Turns the consultation's own settings into variant axes, which is what makes
 * pricing a grid. Legacy priced by creating another listing — one practitioner
 * has three — so the axes are the fix, and the PricingSheet then reads
 * variants × cities.
 */
function ConsultationPricingSetup({ listing, cfg, onSetVariantOptions, onGoToVariants }: {
    listing: Listing
    cfg: ConsultationConfig
    onSetVariantOptions?: (options: Listing["variantOptions"]) => void
    onGoToVariants?: () => void
}) {
    const proposed = useMemo(() => proposeConsultationAxes(cfg), [cfg])
    const why = explainProposedAxes(cfg)
    const existing = listing.variantOptions ?? []
    const priced = (listing.variants ?? []).some(v =>
        (v.regionalData ?? []).some(r => Number(r.price) > 0))

    return (
        <div className="rounded-md border bg-muted/10 p-3">
            <p className="text-[11px] font-semibold">Pricing setup</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
                Consultations price on a grid, not per listing. Set the axes here and the
                Variants &amp; Pricing sheet fills in per city.
            </p>

            <ul className="mt-2 space-y-0.5">
                {why.map(w => <li key={w} className="text-[10px] text-muted-foreground">· {w}</li>)}
            </ul>

            <div className="mt-2 flex flex-wrap items-center gap-2">
                {existing.length > 0 ? (
                    <Badge variant="outline" className="text-[10px]">
                        {existing.length} axis{existing.length === 1 ? "" : "es"} set
                        {priced ? " · priced" : " · no prices yet"}
                    </Badge>
                ) : proposed.length > 0 ? (
                    <Button size="sm" variant="outline" className="h-7 text-[10px]"
                        disabled={!onSetVariantOptions}
                        onClick={() => onSetVariantOptions?.(proposed)}>
                        Create {proposed.length} axis{proposed.length === 1 ? "" : "es"}
                    </Button>
                ) : (
                    <Badge variant="outline" className="text-[10px]">Single price — no axes needed</Badge>
                )}
                {onGoToVariants && (
                    <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={onGoToVariants}>
                        Open Pricing Sheet →
                    </Button>
                )}
            </div>
            {existing.length === 0 && proposed.length === 0 && (
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Price it directly on the variants section — one row, one price per city.
                </p>
            )}
        </div>
    )
}
