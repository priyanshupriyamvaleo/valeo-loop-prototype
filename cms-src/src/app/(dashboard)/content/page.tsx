"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, MoreHorizontal, Star, MessageSquare, Globe, Laptop, Smartphone, Layout } from "lucide-react"

import { ApiService } from "@/services/api"
import { ContentItem, ContentCategory, Banner, SocialProof } from "@/types"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ContentPage() {
    const [data, setData] = useState<ContentItem[]>([])
    const [categories, setCategories] = useState<ContentCategory[]>([])
    const [banners, setBanners] = useState<Banner[]>([])
    const [testimonials, setTestimonials] = useState<SocialProof[]>([])
    const [faqs, setFaqs] = useState<any[]>([])
    const [navItems, setNavItems] = useState<any[]>([])
    const [seoItems, setSeoItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const [items, cats, bans, reviews, faqData, navData, seoData] = await Promise.all([
                    ApiService.content.list(),
                    ApiService.content.categories(),
                    ApiService.content.banners(),
                    ApiService.content.socialProof(),
                    (ApiService.content as any).faqs(),
                    (ApiService.content as any).navigation(),
                    (ApiService.content as any).seo()
                ])
                setData(items)
                setCategories(cats)
                setBanners(bans)
                setTestimonials(reviews)
                setFaqs(faqData)
                setNavItems(navData)
                setSeoItems(seoData)
            } catch (error) {
                console.error("Failed to load content", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Global Content Hub</h2>
                    <p className="text-muted-foreground font-medium">Manage landing pages, blog posts, banners and SEO across all platforms.</p>
                </div>
                <Button asChild>
                    <Link href="/content/new">
                        <Plus className="mr-2 h-4 w-4" /> Create New Page
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="pages" className="space-y-4">
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="pages">Pages & Articles</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="banners">Banners & Promos</TabsTrigger>
                    <TabsTrigger value="reviews">Social Proof</TabsTrigger>
                    <TabsTrigger value="faq">FAQ Center</TabsTrigger>
                    <TabsTrigger value="nav">Navigation</TabsTrigger>
                    <TabsTrigger value="seo">SEO Management</TabsTrigger>
                </TabsList>

                <TabsContent value="pages" className="space-y-4">
                    <div className="flex items-center py-2">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search content..." className="pl-8" />
                        </div>
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Master Content Repository</CardTitle>
                            <CardDescription>Unified management for landing pages, clinical articles, and promotional content.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading content...</TableCell></TableRow>
                                    ) : (
                                        data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-semibold text-slate-700">
                                                    <Link href={`/content/${item.id}`} className="hover:underline">{item.title}</Link>
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    <Badge variant="outline" className="font-normal">{item.type.replace("_", " ")}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        item.status === 'published' ? 'bg-green-100 text-green-800' :
                                                            item.status === 'review' ? 'bg-amber-100 text-amber-800' :
                                                                'bg-slate-100 text-slate-800'
                                                    }>
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "N/A"}</TableCell>
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

                <TabsContent value="categories" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Content Taxonomy</CardTitle>
                            <CardDescription>Global categories shared across Website and Mobile Apps.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category Name</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="font-medium text-slate-700">{cat.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{cat.slug}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="banners" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Banners & Strip Placements</CardTitle>
                            <CardDescription>Manage hero sections and ribbon banners globally.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Banner Title</TableHead>
                                        <TableHead>Placement Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {banners.map((banner) => (
                                        <TableRow key={banner.id}>
                                            <TableCell className="font-medium">{banner.title}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{banner.location}</TableCell>
                                            <TableCell><Badge variant={banner.status === "active" ? "default" : "secondary"}>{banner.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Social Proof Repository</CardTitle>
                            <CardDescription>Curated testimonials and reviews for dynamic display.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Contributor</TableHead>
                                        <TableHead>Attribution</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {testimonials.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium">{t.author}</TableCell>
                                            <TableCell className="text-slate-500 text-sm">{t.role}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-0.5">
                                                    {Array.from({ length: t.rating }).map((_, i) => (
                                                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={t.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                                                    {t.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="faq" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Global FAQ Center</CardTitle>
                                <CardDescription>Managing product-specific and general Q&A sets.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                                <MessageSquare className="mr-2 h-4 w-4" /> New Category
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Question</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {faqs.map((faq) => (
                                        <TableRow key={faq.id}>
                                            <TableCell className="font-medium max-w-md truncate">{faq.question}</TableCell>
                                            <TableCell>{faq.category}</TableCell>
                                            <TableCell><Badge variant="outline">{faq.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="nav" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Navigation Builder</CardTitle>
                                <CardDescription>Menu structures for Website Headers and Mobile Tab Bars.</CardDescription>
                            </div>
                            <Button size="sm">
                                <Layout className="mr-2 h-4 w-4" /> Add Menu
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Menu Title</TableHead>
                                        <TableHead>Target Platform</TableHead>
                                        <TableHead>Region</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {navItems.map((nav) => (
                                        <TableRow key={nav.id}>
                                            <TableCell className="font-medium">{nav.title}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {nav.type === 'desktop' ? <Laptop className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                                                    <span className="capitalize text-xs">{nav.type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline">{nav.region}</Badge></TableCell>
                                            <TableCell><Badge variant="default">{nav.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>SEO Meta Engine</CardTitle>
                            <CardDescription>Control meta-tags, indexing, and search preview for all key pages.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Page</TableHead>
                                        <TableHead>Target Keywords</TableHead>
                                        <TableHead>SEO Score</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {seoItems.map((seo) => (
                                        <TableRow key={seo.id}>
                                            <TableCell className="font-semibold">{seo.page}</TableCell>
                                            <TableCell className="text-sm text-slate-500 italic">{seo.keywords}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full ${seo.score > 90 ? 'bg-green-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${seo.score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold">{seo.score}/100</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
