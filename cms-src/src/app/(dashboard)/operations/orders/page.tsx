"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Search, Filter, MoreHorizontal, ArrowLeft, ArrowUpRight } from "lucide-react"

import { ApiService } from "@/services/api"
import { Order } from "@/types"
import { useState, useEffect } from "react"

export default function OrdersPage() {
    const [data, setData] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            const items = await ApiService.operations.orders.list()
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
                        <Link href="/operations">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Active Orders</h2>
                        <p className="text-muted-foreground">Manage fulfillment for tests, products, and subscriptions.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <ArrowUpRight className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between py-4">
                <div className="flex gap-2 w-full max-w-lg">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search by Order ID, Name, Phone..." className="pl-8" />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex gap-2">
                    {['All Status', 'Pending', 'Scheduled', 'Completed'].map(status => (
                        <Button key={status} variant={status === 'All Status' ? 'secondary' : 'ghost'} size="sm" className="h-8">
                            {status}
                        </Button>
                    ))}
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-xs">
                                        <Link href={`/operations/orders/${item.id}`} className="hover:underline text-primary">
                                            {item.orderNumber}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{item.customerName}</span>
                                            {item.customerPhone && <span className="text-xs text-muted-foreground">{item.customerPhone}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {item.items.map((i, idx) => (
                                            <Badge key={idx} variant="outline" className="font-normal mr-1">{i.name}</Badge>
                                        ))}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={item.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
