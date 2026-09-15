"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Plus, Repeat, Pencil } from "lucide-react"
import { ApiService } from "@/services/api"
import { OnboardingBanner } from "@/components/catalogue/OnboardingGuide"
import { RetentionTemplate } from "@/types"

export default function RetentionLibraryPage() {
    const router = useRouter()
    const [templates, setTemplates] = useState<RetentionTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                setTemplates(await ApiService.catalogue.retentionTemplates())
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const createNew = async () => {
        setCreating(true)
        try {
            const created = await ApiService.catalogue.createRetentionTemplate({ name: "Untitled Retention" })
            router.push(`/catalogue/retention/${created.id}`)
        } catch {
            setCreating(false)
        }
    }

    return (
        <div className="space-y-4">
            <OnboardingBanner guide="retention" />
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Retention</h2>
                    <p className="text-muted-foreground">
                        Build reusable retention pages and attach them to journeys.
                    </p>
                </div>
                <Button onClick={createNew} disabled={creating}>
                    <Plus className="mr-2 h-4 w-4" /> {creating ? "Creating…" : "New retention page"}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Repeat className="h-5 w-5 text-muted-foreground" /> Retention pages
                    </CardTitle>
                    <CardDescription>{templates.length} template{templates.length === 1 ? "" : "s"}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Sections</TableHead>
                                <TableHead className="text-right">Active</TableHead>
                                <TableHead className="text-right pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Loading retention pages…</TableCell></TableRow>
                            ) : templates.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No retention pages yet.</TableCell></TableRow>
                            ) : templates.map(t => {
                                const activeCount = t.sections.filter(s => s.enabled).length
                                return (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.name}</TableCell>
                                        <TableCell className="max-w-md text-muted-foreground">{t.descriptionEn || "—"}</TableCell>
                                        <TableCell className="text-right tabular-nums">{t.sections.length}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="tabular-nums">{activeCount}/{t.sections.length}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                                                <Link href={`/catalogue/retention/${t.id}`}>
                                                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                                                </Link>
                                            </Button>
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
