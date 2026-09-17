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
    /* Every seeded chat, plus the blank one. An id the export does not
       name is a 404 on Pages: there is no server to resolve it. */
    return [
        { id: "new" },
        { id: "onb-website-protocols" },
    ]
}

export default function Page() {
    return <Client />
}
