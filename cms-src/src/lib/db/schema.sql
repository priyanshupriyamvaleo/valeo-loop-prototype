-- ── Biomarker model, on Postgres ──────────────────────────────
-- The clinical spine has no home in the content service (it publishes Health
-- Products and Treatments only), so it lives here rather than in memory.
--
-- Tables start EMPTY. Nothing is seeded: a reference band, a component price or
-- a lab cost that nobody authored is worse than an absent one, because it looks
-- like a decision. Rows arrive from the authoring screens, and a LOINC-backed
-- create flow supplies the identity fields so that is fast rather than typing.

CREATE TABLE IF NOT EXISTS biomarkers (
    id                 text PRIMARY KEY,
    internal_name      text UNIQUE,
    name_en            text NOT NULL,
    name_ar            text,
    sample_kind        text NOT NULL DEFAULT 'blood',
    tube_type          text,
    unit_ucum          text,
    analytical_method  text,
    fasting_hours      smallint,
    tat_hours          smallint,
    sex_applicability  text NOT NULL DEFAULT 'any',
    -- A derived analyte is COMPUTED, never drawn. It must have inputs and must
    -- never reach a lab requisition; both are enforced in the app's gates.
    is_derived         boolean NOT NULL DEFAULT false,
    input_ids          text[] NOT NULL DEFAULT '{}',
    -- Curation state, NOT sellability. There is no price or SKU on this table
    -- by design: a biomarker is a clinical fact.
    lifecycle          text NOT NULL DEFAULT 'draft',
    is_active          boolean NOT NULL DEFAULT true,
    country_availability text[] NOT NULL DEFAULT '{}',
    description_en     text,
    description_ar     text,
    causes_en          text,
    what_to_do_en      text,
    image_url          text,
    legacy_id          integer,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS biomarker_panels (
    id             text PRIMARY KEY,
    name_en        text NOT NULL,
    name_ar        text,
    -- Labs bill a panel under ONE code, not one per member. Without this a
    -- basket containing the panel cannot become a single requisition.
    lab_panel_code text,
    -- Set when the panel was imported from a LOINC panel definition.
    loinc_num      text,
    is_active      boolean NOT NULL DEFAULT true,
    note           text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Membership is a table, not an array, so it can carry per-member facts. The
-- legacy model gave a biomarker exactly one parent test, which breaks the
-- moment an analyte belongs to two panels — which is normal.
CREATE TABLE IF NOT EXISTS biomarker_panel_members (
    panel_id     text NOT NULL REFERENCES biomarker_panels(id) ON DELETE CASCADE,
    biomarker_id text NOT NULL REFERENCES biomarkers(id) ON DELETE CASCADE,
    sort_order   integer NOT NULL DEFAULT 0,
    -- From LOINC's Panels and Forms file: a member may be required or optional
    -- within its panel. Nothing in the app modelled this before.
    cardinality  text,
    -- NULL = the BASE list, which answers for every market that has no map of
    -- its own. A value scopes the row to that market. A panel is a clinical
    -- grouping, so the base list is the normal case and a country row is the
    -- exception — nobody should have to author four copies of a lipid profile
    -- so that one of them can differ.
    country      text
);
-- Postgres will not take COALESCE in a PRIMARY KEY, and a plain composite over
-- a nullable country leaves the NULL-uniqueness hole: two base rows for the
-- same member would both be allowed. Same functional index as the price table.
CREATE UNIQUE INDEX IF NOT EXISTS ux_panel_member_scope
    ON biomarker_panel_members (panel_id, biomarker_id, COALESCE(country, ''));

-- One row per graded band, scoped and effective-dated. A band is the difference
-- between "you are fine" and "see a doctor", so when one moves every report
-- already issued under the old band must stay explicable: an edit CLOSES a row
-- (effective_to) and opens a new one. Nothing is deleted.
CREATE TABLE IF NOT EXISTS biomarker_reference_ranges (
    id             text PRIMARY KEY,
    biomarker_id   text NOT NULL REFERENCES biomarkers(id) ON DELETE CASCADE,
    country        text,            -- NULL = the default band
    lab_id         text,            -- NULL = any lab; a lab row wins over a country row
    sex            text NOT NULL DEFAULT 'any',
    age_min_years  smallint,
    age_max_years  smallint,
    pregnancy      text,
    grade          text NOT NULL,
    low            numeric,         -- either bound may be NULL: an open-ended
    high           numeric,         -- band is first-class, not parsed from text
    label_en       text,
    effective_from date NOT NULL DEFAULT current_date,
    effective_to   date
);
CREATE INDEX IF NOT EXISTS ix_ranges_biomarker ON biomarker_reference_ranges (biomarker_id);

-- Codes as ROWS, so a new market or scheme is an insert rather than a release.
-- `status` carries what a nullable column cannot: "no match exists" is finished
-- mapping work, while NO ROW is a to-do. Collapsing them makes the integration
-- backlog unmeasurable.
CREATE TABLE IF NOT EXISTS biomarker_codes (
    id            text PRIMARY KEY,
    biomarker_id  text NOT NULL REFERENCES biomarkers(id) ON DELETE CASCADE,
    scheme        text NOT NULL,
    country       text,
    code          text,
    display       text,
    code_kind     text,
    status        text NOT NULL DEFAULT 'pending_review',
    effective_from date
);
CREATE INDEX IF NOT EXISTS ix_codes_biomarker ON biomarker_codes (biomarker_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_codes_scope
    ON biomarker_codes (biomarker_id, scheme, COALESCE(country, ''), COALESCE(code, ''));

-- The build-your-own component price. A price of the CHANNEL, not of the
-- analyte: no SKU, no invoice line of its own, resolves only inside a basket.
-- The country row is the BASE and a city row OVERRIDES it — deliberately unlike
-- the variant pricing grid, where a blank cell means "not sold there".
CREATE TABLE IF NOT EXISTS cyot_component_prices (
    biomarker_id text NOT NULL REFERENCES biomarkers(id) ON DELETE CASCADE,
    country      text NOT NULL,
    city_id      text,
    price        numeric NOT NULL,
    effective_from date
);
-- Postgres will not take COALESCE in a PRIMARY KEY, and a plain composite key
-- over a NULLABLE city_id leaves the NULL-uniqueness hole: two country rows for
-- the same analyte would both be allowed. A functional unique index closes it,
-- which is the same pattern product_pricing uses for its nullable country/city
-- pair.
CREATE UNIQUE INDEX IF NOT EXISTS ux_component_price_scope
    ON cyot_component_prices (biomarker_id, country, COALESCE(city_id, ''));

-- Which lab runs what, where, at what cost — CITY-scoped, so "priced here but
-- no lab here" is detectable before an order strands.
CREATE TABLE IF NOT EXISTS biomarker_lab_mappings (
    id                    text PRIMARY KEY,
    biomarker_id          text NOT NULL REFERENCES biomarkers(id) ON DELETE CASCADE,
    lab_id                text NOT NULL,
    country               text NOT NULL,
    city_ids              text[] NOT NULL DEFAULT '{}',
    lab_test_code         text,
    b2b_cost              numeric,
    tat_hours             smallint,
    prescription_required boolean NOT NULL DEFAULT false,
    consent_required      boolean NOT NULL DEFAULT false,
    is_active             boolean NOT NULL DEFAULT true,
    effective_from        date,
    effective_to          date
);
CREATE INDEX IF NOT EXISTS ix_labmap_biomarker ON biomarker_lab_mappings (biomarker_id);

CREATE TABLE IF NOT EXISTS cyot_config (
    country        text PRIMARY KEY,
    min_selections smallint,
    max_selections smallint,
    assembly_fee   numeric,
    is_active      boolean NOT NULL DEFAULT true
);
