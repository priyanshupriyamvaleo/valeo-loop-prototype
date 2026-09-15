"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "../../../../components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../../components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs"
import { ArrowLeft, Save, Eye, Smartphone, Monitor } from "lucide-react"

import { ApiService } from "@/services/api"
import { ContentItem } from "@/types"

export default function ContentEditorPage() {
    const params = useParams()
    const router = useRouter()
    const isNew = params.id === "new"
    const [isLoading, setIsLoading] = useState(!isNew)
    const [title, setTitle] = useState("")
    const [slug, setSlug] = useState("")
    const [status, setStatus] = useState<ContentItem["status"]>("draft")

    useEffect(() => {
        if (!isNew && typeof params.id === 'string') {
            const loadContent = async () => {
                const item = await ApiService.content.get(params.id as string)
                if (item) {
                    setTitle(item.title)
                    setSlug(item.slug)
                    setStatus(item.status)
                }
                setIsLoading(false)
            }
            loadContent()
        }
    }, [isNew, params.id])

    const handleSave = async () => {
        // Mock save
        alert("Content saved!")
        if (isNew) {
            router.push("/content/1")
        }
    }

    if (isLoading) return <div className="p-10">Loading editor...</div>

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/content">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-lg font-semibold">{isNew ? "New Content" : "Edit Content"}</h2>
                        <p className="text-xs text-muted-foreground">{isNew ? "Unsaved" : "Last saved 2 mins ago"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-2">Status: </span>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger className="w-[130px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="review">In Review</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="w-px h-6 bg-border mx-2" />
                    <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" /> Preview
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Save
                    </Button>
                </div>
            </div>

            {/* Editor Layout */}
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Main Editor */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="mb-4 space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-medium" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug (URL)</Label>
                            <div className="flex items-center">
                                <span className="bg-muted px-3 py-2 text-sm text-muted-foreground border border-r-0 rounded-l-md">
                                    valeo.com/
                                </span>
                                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-l-none" />
                            </div>
                        </div>
                    </div>

                    <Card className="flex-1 flex flex-col overflow-hidden border-2 border-dashed">
                        <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Visual Builder</span>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6"><Monitor className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6"><Smartphone className="h-3 w-3" /></Button>
                            </div>
                        </div>
                        <CardContent className="flex-1 p-0 overflow-auto bg-white relative">
                            {/* Mock Builder Canvas */}
                            <div className="min-h-full p-8 space-y-4">
                                <div className="p-4 border-2 border-transparent hover:border-primary rounded cursor-pointer transition-all bg-gray-50 flex items-center justify-center h-48">
                                    <span className="text-muted-foreground">Hero Section (Click to Edit)</span>
                                </div>
                                <div className="p-4 border-2 border-transparent hover:border-primary rounded cursor-pointer transition-all bg-gray-50 flex items-center justify-center h-32">
                                    <span className="text-muted-foreground">Feature Grid</span>
                                </div>
                                <div className="flex justify-center p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg hover:bg-muted/10 cursor-pointer">
                                    <span className="text-sm font-medium text-muted-foreground">+ Add Block</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Settings */}
                <div className="w-80 shrink-0 border-l pl-6 overflow-auto">
                    <Tabs defaultValue="settings">
                        <TabsList className="w-full">
                            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                            <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
                        </TabsList>
                        <TabsContent value="settings" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Author</Label>
                                <Input defaultValue="Admin User" disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Publish Date</Label>
                                <Input type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="blog">Blog</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>
                        <TabsContent value="seo" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Meta Title</Label>
                                <Input />
                            </div>
                            <div className="space-y-2">
                                <Label>Meta Description</Label>
                                <Textarea className="h-24" />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

