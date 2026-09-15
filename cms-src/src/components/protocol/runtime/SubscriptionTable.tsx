"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { AlertCircle, FileJson, FileText, Table2 } from "lucide-react"
import {
    openQuestions, runtimeContract, subscriptionRows, subscriptionTsv,
} from "@/lib/protocol-runtime-export"
import { runtimeFindings } from "@/lib/protocol-runtime"
import type { Listing, Protocol } from "@/types"

/**
 * THE HAND-OFF, ON SCREEN.
 *
 * The user's own reason for this feature: *"so that I can explain to tech team
 * the requirements."* So the screen is a review surface, not a form. One row
 * per step, because the question is "is this row right?", asked once per step
 * by somebody who knows ops and not TypeScript.
 *
 * THREE ARTEFACTS, because three different people read them and no one format
 * serves all three. The JSON is the contract a backend engineer implements.
 * The table is what goes in the ticket. The questions are the risk register,
 * and they are the ones that save the project.
 */
export function SubscriptionTable({
    protocol, listings, pathId, pathLabel,
}: {
    protocol: Protocol
    listings: Listing[]
    pathId?: string
    pathLabel?: string
}) {
    /* The clipboard is refused often enough that a button which only tries it is
       a button that sometimes does nothing. A refusal opens the text to select
       by hand — and seeing what you are about to hand a team is no loss. */
    const [shown, setShown] = useState<{ title: string; body: string } | null>(null)

    const rows = subscriptionRows(protocol, listings, pathId)
    const findings = runtimeFindings(protocol, listings)

    const hand = (title: string, body: string) => {
        if (!navigator.clipboard) { setShown({ title, body }); return }
        navigator.clipboard.writeText(body).then(
            () => toast.success("Copied.", { description: `${title} is on the clipboard.` }),
            () => setShown({ title, body }),
        )
    }

    const onlyCompleted = rows.filter(r => r.completesOn === "Order Completed").length
    const stalled = rows.filter(r => r.completesOn === "— nothing").length

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium">
                        What the order service has to tell us
                        {pathLabel ? ` · ${pathLabel}` : ""}
                    </p>
                    <p className="max-w-2xl text-xs text-muted-foreground">
                        One row per step. This is the review surface: read down it and ask whether
                        each row is right. The three buttons hand the same thing to a tech team as
                        a contract, a table and a list of questions.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm"
                        onClick={() => hand("The contract",
                            JSON.stringify(runtimeContract(protocol, listings, pathId), null, 2))}>
                        <FileJson className="mr-2 h-3.5 w-3.5" /> Contract
                    </Button>
                    <Button variant="outline" size="sm"
                        onClick={() => hand("The subscription table", subscriptionTsv(rows))}>
                        <Table2 className="mr-2 h-3.5 w-3.5" /> Table
                    </Button>
                    <Button variant="outline" size="sm"
                        onClick={() => hand("The open questions",
                            openQuestions(protocol, listings, pathId))}>
                        <FileText className="mr-2 h-3.5 w-3.5" /> Open questions
                    </Button>
                </div>
            </div>

            {/* THE TWO SENTENCES THE TECH TEAM MOST NEEDS, counted rather than
                asserted. Both are facts about the live system, not about this
                protocol's authoring. */}
            <div className="flex flex-wrap gap-2">
                {stalled > 0 && (
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800">
                        {stalled} step{stalled === 1 ? "" : "s"} nothing can finish
                    </Badge>
                )}
                {onlyCompleted > 0 && (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                        {onlyCompleted} step{onlyCompleted === 1 ? "" : "s"} can only see
                        {" "}&ldquo;Order Completed&rdquo;
                    </Badge>
                )}
                <Badge variant="outline" className="text-[11px]">
                    {(protocol.fulfilments ?? []).length} orders · {rows.length} steps
                </Badge>
            </div>

            {onlyCompleted > 0 && (
                <Card className="border-amber-200 bg-amber-50/60 p-3">
                    <p className="flex items-start gap-2 text-xs text-amber-900">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>
                            <b>There is no consultation outcome anywhere in the live system.</b> No
                            consult status, no eligibility field, nothing that records &ldquo;continue
                            as planned&rdquo;. So {onlyCompleted} of these steps can only be told
                            that the call happened, never what was decided. It is the first item
                            under Build in the open questions.
                        </span>
                    </p>
                </Card>
            )}

            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="w-10 text-xs">#</TableHead>
                                <TableHead className="text-xs">Step</TableHead>
                                <TableHead className="text-xs">Watches</TableHead>
                                <TableHead className="text-xs">Field</TableHead>
                                <TableHead className="text-xs">Completes on</TableHead>
                                <TableHead className="text-xs">Retries on</TableHead>
                                <TableHead className="text-xs">Patient reads</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map(r => {
                                const bad = r.completesOn === "— nothing"
                                return (
                                    <TableRow key={r.n}
                                        className={bad ? "bg-rose-50/60" : "hover:bg-muted/20"}>
                                        <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground">
                                            {r.n}
                                        </TableCell>
                                        <TableCell className="py-2.5 text-sm font-medium">{r.step}</TableCell>
                                        <TableCell className="py-2.5 text-xs text-muted-foreground">
                                            {r.watches}
                                        </TableCell>
                                        <TableCell className="py-2.5 text-xs text-muted-foreground">
                                            {r.field}
                                        </TableCell>
                                        <TableCell className={`py-2.5 text-xs ${bad ? "font-medium text-rose-800" : ""}`}>
                                            {r.completesOn}
                                        </TableCell>
                                        <TableCell className="py-2.5 text-xs text-muted-foreground">
                                            {r.retriesOn}
                                        </TableCell>
                                        <TableCell className="max-w-[220px] py-2.5 text-xs text-muted-foreground">
                                            {r.patientReads}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {findings.errors.length > 0 && (
                <Card className="border-rose-200 bg-rose-50/60 p-4">
                    <p className="text-sm font-medium text-rose-900">
                        {findings.errors.length} thing{findings.errors.length === 1 ? "" : "s"}{" "}
                        stop this protocol running
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-rose-900">
                        {findings.errors.map((g, i) => (
                            <li key={i}><b>{g.what}.</b> <span className="text-rose-800">{g.why}</span></li>
                        ))}
                    </ul>
                </Card>
            )}

            {findings.notes.length > 0 && (
                <Card className="p-4">
                    <p className="text-sm font-medium">
                        {findings.notes.length} thing{findings.notes.length === 1 ? "" : "s"} worth
                        knowing, which do not stop it
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {findings.notes.map((g, i) => (
                            <li key={i}><b className="text-foreground">{g.what}.</b> {g.why}</li>
                        ))}
                    </ul>
                </Card>
            )}

            <Dialog open={!!shown} onOpenChange={o => { if (!o) setShown(null) }}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{shown?.title}</DialogTitle>
                        <DialogDescription>
                            This browser refused the clipboard, so here it is. Select it all and
                            copy it by hand.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea readOnly value={shown?.body ?? ""} rows={18}
                        className="font-mono text-[11px] leading-relaxed"
                        onFocus={e => e.currentTarget.select()} />
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setShown(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <p className="text-xs text-muted-foreground">
                Every status here is mirrored from the live admin panel, and the mirror carries
                whether anything can actually set each one. The allowed transitions are NOT here,
                because they live behind the order service — the console reads the allowed set per
                child order and renders it. The contract says so out loud under Confirm.
            </p>
        </div>
    )
}
