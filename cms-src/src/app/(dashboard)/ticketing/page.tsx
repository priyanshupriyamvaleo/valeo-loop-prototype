"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Ticket,
    MessageSquare,
    Clock,
    AlertCircle,
    CheckCircle2,
    Plus,
    MoreHorizontal,
    Search,
    User,
    Headset
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

export default function TicketingPage() {
    const [tickets, setTickets] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await ApiService.support.tickets.list()
                setTickets(data)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const openTickets = tickets.filter((t) => t.status === "open")
    const phlebotomyTickets = tickets.filter((t) =>
        `${t.subject ?? ""} ${t.category ?? ""}`.toLowerCase().includes("phlebot")
    )
    const clinicalTickets = tickets.filter((t) =>
        `${t.subject ?? ""} ${t.category ?? ""}`.toLowerCase().match(/clinic|clinical|consultant|doctor|medical/)
    )

    const renderTicketTable = (title: string, description: string, rows: any[]) => (
        <Card className="shadow-sm border-0 ring-1 ring-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticket ID</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Requester</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading tickets...</TableCell></TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No tickets in this queue.</TableCell></TableRow>
                        ) : (
                            rows.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-mono text-xs font-bold text-slate-500 uppercase">{t.id}</TableCell>
                                    <TableCell className="font-medium text-slate-700">{t.subject}</TableCell>
                                    <TableCell>
                                        <Badge className={
                                            t.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                                                t.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                        }>
                                            {t.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{t.user}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                {t.assignedTo.split(' ').map((n: string) => n[0]).join('')}
                                            </div>
                                            <span className="text-sm">{t.assignedTo}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {t.status === 'resolved' ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-amber-500" />
                                            )}
                                            <span className="capitalize">{t.status}</span>
                                        </div>
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
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Support & Concierge</h2>
                    <p className="text-muted-foreground font-medium">Managing patient inquiries, phlebotomy logistics, and clinical questions.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Ticket
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: "Open Tickets", val: "24", sub: "8 high priority", icon: Ticket, color: "text-rose-600", bg: "bg-rose-50" },
                    { title: "Avg Resolution", val: "4.2h", sub: "-15% from last week", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: "CSAT Score", val: "4.8/5", sub: "Based on 120 reviews", icon: Headset, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { title: "Pending Phlebotomy", val: "12", sub: "Awaiting dockets", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((stat, i) => (
                    <Card key={i} className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`${stat.bg} p-2 rounded-lg`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.val}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="all">Recent Tickets</TabsTrigger>
                    <TabsTrigger value="open">Open Inquiries</TabsTrigger>
                    <TabsTrigger value="phlebotomy">Phlebotomy Issues</TabsTrigger>
                    <TabsTrigger value="clinical">Clinical Consultant</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {renderTicketTable("Universal Ticket Queue", "Managing all support requests and concierge tasks.", tickets)}
                </TabsContent>

                <TabsContent value="open" className="space-y-4">
                    {renderTicketTable("Open Inquiries", "Tickets that are still awaiting resolution.", openTickets)}
                </TabsContent>

                <TabsContent value="phlebotomy" className="space-y-4">
                    {renderTicketTable("Phlebotomy Issues", "Requests related to sample collection and phlebotomy logistics.", phlebotomyTickets)}
                </TabsContent>

                <TabsContent value="clinical" className="space-y-4">
                    {renderTicketTable("Clinical Consultant", "Clinical and medical consultation requests.", clinicalTickets)}
                </TabsContent>
            </Tabs>
        </div>
    )
}
