"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Megaphone,
    Link as LinkIcon,
    UserCircle,
    Globe,
    Plus,
    Search,
    MoreHorizontal,
    TrendingUp,
    Star,
    Handshake,
    Laptop,
    Smartphone
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { ApiService } from "@/services/api"
import { Campaign, Expert, Partner } from "@/types"

export default function GrowthEcosystemPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [experts, setExperts] = useState<Expert[]>([])
    const [partners, setPartners] = useState<Partner[]>([])
    const [promoKeywords, setPromoKeywords] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const [campaignData, expertData, partnerData, searchData] = await Promise.all([
                    ApiService.growth.campaigns.list(),
                    ApiService.growth.experts.list(),
                    (ApiService.growth as any).partners.list(),
                    (ApiService.growth as any).search.promoKeywords()
                ])
                setCampaigns(campaignData)
                setExperts(expertData)
                setPartners(partnerData)
                setPromoKeywords(searchData)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Growth & Ecosystem Center</h2>
                    <p className="text-muted-foreground font-medium">Campaigns, B2B Partners, Expert Network, and SEO Optimization.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Campaign
                </Button>
            </div>

            <Tabs defaultValue="campaigns" className="space-y-4">
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="campaigns">Campaign Manager</TabsTrigger>
                    <TabsTrigger value="partners">Partner Portal</TabsTrigger>
                    <TabsTrigger value="experts">Expert Network</TabsTrigger>
                    <TabsTrigger value="search">Search Optimization</TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Active Campaigns</CardTitle>
                            <CardDescription>Manage discounts, referral codes, and marketing deep links.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Campaign Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Reach</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading campaigns...</TableCell></TableRow>
                                    ) : (
                                        campaigns.map((c) => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-semibold text-slate-700">{c.name}</TableCell>
                                                <TableCell className="capitalize">{c.type}</TableCell>
                                                <TableCell>{c.reach}</TableCell>
                                                <TableCell>
                                                    <Badge className={c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}>
                                                        {c.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="partners">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Strategic Partners</CardTitle>
                                <CardDescription>Managing B2B collaborations and affiliate networks.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                                <Handshake className="mr-2 h-4 w-4" /> Invite Partner
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Partner Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Referral Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading partners...</TableCell></TableRow>
                                    ) : (
                                        partners.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-semibold">{p.name}</TableCell>
                                                <TableCell className="capitalize">{p.type}</TableCell>
                                                <TableCell><code className="bg-slate-100 px-2 py-1 rounded text-primary font-mono text-xs">{p.referralCode}</code></TableCell>
                                                <TableCell>
                                                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="experts" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Expert Directory</CardTitle>
                            <CardDescription>Manage nutritionists, lab techs, and external clinical advisors.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Expert Name</TableHead>
                                        <TableHead>Specialization</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Consultations</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading experts...</TableCell></TableRow>
                                    ) : (
                                        experts.map((e) => (
                                            <TableRow key={e.id}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                                                        {e.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    {e.name}
                                                </TableCell>
                                                <TableCell>{e.specialization}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                        <span className="text-sm font-medium">{e.rating}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{e.consultCount}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="search" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Search Optimization (Promo Keywords)</CardTitle>
                                <CardDescription>Override search results for specific strategic keywords.</CardDescription>
                            </div>
                            <Button size="sm">
                                <Search className="mr-2 h-4 w-4" /> Add Keyword
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Keywords</TableHead>
                                        <TableHead>Redirected Products</TableHead>
                                        <TableHead>Platform</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading keywords...</TableCell></TableRow>
                                    ) : (
                                        promoKeywords.map((pk) => (
                                            <TableRow key={pk.id}>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {pk.keywords.map((k: string, i: number) => (
                                                            <Badge key={i} variant="outline" className="bg-slate-50">{k}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-slate-500">
                                                        {pk.products.join(", ")}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {pk.platform === 'WEB' ? <Laptop className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                                                        <span className="text-xs font-semibold">{pk.platform}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] uppercase">{pk.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
