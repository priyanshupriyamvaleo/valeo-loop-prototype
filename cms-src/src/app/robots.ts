/* Pages serves files and runs nothing, so this is baked at build time. */
export const dynamic = "force-static"

import type { MetadataRoute } from "next"

// Prototype holds real catalogue data — keep it out of search indexes.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: "*", disallow: "/" },
    }
}
