const path = require("path")

/**
 * TWO BUILDS FROM ONE SOURCE.
 *
 * Default: the ordinary server build, unchanged.
 *
 * STATIC_EXPORT=1: a flat folder of HTML for GitHub Pages. Pages serves files
 * and runs nothing, so this build has no API routes, no middleware and no
 * session. Everything the two demo sections need is seeded in the client
 * anyway — the catalogue API answers 401 without a signed-in browser and the
 * code already falls back — so the export behaves as the local app does.
 */
const isExport = process.env.STATIC_EXPORT === "1"

/** @type {import('next').NextConfig} */
const nextConfig = {
    distDir: process.env.NEXT_DIST_DIR || ".next",
    outputFileTracingRoot: __dirname,
    eslint: { ignoreDuringBuilds: true },
    ...(isExport ? {
        output: "export",
        // The Pages site serves the repo at /valeo-loop-prototype/, and this
        // build sits in /cms under it.
        basePath: "/valeo-loop-prototype/cms",
        assetPrefix: "/valeo-loop-prototype/cms",
        // Pages has no image optimiser.
        images: { unoptimized: true },
        trailingSlash: true,
    } : {}),
}

module.exports = nextConfig
