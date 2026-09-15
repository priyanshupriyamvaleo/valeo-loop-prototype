"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

// Google Identity Services, authorization-code flow.
//
// The popup returns a one-time CODE, not a token. Only the server can redeem it,
// because redemption requires the client secret — so nothing signable ever exists
// in the browser, and an intercepted code is useless without the secret.

interface CodeResponse {
    code?: string
    error?: string
}

interface CodeClient {
    requestCode: () => void
}

declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initCodeClient: (config: {
                        client_id: string
                        scope: string
                        ux_mode: "popup" | "redirect"
                        callback: (response: CodeResponse) => void
                        error_callback?: (error: { type?: string }) => void
                    }) => CodeClient
                }
            }
        }
    }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client"

// openid gets us an id_token; email and profile populate the claims the panel
// shows. Nothing broader — this app reads no Google APIs on the operator's behalf.
const SCOPE = "openid email profile"

function loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts?.oauth2) return resolve()
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
        if (existing) {
            existing.addEventListener("load", () => resolve())
            existing.addEventListener("error", () => reject(new Error("script failed")))
            return
        }
        const script = document.createElement("script")
        script.src = SCRIPT_SRC
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error("script failed"))
        document.head.appendChild(script)
    })
}

export function GoogleSignInButton({ onCode }: { onCode: (code: string) => void }) {
    const [error, setError] = useState<string | null>(null)
    const [ready, setReady] = useState(false)
    const client = useRef<CodeClient | null>(null)

    // Google invokes whatever closure was passed at init time; a ref keeps that
    // call from landing in a stale one after a re-render.
    const handler = useRef(onCode)
    useEffect(() => {
        handler.current = onCode
    }, [onCode])

    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        if (!clientId) {
            setError("Google sign-in is not configured: NEXT_PUBLIC_GOOGLE_CLIENT_ID is unset.")
            return
        }

        let cancelled = false
        loadScript()
            .then(() => {
                if (cancelled || !window.google) return
                client.current = window.google.accounts.oauth2.initCodeClient({
                    client_id: clientId,
                    scope: SCOPE,
                    ux_mode: "popup",
                    callback: (response) => {
                        if (response.code) handler.current(response.code)
                        else setError("Google returned no authorization code. Try again.")
                    },
                    error_callback: (err) => {
                        // popup_closed is the operator changing their mind, not a fault.
                        if (err?.type === "popup_closed") return
                        setError("Google sign-in did not complete. Try again.")
                    },
                })
                setReady(true)
            })
            .catch(() => {
                if (!cancelled) setError("Could not load Google sign-in. Check your connection and retry.")
            })

        return () => {
            cancelled = true
        }
    }, [])

    const start = useCallback(() => {
        setError(null)
        client.current?.requestCode()
    }, [])

    if (error) {
        return (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
            </div>
        )
    }

    return (
        <Button className="w-full" variant="outline" onClick={start} disabled={!ready}>
            <GoogleMark />
            {ready ? "Sign in with Google" : "Loading Google sign-in..."}
        </Button>
    )
}

function GoogleMark() {
    return (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.06 12.25c0-.83-.07-1.62-.21-2.39H12v4.51h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.5z" />
            <path fill="#34A853" d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.7v2.98A11.5 11.5 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.55 14.68a6.9 6.9 0 0 1 0-4.4V7.3H1.7a11.5 11.5 0 0 0 0 10.36l3.85-2.98z" />
            <path fill="#EA4335" d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.29C17.71 1.27 15.1 0 12 0 7.48 0 3.58 2.59 1.7 6.34l3.85 2.98C6.46 6.77 9 4.75 12 4.75z" />
        </svg>
    )
}
