/**
 * A SERVER WRAPPER, for the static export only.
 *
 * A page cannot be "use client" AND declare its own static params, and
 * the export has no server to resolve an id on demand. So the screen
 * moved to Client.tsx untouched, and this names the ids Pages will hold.
 * The screen reads the id from useParams() as it always did.
 */
import Client from "./Client"

export function generateStaticParams() {
    return [
        { id: "new" },
    ]
}

export default function Page() {
    return <Client />
}
