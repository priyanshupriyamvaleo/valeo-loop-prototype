"use client"

import { useCallback, useState } from "react"
import { useAuth } from "@/lib/auth"
import { GoogleSignInButton } from "@/components/common/GoogleSignInButton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"

export default function LoginPage() {
    const { loginWithGoogle, isLoading } = useAuth()
    const [error, setError] = useState<string | null>(null)

    const handleCode = useCallback(
        async (code: string) => {
            setError(null)
            try {
                await loginWithGoogle(code)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Sign-in failed.")
            }
        },
        [loginWithGoogle],
    )

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Valeo Headless CMS</CardTitle>
                    <CardDescription className="text-center">
                        Sign in with your Valeo Google account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Signing in...
                        </div>
                    ) : (
                        <GoogleSignInButton onCode={handleCode} />
                    )}

                    {error && (
                        <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <p className="text-center text-xs text-muted-foreground">
                        Access is granted per account. If yours is refused, ask the catalogue team to add it.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
