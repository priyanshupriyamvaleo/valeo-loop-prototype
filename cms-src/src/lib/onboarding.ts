// Contextual onboarding content. Every step describes what the CMS actually
// does today — keep these in sync when a flow changes.

export type GuideKey =
    | "listing" | "department" | "category" | "subcategory"
    | "variants" | "journey" | "retention" | "promo" | "partner"

export interface GuideStep {
    title: string
    body: string
    tip?: string
}

export interface Guide {
    key: GuideKey
    title: string
    /** who this guide is for, one line */
    forWho: string
    minutes: number
    intro: string
    steps: GuideStep[]
    /** shown as a "required before Active" checklist */
    mandatory?: string[]
    next?: { label: string; href: string }
}

export const GUIDES: Record<GuideKey, Guide> = {
    listing: {
        key: "listing",
        title: "Creating a listing",
        forWho: "Category managers adding anything sellable",
        minutes: 3,
        intro: "A Listing is the sellable hub — one entry serves both app and web. What you fill in depends on the department you're creating under, so start there.",
        steps: [
            {
                title: "Pick the department, then the sub-department",
                body: "The catalogue spine is Department → Sub-department → Listing. Every listing sits in exactly one sub-department. You choose the department on the Listings page before the editor opens.",
                tip: "The sub-department decides which fields you'll see — pick Medicine and you get Medicine Type (GLP-1, Peptide, Hair Loss…); pick Wearables and you get device specs.",
            },
            {
                title: "Name it and set identity",
                body: "Internal name is the admin-only handle. Display name (EN) is what customers see, with Arabic alongside it. Everything bilingual has an EN and an AR field.",
            },
            {
                title: "Declare the variant axes, then fill the generated grid",
                body: "Do not add variants one by one. Declare what the listing varies BY — Colour, Size, Flavour, Quantity — and the CMS generates every combination for you. Each combination is one variant, and the variant is what carries SKU, price, warehouse and stock, one row per country. Master stock is the sum of every warehouse.",
                tip: "See the \u201cVariants & the SKU matrix\u201d guide for the full flow. SKU comes from UniCommerce; the Zoho item id is auto-paired via Octa and shown read-only.",
            },
            {
                title: "Write the content and upload media",
                body: "Description, benefits, How-to-Use, FAQ and Why-Superior make up the PDP story. Long-form fields use the rich text editor. All media is uploaded — there are no URL fields — and previews at its real on-site size.",
            },
            {
                title: "Place it where shoppers will find it",
                body: "Classification puts the listing on the spine; Categories and Sub-categories decide where it shows up on web/app. Placement is merchandising, not a publish gate — a listing can go Active unplaced and still resolve at its canonical page.",
            },
            {
                title: "Save as you go",
                body: "Each section writes back when you hit Save & Continue — your first save mints the draft, and nothing is lost if you stop halfway. A draft can always be saved incomplete.",
            },
            {
                title: "Clear the activation gate to go Active",
                body: "The header shows how many requirements are left. Status can only flip to Active once all of them pass; click any unmet item to jump straight to the field.",
            },
            {
                title: "Optional: partner access",
                body: "Grant a B2B partner access to set their own price (by variant, city or country) and image override. Marking a listing partner-exclusive hides it from Valeo's master search.",
            },
        ],
        mandatory: [
            "Internal name",
            "Display name (EN)",
            "Sub-department",
            "Fulfilment path",
            "At least one variant with a price",
            "At least one image",
            "Surface (app / web) set",
        ],
        next: { label: "Go to Listings", href: "/catalogue/listings" },
    },

    variants: {
        key: "variants",
        title: "Variants & the SKU matrix",
        forWho: "Anyone pricing or stocking a product that comes in more than one form",
        minutes: 3,
        intro: "A listing is the thing you sell; a variant is the exact thing a customer buys. If a product comes in three colours and three sizes, that is nine buyable things — nine SKUs. You never type those nine out. You declare the two axes and the CMS builds the grid.",
        steps: [
            {
                title: "Step 1 — declare the axes, not the variants",
                body: "Open Variants & Pricing and use \u201cAdd axis\u201d. An axis is what the listing varies BY: Colour, Size, Flavour, Quantity, Dosage, Denomination. Pick as many as apply \u2014 a supplement can vary by Flavour AND Quantity at the same time.",
                tip: "Two axes is normal, three is the practical maximum. Colour(8) \u00d7 Size(5) \u00d7 Flavour(6) is 240 SKUs to maintain \u2014 the CMS warns you past 100 and you should split the listing instead.",
            },
            {
                title: "Step 2 — give each axis its values",
                body: "Expand an axis and add its values in the order you want them to appear on the product page. Colour values also take a swatch colour and their own image, so the gallery swaps when a shopper picks Rose Gold.",
                tip: "Retiring a value? Set it Inactive. Nothing in the CMS deletes \u2014 an inactive value stops being sellable but its history and its variants survive.",
            },
            {
                title: "Step 3 — generate the combinations",
                body: "The grid shows every combination of your axes and how many already exist. Press \u201cCreate N missing variants\u201d and the CMS builds them, names them from the combination, and pre-creates one row per country you sell in.",
                tip: "Generation only ever ADDS. A combination that already has a variant keeps it untouched, because partner pricing and bundles point at that variant\u2019s id.",
            },
            {
                title: "Step 4 — fill SKU and price per combination, per country",
                body: "Each generated variant needs its UniCommerce SKU, price, warehouse and warehouse stock for every country. The grid\u2019s \u201cSKUs filled\u201d column shows you what is still outstanding, so you can see readiness without opening all nine.",
            },
            {
                title: "You do not need every combination",
                body: "The grid is deliberately sparse. If you do not make Gold in size 6, leave that row uncreated \u2014 the product page greys the choice out. A partial grid is a correct grid.",
            },
            {
                title: "Two variants may never share a combination",
                body: "If two variants both say Silver / Size 6, the product page cannot tell which SKU the shopper picked. The CMS flags the clash and blocks the listing from going Active until you resolve it.",
                tip: "An axis that variants already use cannot be removed \u2014 that would orphan their combinations. Deactivate the values you no longer want instead.",
            },
            {
                title: "Single-variant products skip all of this",
                body: "If a listing does not vary \u2014 one blood panel, one consultation \u2014 declare no axes and simply add one variant. The panel says \u201csingle-variant mode\u201d and the old type-and-label form is what you get.",
            },
        ],
    },
    department: {
        key: "department",
        title: "Departments & sub-departments",
        forWho: "Anyone setting up the catalogue spine, VAT or Zoho routing",
        minutes: 3,
        intro: "Departments are the canonical \"what it is\" classification. The five departments are fixed — your job is the sub-departments beneath them, and the per-country commercial setup they carry.",
        steps: [
            {
                title: "Five departments, fixed",
                body: "Diagnostics & Testing, Treatments & Therapies, Doctors & Health Coaches, Home & Personal Care, Health Products. You can't add or remove them.",
            },
            {
                title: "Add sub-departments",
                body: "Add Sub-department asks for the name (EN/AR) and slug. Sub-departments are what listings actually attach to — e.g. Supplements, Medicine, Blood Panels, IV Therapy.",
            },
            {
                title: "The sub-department gates listing fields",
                body: "Which attributes and conditional sections appear on a listing is driven by its sub-department. That's why Medicine listings ask for a clinical class and Wearables ask for a manufacturer.",
            },
            {
                title: "Add the countries it sells in",
                body: "Under each sub-department, add a country row per market. Nothing is shown until you add it, so the list stays short.",
            },
            {
                title: "Set VAT per country",
                body: "Each country row takes a VAT % and a VAT mode (currently sent exclusive). VAT is a country-level setting — there is no city-level rate.",
                tip: "UAE is 5% and constant across the Emirates; KSA is 15%.",
            },
            {
                title: "Map the Zoho book and invoicing",
                body: "Pick the Zoho Book for that country (DMCC/KUA, Shifa, Value Health IT, Saha, Integrative) and enter the org id. Switch invoicing off where no invoices are created at all — Qatar is the live example.",
            },
            {
                title: "Add clinical-class overrides for the exceptions",
                body: "Some classes route differently inside a country. UAE GLP-1 / weight-loss goes to Shifa rather than DMCC and is zero-rated — add it as an override row rather than bending the country default.",
            },
            {
                title: "Choose payment methods per country",
                body: "Tick the methods available in that market: Card, Cash on Delivery, Paymob, Tabby, Tamara, Apple Pay.",
            },
        ],
        next: { label: "Go to Departments", href: "/catalogue/departments" },
    },

    category: {
        key: "category",
        title: "Creating a category",
        forWho: "Merchandisers shaping the storefront",
        minutes: 2,
        intro: "A Category is a storefront group a shopper browses — \"Shop by Goal\", \"Beauty & Skincare\". It is pure merchandising: it says where something shows up, never what it is.",
        steps: [
            {
                title: "Category is not a department",
                body: "Departments classify (what it is). Categories merchandise (where it appears). A listing lives in one sub-department but can surface in many categories.",
            },
            {
                title: "Name it and pick the surface",
                body: "Give it a name (EN/AR) and a slug, then choose whether it shows on App, Web or both.",
            },
            {
                title: "Author the landing page",
                body: "A category has real page content: hero, stats, promo block, info sections, FAQ and trust badges. Long-form copy uses the rich text editor; images are uploaded with EN/AR alt text.",
            },
            {
                title: "Map sub-categories into it",
                body: "A category is made of sub-categories. Use Map sub-categories to attach existing ones — or create a new one inline with its name, slug and surface.",
            },
            {
                title: "Fill in SEO",
                body: "Set the SEO title, meta description, canonical URL and social/OG image. Only one H1 is allowed on a live page — the go-live audit enforces it.",
            },
            {
                title: "Optional: promo banner and partners",
                body: "Attach a reusable promo banner (with its coupon) and, if it's a B2B surface, grant partner access or mark it partner-exclusive.",
            },
        ],
        next: { label: "Go to Categories", href: "/catalogue/categories" },
    },

    subcategory: {
        key: "subcategory",
        title: "Creating a sub-category",
        forWho: "Merchandisers placing listings on the storefront",
        minutes: 2,
        intro: "A Sub-category is the actual shelf a listing sits on, inside a category. This is the placement that makes a listing findable in browse — separate from activation, which never depends on it.",
        steps: [
            {
                title: "Category vs sub-category",
                body: "Category = the group (\"Shop by Goal\"). Sub-category = the shelf inside it (\"Energy & Focus\"). Listings are mapped to sub-categories, not categories.",
            },
            {
                title: "Create it with its fields",
                body: "Name (EN/AR), slug and surface (App / Web / both). You can create one from the Sub-categories tab, or inline while mapping sub-categories into a category.",
            },
            {
                title: "Attach it to a parent category",
                body: "Every sub-category should belong to a category so it appears in the storefront tree.",
            },
            {
                title: "Author its landing content",
                body: "Sub-categories carry the same landing-page content as categories — hero, stats, promo, info, FAQ, SEO — because they're real browsable pages.",
            },
            {
                title: "Map listings in",
                body: "Use Map listings to choose which listings appear on this shelf.",
                tip: "Placement never blocks activation — an Active listing with no shelf simply doesn't appear in browse.",
            },
            {
                title: "Optional: promo banner and partners",
                body: "Attach a promo banner, and set partner access or partner-exclusivity if this shelf is for a specific B2B partner.",
            },
        ],
        next: { label: "Go to Categories", href: "/catalogue/categories" },
    },

    journey: {
        key: "journey",
        title: "Building a journey page",
        forWho: "Content managers building landing experiences",
        minutes: 3,
        intro: "A Journey is a block-built page — the marketing surface for a program like Weight Loss. You assemble it from blocks and preview it exactly as a customer will see it.",
        steps: [
            {
                title: "Create the journey, then build the page",
                body: "Add the journey (name, slug, program or direct), then open Build page to assemble it.",
            },
            {
                title: "Hero is mandatory and single",
                body: "Every page has exactly one Hero section — it provides the page's H1. You can't add a second, delete the last one, or switch it off.",
            },
            {
                title: "Add as many other blocks as you need",
                body: "USP, Trust, Steps to Follow, Product List, Comparison, Feature List, Image Testimonials, Customer Profile, BMI, FAQ and Contact Us can each repeat. Add from the dropdown, then reorder or toggle any block.",
            },
            {
                title: "Preview in both languages and both devices",
                body: "The live preview has an EN/AR toggle beside the mobile/desktop toggle. Arabic flips the page to RTL and shows your AR content, so check all four combinations.",
            },
            {
                title: "Attach retention per country",
                body: "On the Retention tab, pick the retention page for each country. Build the retention template once centrally and reuse it here.",
            },
            {
                title: "Run the go-live audit before publishing",
                body: "AI go-live audit reads the fully-composed page the way a crawler sees it and reports spelling and SEO issues against the exact block. Anything blocking — including a missing or duplicate H1 — disables Publish until it's fixed.",
            },
            {
                title: "Optional: partner access",
                body: "Grant partner access or mark the journey partner-exclusive to keep it out of Valeo's master search.",
            },
        ],
        next: { label: "Go to Journeys", href: "/catalogue/journeys" },
    },

    retention: {
        key: "retention",
        title: "Building a retention page",
        forWho: "Program and CRM owners keeping patients engaged",
        minutes: 3,
        intro: "Retention pages are built once, centrally, and then attached to a journey per country — so the same structure can serve several markets.",
        steps: [
            {
                title: "Build centrally, attach per country",
                body: "Create a retention page here, then attach it on a journey's Retention tab for a specific country. One template, many journeys.",
            },
            {
                title: "It's a ranked list of sections",
                body: "Each section has a rank, a title and an enable/disable switch. Reorder with the up/down controls — rank is the order a patient sees them in.",
            },
            {
                title: "Add the section type you need",
                body: "Add section offers nine types: Banner, Package, Weekly Doctor Messages, Video, Content, Clinical/Symptoms, Onboarding, Next Dose and Section Title. Each opens the fields relevant to it.",
            },
            {
                title: "Wire sections to real catalogue items",
                body: "Package sections link a single listing; Content sections take a searchable list of listings (top picks, recommended tests, support services). Banner sections take an uploaded image.",
            },
            {
                title: "Weekly Doctor Messages is a full schedule",
                body: "Sixteen messages across four months. Each has a week (1–16), bilingual title and content, and a draft/published toggle; the overview strip shows how many land in each month.",
                tip: "Messages are grouped by month, so it's easy to see gaps before you publish.",
            },
            {
                title: "Save and reuse",
                body: "Save the template and attach it wherever it applies. Editing it centrally updates every journey that uses it.",
            },
        ],
        next: { label: "Go to Retention", href: "/catalogue/retention" },
    },

    promo: {
        key: "promo",
        title: "Promo banners & coupons",
        forWho: "Growth and merchandising owners running offers",
        minutes: 2,
        intro: "A promo banner is a reusable offer with a coupon attached. Build it once, then select it on any listing, category or sub-category — and swap it in one place when the offer changes.",
        steps: [
            {
                title: "Create the banner",
                body: "Give it an internal name plus a bilingual title and subtitle — that's the offer copy customers read.",
            },
            {
                title: "Attach the coupon",
                body: "Set the coupon code and the discount (percentage or fixed). This is what ties the banner to the actual offer.",
            },
            {
                title: "Add the CTA",
                body: "Set the button label (EN/AR) and where it links to.",
            },
            {
                title: "Select it where it should appear",
                body: "On a listing, category or sub-category, choose the banner from the promo banner dropdown. The same banner can run in many places.",
            },
            {
                title: "Change it in one place",
                body: "Editing the banner updates everywhere it's used. Switch it inactive to pull it from all surfaces at once — nothing is ever deleted.",
            },
        ],
        next: { label: "Go to Promo Banners", href: "/catalogue/promo-banners" },
    },

    partner: {
        key: "partner",
        title: "Partner integration",
        forWho: "B2B and partnerships owners",
        minutes: 2,
        intro: "Partners get access to catalogue entities, and can carry their own pricing and creative — up to listings that only exist for them.",
        steps: [
            {
                title: "Create the partner",
                body: "Add the partner with its code, type and contact. Set the countries it operates in if it's a single-market partner.",
            },
            {
                title: "Grant access on an entity",
                body: "On a listing, category, sub-category or journey, add the partner and choose Owner or Viewer. The same partner section appears across the CMS.",
            },
            {
                title: "Override the price",
                body: "Add price rows per partner at variant × country × city granularity, each with an optional percentage or fixed discount. Leave it empty and the partner pays standard price.",
            },
            {
                title: "Override the image",
                body: "Upload a partner-specific image (with alt text) when their surface needs different creative.",
            },
            {
                title: "Partner-exclusive entities",
                body: "Turn on partner-exclusive to hide the entity from Valeo's master search — only the assigned partner can surface it.",
                tip: "Exclusivity is set once on the entity, not per partner row.",
            },
        ],
        next: { label: "Go to Partners", href: "/catalogue/partners" },
    },
}

export const GUIDE_ORDER: GuideKey[] = [
    "listing", "variants", "department", "category", "subcategory", "journey", "retention", "promo", "partner",
]
