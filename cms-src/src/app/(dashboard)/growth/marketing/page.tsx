"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, MoreHorizontal, Megaphone, ArrowLeft, Calendar } from "lucide-react"

import { ApiService } from "@/services/api"
import { Campaign } from "@/types"
import { useState, useEffect } from "react"

export default function MarketingPage() {
    const [data, setData] = useState<Campaign[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            const items = await ApiService.growth.campaigns.list()
            setData(items)
            setIsLoading(false)
        }
        loadData()
    }, [])

    if (isLoading) return <div>Loading...</div>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/growth">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h2>
                        <p className="text-muted-foreground">Manage ongoing promotions and user engagement.</p>
                    </div>
                </div>
                <Button asChild>
                    <Link href="/growth/marketing/new">
                        <Plus className="mr-2 h-4 w-4" /> Create Campaign
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Campaigns</CardTitle>
                    <CardDescription>Track performance and schedule new initiatives.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Campaign Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Reach</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Megaphone className="h-4 w-4 text-muted-foreground" />
                                            <Link href={`/growth/marketing/${item.id}`} className="hover:underline">
                                                {item.name}
                                            </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">{item.type}</TableCell>
                                    <TableCell>{item.reach}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {item.endDate || item.startDate}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
