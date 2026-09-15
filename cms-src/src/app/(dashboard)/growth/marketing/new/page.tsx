"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"

import { Campaign } from "@/types"

export default function NewCampaignPage() {
    const [name, setName] = useState("")
    const [type, setType] = useState<Campaign["type"]>("discount")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [reach, setReach] = useState("")

    const handleSave = () => {
        const draft: Partial<Campaign> = {
            name,
            type,
            startDate,
            endDate,
            reach,
            status: "draft",
        }
        // Mock only: no persistence.
        console.log("New campaign draft", draft)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/growth/marketing">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">New Campaign</h2>
                    <p className="text-muted-foreground">Set up a new promotion or engagement initiative.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>Define the basics for this campaign.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Summer Wellness Push"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v as Campaign["type"])}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="discount">Discount</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="content">Content</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Reach Target</Label>
                            <Input
                                value={reach}
                                onChange={(e) => setReach(e.target.value)}
                                placeholder="10000"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" /> Save Campaign
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/growth/marketing">Cancel</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
