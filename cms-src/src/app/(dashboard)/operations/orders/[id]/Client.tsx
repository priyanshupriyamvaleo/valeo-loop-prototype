"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
import { ArrowLeft, Mail, Phone } from "lucide-react"
import { ApiService } from "@/services/api"
import { Order } from "@/types"

export default function OrderDetailPage() {
    const params = useParams()
    const id = Array.isArray(params.id) ? params.id[0] : params.id

    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const items = await ApiService.operations.orders.list()
                const found = items.find((o) => o.id === id) ?? items[0] ?? null
                setOrder(found)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [id])

    if (isLoading) return <div>Loading...</div>

    if (!order) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/operations/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
                    </Link>
                </Button>
                <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                    <CardContent className="py-16 text-center text-muted-foreground">
                        Order not found.
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/operations/orders">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">{order.orderNumber}</h2>
                    <Badge className={order.status === "completed" ? "bg-green-100 text-green-800" : order.status === "cancelled" ? "bg-red-100 text-red-800" : order.status === "scheduled" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}>
                        {order.status}
                    </Badge>
                </div>
            </div>

            <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                    <CardDescription>Customer information and order total.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Customer</div>
                        <div className="font-semibold text-slate-700">{order.customerName}</div>
                        {order.customerEmail && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {order.customerEmail}
                            </div>
                        )}
                        {order.customerPhone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {order.customerPhone}
                            </div>
                        )}
                    </div>
                    <div className="space-y-1 sm:text-right">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
                        <div className="text-2xl font-bold text-slate-900">${order.total.toFixed(2)}</div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                    <CardDescription>Products and services in this order.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Type</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.length === 0 ? (
                                <TableRow><TableCell colSpan={2} className="text-center py-10 text-muted-foreground">No items in this order.</TableCell></TableRow>
                            ) : (
                                order.items.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium text-slate-700">{item.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize font-normal bg-slate-50">{item.type}</Badge>
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

