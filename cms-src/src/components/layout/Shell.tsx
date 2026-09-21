"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Activity, Beaker, Boxes, Building2, ClipboardList, FileText, FlaskConical, Handshake, HelpCircle, Layers, Layout, LayoutDashboard, LayoutGrid, LogOut, Megaphone, Menu, MessageSquare, Package, PanelLeftClose, PanelLeftOpen, Repeat, Route, ScrollText, Settings, ShoppingCart, Star, Stethoscope, Tag, Tag as TagIcon, Tags, Ticket, UserCircle, Users, Zap } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_GROUPS = [
    {
        // The catalogue spine: Journey ▸ Department → Sub-department → Listing,
        // owned by a Category Manager, delivered via a Fulfilment path,
        // grouped by an Internal Category (→ Service Provider pool), projected to Filters.
        label: "Catalogue",
        items: [
            {
                title: "Overview",
                href: "/catalogue",
                icon: LayoutGrid,
            },
            {
                // "What it is" — Department → Sub-department (canonical spine).
                // Ordered ahead of Listings so the nav reads top-to-bottom in
                // pipeline order: Departments → Listings → Categories → Journeys.
                title: "Departments",
                href: "/catalogue/departments",
                icon: Boxes,
            },
            {
                // The analyte master. Sits AHEAD of Listings because it feeds
                // them: a blood-test package composes analytes and panels, so
                // the clinical spine has to exist before a package can be built
                // out of it. A biomarker is a clinical fact — no price, no SKU.
                title: "Biomarkers",
                href: "/catalogue/biomarkers",
                icon: FlaskConical,
            },
            {
                // The clinical grouping tier — CBC, Lipid Profile. Not sellable, so it
                // sits with the analytes rather than with the products.
                title: "Panels",
                href: "/catalogue/panels",
                icon: Layers,
            },
            {
                title: "Listings",
                href: "/catalogue/listings",
                icon: Package,
            },
            {
                // Build-your-own test. AFTER Listings because it is a channel
                // over the analytes rather than a product family: selection,
                // union pricing and lab routing, with no SKU of its own.
                title: "Create Your Own Test",
                href: "/catalogue/cyot",
                icon: Beaker,
            },
        ]
    },
    {
        label: "Modules",
        items: [
            {
                // Practitioner directory: profiles with landing pages, 1:1 User Service
                title: "Health Team",
                href: "/health-team",
                icon: Stethoscope,
            },
            {
                // Blog authoring — articles + their own category tree
                title: "Articles (Blog)",
                href: "/content/articles",
                icon: FileText,
            },
            {
                title: "Global Content Hub",
                href: "/content",
                icon: FileText,
            },
            // Moved out of Catalogue: these are merchandising and operational
            // surfaces, not catalogue MASTER data. Master is Departments,
            // Listings and the Schema Map.
            {
                // "Where it appears" — Category → Sub-category (web/app merchandising)
                title: "Categories",
                href: "/catalogue/categories",
                icon: Tags,
            },
            {
                // The brand registry (product_brands) — read live; creation flips on
                // the day the service ships POST /brands.
                title: "Brands",
                href: "/catalogue/brands",
                icon: Tag,
            },
            {
                title: "Journeys",
                href: "/catalogue/journeys",
                icon: Route,
            },
            {
                // Reusable, ranked retention pages attached to journeys per-country
                title: "Retention",
                href: "/catalogue/retention",
                icon: Repeat,
            },
            {
                // One primitive: combos · programs · add-ons · freebies
                title: "Compositions",
                href: "/catalogue/compositions",
                icon: Boxes,
            },
            {
                // Time-boxed pricing rules; never written onto a listing
                title: "Flash Sales",
                href: "/catalogue/flash-sales",
                icon: Zap,
            },
            {
                // Reusable promo banners (with coupon) selectable on listings/categories
                title: "Promo Banners",
                href: "/catalogue/promo-banners",
                icon: Megaphone,
            },
            {
                // Scripted conversations that end in a decision. GLOBAL on purpose:
                // an onboarding chat picks a goal today, and the same builder is
                // meant to serve a product page or a campaign page next. It is not
                // owned by Protocols, so it does not sit under them.
                title: "Chat Builder",
                href: "/chat-builder",
                icon: MessageSquare,
            },
            {
                // Clinically-distinct care sequences (ordered packages + gating)
                //
                // TWO CHILDREN, because two different things are authored.
                // Listings is one protocol at a time — which packages, in what
                // order. Step Mapping is the words and the conditions of an
                // order type, written once and used by every protocol that
                // orders one. Exact-matching Listings, or it would light up on
                // Step Mapping too.
                title: "Protocols",
                href: "/catalogue/protocols",
                icon: ClipboardList,
                children: [
                    { title: "Listings", href: "/catalogue/protocols", fallback: true },
                    { title: "Step Mapping", href: "/catalogue/protocols/step-mapping" },
                ],
            },
            {
                title: "Service Providers",
                href: "/catalogue/service-providers",
                icon: Building2,
            },
            {
                // Attributes / Features that pick the service-provider pool
                title: "Internal Categories",
                href: "/catalogue/internal-categories",
                icon: Layers,
            },
            // PARKED — not needed for now. Code and pages are untouched;
            // uncomment to bring the nav entry back.
            // {
            // title: "Clinical Core",
            // href: "/clinical",
            // icon: Activity,
            // },
            // PARKED — not needed for now. Code and pages are untouched;
            // uncomment to bring the nav entry back.
            // {
            // title: "Operational Engine",
            // href: "/operations",
            // icon: ShoppingCart,
            // },
            // PARKED — not needed for now. Code and pages are untouched;
            // uncomment to bring the nav entry back.
            // {
            // title: "Growth & Ecosystem",
            // href: "/growth",
            // icon: Megaphone,
            // },
        ]
    },
    {
        label: "Administration",
        items: [
            {
                // B2B partner access + per-partner pricing/media/exclusivity
                title: "Partners",
                href: "/catalogue/partners",
                icon: Handshake,
            },
            {
                // Curated cross-cutting label vocabulary (applied on listings)
                title: "Tags",
                href: "/catalogue/tags",
                icon: TagIcon,
            },
            {
                title: "User Management",
                href: "/users",
                icon: Users,
            },
            {
                title: "Audit Log",
                href: "/audit",
                icon: ScrollText,
            },
            {
                title: "Development Docs",
                href: "/development",
                icon: FileText,
            },
            {
                title: "Support Tickets",
                href: "/ticketing",
                icon: Ticket,
            },
            {
                title: "Platform Settings",
                href: "/settings",
                icon: Settings,
            },
        ]
    }
]

