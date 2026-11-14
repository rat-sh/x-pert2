#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
if [ "${SKIP_DB:-0}" = "1" ]; then
  base=$(git merge-base HEAD origin/main)
  if git diff --name-only "$base"...HEAD | grep -q '^supabase/'; then
    echo "FAIL: SKIP_DB but supabase/ changed"
    exit 1
  fi
fi
if [ "${SKIP_DB:-0}" != "1" ]; then
  docker info >/dev/null 2>&1 || { echo "BLOCKED: docker not running"; exit 2; }
  npx --yes supabase start --exclude studio --ignore-health-check >/dev/null 2>&1 || true
  npx supabase db reset
  npx supabase test db
fi
bun install --frozen-lockfile
node node_modules/typescript/bin/tsc --noEmit
bun run lint
bun run build
if grep -q '"test"' package.json; then bun run test; fi
echo VERIFY_OK
