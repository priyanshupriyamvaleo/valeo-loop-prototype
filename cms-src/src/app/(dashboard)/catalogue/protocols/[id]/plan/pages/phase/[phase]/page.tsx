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
    /* BOTH segments, because the route carries both. One entry per phase of
       each protocol the export holds. */
    return ["1", "2", "3"].map(phase => ({ id: "prot-glp1-wl", phase }))
}

export default function Page() {
    return <Client />
}
