"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { saveHealthProduct, type SectionResult } from "@/lib/api/save-listing"
import { getBrands, getCommerce, getVariantAxes } from "@/lib/api/products"
import { fetchAvailableCountries } from "@/lib/api/catalogue-sources"
import { generateOnServer } from "@/lib/api/generate-variants"
import type { VariantResponse } from "@/lib/api/types"
import type { PriceRowResponse } from "@/lib/api/products"
import { axesToOptions, hydrateFromService, type DriftedField } from "@/lib/api/hydrate"
import { loadLookups } from "@/lib/api/save-listing"
import { syncOf, SYNC_CLASS, SYNC_LABEL } from "@/lib/api/section-sync"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Plus, Trash, Star, Copy, GripVertical, ImagePlus, AlertCircle, MapPin, Truck,
    ExternalLink, Pill, Cpu, Gift, Video, MessageSquare, Users, Trophy, Play,
    CheckCircle2, Circle, Loader2, Check, Save, Clock, ChevronRight,
} from "lucide-react"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ApiService } from "@/services/api"
import { ListingEditorShell, EditorSection } from "@/components/catalogue/ListingEditorShell"
import { EntityHistorySheet } from "@/components/audit/EntityHistorySheet"
import { ImageField, MediaUploadContext } from "@/components/catalogue/ImageField"
import { GuideButton } from "@/components/catalogue/OnboardingGuide"
import { SectionHelp } from "@/components/catalogue/SectionHelp"
import { TagPicker } from "@/components/catalogue/TagPicker"
import { HealthTeamPicker } from "@/components/catalogue/HealthTeamPicker"
import { UnsavedChangesGuard, useDirtyTracker } from "@/components/catalogue/UnsavedChangesGuard"
import { DiagnosticsPackageFields } from "@/components/catalogue/DiagnosticsPackageFields"
import { DiagnosticsBiomarkerMap } from "@/components/catalogue/DiagnosticsBiomarkerMap"
import { DiagnosticsSlots } from "@/components/catalogue/DiagnosticsSlots"
import { ProgramBuilder } from "@/components/catalogue/ProgramBuilder"
import { biomarkerCount, diagnosticsGaps } from "@/lib/diagnostics"
import { LISTING_STATUSES, statusEffect, statusMeta } from "@/lib/listing-status"
import { useAuth } from "@/lib/auth"
import { SeoLocalisation } from "@/components/catalogue/SeoLocalisation"
import { RichText } from "@/components/catalogue/RichText"
import { PartnerAccessSection } from "@/components/catalogue/PartnerAccessSection"
import { PromoBannerSelect } from "@/components/catalogue/PromoBannerSelect"
import { ApiError } from "@/lib/api/client"
import { DepartmentDto, departmentNames, departmentsPresent, fetchDepartments, subDepartmentDbIds, toSubDepartments } from "@/lib/api/taxonomy"
import { DEPARTMENTS, MEDICINE_FORMS, departmentLabel, fulfilmentForMedicineForm, listingActivationRequirements, listingUnmetRequirements, listingDefaults, usesVariantMatrix, comboLabel, duplicateComboVariantIds, unsetAxes } from "@/lib/catalogue"
import { consultationGaps, isConsultationSubDept } from "@/lib/consultation"
import { CityAvailability } from "@/components/catalogue/CityAvailability"

// ── Code-split: the variant/pricing suite is ~4,000 lines of TSX that most edits
// never render (a content-only edit opens none of them). Loaded on first entry to
// their sections instead of riding the editor's initial bundle.
const sectionLoading = () => (
    <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading section…
    </div>
)
const VariantOptionsPanel = dynamic(
    () => import("@/components/catalogue/VariantOptionsPanel").then(m => m.VariantOptionsPanel),
    { loading: sectionLoading })
const SessionPacks = dynamic(
    () => import("@/components/catalogue/SessionPacks").then(m => m.SessionPacks),
    { loading: sectionLoading })
const PricingSheet = dynamic(
    () => import("@/components/catalogue/PricingSheet").then(m => m.PricingSheet),
    { loading: sectionLoading })
const MultiBuyTiers = dynamic(
    () => import("@/components/catalogue/MultiBuyTiers").then(m => m.MultiBuyTiers),
    { loading: sectionLoading })
const MasterSheet = dynamic(
    () => import("@/components/catalogue/MasterSheet").then(m => m.MasterSheet),
    { loading: sectionLoading })
import { uidPrefixFor, defaultSlotBookingFor } from "@/lib/taxonomy"
import { flagsOf, surfaceOf } from "@/lib/catalogue"
import { flowForSubDepartment, mandatoryAxisKindsFor } from "@/lib/treatments"
import { discountFromPrices, sellingFromDiscount, priceRowErrors } from "@/lib/catalogue"
import { EntityHistory } from "@/components/audit/EntityHistory"
import { ConsultationFields } from "@/components/catalogue/ConsultationFields"
import {
    Listing, ProductVariant, RegionalData, MediaAsset, SubDepartment, ServiceProvider,
    InternalCategory, Country, VariantType, VariantStatus, ProductStatus,
    MedicineForm, MedicineClass, CatalogCountryConfig, SubscriptionFrequency, Benefit, Ingredient, DeliveryConfig, MultiByTier, VariantSessionPack,
    FAQItem, CustomerReview, InfluencerVideo, SuperiorityBlock, SuperiorityPoint, AttributeKey,
    CataloguePartner, City, PromoBanner, VariantOption, DiagnosticsConfig, DiagnosticsTier, TreatmentsConfig, ProgramConfig,
    HowToUseItem, ComparisonRow, StatItem, ClinicianReview, SubscriptionPlan,
    Practitioner, Questionnaire, ConsultationConfig,
} from "@/types"
import { B2bPartnerRecovery } from "@/components/catalogue/B2bPartnerRecovery"

// All attribute switches (medicineForm is a separate select). Visibility is
// controlled per sub-department via SubDepartment.attributeKeys.
const ALL_ATTR: { key: Exclude<AttributeKey, "medicineForm">; label: string; hint: string }[] = [
    { key: "isMedicine", label: "Is Medicine", hint: "IV/vaccine or medicine product (Rx gate applies)" },
    { key: "isRxRequired", label: "Prescription Required", hint: "Rx review gate before fulfilment" },
    { key: "isControlledSubstance", label: "Controlled Substance", hint: "Regulatory notice on PDP" },
    { key: "isDevice", label: "Is Device / Wearable", hint: "Rides the Product/Supplement path" },
    { key: "fasting", label: "Fasting Required", hint: "Diagnostics prep" },
]

const COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT", "OTHERS"]
const VARIANT_TYPES: VariantType[] = ["size", "flavour", "quantity", "dosage", "denomination", "colour"]
const SUB_FREQS: SubscriptionFrequency[] = ["weekly", "monthly", "quarterly", "bi_annual"]

const STATUS_BADGE: Record<ProductStatus, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    inactive: "bg-amber-100 text-amber-700 border-amber-200",
    archived: "bg-rose-100 text-rose-700 border-rose-200",
}

const SUB_FREQ_PRICE_KEY: Record<SubscriptionFrequency, keyof RegionalData> = {
    weekly: "subscriptionPriceWeekly",
    monthly: "subscriptionPriceMonthly",
    quarterly: "subscriptionPriceQuarterly",
    bi_annual: "subscriptionPriceBiAnnual",
}

function rid() { return Math.random().toString(36).substr(2, 9) }

