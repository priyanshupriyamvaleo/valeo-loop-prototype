"use client"

import { useState, useEffect } from "react"
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
import { Plus, Handshake, Search } from "lucide-react"
import { ApiService } from "@/services/api"
import { OnboardingBanner } from "@/components/catalogue/OnboardingGuide"
import { CataloguePartner, PartnerType } from "@/types"

const TYPE_META: Record<PartnerType, { label: string; className: string }> = {
    b2b_client: { label: "B2B Client", className: "bg-sky-100 text-sky-700 border-sky-200" },
    corporate: { label: "Corporate", className: "bg-violet-100 text-violet-700 border-violet-200" },
    external: { label: "External", className: "bg-amber-100 text-amber-700 border-amber-200" },
}

const PARTNER_TYPES: PartnerType[] = ["b2b_client", "corporate", "external"]

export default function PartnersPage() {
    const [partners, setPartners] = useState<CataloguePartner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")

    // New-partner dialog state (mock, local only)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [draftCode, setDraftCode] = useState("")
    const [draftName, setDraftName] = useState("")
    const [draftEmail, setDraftEmail] = useState("")
    const [draftContact, setDraftContact] = useState("")
    const [draftType, setDraftType] = useState<PartnerType>("b2b_client")
    const [draftActive, setDraftActive] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const list = await ApiService.catalogue.partners()
                setPartners(list)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const toggleActive = (id: string) => {
        setPartners(prev => prev.map(p => (p.id === id ? { ...p, isActive: !p.isActive } : p)))
    }


    const addPartner = () => {
        if (!draftName.trim() || !draftCode.trim()) return
        const newPartner: CataloguePartner = {
            id: `pt-${Date.now()}`,
            code: draftCode.trim().toUpperCase(),
            name: draftName.trim(),
            email: draftEmail.trim() || undefined,
            contactPerson: draftContact.trim() || undefined,
            partnerType: draftType,
            isActive: draftActive,
        }
        setPartners(prev => [...prev, newPartner])
        setDraftCode("")
        setDraftName("")
        setDraftEmail("")
        setDraftContact("")
        setDraftType("b2b_client")
        setDraftActive(true)
        setDialogOpen(false)
    }

    const q = search.trim().toLowerCase()
    const filtered = partners.filter(p =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.contactPerson ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q)
    )

    return (
        <div className="space-y-4">
            <OnboardingBanner guide="partner" />
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Partners</h2>
                    <p className="text-muted-foreground">
                        B2B / corporate / external partners with catalogue access.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Partner
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Partner</DialogTitle>
                            <DialogDescription>Register a B2B / corporate / external partner. Mock only — not persisted.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pt-code">Code</Label>
                                    <Input id="pt-code" value={draftCode} onChange={e => setDraftCode(e.target.value)} placeholder="e.g. NOON" className="font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={draftType} onValueChange={v => setDraftType(v as PartnerType)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PARTNER_TYPES.map(t => (
                                                <SelectItem key={t} value={t}>{TYPE_META[t].label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pt-name">Name</Label>
                                <Input id="pt-name" value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="e.g. Noon Health" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pt-contact">Contact person</Label>
                                    <Input id="pt-contact" value={draftContact} onChange={e => setDraftContact(e.target.value)} placeholder="e.g. Sara K." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pt-email">Email</Label>
                                    <Input id="pt-email" type="email" value={draftEmail} onChange={e => setDraftEmail(e.target.value)} placeholder="b2b@partner.com" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                <Label className="cursor-pointer">Active</Label>
                                <Switch checked={draftActive} onCheckedChange={setDraftActive} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={addPartner} disabled={!draftName.trim() || !draftCode.trim()}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Handshake className="h-5 w-5 text-muted-foreground" /> All Partners
                        </CardTitle>
                        <CardDescription>{filtered.length} of {partners.length} partners</CardDescription>
                    </div>
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search partners…"
                            className="pl-8 h-9"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Contact person</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Active</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading partners...</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No partners match your search.</TableCell></TableRow>
                                ) : filtered.map((p) => {
                                    const typeMeta = TYPE_META[p.partnerType]
                                    return (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-mono text-xs">{p.code}</TableCell>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={typeMeta.className}>{typeMeta.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">{p.contactPerson ?? "—"}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{p.email ?? "—"}</TableCell>
                                            <TableCell>
                                                <Switch checked={p.isActive} onCheckedChange={() => toggleActive(p.id)} aria-label="Toggle active" />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
