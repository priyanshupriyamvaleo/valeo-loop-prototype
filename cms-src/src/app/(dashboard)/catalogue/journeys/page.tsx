"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Route, LayoutTemplate } from "lucide-react"
import { ApiService } from "@/services/api"
import { OnboardingBanner } from "@/components/catalogue/OnboardingGuide"
import { Journey } from "@/types"

const KIND_BADGE: Record<Journey["kind"], { label: string; className: string }> = {
    program: { label: "Program", className: "bg-violet-100 text-violet-700 border-violet-200" },
    direct: { label: "Direct", className: "bg-slate-100 text-slate-600 border-slate-200" },
}

export default function JourneysPage() {
    const [journeys, setJourneys] = useState<Journey[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // New-journey dialog state (mock, local only)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [draftNameEn, setDraftNameEn] = useState("")
    const [draftNameAr, setDraftNameAr] = useState("")
    const [draftSlug, setDraftSlug] = useState("")
    const [draftKind, setDraftKind] = useState<Journey["kind"]>("program")

    useEffect(() => {
        const loadData = async () => {
            try {
                const items = await ApiService.catalogue.journeys()
                setJourneys(items)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const toggleActive = (id: string) => {
        setJourneys(prev => prev.map(j => (j.id === id ? { ...j, isActive: !j.isActive } : j)))
    }


    const addJourney = () => {
        if (!draftNameEn.trim()) return
        const newJourney: Journey = {
            id: `jr-${Date.now()}`,
            nameEn: draftNameEn.trim(),
            nameAr: draftNameAr.trim(),
            slug: draftSlug.trim() || draftNameEn.trim().toLowerCase().replace(/\s+/g, "-"),
            kind: draftKind,
            isActive: true,
            listingIds: [],
        }
        setJourneys(prev => [...prev, newJourney])
        setDraftNameEn("")
        setDraftNameAr("")
        setDraftSlug("")
        setDraftKind("program")
        setDialogOpen(false)
    }

    return (
        <div className="space-y-4">
            <OnboardingBanner guide="journey" />
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Journeys</h2>
                    <p className="text-muted-foreground">
                        Top-level context — Programs &amp; Bundles. &ldquo;Direct&rdquo; is the default for standalone buys. A listing may belong to many journeys.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Journey
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Journey</DialogTitle>
                            <DialogDescription>Create a program or bundle context. Mock only — not persisted.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="jr-name-en">Name (English)</Label>
                                <Input id="jr-name-en" value={draftNameEn} onChange={e => setDraftNameEn(e.target.value)} placeholder="e.g. Sleep Reset" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jr-name-ar">Name (Arabic)</Label>
                                <Input id="jr-name-ar" dir="rtl" value={draftNameAr} onChange={e => setDraftNameAr(e.target.value)} placeholder="الاسم بالعربية" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jr-slug">Slug</Label>
                                <Input id="jr-slug" value={draftSlug} onChange={e => setDraftSlug(e.target.value)} placeholder="auto-generated from name" />
                            </div>
                            <div className="space-y-2">
                                <Label>Kind</Label>
                                <Select value={draftKind} onValueChange={v => setDraftKind(v as Journey["kind"])}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="program">Program</SelectItem>
                                        <SelectItem value="direct">Direct</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={addJourney} disabled={!draftNameEn.trim()}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Route className="h-5 w-5 text-muted-foreground" /> All Journeys
                        </CardTitle>
                        <CardDescription>{journeys.length} journeys</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead>Name (EN)</TableHead>
                                <TableHead>Name (AR)</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Kind</TableHead>
                                <TableHead className="text-right"># Listings</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="text-right pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading journeys...</TableCell></TableRow>
                            ) : journeys.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No journeys yet.</TableCell></TableRow>
                            ) : journeys.map((jr) => {
                                const kindMeta = KIND_BADGE[jr.kind]
                                return (
                                    <TableRow key={jr.id}>
                                        <TableCell className="font-medium">{jr.nameEn}</TableCell>
                                        <TableCell dir="rtl" className="text-muted-foreground">{jr.nameAr || "—"}</TableCell>
                                        <TableCell className="font-mono text-xs">{jr.slug}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={kindMeta.className}>{kindMeta.label}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{jr.listingIds.length}</TableCell>
                                        <TableCell>
                                            <Switch checked={jr.isActive} onCheckedChange={() => toggleActive(jr.id)} aria-label="Toggle active" />
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                                                    <Link href={`/catalogue/journeys/${jr.id}`}>
                                                        <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" /> Build page
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
