#!/usr/bin/env bash
# fetch-emissary-art.sh
# Downloads the eight merman portrait PNGs from GitHub user-attachments and
# places them into src/renderer/src/assets/emissary/.
#
# Run from the repository root:
#   bash scripts/fetch-emissary-art.sh
#
# Requires: curl

set -euo pipefail

ASSET_DIR="$(cd "$(dirname "$0")/.." && pwd)/src/renderer/src/assets/emissary"

if [[ ! -d "$ASSET_DIR" ]]; then
  echo "ERROR: asset directory not found at $ASSET_DIR" >&2
  exit 1
fi

declare -A IMAGES=(
  # Confirmed mappings (5/8)
  ["smug"]="https://github.com/user-attachments/assets/c5a103f9-4127-4aea-8458-2d47b4fe3bb1"
  ["waving"]="https://github.com/user-attachments/assets/8c877a2c-52fa-4f95-8a44-560f84931d88"
  ["distressed"]="https://github.com/user-attachments/assets/ed8d3169-7d21-4b8b-af56-d14a4040df4d"
  ["thinking"]="https://github.com/user-attachments/assets/2809ac0f-f324-47b7-a993-ece5c35bf447"
  ["excited"]="https://github.com/user-attachments/assets/21c94362-00ca-4f13-a1cc-a20b67acd201"
  # Remaining three slots — update URLs once artwork is confirmed:
  ["laughing"]="https://github.com/user-attachments/assets/02a4ea0d-dd78-488e-96ca-f886f0f5214d"
  ["crying"]="https://github.com/user-attachments/assets/60b71ac2-0366-4f14-bdb1-465b281dc549"
  ["flexing"]="https://github.com/user-attachments/assets/7987db05-869a-4655-9eac-d977b817357c"
)

echo "Downloading emissary portraits into $ASSET_DIR"

for emotion in "${!IMAGES[@]}"; do
  url="${IMAGES[$emotion]}"
  dest="$ASSET_DIR/${emotion}.png"
  printf "  %-12s <- %s\n" "${emotion}.png" "$url"
  if curl -fsSL --max-time 30 "$url" -o "$dest"; then
    size=$(wc -c < "$dest")
    echo "             $size bytes"
  else
    echo "  FAILED: $emotion" >&2
  fi
done

echo "Done."
