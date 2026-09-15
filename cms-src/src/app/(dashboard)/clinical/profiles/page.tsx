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
import { HealthProfile } from "@/types"

export default function HealthProfilesPage() {
    const [data, setData] = useState<HealthProfile[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const items = await ApiService.clinical.profiles.list()
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
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Health Profiles</h2>
                <p className="text-muted-foreground font-medium">Track assessment completion, biotypes, and longevity scoring across members.</p>
            </div>

            <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                <CardHeader>
                    <CardTitle>Member Profiles</CardTitle>
                    <CardDescription>Clinical intake progress and derived health metrics.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Completion %</TableHead>
                                <TableHead>Biotype</TableHead>
                                <TableHead>Longevity Score</TableHead>
                                <TableHead>Last Assessment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading profiles...</TableCell></TableRow>
                            ) : data.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No health profiles found.</TableCell></TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-slate-700">{item.userName}</TableCell>
                                        <TableCell>
                                            <Badge className={item.completionRate >= 75 ? "bg-green-100 text-green-800" : item.completionRate >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                                                {item.completionRate}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.biotype ? (
                                                <Badge variant="outline" className="font-normal bg-slate-50">{item.biotype}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {item.longevityScore !== undefined ? item.longevityScore : <span className="text-muted-foreground font-normal">—</span>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(item.lastAssessment).toLocaleDateString()}
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
