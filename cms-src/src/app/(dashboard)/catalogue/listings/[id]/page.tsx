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
    /* The blank one, plus every listing the Package Builder links to. The
       sheet opens a catalogue item per row, and an id the export does not
       name is a 404 on Pages — there is no server to resolve it. */
    return [
        { id: "new" },
        { id: "demo-panel-male" },
        { id: "demo-panel-female" },
        { id: "demo-med-bpc" },
        { id: "demo-med-glp1" },
        { id: "demo-consult-peptide" },
        { id: "demo-consult-gp" },
        { id: "demo-followup-review" },
        { id: "demo-voucher-supp" },
    ]
}

export default function Page() {
    return <Client />
}
