#!/usr/bin/env bash
# Build the three prototypes and place them at /p1/, /p2/ and /p3/ on the Pages site.
#
# The build stages into .proto-build first. Copying rather than building in
# place is deliberate: the repo root carries its own `assets/` folder of real
# images, and a Vite outDir pointed at the root with emptyOutDir would delete
# them.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/.." && pwd)"
stage="$root/.proto-build"

export PATH="$HOME/.local/opt/node/bin:$PATH"
cd "$here"
npx vite build

# Replace only the three paths this build owns.
rm -rf "$root/p1" "$root/p2" "$root/p3" "$root/proto-assets"
cp -R "$stage/p1"           "$root/p1"
cp -R "$stage/p2"           "$root/p2"
cp -R "$stage/p3"           "$root/p3"
cp -R "$stage/proto-assets" "$root/proto-assets"
# The launcher that links the three, kept off the repo root so it cannot shadow
# anything already served from there.
mkdir -p "$root/proto"
cp "$stage/index.html" "$root/proto/index.html"

echo "p1  -> $root/p1"
echo "p2  -> $root/p2"
echo "p3  -> $root/p3"
echo "assets -> $root/proto-assets"
