"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, MapPin, Truck, AlertCircle, ShoppingCart, Globe, Building2, MoreHorizontal, User, Clock } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiService } from "@/services/api"
import { Order, LogisticCenter, Region } from "@/types"

export default function OperationsPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [hubs, setHubs] = useState<LogisticCenter[]>([])
    const [regions, setRegions] = useState<Region[]>([])
    const [bookings, setBookings] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const [orderData, hubData, regionData, bookingData] = await Promise.all([
                    ApiService.operations.orders.list(),
                    ApiService.operations.logistics.list(),
                    ApiService.operations.regions.list(),
                    (ApiService.operations as any).bookings.list()
                ])
                setOrders(orderData)
                setHubs(hubData)
                setRegions(regionData)
                setBookings(bookingData)
            } catch (err) {
                console.error(err)
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
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Operational Engine</h2>
                    <p className="text-muted-foreground font-medium">Fulfillment control center for Orders, Logistics, and Scheduling.</p>
                </div>
            </div>

            <Tabs defaultValue="orders" className="space-y-4">
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="orders">Order Lifecycle</TabsTrigger>
                    <TabsTrigger value="logistics">Logistic Centers</TabsTrigger>
                    <TabsTrigger value="scheduling">Unified Scheduling</TabsTrigger>
                    <TabsTrigger value="regions">Region & Tracking</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-primary/5 border-primary/20 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold">Pending Approvals</CardTitle>
                                <AlertCircle className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">12</div>
                                <p className="text-xs text-muted-foreground mt-1">Requires immediate action</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold">Today's Orders</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{orders.length * 15}</div>
                                <p className="text-xs text-muted-foreground mt-1">+12% vs last week</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Master Order Feed</CardTitle>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/operations/orders">View All Orders</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                                    ) : (
                                        orders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-xs font-bold">{order.orderNumber}</TableCell>
                                                <TableCell>{order.customerName}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {order.items.map((item, i) => (
                                                            <Badge key={i} variant="outline" className="text-[10px] bg-slate-50">{item.name}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        order.status === "pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                                                            order.status === "scheduled" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                                                                "bg-green-100 text-green-800 hover:bg-green-100"
                                                    }>
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-slate-900">${order.total}.00</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logistics" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="col-span-2 shadow-sm">
                            <CardHeader>
                                <CardTitle>Hub Management</CardTitle>
                                <CardDescription>Strategic distribution centers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Hub Name</TableHead>
                                            <TableHead>Region</TableHead>
                                            <TableHead>Capacity</TableHead>
                                            <TableHead>Nurses</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                                        ) : (
                                            hubs.map(hub => (
                                                <TableRow key={hub.id}>
                                                    <TableCell className="font-medium">{hub.name}</TableCell>
                                                    <TableCell>{hub.region}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="capitalize">{hub.capacity}</Badge>
                                                    </TableCell>
                                                    <TableCell>{hub.activeNurses}</TableCell>
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
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Fleet Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-muted-foreground" />
                                        <span>Active Couriers</span>
                                    </div>
                                    <Badge>45</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>Current Clusters</span>
                                    </div>
                                    <Badge variant="outline">12</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="scheduling" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Unified Appointment Grid</CardTitle>
                                <CardDescription>Master schedule for at-home collections and clinical consultations.</CardDescription>
                            </div>
                            <Button size="sm">
                                <Calendar className="mr-2 h-4 w-4" /> Open Calendar
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Time Slot</TableHead>
                                        <TableHead>Assigned Professional</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-10">Loading schedule...</TableCell></TableRow>
                                    ) : (
                                        bookings.map((b) => (
                                            <TableRow key={b.id}>
                                                <TableCell className="font-medium">{b.customer}</TableCell>
                                                <TableCell>{b.service}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Clock className="h-3.3 w-3.5 text-muted-foreground" />
                                                        {b.time}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-slate-400" />
                                                        {b.professional}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                                                        {b.status}
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

                <TabsContent value="regions">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Global Coverage</CardTitle>
                            <CardDescription>Manage regional pricing, taxes, and service availability.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Region Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow>
                                    ) : (
                                        regions.map(region => (
                                            <TableRow key={region.id}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                                    {region.name}
                                                </TableCell>
                                                <TableCell>{region.countryCode}</TableCell>
                                                <TableCell>
                                                    <Badge variant={region.isActive ? "default" : "secondary"}>
                                                        {region.isActive ? "Online" : "Paused"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm">Configure</Button>
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
