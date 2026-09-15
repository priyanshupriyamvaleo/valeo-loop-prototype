#!/usr/bin/env bash
# ── Is production actually running main? ──────────────────────
#
# Answers the one question the deploy pipeline cannot answer about itself: a
# workflow that never RUNS produces no failure, no notification and no red
# tick — it is indistinguishable from a repo where nobody pushed. That is how
# seven merges to main shipped nothing after this repo moved to a new org
# (repository secrets do not survive a transfer) and production sat eleven
# hours stale without a single signal, including a data-loss fix.
#
# Read-only: deploys nothing, changes nothing.
#
#   ./scripts/check-deploy-freshness.sh
#
set -euo pipefail

SCOPE="${VERCEL_SCOPE:-ritwik-28s-projects}"

git fetch -q origin main
COMMIT_TS="$(git log -1 --format=%ct origin/main)"
echo "origin/main    $(git rev-parse --short origin/main)  $(git log -1 --format='%s' origin/main)"

LATEST="$(npx --yes vercel ls --scope="$SCOPE" 2>/dev/null \
  | sed 's/\x1b\[[0-9;]*m//g' | grep -oE 'https://[a-z0-9-]+\.vercel\.app' | head -1 || true)"

if [ -z "$LATEST" ]; then
    echo "latest deploy  unknown — could not read the deployment list."
    exit 1
fi

# `vercel ls` drops its Age column when stdout is not a TTY, so the age comes
# from the deployment's own record rather than from the table.
CREATED="$(npx --yes vercel inspect "$LATEST" --scope="$SCOPE" 2>&1 \
  | sed 's/\x1b\[[0-9;]*m//g' | awk '/created/ {sub(/.*created[ \t]*/, ""); print; exit}' || true)"
DEPLOY_TS="$(python3 - "$CREATED" <<'PYEOF'
import re, sys, datetime
raw = sys.argv[1] if len(sys.argv) > 1 else ""
m = re.match(r"([A-Za-z]{3} [A-Za-z]{3} \d{2} \d{4} \d{2}:\d{2}:\d{2}) GMT([+-]\d{4})", raw.strip())
if not m:
    print("")
else:
    dt = datetime.datetime.strptime(m.group(1), "%a %b %d %Y %H:%M:%S")
    off = m.group(2)
    delta = datetime.timedelta(hours=int(off[1:3]), minutes=int(off[3:5]))
    if off[0] == "+":
        dt -= delta
    else:
        dt += delta
    print(int(dt.replace(tzinfo=datetime.timezone.utc).timestamp()))
PYEOF
)"

echo "latest deploy  $LATEST"

if [ -z "$DEPLOY_TS" ]; then
    echo "               created ${CREATED:-unknown} (could not parse the age)"
else
    NOW="$(date +%s)"
    DEPLOY_AGE_M=$(( (NOW - DEPLOY_TS) / 60 ))
    COMMIT_AGE_M=$(( (NOW - COMMIT_TS) / 60 ))
    echo "               deployed ${DEPLOY_AGE_M}m ago; newest commit ${COMMIT_AGE_M}m ago"
    echo
    if [ "$DEPLOY_TS" -ge "$COMMIT_TS" ]; then
        echo "OK — the deploy is newer than the newest commit on main."
        exit 0
    fi
    echo "STALE — main has commits that were never deployed."
fi

echo
echo "Then:"
echo "  1. Settings -> Actions -> General -> allow Actions to run"
echo "  2. Settings -> Secrets and variables -> Actions -> add VERCEL_TOKEN"
echo "  3. Actions -> 'Deploy to production' -> Run workflow"
echo
echo "To ship the current main by hand in the meantime:"
echo "  npx vercel build --prod --scope=$SCOPE && npx vercel deploy --prebuilt --prod --scope=$SCOPE"
