#!/usr/bin/env bash
# Note: no `set -e` — llmo-checker returns non-zero exit code on low scores,
# but the JSON output is still valid. We validate by JSON-parse instead.
set -uo pipefail

cd "$(dirname "$0")"
CHECKER=/home/iris/repos/llmo-checker/dist/cli.js
mkdir -p results

success=0
failed=0
while IFS= read -r url; do
  [[ -z "$url" || "$url" =~ ^# ]] && continue
  slug=$(echo "$url" | sed 's|https://||; s|/$||; s|/|_|g; s|:|_|g')
  out="results/${slug}.json"

  if [[ -f "$out" ]]; then
    echo "[skip] $url (cached)"
    success=$((success+1))
    continue
  fi

  echo "[run] $url"
  node "$CHECKER" "$url" --json > "$out" 2>/dev/null || true

  # Validate the output: parseable JSON with a numeric score
  score=$(python3 -c "
import json, sys
try:
    d = json.load(open('$out'))
    s = d.get('score')
    if isinstance(s, (int, float)):
        print(s)
    else:
        sys.exit(1)
except Exception:
    sys.exit(1)
" 2>/dev/null)

  if [[ -n "$score" ]]; then
    echo "[ok]  $url → $score"
    success=$((success+1))
  else
    echo "[err] $url (invalid JSON or no score)"
    rm -f "$out"
    failed=$((failed+1))
  fi
  sleep 1
done < urls.txt

echo ""
echo "=== Done. success=$success failed=$failed ==="
