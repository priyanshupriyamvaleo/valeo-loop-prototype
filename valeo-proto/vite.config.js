import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* ── THREE PROTOTYPES, ONE ORIGIN ──
   Three separate products with three URLs, built and reasoned about
   separately: the consumer app, the Admin Panel that authors protocols, and
   the Coach Panel a clinician works a queue in. They are served from one origin
   on purpose: localStorage is origin-scoped, and the `storage` event only
   reaches other tabs of the SAME origin.
   That event is the whole demo. Publish in the Studio tab and the patient tab
   unlocks live, with no refresh and no polling. Two dev servers on two ports
   would be two origins, and the link would quietly not work. */
export default defineConfig({
  plugins: [react()],
  base: '/valeo-loop-prototype/',
  server: { port: 5180, strictPort: true, fs: { allow: ['..'] } },
  /* Built into a staging directory of its own, never straight into the repo
     root: that root already holds a hand-maintained `assets/` folder with real
     images in it, and an emptyOutDir pointed there would delete them. deploy.sh
     copies the outputs out afterwards, and `proto-assets` keeps this build's JS
     and CSS clear of that same folder. */
  build: {
    outDir: '../.proto-build',
    emptyOutDir: true,
    assetsDir: 'proto-assets',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        p1: resolve(__dirname, 'p1/index.html'),
        p2: resolve(__dirname, 'p2/index.html'),
        p3: resolve(__dirname, 'p3/index.html'),
      },
    },
  },
});
