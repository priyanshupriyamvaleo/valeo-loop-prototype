import { Badge } from "@/components/ui/badge"
import { Package, Tags, Route, ClipboardList, Handshake, Box, Tag as TagIcon, Zap, FileText, Stethoscope, Boxes, FlaskConical, Layers, type LucideIcon } from "lucide-react"
import type { AuditEntityType } from "@/types"

const ENTITY_META: Record<AuditEntityType, { label: string; icon: LucideIcon }> = {
    listing: { label: "Listing", icon: Package },
    category: { label: "Category", icon: Tags },
    journey: { label: "Journey", icon: Route },
    protocol: { label: "Protocol", icon: ClipboardList },
    partner: { label: "Partner", icon: Handshake },
    subDepartment: { label: "Sub-department", icon: Box },
    internalCategory: { label: "Internal Category", icon: Box },
    tag: { label: "Tag", icon: TagIcon },
    flashSale: { label: "Flash Sale", icon: Zap },
    article: { label: "Article", icon: FileText },
    practitioner: { label: "Health Team", icon: Stethoscope },
    composition: { label: "Composition", icon: Boxes },
    promoBanner: { label: "Promo Banner", icon: Zap },
    retentionTemplate: { label: "Retention Template", icon: FileText },
    biomarker: { label: "Biomarker", icon: FlaskConical },
    biomarkerPanel: { label: "Panel", icon: Layers },
}

export function AuditEntityBadge({ entityType }: { entityType: AuditEntityType }) {
    const meta = ENTITY_META[entityType] ?? { label: entityType, icon: Box }
    const Icon = meta.icon
    return (
        <Badge variant="outline" className="gap-1 text-[10px] font-normal text-muted-foreground">
            <Icon className="h-3 w-3" />
            {meta.label}
        </Badge>
    )
}
