#!/usr/bin/env bash
set -euo pipefail
root=/home/ichabod/apps/one-long-thread
mkdir -p "$root/artifacts"
docker run --rm --network ichabod-proxy --shm-size=256m --cpus=1 --memory=1g \
  -v "$root:/work:ro" -v "$root/artifacts:/work/artifacts" \
  -w /tmp mcr.microsoft.com/playwright:v1.55.0-noble \
  bash -c 'npm install --no-audit --no-fund playwright-core@1.55.0 >&2 && NODE_PATH=/tmp/node_modules node /work/tests/browser.cjs "$1" "$2"' \
  _ "${1:?URL required}" "${2:-4}"