type LucideIcon = React.ComponentType<{ className?: string }>

/**
 * `fallback` marks the section's DEFAULT child — the one that owns every URL
 * under the parent that no sibling claims. Editing one protocol at
 * `/catalogue/protocols/prot-glp1-wl` is being in Listings, and exact-matching
 * alone would leave the section open with nothing lit.
 */
interface NavChild { title: string; href: string; exact?: boolean; fallback?: boolean }
interface NavEntry {
    title: string
    href: string
    icon: LucideIcon
    exact?: boolean
    children?: NavChild[]
}

/** Exact on `/catalogue` and on any child that asks, `startsWith` otherwise. */
const isOn = (pathname: string | null, href: string, exact?: boolean) =>
    (exact || href === "/catalogue") ? pathname === href : !!pathname?.startsWith(href)

/**
 * ONE NAV ITEM, RENDERED ONCE.
 *
 * The mobile sheet and the desktop rail both map NAV_GROUPS, and they used to
 * carry two near-identical copies of this markup. A third copy for children
 * is how the two lists drift, so the branch lives here and both callers use
 * it. `compact` is the only difference between them: the sheet closes on a
 * press and has no collapsed state.
 */
function NavItem({ item, pathname, collapsed, onNavigate }: {
    item: NavEntry
    pathname: string | null
    collapsed?: boolean
    onNavigate?: () => void
}) {
    const active = isOn(pathname, item.href, item.exact)
    /* A parent is "open" when the section is being used at all, not when the
       parent's own page is. Two items and no chevron: a section of two does
       not earn a control to hide one of them. */
    const inSection = !!pathname?.startsWith(item.href)

    return (
        <div>
            <Link
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.title : undefined}
                className={`flex items-center rounded-lg py-2 transition-all hover:text-primary ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${
                    (item.children ? inSection : active) ? "bg-muted text-primary" : "text-muted-foreground"
                }`}
            >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.title}
            </Link>

            {/* Collapsed, the rail is icons only and there is nowhere to put a
                child's name. The parent icon still highlights, so the section
                is not lost — only its two doors are. */}
            {item.children && inSection && !collapsed && (() => {
                /* The first child that claims the URL wins; the fallback takes
                   whatever is left inside the section. One at a time, so two
                   rows can never both look current. */
                const hit = item.children.find(c => !c.fallback && isOn(pathname, c.href, c.exact))
                    ?? item.children.find(c => c.fallback)
                return (
                    <div className="mt-0.5 ml-[26px] space-y-0.5 border-l pl-3">
                        {item.children.map(c => (
                            <Link key={c.href} href={c.href} onClick={onNavigate}
                                className={`block rounded-md px-2 py-1.5 text-[13px] transition-all hover:text-primary ${
                                    c === hit
                                        ? "bg-muted font-medium text-primary" : "text-muted-foreground"
                                }`}>
                                {c.title}
                            </Link>
                        ))}
                    </div>
                )
            })()}
        </div>
    )
}

