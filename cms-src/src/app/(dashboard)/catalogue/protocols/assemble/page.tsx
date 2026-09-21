"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { ApiService } from "@/services/api"
import { DEMO_LISTINGS } from "@/lib/package-demo-catalogue"
import { VARIANT_ATTRIBUTES } from "@/lib/protocol-chain"
import { Assembler } from "@/components/protocol/Assembler"
import { newBlock, newClause, newStep } from "@/lib/protocol-assembly"
import type { Block, Condition, Join, Step, TypeId } from "@/lib/protocol-assembly"
import type { Listing } from "@/types"

/**
 * THE SKETCH, on its own page. The builder itself is a component now, shared
 * with the protocol editor, so this screen is a shell around it: a seeded
 * protocol, a Reset, and nothing that writes to the catalogue.
 */


const cond = (states: string[], join: Join = "and"): Condition => ({
    clauses: states.map((x, i) => newClause(x, i === 0 ? undefined : join)),
})

/** Only the first step of an order has a start to name. The rest derive it. */
const step = (title: string, completes: string[], starts?: string[]): Step => ({
    ...newStep(title),
    starts: starts ? cond(starts) : { clauses: [] },
    completes: cond(completes),
})

const block = (type: TypeId, steps: Step[]): Block => ({ ...newBlock(type), steps })

const seed = (): Block[] => [
    block("blood", [
        /* Nothing sits above the first step, so it is the one that names what
           starts the protocol itself. */
        step("Book your blood test", ["HOMECARE_ASSIGNED", "LAB_ASSIGNED"],
            ["ONBOARDING_COMPLETE", "PAID"]),
        step("Your nurse visit", ["SAMPLE_COLLECTED"]),
        step("Your results are ready", ["RESULTS_UPLOADED"]),
        step("Your coach reads them", ["COACH_REVIEWED"]),
    ]),
    block("consultation", [
        step("Book your call", ["SCHEDULED"]),
        step("Your call", ["NOTES_UPLOADED"]),
    ]),
    block("medicine", [
        step("Prescription check", ["RX_APPROVED"]),
        step("On its way", ["SHIPPED"]),
        step("Delivered", ["DELIVERED"]),
    ]),
]

/* ─────────────────────────────────── Page ────────────────────────────────── */

export default function AssemblePage() {
    const [blocks, setBlocks] = useState<Block[]>(seed)
    const [fetched, setFetched] = useState<Listing[]>([])


    useEffect(() => {
        /* The catalogue reaches the real content service, which answers 401
           without a session. Caught on its own so the picker still works. */
        ApiService.catalogue.listings().then(setFetched).catch(() => setFetched([]))
    }, [])

    const listings = useMemo(() => [...fetched, ...DEMO_LISTINGS], [fetched])
    /* The values a step MAY split into. Every step decides for itself now, with
       the tick beside its own picker, so the sketch offers both and declares
       nothing. */
    const paths = VARIANT_ATTRIBUTES[0].values

    return (
        <div className="mx-auto max-w-7xl space-y-5 p-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <Link href="/catalogue/protocols"
                        className="mb-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-3.5 w-3.5" /> Protocols
                    </Link>
                    <h1 className="text-3xl font-semibold tracking-tight">Assemble a protocol</h1>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setBlocks(seed())}>
                    <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset
                </Button>
            </div>

            <Assembler blocks={blocks} onChange={setBlocks} listings={listings}
                paths={paths} />
        </div>
    )
}
