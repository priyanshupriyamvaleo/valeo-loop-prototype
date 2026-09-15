"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { UserPlus, MoreHorizontal, User as UserIcon, Shield, Mail, Activity, Stethoscope, FlaskConical, Handshake } from "lucide-react"
import { ApiService } from "@/services/api"
import { User } from "@/types"

export default function UsersPage() {
    const [data, setData] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const items = await ApiService.admin.users.list()
                setData(items)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const renderUserTable = (users: User[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading members...</TableCell></TableRow>
                ) : users.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No members found in this category.</TableCell></TableRow>
                ) : (
                    users.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 text-slate-500 p-2 rounded-lg">
                                        {item.role === 'admin' ? <Shield className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-700">{item.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> {item.email}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize bg-slate-50 font-normal">
                                    {item.role.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge className={item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}>
                                    {item.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {item.lastLogin ? new Date(item.lastLogin).toLocaleDateString() : 'Never'}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )

    const admins = data.filter(u => u.role === 'admin' || u.role === 'crm')
    const clinical = data.filter(u => u.role === 'nutritionist' || u.role === 'external_nutritionist' || u.role === 'lab')
    const partners = data.filter(u => u.role === 'b2b_partner')
    const clients = data.filter(u => u.role === 'client')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Identity & Access</h2>
                    <p className="text-muted-foreground font-medium">Manage administrative roles, clinical staff, and client access.</p>
                </div>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Member
                </Button>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="all">All Members</TabsTrigger>
                    <TabsTrigger value="admins">Administrators</TabsTrigger>
                    <TabsTrigger value="clinical">Clinical / Lab Staff</TabsTrigger>
                    <TabsTrigger value="partners">Partners & HCPs</TabsTrigger>
                    <TabsTrigger value="clients">Clients</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                        <CardHeader>
                            <CardTitle>Unified Directory</CardTitle>
                            <CardDescription>Comprehensive list of everyone in the system.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderUserTable(data)}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="admins" className="space-y-4">
                    <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                        <CardHeader>
                            <CardTitle>Core Administration</CardTitle>
                            <CardDescription>Internal team members with platform management access.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderUserTable(admins)}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="clinical" className="space-y-4">
                    <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                        <CardHeader>
                            <CardTitle>Clinical & Diagnostic Network</CardTitle>
                            <CardDescription>Nutritionists, phlebotomists, and laboratory technicians.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderUserTable(clinical)}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="partners" className="space-y-4">
                    <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                        <CardHeader>
                            <CardTitle>Strategic Ecosystem</CardTitle>
                            <CardDescription>B2B partners, affiliate networks, and clinics.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderUserTable(partners)}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="clients" className="space-y-4">
                    <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                        <CardHeader>
                            <CardTitle>Member Base</CardTitle>
                            <CardDescription>Direct-to-consumer users and patients.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderUserTable(clients)}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
