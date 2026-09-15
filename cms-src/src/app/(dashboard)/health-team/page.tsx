"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Plus, Stethoscope, ChevronRight, Link2, AlertTriangle } from "lucide-react"
import { ApiService } from "@/services/api"
import { COACH_ROLES, Country, Listing, Practitioner, PractitionerKind, ProductStatus } from "@/types"
import { expiredLicences, jurisdictionsFor, missingLicences } from "@/lib/health-team"
import { ImageField } from "@/components/catalogue/ImageField"
import { LISTING_STATUSES, statusMeta } from "@/lib/listing-status"
import { UnsavedChangesGuard, useDirtyTracker } from "@/components/catalogue/UnsavedChangesGuard"
import { EntityHistory } from "@/components/audit/EntityHistory"
import { toast } from "sonner"
import { AvailabilityEditor } from "@/components/catalogue/AvailabilityEditor"

const KINDS: { id: PractitionerKind; label: string }[] = [
    { id: "doctor", label: "Doctor" },
    { id: "health_coach", label: "Health Coach" },
    { id: "dietitian", label: "Dietitian" },
    { id: "nutritionist", label: "Nutritionist" },
    { id: "physiotherapist", label: "Physiotherapist" },
]

/**
 * The Health Team directory — people as PROFILES, never products. Fields mirror
 * the legacy Wellbeing coaches screen; each member is 1:1 with a User Service
 * account, and blog authorship resolves only through this directory.
 */
