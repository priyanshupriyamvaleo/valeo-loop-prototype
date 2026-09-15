import { CardDescription } from "@/components/ui/card"
import { Construction } from "lucide-react"

export default function ComingSoon({ title, description }: { title: string, description?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="p-4 bg-muted rounded-full">
                <Construction className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                <CardDescription className="text-lg max-w-md mx-auto">
                    {description || "This legacy module is currently being migrated to the new architecture. Check back soon!"}
                </CardDescription>
            </div>
        </div>
    )
}
