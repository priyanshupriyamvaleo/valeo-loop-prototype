"use client"

import { Shell } from "@/components/layout/Shell"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Toaster mounts HERE or every toast.* call in the app renders nothing —
    // which is exactly what happened: pages have called toast.success/error
    // since the compositions work and no toast has ever appeared.
    return (
        <Shell>
            {children}
            <Toaster position="top-center" richColors closeButton />
        </Shell>
    )
}
