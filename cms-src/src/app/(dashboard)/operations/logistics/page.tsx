"use client"

import { useState, useEffect } from "react"
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
import { LogisticCenter } from "@/types"

const capacityStyles: Record<LogisticCenter["capacity"], string> = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-red-100 text-red-800",
}

export default function LogisticsPage() {
    const [data, setData] = useState<LogisticCenter[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const items = await ApiService.operations.logistics.list()
                setData(items)
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
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Logistic Centers</h2>
                <p className="text-muted-foreground font-medium">Monitor regional fulfillment hubs, capacity, and nursing coverage.</p>
            </div>

            <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                <CardHeader>
                    <CardTitle>Regional Hubs</CardTitle>
                    <CardDescription>Active logistic centers across operating regions.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Center</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead className="text-right">Active Nurses</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Loading centers...</TableCell></TableRow>
                            ) : data.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No logistic centers found.</TableCell></TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-slate-700">{item.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{item.region}</TableCell>
                                        <TableCell>
                                            <Badge className={`capitalize ${capacityStyles[item.capacity]}`}>{item.capacity}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{item.activeNurses}</TableCell>
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
