"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { CHILD_TYPES } from "@/lib/protocol-assembly"
import { stepMapStore, useStepMap } from "@/lib/step-mapping-store"
import { TypeStepEditor } from "@/components/protocol/TypeStepEditor"
import { useHydrated } from "@/lib/protocol-plans"

/**
 * STEP MAPPING — the steps of an order type, written once.
 *
 * Every protocol used to write its own. Four protocols meant four
 * descriptions of one blood draw, in four sets of words, and nothing could
 * tell you they were the same journey. They are the same journey: a blood
 * order reports the same thirteen states whoever ordered it.
 *
 * So the words and the conditions live here, and a protocol maps packages.
 *
 * WHAT A PROTOCOL STILL DECIDES: which packages, in what order, which exact
 * product, and whether that product differs by sex. What runs before an order
 * is a property of the sequence, so the derived start of a first step is shown
 * on the protocol and not here.
 */
export default function StepMappingPage() {
    const hydrated = useHydrated()
    const map = useStepMap()
    /* One open at a time. Four expanded condition editors is a page nobody can
       read, and the question being answered is always about one journey. */
    const [open, setOpen] = useState<string | null>(CHILD_TYPES[0]?.id ?? null)

    const total = CHILD_TYPES.reduce((n, t) => n + (map[t.id]?.length ?? 0), 0)

    return (
        <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Link href="/catalogue/protocols"
                        className="mb-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                        Protocols
                    </Link>
                    <h2 className="text-xl font-semibold">Step Mapping</h2>
                    <p className="max-w-3xl text-sm text-muted-foreground">
                        What a patient is shown while an order runs, and the statuses that move it
                        on. Written once for each package type and used by every protocol that
                        orders one, so two protocols cannot describe one journey differently.
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => stepMapStore.reset()}>
                    <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset to the example
                </Button>
            </div>

            {!hydrated ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (
                <>
                    <div className="space-y-3">
                        {CHILD_TYPES.map(t => (
                            <TypeStepEditor key={t.id} type={t.id}
                                steps={map[t.id] ?? []}
                                open={open === t.id}
                                onToggle={() => setOpen(open === t.id ? null : t.id)} />
                        ))}
                    </div>

                    <p className="max-w-3xl text-xs text-muted-foreground">
                        {total} step{total === 1 ? "" : "s"} across {CHILD_TYPES.length} package
                        types. A protocol that orders the same package twice runs these same steps
                        both times — the same package always runs the same journey, and the two are
                        told apart by where they sit and by the order&rsquo;s own week.
                    </p>
                </>
            )}
        </div>
    )
}
