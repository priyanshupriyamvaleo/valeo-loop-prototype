"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Settings,
    Globe,
    Bell,
    Lock,
    Smartphone,
    Database,
    Save
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const notificationPrefs = [
    { key: "emailOrders", label: "Email order updates", description: "Send an email each time an order status changes." },
    { key: "smsDelivery", label: "SMS delivery alerts", description: "Text patients when a phlebotomist is en route." },
    { key: "weeklyDigest", label: "Weekly digest", description: "A Monday summary of key platform metrics." },
    { key: "productAnnouncements", label: "Product announcements", description: "Notify admins about new features and releases." },
] as const

export default function SettingsPage() {
    const [notifications, setNotifications] = useState<Record<string, boolean>>({
        emailOrders: true,
        smsDelivery: true,
        weeklyDigest: false,
        productAnnouncements: true,
    })

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Platform Settings</h2>
                <p className="text-muted-foreground">Global configuration for mobile apps, web portals, and integrations.</p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="general" className="data-[state=active]:bg-white">General</TabsTrigger>
                    <TabsTrigger value="localization" className="data-[state=active]:bg-white">Localization</TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-white">Notifications</TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-white">Security</TabsTrigger>
                    <TabsTrigger value="mobile" className="data-[state=active]:bg-white">Mobile Apps</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Core Configuration</CardTitle>
                            <CardDescription>Fundamental platform settings and identifiers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Platform Name</Label>
                                    <Input defaultValue="Valeo Admin Core" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Support Email</Label>
                                    <Input defaultValue="support@valeo.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>API Base URL</Label>
                                <Input defaultValue="https://api.valeo.com/v2" />
                            </div>
                            <Button className="mt-2">
                                <Save className="mr-2 h-4 w-4" /> Save General Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="localization" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Regional Settings</CardTitle>
                            <CardDescription>Manage currency, timezone, and language defaults.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Default Currency</Label>
                                    <Select defaultValue="AED">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                                            <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Base Language</Label>
                                    <Select defaultValue="en">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English (UK)</SelectItem>
                                            <SelectItem value="ar">Arabic (Modern Standard)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Choose which alerts and summaries are delivered.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {notificationPrefs.map((pref) => (
                                <div key={pref.key} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-medium">{pref.label}</div>
                                        <div className="text-xs text-muted-foreground">{pref.description}</div>
                                    </div>
                                    <Switch
                                        checked={notifications[pref.key]}
                                        onCheckedChange={(checked) =>
                                            setNotifications((prev) => ({ ...prev, [pref.key]: checked }))
                                        }
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Access Controls</CardTitle>
                            <CardDescription>RBAC policies and authentication settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <div className="text-sm font-medium">Two-Factor Authentication</div>
                                    <div className="text-xs text-muted-foreground">Require 2FA for all administrative accounts.</div>
                                </div>
                                <div className="h-6 w-11 rounded-full bg-primary relative cursor-pointer">
                                    <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="mobile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mobile App Sync</CardTitle>
                            <CardDescription>Configuration for iOS and Android experience.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 border rounded-lg space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Smartphone className="h-4 w-4" /> iOS Bundle
                                    </div>
                                    <div className="text-sm text-muted-foreground">Version: 2.4.1 (Stable)</div>
                                    <Button variant="outline" size="sm" className="w-full">Rollback</Button>
                                </div>
                                <div className="p-4 border rounded-lg space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Smartphone className="h-4 w-4" /> Android Bundle
                                    </div>
                                    <div className="text-sm text-muted-foreground">Version: 2.4.0 (Stable)</div>
                                    <Button variant="outline" size="sm" className="w-full">Rollback</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
