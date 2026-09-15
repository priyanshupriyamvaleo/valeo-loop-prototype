"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Plus, Trash, ChevronUp, ChevronDown, Monitor, Smartphone, LayoutList, Languages,
} from "lucide-react"
import { PageBlock, PageBlockType, PageBlockConfig, Listing } from "@/types"
import { BLOCK_REGISTRY, BLOCK_ORDER } from "./registry"

function rid() { return Math.random().toString(36).substr(2, 9) }

interface PageBuilderProps {
    blocks: PageBlock[]
    onChange: (blocks: PageBlock[]) => void
    listings: Listing[]
}

export function PageBuilder({ blocks, onChange, listings }: PageBuilderProps) {
    const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
    const [lang, setLang] = useState<"en" | "ar">("en")
    const [selectedId, setSelectedId] = useState<string | null>(null)

    // Blocks kept sorted by rank; helper reassigns rank after any reorder.
    const sorted = [...blocks].sort((a, b) => a.rank - b.rank)
    const rerank = (list: PageBlock[]) => list.map((b, i) => ({ ...b, rank: i }))

    const addBlock = (type: PageBlockType) => {
        const entry = BLOCK_REGISTRY[type]
        const block: PageBlock = {
            id: rid(),
            type,
            internalName: entry.label,
            rank: sorted.length,
            isActive: true,
            config: { ...entry.defaultConfig },
        }
        onChange(rerank([...sorted, block]))
        setSelectedId(block.id)
    }

    const updateBlock = (id: string, patch: Partial<PageBlock>) =>
        onChange(sorted.map(b => b.id === id ? { ...b, ...patch } : b))

    const updateConfig = (id: string, configPatch: Partial<PageBlockConfig>) =>
        onChange(sorted.map(b => b.id === id ? { ...b, config: { ...b.config, ...configPatch } } : b))

    // A block is the sole instance of a mandatory type → protected from delete/hide.
    const isProtected = (block: PageBlock) => {
        const entry = BLOCK_REGISTRY[block.type]
        return !!entry.mandatory && sorted.filter(b => b.type === block.type).length <= 1
    }

    const removeBlock = (id: string) => {
        const target = sorted.find(b => b.id === id)
        if (target && isProtected(target)) return   // guard: cannot delete the sole mandatory block
        onChange(rerank(sorted.filter(b => b.id !== id)))
        if (selectedId === id) setSelectedId(null)
    }

    const move = (id: string, dir: -1 | 1) => {
        const idx = sorted.findIndex(b => b.id === id)
        const next = idx + dir
        if (next < 0 || next >= sorted.length) return
        const copy = [...sorted]
        const [item] = copy.splice(idx, 1)
        copy.splice(next, 0, item)
        onChange(rerank(copy))
    }

    // Protected (sole mandatory) blocks always render — they cannot be hidden.
    const activeBlocks = sorted.filter(b => b.isActive || isProtected(b))

    return (
        <div className="flex h-full gap-4 overflow-hidden">
            {/* ── LEFT: palette + block list + inline editor ── */}
            <div className="w-[380px] shrink-0 space-y-4 overflow-y-auto pr-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="w-full"><Plus className="mr-2 h-4 w-4" /> Add block</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[340px]">
                        {BLOCK_ORDER.filter(type => {
                            const entry = BLOCK_REGISTRY[type]
                            // Hide singleton types once an instance already exists.
                            return !(entry.singleton && sorted.some(b => b.type === type))
                        }).map(type => {
                            const entry = BLOCK_REGISTRY[type]
                            const Icon = entry.icon
                            return (
                                <DropdownMenuItem key={type} onClick={() => addBlock(type)} className="flex items-start gap-3 py-2">
                                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">{entry.label}</p>
                                        <p className="text-xs text-muted-foreground">{entry.description}</p>
                                    </div>
                                </DropdownMenuItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {sorted.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        <LayoutList className="mx-auto mb-2 h-6 w-6" />
                        No blocks yet. Add one to start building.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sorted.map((block, i) => {
                            const entry = BLOCK_REGISTRY[block.type]
                            const Icon = entry.icon
                            const isSelected = selectedId === block.id
                            const locked = isProtected(block)
                            return (
                                <div key={block.id} className={`rounded-lg border ${isSelected ? "border-primary ring-1 ring-primary" : ""}`}>
                                    <div
                                        className="flex cursor-pointer items-center gap-2 p-2.5"
                                        onClick={() => setSelectedId(isSelected ? null : block.id)}
                                    >
                                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{block.internalName || entry.label}</p>
                                            <p className="text-[11px] text-muted-foreground">{entry.label}</p>
                                        </div>
                                        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                            <Switch
                                                checked={locked ? true : block.isActive}
                                                disabled={locked}
                                                onCheckedChange={v => updateBlock(block.id, { isActive: v })}
                                                aria-label="Toggle active"
                                            />
                                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => move(block.id, -1)} aria-label="Move up"><ChevronUp className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === sorted.length - 1} onClick={() => move(block.id, 1)} aria-label="Move down"><ChevronDown className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={locked} onClick={() => removeBlock(block.id)} aria-label="Remove block"><Trash className="h-3.5 w-3.5" /></Button>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="space-y-3 border-t bg-muted/10 p-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">Internal name</label>
                                                <input
                                                    value={block.internalName ?? ""}
                                                    onChange={e => updateBlock(block.id, { internalName: e.target.value })}
                                                    placeholder={entry.label}
                                                    className="h-8 w-full rounded-md border bg-background px-3 text-sm"
                                                />
                                            </div>
                                            <Separator />
                                            <entry.Editor
                                                config={block.config}
                                                onChange={patch => updateConfig(block.id, patch)}
                                                listings={listings}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── RIGHT: live preview ── */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-muted/20">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur">
                    <span className="text-sm font-medium text-muted-foreground">Live preview</span>
                    <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-md border p-0.5">
                            <Button variant={lang === "en" ? "secondary" : "ghost"} size="sm" className="h-7 gap-1.5 px-2.5" onClick={() => setLang("en")}>
                                <Languages className="h-3.5 w-3.5" /> EN
                            </Button>
                            <Button variant={lang === "ar" ? "secondary" : "ghost"} size="sm" className="h-7 gap-1.5 px-2.5" onClick={() => setLang("ar")}>
                                <Languages className="h-3.5 w-3.5" /> AR
                            </Button>
                        </div>
                        <div className="inline-flex rounded-md border p-0.5">
                            <Button variant={device === "desktop" ? "secondary" : "ghost"} size="sm" className="h-7 gap-1.5 px-2.5" onClick={() => setDevice("desktop")}>
                                <Monitor className="h-3.5 w-3.5" /> Desktop
                            </Button>
                            <Button variant={device === "mobile" ? "secondary" : "ghost"} size="sm" className="h-7 gap-1.5 px-2.5" onClick={() => setDevice("mobile")}>
                                <Smartphone className="h-3.5 w-3.5" /> Mobile
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {activeBlocks.length === 0 ? (
                        <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                            <LayoutList className="mb-2 h-8 w-8" />
                            {sorted.length === 0 ? "Add blocks to see the page preview." : "No active blocks — toggle a block on to preview it."}
                        </div>
                    ) : (
                        <div className={device === "mobile" ? "mx-auto w-[390px] overflow-hidden rounded-[2rem] border-4 border-slate-800 bg-white shadow-xl" : "w-full"}>
                            <div dir={lang === "ar" ? "rtl" : "ltr"} className={`space-y-6 bg-white ${device === "mobile" ? "p-4" : "p-6 rounded-lg border"}`}>
                                {activeBlocks.map(block => {
                                    const entry = BLOCK_REGISTRY[block.type]
                                    return (
                                        <div key={block.id}>
                                            <entry.Preview config={block.config} device={device} lang={lang} listings={listings} />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