export function Shell({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth()
    const pathname = usePathname()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-gray-100/40">
            {/* Mobile Sidebar */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" className="md:hidden p-4">
                        <Menu />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                    {/* Mobile Sidebar Content - Same as Desktop but in Sheet */}
                    <div className="flex h-full flex-col border-r bg-gray-100/40">
                        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                            <Link href="/" className="flex items-center gap-2 font-semibold">
                                <span className="">Valeo CMS</span>
                            </Link>
                        </div>
                        <div className="flex-1 overflow-auto py-2">
                            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-6">
                                <Link
                                    href="/"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${pathname === "/" ? "bg-muted text-primary" : "text-muted-foreground"}`}
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>

                                {NAV_GROUPS.map((group, index) => (
                                    <div key={index} className="space-y-2">
                                        <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {group.label}
                                        </h4>
                                        <div className="space-y-1">
                                            {group.items.map((item) => (
                                                <NavItem key={item.href} item={item} pathname={pathname}
                                                    onNavigate={() => setIsSidebarOpen(false)} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </nav>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside className={`hidden border-r bg-gray-100/40 md:block shrink-0 transition-[width] duration-200 ${collapsed ? "w-16" : "w-64"}`}>
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className={`flex h-14 items-center border-b lg:h-[60px] ${collapsed ? "justify-center px-2" : "justify-between px-4 lg:px-6"}`}>
                        {!collapsed && (
                            <Link href="/" className="flex items-center gap-2 font-semibold truncate">
                                <span className="truncate">Valeo Headless CMS</span>
                            </Link>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => setCollapsed(c => !c)}
                            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                        <nav className={`grid items-start text-sm font-medium gap-6 ${collapsed ? "px-2" : "px-2 lg:px-4"}`}>
                            <Link
                                href="/"
                                title={collapsed ? "Dashboard" : undefined}
                                className={`flex items-center rounded-lg py-2 transition-all hover:text-primary ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${pathname === "/" ? "bg-muted text-primary" : "text-muted-foreground"}`}
                            >
                                <LayoutDashboard className="h-4 w-4 shrink-0" />
                                {!collapsed && "Dashboard"}
                            </Link>

                            {NAV_GROUPS.map((group, index) => (
                                <div key={index} className="space-y-2">
                                    {collapsed ? (
                                        <div className="mx-2 border-t" />
                                    ) : (
                                        <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {group.label}
                                        </h4>
                                    )}
                                    <div className="space-y-1">
                                        {group.items.map((item) => (
                                            <NavItem key={item.href} item={item} pathname={pathname}
                                                collapsed={collapsed} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0">
                <header className="flex h-14 items-center gap-4 border-b bg-gray-100/40 px-4 lg:h-[60px] lg:px-6 justify-between">
                    <div className="w-full flex-1">
                        {/* Breadcrumbs or Search could go here */}
                        {/* <h1 className="text-lg font-semibold md:text-2xl">{NAV_ITEMS.find(n=>n.href===pathname)?.title || "Dashboard"}</h1> */}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Avatar>
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuItem>Support</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => logout()}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