export default function HealthTeamPage() {
    const [team, setTeam] = useState<Practitioner[]>([])
    const [loading, setLoading] = useState(true)
    const [draft, setDraft] = useState<Practitioner | null>(null)
    // Candidates for a role's follow-up package: consultation-path listings.
    const [consultListings, setConsultListings] = useState<Listing[]>([])
    const [saving, setSaving] = useState(false)
    const [query, setQuery] = useState("")
    const tracker = useDirtyTracker(draft)

    useEffect(() => {
        ApiService.catalogue.healthTeam().then(t => { setTeam(t); setLoading(false) })
        ApiService.catalogue.listings()
            .then(ls => setConsultListings(ls.filter(l => l.department === "consultations")))
            .catch(() => setConsultListings([]))
    }, [])

    const open = (p: Practitioner) => { setDraft({ ...p }); tracker.markCleanAs({ ...p }) }
    const create = async () => {
        const p = await ApiService.catalogue.createPractitioner({ nameEn: "New member" })
        setTeam(prev => [p, ...prev]); open(p)
    }
    const save = async (): Promise<boolean> => {
        if (!draft) return false
        if (!draft.nameEn.trim()) { toast.error("A name is required"); return false }
        setSaving(true)
        try {
            const saved = await ApiService.catalogue.updatePractitioner(draft.id, draft)
            setTeam(prev => prev.map(t => (t.id === saved.id ? saved : t)))
            setDraft(saved); tracker.markCleanAs(saved)
            toast.success("Saved")
            return true
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not save"); return false
        } finally { setSaving(false) }
    }
    const patch = (p: Partial<Practitioner>) => setDraft(d => (d ? { ...d, ...p } : d))

    // Name OR practitioner type OR job title: searching "doctor" should find the
    // doctors, not nothing, and "physio" is how people actually look for one.
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return team
        return team.filter(t => {
            const kindLabel = KINDS.find(k => k.id === t.kind)?.label ?? t.kind
            return [t.nameEn, t.nameAr, kindLabel, t.jobTitleEn, t.email, t.slug]
                .some(v => v?.toLowerCase().includes(q))
        })
    }, [team, query])

    const Txt = ({ label, k, dir, ph }: { label: string; k: keyof Practitioner; dir?: "rtl"; ph?: string }) => (
        <div className="space-y-1" dir={dir}>
            <Label className="text-xs">{label}</Label>
            <Input className={`h-8 text-xs ${dir ? "text-right" : ""}`} placeholder={ph}
                value={(draft?.[k] as string) ?? ""} onChange={e => patch({ [k]: e.target.value })} />
        </div>
    )

    if (draft) {
        const st = statusMeta(draft.status)
        const unlinked = !draft.userServiceId?.trim()
        const jurisdictions = jurisdictionsFor((draft.countries ?? []) as string[])
        const lacking = missingLicences(draft)
        const lapsed = expiredLicences(draft)
        const blocked = unlinked || lacking.length > 0
        return (
            <div className="space-y-5 pb-16">
                <UnsavedChangesGuard dirty={tracker.dirty} onSave={save} entityLabel="profile" />
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-4">
                    <div className="flex min-w-[260px] flex-1 items-center gap-3">
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setDraft(null)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="truncate text-lg font-semibold">{draft.nameEn}</h2>
                                <Badge variant="outline" className={`shrink-0 text-[10px] ${st.className}`}>{st.label}</Badge>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                                /team/{draft.slug} · {KINDS.find(k => k.id === draft.kind)?.label}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Select value={draft.status} onValueChange={v => patch({ status: v as ProductStatus })}>
                            <SelectTrigger className="h-9 w-[132px] shrink-0">
                                <span className="truncate">{st.label}</span>
                            </SelectTrigger>
                            <SelectContent className="w-80">
                                {LISTING_STATUSES.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="flex-col items-start gap-0.5 py-1.5"
                                        disabled={s.id === "active" && blocked}>
                                        <span className="text-xs font-medium">
                                            {s.label}{s.id === "active" && blocked && (unlinked ? " — link User Service first" : " — licence missing")}
                                        </span>
                                        <span className="text-[10px] leading-snug text-muted-foreground">{s.blurb}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                    </div>
                </div>

                {lacking.length > 0 && (
                    <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50/50 p-3 text-xs">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <p><strong>Licence missing for {lacking.map(j => j.authority).join(", ")}.</strong> This
                            profile claims to practise in {lacking.map(j => j.regionEn).join(", ")}, so each
                            regulator&apos;s licence number must be on file before it can publish.</p>
                    </div>
                )}
                {lapsed.length > 0 && (
                    <div className="flex gap-2 rounded-md border border-red-200 bg-red-50/50 p-3 text-xs">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <p><strong>Expired: {lapsed.join(", ")}.</strong> A lapsed licence on a live profile is worse
                            than a missing one — renew or unpublish.</p>
                    </div>
                )}
                {unlinked && (
                    <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50/50 p-3 text-xs">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <p><strong>No User Service account linked.</strong> Every Health Team member is 1:1 with a
                            User Service identity — login, coach assignment and blog authorship all resolve through
                            it. The profile cannot publish until it is linked.</p>
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="py-3">
                                <span className="flex items-center gap-2 text-sm font-semibold">
                                    <Link2 className="h-4 w-4 text-primary" /> Identity &amp; User Service
                                </span>
                            </CardHeader>
                            <CardContent className="grid gap-3 pt-0 sm:grid-cols-2">
                                <Txt label="Name (EN)" k="nameEn" />
                                <Txt label="الاسم (AR)" k="nameAr" dir="rtl" />
                                <div className="space-y-1">
                                    <Label className="text-xs">Practitioner Type</Label>
                                    <Select value={draft.kind} onValueChange={v => patch({ kind: v as PractitionerKind })}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {KINDS.map(k => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Txt label="Email (User Service login)" k="email" ph="name@feelvaleo.com" />
                                <Txt label="User Service ID (1:1)" k="userServiceId" ph="usr_…" />
                                <Txt label="Landing page slug" k="slug" />
                            </CardContent>
                            <CardContent className="pt-0">
                                {/* Legacy had these as three editable boxes. They are counts of
                                    things that happened — orders and reviews — so typing them means
                                    the number on the profile and the number in the data disagree,
                                    and the profile is the one customers see. Shown, never typed. */}
                                <div className="rounded-md border bg-muted/20 p-3">
                                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                        From orders and reviews — not editable
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { k: "Rating", v: draft.starRating ? draft.starRating.toFixed(1) : "—" },
                                            { k: "Reviews", v: draft.reviewCount ?? "—" },
                                            { k: "Consultations", v: draft.consultationCount ?? "—" },
                                        ].map(x => (
                                            <div key={x.k}>
                                                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">{x.k}</span>
                                                <span className="block text-sm font-medium tabular-nums">{x.v}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-[10px] text-muted-foreground">
                                        Nothing is dropped from the legacy screen — these move from typed
                                        to derived. A dash means no orders or reviews yet.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-3"><span className="text-sm font-semibold">Profile</span></CardHeader>
                            <CardContent className="grid gap-3 pt-0 sm:grid-cols-2">
                                <Txt label="Job title (EN)" k="jobTitleEn" ph="General Physician" />
                                <Txt label="المسمى الوظيفي (AR)" k="jobTitleAr" dir="rtl" />
                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs">Overview (EN)</Label>
                                    <textarea className="h-20 w-full rounded-md border p-2 text-xs"
                                        value={draft.overviewEn ?? ""} onChange={e => patch({ overviewEn: e.target.value })} />
                                </div>
                                <div className="space-y-1 sm:col-span-2" dir="rtl">
                                    <Label className="text-xs">نبذة (AR)</Label>
                                    <textarea className="h-20 w-full rounded-md border p-2 text-right text-xs"
                                        value={draft.overviewAr ?? ""} onChange={e => patch({ overviewAr: e.target.value })} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── coach_role_mapping + the one valeo_professional_details field
                            that had no home here. The role is a two-value DB enum and is
                            NOT the profession above: a dietitian may hold WEIGHTLOSS_COACH.
                            The follow-up package hangs off (user_id, role), which is why it
                            is authored per role here rather than on a consultation listing. ── */}
                        <Card>
                            <CardHeader className="py-3">
                                <span className="text-sm font-semibold">Consultation roles</span>
                                <p className="text-[11px] text-muted-foreground">
                                    Which operational roles this person holds, and the follow-up package sold
                                    after a session in each. One row per role — never two of the same.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0">
                                {COACH_ROLES.map(r => {
                                    const held = (draft.coachRoles ?? []).find(x => x.role === r.id)
                                    return (
                                        <div key={r.id} className="space-y-2 rounded-md border p-2.5">
                                            <label className="flex items-start gap-2">
                                                <Switch checked={!!held} onCheckedChange={v => patch({
                                                    coachRoles: v
                                                        ? [...(draft.coachRoles ?? []), { role: r.id }]
                                                        : (draft.coachRoles ?? []).filter(x => x.role !== r.id),
                                                })} />
                                                <span>
                                                    <span className="block text-xs font-medium">{r.label}</span>
                                                    <span className="block text-[10px] text-muted-foreground">{r.blurb}</span>
                                                </span>
                                            </label>
                                            {held && (
                                                <div className="space-y-1 pl-9">
                                                    <Label className="text-[10px]">Follow-up package</Label>
                                                    <Select value={held.followUpListingId ?? ""}
                                                        onValueChange={v => patch({
                                                            coachRoles: (draft.coachRoles ?? []).map(x =>
                                                                x.role === r.id ? { ...x, followUpListingId: v } : x),
                                                        })}>
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="None — nothing offered after a session" />
                                                        </SelectTrigger>
                                                        <SelectContent className="w-96">
                                                            {consultListings.map(l => (
                                                                <SelectItem key={l.id} value={l.id}>
                                                                    {l.displayNameEn || l.internalName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        <code>coach_role_mapping.coach_follow_up_package_id</code>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {(draft.coachRoles ?? []).length === 0 && (
                                    <p className="text-[10px] text-muted-foreground">
                                        No role held, so this person cannot be mapped to a consultation listing.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-3">
                                <span className="text-sm font-semibold">Credentials</span>
                                <p className="text-xs text-muted-foreground">
                                    Field-for-field from the legacy Wellbeing coaches screen — these render on the
                                    landing page and are part of what GCC advertising review looks at.
                                </p>
                            </CardHeader>
                            <CardContent className="grid gap-3 pt-0 sm:grid-cols-2">
                                <Txt label="Degree (EN)" k="degreeEn" />
                                <Txt label="الشهادة (AR)" k="degreeAr" dir="rtl" />
                                <Txt label="Institution (EN)" k="institutionEn" />
                                <Txt label="المؤسسة (AR)" k="institutionAr" dir="rtl" />
                                <Txt label="Specialization (EN)" k="specializationEn" />
                                <Txt label="التخصص (AR)" k="specializationAr" dir="rtl" />
                                <Txt label="Training & certificates (EN)" k="trainingAndCertificatesEn" />
                                <Txt label="التدريب والشهادات (AR)" k="trainingAndCertificatesAr" dir="rtl" />
                                <Txt label="Nationality (EN)" k="nationalityEn" />
                                <div className="space-y-1">
                                    <Label className="text-xs">Years of experience</Label>
                                    {/* decimal(4,1) in valeo_professional_details — halves are valid */}
                                    <Input type="number" step="0.5" className="h-8 text-xs" value={draft.yearsOfExperience ?? ""}
                                        onChange={e => patch({ yearsOfExperience: e.target.value === "" ? undefined : Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Gender</Label>
                                    {/* valeo_professional_details.gender — nullable, and never inferred */}
                                    <Select value={draft.gender ?? ""} onValueChange={v => patch({ gender: v })}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Not stated" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground">
                                        Nullable in the schema and left unset on seeded profiles — patients can
                                        request a practitioner&apos;s gender, so it is asked, never guessed.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-3">
                                <span className="text-sm font-semibold">Where they practise &amp; licences</span>
                                <p className="text-xs text-muted-foreground">
                                    Pick the countries first — the jurisdictions follow, and each one asks for its own
                                    authority&apos;s licence. There is no single &ldquo;health licence&rdquo;: Dubai is
                                    DHA, Abu Dhabi is DoH, the northern emirates are MOHAP, and KSA, Qatar and Kuwait
                                    each have their own.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                <div className="flex flex-wrap gap-1.5">
                                    {(["UAE", "KSA", "QATAR", "KUWAIT"] as Country[]).map(c => {
                                        const on = (draft.countries ?? []).includes(c)
                                        return (
                                            <Button key={c} size="sm" variant={on ? "default" : "outline"}
                                                className="h-7 text-xs"
                                                onClick={() => patch({
                                                    countries: on
                                                        ? (draft.countries ?? []).filter(x => x !== c)
                                                        : [...(draft.countries ?? []), c],
                                                })}>
                                                {c}
                                            </Button>
                                        )
                                    })}
                                </div>

                                {jurisdictions.length === 0 ? (
                                    <p className="rounded-md border border-dashed bg-muted/10 px-3 py-3 text-center text-[11px] text-muted-foreground">
                                        No country selected — pick where this member practises and the required
                                        licences will appear.
                                    </p>
                                ) : jurisdictions.map(j => {
                                    const lic = (draft.licences ?? []).find(l => l.jurisdictionId === j.id)
                                    const setLic = (patchLic: Record<string, string>) => {
                                        const rest = (draft.licences ?? []).filter(l => l.jurisdictionId !== j.id)
                                        patch({ licences: [...rest, { jurisdictionId: j.id, ...lic, ...patchLic }] })
                                    }
                                    const missing = !lic?.licenceNumber?.trim()
                                    return (
                                        <div key={j.id} className={`rounded-md border p-3 ${missing ? "border-amber-200 bg-amber-50/40" : ""}`}>
                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-medium">{j.regionEn}</span>
                                                <Badge variant="outline" className="text-[10px]" title={j.authorityFullEn}>
                                                    {j.authority}
                                                </Badge>
                                                {missing && (
                                                    <span className="text-[10px] text-amber-700">licence number required</span>
                                                )}
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-3">
                                                <div className="space-y-1">
                                                    <Label className="text-[11px]">{j.authority} licence no.</Label>
                                                    <Input className="h-8 text-xs" value={lic?.licenceNumber ?? ""}
                                                        onChange={e => setLic({ licenceNumber: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[11px]">Title on licence</Label>
                                                    <Input className="h-8 text-xs" value={lic?.titleEn ?? ""}
                                                        placeholder="e.g. Specialist Family Medicine"
                                                        onChange={e => setLic({ titleEn: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[11px]">Expires</Label>
                                                    <Input type="date" className="h-8 text-xs" value={lic?.expiresOn ?? ""}
                                                        onChange={e => setLic({ expiresOn: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        {/* When they can be booked. On the person, because that is what
                            it is — one calendar serves every consultation they deliver. */}
                        <AvailabilityEditor practitioner={draft}
                            onChange={availability => patch({ availability })} />
                        <Card>
                            <CardHeader className="py-3"><span className="text-sm font-semibold">Photo</span></CardHeader>
                            <CardContent className="pt-0">
                                <ImageField preset="portrait" value={draft.photoUrl ?? ""}
                                    onChange={url => patch({ photoUrl: url })} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <EntityHistory entityType="practitioner" entityId={draft.id} />
            </div>
        )
    }

    return (
        <div className="space-y-5 pb-16">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl space-y-1">
                    <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <Stethoscope className="h-5 w-5 text-primary" /> Health Team
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Doctors, coaches and dietitians as <strong>profiles with landing pages</strong> — never
                        products. Listings map these profiles; blog authors can only come from here; each member is
                        1:1 with a User Service account.
                    </p>
                </div>
                <Button size="sm" className="h-9" onClick={create}>
                    <Plus className="mr-2 h-4 w-4" /> New Member
                </Button>
            </div>

            <Input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, practitioner type or job title…" className="h-9 max-w-sm" />

            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
                <Card className="overflow-hidden">
                    {filtered.map(t => {
                        const st = statusMeta(t.status)
                        return (
                            <button key={t.id} type="button" onClick={() => open(t)}
                                className="flex w-full flex-wrap items-center gap-2 border-b px-3 py-2.5 text-left last:border-0 hover:bg-muted/30">
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{t.nameEn}</p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                        /team/{t.slug} · {KINDS.find(k => k.id === t.kind)?.label}
                                    </p>
                                </div>
                                {!t.userServiceId?.trim() && (
                                    <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-700">
                                        no User Service link
                                    </Badge>
                                )}
                                <Badge variant="outline" className={`text-[10px] ${st.className}`} title={st.blurb}>
                                    {st.label}
                                </Badge>
                            </button>
                        )
                    })}
                </Card>
            )}
            <p className="text-xs text-muted-foreground">
                Seeded from the 36 practitioner-named legacy packages, folded to {team.length} people — all Draft
                until reviewed and linked to User Service. Landing pages follow the same four states as listings.
            </p>
        </div>
    )
}
