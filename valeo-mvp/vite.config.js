import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },

  /* ── GITHUB PAGES ──
     Pages serves this repo from https://<user>.github.io/valeo-loop-prototype/,
     so every asset URL needs that prefix baked in at build time — without it the
     app loads and then 404s on its own JS, which looks like a white screen.

     The build lands in ../v1 rather than ./dist so the published URL is
     .../valeo-loop-prototype/v1/ instead of .../valeo-v1/dist/, and because
     dist is gitignored and this output has to be committed for Pages to serve
     it. `base` is relative-safe for local dev too: `vite dev` ignores it. */
  base: '/valeo-loop-prototype/mvp/',
  build: { outDir: '../mvp', emptyOutDir: true },
})