// Searchable multi-select over the listing pool (Frequently Bought, Recommendations).
function ListingMultiSelect({ all, selected, onChange, currentId }: {
    all: Listing[]; selected: string[]; onChange: (ids: string[]) => void; currentId?: string
}) {
    const [q, setQ] = useState("")
    const label = (l: Listing) => l.displayNameEn || l.internalName || l.id
    const pool = all.filter(l => l.id !== currentId)
    const filtered = pool.filter(l => label(l).toLowerCase().includes(q.toLowerCase()))
    const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
    return (
        <div className="space-y-2">
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selected.map(id => {
                        const l = all.find(x => x.id === id)
                        return (
                            <Badge key={id} variant="secondary" className="text-[10px] gap-1">
                                {l ? label(l) : id}
                                <button type="button" onClick={() => toggle(id)} className="ml-0.5"><Trash className="h-2.5 w-2.5" /></button>
                            </Badge>
                        )
                    })}
                </div>
            )}
            <Input className="h-8 text-xs" placeholder="Search listings…" value={q} onChange={e => setQ(e.target.value)} />
            <div className="max-h-52 overflow-y-auto border rounded-md divide-y">
                {filtered.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3 text-center italic">No listings.</p>
                ) : filtered.slice(0, 50).map(l => (
                    <button
                        key={l.id}
                        type="button"
                        onClick={() => toggle(l.id)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-muted/50 ${selected.includes(l.id) ? "bg-primary/5" : ""}`}
                    >
                        <span>{label(l)}</span>
                        {selected.includes(l.id) && <Badge variant="outline" className="text-[9px]">Selected</Badge>}
                    </button>
                ))}
            </div>
        </div>
    )
}

// Marks a field shown on the PDP (Figma) that has no first-class column in the
// shared catalogue schema yet — a signal to reconcile the schema.
function SchemaGap() {
    return (
        <span
            title="Shown on the PDP (Figma) but not a first-class field in the shared schema — reconcile before build."
            className="ml-1.5 align-middle text-[10px] font-medium rounded px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-300"
        >
            ⚠ not in schema
        </span>
    )
}


/**
 * The service's variants in the editor's own shape.
 *
 * <p><b>Keyed off `selections`, not labels or array order.</b> Each selection carries
 * `axisId` and `valueId`, and `axesToOptions` builds its local ids as `axis-{axisId}` /
 * `val-{valueId}` — so the combination maps back exactly. `matchVariant`'s fallback of
 * pairing by array index puts the wrong variant on the wrong row the first time a value is
 * renamed or reordered.
 *
 * <p>Existing local rows are preserved where they already correspond to a server variant, so
 * the editor does not throw away unsaved edits to a variant's own fields.
 */
function toLocalVariants(
    server: VariantResponse[],
    prev: Listing,
    /**
     * null = NO price information was fetched — every variant keeps whatever cells the sheet
     * already holds. Distinct from {} / an absent key, which is a real answer ("this variant has
     * no rows") and clears the cells. Conflating the two was the axis bug: generate rebuilt the
     * variant list without fetching prices, every cell wiped locally, and the next save's diff
     * DELETED the rows server-side.
     */
    prices: Record<number, PriceRowResponse[]> | null = null,
    cityCountry: Record<string, Country> = {},
): ProductVariant[] {
    // ── a pack's combination is its BASE's ────────────────────────────────────
    // PackService writes no variant_selections for a pack: its identity is
    // (base, sessions), which the axis signature already encodes as "…|S:5". So a pack
    // arrives with an EMPTY selections list.
    //
    // Mapping that straight through gave every pack optionValues {} — so all packs with
    // the same session count keyed identically and the grid reported "9 variants share a
    // combination". They do not: they pack DIFFERENT combinations at the same size.
    //
    // A pack therefore inherits the combination it is a pack OF, which is also what makes
    // it show under the right row of the grid.
    const combos = new Map<number, Record<string, string>>()
    for (const sv of server) {
        if (sv.pack?.baseVariantId) continue      // packs resolved in the second pass below
        const own: Record<string, string> = {}
        for (const sel of sv.selections ?? []) own[`axis-${sel.axisId}`] = `val-${sel.valueId}`
        combos.set(sv.variantId, own)
    }

    return server.map((sv, i) => {
        let optionValues: Record<string, string> = {}
        for (const sel of sv.selections ?? []) {
            optionValues[`axis-${sel.axisId}`] = `val-${sel.valueId}`
        }
        // A pack has no selections of its own — take the base's, so it sits under the
        // combination it packs instead of colliding with every other pack of that size.
        if (Object.keys(optionValues).length === 0 && sv.pack?.baseVariantId) {
            optionValues = combos.get(sv.pack.baseVariantId) ?? {}
        }
        const existing = (prev.variants ?? []).find(v => v.id === String(sv.variantId))
        const base = existing ?? emptyVariant(i)
        const label = sv.label ?? sv.name?.en ?? sv.uid ?? `Variant ${sv.variantId}`
        // ── the price rows, folded back into the sheet's shape ────────────────
        // The sheet is variants x cities grouped BY COUNTRY, so each row has to land in
        // the regionalData entry for its city's country — the API keys a price row by
        // cityId alone (the country is derivable), so the map is what puts it back.
        //
        // Tiers come with it: a tier is read at the same scope its price row was found
        // at (D-C63), so a city row's ladder belongs to that city and nowhere else.
        const regional = new Map<Country, NonNullable<ProductVariant["regionalData"]>[number]>()
        if (prices !== null) {
        for (const r of base.regionalData ?? []) regional.set(r.country, { ...r, cityPrices: [], multiBuyTiers: undefined })
        for (const row of prices[sv.variantId] ?? []) {
            if (row.cityId == null) continue          // country-scoped rows are another screen's
            const country = cityCountry[String(row.cityId)]
            if (!country) continue                    // a city this frontend cannot place
            const entry = regional.get(country) ?? {
                country, sku: "", zohoId: "", price: 0, isAvailable: true, cityPrices: [],
            }
            entry.cityPrices = [...(entry.cityPrices ?? []), {
                cityId: String(row.cityId),
                price: row.price,
                retailPrice: row.retailPrice,
            }]
            for (const t of row.multiBuyTiers ?? []) {
                entry.multiBuyTiers = [...(entry.multiBuyTiers ?? []), {
                    minQuantity: t.minQty, discountPct: t.discountValue, cityId: String(row.cityId),
                }]
            }
            regional.set(country, entry)
        }
        }

        // ── the pack block ────────────────────────────────────────────────────
        // A pack IS a variant (D-C59), so a saved pack arrives in this same list carrying a
        // `pack` block. Without mapping it the pack comes back looking like an ordinary
        // variant: the Session Packs ladder renders empty over packs that exist, and the
        // next save would try to CREATE them again — DUPLICATE_PACK on every one.
        //
        // `undefined` interval is meaningful, not missing: it means the customer books each
        // session (D-C30 §4), so it is passed through rather than defaulted.
        const sessionPack = sv.pack?.baseVariantId
            ? {
                baseVariantId: String(sv.pack.baseVariantId),
                sessions: sv.pack.sessions ?? 0,
                sessionIntervalDays: sv.pack.intervalDays ?? undefined,
                validityDays: sv.pack.validityDays ?? undefined,
                intendedDiscountPct: sv.pack.intendedDiscountPct ?? undefined,
            }
            : base.sessionPack

        return {
            ...base,
            id: String(sv.variantId),
            optionValues,
            sessionPack,
            regionalData: regional.size > 0 ? [...regional.values()] : base.regionalData,
            variantLabelEn: sv.label ?? base.variantLabelEn ?? "",
            nameEn: sv.name?.en || base.nameEn || label,
            nameAr: sv.name?.ar || base.nameAr || "",
            // The variant uid (IV-2-01 — what an invoice line carries) has no home on the
            // frontend's ProductVariant. Worth adding when the grid shows it; dropping it
            // silently here would be the same class of bug as the Internal Code box that
            // read a field nothing ever set.
            status: (sv.status ?? "").toUpperCase() === "ACTIVE" ? "active" : "inactive",
            isDefault: !!sv.isDefault,
        } as ProductVariant
    })
}

function emptyVariant(sortOrder: number): ProductVariant {
    return {
        id: rid(), slugEn: "", slugAr: "", nameEn: "", nameAr: "",
        shortDescriptionEn: "", shortDescriptionAr: "",
        variantType: "size", variantLabelEn: "", variantLabelAr: "",
        imageUrl: "", vat: 5, isDefault: sortOrder === 0, sortOrder,
        status: "inactive", stockQuantity: 0, lowStockThreshold: 10,
        customFields: {}, regionalData: [],
        mediaGallery: [], seoTitleEn: "", seoTitleAr: "", seoDescriptionEn: "", seoDescriptionAr: "",
    }
}

/**
 * Older drafts kept per-variant galleries on the variant rows (the Variants tab had its own
 * upload block). The Media Gallery section is the ONE door now — each asset names its variant —
 * so stored per-variant assets fold into the master list, tagged, and the variant rows let go.
 */
function foldVariantMedia(l: Listing): Listing {
    // Drafts saved under the SINGLE-select "Applies to" carry `variantId` (singular) on
    // master-list assets; without this they'd silently demote to product-level and show
    // on every variant. One field rename, applied on load like the fold below.
    const upgraded = (l.mediaGallery ?? []).map(a => {
        const legacy = (a as { variantId?: string }).variantId
        if (a.variantIds || !legacy) return a
        const next = { ...a, variantIds: [legacy] }
        delete (next as { variantId?: string }).variantId   // never persist the stale key back
        return next
    })
    const folded = (l.variants ?? []).flatMap(v =>
        (v.mediaGallery ?? []).map(a => ({ ...a, variantIds: a.variantIds ?? [v.id] })))
    if (!folded.length && upgraded.every((a, i) => a === (l.mediaGallery ?? [])[i])) return l
    const seen = new Set(upgraded.map(a => a.assetId))
    return {
        ...l,
        mediaGallery: [...upgraded, ...folded.filter(a => !seen.has(a.assetId))],
        variants: (l.variants ?? []).map(v => ({ ...v, mediaGallery: undefined })),
    }
}

function emptyListing(): Listing {
    return { ...listingDefaults(), id: "" }
}


/**
 * A brand's display name.
 *
 * ⚠️ `BrandDto.name` is a PLAIN STRING — `record BrandDto(Long id, String name, String logo)`.
 * It is the exception: every other name in this API is a LocalizedTextDto, and reading
 * `.en` off this one silently yielded undefined, so the dropdown showed "Brand 1"
 * instead of "Valeo". Objects are still tolerated in case the DTO is ever localised.
 */
function brandLabel(b: { id: number; name?: unknown }): string {
    const n = b.name
    if (typeof n === "string" && n.trim()) return n.trim()
    if (n && typeof n === "object") {
        const loc = n as { en?: string | null; ar?: string | null }
        if (loc.en?.trim()) return loc.en.trim()
        if (loc.ar?.trim()) return loc.ar.trim()
    }
    return `Brand ${b.id}`
}

export default function ListingEditorPage() {
    const params = useParams()
    const isNew = params.id === "new"

    const router = useRouter()
    const [listing, setListing] = useState<Listing>(emptyListing())
    const [activeSection, setActiveSection] = useState("classification")
    /** Which variant card is expanded. One at a time — see the note on the card header. */
    const [openVariantId, setOpenVariantId] = useState<string | null>(null)
    const [loading, setLoading] = useState(!isNew)
    const [showErrors, setShowErrors] = useState(false)
    // Incremental persistence: the real listing id (blank until the first save
    // mints a draft in the store), plus save-status flags and the activation gate.
    const [currentId, setCurrentId] = useState<string>(isNew ? "" : (params.id as string))
    const [saving, setSaving] = useState(false)
    const [justSaved, setJustSaved] = useState(false)
    const [activationOpen, setActivationOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)

    const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
    // The service's tree, kept beside the mapped list: the numeric ids are what
    // ClassificationRequest.subDepartmentId actually sends, and `departmentTree`
    // is what says which departments the service can accept a listing under.
    const [departmentTree, setDepartmentTree] = useState<DepartmentDto[]>([])
    const [dbIds, setSubDepartmentDbIds] = useState<Record<string, number>>({})
    const [taxonomyError, setTaxonomyError] = useState<string | null>(null)
    const [providers, setProviders] = useState<ServiceProvider[]>([])
    const [features, setFeatures] = useState<InternalCategory[]>([])
    const [partners, setPartners] = useState<CataloguePartner[]>([])
    const [listings, setListings] = useState<Listing[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [healthTeam, setHealthTeam] = useState<Practitioner[]>([])
    /**
     * Listings sellable as a follow-up after a session: consultations, minus
     * this one. Excluding self is not cosmetic — a package whose follow-up is
     * itself loops forever at checkout.
     */
    const consultFollowUps = useMemo(
        () => listings
            .filter(l => l.department === "consultations" && l.id !== listing.id)
            .map(l => ({ id: l.id, displayNameEn: l.displayNameEn, internalName: l.internalName })),
        [listings, listing.id])
    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
    const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([])
    // Source-system feeds for the per-variant, per-country dropdowns (mock stand-ins
    // for Zoho Books + Unicommerce). Loaded once; filtered by the row's country.
    const [zohoItems, setZohoItems] = useState<{ zohoId: string; name: string; country: Country }[]>([])
    const [uniSkus, setUniSkus] = useState<{ sku: string; itemCode: string; name: string; country: Country }[]>([])

    useEffect(() => {
        // Deep-links (from the Overview "plays" and go-live "Fix →" links) can
        // seed the editor: ?section= jumps to a section; new listings inherit
        // ?department / ?fulfilment / ?form / ?subDepartment so the play lands
        // pre-configured on the right department's fields.
        const sp = new URLSearchParams(window.location.search)
        const section = sp.get("section")
        if (section) setActiveSection(section)
        const subSlug = sp.get("subDepartment")
        const deptParam = sp.get("department")
        if (isNew) {
            const dept = deptParam as Listing["department"] | null
            const fulfil = sp.get("fulfilment") as Listing["fulfilmentPath"] | null
            const form = sp.get("form") as MedicineForm | null
            setListing(prev => ({
                ...prev,
                ...(dept ? { department: dept } : {}),
                ...(fulfil ? { fulfilmentPath: fulfil } : {}),
                ...(form ? { attributes: { ...prev.attributes, medicineForm: form } } : {}),
                // Diagnostics is created as either a Mini or a Proper package; the
                // choice is made before the editor opens and seeds the block here.
                ...(dept === "diagnostics"
                    ? { diagnostics: { tier: (sp.get("tier") === "mini" ? "mini" : "proper") as DiagnosticsTier } }
                    : {}),
                // A DRIP opens in matrix mode with VOLUME already declared. D-C27 makes VOLUME
                // mandatory on every drip — single-size included, one value, pre-selected — so
                // there is no single-variant path for an infusion: the axes ARE the variant list.
                // Seeding it is what removes the hand-add route, because a hand-added variant
                // answers no axis and D-C7 requires every declared axis to be answered.
                //
                // ⚠️ KEYED ON THE SUB-DEPARTMENT, NOT THE DEPARTMENT. It used to seed for every
                // `dept === "treatments"` listing, which handed PHYSIOTHERAPY a Volume axis and an
                // Infusion speed — a physio session has neither, and because axes existed the
                // "does this vary?" question could never be asked. `mandatoryAxisKindsFor` is the
                // same source of truth that disables "sold as one item", so the seed and the lock
                // can no longer disagree.
                // ⚠️ NO LOCAL AXIS SEED. The server seeds axes on POST /products, from the
                // family policy (TreatmentsCommercePolicy.seedAxes: `volume` empty, `speed`
                // with Normal/Slow Drip). This used to seed the same two here as well — two
                // seeders for one fact, agreeing by luck rather than by design, and drifting
                // the moment the policy changed.
                //
                // Consequence, deliberately: a NEW listing shows no axes until its first save.
                // That is honest — the product does not exist yet, so neither do its axes — and
                // the save re-reads them (see `refreshAxesAfterCreate`).
            }))
            // A mini package is a single test — jump straight to the type/collection
            // step so the operator sees what makes it different immediately.
            if (dept === "diagnostics" && !section) setActiveSection("dxPackage")
        }
        // The taxonomy comes from the content service: it owns WHICH sub-departments
        // exist, joined to this file's slug-keyed behaviour on `code`. The mock is the
        // fallback, not the source — if the service is unreachable the editor stays
        // usable, but `taxonomyError` says so rather than showing a silently short list.
        const applySubDepartments = (sd: SubDepartment[]) => {
            setSubDepartments(sd)
            if (isNew && subSlug) {
                const match = sd.find(s => s.slug === subSlug && (!deptParam || s.department === deptParam))
                if (match) setListing(prev => ({ ...prev, subDepartmentId: match.id }))
            }
        }
        fetchDepartments()
            .then(tree => {
                setDepartmentTree(tree)
                setSubDepartmentDbIds(subDepartmentDbIds(tree))
                setTaxonomyError(null)
                applySubDepartments(toSubDepartments(tree))
            })
            .catch((e: unknown) => {
                setTaxonomyError(e instanceof ApiError ? e.message : "Could not load departments.")
                ApiService.catalogue.subDepartments().then(applySubDepartments)
            })
        ApiService.catalogue.serviceProviders().then(setProviders)
        ApiService.catalogue.healthTeam().then(setHealthTeam)
        ApiService.catalogue.questionnaires().then(setQuestionnaires)
        ApiService.catalogue.internalCategories().then(setFeatures)
        ApiService.catalogue.partners().then(setPartners)
        ApiService.catalogue.cities().then(setCities)
        ApiService.catalogue.promoBanners().then(setPromoBanners)
        ApiService.catalogue.zohoBookItems().then(setZohoItems)
        ApiService.catalogue.unicommerceSkus().then(setUniSkus)
        // ── The one row this editor is about ──────────────────────────────────
        // This used to await ApiService.catalogue.listings(): a SERIAL walk of every
        // page of GET /products — O(catalogue) round trips — to find one id. A numeric
        // id IS a content-service product id, so seed the shell directly and let
        // hydration (which reads per-section anyway) fill every field; the walk taught
        // it nothing hydration doesn't re-read. Only a non-numeric id — a local
        // prototype listing — still consults the local store.
        if (!isNew && typeof params.id === "string" && /^\d+$/.test(params.id)) {
            // Remembered so hydration knows the form is a blank placeholder and
            // does not report "loading" as "drift".
            openedFromService.current = true
            setListing(prev => ({
                ...prev,
                id: params.id as string,
                apiProductId: Number(params.id),
            }))
            setLoading(false)
            setBootstrapped(true)
        } else if (!isNew && typeof params.id === "string") {
            ApiService.catalogue.listings().then(list => {
                const found = list.find(l => l.id === params.id)
                if (found) setListing(foldVariantMedia({ ...emptyListing(), ...found }))
                setLoading(false)
                // Editor has its data (or its seeded draft) — take the dirty baseline.
                setBootstrapped(true)
            })
        } else {
            setBootstrapped(true)
        }
    }, [isNew, params.id])

    // ── The full listings list, LAZILY (the pickers' data, not the editor's) ──
    // Frequently Bought, Also Viewed and the consultation add-on picker are the only
    // consumers, and most edits never open them. Fetched on first entry to one of
    // those sections instead of on every editor open; until then the duplicate
    // internal-name hint stays quiet (the service enforces uniqueness either way,
    // as a named 409 on save).
    const listingsRequested = useRef(false)
    const needsListings = ["frequentlyBought", "recommendations", "consultation"]
        .includes(activeSection)
    useEffect(() => {
        if (!needsListings || listingsRequested.current) return
        listingsRequested.current = true
        ApiService.catalogue.listings().then(setListings)
    }, [needsListings])

    const { user } = useAuth()
    // Unsaved-work guard: baseline is taken once the editor has finished loading
    // (or seeding a new draft), then re-taken after every successful save.
    const [bootstrapped, setBootstrapped] = useState(false)
    const dirtyTracker = useDirtyTracker(listing)
    // Content-service sync (Health Products only — the one department the API covers).
    const [apiResults, setApiResults] = useState<SectionResult[] | null>(null)
    const [apiSyncing, setApiSyncing] = useState(false)
    const [apiSyncOpen, setApiSyncOpen] = useState(false)
    // Brands come from the content service (FK), not free text.
    const [apiBrands, setApiBrands] = useState<{ id: number; label: string }[]>([])
    // What the service returned that disagreed with the local copy on load.
    const [drift, setDrift] = useState<DriftedField[]>([])
    // Markets the SERVICE has, not every market the frontend can name.
    const [apiCountries, setApiCountries] = useState<Country[] | null>(null)
    /**
     * Axis codes this product's FAMILY requires, from the service.
     *
     * Replaces mandatoryAxisKindsFor(slug) — a frontend copy of TreatmentsCommercePolicy that
     * would silently disagree the moment the policy changed. generate() checks the server's
     * list, so the screen has to show the server's list.
     */
    const [mandatoryAxisCodes, setMandatoryAxisCodes] = useState<string[]>([])
    const [generating, setGenerating] = useState(false)
    const [generateError, setGenerateError] = useState<string | null>(null)
    const [hydrated, setHydrated] = useState(false)
    /**
     * One-shot guard, in a REF not state.
     *
     * As state it was in this effect's own dependency array, so setting it re-ran the
     * effect, which fired the previous run's cleanup, which set `alive = false` — and
     * the in-flight fetch then discarded its own result. Hydration was working and
     * throwing the answer away. A ref does not retrigger the effect.
     */
    const hydrationStarted = useRef(false)
    // A service product whose READ failed outright: the form under it is a blank shell,
    // and rendering that editable read as "new Health Products listing" over a product
    // that exists. Block the editor with the truth instead.
    const [loadFailed, setLoadFailed] = useState<string | null>(null)
    const [hydrateAttempt, setHydrateAttempt] = useState(0)
    /** True when this editor was opened by product id with no local copy to compare against. */
    const openedFromService = useRef(false)
    // Brands, once on mount. Two things were wrong with keying this to the department:
    //
    //  · it was gated to health_products, so a Treatments listing got no brands at all —
    //    and the reason it seemed to work is worse than the bug: the editor opens with
    //    `department` defaulting to health_products, so the fetch fired, and hydration
    //    then corrected it to treatments. It worked by accident.
    //  · the `alive` cleanup ran when the department changed, which is EXACTLY when
    //    hydration changes it — so an in-flight fetch discarded its own result. Same
    //    self-cancelling shape as the hydration bug.
    //
    // Brands are global (a FK on product_master), not department-scoped, so there is
    // nothing to key on.
    useEffect(() => {
        fetchAvailableCountries()
            .then(setApiCountries)
            // null keeps the built-in list as the fallback rather than emptying the picker:
            // a failed lookup must not make every market look unavailable.
            .catch(() => setApiCountries(null))
    }, [])

    useEffect(() => {
        getBrands()
            .then(bs => setApiBrands(bs.map(b => ({ id: b.id, label: brandLabel(b) }))))
            .catch(() => { /* dropdown stays empty; brand is optional */ })
    }, [])
    // ── Read the service's copy back ──────────────────────────────────────────
    // Runs once, after bootstrap, for a listing that already exists server-side.
    // The service owns these sections, so its values win — and anything that
    // disagreed is reported rather than silently overwritten, because that
    // disagreement is the only evidence available that a write did not land.
    useEffect(() => {
        if (!bootstrapped || hydrationStarted.current) return
        const productId = listing.apiProductId
        if (!productId) return
        // Wait for the city list. Price rows are keyed by cityId and the sheet groups them by
        // COUNTRY, so hydrating before cityCountry is populated silently drops every price —
        // the grid would render empty over a product that is fully priced, which is exactly
        // the failure this hydration exists to fix.
        if (cities.length === 0) return
        hydrationStarted.current = true
        // No `alive` flag: `listing` is in this effect's deps and changes constantly, so
        // any cleanup-based cancellation kills a fetch that is still wanted. React 18+
        // does not warn on setState after unmount, and this runs exactly once.
        ;(async () => {
            try {
                const { subs, countries } = await loadLookups()
                const res = await hydrateFromService(
                    productId, listing, subs, countries, !openedFromService.current)
                if (Object.keys(res.patch).length) {
                    // Computed OUTSIDE the updater: markCleanAs is itself a state setter,
                    // and calling one from inside another setter's updater makes the
                    // updater impure — React then warns about updating state during
                    // render and the snapshot can be taken against a stale value.
                    const next = { ...listing, ...res.patch }
                    setListing(next)
                    // The server's copy IS the clean state — without re-baselining,
                    // hydration would register as unsaved edits and the guard would
                    // offer to save the values it just read.
                    dirtyTracker.markCleanAs(next)
                }
                setDrift(res.drift)
                if (res.mandatoryAxisCodes) setMandatoryAxisCodes(res.mandatoryAxisCodes)
                if (res.serverVariants?.length) {
                    setListing(prev => ({
                        ...prev,
                        variants: toLocalVariants(
                            res.serverVariants!, prev, res.serverPrices, cityCountry),
                    }))
                }
                if (res.failed.length) {
                    setApiResults(prev => [...(prev ?? []),
                        ...res.failed.map(f => ({ section: `read ${f.section}`, ok: false, error: f.error }))])
                    // The WHOLE document failing over a blank shell is not an editable state —
                    // a save from it would run the create-style pass against a real product.
                    const wholeRead = res.failed.find(f => f.section === "product")
                    if (wholeRead && openedFromService.current) setLoadFailed(wholeRead.error)
                }
            } catch (e) {
                // Was swallowed entirely, which made a failed read look identical to a
                // product that genuinely has no data — the worst of both.
                const reason = e instanceof ApiError ? e.message
                    : e instanceof Error ? e.message : "Could not read this product back."
                setApiResults(prev => [...(prev ?? []), {
                    section: "read classification/identity", ok: false, error: reason,
                }])
                if (openedFromService.current) setLoadFailed(reason)
            } finally {
                setHydrated(true)
            }
        })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bootstrapped, listing.apiProductId, cities.length, hydrateAttempt])

    useEffect(() => {
        // depends on `listing` so it fires after the load/seed flush, and the
        // hasSnapshot guard makes it happen exactly once
        if (bootstrapped && !dirtyTracker.hasSnapshot) dirtyTracker.markClean()
    }, [bootstrapped, listing, dirtyTracker])
    const update = (patch: Partial<Listing>) => setListing(prev => ({ ...prev, ...patch }))
    const updateAttr = (patch: Partial<Listing["attributes"]>) =>
        setListing(prev => ({ ...prev, attributes: { ...prev.attributes, ...patch } }))

    // ── arrays on the listing ──
    const benefits = listing.benefits ?? []
    const ingredients = listing.ingredients ?? []
    const deliveryConfig = listing.deliveryConfig ?? []
    const mediaGallery = listing.mediaGallery ?? []
    const reviews = listing.reviews ?? []
    const influencerVideos = listing.influencerVideos ?? []
    const faq = listing.faq ?? []
    const countryConfig = listing.countryConfig ?? []
    const variants = listing.variants ?? []
    const superiority = listing.superiorityBlock ?? { headlineEn: "", headlineAr: "", mediaType: null, mediaUrl: "", thumbnailUrl: "", points: [] }

    const addBenefit = () => update({ benefits: [...benefits, { iconKey: "", labelEn: "", labelAr: "", descriptionEn: "", descriptionAr: "" }] })
    const updateBenefit = (i: number, patch: Partial<Benefit>) => update({ benefits: benefits.map((b, idx) => idx === i ? { ...b, ...patch } : b) })
    const removeBenefit = (i: number) => update({ benefits: benefits.filter((_, idx) => idx !== i) })

    const addIngredient = () => update({ ingredients: [...ingredients, { nameEn: "", nameAr: "", amount: 0, unit: "", dailyValuePct: null }] })
    const updateIngredient = (i: number, patch: Partial<Ingredient>) => update({ ingredients: ingredients.map((x, idx) => idx === i ? { ...x, ...patch } : x) })
    const removeIngredient = (i: number) => update({ ingredients: ingredients.filter((_, idx) => idx !== i) })

    const addDelivery = () => update({ deliveryConfig: [...deliveryConfig, { city: "", deliveryTime: "", isAvailable: true }] })
    const updateDelivery = (i: number, patch: Partial<DeliveryConfig>) => update({ deliveryConfig: deliveryConfig.map((d, idx) => idx === i ? { ...d, ...patch } : d) })
    const removeDelivery = (i: number) => update({ deliveryConfig: deliveryConfig.filter((_, idx) => idx !== i) })

    const addProductAsset = () => update({ mediaGallery: [...mediaGallery, { assetId: rid(), type: "image", url: "", altTextEn: "", altTextAr: "", sortOrder: mediaGallery.length, isHero: mediaGallery.length === 0 }] })
    const updateProductAsset = (i: number, patch: Partial<MediaAsset>) => update({ mediaGallery: mediaGallery.map((a, idx) => idx === i ? { ...a, ...patch } : a) })
    const removeProductAsset = (i: number) => update({ mediaGallery: mediaGallery.filter((_, idx) => idx !== i) })


    const addReview = () => update({ reviews: [...reviews, { id: rid(), reviewerName: "", rating: 5, reviewTextEn: "", isVerified: true, sortOrder: reviews.length }] })
    const updateReview = (id: string, patch: Partial<CustomerReview>) => update({ reviews: reviews.map(r => r.id === id ? { ...r, ...patch } : r) })
    const removeReview = (id: string) => update({ reviews: reviews.filter(r => r.id !== id) })

    const addInfluencer = () => update({ influencerVideos: [...influencerVideos, { id: rid(), handle: "", platform: "instagram", videoUrl: "", thumbnailUrl: "", sortOrder: influencerVideos.length }] })
    const updateInfluencer = (id: string, patch: Partial<InfluencerVideo>) => update({ influencerVideos: influencerVideos.map(v => v.id === id ? { ...v, ...patch } : v) })
    const removeInfluencer = (id: string) => update({ influencerVideos: influencerVideos.filter(v => v.id !== id) })

    const addFaq = () => update({ faq: [...faq, { questionEn: "", questionAr: "", answerEn: "", answerAr: "", sortOrder: faq.length }] })
    const updateFaq = (i: number, patch: Partial<FAQItem>) => update({ faq: faq.map((f, idx) => idx === i ? { ...f, ...patch } : f) })
    const removeFaq = (i: number) => update({ faq: faq.filter((_, idx) => idx !== i) })

    const addCountryConfig = (country: Country) => update({
        countryConfig: [...countryConfig, {
            country, status: "active",
            isCodEligible: false, isCouponDiscountBlocked: false, isCouponThresholdExcluded: false,
            isSubscriptionEnabled: false, isSubscriptionAutoSelected: false,
        }],
    })
    const updateCountryConfig = (country: Country, patch: Partial<CatalogCountryConfig>) => update({ countryConfig: countryConfig.map(c => c.country === country ? { ...c, ...patch } : c) })

    const updateSuperiority = (patch: Partial<SuperiorityBlock>) => update({ superiorityBlock: { ...superiority, ...patch } })
    const addSuperiorityPoint = () => updateSuperiority({ points: [...superiority.points, { titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "" }] })
    const updateSuperiorityPoint = (i: number, patch: Partial<SuperiorityPoint>) => updateSuperiority({ points: superiority.points.map((p, idx) => idx === i ? { ...p, ...patch } : p) })
    const removeSuperiorityPoint = (i: number) => updateSuperiority({ points: superiority.points.filter((_, idx) => idx !== i) })

    /**
     * IV's two axes are MANDATORY, so they are ensured here rather than only seeded from
     * a deep link. VOLUME is mandatory by D-C27 ("every drip declares it, single-size
     * included"); INFUSION SPEED because every infusion runs at a speed — Normal is not a
     * choice, and the only real question is whether Slow Drip is offeended is offered, which is that
     * value's Active switch.
     *
     * Seeding at creation alone was not enough: a listing created without
     * ?subDepartment= gets its sub-department in Classification afterwards, so the axis
     * never appeared and the variants had no speed at all.
     *
     * ⚠️ Existing variants are ANSWERED, not left unset. Declaring an axis that existing
     * variants do not answer would make every one of them invalid under D-C7 ("every
     * declared axis must be answered"). Stamping Normal is not a change of meaning — a
     * drip already ran at normal speed; the axis just names it.
     */
    // ── The Infusion speed back-fill is GONE ──────────────────────────────────
    // It ran on every mount and added a `speed` axis to any IV listing missing one — a
    // THIRD seeder beside the creation seed and the server's own.
    //
    // With axes hydrated it became actively destructive rather than merely redundant: the
    // axis it created had NO axisId, and toVariantAxes() sends axisId back as the merge key,
    // so the next save would have created a SECOND speed axis server-side and regenerated
    // variants under a signature that no price pointed at.
    //
    // The server seeds `volume` and `speed` from the family policy on create
    // (TreatmentsCommercePolicy.seedAxes) and hydration reads them back. One seeder.

    // ── Identity: the uid prefix, the clash check and a department-aware placeholder ──
    // uid is `{departments.code}-{product_id}` (D-C53). The PREFIX is knowable as soon
    // as Classification is done; the number only on first save — so a draft shows
    // `IV-…` rather than an empty box or a fabricated number.
    const uidPrefix = uidPrefixFor(listing.subDepartmentId)
    // internal_name is `VARCHAR(100) NULL UNIQUE`. Caught here so a duplicate reads as
    // a named clash instead of surfacing as a MySQL 1062 on save.
    const internalNameClash = useMemo(() => {
        const v = listing.internalName?.trim().toLowerCase()
        if (!v) return undefined
        const other = listings.find(l =>
            l.id !== currentId && l.internalName?.trim().toLowerCase() === v)
        return other ? (other.displayNameEn || other.internalName) : undefined
    }, [listing.internalName, listings, currentId])
    const internalNamePlaceholder = uidPrefix
        ? `e.g. ${uidPrefix.toLowerCase()}-nad-250mg (admin only)`
        : "admin-only label"

    // ── Health Products PDP contract (department-gated) ──
    const pd = listing.department === "health_products"
    // ── Diagnostics-only state. Every diagnostics addition is gated on this flag so
    //    no other department's editor changes shape. ──
    const dx = listing.department === "diagnostics"
    const dxConfig: DiagnosticsConfig = listing.diagnostics ?? { tier: "proper" }
    const patchDx = (patch: Partial<DiagnosticsConfig>) =>
        update({ diagnostics: { ...dxConfig, ...patch } })
    // ── Treatments-only, gated exactly like the diagnostics block ──
    // Programs are a Doctors & Health Coaches sub-department, so the builder is
    // gated on the sub-department rather than the department.
    const isProgram = listing.department === "consultations"
        && subDepartments.find(sd => sd.id === listing.subDepartmentId)?.slug === "programs"
    // Consultation is a sibling sub-department of Programs, gated the same way.
    const isConsultation = isConsultationSubDept(subDepartments.find(sd => sd.id === listing.subDepartmentId))
    const consultConfig: ConsultationConfig = listing.consultation ?? {}
    const patchConsultation = (patch: Partial<ConsultationConfig>) =>
        update({ consultation: { ...consultConfig, ...patch } })
    const programConfig: ProgramConfig = listing.program ?? { startMode: "rolling" }
    const patchProgram = (patch: Partial<ProgramConfig>) =>
        update({ program: { ...programConfig, ...patch } })
    const tx = listing.department === "treatments"
    // Home & Personal Care sells the same commerce shape as treatments — CITY-scoped
    // prices, session packs over a base variant (D-C59), the D-C62 slot flag, no
    // SKU/stock and no subscriptions — so every surface gated `svc` serves both.
    // What stays `tx` is genuinely treatment-specific: administration method, drip
    // speed, bags (flowForSubDepartment).
    const hc = listing.department === "home_personal"
    const svc = tx || hc
    const txConfig: TreatmentsConfig = listing.treatments ?? {}
    const patchTx = (patch: Partial<TreatmentsConfig>) =>
        update({ treatments: { ...txConfig, ...patch } })
    const dxBiomarkerGap = dx && countryConfig.length > 0
        && countryConfig.some(c => biomarkerCount(dxConfig, c.country) === 0)

    const howToUse = listing.howToUse ?? []
    const addHowToUse = () => update({
        howToUse: howToUse.length === 0
            ? [
                { iconKey: "dosage", textEn: "Dosage", textAr: "", subTextEn: "", subTextAr: "" },
                { iconKey: "timing", textEn: "Timing", textAr: "", subTextEn: "", subTextAr: "" },
                { iconKey: "storage", textEn: "Storage", textAr: "", subTextEn: "", subTextAr: "" },
            ]
            : [...howToUse, { iconKey: "", textEn: "", textAr: "", subTextEn: "", subTextAr: "" }],
    })
    const updateHowToUse = (i: number, patch: Partial<HowToUseItem>) => update({ howToUse: howToUse.map((x, idx) => idx === i ? { ...x, ...patch } : x) })
    const removeHowToUse = (i: number) => update({ howToUse: howToUse.filter((_, idx) => idx !== i) })

    const comparison = listing.comparison ?? { valeoTitleEn: "", otherTitleEn: "", rows: [] }
    const updateComparison = (patch: Partial<NonNullable<Listing["comparison"]>>) => update({ comparison: { ...comparison, ...patch } })
    const addComparisonRow = () => updateComparison({ rows: [...comparison.rows, { textEn: "", textAr: "", valeo: true, other: false }] })
    const updateComparisonRow = (i: number, patch: Partial<ComparisonRow>) => updateComparison({ rows: comparison.rows.map((r, idx) => idx === i ? { ...r, ...patch } : r) })
    const removeComparisonRow = (i: number) => updateComparison({ rows: comparison.rows.filter((_, idx) => idx !== i) })

    const stats = listing.stats ?? { titleEn: "", items: [] }
    const updateStats = (patch: Partial<NonNullable<Listing["stats"]>>) => update({ stats: { ...stats, ...patch } })
    const addStatItem = () => updateStats({ items: [...stats.items, { value: "", labelEn: "", labelAr: "" }] })
    const updateStatItem = (i: number, patch: Partial<StatItem>) => updateStats({ items: stats.items.map((s, idx) => idx === i ? { ...s, ...patch } : s) })
    const removeStatItem = (i: number) => updateStats({ items: stats.items.filter((_, idx) => idx !== i) })

    const clinicianReviews = listing.clinicianReviews ?? []
    const addClinician = () => update({ clinicianReviews: [...clinicianReviews, { id: rid(), name: "", designation: "", reviewEn: "", reviewAr: "", imageUrl: "", experienceYears: undefined }] })
    const updateClinician = (id: string, patch: Partial<ClinicianReview>) => update({ clinicianReviews: clinicianReviews.map(c => c.id === id ? { ...c, ...patch } : c) })
    const removeClinician = (id: string) => update({ clinicianReviews: clinicianReviews.filter(c => c.id !== id) })

    const frequentlyBought = listing.frequentlyBought ?? { couponDiscount: undefined, discountType: "percentage" as const, listingIds: [] }
    const updateFrequentlyBought = (patch: Partial<NonNullable<Listing["frequentlyBought"]>>) => update({ frequentlyBought: { ...frequentlyBought, ...patch } })

    const recommendationIds = listing.recommendationIds ?? []

    // ── variant helpers ──
    /**
     * Accepts a function as well as an array, and that is not a convenience.
     *
     * `update` merges a patch computed by the CALLER, so an array form is a value read
     * off the current render. Several editors write one variant at a time in a loop — a
     * pack's fill sets five cities by calling the per-city setter five times — and every
     * one of those calls would read the same stale array, leaving only the last write.
     * That is exactly the bug the "Fill at 10% off" button had: five cities filled, one
     * survived. The functional form threads each write through the previous state, so
     * calls in a single tick compose instead of overwriting each other.
     */
    const setVariants = (v: ProductVariant[] | ((prev: ProductVariant[]) => ProductVariant[])) =>
        setListing(prev => ({
            ...prev,
            variants: typeof v === "function" ? v(prev.variants ?? []) : v,
        }))
    const addVariant = () => setVariants([...variants, emptyVariant(variants.length)])
    const updateVariant = (id: string, patch: Partial<ProductVariant>) => setVariants(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v))
    /**
     * Deleting a variant RE-HOMES the default if it was holding it.
     *
     * It was a plain filter. `product_variants.is_default` needs exactly one holder — it is what the
     * PDP preselects — so deleting the default left a listing with none, silently, and nothing
     * checked it. That is not hypothetical: the fix for the stale `IV NAD — Normal` variant is to
     * delete it, and it is exactly the row that holds the flag.
     *
     * The flag goes to the lowest `sortOrder` remaining, matching the "first variant" rule that
     * assigned it in the first place. An operator can move it afterwards; what they cannot do is
     * notice its absence, which is why this does not simply leave it to them.
     */
    const removeVariant = (id: string) => setVariants(prev => {
        const kept = prev.filter(v => v.id !== id)
        if (kept.length === 0 || kept.some(v => v.isDefault)) return kept
        const heir = [...kept].sort((a, b) => a.sortOrder - b.sortOrder)[0]
        return kept.map(v => ({ ...v, isDefault: v.id === heir.id }))
    })
    const duplicateVariant = (id: string) => {
        const src = variants.find(v => v.id === id); if (!src) return
        setVariants([...variants, { ...src, id: rid(), isDefault: false, sortOrder: variants.length, regionalData: src.regionalData.map(r => ({ ...r, sku: "" })) }])
    }
    const setDefaultVariant = (id: string) => setVariants(prev => prev.map(v => ({ ...v, isDefault: v.id === id })))
    const toggleCountry = (variantId: string, country: Country) => {
        const v = variants.find(x => x.id === variantId); if (!v) return
        const exists = v.regionalData.find(r => r.country === country)
        const next: RegionalData[] = exists
            ? v.regionalData.filter(r => r.country !== country)
            : [...v.regionalData, { country, sku: "", zohoId: "", price: 0, vat: 5, warehouse: "", isAvailable: true }]
        updateVariant(variantId, { regionalData: next })
    }
    /**
     * Mint pack variants (D-C59). A pack IS a `product_variants` row, so this creates
     * real variants — it does not write into some separate packs collection.
     *
     * The new variant inherits the base's AXIS ANSWERS (same dose, same volume, same
     * speed), which is why `comboKey` appends the `|S:N` suffix: without it the pack and
     * its base would key identically and collide on
     * `uk_variant_axes (product_id, axis_signature)`. The suffix is never parsed — the
     * satellite is the sole truth for what a pack is.
     *
     * Prices are SEEDED from `intendedDiscountPct` against the base's own city rows, so
     * the D-C59 write-time ceiling (`selling <= sessions × base selling`) holds by
     * construction. An unpriced base seeds nothing, which is correct: the ceiling is
     * scoped "where the base is priced".
     */
    const createPacks = (specs: { baseVariantId: string; pack: VariantSessionPack }[]) => {
        const created = specs.map((spec, i) => {
            const base = variants.find(v => v.id === spec.baseVariantId)!
            const baseLabel = comboLabel(base.optionValues, variantOptions, "en")
                || base.variantLabelEn || base.nameEn
            const suffix = `Pack of ${spec.pack.sessions}`
            const slugBit = `pack-of-${spec.pack.sessions}`
            const pct = spec.pack.intendedDiscountPct
            return {
                ...emptyVariant(variants.length + i),
                sessionPack: spec.pack,
                // Same axis answers as the base — a pack of the 250 mg Normal drip is
                // still 250 mL and Normal. What distinguishes it is `sessions`.
                optionValues: base.optionValues,
                variantType: base.variantType,
                variantLabelEn: [baseLabel, suffix].filter(Boolean).join(" · "),
                variantLabelAr: base.variantLabelAr,
                nameEn: [base.nameEn || listing.displayNameEn, suffix].filter(Boolean).join(" — "),
                nameAr: base.nameAr,
                slugEn: [base.slugEn, slugBit].filter(Boolean).join("-"),
                slugAr: [base.slugAr, slugBit].filter(Boolean).join("-"),
                status: base.status,
                // Seed the city rows from the base × sessions × (1 − intended%).
                regionalData: (base.regionalData ?? []).map(r => ({
                    ...r, sku: "", zohoId: "",
                    cityPrices: (r.cityPrices ?? [])
                        .filter(cp => cp.price > 0)
                        .map(cp => {
                            // A PACK'S RETAIL IS sessions × the base's SELLING price — what three
                            // singles cost today — and the pack's selling price is that less the
                            // intended discount. Corrected 2026-08-30 on the user's rule; it had
                            // been seeded from the base's RETAIL, which inflated the "was" figure
                            // by the single's own discount and made every pack look cheaper than
                            // it is.
                            //
                            // It also makes the D-C59 write-time ceiling structural rather than a
                            // second rule: the ceiling IS the retail price, so "selling > sessions
                            // × base selling" is simply "selling > retail", which retailFor already
                            // forbids. Both columns are the PACK total, per the schema note.
                            const retail = cp.price * spec.pack.sessions
                            const seeded = pct === undefined
                                ? retail
                                : Math.round(retail * (1 - pct / 100) * 100) / 100
                            return {
                                cityId: cp.cityId,
                                price: seeded,
                                retailPrice: retail,
                                discountType: "PERCENTAGE" as const,
                                discountValue: pct,
                            }
                        }),
                })),
            }
        })
        setVariants([...variants, ...created])
    }

    /**
     * The Generate button.
     *
     * Local-only for a product that does not exist yet — there is nothing to POST against, and
     * building the rows locally still lets the operator see the shape before the first save.
     *
     * For a saved product it goes to the SERVICE: PUT the axes, POST generate, read back. The
     * grid then shows what the server built rather than what the client predicted, and the
     * refusals arrive at the press instead of during a later save.
     */
    const handleGenerate = async (combos: Record<string, string>[]) => {
        const productId = listing.apiProductId
        if (!productId) {
            generateVariants(combos)
            return
        }
        setGenerating(true)
        setGenerateError(null)
        try {
            const res = await generateOnServer(productId, listing)
            if (!res.ok) {
                // The service's own message names the axis; keep it verbatim.
                setGenerateError(res.error ?? "The variants could not be generated.")
                setApiResults([{ section: "variants", ok: false, error: res.error, }])
                setApiSyncOpen(true)
                return
            }
            if (res.options?.length) {
                // Carries the axisId / valueId the next save merges on. Without this the very
                // next save would create a second set of axes.
                setListing(prev => ({ ...prev, variantOptions: res.options! }))
            }
            if (res.axes) setMandatoryAxisCodes(res.axes.mandatoryAxisCodes ?? [])

            // ⚠️ THE ROWS THE SERVER BUILT. Without this the grid still reads "0 built ·
            // 8 not yet created" over eight variants that exist — the call succeeded and
            // its answer was dropped on the floor.
            if (res.variants) {
                // Prices are fetched here for the same reason hydrate fetches them: toLocalVariants
                // refills every variant's cells from this map. Calling it WITHOUT one wiped every
                // price locally — and the next Save & Continue diff-deleted them server-side.
                // A failed fetch passes null ("unknown"), which preserves the sheet, never clears it.
                let priceRows: Record<number, PriceRowResponse[]> | null = null
                try {
                    // One commerce read, not one GET per variant — same grouping hydrate does,
                    // every variant seeded [] so "no rows" stays a real answer, not "unknown".
                    const commerce = await getCommerce(productId)
                    priceRows = {}
                    for (const v of commerce.variants ?? []) priceRows[v.variantId] = []
                    for (const row of commerce.prices ?? []) {
                        (priceRows[row.variantId] ??= []).push(row)
                    }
                } catch {
                    priceRows = null
                    setGenerateError("Variants generated, but current prices could not be read back — "
                        + "the sheet keeps its previous values. Reload before editing prices.")
                }
                setListing(prev => ({
                    ...prev,
                    variants: toLocalVariants(res.variants!, prev, priceRows, cityCountry),
                }))
            }
            if (res.error) setGenerateError(res.error)   // generated, but the read back failed
        } finally {
            setGenerating(false)
        }
    }
    /**
     * Patch the satellite on MANY packs in one write. A ladder's settings are edited at
     * group level, which means N rows change together — calling a per-variant setter in a
     * loop would read the same stale `variants` each time and only the last would survive.
     * Each row is still independent (D-C61); this is one action touching several of them.
     */
    const updatePacks = (variantIds: string[], patch: Partial<VariantSessionPack>) =>
        setVariants(prev => prev.map(v =>
            variantIds.includes(v.id) && v.sessionPack
                ? { ...v, sessionPack: { ...v.sessionPack, ...patch } }
                : v))
    /**
     * Write one pack's price for one city. `retail` is sessions × the base's selling price,
     * which is BOTH the struck-through "was" and the D-C59 ceiling — one number, so a pack
     * cannot be priced above N × the single by construction.
     *
     * `null` removes the row: absence is how "not sold in that city" is said (D-C29).
     */
    const setPackPrice = (
        variantId: string, cityId: string, country: Country, price: number | null, retail: number,
    ) => setVariants(prev => prev.map(v => {
        if (v.id !== variantId) return v
        const rows = [...(v.regionalData ?? [])]
        const i = rows.findIndex(r => r.country === country)
        const write = (cp: NonNullable<RegionalData["cityPrices"]>) =>
            price === null
                ? cp.filter(x => x.cityId !== cityId)
                : [...cp.filter(x => x.cityId !== cityId), {
                    cityId, price, retailPrice: retail,
                    discountType: "PERCENTAGE" as const,
                    discountValue: retail > price
                        ? Math.round((1 - price / retail) * 10000) / 100
                        : undefined,
                }]
        if (i === -1) {
            if (price === null) return v
            rows.push({ country, sku: "", zohoId: "", price: 0, isAvailable: true, cityPrices: write([]) })
        } else {
            rows[i] = { ...rows[i], cityPrices: write(rows[i].cityPrices ?? []) }
        }
        return { ...v, regionalData: rows }
    }))

    /** Deleting packs deletes the VARIANTS — the satellite is PK=FK, with no life of its own. */
    const deletePacks = (variantIds: string[]) =>
        setVariants(prev => prev.filter(v => !variantIds.includes(v.id)))

    /**
     * Like updateRegional, but CREATES the (variant, country) row when it is absent.
     * Pricing & Availability needs that: an operator can open a country the variant has
     * no region row for yet, and the first city price they type is what brings the row
     * into existence. updateRegional below only patches rows that already exist.
     */
    const upsertRegional = (variantId: string, country: Country, patch: Partial<RegionalData>) => {
        const v = variants.find(x => x.id === variantId); if (!v) return
        const rows = v.regionalData ?? []
        updateVariant(variantId, {
            regionalData: rows.some(r => r.country === country)
                ? rows.map(r => (r.country === country ? { ...r, ...patch } : r))
                : [...rows, { country, sku: "", zohoId: "", price: 0, isAvailable: true, ...patch }],
        })
    }
    const updateRegional = (variantId: string, country: Country, patch: Partial<RegionalData>) => {
        const v = variants.find(x => x.id === variantId); if (!v) return
        updateVariant(variantId, { regionalData: v.regionalData.map(r => r.country === country ? { ...r, ...patch } : r) })
    }
    // The UniCommerce SKU *is* the Zoho Books SKU: procurement creates it in
    // UniCommerce and Octa pulls it into Zoho, so every SKU is auto-paired with
    // a Zoho item id. The operator therefore only picks the SKU — the Zoho id is
    // derived. Mock feeds don't share a key, so pair on (country, name) and fall
    // back to same-country order; unresolved → "Pending Zoho sync" (real for
    // service packages, where finance still has to issue the Zoho ID).
    const resolveZohoId = (country: Country, sku: string): string => {
        if (!sku) return ""
        const countrySkus = uniSkus.filter(s => s.country === country)
        const countryZoho = zohoItems.filter(z => z.country === country)
        const src = countrySkus.find(s => s.sku === sku)
        if (!src) return ""
        const byName = countryZoho.find(z => z.name === src.name)
        if (byName) return byName.zohoId
        return countryZoho[countrySkus.indexOf(src)]?.zohoId ?? ""
    }
    // Selecting a SKU writes the paired Zoho id in the same patch; if nothing
    // resolves, the stored zohoId is left untouched (may be a legacy value).
    const selectSku = (variantId: string, country: Country, sku: string) => {
        const paired = resolveZohoId(country, sku)
        updateRegional(variantId, country, paired ? { sku, zohoId: paired } : { sku })
    }
    const addSubPlan = (variantId: string) => {
        const v = variants.find(x => x.id === variantId); if (!v) return
        const plans = v.subscriptionPlans ?? []
        updateVariant(variantId, { subscriptionPlans: [...plans, { id: rid(), titleEn: "", titleAr: "", frequency: "Monthly", discountPct: undefined, finalPrice: undefined, recommended: false }] })
    }
    const updateSubPlan = (variantId: string, planId: string, patch: Partial<SubscriptionPlan>) => {
        const v = variants.find(x => x.id === variantId); if (!v) return
        updateVariant(variantId, { subscriptionPlans: (v.subscriptionPlans ?? []).map(p => p.id === planId ? { ...p, ...patch } : p) })
    }
    const removeSubPlan = (variantId: string, planId: string) => {
        const v = variants.find(x => x.id === variantId); if (!v) return
        updateVariant(variantId, { subscriptionPlans: (v.subscriptionPlans ?? []).filter(p => p.id !== planId) })
    }

    const deptSubDepts = useMemo(() => subDepartments.filter(s => s.department === listing.department), [subDepartments, listing.department])
    // Empty until the tree loads, so the picker is short for a moment rather than
    // wrong — and stays short if the taxonomy is genuinely not seeded.
    const selectableDepartments = useMemo(() => departmentsPresent(departmentTree), [departmentTree])
    const serverDepartmentNames = useMemo(() => departmentNames(departmentTree), [departmentTree])
    /**
     * cityId -> Country, so a price row can be put back in the right country's columns.
     *
     * The API keys a price row by cityId alone — the country is derivable from the city, so
     * storing it on the row would be a second copy of a derived fact (D-C23's reasoning).
     * The editor needs it grouped by country, and this is where that is undone.
     */
    const cityCountry = useMemo(
        () => Object.fromEntries(cities.map(c => [c.id, c.country])) as Record<string, Country>,
        [cities])
    const selectedFeature = features.find(f => f.id === listing.internalCategoryId)
    const featureProviders = selectedFeature ? providers.filter(p => selectedFeature.serviceProviderIds.includes(p.id)) : []

    // Attributes are controlled at the sub-department level. If a sub-department
    // declares attributeKeys, only those are shown; undefined = show all (legacy).
    const selSubDept = subDepartments.find(s => s.id === listing.subDepartmentId)
    const applicableAttrs = selSubDept?.attributeKeys
    const isMedicineSubDept = selSubDept?.slug === "medicine"
    // These are redundant in the catalogue model: "Is Medicine" is implied by the
    // Medicine sub-department, "Prescription Required" duplicates isPrescriptionRequired
    // (Regulatory & Clinical Flags), and "Controlled Substance" lives there too.
    // For Medicine we only surface Medicine Type (clinical class) instead.
    // "fasting" is owned by the Diagnostics "Package Type & Collection" section,
    // which also captures the fasting HOURS — so showing a bare toggle here as well
    // gave two places to set the same thing.
    const REDUNDANT_ATTRS: AttributeKey[] = ["isMedicine", "isRxRequired", "isControlledSubstance",
        ...(listing.department === "diagnostics" ? ["fasting" as AttributeKey] : [])]
    const attrVisible = (k: AttributeKey) => (!applicableAttrs || applicableAttrs.includes(k)) && !REDUNDANT_ATTRS.includes(k)
    const visibleAttrs = ALL_ATTR.filter(a => attrVisible(a.key))
    const showMedicineForm = attrVisible("medicineForm")
    const anyAttr = visibleAttrs.length > 0 || showMedicineForm || isMedicineSubDept

    // ── variant axes (industry "options"): declared on the listing, not the variant ──
    const variantOptions = listing.variantOptions ?? []
    // TREATMENTS is matrix-only, whatever has been declared yet: D-C27 makes VOLUME
    // mandatory on every drip, so the axes are always the variant list. Without this
    // an IV listing with a declared-but-empty VOLUME axis would fall back to the
    // single-variant path — typed labels, a Variant Type dropdown and a hand-add
    // button — none of which can produce a sellable variant under D-C7.
    const matrixMode = usesVariantMatrix(listing) || svc
    const dupeComboIds = duplicateComboVariantIds(variants)
    const setVariantOptions = (opts: VariantOption[]) => update({ variantOptions: opts })

    /** Set one axis value on a variant and re-derive its label from the new combination. */
    const setVariantOptionValue = (v: ProductVariant, optionId: string, valueId: string) => {
        const combo = { ...(v.optionValues ?? {}), [optionId]: valueId }
        const primary = [...variantOptions].sort((a, b) => a.position - b.position)[0]
        updateVariant(v.id, {
            optionValues: combo,
            variantLabelEn: comboLabel(combo, variantOptions, "en"),
            variantLabelAr: comboLabel(combo, variantOptions, "ar"),
            // keep the legacy single-axis field meaningful for the FE and for the
            // ~1,420 migrated listings that still read it
            variantType: primary?.kind ?? v.variantType,
        })
    }

    /**
     * Create variants for combinations that do not have one yet. Purely additive:
     * existing rows are matched by combination upstream and never re-minted, because
     * partner pricing (variant × country × city) and bundles (ProductRef.variantId)
     * hold these ids.
     */
    /**
     * Creates the listing's SINGLE zero-axis variant (`axis_signature = ''`, D-C30) — physio's only
     * variant, and the shape a single-SKU supplement takes too.
     *
     * Idempotent by the same rule the server uses: if a variant already answers no axes, there is
     * nothing to create. That matters because `uk_variant_axes (product_id, axis_signature)` is what
     * stops two indistinguishable sellables, and it can only do that when the signature is written
     * as '' rather than left null.
     */
    const createSoleVariant = () => {
        if (variants.some(v => !v.optionValues || Object.keys(v.optionValues).length === 0)) return
        const base = emptyVariant(variants.length)
        setVariants([...variants, {
            ...base,
            isDefault: variants.length === 0,
            optionValues: {},
            variantLabelEn: listing.displayNameEn || "Single session",
            variantLabelAr: listing.displayNameAr || "",
            nameEn: listing.displayNameEn || base.nameEn,
            nameAr: listing.displayNameAr || "",
            slugEn: listing.slugEn || base.slugEn,
            slugAr: listing.slugAr || "",
        }])
    }

    /**
     * Drops the sole variant so axes can be declared instead — the switch back.
     *
     * Refuses while anything hangs off it, which is the same VARIANT_IN_USE rule the API enforces:
     * a price, a pack built on it, stock or an ERP pairing are records with owners, and axes would
     * leave them answering nothing. The panel shows that refusal BEFORE the click, so this guard is
     * the backstop rather than the message.
     */
    const dropSoleVariant = () => {
        const sole = variants.find(v => !v.optionValues || Object.keys(v.optionValues).length === 0)
        if (!sole) return
        const held = sole.regionalData?.some(r => (r.price ?? 0) > 0
                || r.cityPrices?.some(cp => (cp.price ?? 0) > 0))
            || variants.some(v => v.sessionPack?.baseVariantId === sole.id)
            || (sole.stockQuantity ?? 0) > 0
        if (held) return
        removeVariant(sole.id)
    }

    const generateVariants = (combos: Record<string, string>[]) => {
        const primary = [...variantOptions].sort((a, b) => a.position - b.position)[0]
        const countries = countryConfig.map(c => c.country)
        const created = combos.map((combo, i) => {
            const base = emptyVariant(variants.length + i)
            const labelEn = comboLabel(combo, variantOptions, "en")
            const labelAr = comboLabel(combo, variantOptions, "ar")
            const slugBit = labelEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
            return {
                ...base,
                isDefault: variants.length === 0 && i === 0,
                optionValues: combo,
                variantType: primary?.kind ?? base.variantType,
                variantLabelEn: labelEn,
                variantLabelAr: labelAr,
                nameEn: listing.displayNameEn ? `${listing.displayNameEn} — ${labelEn}` : labelEn,
                nameAr: listing.displayNameAr && labelAr ? `${listing.displayNameAr} — ${labelAr}` : "",
                slugEn: [listing.slugEn, slugBit].filter(Boolean).join("-"),
                slugAr: [listing.slugAr, slugBit].filter(Boolean).join("-"),
                // Seed one row per country the listing sells in, so there is a SKU cell
                // to fill for every combination × country from the outset.
                regionalData: countries.map(c => ({
                    country: c, sku: "", zohoId: "", price: 0, isAvailable: false,
                })),
            }
        })
        setVariants([...variants, ...created])
    }

    // ── validation (variant level + classification) ──
    const variantErrors = (v: ProductVariant): string[] => {
        const e: string[] = []
        if (matrixMode) {
            // Labels are derived from the combination, so they are never hand-required.
            unsetAxes(v, variantOptions).forEach(o => e.push(o.nameEn))
            if (dupeComboIds.includes(v.id)) e.push("Duplicate combination")
        } else {
            if (!v.variantLabelEn) e.push("Label EN"); if (!v.variantLabelAr) e.push("Label AR")
            // uk_variant_axes (product_id, axis_signature) applies in BOTH modes. A
            // zero-axis product writes axis_signature = '' (D-C30), so a second
            // axis-less variant collides and its INSERT fails — the duplicate has to be
            // reported here too, not only in matrix mode. Different wording because
            // "duplicate combination" is meaningless when no axes exist.
            if (dupeComboIds.includes(v.id)) e.push("Second variant with no axes — declare an axis or keep one")
        }
        if (!v.nameEn) e.push("Name EN"); if (!v.nameAr) e.push("Name AR")
        // Products variants have no page of their own, so no slug is required —
        // asking for EN+AR URLs on every combination would be 18 fields for a 3x3 grid.
        if (!pd) { if (!v.slugEn) e.push("Slug EN"); if (!v.slugAr) e.push("Slug AR") }
        if (v.regionalData.length === 0) e.push("Region")
        // SKU and Zoho are required for HEALTH PRODUCTS ONLY. variant_inventory is a
        // Health-Products table (D-C14) and the Zoho item is auto-paired FROM the SKU, so
        // for a service there is nothing to fill — and requiring a field the editor does
        // not render is the unactivatable-listing bug in miniature. Price is required for
        // everyone: D-C29 makes the price row itself the availability answer.
        v.regionalData.forEach(r => {
            if (pd) { if (!r.sku) e.push(`${r.country} SKU`); if (!r.zohoId) e.push(`${r.country} Zoho`) }
            // Treatments authors money in Pricing & Availability, so its price errors are
            // counted there (priceErrors below) — reporting them on this tab would flag a
            // section for data entered on another screen, which is how a requirement chip
            // ends up pointing somewhere it cannot be satisfied.
            if (!svc) priceRowErrors(r).forEach(msg => e.push(`${r.country} ${msg}`))
        })
        return e
    }
    const totalVariantErrors = variants.reduce((n, v) => n + variantErrors(v).length, 0)

    /**
     * Price errors for the treatments Pricing tab. A CITY row is a peer of the country
     * row (product_pricing keys them the same way), so both are checked — but a city
     * with no row at all is NOT an error: absence is how "not sold there" is said (D-C29).
     */
    const priceErrors = (v: ProductVariant): string[] => {
        const e: string[] = []
        ;(v.regionalData ?? []).forEach(r => {
            (r.cityPrices ?? []).forEach(cp => {
                const city = cities.find(c => c.id === cp.cityId)?.name ?? cp.cityId
                priceRowErrors(cp).forEach(msg => e.push(`${city} ${msg}`))
            })
        })
        return e
    }
    const totalPriceErrors = svc ? variants.reduce((n, v) => n + priceErrors(v).length, 0) : 0
    const classificationError = !listing.subDepartmentId
    const err = (bad: boolean) => showErrors && bad ? "border-destructive" : ""

    // Incremental persistence — writes the current state back to the store now,
    // instead of holding everything locally until one bulk save at the end.
    // The first save mints a draft (createListing → id) and swaps the URL from
    // /new to /{id}; subsequent saves PATCH that draft. Partial drafts are always
    // allowed — only a minimal handle (internal name) is needed to mint one.
    /**
     * Service sync-section names → editor section ids, so a failure can put the
     * operator IN FRONT OF the section that caused it rather than a hard-coded
     * jump to Classification. Money sections resolve per department: treatments
     * and care author prices in the pricing sheet, products in Variants.
     */
    const editorSectionFor = (syncSection: string): string | undefined => {
        const money = sectionIds.includes("pricingSheet") ? "pricingSheet" : "variants"
        const map: Record<string, string> = {
            "classification": "classification", "identity": "identity",
            "content": "content", "faqs": "faq", "media": "media",
            "cities": "cityConfig", "subscription": "subscription",
            "variants": money, "variant rows": money, "variant-axes": money,
            "prices": money, "pack prices": money, "session packs": money,
            "frequently-bought": "frequentlyBought", "also-viewed": "recommendations",
        }
        const id = map[syncSection]
        return id && sectionIds.includes(id) ? id : undefined
    }
    /** Set by persist: what the last save actually did, for Save & Continue to act on. */
    const lastSave = useRef<{ allOk: boolean; firstFailed?: string; failedLabels: string[] }>({
        allOk: true, failedLabels: [],
    })

    const persistInFlight = useRef(false)
    const persist = async (): Promise<boolean> => {
        // One save at a time. The button disables, but the unsaved-changes guard and
        // keyboard paths can also call persist — a second concurrent wave would race
        // the first one's PUTs and diff against half-written state.
        if (persistInFlight.current) return false
        persistInFlight.current = true
        try {
            return await persistOnce()
        } finally {
            persistInFlight.current = false
        }
    }
    const persistOnce = async (): Promise<boolean> => {
        // ── Do not write over what has not been read ──────────────────────────────
        // PUT is REPLACE-semantics: putIdentity sends internalName: undefined and empty
        // display names when the form is blank. A product opened from the Listings screen
        // starts blank and is filled asynchronously by hydration — so saving before that
        // lands would blank the internal name, both display names and the brand on a
        // product that has them. Refusing for the moment it takes to load is the only
        // safe answer; the alternative is silent data loss on a mis-timed click.
        if (listing.apiProductId && !hydrated) {
            setApiResults([{
                section: "load",
                ok: false,
                error: "Still loading this product from the content service — "
                    + "saving now would overwrite fields that have not been read back yet. "
                    + "Try again in a moment.",
            }])
            setApiSyncOpen(true)
            return false
        }

        // A sub-department is enough to mint a draft — the internal name is NOT required
        // to save, only to activate.
        //
        // This mirrors the service rather than inventing a stricter rule:
        // IdentityRequest.internalName carries only @Size, no @NotNull, and
        // product_master.internal_name is nullable with the reason written on it —
        // "the first Save draft lands on the Classification tab, before Identity is
        // reached; it is an activation requirement, not an existence one." The
        // activation banner already tracks Internal name, which is the right place for it.
        //
        // Why it matters: POST /products is what generates the uid, so blocking the save
        // until Identity was filled meant the Internal Code box could never populate from
        // Classification — the exact field whose helper says "assigned on first save".
        if (!listing.internalName.trim() && !listing.subDepartmentId) {
            setShowErrors(true)
            setActiveSection("classification")
            return false
        }
        setSaving(true)
        try {
            // ── The LOCAL store ───────────────────────────────────────────────────
            // Skipped entirely for a product opened from the Listings screen. Its
            // `currentId` is a CONTENT-SERVICE product id (2), and the local mock store
            // has never heard of it — updateListing threw "Listing 2 not found" and took
            // the whole save down with it, before the content service was even called.
            //
            // Nor should it be created here: the service is the system of record for
            // these products, the Listings screen reads from GET /products, and minting
            // a shadow local row keyed by a server id would give two stores the same id
            // with different contents.
            if (openedFromService.current) {
                // nothing local to write — the content-service sync below is the save
            } else if (!currentId) {
                const created = await ApiService.catalogue.createListing(listing)
                setCurrentId(created.id)
                setListing(prev => ({ ...prev, id: created.id }))
                router.replace(`/catalogue/listings/${created.id}`)
            } else {
                await ApiService.catalogue.updateListing(currentId, listing)
            }
            // Every department the SERVICE carries, not just Health Products. The gate
            // used to be `department === "health_products"`, which silently skipped the
            // sync for everything else — a Treatments listing looked saved and never
            // reached the content service at all. What can actually be saved is decided
            // server-side now (a sub-department with no row cannot resolve an id), so the
            // failure is reported per section instead of being pre-empted here.
            //
            // The local store stays the editor's working copy; this pushes the
            // sections the API owns and reports back per section.
            let synced = listing
            // Assume nothing until the service says so — see the note below.
            let classificationSaved = true
            // ALWAYS attempted — no client-side department gate.
            //
            // It was `department === "health_products"`, which silently skipped the sync
            // for everything else. Replacing it with a check against the loaded
            // department tree was worse: that set is empty until GET /departments
            // resolves, so a quick save raced it and skipped the sync with no trace.
            //
            // Whether a listing CAN be saved is a server-side fact — toClassification()
            // returns null when the sub-department does not resolve, and
            // saveHealthProduct reports that as a per-section failure with a readable
            // reason. A silent skip is the one outcome worth engineering away.
            {
                setApiSyncing(true)
                try {
                    // The clean snapshot is the dirty-section baseline: sections whose wire
                    // payload matches it are skipped entirely (a one-field identity edit used
                    // to fire ~20 writes). No snapshot -> full save, the create flow.
                    const res = await saveHealthProduct(listing, dirtyTracker.cleanValue())
                    setApiResults(res.results)
                    if (res.productId) {
                        synced = { ...listing, apiProductId: res.productId, apiUid: res.uid }
                        setListing(prev => ({ ...prev, apiProductId: res.productId, apiUid: res.uid }))

                        // The server seeds axes from the family policy on create, and hydration
                        // has already run (or never will, for a listing created in this session).
                        // Without this the seeded axes are invisible until a reload, and the
                        // operator sees an empty Variants section on a product that HAS axes.
                        try {
                            const seeded = await getVariantAxes(res.productId)
                            const options = axesToOptions(seeded)
                            if (options.length) {
                                synced = { ...synced, variantOptions: options }
                                setListing(prev => ({ ...prev, variantOptions: options }))
                            }
                            setMandatoryAxisCodes(seeded.mandatoryAxisCodes ?? [])
                        } catch {
                            // Not fatal — the axes are on the server either way, and the next
                            // load reads them. Silence here rather than a scary error on a save
                            // that otherwise succeeded.
                        }
                    }
                    // CLASSIFICATION is the gate, not just another section: without a
                    // productId nothing else has a URL to be written to. A failure there
                    // means NOTHING reached the service, so the save has not succeeded
                    // however well the local store did.
                    //
                    // Other sections failing does NOT block: partial saves are deliberate
                    // here (losing a whole save because the FAQ list was rejected is worse),
                    // and the per-section panel reports them.
                    classificationSaved = res.results.some(r => r.section === "classification" && r.ok)
                    // The save's verdict counts EVERY attempted section. Partial writes
                    // are still deliberate (what could land, landed server-side) — but a
                    // save with any failure must not read as done: the operator is taken
                    // to the first failed section with their data still in the form.
                    const failed = res.results.filter(r => !r.ok)
                    lastSave.current = {
                        allOk: classificationSaved && failed.length === 0,
                        firstFailed: failed.length ? editorSectionFor(failed[0].section) : undefined,
                        failedLabels: failed.map(r => r.section),
                    }
                } catch (e) {
                    setApiResults([{ section: "content service", ok: false, error: e instanceof Error ? e.message : "Sync failed" }])
                    classificationSaved = false
                    lastSave.current = { allOk: false, failedLabels: ["content service"] }
                } finally {
                    setApiSyncing(false)
                }
            }
            setJustSaved(true)
            window.setTimeout(() => setJustSaved(false), 2500)
            // The header flash is easy to miss; say it where the operator is looking.
            if (lastSave.current.allOk) {
                toast.success("Saved", { description: "All edited sections written." })
                dirtyTracker.markCleanAs({ ...synced, id: currentId || listing.id })
            } else {
                toast.error(`Save did not complete — ${lastSave.current.failedLabels.join(", ") || "sync failed"}`, {
                    description: "Your edits are still in the form and still guarded. Fix what the panel points at and save again.",
                })
                // Deliberately NOT marked clean: the failed sections' values must stay
                // dirty so the unsaved-changes guard protects them and the retry
                // re-sends them. Succeeded sections re-send too — PUT is replace, so a
                // second identical write is harmless; a lost edit is not.
            }
            // Reported honestly: false keeps Save & Continue on this tab and keeps the
            // unsaved-changes guard from navigating away, so the failure is seen next to
            // the field that caused it instead of two tabs later.
            return lastSave.current.allOk
        } finally {
            setSaving(false)
        }
    }
    const handleSave = () => { void persist() }

    // Coverage dot per section — only meaningful for Health Products, the one
    // department the content service covers.
    const withSyncDot = (list: EditorSection[]): EditorSection[] =>
        !pd ? list : list.map(sec => {
            const sync = syncOf(sec.id)
            if (!sync || sync.state === "synced") return sec
            const dotClass = sync.state === "partial" ? "bg-amber-500"
                : sync.state === "upstream" ? "bg-red-500" : "bg-slate-300"
            return { ...sec, syncDot: { className: dotClass, title: `${SYNC_LABEL[sync.state]} — ${sync.detail}` } }
        })

    const sections: EditorSection[] = [
        // Foundation — the minimum to mint a draft
        { id: "classification", label: "Classification", group: "Foundation", hasError: showErrors && classificationError },
        ...(isProgram ? [{
            id: "program", label: "Program Schedule & Policy", group: "Commerce",
            badge: (programConfig.milestones ?? []).length,
        }] : []),
        ...(dx ? [{
            id: "dxPackage", label: "Package Type & Collection", group: "Foundation",
            hasError: showErrors && (!listing.diagnostics?.tier || (dxConfig.sampleTypes ?? []).length === 0),
        }] : []),
        { id: "identity", label: "Identity & Type", group: "Foundation" },
        // Commerce — how it sells.
        // COUNTRY COMES FIRST, and the order is a dependency rather than a preference:
        // a price row names a country and a city, and no row here means the listing is
        // not sold in that market (D-C29) — so there is nothing to price, and for Health
        // Products nothing to fill on the variant's regional rows either. Moved above
        // Variants 2026-08-28 after the Pricing tab could open with four variants ready
        // and no countries to price them in.
        { id: "countryConfig", label: "Country Availability & Config", group: "Commerce" },
        // product_city_config, at PRODUCT grain — D-C48 removed its variant_id because a
        // VARIANT's city availability is its price row existing (D-C29). Services only:
        // "Supplements do not use this table (country-grain only)". Gated to treatments for
        // now; diagnostics, consultations and home care need it too — the D-C62 slot flag
        // applies to all four and has no other editor anywhere.
        ...(svc ? [{
            id: "cityConfig", label: "City Availability & Booking", group: "Commerce",
            badge: (listing.cityConfig ?? []).filter(r => r.status === "active").length || undefined,
        }] : []),
        ...(pd ? [{ id: "commercial", label: "Commercial / Hero", group: "Commerce" }] : []),
        // Variants & Pricing is for EVERY department (2026-08-28). It used to be
        // withheld from treatments on the reading that "a treatment sells plans, not
        // SKUs" — which D-C12 contradicts (the VARIANT is the sellable) and D-C59
        // finished off (a session pack IS a product_variants row). Withholding it also
        // made an IV listing UNACTIVATABLE: listingActivationRequirements demands "at
        // least one variant with a price" and points at section "variants", so the
        // requirement could never be met and its chip navigated nowhere.
        { id: "variants", label: svc ? "Variants & Axes" : "Variants & Pricing", group: "Commerce", badge: variants.length, hasError: showErrors && totalVariantErrors > 0 },
        // Money leaves the variant card for treatments: product_pricing is keyed
        // (variant, partner, country, CITY) and IV prices by city — 68 of 108 multi-city
        // packages price differently. Volume (3) x Speed (2) = 6 variants against 9 UAE
        // and 20 KSA cities is ~108 inputs four levels deep inside a variant accordion.
        // Health Products keeps its country-level row inline: that grain nests fine and
        // ~1,420 legacy single-axis listings depend on the shape.
        // Sits between Variants and Pricing because a pack IS a variant (D-C59) — it must
        // exist before it can be priced, and it points at a base variant that must exist
        // before it. There is deliberately no "plans" table: D-C61 moved the interval onto
        // each pack so two packs of one formula can differ, so a plan here is a TEMPLATE.
        // Price lists replaced the per-city editor 2026-08-30 (v1 dropped). Same stored rows
        // — one product_pricing row per (variant, city) — authored by PRICE rather than by
        // city, because 33% of IV packages carry one price across all their cities and 68%
        // at most two.
        // The price-list view was dropped 2026-08-30 after both were used side by side:
        // one country at a time, variants x cities, is the shape that matched how the work
        // is actually done — country is the ops boundary as well as the schema's seam.
        ...(svc ? [{
            id: "pricingSheet", label: "Pricing Sheet", group: "Commerce",
            hasError: showErrors && totalPriceErrors > 0,
        }] : []),
        // AFTER Pricing, 2026-08-30. A pack's price is derived FROM its base's price
        // (retail = sessions × base selling), so pricing the base has to come first —
        // creating packs earlier produced ladders reporting "14 city prices missing"
        // for a base nobody had priced yet. Sits before Multi-buy Tiers because a pack
        // variant can carry its own tier ladder (D-C59).
        ...(svc ? [{
            id: "sessionPacks", label: hc ? "Plans" : "Session Packs", group: "Commerce",
            badge: variants.filter(v => v.sessionPack).length || undefined,
        }] : []),
        // Split out of Subscription 2026-08-30. They were bundled together and gated
        // `!dx && !tx`, so excluding treatments from subscriptions also cost it the tiers —
        // and IV's Duo/Party IS a tier (D-C56). They are also different grains: a
        // subscription is a listing-level plan, a tier is (variant × country).
        ...(svc || pd ? [{
            id: "tiers", label: "Multi-buy Tiers", group: "Commerce",
        }] : []),
        // LAST in Commerce, 2026-08-31, and last on purpose: it is the EDIT view of
        // everything the three sections above authored. Structure is set there — which
        // packs exist, which ladder steps the country uses — and every number is set
        // here, in one grid, because a price is only judgeable next to its neighbours.
        // Built alongside them rather than replacing them: creating a listing is a
        // guided walk, maintaining one is a spreadsheet, and those are different jobs.
        ...(svc ? [{
            id: "masterSheet", label: "Master Sheet", group: "Commerce",
            badge: variants.length || undefined,
        }] : []),
        // Subscriptions are a retail-goods idea — a blood panel or an IV course is sold as
        // a package, so neither department needs them. MULTI-BUY TIERS ARE NOT: they were
        // bundled into this section, so this gate also denied treatments the Duo/Party
        // ladder that IV actually sells (D-C56). They now have their own section.
        ...(dx || svc ? [] : [{ id: "subscription", label: "Subscription & Pricing", group: "Commerce" }]),
        ...(dx ? [
            {
                id: "dxBiomarkers", label: "Biomarkers (per country)", group: "Commerce",
                badge: (dxConfig.biomarkerCountryMaps ?? []).length,
                hasError: showErrors && dxBiomarkerGap,
            },
            { id: "dxSlots", label: "Nurse Slots & City Pricing", group: "Commerce" },
        ] : []),
        // Content — the PDP story
        { id: "content", label: "Master Content", group: "Content" },
        // The 13-key content vocabulary is DEPARTMENT-AGNOSTIC (user's call): "all of the
        // departments and sub-departments are mostly going to have these sections". These
        // four are in that list — why_superior · stats · comparison · clinician_reviews ·
        // customer_reviews · influencer_videos · how_to_use · benefits · ingredients — and
        // were gated to Health Products only because the editor predates the decision.
        // ⚠️ `how_to_use` on a nurse-administered drip is a COPY question, not a structural
        // one: the customer does not use it, a nurse administers it. Likely renders as
        // "what happens at your appointment" rather than being dropped.
        { id: "howToUse", label: "How to Use", group: "Content" },
        { id: "media", label: "Media Gallery", group: "Content" },
        { id: "superiority", label: "Why Superior", group: "Content" },
        // Social proof
        { id: "comparison", label: "Comparison", group: "Social Proof" },
        { id: "stats", label: "Stats", group: "Social Proof" },
        { id: "clinicianReviews", label: "Clinician Reviews", group: "Social Proof" },
        { id: "reviews", label: "Customer Reviews", group: "Social Proof" },
        { id: "influencers", label: "Influencer Videos", group: "Social Proof" },
        // Merchandising — cross-sell
        // Cross-sell is not a Health-Products idea either: IV_THERAPY.md §7 maps
        // "cross-formula picker rows -> cross-sell relations", so a drip has them too.
        { id: "frequentlyBought", label: "Frequently Bought", group: "Merchandising" },
        { id: "recommendations", label: "Customers Also Viewed", group: "Merchandising" },
        // Settings & access
        { id: "seo", label: "SEO & Metadata", group: "Settings & Access" },
        { id: "faq", label: "Master FAQ", group: "Settings & Access" },
        { id: "flags", label: "Display & Add-ons", group: "Settings & Access" },
        { id: "partners", label: "Partner Access", group: "Settings & Access", badge: (listing.partnerAccess ?? []).length || undefined },
    ]

    // Consultation listings selectable as the doctor-consultation add-on.
    const consultationListings = listings.filter(l =>
        l.id !== currentId && (l.fulfilmentPath === "consultation" || l.department === "consultations"))

    // Save this section, then advance to the next one (staged entry points).
    const sectionIds = sections.map(s => s.id)
    const handleSaveAndContinue = async () => {
        const ok = await persist()
        // Stay put on failure, and make sure the operator is looking at the tab that
        // caused it — advancing to Identity while Classification was rejected is how
        // someone fills in four more sections against a product that does not exist.
        if (!ok) {
            setActiveSection(lastSave.current.firstFailed ?? "classification")
            setApiSyncOpen(true)
            return
        }
        const idx = sectionIds.indexOf(activeSection)
        if (idx >= 0 && idx < sectionIds.length - 1) setActiveSection(sectionIds[idx + 1])
    }
    const isLastSection = sectionIds.indexOf(activeSection) === sectionIds.length - 1
    const mediaUploadCtx = useMemo(() => ({ productId: listing.apiProductId }), [listing.apiProductId])

    // Activation gate — a draft may always be saved partially; it may only go
    // Active once every requirement below is met (single source of truth).
    const activationReqs = listingActivationRequirements(listing)
    const unmetReqs = listingUnmetRequirements(listing)
    const jumpToRequirement = (section: string) => { setActivationOpen(false); setActiveSection(section) }
    const onStatusChange = (v: ProductStatus) => {
        if (v === "active" && unmetReqs.length > 0) { setActivationOpen(true); return }
        // The content service has no product status transition yet — its own schema
        // says "always DRAFT. Nothing is publishable at this point." A local flip
        // would flash success and silently revert on the next read, which is worse
        // than saying no.
        if (listing.apiProductId && v !== "draft") {
            toast.error("The content service cannot publish a product yet", {
                description: "Every product is DRAFT until its lifecycle endpoint ships. "
                    + "This listing is ready — the flip will work the day the API lands.",
            })
            return
        }
        update({ status: v })
        // Persist the transition immediately (pass the explicit patch — the
        // `listing` state won't reflect the new status yet due to async setState).
        if (currentId) {
            setSaving(true)
            ApiService.catalogue.updateListing(currentId, { status: v })
                .then(() => { setJustSaved(true); window.setTimeout(() => setJustSaved(false), 2500) })
                .finally(() => setSaving(false))
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading listing…</div>
    // The honest state for a service product that could not be READ: not a blank editable
    // form defaulting to Health Products — that reads as a new listing over data that exists.
    if (loadFailed) return (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
                <p className="text-sm font-medium">Couldn&apos;t load product {listing.apiProductId}</p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">{loadFailed}</p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    The product itself is untouched — this screen exists so a blank form is never
                    mistaken for it. If a deployment is in flight, retry once it settles.
                </p>
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                    hydrationStarted.current = false
                    setLoadFailed(null)
                    setHydrated(false)
                    setHydrateAttempt(n => n + 1)
                }}>Retry</Button>
                <Button size="sm" variant="ghost" onClick={() => router.push("/catalogue/listings")}>Back to listings</Button>
            </div>
        </div>
    )

    const headerActions = (
        <>
            <GuideButton guide="listing" />
            {/* Save status indicator */}
            <span className="text-xs text-muted-foreground min-w-[92px] text-right">
                {saving ? (
                    <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>
                ) : justSaved ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> Saved</span>
                ) : currentId ? (
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Draft saved</span>
                ) : "Not saved yet"}
            </span>
            {/* Readiness badge */}
            <Badge
                variant="outline"
                className={`cursor-pointer ${unmetReqs.length === 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}
                onClick={() => setActivationOpen(true)}
            >
                {unmetReqs.length === 0 ? "Ready to activate" : `${unmetReqs.length} to activate`}
            </Badge>
            {!isNew && <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}><Clock className="mr-2 h-4 w-4" /> History</Button>}
            {!isNew && <Button variant="outline" size="sm"><ExternalLink className="mr-2 h-4 w-4" /> Preview</Button>}
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" /> Save draft
            </Button>
            {/* Content-service sync status. Health Products saves push section by
                section, so we report per section rather than a single tick — a
                partial save is real and the operator needs to see which half. */}
            {listing.department === "health_products" && (apiSyncing || apiResults) && (
                <Badge
                    variant="outline"
                    className={`cursor-pointer ${apiSyncing
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : (apiResults ?? []).every(r => r.ok)
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-red-100 text-red-700 border-red-200"}`}
                    title={(apiResults ?? [])
                        .map(r => `${r.section}: ${r.ok ? "saved" : r.error ?? "failed"}`)
                        .join("\n")}
                    onClick={() => setApiSyncOpen(true)}
                >
                    {apiSyncing
                        ? "Syncing…"
                        : (() => {
                            const rs = apiResults ?? []
                            const bad = rs.filter(r => !r.ok).length
                            return bad === 0
                                ? `Content service · ${rs.length} saved`
                                : `Content service · ${bad} failed`
                        })()}
                </Badge>
            )}
            <Select value={listing.status} onValueChange={(v: any) => onStatusChange(v as ProductStatus)}>
                {/* Render the label directly instead of <SelectValue />: the options carry
                    badges and a blurb, and SelectValue mirrors that whole markup into the
                    trigger, which is what truncated it to "Published U…". */}
                <SelectTrigger className="h-9 w-[132px] shrink-0">
                    <span className="truncate">{statusMeta(listing.status).label}</span>
                </SelectTrigger>
                <SelectContent className="w-80">
                    {/* Each state spells out what happens to the URL and to browse, because
                        "Inactive" vs "Archived" is otherwise indistinguishable to an operator. */}
                    {LISTING_STATUSES.map(st => (
                        <SelectItem key={st.id} value={st.id}
                            disabled={st.id === "active" && unmetReqs.length > 0}
                            className="flex-col items-start gap-0.5 py-1.5">
                            <span className="flex w-full items-center gap-2 text-xs font-medium">
                                {st.label}
                                <span className={`ml-auto rounded-full border px-1.5 text-[9px] ${st.urlLive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                                    {st.urlLive ? "URL live" : "URL off"}
                                </span>
                                <span className={`rounded-full border px-1.5 text-[9px] ${st.inBrowse
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                                    {st.inBrowse ? "in browse" : "delisted"}
                                </span>
                            </span>
                            <span className="text-[10px] leading-snug text-muted-foreground">{st.blurb}</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="hidden whitespace-nowrap text-[11px] text-muted-foreground 2xl:inline"
                title="What this state does to the public page">
                {statusEffect(listing.status)}
            </span>
        </>
    )

    return (
        <>
        <UnsavedChangesGuard dirty={dirtyTracker.dirty} onSave={persist} entityLabel="listing" />
        <MediaUploadContext.Provider value={mediaUploadCtx}>
        <ListingEditorShell
            backHref="/catalogue/listings"
            title={isNew ? "New Listing" : (listing.displayNameEn || listing.internalName || "Edit Listing")}
            subtitle={isNew ? "Create a listing on the catalogue spine" : `${departmentLabel(listing.department)} · ${listing.internalName}`}
            titleBadge={<Badge variant="outline" className={STATUS_BADGE[listing.status]}>{listing.status}</Badge>}
            headerActions={headerActions}
            saveLabel={isLastSection ? "Save" : "Save & Continue"}
            saving={saving || apiSyncing}
            onSave={handleSaveAndContinue}
            sections={withSyncDot(sections)}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
        >
            {/* ── Content-service coverage ──────────────────────────────
                One banner, keyed off the active section, so an operator can
                always tell whether what they are typing reaches the service.
                Nothing is hidden or removed — sections the API has no home for
                still work, they are just labelled honestly. ── */}
            {/* What to do in THIS section, and whether it reaches the service.
                Rendered for every section that has guidance — including the ones
                that save cleanly, which is where people most need the order of
                operations rather than a warning. */}
            {pd && <SectionHelp sectionId={activeSection} />}

            {pd && (() => {
                const sync = syncOf(activeSection)
                if (!sync || sync.state === "synced") return null
                return (
                    <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${SYNC_CLASS[sync.state]}`}>
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <div>
                            <span className="font-medium">{SYNC_LABEL[sync.state]}</span>
                            <span className="opacity-90"> — {sync.detail}</span>
                        </div>
                    </div>
                )
            })()}
            {showErrors && (classificationError || totalVariantErrors > 0) && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{totalVariantErrors + (classificationError ? 1 : 0)} required item(s) missing. Check the marked sections.</span>
                </div>
            )}

            {/* Activation readiness — always visible while not yet ready */}
            {unmetReqs.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium text-amber-800">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {unmetReqs.length} requirement{unmetReqs.length > 1 ? "s" : ""} left before this listing can go Active
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {unmetReqs.map(r => (
                            <button key={r.key} onClick={() => setActiveSection(r.section)}
                                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2 py-0.5 text-xs text-amber-800 hover:bg-amber-100">
                                <Circle className="h-3 w-3" /> {r.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Activation checklist dialog */}
            {/* Per-section result of the last content-service push. */}
            <Dialog open={apiSyncOpen} onOpenChange={setApiSyncOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Content service sync</DialogTitle>
                        <DialogDescription>
                            {listing.apiUid
                                ? <>Saved as <span className="font-mono">{listing.apiUid}</span> (id {listing.apiProductId}).</>
                                : "This product has not been created on the content service yet."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        {(apiResults ?? []).map(r => (
                            <div key={r.section} className="flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
                                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${r.ok ? "bg-emerald-500" : "bg-red-500"}`} />
                                <div className="min-w-0">
                                    <div className="font-medium">{r.section}</div>
                                    {!r.ok && <div className="text-muted-foreground">{r.error}</div>}
                                    {r.fields && Object.entries(r.fields).map(([f, m]) => (
                                        <div key={f} className="text-muted-foreground"><span className="font-mono">{f}</span>: {m}</div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={activationOpen} onOpenChange={setActivationOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Activation checklist</DialogTitle>
                        <DialogDescription>
                            {unmetReqs.length === 0
                                ? "All requirements met — this listing is ready to go Active."
                                : "Complete these before the listing can go Active. Drafts save freely until then."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        {activationReqs.map(r => (
                            <button key={r.key} onClick={() => jumpToRequirement(r.section)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted disabled:cursor-default"
                                disabled={r.met}>
                                {r.met
                                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                    : <Circle className="h-4 w-4 shrink-0 text-amber-500" />}
                                <span className={r.met ? "text-muted-foreground line-through" : ""}>{r.label}</span>
                                {!r.met && <span className="ml-auto text-xs text-muted-foreground">Go →</span>}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {!isNew && (
                <EntityHistorySheet
                    entityType="listing"
                    entityId={currentId}
                    entityName={listing.displayNameEn || listing.internalName}
                    open={historyOpen}
                    onOpenChange={setHistoryOpen}
                />
            )}

            {/* ── CLASSIFICATION ── */}
            {activeSection === "classification" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>What it is — Department → Sub-department</CardTitle>
                            <CardDescription>Canonical home. A listing sits in exactly one sub-department. (Journeys & categories are assigned from their own pages.)</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            {/* The service's copy replaced the local one on load. Shown, not
                                swallowed: a field that came back different is the evidence that
                                an earlier write did not land the way the editor believed. */}
                            {drift.some(d => d.section === "classification") && (
                                <div className="col-span-2 rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                                    <span className="font-medium">Loaded from the content service, and these differed:</span>
                                    <ul className="mt-1 space-y-0.5">
                                        {drift.filter(d => d.section === "classification").map(d => (
                                            <li key={d.field} className="font-mono text-[11px]">
                                                {d.field}: was &ldquo;{d.local || "—"}&rdquo; → now &ldquo;{d.server || "—"}&rdquo;
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {taxonomyError && (
                                <div className="col-span-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
                                    {taxonomyError} Showing the built-in list — a listing saved now may
                                    name a sub-department the service does not have.
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Department <span className="text-destructive">*</span></Label>
                                <Select value={listing.department} disabled={!isNew} onValueChange={(v: any) => update({ department: v, subDepartmentId: "" })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    {/* Only departments the service can actually accept a listing
                                        under. A department with no sub-department row server-side
                                        cannot be saved, so offering it would produce a listing that
                                        fails at the first save with nothing on screen explaining
                                        why. The already-selected department is always kept, so an
                                        existing listing never loses its own value from the list. */}
                                    <SelectContent>{DEPARTMENTS
                                        .filter(d => selectableDepartments.has(d.id) || d.id === listing.department)
                                        .map(d => <SelectItem key={d.id} value={d.id}>{serverDepartmentNames[d.id] ?? d.labelEn}</SelectItem>)}</SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground">{isNew ? "Set at creation — not changeable afterwards." : "Fixed. Department cannot be changed on an existing listing."}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Sub-department <span className="text-destructive">*</span></Label>
                                <Select value={listing.subDepartmentId} disabled={!isNew} onValueChange={v => update({ subDepartmentId: v })}>
                                    <SelectTrigger className={err(!listing.subDepartmentId)}><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{deptSubDepts.map(s => <SelectItem key={s.id} value={s.id}>{s.nameEn}</SelectItem>)}</SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground">{isNew ? "Chosen at creation." : "Immutable once saved."}</p>
                            </div>
                            {/* TWO toggles, not one enum — `product_master` carries
                                `is_visible_app` and `is_visible_web`, and its comment records the
                                reason: "split from visible_on enum for clean surface filters".
                                The enum could not express HIDDEN ON BOTH, which is a legal state:
                                active, but reachable only by direct link or API. `visibleOn` is
                                kept in step for the readers that still take an enum, and is
                                derived here so the two can never disagree. */}
                            <div className="space-y-2">
                                <Label>Visible On</Label>
                                {(() => {
                                    const f = flagsOf(listing)
                                    const set = (next: { app: boolean; web: boolean }) =>
                                        update({
                                            isVisibleApp: next.app, isVisibleWeb: next.web,
                                            visibleOn: surfaceOf({ isVisibleApp: next.app, isVisibleWeb: next.web }),
                                        })
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                                                    <Switch checked={f.app}
                                                        onCheckedChange={v => set({ app: v, web: f.web })} />
                                                    <span className="text-sm">Mobile app</span>
                                                </div>
                                                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                                                    <Switch checked={f.web}
                                                        onCheckedChange={v => set({ app: f.app, web: v })} />
                                                    <span className="text-sm">Web storefront</span>
                                                </div>
                                            </div>
                                            {!f.app && !f.web && (
                                                <p className="text-[11px] text-muted-foreground">
                                                    Hidden on both surfaces — it stays orderable by direct link or API,
                                                    but appears in no listing page.
                                                </p>
                                            )}
                                        </div>
                                    )
                                })()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Feature (Internal Category) → Service Provider pool</CardTitle>
                            <CardDescription>The feature picks which provider pool fulfils this listing.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Internal Category / Feature</Label>
                                <Select value={listing.internalCategoryId ?? "none"} onValueChange={v => update({ internalCategoryId: v === "none" ? undefined : v })}>
                                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {features.map(f => <SelectItem key={f.id} value={f.id}>{f.nameEn}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Provider Pool</Label>
                                <div className="flex flex-wrap gap-1.5 pt-1.5">
                                    {/* The provider pool is country-scoped — it lives in
                                        internal_category_country_config — and neither
                                        GET /internal-categories nor the classification read carries
                                        a country, so this cannot be filled yet. Saying that is the
                                        point: an empty chip after picking a feature would read as
                                        "this feature has no providers", which is a different and
                                        wrong claim. */}
                                    {featureProviders.length
                                        ? featureProviders.map(p => <Badge key={p.id} variant="outline" className="text-[10px]">{p.name}</Badge>)
                                        : !listing.internalCategoryId
                                            ? <span className="text-xs text-muted-foreground">Select a feature.</span>
                                            : <span className="text-xs text-muted-foreground">Not available yet — the provider pool is set per country and no endpoint serves it.</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {listing.subDepartmentId && anyAttr && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Attributes / Features</CardTitle>
                                <CardDescription>Controlled by the <strong>{selSubDept?.nameEn}</strong> sub-department — only its applicable attributes are shown.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {visibleAttrs.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {visibleAttrs.map(({ key, label, hint }) => (
                                            <div key={key} className="flex items-center justify-between p-3 border rounded-md">
                                                <div><Label className="text-sm font-medium">{label}</Label><p className="text-xs text-muted-foreground">{hint}</p></div>
                                                <Switch checked={!!listing.attributes[key]} onCheckedChange={v => updateAttr({ [key]: v })} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showMedicineForm && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Medicine Form</Label>
                                            <Select value={listing.attributes.medicineForm ?? "none"} onValueChange={(v: any) => updateAttr({ medicineForm: v === "none" ? undefined : v as MedicineForm })}>
                                                <SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">N/A</SelectItem>
                                                    {MEDICINE_FORMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            {listing.attributes.medicineForm && <p className="text-[11px] text-muted-foreground">→ routes to <strong>{fulfilmentForMedicineForm(listing.attributes.medicineForm)}</strong> path</p>}
                                        </div>
                                    </div>
                                )}
                                {isMedicineSubDept && (
                                    <div className="space-y-2">
                                        <Label>Medicine Type (clinical class) <span className="text-destructive">*</span></Label>
                                        <Select value={listing.attributes.medicineType ?? "none"} onValueChange={(v: any) => updateAttr({ medicineType: v === "none" ? undefined : v as MedicineClass })}>
                                            <SelectTrigger className="w-full sm:w-80"><SelectValue placeholder="Select clinical class" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">N/A (ordinary supplement)</SelectItem>
                                                <SelectItem value="glp1">GLP-1</SelectItem>
                                                <SelectItem value="peptide">Peptide</SelectItem>
                                                <SelectItem value="hair_loss">Hair Loss</SelectItem>
                                                <SelectItem value="antibiotic">Antibiotic</SelectItem>
                                                <SelectItem value="vitamin">Vitamin</SelectItem>
                                                <SelectItem value="general_rx">General Rx</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-muted-foreground">Drives the clinical journey / protocol gating for this medicine.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Health Team mapping — Doctors & Health Coaches only. The person is a
                        profile in Modules → Health Team; the listing only references them. */}
                    {listing.department === "consultations" && (
                        <HealthTeamPicker value={listing.practitionerIds ?? []}
                            onChange={ids => update({ practitionerIds: ids })} />
                    )}

                    {/* Permanent pricing guard. This belongs on the listing precisely
                        because it does NOT expire — unlike a flash sale price. */}
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-base">Discount eligibility</CardTitle>
                            <CardDescription>
                                Whether this listing may ever be discounted by a flash sale or coupon. Permanent, so it
                                lives here rather than on the sale.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            <label className="flex items-start gap-2 rounded-md border p-3">
                                <Switch checked={listing.discountable !== false}
                                    onCheckedChange={v => update({ discountable: v })} />
                                <span>
                                    <span className="block text-xs font-medium">
                                        {listing.discountable === false ? "Never discountable" : "May be discounted"}
                                    </span>
                                    <span className="block text-[11px] text-muted-foreground">
                                        Turn off for GLP-1, MOH-regulated items and partner-contracted pricing. Flash
                                        sales skip these even when they are in scope.
                                    </span>
                                </span>
                            </label>
                            {listing.discountable !== false && (
                                <div className="space-y-1">
                                    <Label className="text-xs">Price floors — a sale may never go below these</Label>
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        {countryConfig.map(c => {
                                            const f = (listing.priceFloors ?? []).find(x => x.country === c.country)
                                            return (
                                                <div key={c.country} className="flex items-center gap-2">
                                                    <span className="w-14 text-[11px]">{c.country}</span>
                                                    <Input type="number" className="h-8 text-xs" placeholder="no floor"
                                                        value={f?.amount ?? ""}
                                                        onChange={e => {
                                                            const others = (listing.priceFloors ?? []).filter(x => x.country !== c.country)
                                                            update({
                                                                priceFloors: e.target.value === ""
                                                                    ? others
                                                                    : [...others, { country: c.country, amount: Number(e.target.value) }],
                                                            })
                                                        }} />
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {countryConfig.length === 0 && (
                                        <p className="text-[11px] text-muted-foreground">
                                            Enable a country first to set a floor.
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tags sit next to placement: both answer "how is this found?",
                        never "what is it?" — that stays with the sub-department. */}
                    <TagPicker
                        value={listing.tagIds ?? []}
                        onChange={ids => update({ tagIds: ids })}
                        proposerName={user?.name}
                    />
                </div>
            )}

            {/* ── IDENTITY & TYPE ── */}
            {activeSection === "identity" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Identity & Classification</CardTitle><CardDescription>Core identification and categorisation.</CardDescription></CardHeader>
                        {drift.some(d => d.section === "identity") && (
                            <div className="mx-6 mb-2 rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                                <span className="font-medium">Loaded from the content service, and these differed:</span>
                                <ul className="mt-1 space-y-0.5">
                                    {drift.filter(d => d.section === "identity").map(d => (
                                        <li key={d.field} className="font-mono text-[11px]">
                                            {d.field}: was &ldquo;{d.local || "—"}&rdquo; → now &ldquo;{d.server || "—"}&rdquo;
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Internal Name <span className="text-destructive">*</span></Label>
                                    <Input value={listing.internalName} onChange={e => update({ internalName: e.target.value })} placeholder={internalNamePlaceholder} />
                                    {internalNameClash
                                        ? <p className="text-[11px] text-destructive">Already used by &ldquo;{internalNameClash}&rdquo;. Internal names are unique.</p>
                                        : <p className="text-[11px] text-muted-foreground">Admin-only English label. The product list searches on it, so it must be unique.</p>}
                                </div>
                                {/* Internal Code = product_master.uid, GENERATED (D-C53), never typed —
                                    a write is rejected. Read-only by design, and shown here because it
                                    seeds every variant uid (D-C37), which is what an invoice line
                                    carries: without it an admin cannot trace an invoice back to a
                                    catalogue row. */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5">
                                        Internal Code
                                        <span className="text-[10px] font-normal text-muted-foreground">read-only · generated</span>
                                    </Label>
                                    <Input
                                        readOnly
                                        // apiUid FIRST: it is the uid the service generated and
                                        // wrote once (product_master.uid, D-C53). `internalCode` is
                                        // the local field and NOTHING EVER SETS IT — reading it first
                                        // is why this box stayed at "IV-…" through a successful save.
                                        value={listing.apiUid ?? listing.internalCode ?? (uidPrefix ? `${uidPrefix}-…` : "")}
                                        placeholder={listing.subDepartmentId ? "—" : "set a sub-department first"}
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        {(listing.apiUid ?? listing.internalCode)
                                            ? <>Seeds every variant code as {listing.apiUid ?? listing.internalCode}-NN — what an invoice line carries.</>
                                            : !listing.subDepartmentId
                                                ? <>The prefix comes from the sub-department, so this fills in once Classification is set.</>
                                                : uidPrefix
                                                    ? <>{uidPrefix} comes from the sub-department; the number is assigned on first save.</>
                                                    : <>This sub-department has no department code yet, so no code can be assigned.</>}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Display Name (EN)</Label><Input value={listing.displayNameEn} onChange={e => update({ displayNameEn: e.target.value })} placeholder="English name" /></div>
                                <div className="space-y-2"><Label>Display Name (AR)</Label><Input dir="rtl" className="text-right" value={listing.displayNameAr} onChange={e => update({ displayNameAr: e.target.value })} placeholder="الاسم بالعربية" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Brand is an FK on the content service. Free text is kept only as
                                    a label for departments the API does not cover. */}
                                <div className="space-y-2">
                                    <Label>Brand</Label>
                                    {/* ALWAYS a picker, never free text.
                                        Two things were wrong here. It was gated on
                                        `pd` (department === health_products), so a
                                        Treatments listing got the else-branch — and that
                                        branch was a free-text Input writing `listing.brand`,
                                        a STRING. IdentityRequest carries `brandId`, a Long
                                        FK, so anything typed there was never sent to the
                                        service: it looked saved and silently was not.
                                        Brands are global (a column on product_master), so
                                        there is nothing to gate on either. */}
                                    {apiBrands.length > 0 ? (
                                        <Select
                                            value={listing.brandId ? String(listing.brandId) : "none"}
                                            onValueChange={v => update({ brandId: v === "none" ? undefined : Number(v) })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No brand</SelectItem>
                                                {apiBrands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <>
                                            <Input value="" disabled placeholder="No brands configured" />
                                            <p className="text-[11px] text-muted-foreground">
                                                No brands exist on the content service yet. `product_brands`
                                                was emptied by the dev reset — add one there and it appears here.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                    {selSubDept?.slug === "medicine" && (
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Pill className="h-4 w-4" /> Medicine-Specific Fields</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Medicine Type (clinical class)</Label>
                                    <Select value={listing.attributes.medicineType ?? "none"} onValueChange={(v: any) => updateAttr({ medicineType: v === "none" ? undefined : v as MedicineClass })}>
                                        <SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">N/A (ordinary supplement)</SelectItem>
                                            <SelectItem value="glp1">GLP-1</SelectItem>
                                            <SelectItem value="peptide">Peptide</SelectItem>
                                            <SelectItem value="hair_loss">Hair Loss</SelectItem>
                                            <SelectItem value="antibiotic">Antibiotic</SelectItem>
                                            <SelectItem value="vitamin">Vitamin</SelectItem>
                                            <SelectItem value="general_rx">General Rx</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-muted-foreground">medicine_type NULL = ordinary supplement.</p>
                                </div>
                                <div className="space-y-2"><Label>Generic / Active Ingredient</Label><Input value={listing.medicineGenericName ?? ""} onChange={e => update({ medicineGenericName: e.target.value })} placeholder="e.g. Semaglutide" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Disclaimer (EN)</Label><textarea className="w-full h-20 p-3 border rounded-md text-sm" value={listing.medicineDisclaimerEn ?? ""} onChange={e => update({ medicineDisclaimerEn: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Disclaimer (AR)</Label><textarea dir="rtl" className="w-full h-20 p-3 border rounded-md text-sm text-right" value={listing.medicineDisclaimerAr ?? ""} onChange={e => update({ medicineDisclaimerAr: e.target.value })} /></div>
                                </div>
                                <div className="space-y-2"><Label>Contraindications</Label><textarea className="w-full h-16 p-3 border rounded-md text-sm" value={listing.medicineContraindications ?? ""} onChange={e => update({ medicineContraindications: e.target.value })} /></div>
                            </CardContent>
                        </Card>
                    )}
                    {selSubDept?.slug === "wearables" && (
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Cpu className="h-4 w-4" /> Wearable Specifications</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Manufacturer</Label><Input value={listing.wearableManufacturer ?? ""} onChange={e => update({ wearableManufacturer: e.target.value })} placeholder="e.g. Oura" /></div>
                                <div className="space-y-2"><Label>Connectivity</Label><Input value={listing.wearableConnectivity ?? ""} onChange={e => update({ wearableConnectivity: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Compatibility</Label><Input value={listing.wearableCompatibility ?? ""} onChange={e => update({ wearableCompatibility: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Warranty (months)</Label><Input type="number" value={listing.wearableWarrantyMonths ?? ""} onChange={e => update({ wearableWarrantyMonths: Number(e.target.value) })} /></div>
                            </CardContent>
                        </Card>
                    )}
                    {selSubDept?.slug === "gift-cards" && (
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Gift className="h-4 w-4" /> Gift Card Settings</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Validity Period</Label><Input value={listing.giftCardValidity ?? ""} onChange={e => update({ giftCardValidity: e.target.value })} placeholder="e.g. 12 Months" /></div>
                                <div className="space-y-2">
                                    <Label>Redemption Type</Label>
                                    <Select value={listing.giftCardRedemptionType ?? "digital"} onValueChange={(v: any) => update({ giftCardRedemptionType: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="digital">Digital</SelectItem><SelectItem value="physical">Physical</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Promo Banner removed from Identity 2026-08-28 (user's call). It is
                        merchandising, not identity, and the catalog schema models no promo-banner
                        entity at all — `promo_banner` appears in no CREATE TABLE and in no DBML
                        table; the nearest thing is `promotional_section`, a JSON content KEY inside
                        a config table's `content` blob, which is not a reusable banner carrying a
                        coupon. Health Products keep their attach point in Commercial / Hero until
                        the schema decides. */}
                </div>
            )}

            {/* ── COMMERCIAL / HERO (Health Products) ── */}
            {pd && activeSection === "commercial" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Hero Subtitle & Rating</CardTitle><CardDescription>PDP hero commercial fields for Health Products.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Subtitle (EN)</Label><Input value={listing.subTitleEn ?? ""} onChange={e => update({ subTitleEn: e.target.value })} placeholder="e.g. Clinically-backed daily support" /></div>
                                <div className="space-y-2"><Label>Subtitle (AR)</Label><Input dir="rtl" className="text-right" value={listing.subTitleAr ?? ""} onChange={e => update({ subTitleAr: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Rating (0–5)</Label><Input type="number" step="0.1" value={listing.rating ?? ""} onChange={e => update({ rating: e.target.value ? Number(e.target.value) : undefined })} placeholder="e.g. 4.7" /></div>
                                <div className="space-y-2"><Label>Total Ratings</Label><Input type="number" value={listing.totalRatings ?? ""} onChange={e => update({ totalRatings: e.target.value ? Number(e.target.value) : undefined })} placeholder="e.g. 1240" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Hero Discount & Delivery</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Discount Type</Label>
                                    <Select value={listing.heroDiscountType ?? "percentage"} onValueChange={(v: any) => update({ heroDiscountType: v as "percentage" | "fixed" })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Discount Value</Label><Input type="number" value={listing.heroDiscountValue ?? ""} onChange={e => update({ heroDiscountValue: e.target.value ? Number(e.target.value) : undefined })} /></div>
                                <div className="space-y-2"><Label>Delivery Time</Label><Input value={listing.deliveryTime ?? ""} onChange={e => update({ deliveryTime: e.target.value })} placeholder="e.g. 2-3 days" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Price per Serving</Label><Input type="number" step="0.01" value={listing.pricePerServing ?? ""} onChange={e => update({ pricePerServing: e.target.value ? Number(e.target.value) : undefined })} placeholder="e.g. 3.50" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Promo Banner</CardTitle><CardDescription>Attach a reusable promotional banner (with coupon) to this listing.</CardDescription></CardHeader>
                        <CardContent>
                            <PromoBannerSelect
                                banners={promoBanners}
                                value={listing.promoBannerId}
                                onChange={id => update({ promoBannerId: id })}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── COUNTRY AVAILABILITY & CONFIG ── */}
            {svc && activeSection === "cityConfig" && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">City Availability &amp; Booking</h3>
                        <p className="text-sm text-muted-foreground">
                            <code className="text-xs">product_city_config</code> — whether this
                            product is offered in a city, and who books the slot there. Per
                            <strong> product</strong>, not per variant: a variant&rsquo;s city
                            availability is whether it has a price row.
                        </p>
                    </div>
                    <CityAvailability
                        rows={listing.cityConfig ?? []}
                        countries={countryConfig.map(c => c.country)}
                        cities={cities}
                        slotDefault={defaultSlotBookingFor(listing.subDepartmentId)}
                        onChange={rows => update({ cityConfig: rows })}
                        onGoToCountries={() => setActiveSection("countryConfig")}
                    />
                </div>
            )}

            {svc && activeSection === "pricingSheet" && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Pricing Sheet</h3>
                        <p className="text-sm text-muted-foreground">
                            <code className="text-xs">product_pricing</code> — one row per (variant,
                            city), laid out as <strong>variants × cities</strong>, one country at a time.
                            A blank cell is a missing row, which is how &ldquo;not sold there&rdquo; is
                            said.
                        </p>
                    </div>
                    <PricingSheet
                        variants={variants}
                        variantOptions={variantOptions}
                        countries={countryConfig.map(c => c.country)}
                        cities={cities}
                        cityConfig={listing.cityConfig ?? []}
                        onReplaceVariants={setVariants}
                        onGoToCities={() => setActiveSection("cityConfig")}
                    />
                </div>
            )}

            {svc && activeSection === "sessionPacks" && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">{hc ? "Plans" : "Session Packs"}</h3>
                        <p className="text-sm text-muted-foreground">
                            <code className="text-xs">variant_session_packs</code> — {hc ? <>a plan
                            (5-day week, 20-day month) <strong>is its own variant</strong> over the
                            single-day base, priced by ordinary city rows at a stored total — never
                            days × day rate. Defining one here mints the variant and seeds its prices
                            from the intended discount; you adjust them in Pricing &amp; Availability.</>
                            : <>a pack
                            (&ldquo;Pack of 3&rdquo;, physio ×5) <strong>is its own variant</strong> over a
                            base variant, priced by ordinary city rows. Defining one here mints the variant
                            and seeds its prices from the intended discount; you adjust them in Pricing
                            &amp; Availability.</>}
                        </p>
                    </div>
                    <SessionPacks
                        family={hc ? "homecare" : "treatments"}
                        variants={variants}
                        variantOptions={variantOptions}
                        cities={cities}
                        onCreatePacks={createPacks}
                        onUpdatePacks={updatePacks}
                        onDeletePacks={deletePacks}
                        countries={countryConfig.map(c => c.country)}
                        onSetPackPrice={setPackPrice}
                        onRestore={setVariants}
                        onGoToPricing={() => setActiveSection("pricingSheet")}
                    />
                </div>
            )}

            {(svc || pd) && activeSection === "tiers" && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Multi-buy Tiers</h3>
                        <p className="text-sm text-muted-foreground">
                            <code className="text-xs">variant_multi_buy_tiers</code> — a quantity ladder
                            per <strong>variant × country</strong>. Percent only, threshold ≥ 2, highest
                            threshold at or below the cart quantity wins. No rows for a country means no
                            tiers there; that is the off switch, so there is no enable toggle.
                        </p>
                    </div>
                    <MultiBuyTiers
                        variants={variants}
                        variantOptions={variantOptions}
                        countries={countryConfig.map(c => c.country)}
                        cities={cities}
                        onReplaceVariants={setVariants}
                    />
                </div>
            )}

            {svc && activeSection === "masterSheet" && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Master Sheet</h3>
                        <p className="text-sm text-muted-foreground">
                            Every price this listing charges, in one grid, for a listing that already
                            exists. Packs are <strong>rows</strong> because a pack IS a variant
                            with its own city price rows; tiers sit <strong>inside each city</strong>
                            because
                            <code className="mx-1 text-xs">variant_multi_buy_tiers</code> carries a
                            <code className="mx-1 text-xs">city_id</code> and is read at the same scope
                            its price row was found at. Every cell shows both halves — a percent under an
                            amount, an amount under a percent — and only one of each pair is stored.
                            Nothing is created or deleted here.
                        </p>
                    </div>
                    <MasterSheet
                        variants={variants}
                        variantOptions={variantOptions}
                        countries={countryConfig.map(c => c.country)}
                        cities={cities}
                        cityConfig={listing.cityConfig ?? []}
                        onReplaceVariants={setVariants}
                        onGoToCities={() => setActiveSection("cityConfig")}
                        onGoToPacks={() => setActiveSection("sessionPacks")}
                        onGoToTiers={() => setActiveSection("tiers")}
                    />
                </div>
            )}

            {activeSection === "countryConfig" && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Country Availability & Config</CardTitle>
                            <CardDescription>One row per country (product_country_config). A market added here can be switched Inactive to stop selling — rows are not deleted, so the history of having offered it survives.</CardDescription>
                        </div>
                        {/* Offered markets come from GET /countries. The hardcoded COUNTRIES list
                            is only the fallback for a failed lookup — offering a market the service
                            does not have lets an operator fill in six toggles and only then meet
                            "Unknown market." on save. */}
                        {(() => {
                            const offerable = apiCountries ?? COUNTRIES
                            const remaining = offerable.filter(c => !countryConfig.some(x => x.country === c))
                            return (
                                <Select value="" onValueChange={(v: any) => addCountryConfig(v as Country)}>
                                    <SelectTrigger className="w-[160px] h-9" disabled={remaining.length === 0}>
                                        <SelectValue placeholder={remaining.length === 0 ? "All markets added" : "Add country"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {remaining.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )
                        })()}
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {countryConfig.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">No countries configured — this listing is not sold anywhere. Add a country to make it available.</div>
                        ) : countryConfig.map(cfg => (
                            <div key={cfg.country} className="border rounded-lg p-4 space-y-3 bg-muted/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="font-semibold text-sm">{cfg.country}</span></div>
                                    <div className="flex items-center gap-2">
                                        <Select value={cfg.status} onValueChange={(v: any) => updateCountryConfig(cfg.country, { status: v })}>
                                            <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                                        </Select>
                                        {/* No delete. The service has no DELETE on availability, so a
                                            trash button could only ever remove the row from THIS
                                            screen — the product would go on selling in a market the
                                            operator believed they had removed, and a reload would not
                                            even show the disagreement.
                                            Inactive is the real control, and it says more: the row
                                            records that this market was offered and withdrawn, which
                                            "no row" cannot express (D-C29). */}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* EXACTLY the five columns on product_country_config, in the
                                        order they appear on the row. Two toggles were removed rather
                                        than left non-functional: "VAT excluded" (VAT is
                                        sub-department x country per D-C54, not per product) and
                                        "Coupon eligible" (no column, and undefined against the
                                        blocked flag beside it). Both saved nothing.

                                        The two subscription flags moved here FROM the Subscription
                                        tab, so one screen now owns the whole row. */}
                                    {([
                                        ["isCodEligible", "COD eligible"],
                                        ["isCouponDiscountBlocked", "Coupon discounts blocked"],
                                        ["isCouponThresholdExcluded", "Excluded from coupon threshold"],
                                        ["isSubscriptionEnabled", "Subscription enabled"],
                                        ["isSubscriptionAutoSelected", "Subscription pre-selected"],
                                    ] as const).map(([key, label]) => (
                                        <div key={key} className="flex items-center justify-between p-2.5 border rounded-md bg-white">
                                            <Label className="text-xs font-medium">{label}</Label>
                                            {/* Pre-select is disabled while subscriptions are off, and
                                                switching subscriptions off clears it. The service
                                                refuses the contradictory pair with a 422
                                                (SUBSCRIPTION_NOT_OFFERED); making it unreachable here
                                                means the operator never has to meet that error. */}
                                            <Switch
                                                checked={!!cfg[key]}
                                                disabled={key === "isSubscriptionAutoSelected" && !cfg.isSubscriptionEnabled}
                                                onCheckedChange={val => updateCountryConfig(cfg.country,
                                                    key === "isSubscriptionEnabled" && !val
                                                        ? { isSubscriptionEnabled: false, isSubscriptionAutoSelected: false }
                                                        : { [key]: val })} />
                                        </div>
                                    ))}
                                    {/* D-C67: the commitment floor is a term of THIS market, beside the
                                        flag it belongs to. Empty = don't touch the stored value; the
                                        backend defaults a new market to 1 (cancel any time). */}
                                    {cfg.isSubscriptionEnabled && (
                                        <div className="flex items-center justify-between p-2.5 border rounded-md bg-white">
                                            <Label className="text-xs font-medium">Min cycles commitment</Label>
                                            <Input type="number" min={1} max={24} className="h-8 w-24 text-xs"
                                                placeholder="1"
                                                value={cfg.subscriptionMinCycles ?? ""}
                                                onChange={e => updateCountryConfig(cfg.country, {
                                                    subscriptionMinCycles: e.target.value === "" ? undefined : Math.max(1, Math.min(24, Number(e.target.value))),
                                                })} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── MASTER CONTENT ── */}
            {activeSection === "content" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Descriptions</CardTitle><CardDescription>Shared across variants unless overridden.</CardDescription></CardHeader>
                        <CardContent>
                            <Tabs defaultValue="english">
                                <TabsList><TabsTrigger value="english">English</TabsTrigger><TabsTrigger value="arabic">Arabic</TabsTrigger></TabsList>
                                <TabsContent value="english" className="space-y-4 pt-4">
                                    <div className="space-y-2"><Label>Short Description (EN)</Label><Input value={listing.shortDescriptionEn ?? ""} onChange={e => update({ shortDescriptionEn: e.target.value })} /></div>
                                    <RichText label="Master Description (EN)" value={listing.descriptionEn ?? ""} onChange={html => update({ descriptionEn: html })} />
                                    <div className="space-y-2"><Label>Usage / Dosage / Timing (EN)</Label><textarea className="w-full h-20 p-3 border rounded-md text-sm" value={listing.usageInstructionsEn ?? ""} onChange={e => update({ usageInstructionsEn: e.target.value })} placeholder="e.g. Take 2 softgels daily, with a meal" /></div>
                                    <div className="space-y-2"><Label>Storage Instructions (EN)</Label><Input value={listing.storageInstructionsEn ?? ""} onChange={e => update({ storageInstructionsEn: e.target.value })} placeholder="e.g. Store below 25°C" /></div>
                                    {/* These two had an EN input but no AR one — a bilingual product
                                        cannot ship half-authored fields. */}
                                    {/* ── Content-service fields ── these map 1:1 onto the API's keyIngredients /
                                        keyHighlights / disclaimer / mechanism / science, plus
                                        usageInstructions and storageInstructions above. All are
                                        ContentAttributes (translations rows) on GET/PUT /content,
                                        NOT content blocks — so they round-trip through hydrate. ── */}
                                    <div className="space-y-2"><Label>Key ingredients (EN)</Label><textarea className="w-full h-20 p-3 border rounded-md text-sm" value={listing.keyIngredientsEn ?? ""} onChange={e => update({ keyIngredientsEn: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Key highlights (EN)</Label><textarea className="w-full h-20 p-3 border rounded-md text-sm" value={listing.keyHighlightsEn ?? ""} onChange={e => update({ keyHighlightsEn: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>How it works / mechanism (EN)</Label><textarea className="w-full h-20 p-3 border rounded-md text-sm" value={listing.mechanismEn ?? ""} onChange={e => update({ mechanismEn: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Science / Research (EN)</Label><textarea className="w-full h-24 p-3 border rounded-md text-sm" value={listing.scienceBlockEn ?? ""} onChange={e => update({ scienceBlockEn: e.target.value })} placeholder="Clinical and scientific evidence" /></div>
                                    <div className="space-y-2"><Label>Disclaimer (EN)</Label><textarea className="w-full h-20 p-3 border rounded-md text-sm" value={listing.disclaimerEn ?? ""} onChange={e => update({ disclaimerEn: e.target.value })} /></div>
                                </TabsContent>
                                <TabsContent value="arabic" className="space-y-4 pt-4" dir="rtl">
                                    {/* SAME NINE FIELDS, SAME ORDER as the English tab above.
                                        Keep them in step: this pair has drifted twice — once with
                                        two Arabic boxes stranded on the English tab, and once with
                                        Science / Research present here and missing there. A field
                                        on one tab only is invisible to whoever edits the other. */}
                                    <div className="space-y-2"><Label>وصف قصير <span dir="ltr" className="font-normal text-muted-foreground">(Short Description)</span></Label><Input className="text-right" value={listing.shortDescriptionAr ?? ""} onChange={e => update({ shortDescriptionAr: e.target.value })} /></div>
                                    <RichText label={<>الوصف الرئيسي <span dir="ltr" className="font-normal text-muted-foreground">(Master Description)</span></>} dir="rtl" value={listing.descriptionAr ?? ""} onChange={html => update({ descriptionAr: html })} />
                                    <div className="space-y-2"><Label>تعليمات الاستخدام <span dir="ltr" className="font-normal text-muted-foreground">(Usage / Dosage / Timing)</span></Label><textarea dir="rtl" className="w-full h-20 p-3 border rounded-md text-sm text-right" value={listing.usageInstructionsAr ?? ""} onChange={e => update({ usageInstructionsAr: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>تعليمات التخزين <span dir="ltr" className="font-normal text-muted-foreground">(Storage Instructions)</span></Label><Input dir="rtl" className="text-right" value={listing.storageInstructionsAr ?? ""} onChange={e => update({ storageInstructionsAr: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>المكونات الرئيسية <span dir="ltr" className="font-normal text-muted-foreground">(Key ingredients)</span></Label><textarea dir="rtl" className="w-full h-20 p-3 border rounded-md text-sm text-right" value={listing.keyIngredientsAr ?? ""} onChange={e => update({ keyIngredientsAr: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>أبرز المزايا <span dir="ltr" className="font-normal text-muted-foreground">(Key highlights)</span></Label><textarea dir="rtl" className="w-full h-20 p-3 border rounded-md text-sm text-right" value={listing.keyHighlightsAr ?? ""} onChange={e => update({ keyHighlightsAr: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>آلية العمل <span dir="ltr" className="font-normal text-muted-foreground">(How it works / mechanism)</span></Label><textarea dir="rtl" className="w-full h-20 p-3 border rounded-md text-sm text-right" value={listing.mechanismAr ?? ""} onChange={e => update({ mechanismAr: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>العلم والأبحاث <span dir="ltr" className="font-normal text-muted-foreground">(Science / Research)</span></Label><textarea dir="rtl" className="w-full h-24 p-3 border rounded-md text-sm text-right" value={listing.scienceBlockAr ?? ""} onChange={e => update({ scienceBlockAr: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>إخلاء المسؤولية <span dir="ltr" className="font-normal text-muted-foreground">(Disclaimer)</span></Label><textarea dir="rtl" className="w-full h-20 p-3 border rounded-md text-sm text-right" value={listing.disclaimerAr ?? ""} onChange={e => update({ disclaimerAr: e.target.value })} /></div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Benefits</CardTitle><CardDescription>Icon + label items on the PDP.</CardDescription></div><Button onClick={addBenefit} variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add</Button></CardHeader>
                        <CardContent className="space-y-3">
                            {benefits.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4 italic">No benefits.</p> : benefits.map((b, i) => (
                                <div key={i} className="grid grid-cols-6 gap-2 items-center p-3 border rounded-md bg-muted/5">
                                    <Input className="h-8 text-xs" placeholder="Icon key" value={b.iconKey} onChange={e => updateBenefit(i, { iconKey: e.target.value })} />
                                    <Input className="h-8 text-xs" placeholder="Label EN" value={b.labelEn} onChange={e => updateBenefit(i, { labelEn: e.target.value })} />
                                    <Input className="h-8 text-xs text-right" dir="rtl" placeholder="Label AR" value={b.labelAr} onChange={e => updateBenefit(i, { labelAr: e.target.value })} />
                                    <Input className="h-8 text-xs" placeholder="Description EN" value={b.descriptionEn} onChange={e => updateBenefit(i, { descriptionEn: e.target.value })} />
                                    <Input className="h-8 text-xs text-right" dir="rtl" placeholder="Description AR" value={b.descriptionAr} onChange={e => updateBenefit(i, { descriptionAr: e.target.value })} />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive justify-self-end" onClick={() => removeBenefit(i)}><Trash className="h-3.5 w-3.5" /></Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {(selSubDept?.slug === "supplements" || selSubDept?.slug === "medicine") && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Ingredients / Supplement Facts</CardTitle></div><Button onClick={addIngredient} variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add</Button></CardHeader>
                            <CardContent>
                                {ingredients.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4 italic">No ingredients.</p> : (
                                    <Table>
                                        <TableHeader><TableRow className="bg-muted/30"><TableHead className="h-8 text-xs">Name EN</TableHead><TableHead className="h-8 text-xs">Name AR</TableHead><TableHead className="h-8 text-xs">Amount</TableHead><TableHead className="h-8 text-xs">Unit</TableHead><TableHead className="h-8 text-xs">DV %</TableHead><TableHead className="h-8 text-xs text-right">Remove</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {ingredients.map((ing, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="py-1.5"><Input className="h-7 text-xs" value={ing.nameEn} onChange={e => updateIngredient(i, { nameEn: e.target.value })} /></TableCell>
                                                    <TableCell className="py-1.5"><Input className="h-7 text-xs text-right" dir="rtl" value={ing.nameAr} onChange={e => updateIngredient(i, { nameAr: e.target.value })} /></TableCell>
                                                    <TableCell className="py-1.5"><Input type="number" className="h-7 text-xs w-20" value={ing.amount} onChange={e => updateIngredient(i, { amount: Number(e.target.value) })} /></TableCell>
                                                    <TableCell className="py-1.5"><Input className="h-7 text-xs w-16" value={ing.unit} placeholder="mg" onChange={e => updateIngredient(i, { unit: e.target.value })} /></TableCell>
                                                    <TableCell className="py-1.5"><Input type="number" className="h-7 text-xs w-20" value={ing.dailyValuePct ?? ""} onChange={e => updateIngredient(i, { dailyValuePct: e.target.value ? Number(e.target.value) : null })} /></TableCell>
                                                    <TableCell className="py-1.5 text-right"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeIngredient(i)}><Trash className="h-3 w-3" /></Button></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {selSubDept?.slug !== "gift-cards" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>City-Level Delivery Configuration</CardTitle><CardDescription>Per-city delivery times. Falls back to global config if empty.</CardDescription></div><Button onClick={addDelivery} size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Add City</Button></CardHeader>
                            <CardContent>
                                {deliveryConfig.length === 0 ? <div className="text-center py-4 border rounded-md bg-muted/5 italic text-sm text-muted-foreground">No city configs. Global config used.</div> : (
                                    <Table>
                                        <TableHeader><TableRow className="bg-muted/50"><TableHead className="h-9 text-xs">City</TableHead><TableHead className="h-9 text-xs">Delivery Time</TableHead><TableHead className="h-9 text-xs">Availability</TableHead><TableHead className="h-9 text-xs text-right">Remove</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {deliveryConfig.map((cfg, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="py-2"><div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground shrink-0" /><Input value={cfg.city} onChange={e => updateDelivery(i, { city: e.target.value })} placeholder="City" className="h-8 text-xs" /></div></TableCell>
                                                    <TableCell className="py-2"><div className="flex items-center gap-2"><Truck className="h-3 w-3 text-muted-foreground shrink-0" /><Input value={cfg.deliveryTime} onChange={e => updateDelivery(i, { deliveryTime: e.target.value })} placeholder="e.g. Same Day" className="h-8 text-xs" /></div></TableCell>
                                                    <TableCell className="py-2">
                                                        <Select value={cfg.isAvailable ? "yes" : "no"} onValueChange={v => updateDelivery(i, { isAvailable: v === "yes" })}>
                                                            <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                                                            <SelectContent><SelectItem value="yes">Available</SelectItem><SelectItem value="no">Unavailable</SelectItem></SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right"><Button variant="ghost" size="icon" onClick={() => removeDelivery(i)} className="h-7 w-7 text-destructive"><Trash className="h-3.5 w-3.5" /></Button></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* ── HOW TO USE (Health Products) ── */}
            {activeSection === "howToUse" && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>How to Use</CardTitle><CardDescription>Structured usage steps (Dosage / Timing / Storage) shown on the PDP.</CardDescription></div>
                        <Button onClick={addHowToUse} variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Step</Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {howToUse.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">No steps. Add to seed Dosage / Timing / Storage.</div>
                        ) : howToUse.map((item, i) => (
                            <div key={i} className="border rounded-lg p-4 space-y-3 bg-muted/5">
                                <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Step #{i + 1}</span><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeHowToUse(i)}><Trash className="h-3 w-3" /></Button></div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1"><Label className="text-xs">Icon Key</Label><Input className="h-8 text-xs" value={item.iconKey ?? ""} onChange={e => updateHowToUse(i, { iconKey: e.target.value })} placeholder="e.g. dosage" /></div>
                                    <div className="space-y-1"><Label className="text-xs">Title (EN)</Label><Input className="h-8 text-xs" value={item.textEn} onChange={e => updateHowToUse(i, { textEn: e.target.value })} placeholder="e.g. Dosage" /></div>
                                    <div className="space-y-1"><Label className="text-xs">Title (AR)</Label><Input dir="rtl" className="h-8 text-xs text-right" value={item.textAr ?? ""} onChange={e => updateHowToUse(i, { textAr: e.target.value })} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><Label className="text-xs">Detail (EN)</Label><textarea className="w-full h-16 p-2 border rounded-md text-sm" value={item.subTextEn} onChange={e => updateHowToUse(i, { subTextEn: e.target.value })} placeholder="e.g. Take 2 softgels daily" /></div>
                                    <div className="space-y-1"><Label className="text-xs">Detail (AR)</Label><textarea dir="rtl" className="w-full h-16 p-2 border rounded-md text-sm text-right" value={item.subTextAr ?? ""} onChange={e => updateHowToUse(i, { subTextAr: e.target.value })} /></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── MEDIA GALLERY (product-level) ── */}
            {activeSection === "media" && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Media Gallery</CardTitle><CardDescription>The ONE door for all media — product-level and per-variant. Exactly one image should be hero.</CardDescription></div><Button variant="outline" size="sm" onClick={addProductAsset}><ImagePlus className="mr-2 h-4 w-4" /> Add Asset</Button></CardHeader>
                    <CardContent className="space-y-3">
                        {mediaGallery.length === 0 ? (
                            <div className="border-2 border-dashed rounded-lg p-10 text-center"><ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm font-medium">No assets</p><Button variant="outline" size="sm" className="mt-4" onClick={addProductAsset}>Add first asset</Button></div>
                        ) : mediaGallery.map((asset, i) => (
                            <div key={asset.assetId} className={`flex items-start gap-4 p-3 border rounded-lg ${asset.isHero ? "border-primary bg-primary/5" : ""}`}>
                                <GripVertical className="h-4 w-4 text-muted-foreground mt-2" />
                                <div className="flex-1 space-y-3">
                                    <div className="flex gap-4">
                                        <div className="space-y-1"><Label className="text-xs">Type</Label>
                                            <Select value={asset.type} onValueChange={v => updateProductAsset(i, { type: v as "image" | "video" })}>
                                                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="image">Image</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        {variants.length > 0 && (
                                            <div className="space-y-1"><Label className="text-xs">Applies to</Label>
                                                {/* Empty = product-level. ONE image may serve MANY variants
                                                    (D-C69): each checked variant becomes a placement row
                                                    sharing this URL. One door, mirroring product_media. */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-8 w-56 justify-start text-xs font-normal">
                                                            {(asset.variantIds ?? []).length === 0
                                                                ? "Product (all variants)"
                                                                : `${(asset.variantIds ?? []).length} variant${(asset.variantIds ?? []).length === 1 ? "" : "s"}`}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-56">
                                                        <DropdownMenuCheckboxItem
                                                            checked={(asset.variantIds ?? []).length === 0}
                                                            onCheckedChange={() => updateProductAsset(i, { variantIds: [] })}>
                                                            Product (all variants)
                                                        </DropdownMenuCheckboxItem>
                                                        {variants.map(v => (
                                                            <DropdownMenuCheckboxItem key={v.id}
                                                                checked={(asset.variantIds ?? []).includes(v.id)}
                                                                onCheckedChange={checked => {
                                                                    const current = asset.variantIds ?? []
                                                                    updateProductAsset(i, {
                                                                        variantIds: checked
                                                                            ? [...current, v.id]
                                                                            : current.filter(x => x !== v.id),
                                                                        // an assigned asset cannot be the hero (D-C34:
                                                                        // the hero is the PRODUCT's lead image)
                                                                        ...(checked && asset.isHero ? { isHero: false } : {}),
                                                                    })
                                                                }}>
                                                                {v.variantLabelEn || v.nameEn || `Variant ${v.id}`}
                                                            </DropdownMenuCheckboxItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>
                                    <ImageField
                                        preset="square"
                                        section="gallery"
                                        mediaKind={asset.type === "video" ? "video" : "image"}
                                        value={asset.url}
                                        onChange={url => updateProductAsset(i, { url })}
                                        altEn={asset.altTextEn}
                                        altAr={asset.altTextAr}
                                        onAltEnChange={v => updateProductAsset(i, { altTextEn: v })}
                                        onAltArChange={v => updateProductAsset(i, { altTextAr: v })}
                                    />
                                    {asset.type === "video" && (
                                        <div className="mt-2 space-y-1">
                                            <Label className="text-xs">Poster / thumbnail URL</Label>
                                            <Input className="h-8 text-xs" value={asset.thumbnailUrl ?? ""} onChange={e => updateProductAsset(i, { thumbnailUrl: e.target.value })} placeholder="https://… — required, a video with no poster renders blank" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {asset.type === "image" && <Button size="sm" variant={asset.isHero ? "default" : "outline"} className="h-7 text-xs" disabled={(asset.variantIds ?? []).length > 0} title={(asset.variantIds ?? []).length > 0 ? "The hero is the product's lead image — a variant-assigned asset cannot be it." : undefined} onClick={() => update({ mediaGallery: mediaGallery.map((a, idx) => ({ ...a, isHero: idx === i })) })}><Star className="mr-1 h-3 w-3" />{asset.isHero ? "Hero" : "Set Hero"}</Button>}
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeProductAsset(i)}><Trash className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── VARIANTS & PRICING ── */}
            {activeSection === "variants" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div><h3 className="text-lg font-semibold">Variants & Pricing</h3><p className="text-sm text-muted-foreground">Name &amp; media are per-variant. Prices are per-country.{pd ? " Warehouse & subscription price are per-country." : ""} VAT is set per country on the sub-department.{pd ? " SEO is authored once on the listing — variants share one product page." : " SEO is per-variant."}</p></div>
                        <div className="flex shrink-0 items-center gap-2">
                            <GuideButton guide="variants" />
                            {/* The ONLY way to add a variant in matrix mode is to generate it from
                                the axes — a hand-added variant answers no axis, and D-C7 requires
                                every declared axis to be answered, so it could never be sold.
                                TREATMENTS is matrix-only regardless of what is declared yet: D-C27
                                makes VOLUME mandatory on every drip, so the axes are always the
                                variant list and there is no hand-add route at all. */}
                            {!matrixMode && !svc && (
                                <Button onClick={addVariant} size="sm"><Plus className="mr-2 h-4 w-4" /> Add Variant</Button>
                            )}
                        </div>
                    </div>

                    <VariantOptionsPanel
                        options={variantOptions}
                        onChange={setVariantOptions}
                        variants={variants}
                        onGenerate={handleGenerate}
                        generating={generating}
                        generateError={generateError}
                        countries={countryConfig.map(c => c.country)}
                        axisSet={tx ? "treatments" : hc ? "homecare" : "default"}
                        onSetVariantStatus={(ids, status) => setVariants(
                            variants.map(v => ids.includes(v.id) ? { ...v, status } : v))}
                        allowSpeedAxis={flowForSubDepartment(
                            subDepartments.find(sd => sd.id === listing.subDepartmentId)?.slug,
                        ).allowDripSpeed}
                        // From the SERVICE (VariantAxesResponse.mandatoryAxisCodes), not a
                        // frontend copy of the family policy: generate() checks the server's list,
                        // so anything else here can only disagree with the refusal the operator
                        // actually gets. The slug helper is the fallback for a product that does
                        // not exist server-side yet — no axes to ask about, but the panel still
                        // needs to know whether "sold as one item" is offered at all.
                        mandatoryAxisKinds={mandatoryAxisCodes.length > 0
                            ? mandatoryAxisCodes
                            : mandatoryAxisKindsFor(
                                subDepartments.find(sd => sd.id === listing.subDepartmentId)?.slug,
                            )}
                        onCreateSoleVariant={createSoleVariant}
                        onDropSoleVariant={dropSoleVariant}
                    />

                    {variants.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                            <p className="text-muted-foreground font-medium">No variants yet.</p>
                            {matrixMode && variantOptions.length === 0 ? (
                                // No axes AND no variants: the panel above is asking whether this
                                // listing varies at all, so telling them to fill in axis values
                                // points at something that is not on the screen.
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Answer the question above first — declare the axes this listing varies by,
                                    or create its single variant if it is sold as one item.
                                </p>
                            ) : matrixMode ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Add a value to each axis above, then generate the combinations — variants are
                                    never added by hand here.
                                </p>
                            ) : (
                                <Button onClick={addVariant} variant="outline" size="sm" className="mt-3"><Plus className="mr-2 h-4 w-4" /> Add First Variant</Button>
                            )}
                        </div>
                    ) : variants.map((v, idx) => {
                        const vErrs = variantErrors(v)
                        return (
                            <Card key={v.id} className={`border-l-4 ${v.isDefault ? "border-l-primary" : "border-l-muted"}`}>
                                {/* Collapsed by default. A 12-combination IV listing rendered every
                                    variant card in full — axes, identity, media, SEO — which is a page
                                    that scrolls for a screenful per variant and buries the axes panel
                                    above it. The header carries what you scan for; open the one you
                                    mean to edit. */}
                                <CardHeader className="py-3 flex flex-row items-center justify-between">
                                    <div className="flex flex-1 cursor-pointer items-center gap-2"
                                        onClick={() => setOpenVariantId(openVariantId === v.id ? null : v.id)}>
                                        <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openVariantId === v.id ? "rotate-90" : ""}`} />
                                        <span className="font-semibold text-sm">Variant #{idx + 1}: {v.nameEn || "Unnamed"}</span>
                                        {v.isDefault && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Default</Badge>}
                                        <Badge variant="outline" className={`text-[10px] ${v.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "text-muted-foreground"}`}>{v.status}</Badge>
                                        {showErrors && vErrs.length > 0 && <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">{vErrs.length} missing</Badge>}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {!v.isDefault && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setDefaultVariant(v.id)}><Star className="mr-1 h-3 w-3" /> Default</Button>}
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateVariant(v.id)}><Copy className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeVariant(v.id)}><Trash className="h-4 w-4" /></Button>
                                    </div>
                                </CardHeader>
                                {openVariantId === v.id && <CardContent className="space-y-5 pt-0">
                                    <div className="grid grid-cols-3 gap-3">
                                        {matrixMode ? (
                                            <>
                                                {/* One selector per declared axis — this is what "variant type is
                                                    multi-select" looks like once the axes live on the listing. */}
                                                {[...variantOptions].sort((a, b) => a.position - b.position).map(o => (
                                                    <div key={o.id} className="space-y-1">
                                                        <Label className="text-xs">{o.nameEn} <span className="text-destructive">*</span></Label>
                                                        <Select value={v.optionValues?.[o.id] ?? ""}
                                                            onValueChange={val => setVariantOptionValue(v, o.id, val)}>
                                                            <SelectTrigger className={`h-8 text-xs ${err(!v.optionValues?.[o.id])}`}>
                                                                <SelectValue placeholder={`Pick ${o.nameEn.toLowerCase()}`} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {o.values.filter(val => val.isActive).map(val => (
                                                                    <SelectItem key={val.id} value={val.id}>
                                                                        {val.valueEn || "(unnamed)"}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ))}
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Label</Label>
                                                    <Input readOnly disabled className="h-8 text-xs bg-muted/50"
                                                        title="Derived from the combination — edit the axis values to change it"
                                                        value={comboLabel(v.optionValues, variantOptions) || "—"} />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-1"><Label className="text-xs">Variant Type</Label>
                                                    <Select value={v.variantType} onValueChange={val => updateVariant(v.id, { variantType: val as VariantType })}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>{VARIANT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1"><Label className="text-xs">Label (EN) <span className="text-destructive">*</span></Label><Input className={`h-8 text-xs ${err(!v.variantLabelEn)}`} value={v.variantLabelEn} onChange={e => updateVariant(v.id, { variantLabelEn: e.target.value })} placeholder="e.g. 500mg" /></div>
                                                <div className="space-y-1"><Label className="text-xs">Label (AR) <span className="text-destructive">*</span></Label><Input dir="rtl" className={`h-8 text-xs text-right ${err(!v.variantLabelAr)}`} value={v.variantLabelAr} onChange={e => updateVariant(v.id, { variantLabelAr: e.target.value })} /></div>
                                            </>
                                        )}
                                        <div className="space-y-1"><Label className="text-xs">Status</Label>
                                            <Select value={v.status} onValueChange={val => updateVariant(v.id, { status: val as VariantStatus })}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="out_of_stock">Out of Stock</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        {pd && <div className="space-y-1"><Label className="text-xs">Stock (all warehouses)</Label><Input type="number" readOnly disabled className="h-8 text-xs bg-muted/50" title="Master stock = sum of every warehouse's stock" value={(v.regionalData ?? []).reduce((s, r) => s + (r.warehouseStock ?? 0), 0)} /></div>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 border p-3 rounded-md bg-muted/5">
                                            <Label className="font-semibold text-xs">English Identity</Label>
                                            <Input placeholder="Display Name (EN) *" className={`h-8 text-xs ${err(!v.nameEn)}`} value={v.nameEn} onChange={e => updateVariant(v.id, { nameEn: e.target.value })} />
                                            <Input
                                                placeholder={pd ? "Deep-link key (EN) — optional" : "URL Slug (EN) *"}
                                                title={pd ? "Not a URL. Products variants share one PDP; this only makes ?variant= links readable." : "Variant page URL"}
                                                className={`h-8 text-xs ${pd ? "" : err(!v.slugEn)}`}
                                                value={v.slugEn} onChange={e => updateVariant(v.id, { slugEn: e.target.value })} />
                                        </div>
                                        <div className="space-y-2 border p-3 rounded-md bg-muted/5" dir="rtl">
                                            <Label className="font-semibold text-xs">الهوية العربية</Label>
                                            <Input placeholder="اسم العرض (AR) *" className={`h-8 text-xs text-right ${err(!v.nameAr)}`} value={v.nameAr} onChange={e => updateVariant(v.id, { nameAr: e.target.value })} />
                                            {!pd && (
                                                <Input placeholder="الرابط (AR) *" className={`h-8 text-xs text-right ${err(!v.slugAr)}`} value={v.slugAr} onChange={e => updateVariant(v.id, { slugAr: e.target.value })} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Regional Availability & Pricing — HEALTH PRODUCTS ONLY since
                                        2026-08-28. Treatments authors money in Pricing & Availability,
                                        because product_pricing is keyed (variant, partner, country, CITY)
                                        and IV prices by city: 68 of 108 multi-city packages price
                                        differently. Keeping a country row here as well would put one fact
                                        — what this sellable costs in this market — on two screens, which is
                                        what invites the "city price else country price" fallback D-C29
                                        forbids (composition.ts:180 still carries exactly that). */}
                                    {pd && (
                                    <div className="space-y-2 border p-3 rounded-md bg-muted/5">
                                        <div className="flex items-center justify-between">
                                            <Label className="font-semibold text-xs">Regional Availability & Pricing</Label>
                                            <div className="flex flex-wrap gap-1.5">{COUNTRIES.map(c => <Button key={c} size="sm" variant={v.regionalData.some(r => r.country === c) ? "default" : "outline"} className="h-6 text-[10px] px-2" onClick={() => toggleCountry(v.id, c)}>{c}</Button>)}</div>
                                        </div>
                                        {v.regionalData.length === 0 ? <p className={`text-xs italic text-center py-2 ${showErrors ? "text-destructive" : "text-muted-foreground"}`}>Enable at least one region.</p> : v.regionalData.map(reg => (
                                            <div key={reg.country} className="border rounded bg-white p-2 space-y-2">
                                                <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground" /><span className="font-bold text-xs">{reg.country}</span><div className="ml-auto flex items-center gap-1.5"><Label className="text-[10px] text-muted-foreground">Available</Label><Switch checked={reg.isAvailable} onCheckedChange={val => updateRegional(v.id, reg.country, { isAvailable: val })} /></div></div>
                                                {/* Inventory is HEALTH PRODUCTS ONLY — D-C14 makes variant_inventory
                                                    (sku, warehouse, stock) a Health-Products table, and the Zoho item is
                                                    auto-paired FROM the UniCommerce SKU, so with no SKU there is nothing to
                                                    pair (erp_mappings.erp_item_id also still has no source — D-C16). An IV
                                                    drip has no SKU, no warehouse and nothing to stock, so showing these to
                                                    a service department demands four fields per country that can never be
                                                    filled — the same shape as the unactivatable-listing bug this section
                                                    was just restored to fix. Services get the price only. */}
                                                <div className={pd ? "grid grid-cols-4 gap-2" : "grid grid-cols-3 gap-2"}>
                                                    {pd && <div className="space-y-0.5"><Label className="text-[10px] text-muted-foreground">SKU <span className="text-destructive">*</span></Label>
                                                        <Select value={reg.sku || "__none__"} onValueChange={val => selectSku(v.id, reg.country, val === "__none__" ? "" : val)}>
                                                            <SelectTrigger className={`h-7 text-xs ${err(!reg.sku)}`}><SelectValue placeholder="Select SKU" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="__none__">— None —</SelectItem>
                                                                {reg.sku && !uniSkus.some(s => s.country === reg.country && s.sku === reg.sku) && <SelectItem value={reg.sku}>{reg.sku} (current)</SelectItem>}
                                                                {uniSkus.filter(s => s.country === reg.country).map(s => <SelectItem key={s.sku} value={s.sku}>{s.name} · {s.sku}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>}
                                                    {pd && (() => {
                                                        // Read-only: the Zoho item id is auto-paired with the SKU by Octa.
                                                        const paired = resolveZohoId(reg.country, reg.sku) || reg.zohoId
                                                        return (
                                                            <div className="space-y-0.5"><Label className="text-[10px] text-muted-foreground">Zoho item (auto-paired via Octa)</Label>
                                                                {paired ? (
                                                                    <Input readOnly disabled className="h-7 bg-muted/50 text-xs" title="Derived from the UniCommerce SKU — not editable" value={paired} />
                                                                ) : (
                                                                    <div className={`flex h-7 items-center rounded-md border px-2 ${err(!reg.zohoId)}`}>
                                                                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Pending Zoho sync</Badge>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })()}
                                                    {/* THREE money facts, not one — product_pricing carries retail_price,
                                                        selling_price (the CHARGED price and source of truth, D-C1) and a
                                                        discount_type/value pair that is stored because display intent is
                                                        NOT derivable: "20% off" vs "AED 50 off" is a decision. The boxes
                                                        are linked, so typing into any of them keeps the others honest —
                                                        that is authoring, not the read-time recomputation D-C1 forbids. */}
                                                    <div className="space-y-0.5">
                                                        <Label className="text-[10px] text-muted-foreground">Retail (was)</Label>
                                                        <Input type="number" className="h-7 text-xs"
                                                            value={reg.retailPrice ?? ""}
                                                            placeholder="—"
                                                            onChange={e => {
                                                                const retailPrice = e.target.value === "" ? undefined : Number(e.target.value)
                                                                const type = reg.discountType ?? "PERCENTAGE"
                                                                // Keep the discount the operator declared; the selling price follows.
                                                                const price = reg.discountValue !== undefined
                                                                    ? sellingFromDiscount(retailPrice, reg.discountValue, type) ?? reg.price
                                                                    : reg.price
                                                                updateRegional(v.id, reg.country, { retailPrice, price })
                                                            }} />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <Label className="text-[10px] text-muted-foreground">Selling <span className="text-destructive">*</span></Label>
                                                        <Input type="number" className={`h-7 text-xs ${err(!reg.price)}`}
                                                            value={reg.price}
                                                            onChange={e => {
                                                                const price = Number(e.target.value)
                                                                const type = reg.discountType ?? "PERCENTAGE"
                                                                updateRegional(v.id, reg.country, {
                                                                    price,
                                                                    discountValue: discountFromPrices(reg.retailPrice, price, type),
                                                                })
                                                            }} />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <Label className="text-[10px] text-muted-foreground">Discount</Label>
                                                            {/* This toggle IS discount_type — it changes what is stored, not just the box. */}
                                                            <div className="flex overflow-hidden rounded border">
                                                                {(["PERCENTAGE", "FIXED"] as const).map(t => (
                                                                    <button key={t} type="button"
                                                                        className={`px-1.5 py-px text-[9px] ${(reg.discountType ?? "PERCENTAGE") === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                                                                        onClick={() => updateRegional(v.id, reg.country, {
                                                                            discountType: t,
                                                                            // Re-express the SAME discount in the new unit — switching how it
                                                                            // is shown must never silently change what is charged.
                                                                            discountValue: discountFromPrices(reg.retailPrice, reg.price, t),
                                                                        })}>
                                                                        {t === "PERCENTAGE" ? "%" : "amt"}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <Input type="number" className="h-7 text-xs"
                                                            value={reg.discountValue ?? ""}
                                                            placeholder={reg.retailPrice ? "—" : "set retail first"}
                                                            disabled={!reg.retailPrice}
                                                            onChange={e => {
                                                                const discountValue = e.target.value === "" ? undefined : Number(e.target.value)
                                                                const type = reg.discountType ?? "PERCENTAGE"
                                                                updateRegional(v.id, reg.country, {
                                                                    discountValue,
                                                                    price: sellingFromDiscount(reg.retailPrice, discountValue, type) ?? reg.price,
                                                                })
                                                            }} />
                                                    </div>
                                                    {pd && <div className="space-y-0.5"><Label className="text-[10px] text-muted-foreground">Warehouse</Label><Input className="h-7 text-xs" value={reg.warehouse ?? ""} onChange={e => updateRegional(v.id, reg.country, { warehouse: e.target.value })} /></div>}
                                                    {pd && <div className="space-y-0.5"><Label className="text-[10px] text-muted-foreground">Warehouse stock</Label><Input type="number" className="h-7 text-xs" value={reg.warehouseStock ?? ""} placeholder="0" onChange={e => updateRegional(v.id, reg.country, { warehouseStock: e.target.value === "" ? undefined : Number(e.target.value) })} /></div>}
                                                </div>
                                                {listing.subscriptionEnabled && (listing.subscriptionFrequencies ?? []).length > 0 && (
                                                    <div className="pt-1"><Label className="text-[10px] text-muted-foreground">Subscription price / cycle</Label>
                                                        <div className="grid grid-cols-4 gap-2 mt-1">
                                                            {(listing.subscriptionFrequencies ?? []).map(freq => {
                                                                const key = SUB_FREQ_PRICE_KEY[freq]
                                                                return <div key={freq} className="space-y-0.5"><Label className="text-[9px] text-muted-foreground capitalize">{freq.replace("_", " ")}</Label><Input type="number" className="h-7 text-xs" value={(reg[key] as number | undefined) ?? ""} onChange={e => updateRegional(v.id, reg.country, { [key]: e.target.value ? Number(e.target.value) : undefined } as Partial<RegionalData>)} /></div>
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <p className="text-[10px] text-muted-foreground">SKU comes from UniCommerce; the Zoho item id is auto-paired via Octa. Service packages need a Zoho ID requested from finance.</p>
                                    </div>

                                                                        )}
{/* Media is authored in ONE place — the Media Gallery section, where each asset
                                        names its variant (or the whole product). This strip only SHOWS this
                                        variant's assets; uploading here again would reopen the two-doors problem. */}
                                    <div className="space-y-2 border p-3 rounded-md bg-muted/5">
                                        <div className="flex items-center justify-between">
                                            <Label className="font-semibold text-xs">Media (this variant)</Label>
                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setActiveSection("media")}>
                                                <ImagePlus className="mr-1 h-3 w-3" /> Manage in Media Gallery
                                            </Button>
                                        </div>
                                        {mediaGallery.filter(a => (a.variantIds ?? []).includes(v.id)).length === 0
                                            ? <p className="text-xs text-muted-foreground italic text-center py-2">No media for this variant — add it in the Media Gallery section.</p>
                                            : <div className="flex flex-wrap gap-2">
                                                {mediaGallery.filter(a => (a.variantIds ?? []).includes(v.id)).map(a => (
                                                    a.url
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        ? <img key={a.assetId} src={a.url} alt={a.altTextEn || "Variant media"} className="h-14 w-14 rounded-md border object-cover" />
                                                        : <div key={a.assetId} className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed"><ImagePlus className="h-4 w-4 text-muted-foreground" /></div>
                                                ))}
                                            </div>}
                                    </div>

                                    {/* Health Products: a variant has NO indexable page of its own.
                                        The PDP is one URL and the variant is a selection on it, so SEO is
                                        authored once on the listing. Collecting it per variant would mean
                                        9 sets of metadata for a 3×3 grid — all competing for one page. */}
                                    {pd ? (
                                        <div className="rounded-md border border-dashed bg-muted/10 p-3">
                                            <p className="text-xs font-medium">SEO is not collected per variant</p>
                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                Variants share one product page — the shopper picks Colour or Size on
                                                the PDP, they do not navigate to a different URL. Title, meta
                                                description and canonical are authored once in{" "}
                                                <button type="button" className="underline"
                                                    onClick={() => setActiveSection("seo")}>SEO &amp; Metadata</button>,
                                                with per-country and per-city overrides in Localised SEO.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 border p-3 rounded-md bg-muted/5"><Label className="font-semibold text-xs">SEO (EN)</Label><Input className="h-8 text-xs" placeholder="SEO Title (EN)" value={v.seoTitleEn ?? ""} onChange={e => updateVariant(v.id, { seoTitleEn: e.target.value })} /><textarea className="w-full h-16 p-2 border rounded text-xs" placeholder="Meta Description (EN)" value={v.seoDescriptionEn ?? ""} onChange={e => updateVariant(v.id, { seoDescriptionEn: e.target.value })} /></div>
                                            <div className="space-y-2 border p-3 rounded-md bg-muted/5" dir="rtl"><Label className="font-semibold text-xs">SEO (AR)</Label><Input className="h-8 text-xs text-right" placeholder="SEO Title (AR)" value={v.seoTitleAr ?? ""} onChange={e => updateVariant(v.id, { seoTitleAr: e.target.value })} /><textarea dir="rtl" className="w-full h-16 p-2 border rounded text-xs text-right" placeholder="Meta Description (AR)" value={v.seoDescriptionAr ?? ""} onChange={e => updateVariant(v.id, { seoDescriptionAr: e.target.value })} /></div>
                                        </div>
                                    )}
                                </CardContent>}
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* ── SUBSCRIPTION & PRICING ── */}
            {!dx && !svc && activeSection === "subscription" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Subscription Configuration</CardTitle><CardDescription>Enable subscriptions &amp; frequencies. Per-country prices are set in Variants &amp; Pricing; quantity discounts are in Multi-buy Tiers.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-md"><div><Label className="font-medium">Enable Subscription</Label><p className="text-xs text-muted-foreground">Shows the subscription toggle on the PDP.</p></div><Switch checked={!!listing.subscriptionEnabled} onCheckedChange={v => update({ subscriptionEnabled: v })} /></div>
                            {listing.subscriptionEnabled && (
                                <>
                                    <div className="flex items-center justify-between p-3 border rounded-md"><div><Label className="font-medium">Auto-Select Subscription</Label></div><Switch checked={!!listing.subscriptionAutoSelected} onCheckedChange={v => update({ subscriptionAutoSelected: v })} /></div>
                                    <div className="space-y-2"><Label className="font-medium">Frequencies & Discounts</Label>
                                        {SUB_FREQS.map(freq => {
                                            const on = (listing.subscriptionFrequencies ?? []).includes(freq)
                                            return <div key={freq} className="flex items-center gap-3 p-3 border rounded-md"><Switch checked={on} onCheckedChange={c => update({ subscriptionFrequencies: c ? [...(listing.subscriptionFrequencies ?? []), freq] : (listing.subscriptionFrequencies ?? []).filter(f => f !== freq) })} /><Label className="w-28 capitalize">{freq.replace("_", " ")}</Label><div className="flex items-center gap-2"><Label className="text-xs text-muted-foreground">Discount %</Label><Input type="number" className="h-7 w-20 text-xs" disabled={!on} value={listing.subscriptionDiscountPct?.[freq] ?? ""} onChange={e => update({ subscriptionDiscountPct: { ...listing.subscriptionDiscountPct, [freq]: Number(e.target.value) } })} /></div></div>
                                        })}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Savings Label (EN)</Label><Input value={listing.subscriptionSavingsLabelEn ?? ""} onChange={e => update({ subscriptionSavingsLabelEn: e.target.value })} /></div>
                                        <div className="space-y-2"><Label>ملصق التوفير <span dir="ltr" className="font-normal text-muted-foreground">(Savings Label)</span></Label><Input dir="rtl" className="text-right" value={listing.subscriptionSavingsLabelAr ?? ""} onChange={e => update({ subscriptionSavingsLabelAr: e.target.value })} /></div>
                                        <div className="space-y-2"><Label>Terms Copy (EN)</Label><Input value={listing.subscriptionTermsEn ?? ""} onChange={e => update({ subscriptionTermsEn: e.target.value })} /></div>
                                        <div className="space-y-2"><Label>نص الشروط <span dir="ltr" className="font-normal text-muted-foreground">(Terms Copy)</span></Label><Input dir="rtl" className="text-right" value={listing.subscriptionTermsAr ?? ""} onChange={e => update({ subscriptionTermsAr: e.target.value })} /></div>
                                        <div className="space-y-2"><Label>Min. Commitment Cycles</Label><Input type="number" value={listing.subscriptionMinCycles ?? 1} onChange={e => update({ subscriptionMinCycles: Number(e.target.value) })} /></div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── ADD-ONS & INSTRUCTIONS ── */}
            {/* ── COMPARISON (Health Products) ── */}
            {activeSection === "comparison" && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>Comparison</CardTitle><CardDescription>Valeo vs. others feature comparison table.</CardDescription></div>
                        <Button onClick={addComparisonRow} variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Row</Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Valeo Column Title (EN)</Label><Input value={comparison.valeoTitleEn ?? ""} onChange={e => updateComparison({ valeoTitleEn: e.target.value })} placeholder="e.g. Valeo" /></div>
                            <div className="space-y-2"><Label>عنوان عمود Valeo <span dir="ltr" className="font-normal text-muted-foreground">(Valeo Column Title)</span></Label><Input dir="rtl" className="text-right" value={comparison.valeoTitleAr ?? ""} onChange={e => updateComparison({ valeoTitleAr: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Others Column Title (EN)</Label><Input value={comparison.otherTitleEn ?? ""} onChange={e => updateComparison({ otherTitleEn: e.target.value })} placeholder="e.g. Others" /></div>
                            <div className="space-y-2"><Label>عنوان عمود الآخرين <span dir="ltr" className="font-normal text-muted-foreground">(Others Column Title)</span></Label><Input dir="rtl" className="text-right" value={comparison.otherTitleAr ?? ""} onChange={e => updateComparison({ otherTitleAr: e.target.value })} /></div>
                        </div>
                        <Separator />
                        {comparison.rows.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">No rows.</div>
                        ) : (
                            <Table>
                                <TableHeader><TableRow className="bg-muted/30"><TableHead className="h-8 text-xs">Feature (EN)</TableHead><TableHead className="h-8 text-xs">Feature (AR)</TableHead><TableHead className="h-8 text-xs w-20 text-center">Valeo</TableHead><TableHead className="h-8 text-xs w-20 text-center">Other</TableHead><TableHead className="h-8 text-xs text-right">Remove</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {comparison.rows.map((r, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="py-1.5"><Input className="h-7 text-xs" value={r.textEn} onChange={e => updateComparisonRow(i, { textEn: e.target.value })} /></TableCell>
                                            <TableCell className="py-1.5"><Input dir="rtl" className="h-7 text-xs text-right" value={r.textAr ?? ""} onChange={e => updateComparisonRow(i, { textAr: e.target.value })} /></TableCell>
                                            <TableCell className="py-1.5 text-center"><Switch checked={r.valeo} onCheckedChange={v => updateComparisonRow(i, { valeo: v })} /></TableCell>
                                            <TableCell className="py-1.5 text-center"><Switch checked={r.other} onCheckedChange={v => updateComparisonRow(i, { other: v })} /></TableCell>
                                            <TableCell className="py-1.5 text-right"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeComparisonRow(i)}><Trash className="h-3 w-3" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── STATS (Health Products) ── */}
            {activeSection === "stats" && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>Stats</CardTitle><CardDescription>Headline statistics band on the PDP.</CardDescription></div>
                        <Button onClick={addStatItem} variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Stat</Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>Section Title (EN)</Label><Input value={stats.titleEn ?? ""} onChange={e => updateStats({ titleEn: e.target.value })} placeholder="e.g. Backed by results" /></div>
                        <div className="space-y-2"><Label>عنوان القسم <span dir="ltr" className="font-normal text-muted-foreground">(Section Title)</span></Label><Input dir="rtl" className="text-right" value={stats.titleAr ?? ""} onChange={e => updateStats({ titleAr: e.target.value })} /></div>
                        <Separator />
                        {stats.items.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">No stats.</div>
                        ) : stats.items.map((s, i) => (
                            <div key={i} className="grid grid-cols-4 gap-2 items-end p-3 border rounded-md bg-muted/5">
                                <div className="space-y-1"><Label className="text-xs">Value</Label><Input className="h-8 text-xs" value={s.value} onChange={e => updateStatItem(i, { value: e.target.value })} placeholder="e.g. 94%" /></div>
                                <div className="space-y-1"><Label className="text-xs">Label (EN)</Label><Input className="h-8 text-xs" value={s.labelEn} onChange={e => updateStatItem(i, { labelEn: e.target.value })} /></div>
                                <div className="space-y-1"><Label className="text-xs">Label (AR)</Label><Input dir="rtl" className="h-8 text-xs text-right" value={s.labelAr ?? ""} onChange={e => updateStatItem(i, { labelAr: e.target.value })} /></div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive justify-self-end" onClick={() => removeStatItem(i)}><Trash className="h-3.5 w-3.5" /></Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── CLINICIAN REVIEWS (Health Products) ── */}
            {activeSection === "clinicianReviews" && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Clinician Reviews</CardTitle><CardDescription>Expert / clinician endorsements shown on the PDP.</CardDescription></div>
                        <Button onClick={addClinician} variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Clinician</Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {clinicianReviews.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">No clinician reviews.</div>
                        ) : clinicianReviews.map((c, idx) => (
                            <div key={c.id} className="border rounded-lg p-4 space-y-3 bg-muted/5">
                                <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{c.name || `Clinician #${idx + 1}`}</span><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeClinician(c.id)}><Trash className="h-3 w-3" /></Button></div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1"><Label className="text-xs">Name</Label><Input className="h-8 text-xs" value={c.name} onChange={e => updateClinician(c.id, { name: e.target.value })} /></div>
                                    <div className="space-y-1"><Label className="text-xs">Designation</Label><Input className="h-8 text-xs" value={c.designation} onChange={e => updateClinician(c.id, { designation: e.target.value })} placeholder="e.g. Endocrinologist" /></div>
                                    <div className="space-y-1"><Label className="text-xs">Experience (years)</Label><Input type="number" className="h-8 text-xs" value={c.experienceYears ?? ""} onChange={e => updateClinician(c.id, { experienceYears: e.target.value ? Number(e.target.value) : undefined })} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><Label className="text-xs">Review (EN)</Label><textarea className="w-full h-20 p-2 border rounded-md text-sm" value={c.reviewEn} onChange={e => updateClinician(c.id, { reviewEn: e.target.value })} /></div>
                                    <div className="space-y-1"><Label className="text-xs">Review (AR)</Label><textarea dir="rtl" className="w-full h-20 p-2 border rounded-md text-sm text-right" value={c.reviewAr ?? ""} onChange={e => updateClinician(c.id, { reviewAr: e.target.value })} /></div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Photo</Label>
                                    <ImageField preset="square" section="reviews" value={c.imageUrl} onChange={url => updateClinician(c.id, { imageUrl: url })} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── FREQUENTLY BOUGHT (Health Products) ── */}
            {activeSection === "frequentlyBought" && (
                <Card>
                    <CardHeader><CardTitle>Frequently Bought Together</CardTitle><CardDescription>Bundled listings with an optional coupon discount.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Coupon Discount</Label><Input type="number" value={frequentlyBought.couponDiscount ?? ""} onChange={e => updateFrequentlyBought({ couponDiscount: e.target.value ? Number(e.target.value) : undefined })} /></div>
                            <div className="space-y-2">
                                <Label>Discount Type</Label>
                                <Select value={frequentlyBought.discountType ?? "percentage"} onValueChange={(v: any) => updateFrequentlyBought({ discountType: v as "percentage" | "fixed" })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Bundled Listings</Label>
                            <ListingMultiSelect all={listings} selected={frequentlyBought.listingIds} onChange={ids => updateFrequentlyBought({ listingIds: ids })} currentId={listing.id} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── RECOMMENDATIONS / CUSTOMERS ALSO VIEWED (Health Products) ── */}
            {activeSection === "recommendations" && (
                <Card>
                    <CardHeader><CardTitle>Customers Also Viewed</CardTitle><CardDescription>Recommended listings shown on the PDP.</CardDescription></CardHeader>
                    <CardContent>
                        <ListingMultiSelect all={listings} selected={recommendationIds} onChange={ids => update({ recommendationIds: ids })} currentId={listing.id} />
                    </CardContent>
                </Card>
            )}

            {/* ── REVIEWS ── */}
            {activeSection === "reviews" && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Customer Reviews</CardTitle></div><Button onClick={addReview} variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Review</Button></CardHeader>
                    <CardContent className="space-y-4">
                        {reviews.length === 0 ? <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">No reviews.</div> : reviews.map((review, idx) => (
                            <div key={review.id} className="border rounded-lg p-4 space-y-3 bg-muted/5">
                                <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Review #{idx + 1}</span><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeReview(review.id)}><Trash className="h-3 w-3" /></Button></div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1"><Label className="text-xs">Reviewer</Label><Input className="h-8" value={review.reviewerName} onChange={e => updateReview(review.id, { reviewerName: e.target.value })} /></div>
                                    <div className="space-y-1"><Label className="text-xs">Rating</Label>
                                        <Select value={String(review.rating)} onValueChange={v => updateReview(review.id, { rating: Number(v) as 1 | 2 | 3 | 4 | 5 })}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>{[5, 4, 3, 2, 1].map(n => <SelectItem key={n} value={String(n)}>{"★".repeat(n)} ({n})</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between p-2.5 border rounded-md bg-white"><Label className="text-xs font-medium">Verified</Label><Switch checked={review.isVerified} onCheckedChange={v => updateReview(review.id, { isVerified: v })} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><Label className="text-xs">Review Text (EN)</Label><textarea className="w-full h-20 p-2 border rounded-md text-sm" value={review.reviewTextEn} onChange={e => updateReview(review.id, { reviewTextEn: e.target.value })} /></div>
                                    <div className="space-y-1"><Label className="text-xs">Review Text (AR)</Label><textarea dir="rtl" className="w-full h-20 p-2 border rounded-md text-sm text-right" value={review.reviewTextAr ?? ""} onChange={e => updateReview(review.id, { reviewTextAr: e.target.value })} /></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── INFLUENCER VIDEOS ── */}
            {activeSection === "influencers" && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Influencer Videos</CardTitle></div><Button onClick={addInfluencer} variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add</Button></CardHeader>
                    <CardContent className="space-y-4">
                        {influencerVideos.length === 0 ? <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">No influencer videos.</div> : influencerVideos.map((vid, idx) => (
                            <div key={vid.id} className="border rounded-lg p-4 space-y-3 bg-muted/5">
                                <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{vid.handle || `Influencer #${idx + 1}`}</span><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeInfluencer(vid.id)}><Trash className="h-3 w-3" /></Button></div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1"><Label className="text-xs">Handle</Label><Input className="h-8 text-xs" value={vid.handle} onChange={e => updateInfluencer(vid.id, { handle: e.target.value })} placeholder="@username" /></div>
                                    <div className="space-y-1"><Label className="text-xs">Platform</Label>
                                        <Select value={vid.platform} onValueChange={v => updateInfluencer(vid.id, { platform: v as InfluencerVideo["platform"] })}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="tiktok">TikTok</SelectItem><SelectItem value="instagram">Instagram</SelectItem><SelectItem value="youtube">YouTube</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1"><Label className="text-xs">Caption (EN)</Label><Input className="h-8 text-xs" value={vid.captionEn ?? ""} onChange={e => updateInfluencer(vid.id, { captionEn: e.target.value })} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <ImageField
                                        preset="thumbnail"
                                        label="Thumbnail"
                                        section="influencer"
                                        value={vid.thumbnailUrl}
                                        onChange={url => updateInfluencer(vid.id, { thumbnailUrl: url })}
                                    />
                                    <ImageField
                                        preset="portrait"
                                        label="Video"
                                        mediaKind="video"
                                        section="influencer"
                                        value={vid.videoUrl}
                                        onChange={url => updateInfluencer(vid.id, { videoUrl: url })}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── SUPERIORITY ── */}
            {activeSection === "superiority" && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Why This Is Superior</CardTitle><CardDescription>Headline, optional media, up to 8 feature points.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Headline (EN)</Label><Input value={superiority.headlineEn} onChange={e => updateSuperiority({ headlineEn: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Headline (AR)</Label><Input dir="rtl" className="text-right" value={superiority.headlineAr} onChange={e => updateSuperiority({ headlineAr: e.target.value })} /></div>
                            {/* Media feeds the API's why-superior block (media.url). It was in
                                the data model with no way to author it. */}
                            <div className="space-y-2">
                                <Label>Media type</Label>
                                <Select value={superiority.mediaType ?? "none"} onValueChange={(v: any) => updateSuperiority({ mediaType: v === "none" ? null : v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No media</SelectItem>
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"><Label>Media URL</Label><Input value={superiority.mediaUrl ?? ""} onChange={e => updateSuperiority({ mediaUrl: e.target.value })} placeholder="https://…" /></div>
                            {superiority.mediaType === "video" && (
                                <div className="space-y-2"><Label>Poster / thumbnail URL</Label><Input value={superiority.thumbnailUrl ?? ""} onChange={e => updateSuperiority({ thumbnailUrl: e.target.value })} placeholder="https://… (a video with no poster renders blank)" /></div>
                            )}
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label className="font-medium">Feature Points</Label>
                            <Button onClick={addSuperiorityPoint} variant="outline" size="sm" disabled={superiority.points.length >= 8}><Plus className="mr-2 h-4 w-4" /> Add Point</Button>
                        </div>
                        {superiority.points.length === 0 ? <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">No points.</div> : superiority.points.map((point, i) => (
                            <div key={i} className="border rounded-lg p-4 space-y-3 bg-muted/5">
                                <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Point #{i + 1}</span><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSuperiorityPoint(i)}><Trash className="h-3 w-3" /></Button></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input className="h-8" placeholder="Title (EN)" value={point.titleEn} onChange={e => updateSuperiorityPoint(i, { titleEn: e.target.value })} />
                                    <Input dir="rtl" className="h-8 text-right" placeholder="Title (AR)" value={point.titleAr} onChange={e => updateSuperiorityPoint(i, { titleAr: e.target.value })} />
                                    <textarea className="w-full h-16 p-2 border rounded-md text-sm" placeholder="Description (EN)" value={point.descriptionEn} onChange={e => updateSuperiorityPoint(i, { descriptionEn: e.target.value })} />
                                    <textarea dir="rtl" className="w-full h-16 p-2 border rounded-md text-sm text-right" placeholder="Description (AR)" value={point.descriptionAr} onChange={e => updateSuperiorityPoint(i, { descriptionAr: e.target.value })} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── PROGRAMS · schedule and the policies ops must follow ── */}
            {isConsultation && activeSection === "consultation" && (
                <ConsultationFields listing={listing} team={healthTeam}
                    onChange={patchConsultation}
                    onPatchListing={update}
                    consultListings={consultFollowUps}
                    onSetVariantOptions={opts => update({ variantOptions: opts })}
                    onGoToVariants={() => setActiveSection("variants")} />
            )}

            {isProgram && activeSection === "program" && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Program Schedule &amp; Policy</h3>
                        <p className="text-sm text-muted-foreground">
                            The template and its rules. Pausing or refunding one customer&apos;s enrolment is an ops
                            action on their order — this screen decides whether ops may, and on what terms.
                        </p>
                    </div>
                    <ProgramBuilder config={programConfig} onChange={patchProgram}
                        compositionId={listing.compositionId}
                        countries={countryConfig.map(c => c.country)} />
                </div>
            )}

            {/* ── TREATMENTS · plans, dosage & administration ── */}
            {/* Treatment Plans & Dosage REMOVED 2026-08-28 (user's call). Its four jobs
                dispersed to where the schema keeps them:
                  · dosage options  -> real variant_axes (DOSAGE / VOLUME) under D-C21, edited in
                                       Variants & Pricing like every other family's axes
                  · treatment plans -> pack variants + variant_session_packs (D-C59); the Session
                                       Packs section owns them, and `sessions >= 2` is a CHECK
                  · administration   -> DERIVED from the sub-department (flowForSubDepartment), never
                                       an operator choice: a vaccine cannot be given bags
                  · session duration -> deleted. One of the seven package_config coach columns with
                                       ZERO data behind it (COACH_DUMP_LIST.md); its real home is
                                       service_delivery_models (D-C62 §6)
                `slowDripAvailable` / `slowDripSurcharge` / `dripSpeed` are PARKED, not ported:
                they appear nowhere in the pdp record and no column in the legacy IV dump carries
                drip speed, so they are frontend inventions of the class D-C51 deleted with
                device_config. If ops confirms a slow option is sold, it becomes a SPEED axis (the
                D-C9 precedent, which made is_fast_track the TURNAROUND axis) and the surcharge dies
                — each speed gets its own stored price row rather than arithmetic at read (D-C1). */}

            {/* ── DIAGNOSTICS · package type & collection ── */}
            {dx && activeSection === "dxPackage" && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Package Type &amp; Collection</h3>
                        <p className="text-sm text-muted-foreground">
                            Diagnostics is created two ways. A <strong>Mini Package</strong> is a single test sold on
                            its own or bolted onto a panel; a <strong>Proper Package</strong> is a full panel whose
                            kind — Blood, Non-Blood Sample or Genomic — comes from its sub-department.
                        </p>
                    </div>
                    {/* Diagnostics-specific readiness, kept out of the generic activation
                        gate so no other department inherits these requirements. */}
                    {(() => {
                        const gaps = diagnosticsGaps(listing)
                        return gaps.length === 0 ? (
                            <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs text-emerald-800">
                                Diagnostics setup is complete — biomarkers, slots and sample type are all mapped.
                            </div>
                        ) : (
                            <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3">
                                <p className="text-xs font-semibold text-amber-900">
                                    {gaps.length} thing{gaps.length === 1 ? "" : "s"} still needed for this package
                                </p>
                                <ul className="mt-1.5 space-y-0.5">
                                    {gaps.map(g => (
                                        <li key={g} className="text-[11px] text-amber-900">· {g}</li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })()}
                    <DiagnosticsPackageFields
                        config={dxConfig}
                        onChange={patchDx}
                        subDepartmentName={subDepartments.find(sd => sd.id === listing.subDepartmentId)?.nameEn}
                    />
                </div>
            )}

            {/* ── DIAGNOSTICS · biomarkers per country ── */}
            {dx && activeSection === "dxBiomarkers" && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Biomarkers — per country</h3>
                        <p className="text-sm text-muted-foreground">
                            Mapped against the countries this package is sold in, because the same package genuinely
                            runs different markers in different markets.
                        </p>
                    </div>
                    <DiagnosticsBiomarkerMap
                        config={dxConfig}
                        onChange={patchDx}
                        countries={countryConfig.map(c => c.country)}
                    />
                </div>
            )}

            {/* ── DIAGNOSTICS · nurse slots & city pricing ── */}
            {dx && activeSection === "dxSlots" && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Nurse Slots &amp; City Pricing</h3>
                        <p className="text-sm text-muted-foreground">
                            Slot groups, lead time, price and the ops SLAs — set once per country, overridden only in
                            the cities that differ.
                        </p>
                    </div>
                    <DiagnosticsSlots
                        config={dxConfig}
                        onChange={patchDx}
                        countries={countryConfig.map(c => c.country)}
                    />
                </div>
            )}

            {/* ── SEO ── */}
            {activeSection === "seo" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>URL Slugs (master)</CardTitle><CardDescription>The fallback used by any market with no override below. Variant-level slugs live in Variants &amp; Pricing.</CardDescription></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Slug (EN)</Label><Input value={listing.slugEn ?? ""} onChange={e => update({ slugEn: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Slug (AR)</Label><Input dir="rtl" className="text-right" value={listing.slugAr ?? ""} onChange={e => update({ slugAr: e.target.value })} /></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>SEO Title & Description</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>SEO Title (EN)</Label><Input value={listing.seoTitleEn ?? ""} onChange={e => update({ seoTitleEn: e.target.value })} maxLength={70} /></div>
                            <div className="space-y-2"><Label>SEO Title (AR)</Label><Input dir="rtl" className="text-right" value={listing.seoTitleAr ?? ""} onChange={e => update({ seoTitleAr: e.target.value })} maxLength={70} /></div>
                            <div className="space-y-2"><Label>Meta Description (EN)</Label><textarea className="w-full h-20 p-3 border rounded-md text-sm" value={listing.seoDescriptionEn ?? ""} onChange={e => update({ seoDescriptionEn: e.target.value })} maxLength={160} /></div>
                            <div className="space-y-2"><Label>Meta Description (AR)</Label><textarea dir="rtl" className="w-full h-20 p-3 border rounded-md text-sm text-right" value={listing.seoDescriptionAr ?? ""} onChange={e => update({ seoDescriptionAr: e.target.value })} maxLength={160} /></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Advanced SEO</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 max-w-md"><Label>Canonical URL</Label><Input value={listing.seoCanonicalUrl ?? ""} onChange={e => update({ seoCanonicalUrl: e.target.value })} placeholder="https://feelvaleo.com/…" /></div>
                            <ImageField
                                preset="og"
                                label="OG / Social Share Image"
                                section="gallery"
                                value={listing.ogImageUrl}
                                onChange={url => update({ ogImageUrl: url })}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Localised SEO — country &amp; city</CardTitle>
                            <CardDescription>
                                Slug, meta, H1 and indexability are stored per country × language (and per city for city pages),
                                because search intent and availability differ by market.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SeoLocalisation
                                locales={listing.seoLocales ?? []}
                                countrySettings={listing.seoCountrySettings ?? []}
                                cities={cities}
                                master={{
                                    slugEn: listing.slugEn, slugAr: listing.slugAr,
                                    titleEn: listing.seoTitleEn, titleAr: listing.seoTitleAr,
                                    descEn: listing.seoDescriptionEn, descAr: listing.seoDescriptionAr,
                                    canonical: listing.seoCanonicalUrl,
                                }}
                                availableCountries={(listing.countryConfig ?? []).map(c => c.country)}
                                onChange={(seoLocales, seoCountrySettings) => update({ seoLocales, seoCountrySettings })}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── DISPLAY & ADD-ON SETTINGS ── */}
            {activeSection === "flags" && (
                <Card>
                    <CardHeader><CardTitle>Display &amp; Add-on Settings</CardTitle><CardDescription>Per-listing display behaviour and the doctor-consultation add-on.</CardDescription></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                            <div><Label className="text-sm font-medium">Doctor Consultation Add-on</Label><p className="text-xs text-muted-foreground">Offer a paid doctor consultation alongside this listing.</p></div>
                            <Switch checked={!!listing.consultationAddonEnabled} onCheckedChange={v => update({ consultationAddonEnabled: v })} />
                        </div>
                        {listing.consultationAddonEnabled && (
                            <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                                <div className="space-y-2">
                                    <Label>Linked Consultation</Label>
                                    <Select value={listing.consultationAddonListingId ?? "none"} onValueChange={(v: any) => update({ consultationAddonListingId: v === "none" ? undefined : v })}>
                                        <SelectTrigger className="max-w-md"><SelectValue placeholder="Select the consultation listing to offer" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">— None selected —</SelectItem>
                                            {consultationListings.length === 0 ? (
                                                <div className="px-2 py-1.5 text-xs text-muted-foreground">No consultation listings found.</div>
                                            ) : consultationListings.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.displayNameEn || c.internalName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-muted-foreground">The doctor-consultation listing this product links to as an add-on.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Consultation Price (AED)</Label>
                                    <Input type="number" className="max-w-[200px]" value={listing.consultationAddonPrice ?? 0} onChange={e => update({ consultationAddonPrice: Number(e.target.value) })} />
                                </div>
                            </div>
                        )}
                        {([
                            ["hideVariantsOnConsultationLink", "Hide Variants on Consultation Link"],
                            ["forceVariantDisplay", "Force Variant Display"],
                            ["variantVisibilityUrlOverrideEnabled", "Allow URL Param to Control Variant Visibility"],
                            ["showCompareAtPrice", "Show Compare-at Price"],
                            ["showStockIndicator", "Show Stock Indicator"],
                            ["showDeliveryEstimate", "Show Delivery Estimate"],
                            ["consultationLinkSuppressesAddons", "Consultation Link Suppresses All Add-ons"],
                        ] as const).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between p-3 border rounded-md"><Label className="text-sm font-medium">{label}</Label><Switch checked={!!listing[key]} onCheckedChange={v => update({ [key]: v })} /></div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── FAQ ── */}
            {activeSection === "faq" && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Master FAQ</CardTitle><CardDescription>Bilingual Q&A accordion. Max 20.</CardDescription></div><Button onClick={addFaq} variant="outline" size="sm" disabled={faq.length >= 20}><Plus className="mr-2 h-4 w-4" /> Add Q&A</Button></CardHeader>
                    <CardContent className="space-y-4">
                        {faq.length === 0 ? <div className="text-center py-8 text-muted-foreground italic text-sm">No FAQs.</div> : faq.map((item, i) => (
                            <div key={i} className="border p-4 rounded-lg space-y-3 bg-muted/5">
                                <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">FAQ #{i + 1}</span><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFaq(i)}><Trash className="h-3 w-3" /></Button></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input className="h-8" placeholder="Question (EN)" value={item.questionEn} onChange={e => updateFaq(i, { questionEn: e.target.value })} />
                                    <Input dir="rtl" className="h-8 text-right" placeholder="Question (AR)" value={item.questionAr} onChange={e => updateFaq(i, { questionAr: e.target.value })} />
                                    <RichText placeholder="Answer (EN)" value={item.answerEn} onChange={html => updateFaq(i, { answerEn: html })} />
                                    <RichText dir="rtl" placeholder="Answer (AR)" value={item.answerAr} onChange={html => updateFaq(i, { answerAr: html })} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── PARTNER ACCESS ── */}
            {activeSection === "partners" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Partner Access</CardTitle>
                        <CardDescription>Grant B2B / corporate / external partners Owner or Viewer access to this listing.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Legacy duplicated a listing per corporate client; this offers the fix. */}
                        <B2bPartnerRecovery listing={listing} onChange={update} />
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <div>
                                <Label className="text-sm font-medium">Partner-exclusive listing</Label>
                                <p className="text-xs text-muted-foreground">Hide from Valeo's master search — only the assigned partner(s) can surface it.</p>
                            </div>
                            <Switch checked={!!listing.partnerExclusive} onCheckedChange={v => update({ partnerExclusive: v })} />
                        </div>
                        <PartnerAccessSection
                            partners={partners}
                            value={listing.partnerAccess ?? []}
                            onChange={v => update({ partnerAccess: v })}
                            enableOverrides
                            cities={cities}
                            variants={variants.map(v => ({ id: v.id, label: v.variantLabelEn || v.nameEn || v.id }))}
                        />
                    </CardContent>
                </Card>
            )}


            {/* Always available, whichever section is open: who changed what, including
                a variant price three levels down. */}
            {!isNew && <EntityHistory entityType="listing" entityId={listing.id} />}
        </ListingEditorShell>
        </MediaUploadContext.Provider>
        </>
    )
}

