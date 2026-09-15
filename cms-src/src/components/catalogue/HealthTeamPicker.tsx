"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, Stethoscope } from "lucide-react"
import { ApiService } from "@/services/api"
import { Practitioner } from "@/types"

/**
 * Map Health Team profiles onto a Doctors & Health Coaches listing. The listing
 * references people; it never contains them — the profile, its landing page and
 * its User Service identity live in Modules → Health Team.
 */
export function HealthTeamPicker({ value, onChange }: {
    value: string[]
    onChange: (ids: string[]) => void
}) {
    const [team, setTeam] = useState<Practitioner[]>([])
    useEffect(() => { ApiService.catalogue.healthTeam().then(setTeam) }, [])

    const selected = value.map(id => team.find(t => t.id === id)).filter((t): t is Practitioner => !!t)

    return (
        <Card>
            <CardHeader className="py-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <Stethoscope className="h-4 w-4 text-primary" /> Health Team
                        </span>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Who delivers this listing. Their profile card and landing-page link render on the PDP —
                            the person is managed in <Link href="/health-team" className="underline">Health Team</Link>,
                            never duplicated per package.
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs">
                                <Plus className="mr-1 h-3.5 w-3.5" /> Map member
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-h-72 w-72 overflow-y-auto">
                            <DropdownMenuLabel className="text-xs">Health Team</DropdownMenuLabel>
                            {team.filter(t => !value.includes(t.id)).map(t => (
                                <DropdownMenuItem key={t.id} className="text-xs"
                                    onClick={() => onChange([...value, t.id])}>
                                    {t.nameEn}
                                    <span className="ml-auto text-[10px] text-muted-foreground">{t.kind.replace("_", " ")}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {selected.length === 0 ? (
                    <p className="rounded-md border border-dashed bg-muted/10 px-3 py-3 text-center text-[11px] text-muted-foreground">
                        Nobody mapped yet. A consultation without a mapped practitioner books to the general pool.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {selected.map(t => (
                            <Badge key={t.id} variant="outline" className="gap-1 py-1 text-[11px]">
                                {t.nameEn}
                                {t.status !== "active" && <span className="text-amber-700">· {t.status}</span>}
                                <button type="button" onClick={() => onChange(value.filter(x => x !== t.id))}>
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
