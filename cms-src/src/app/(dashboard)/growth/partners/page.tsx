"use client"

import { useState, useEffect } from "react"
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
import { ApiService } from "@/services/api"
import { Partner } from "@/types"

type TypeFilter = "all" | Partner["type"]

const typeFilters: { label: string; value: TypeFilter }[] = [
    { label: "All Types", value: "all" },
    { label: "Clinic", value: "clinic" },
    { label: "Gym", value: "gym" },
    { label: "Corporate", value: "corporate" },
]

export default function PartnersPage() {
    const [data, setData] = useState<Partner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<TypeFilter>("all")

    useEffect(() => {
        const loadData = async () => {
            try {
                const items = await ApiService.growth.partners.list()
                setData(items)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const filtered = filter === "all" ? data : data.filter((p) => p.type === filter)

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Partner Portal</h2>
                <p className="text-muted-foreground font-medium">Manage clinics, gyms, and corporate referral partners.</p>
            </div>

            <div className="flex gap-2">
                {typeFilters.map((t) => (
                    <Button
                        key={t.value}
                        variant={filter === t.value ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8"
                        onClick={() => setFilter(t.value)}
                    >
                        {t.label}
                    </Button>
                ))}
            </div>

            <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                <CardHeader>
                    <CardTitle>Referral Partners</CardTitle>
                    <CardDescription>Active and pending partners in the growth ecosystem.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Partner</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Referral Code</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Loading partners...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No partners found in this category.</TableCell></TableRow>
                            ) : (
                                filtered.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-slate-700">{item.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize font-normal bg-slate-50">{item.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={item.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.referralCode ? (
                                                <code className="text-xs font-medium bg-slate-100 px-2 py-1 rounded">{item.referralCode}</code>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
