/**
 * A SERVER WRAPPER, for the static export only.
 *
 * This page sits under [id], so the export needs the ids it should build. The
 * screen moved to Client.tsx untouched and still reads the id from useParams().
 */
import Client from "./Client"

export function generateStaticParams() {
    return [
        { id: "prot-glp1-wl" },
    ]
}

export default function Page() {
    return <Client />
}
