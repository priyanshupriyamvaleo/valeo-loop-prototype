// ── The Generate button, as the server sees it ────────────────
//
// Pressing "Create N missing variants" used to build N objects in local React state
// and call nothing. The server generated separately, later, during save — from
// whatever `variant_axes` held rather than from the eight rows on screen. So the grid
// was a PREDICTION, and it agreed with reality only by coincidence.
//
// Two calls, in this order, and the order is not negotiable: the axes live in local
// state until they are written, and POST /variants generates from what the SERVER has.
// Generating first would build from a stale — or empty — declaration.

import { ApiError } from "./client"
import { axesToOptions } from "./hydrate"
import { toVariantAxes } from "./mapper"
import { generateVariants as postGenerate, getVariantAxes, getVariants, putVariantAxes } from "./products"
import type { VariantAxesResponse, VariantResponse } from "./types"
import type { Listing, VariantOption } from "@/types"

export interface GenerateOutcome {
    ok: boolean
    /** The service's own words when it refuses — these name the axis, so do not replace them. */
    error?: string
    code?: string
    /** The field the refusal points at, when it names one. */
    field?: string
    /** The server's axes after the write — carries the ids the next save must send back. */
    options?: VariantOption[]
    /** What the server actually built. */
    variants?: VariantResponse[]
    axes?: VariantAxesResponse
}

/**
 * Writes the declaration, asks the server to generate, and reads back what it built.
 *
 * <p>Aborts if the write fails rather than generating against whatever the server happens to
 * hold — that is the difference between "your eight combinations" and "eight combinations".
 */
export async function generateOnServer(
    productId: number,
    listing: Listing,
): Promise<GenerateOutcome> {
    // 1. persist the declaration
    try {
        await putVariantAxes(productId, toVariantAxes(listing))
    } catch (e) {
        return fail(e, "The axes could not be saved, so nothing was generated.")
    }

    // 2. generate — idempotent, creates only what is missing, so a double click is a no-op
    try {
        await postGenerate(productId)
    } catch (e) {
        // The refusals are the useful part: MANDATORY_AXIS_MISSING names the axis code a family
        // requires, AXIS_WITHOUT_VALUES names the empty one, MIXED_VARIANT_MODEL means a
        // zero-axis variant already exists, TOO_MANY_VARIANTS carries the count and the cap.
        // Showing a generic "could not generate" throws all of that away.
        return fail(e, "The variants could not be generated.")
    }

    // 3. read back the truth — ids included, because the next save merges on them
    try {
        const [axes, variants] = await Promise.all([
            getVariantAxes(productId),
            getVariants(productId),
        ])
        return { ok: true, options: axesToOptions(axes), variants, axes }
    } catch (e) {
        // Generation SUCCEEDED; only the read back failed. Saying otherwise would invite a
        // second press against rows that already exist.
        return {
            ok: true,
            error: `Variants were created, but could not be read back: ${message(e)}`,
        }
    }
}

function fail(e: unknown, fallback: string): GenerateOutcome {
    if (e instanceof ApiError) {
        return { ok: false, error: e.message, code: e.code, field: e.details[0]?.field }
    }
    return { ok: false, error: `${fallback} ${message(e)}`.trim() }
}

const message = (e: unknown) =>
    e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Unexpected error."
