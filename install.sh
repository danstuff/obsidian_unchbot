#!/usr/bin/env bash
# Build the Unchbot plugin and install it into an Obsidian vault.
#
# Usage: ./install.sh /path/to/vault

set -euo pipefail

if [[ $# -ne 1 ]]; then
	echo "Usage: $0 <path-to-obsidian-vault>" >&2
	exit 1
fi

vault="$1"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

if [[ ! -d "$vault" ]]; then
	echo "Error: vault directory '$vault' does not exist" >&2
	exit 1
fi

if [[ ! -d "$vault/.obsidian" ]]; then
	echo "Error: '$vault' does not look like an Obsidian vault (no .obsidian directory)" >&2
	exit 1
fi

plugin_id="$(node -pe "require('$script_dir/manifest.json').id")"
plugin_dir="$vault/.obsidian/plugins/$plugin_id"

echo "Building plugin..."
(cd "$script_dir" && npm run build)

mkdir -p "$plugin_dir"

echo "Installing to $plugin_dir"
cp "$script_dir/manifest.json" "$plugin_dir/"
cp "$script_dir/main.js" "$plugin_dir/"
if [[ -f "$script_dir/styles.css" ]]; then
	cp "$script_dir/styles.css" "$plugin_dir/"
fi

echo "Done. Enable '$plugin_id' in Obsidian under Settings > Community plugins."
