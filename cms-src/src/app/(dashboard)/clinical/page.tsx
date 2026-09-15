"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Activity,
    ClipboardList,
    UserCircle,
    Zap,
    Plus,
    Search,
    MoreHorizontal,
    TrendingUp,
    Users
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
import { Survey, HealthProfile, ScoringRule } from "@/types"
import Link from "next/link"

export default function ClinicalCorePage() {
    const [surveys, setSurveys] = useState<Survey[]>([])
    const [profiles, setProfiles] = useState<HealthProfile[]>([])
    const [scoringRules, setScoringRules] = useState<ScoringRule[]>([])
    const [programs, setPrograms] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const [surveyData, profileData, scoringData, programData] = await Promise.all([
                    ApiService.clinical.surveys.list(),
                    ApiService.clinical.profiles.list(),
                    ApiService.clinical.scoring.list(),
                    (ApiService.clinical as any).programs.list()
                ])
                setSurveys(surveyData)
                setProfiles(profileData)
                setScoringRules(scoringData)
                setPrograms(programData)
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
                    <h2 className="text-3xl font-bold tracking-tight">Clinical & Health Intelligence</h2>
                    <p className="text-muted-foreground">Unified survey engine, scoring logic, and user health profiles.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Questionnaire
                </Button>
            </div>

            <Tabs defaultValue="surveys" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="surveys">Survey Engine</TabsTrigger>
                    <TabsTrigger value="profiles">Health Profiles</TabsTrigger>
                    <TabsTrigger value="logic">Logic & Scoring</TabsTrigger>
                    <TabsTrigger value="programs">Specialized Programs</TabsTrigger>
                </TabsList>

                <TabsContent value="surveys" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Questionnaire Builder</CardTitle>
                            <CardDescription>Manage reusable medical, lifestyle, and feedback assessments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Questions</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                                    ) : (
                                        surveys.map((s) => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-medium">
                                                    <Link href={`/clinical/surveys/${s.id}`} className="hover:underline">{s.title}</Link>
                                                </TableCell>
                                                <TableCell className="capitalize">{s.type}</TableCell>
                                                <TableCell>{s.questionCount}</TableCell>
                                                <TableCell>
                                                    <Badge variant={s.status === "published" ? "default" : "secondary"}>
                                                        {s.status}
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

                <TabsContent value="profiles">
                    <Card>
                        <CardHeader>
                            <CardTitle>Universal Health Profiles</CardTitle>
                            <CardDescription>360-degree view combining survey results and lab data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Biotype</TableHead>
                                        <TableHead>Longevity Score</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                                    ) : (
                                        profiles.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-medium">{p.userName}</TableCell>
                                                <TableCell>{p.biotype || "N/A"}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="h-4 w-4 text-primary" />
                                                        {p.longevityScore || "Calculating..."}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{p.completionRate}%</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" className="text-xs">View Insights</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logic">
                    <Card>
                        <CardHeader>
                            <CardTitle>Scoring Parameters</CardTitle>
                            <CardDescription>Health thresholds and algorithm weights.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rule Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Weight</TableHead>
                                        <TableHead>Threshold</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                                    ) : (
                                        scoringRules.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">{r.name}</TableCell>
                                                <TableCell className="capitalize">{r.category}</TableCell>
                                                <TableCell>{r.weight}%</TableCell>
                                                <TableCell className="font-mono text-xs">{r.thresholds}</TableCell>
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

                <TabsContent value="programs" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Active Health Programs</CardTitle>
                                <CardDescription>Manage guided health journeys and enrollment.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                                <TrendingUp className="mr-2 h-4 w-4" /> Analytics
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Program Name</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Enrolled Users</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                                    ) : (
                                        programs.map((pg) => (
                                            <TableRow key={pg.id}>
                                                <TableCell className="font-medium">{pg.name}</TableCell>
                                                <TableCell>{pg.duration}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        {pg.enrollment}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="default">{pg.status}</Badge>
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
