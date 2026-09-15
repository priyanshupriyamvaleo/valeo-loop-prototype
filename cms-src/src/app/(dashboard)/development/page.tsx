"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Database, Boxes, Tags, Type as TypeIcon, Sparkles, ShieldCheck, Link2, FileText,
} from "lucide-react"

type Status = "implemented" | "planned" | "spec"
const STATUS: Record<Status, { label: string; className: string }> = {
    implemented: { label: "Implemented", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    planned: { label: "Planned", className: "bg-amber-100 text-amber-700 border-amber-200" },
    spec: { label: "Spec", className: "bg-blue-100 text-blue-700 border-blue-200" },
}

function StatusBadge({ status }: { status: Status }) {
    return <Badge variant="outline" className={`text-[10px] ${STATUS[status].className}`}>{STATUS[status].label}</Badge>
}

function Item({ title, status, children }: { title: string; status: Status; children: React.ReactNode }) {
    return (
        <div className="rounded-md border p-3">
            <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">{title}</h4>
                <StatusBadge status={status} />
            </div>
            <div className="mt-1.5 space-y-1.5 text-sm text-muted-foreground">{children}</div>
        </div>
    )
}

const SECTIONS = [
    { id: "integrations", label: "Integrations", icon: Database },
    { id: "content", label: "Content standards", icon: TypeIcon },
    { id: "audit", label: "AI go-live audit", icon: Sparkles },
    { id: "variants", label: "Variant options", icon: Boxes },
    { id: "tags", label: "Tags", icon: Tags },
    { id: "states", label: "Listing states", icon: ShieldCheck },
    { id: "conventions", label: "Platform conventions", icon: ShieldCheck },
]

export default function DevelopmentDocsPage() {
    return (
        <div className="space-y-8 pb-16">
            <div className="max-w-3xl space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Development Documentation</h2>
                <p className="text-sm text-muted-foreground">
                    The engineering reference for the catalogue CMS — integrations, content standards, and the
                    guardrails a page must clear before it goes live. <span className="font-medium">Implemented</span> items
                    are live in this prototype; <span className="font-medium">Planned / Spec</span> items are the contract for the real build.
                </p>
                <nav className="flex flex-wrap gap-2 pt-1">
                    {SECTIONS.map(s => (
                        <a key={s.id} href={`#${s.id}`} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
                            <s.icon className="h-3.5 w-3.5" /> {s.label}
                        </a>
                    ))}
                </nav>
            </div>

            {/* ── Integrations ── */}
            <section id="integrations" className="scroll-mt-4 space-y-3">
                <div className="flex items-center gap-2"><Database className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Integrations</h3></div>
                <Card>
                    <CardHeader><CardTitle className="text-base">External identifiers must be selected, not typed</CardTitle><CardDescription>Free-text IDs cause mismatches. Both IDs below become dropdowns fed by the source system.</CardDescription></CardHeader>
                    <CardContent className="space-y-3">
                        <Item title="Zoho ID — derived from the SKU, never typed or picked" status="implemented">
                            <p><strong>Live in the prototype (mock feed):</strong> <code className="rounded bg-muted px-1 text-xs">variant.regionalData[].zohoId</code> is <strong>read-only and auto-paired</strong> with the selected UniCommerce SKU — it is neither free text nor a second dropdown, because the UniCommerce SKU <em>is</em> the Zoho SKU (see &ldquo;SKU pairing&rdquo; below).</p>
                            <p>Which <strong>Zoho Book</strong> the item belongs to follows from the routing rules (country × product type × clinical class) configured on the sub-department, not from an operator choice. The prototype is fed by a mock items source; the real build swaps in the live Zoho API.</p>
                            <p className="text-xs">Flow: SKU (UniCommerce) → Octa pairs it into the country&apos;s Zoho Book → derived <code className="rounded bg-muted px-1 text-xs">zohoId</code>, or <strong>Pending Zoho sync</strong>. Maps to <code className="rounded bg-muted px-1 text-xs">erp_mappings.erp_item_id</code> / <code className="rounded bg-muted px-1 text-xs">erp_account_id</code>.</p>
                        </Item>
                        <Item title="SKU / Item code — dropdown from Unicommerce" status="implemented">
                            <p><strong>Live in the prototype (mock feed):</strong> <code className="rounded bg-muted px-1 text-xs">product_variant_identifiers.sku</code> / <code className="rounded bg-muted px-1 text-xs">item_code</code> are now <strong>selected from a Unicommerce dropdown</strong>, not typed.</p>
                            <p className="text-xs">Flow: fetch SKUs from Unicommerce (per country where applicable) → <code className="rounded bg-muted px-1 text-xs">Select</code> with search. Store the chosen SKU + item code on the variant identifier row. The prototype uses a mock SKU list; the real build wires the live Unicommerce feed.</p>
                        </Item>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Zoho Books — entity &amp; routing rules</CardTitle>
                        <CardDescription>
                            Valeo runs 7 Zoho Books entities. Which one invoices an order is decided by
                            <strong> country × product type × clinical class</strong> — configured per sub-department, per country, in the CMS.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Item title="The 6 invoicing entities (+ 2 non-integrated books)" status="spec">
                            <ul className="ml-4 list-disc space-y-1">
                                <li><strong>DMCC / KUA (UAE)</strong> — the UAE default for everything.</li>
                                <li><strong>Shifa (UAE)</strong> — UAE <strong>GLP-1 / weight-loss</strong> supplements &amp; medicine <em>only</em>.</li>
                                <li><strong>Value Health Information Technology (KSA)</strong> — KSA <strong>service packages</strong>.</li>
                                <li><strong>Saha (KSA)</strong> — KSA <strong>supplements</strong> (trading account).</li>
                                <li><strong>Integrative (Kuwait)</strong> — <strong>all</strong> Kuwait business.</li>
                                <li><strong>No invoicing</strong> — <strong>Qatar creates no invoices at all</strong>.</li>
                            </ul>
                            <p className="text-xs">Two further books exist but have <strong>no integrations</strong> and are out of scope for the CMS: a <strong>holding company</strong> book and an <strong>India cost-centre</strong> book.</p>
                        </Item>
                        <Item title="Routing table — country × product type × clinical class" status="spec">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[34rem] text-xs">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="py-1 pr-3 font-medium">Country</th>
                                            <th className="py-1 pr-3 font-medium">Service packages</th>
                                            <th className="py-1 pr-3 font-medium">Supplements</th>
                                            <th className="py-1 font-medium">Medicine</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&>tr]:border-b [&>tr:last-child]:border-0">
                                        <tr><td className="py-1 pr-3 font-medium text-foreground">UAE</td><td className="py-1 pr-3">DMCC / KUA</td><td className="py-1 pr-3">DMCC / KUA · <strong>GLP-1 → Shifa</strong></td><td className="py-1">DMCC / KUA · <strong>GLP-1 → Shifa</strong></td></tr>
                                        <tr><td className="py-1 pr-3 font-medium text-foreground">KSA</td><td className="py-1 pr-3"><strong>Value Health IT</strong></td><td className="py-1 pr-3"><strong>Saha</strong></td><td className="py-1"><strong>Saha</strong></td></tr>
                                        <tr><td className="py-1 pr-3 font-medium text-foreground">Kuwait</td><td className="py-1 pr-3" colSpan={3}><strong>Integrative</strong> — all Kuwait, every product type</td></tr>
                                        <tr><td className="py-1 pr-3 font-medium text-foreground">Qatar</td><td className="py-1 pr-3" colSpan={3}><strong>None</strong> — no invoices are created</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs">The clinical class comes from <code className="rounded bg-muted px-1 text-xs">product_config.medicine_type</code> (GLP-1, peptide, hair-loss, antibiotic, vitamin, general Rx). A class that deviates from its country default is modelled as a <strong>clinical-class override</strong> on the sub-department&apos;s country row.</p>
                        </Item>
                        <Item title="CMS mapping UI — Zoho book, invoicing flag, VAT mode &amp; overrides" status="implemented">
                            <p><strong>Live in the prototype:</strong> each sub-department&apos;s per-country row on <code className="rounded bg-muted px-1 text-xs">/catalogue/departments</code> carries <strong>Zoho Book</strong>, <strong>Invoicing</strong> on/off, <strong>VAT %</strong> + <strong>VAT mode</strong>, <strong>Zoho Org ID</strong>, payment methods, city-level VAT and <strong>clinical-class overrides</strong>.</p>
                            <p className="text-xs">Types: <code className="rounded bg-muted px-1 text-xs">ZohoBook</code> + <code className="rounded bg-muted px-1 text-xs">SubDepartmentCountryConfig</code> in <code className="rounded bg-muted px-1 text-xs">src/types</code>; entity list in <code className="rounded bg-muted px-1 text-xs">src/lib/catalogue.ts</code> (<code className="rounded bg-muted px-1 text-xs">ZOHO_BOOKS</code>). Maps to <code className="rounded bg-muted px-1 text-xs">erp_mappings.erp_org_id</code> / <code className="rounded bg-muted px-1 text-xs">erp_account_id</code>. <strong>Org IDs are seeded empty</strong> — finance must confirm them (known IDs in use: 751813311, 841313343, 851585320; entity mapping unconfirmed).</p>
                        </Item>
                        <Item title="Live Zoho API wiring" status="planned">
                            <p>The routing decision is configured in the CMS today, but nothing calls Zoho yet. The real build resolves <em>(country, sub-department, clinical class)</em> → book + org id → creates the invoice through the Zoho Books API.</p>
                        </Item>
                        <Item title="VAT — UAE 5%, KSA 15%, sent exclusive; GLP-1 zero-rated" status="spec">
                            <p><strong>UAE 5%</strong> — constant across all Emirates (city-level VAT exists in the model but UAE does not vary by Emirate). <strong>KSA 15%</strong>. VAT is currently sent <strong>exclusive</strong> of price.</p>
                            <p><strong>Weight-loss / GLP-1 medicine is zero-rated</strong> — modelled as a clinical-class override (<code className="rounded bg-muted px-1 text-xs">glp1 → vat 0</code>) rather than a separate rate table.</p>
                            <p>VAT is configured at <strong>both</strong> the country level and the package / listing level, so a listing can opt out of its country rate.</p>
                            <p className="text-xs"><strong>Not yet handled:</strong> the <strong>KSA-nationals</strong> VAT nuance. It is a known gap, not a decided rule — do not implement it until finance specifies it.</p>
                        </Item>
                        <Item title="SKU pairing — the UniCommerce SKU IS the Zoho SKU (via Octa)" status="implemented">
                            <p>Procurement creates the SKU in <strong>UniCommerce</strong>; <strong>Octa</strong> pulls it into Zoho Books. Every UniCommerce SKU is therefore <strong>auto-paired</strong> with a Zoho item id — they are the same identifier, never entered twice.</p>
                            <p><strong>Live in the prototype:</strong> in the variant regional grid the <strong>SKU</strong> dropdown is the single point of entry and the <strong>Zoho item id is read-only / derived</strong> from it. If no Zoho item resolves, the row shows a muted <strong>&ldquo;Pending Zoho sync&rdquo;</strong> badge.</p>
                            <p className="text-xs">For <strong>service packages</strong> there is no procurement SKU, so category leads <strong>request a Zoho ID from finance</strong> — &ldquo;pending&rdquo; is a real, expected state there, not an error.</p>
                        </Item>
                        <Item title="Invoice granularity — one invoice per CHILD order" status="spec">
                            <p>Invoices are created <strong>per child order</strong>, not per cart: a cart that splits across fulfilment paths produces one invoice per child order.</p>
                            <p>At <strong>cart level</strong> a <strong>retainer invoice</strong> is raised to hold the payment against the customer until the child invoices settle it. <strong>Qatar is excluded</strong> from both — no invoices of any kind.</p>
                        </Item>
                    </CardContent>
                </Card>
            </section>

            {/* ── Content standards ── */}
            <section id="content" className="scroll-mt-4 space-y-3">
                <div className="flex items-center gap-2"><TypeIcon className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Content standards</h3></div>
                <Card>
                    <CardHeader><CardTitle className="text-base">Rich text everywhere applicable</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Item title="All long-form content authored via a Rich Text Editor" status="implemented">
                            <p><strong>Live in the prototype:</strong> long-form fields use a <strong>Tiptap</strong>-based RTE (bold, lists, links, headings), not a plain textarea. Targets: product &amp; category descriptions, benefits, How-to-Use, Why-Superior, FAQ answers, category hero/info blocks, retention message bodies, and journey block bodies.</p>
                            <p className="text-xs"><strong>Library:</strong> <code className="rounded bg-muted px-1 text-xs">Tiptap</code> (headless, ProseMirror-based; Lexical was the fallback alternative). The old <code className="rounded bg-muted px-1 text-xs">react-rte</code>/draft-js was <strong>not</strong> ported — the old system was referenced only for <em>which</em> fields are rich-text. Output is stored as sanitized <strong>HTML</strong> (sanitize on render). Plain short fields (names, slugs, SKUs, prices) stay plain inputs.</p>
                        </Item>
                        <Item title="Exactly one H1 per website page — enforced" status="implemented">
                            <p><strong>Live in the prototype:</strong> the single-H1 rule is enforced by the go-live audit. On a journey page the H1 is the single enabled <strong>Hero</strong> section; the audit counts enabled Hero blocks in render order.</p>
                            <p>If the count is not exactly one, the audit raises a <strong>blocking</strong> error and <strong>Publish (Go Live) is disabled</strong> until it is fixed, with the offending component named. RTE headings count toward the total in the real build. Run it from the <strong>AI go-live audit</strong> button on the journey Page tab.</p>
                        </Item>
                    </CardContent>
                </Card>
            </section>

            {/* ── AI go-live audit ── */}
            <section id="audit" className="scroll-mt-4 space-y-3">
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">AI go-live audit</h3></div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">AI-in-the-loop audit before a page goes Active</CardTitle>
                        <CardDescription>Runs on demand from the journey Page tab; the operator sees issues attributed to the exact components. Prototype uses a mock (deterministic) audit — the real build swaps in the AI model.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Item title="Spelling + SEO audit gate" status="implemented">
                            <p><strong>Live in the prototype (mock AI):</strong> the <strong>AI go-live audit</strong> button on the journey Page tab runs deterministic passes — <strong>spelling</strong> (against a common-misspellings dictionary) and <strong>SEO / structure</strong> (single-H1, empty hero heading, missing hero image, thin blocks, thin whole-page word count).</p>
                            <p>Findings <strong>name the exact component</strong> that needs changes (e.g. "Hero — spelling: 'recieve' → 'receive'", "Thin content in FAQ"), grouped by severity, so the fix is one click away. The real build replaces the mock with a spelling/grammar + SEO model and richer checks (title/description length, heading order, alt-text coverage, keyword/slug alignment).</p>
                        </Item>
                        <Item title="Audit the page as a crawler sees it" status="implemented">
                            <p><strong>Live in the prototype:</strong> the audit composes the <strong>fully-assembled page</strong> — enabled blocks in rank order, RTE fields stripped to plain text — and runs whole-page checks (H1 count, total word count) on that, the same content a search crawler would receive. It does <strong>not</strong> audit fields in isolation, because SEO signals (duplicate H1s, content order, total word count) only exist at the whole-page level.</p>
                            <p className="text-xs">Prototype: composed client-side from the block list in <code className="rounded bg-muted px-1 text-xs">src/lib/content-audit.ts</code>. Real build: render the page server-side (crawler-equivalent DOM, both language variants) → feed that HTML to the audit model → map each finding back to the component id that produced the offending node.</p>
                        </Item>
                    </CardContent>
                </Card>
            </section>

            {/* ── Variant options / matrix ── */}
            <section id="variants" className="scroll-mt-4 space-y-3">
                <div className="flex items-center gap-2"><Boxes className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Variant options &amp; the SKU matrix</h3></div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Axes belong to the product; a variant is one combination</CardTitle>
                        <CardDescription>
                            Every major commerce platform — Shopify, WooCommerce, BigCommerce, commercetools,
                            Saleor, and Amazon&apos;s parent/child ASIN model — converges on the same three-part
                            shape. We follow it rather than inventing a Valeo-specific one.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Item title="1 · Options (axes) live on the product" status="spec">
                            An ordered list of axes: Colour, Size, Flavour, Quantity. The order is the order the
                            selectors render in on the PDP. Two or three axes is the practical maximum — this is
                            the industry norm, and it is what &ldquo;variant type is multi-select&rdquo; actually
                            means: the listing declares that it varies by Flavour <em>and</em> Quantity.
                        </Item>
                        <Item title="2 · Each axis owns an ordered list of values" status="spec">
                            Colour → [Midnight Black, Silver, Rose Gold]. A value carries its own presentation
                            data — swatch hex, and an image so the PDP gallery can swap when the colour changes.
                            Retired values deactivate; they are never deleted, per the CMS-wide no-delete rule.
                        </Item>
                        <Item title="3 · A variant is a unique combination, and IS the sellable unit" status="spec">
                            One value per axis. The variant — never the axis and never the listing — carries SKU,
                            price, stock and barcode. Add-to-cart posts a <code>variantId</code>, never a listing
                            plus a bag of labels.
                        </Item>
                        <Separator />
                        <Item title="The matrix is generated, and deliberately sparse" status="spec">
                            You never hand-add combinations. Declare Colour (3) × Size (3) and the nine rows are
                            generated; fill a SKU per row per country. A combination you do not sell simply has no
                            variant, and the PDP greys that choice out — so a partial grid is correct, not broken.
                            Generation is <strong>additive</strong>: a combination that already has a variant keeps
                            its id, because partner pricing and bundles reference variant ids.
                        </Item>
                        <Item title="Duplicate combinations are a hard write error" status="spec">
                            Two variants holding the same value set make selection→SKU unresolvable on the PDP.
                            Enforce with a UNIQUE constraint on the sorted value set per catalog, and reject at the
                            API — not just in the CMS UI.
                        </Item>
                        <Item title="Cap the grid, then split the listing" status="implemented">
                            Colour(8) × Size(5) × Flavour(6) is 240 rows, each needing a SKU and a price per
                            country. The CMS warns past 100 combinations; beyond that the listing should be split.
                        </Item>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Frontend ↔ backend split</CardTitle>
                        <CardDescription>
                            The backend ships axes plus a sparse variant list. It does not ship a pre-built
                            selector, and the frontend does no regional pricing arithmetic.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Item title="Backend: one payload, resolved per country" status="spec">
                            <code>GET /v1/listings/:slug?country=UAE</code> returns <code>options[]</code> and
                            <code> variants[]</code> together — they are cached and invalidated as one unit.
                            Variants are filtered to what is sellable in that country, with price and stock already
                            resolved, and one variant flagged default so the PDP has a price on first paint.
                        </Item>
                        <Item title="Frontend: render by kind, resolve by exact match" status="spec">
                            One selector per axis, rendered from the axis <code>kind</code> — colour becomes
                            swatches, size becomes pills, quantity becomes a dropdown. A selection resolves only
                            when every axis has a value; find the variant whose <code>optionValues</code> match
                            exactly.
                        </Item>
                        <Item title="Frontend: grey out unreachable values" status="spec">
                            Given a partial selection, a value is selectable only if some remaining variant still
                            contains it. This single rule is what makes a sparse matrix feel deliberate instead of
                            broken, and it is computed client-side from the variant list — no extra round trip.
                        </Item>
                        <Item title="Frontend: never show the default price as the selection's price" status="spec">
                            Before resolution, show a range (&ldquo;from AED 249&rdquo;). Reflect the resolved
                            variant in the URL so a shared PDP link reopens on the same SKU.
                        </Item>
                        <Separator />
                        <Item title="One product page, one set of SEO — Health Products" status="implemented">
                            <p>A variant has <strong>no indexable page of its own</strong>. The PDP is a single URL and
                            the variant is a selection on it, so title, meta description and canonical are authored
                            once on the listing. The CMS does not collect SEO per variant for Health Products.</p>
                            <p>The reason is concrete: a Colour(3) × Size(3) grid would otherwise carry nine
                            competing titles and nine slugs behind one page — self-inflicted duplicate content, and
                            nine chances for the wrong one to win.</p>
                            <p>Frontend contract: reflect the resolved variant as a <strong>parameter</strong>
                            (<code>?variant=…</code>), keep <code>rel=canonical</code> pointed at the listing URL, and
                            never emit a variant-specific title. The variant slug survives only as an optional
                            readable key for that parameter — it is not a route.</p>
                            <p>Other departments still collect variant SEO, where a variant can legitimately warrant
                            its own page.</p>
                        </Item>
                        <Item title="Schema: the SKU is already in the right place" status="spec">
                            <code>product_variant_identifiers(variant_id, country_id, sku)</code> already gives one
                            SKU per combination per country — &ldquo;each combo mapped to an SKU&rdquo; needs no new
                            SKU plumbing once a variant is a combination. What is missing is the axes:{" "}
                            <code>catalog_options</code>, <code>catalog_option_values</code>, and the join{" "}
                            <code>product_variant_option_values</code>. Until they exist,{" "}
                            <code>product_variants.variant_type</code> is a single enum and a listing can only vary
                            along one axis — a wearable varying by Colour <em>and</em> Size is unrepresentable.
                        </Item>
                    </CardContent>
                </Card>
            </section>

            {/* ── Tags ── */}
            <section id="tags" className="scroll-mt-4 space-y-3">
                <div className="flex items-center gap-2"><Tags className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tags &amp; governance</h3></div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Tags are a third layer, not a third taxonomy</CardTitle>
                        <CardDescription>
                            The catalogue already has two trees: Department → Sub-department answers
                            <em> what it is</em>, Category → Sub-category answers <em>where it appears</em>.
                            Neither can express a cross-cutting attribute like &ldquo;cold-chain&rdquo; without
                            inventing a nonsense node, which is what tags are for.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Item title="The discriminator" status="implemented">
                            <ul className="ml-4 list-disc space-y-1">
                                <li>Changes which <strong>fields</strong> a listing needs → <strong>sub-department</strong>.</li>
                                <li>Changes <strong>where</strong> it appears in navigation → <strong>category</strong>.</li>
                                <li>A cross-cutting attribute to <strong>filter, merchandise or operate</strong> on → <strong>tag</strong>.</li>
                            </ul>
                            <p>Apply this test every time someone asks for a new tag. Without it, tags silently become a shadow taxonomy and the two real trees stop being trustworthy.</p>
                        </Item>
                        <Item title="Namespaces are a closed enum" status="implemented">
                            <p><code>goal</code>, <code>audience</code>, <code>condition</code>, <code>campaign</code>, <code>ops</code>, <code>clinical</code>. Adding one is a code change on purpose — if operators can invent namespaces, the sprawl problem just moves up a level.</p>
                            <p><code>ops</code> and <code>clinical</code> are <strong>internal</strong>: they drive fulfilment and safety copy and must never appear in a storefront filter. The API must enforce that server-side, not rely on the frontend to hide them.</p>
                        </Item>
                        <Item title="Who creates versus who applies" status="implemented">
                            <p><strong>Admins / catalogue ops</strong> curate the vocabulary in Administration → Tags. <strong>Category managers</strong> apply tags while editing a listing, and may <strong>propose</strong> a new one — which lands as <code>proposed</code> and is inert until approved. The proposer sees a pending badge so nobody proposes the same tag twice.</p>
                            <p>This split is the entire point. Free-typed tags are how a catalogue ends up with <code>glp1</code>, <code>GLP-1</code> and <code>GLP 1</code> as three different labels that each match a third of the products.</p>
                        </Item>
                        <Item title="Nothing deletes; merge is an audited bulk relabel" status="implemented">
                            <p>Retiring a tag deactivates it: it leaves storefront filters but <strong>stays on the listings that already carry it</strong>, so history and reporting do not silently rewrite themselves.</p>
                            <p>Consolidating duplicates goes through <strong>Merge</strong>, which shows the usage count before it fires and writes <strong>one audit entry per relabelled listing</strong> — a merge across 400 listings is 400 changes to whoever owns them.</p>
                        </Item>
                        <Item title="Filtering semantics must be explicit" status="implemented">
                            <p>Multi-select, with a visible <strong>match all</strong> / <strong>match any</strong> toggle once more than one tag is picked. The two produce very different result sets and guessing on the user&apos;s behalf is how filters lose trust.</p>
                            <p>On the storefront the same primitive powers tag-driven dynamic collections — a &ldquo;Better Sleep&rdquo; page is a query, not a hand-maintained list.</p>
                        </Item>
                        <Item title="Schema" status="spec">
                            <p><code>tags(id, namespace, slug, name_en, name_ar, status, customer_facing, created_by)</code> with <strong>UNIQUE(namespace, slug)</strong> — that constraint is the deduplication guarantee.</p>
                            <p><code>entity_tags(entity_type, entity_id, tag_id)</code> reusing the <strong>same polymorphic convention as <code>seo_meta</code></strong>. Do not invent a second entity-reference shape or the read path forks.</p>
                            <p>Listings are wired now. The same field drops into categories, sub-categories and journeys unchanged.</p>
                        </Item>
                    </CardContent>
                </Card>
            </section>

            {/* ── Listing states ── */}
            <section id="states" className="scroll-mt-4 space-y-3">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Listing states &amp; the read path</h3></div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Four states, and there is no separate visibility flag</CardTitle>
                        <CardDescription>
                            Status alone decides two independent things: whether the URL resolves, and whether the
                            listing appears in browse. One field, four states, no contradictory combinations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[36rem] text-xs">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">State</th>
                                        <th className="py-2 pr-4 font-medium">URL (production)</th>
                                        <th className="py-2 pr-4 font-medium">Category pages, search, carousels</th>
                                        <th className="py-2 font-medium">URL (preprod)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b"><td className="py-2 pr-4 font-semibold">Draft</td><td className="py-2 pr-4">does not resolve</td><td className="py-2 pr-4">no</td><td className="py-2">resolves</td></tr>
                                    <tr className="border-b"><td className="py-2 pr-4 font-semibold">Published</td><td className="py-2 pr-4">resolves</td><td className="py-2 pr-4">yes</td><td className="py-2">resolves</td></tr>
                                    <tr className="border-b"><td className="py-2 pr-4 font-semibold">Inactive</td><td className="py-2 pr-4">resolves</td><td className="py-2 pr-4"><strong>no</strong> — delisted everywhere</td><td className="py-2">resolves</td></tr>
                                    <tr><td className="py-2 pr-4 font-semibold">Archived</td><td className="py-2 pr-4">does not resolve</td><td className="py-2 pr-4">no</td><td className="py-2">resolves</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <Item title="Inactive is the state that earns its keep" status="implemented">
                            <p>It keeps the URL alive so existing links, ads, emails and printed QR codes do not
                            404, while removing the listing from every browse surface. That is the honest way to
                            withdraw something from sale without breaking the internet.</p>
                            <p>Because Inactive already means &ldquo;live URL, delisted&rdquo;, a separate
                            <code> visibility </code>/unlisted flag would be a second way to say the same thing —
                            and two flags can disagree. There is only status.</p>
                        </Item>
                        <Item title="Preprod renders every state" status="spec">
                            <p>Preprod resolves <strong>all four</strong>, so content can be reviewed before it is
                            published and inspected after it is archived. Production honours the table above.</p>
                            <p><strong>Preprod must be noindex and access-controlled.</strong> The whole point is
                            that it serves unpublished drafts; if it is crawlable, an unfinished listing becomes an
                            indexable page and can outrank the real one.</p>
                        </Item>
                        <Item title="Consequences of a state change" status="spec">
                            <p>Moving to Archived or Draft takes a URL out of service, so the read path must return a
                            <strong> 410 Gone</strong> for Archived (it existed and will not return) and a
                            <strong> 404</strong> for Draft. Drop both from the sitemap; keep Inactive in the sitemap
                            only if the page still has standalone value.</p>
                            <p>Nothing here deletes. Archived is the terminal state, and it is reversible.</p>
                        </Item>
                    </CardContent>
                </Card>
            </section>

            {/* ── Conventions ── */}
            <section id="conventions" className="scroll-mt-4 space-y-3">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Platform conventions (live)</h3></div>
                <div className="grid gap-3 md:grid-cols-2">
                    <Item title="No entity deletion — active/inactive only" status="implemented"><p>Catalogue entities are never deleted; they're activated or deactivated. In-editor sub-items (variants, blocks, rows) can still be removed while authoring.</p></Item>
                    <Item title="Upload-only media" status="implemented"><p>No media URLs anywhere — images and video are uploaded, previewed at their real component size (via <code className="rounded bg-muted px-1 text-xs">ImageField</code>).</p></Item>
                    <Item title="Incremental save + activation gate" status="implemented"><p>Each section writes back on save; a draft can only flip to Active once its mandatory requirements are met.</p></Item>
                    <Item title="Compliance audit log" status="implemented"><p>Every create/update/status-change is recorded with a before→after diff at <code className="rounded bg-muted px-1 text-xs">/audit</code>.</p></Item>
                    <Item title="Two-taxonomy model" status="implemented"><p>Department → Sub-department (what it IS) is separate from Category → Sub-category (where it SHOWS UP).</p></Item>
                </div>
            </section>

            <Separator />
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> This document is maintained in-app. Update it as scope items move from Planned → Implemented.
                <Link2 className="ml-2 h-3.5 w-3.5" /> Related: <a className="text-primary hover:underline" href="/audit">Audit Log</a>
            </p>
        </div>
    )
}
