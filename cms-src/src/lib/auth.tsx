"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auditStore } from "@/services/audit"

export type UserRole = "admin" | "editor" | "viewer"

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    loginWithGoogle: (code: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Everyone the content service lets in can do everything: its allow-list has no
// notion of roles, so there is nothing to map a role FROM. The RBAC model in
// docs/ACCESS-CONTROL-PLAN.md is a written proposal, not something the API can
// answer yet — this constant is the honest placeholder until it can, and the UI
// must not grow permission checks that read it as if it were real.
const ROLE_UNTIL_RBAC_EXISTS: UserRole = "admin"

interface SessionResponse {
    user: { id: string; email: string; name: string; avatar?: string } | null
}

/**
 * Where to go after signing in, from ?next=.
 *
 * Only a same-origin, path-absolute value is accepted. `next` arrives in the
 * URL, so anyone can set it: without this check "/login?next=https://evil.com"
 * would turn our own login page into an open redirect. A protocol-relative
 * "//evil.com" is rejected for the same reason — the browser reads it as a host.
 */
function safeNext(fallback = "/"): string {
    if (typeof window === "undefined") return fallback
    const raw = new URLSearchParams(window.location.search).get("next")
    if (!raw) return fallback
    if (!raw.startsWith("/") || raw.startsWith("//")) return fallback
    return raw
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // The session lives in httpOnly cookies, so the client cannot read it — it
    // asks the server. This also means a session survives a reload without the
    // token ever having been in localStorage, where any script could take it.
    useEffect(() => {
        let cancelled = false
        const check = async () => {
            try {
                const res = await fetch("/api/auth/session", { cache: "no-store" })
                const body = (await res.json()) as SessionResponse
                if (!cancelled && body.user) {
                    setUser({ ...body.user, role: ROLE_UNTIL_RBAC_EXISTS })
                }
            } catch {
                // No session is the safe reading of an unreachable session endpoint.
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        check()
        return () => {
            cancelled = true
        }
    }, [])

    // api.ts has no React context, so the audit store reads its actor from here.
    useEffect(() => {
        auditStore.setActor(user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null)
    }, [user])

    const loginWithGoogle = useCallback(
        async (code: string) => {
            setIsLoading(true)
            try {
                const res = await fetch("/api/auth/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                })
                const body = (await res.json()) as SessionResponse & { detail?: string }

                if (!res.ok || !body.user) {
                    // The content service writes these for the operator: "not a
                    // configured operator", "ask the catalogue team". Showing our
                    // own wording instead would lose the instruction in them.
                    throw new Error(body.detail ?? "Sign-in failed.")
                }

                setUser({ ...body.user, role: ROLE_UNTIL_RBAC_EXISTS })
                // Land where they were headed. The middleware puts the blocked
                // path in ?next=, so a deep link survives sign-in instead of
                // dumping everyone on the dashboard.
                router.replace(safeNext())
                // isLoading deliberately stays true on success. The navigation is
                // async, so clearing it here re-renders the sign-in button for a
                // frame or two on a page we are already leaving — which is the
                // second half of the double-attempt problem. The provider
                // unmounts with the route instead.
            } catch (err) {
                // Only the failure path restores the button, because that is the
                // only path where the operator should be able to try again.
                setIsLoading(false)
                throw err
            }
        },
        [router],
    )

    const logout = useCallback(async () => {
        setIsLoading(true)
        try {
            await fetch("/api/auth/session", { method: "DELETE" })
        } finally {
            setUser(null)
            setIsLoading(false)
            router.replace("/login")
        }
    }, [router])

    // The client-side redirect that used to live here has been removed:
    // middleware.ts now does this server-side, before anything renders.
    //
    // Keeping both caused a visible bounce. After a successful sign-in this
    // provider navigates to ?next=, but for a moment the route is still /login
    // with a user present — so the effect fired its own push("/") and raced the
    // first navigation. The login screen reappeared for about a second, which
    // reads as "it didn't work" and invites a second sign-in attempt against an
    // already-consumed authorization code.
    //
    // The session fetch below still runs, because the UI needs to know WHO is
    // signed in. It just no longer decides WHERE anyone goes.

    return (
        <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
