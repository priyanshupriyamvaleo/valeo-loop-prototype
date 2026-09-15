"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
    Bold, Italic, List, ListOrdered, Heading2, Heading3, Link2,
} from "lucide-react"

export interface RichTextProps {
    /**
     * ReactNode, not string: the Arabic fields pair their label with a muted English gloss in a
     * `dir="ltr"` span, and a string prop forced the one RichText field on that tab to render its
     * English in the same weight and colour as the Arabic — the only label of the eight that
     * looked different.
     */
    label?: ReactNode
    value?: string
    onChange: (html: string) => void
    dir?: "ltr" | "rtl"
    placeholder?: string
}

// A single ghost icon-button in the toolbar, with an active state.
function ToolbarButton({
    onClick, active, disabled, label, children,
}: {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    label: string
    children: React.ReactNode
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={e => e.preventDefault()}
            onClick={onClick}
            className={cn("h-8 w-8", active && "bg-accent text-accent-foreground")}
        >
            {children}
        </Button>
    )
}

// Dependency-free inline link control: toggles a small controlled input.
function LinkControl({ editor }: { editor: Editor }) {
    const [open, setOpen] = useState(false)
    const [url, setUrl] = useState("")

    const openEditor = () => {
        setUrl(editor.getAttributes("link").href ?? "")
        setOpen(true)
    }

    const apply = () => {
        const href = url.trim()
        if (href) {
            editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
        } else {
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
        }
        setOpen(false)
    }

    return (
        <div className="relative">
            <ToolbarButton
                label="Link"
                active={editor.isActive("link")}
                onClick={openEditor}
            >
                <Link2 className="h-4 w-4" />
            </ToolbarButton>
            {open && (
                <div className="absolute left-0 top-9 z-20 flex items-center gap-1 rounded-md border bg-popover p-1 shadow-md">
                    <Input
                        autoFocus
                        dir="ltr"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") { e.preventDefault(); apply() }
                            if (e.key === "Escape") { e.preventDefault(); setOpen(false) }
                        }}
                        placeholder="https://…"
                        className="h-8 w-56 text-sm"
                    />
                    <Button type="button" size="sm" className="h-8" onClick={apply}>
                        {url.trim() ? "Apply" : "Remove"}
                    </Button>
                </div>
            )}
        </div>
    )
}

export function RichText({ label, value, onChange, dir = "ltr", placeholder }: RichTextProps) {
    const editor = useEditor({
        // CRITICAL for Next App Router SSR: avoids hydration mismatch errors.
        immediatelyRender: false,
        extensions: [
            // Tiptap v3 StarterKit bundles Link; disable it so our standalone
            // Link (openOnClick:false) is the single source of truth.
            StarterKit.configure({ link: false }),
            Link.configure({ openOnClick: false }),
        ],
        content: value ?? "",
        editorProps: {
            attributes: {
                dir,
                class: cn(
                    "min-h-24 w-full rounded-md border px-3 py-2 text-sm",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    // No @tailwindcss/typography here — render list markers explicitly.
                    "[&_ul]:list-disc [&_ol]:list-decimal [&_:is(ul,ol)]:pl-5",
                    "[&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold",
                    "[&_a]:underline [&_a]:text-primary [&_p]:leading-relaxed",
                ),
            },
        },
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    })

    // Sync external (controlled) value changes into the editor. `false` disables
    // emitUpdate so setContent does not re-fire onUpdate → onChange.
    useEffect(() => {
        if (!editor) return
        const current = editor.getHTML()
        if (value !== undefined && value !== current) {
            editor.commands.setContent(value || "", { emitUpdate: false })
        }
    }, [value, editor])

    return (
        <div className="space-y-1.5">
            {label && <Label>{label}</Label>}
            <div className="rounded-md">
                <div className="mb-1.5 flex flex-wrap items-center gap-0.5">
                    <ToolbarButton label="Bold" active={editor?.isActive("bold")} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}>
                        <Bold className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Italic" active={editor?.isActive("italic")} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}>
                        <Italic className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Bullet list" active={editor?.isActive("bulletList")} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
                        <List className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Ordered list" active={editor?.isActive("orderedList")} disabled={!editor} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
                        <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Heading 2" active={editor?.isActive("heading", { level: 2 })} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
                        <Heading2 className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Heading 3" active={editor?.isActive("heading", { level: 3 })} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
                        <Heading3 className="h-4 w-4" />
                    </ToolbarButton>
                    {editor && <LinkControl editor={editor} />}
                </div>
                <div className="relative">
                    <EditorContent editor={editor} />
                    {editor?.isEmpty && placeholder && (
                        <span
                            className={cn(
                                "pointer-events-none absolute top-2 text-sm text-muted-foreground",
                                dir === "rtl" ? "right-3" : "left-3",
                            )}
                        >
                            {placeholder}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
