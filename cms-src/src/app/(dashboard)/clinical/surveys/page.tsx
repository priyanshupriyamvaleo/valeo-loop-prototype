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
import { Plus, MoreHorizontal, FileText, ArrowLeft } from "lucide-react"

import { ApiService } from "@/services/api"
import { Survey } from "@/types"
import { useState, useEffect } from "react"

export default function SurveysPage() {
    const [data, setData] = useState<Survey[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            const items = await ApiService.clinical.surveys.list()
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
                        <Link href="/clinical">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Survey Engine</h2>
                        <p className="text-muted-foreground">Manage and version all health questionnaires.</p>
                    </div>
                </div>
                <Button asChild>
                    <Link href="/clinical/surveys/new">
                        <Plus className="mr-2 h-4 w-4" /> Create Survey
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Surveys</CardTitle>
                    <CardDescription>Centralized repository of all assessment forms.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Question Count</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <Link href={`/clinical/surveys/${item.id}`} className="hover:underline">
                                                {item.title}
                                            </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">{item.type}</TableCell>
                                    <TableCell>{item.questionCount}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.status === "published" ? "default" : "secondary"}>{item.status}</Badge>
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
