#!/bin/bash
# build-editor.sh - Build the metabrowse editor SPA
#
# Run this after making changes to editor/ source files.
# The built output in editor/dist/ must be committed to this repo
# so that Jenkins can deploy it without needing Node.js.
#
# The DEFAULT_HOST is injected at build time via VITE_DEFAULT_HOST environment variable.
# If not set, defaults to 'github.com' (public GitHub).
#
# Usage:
#   ./build-editor.sh                                      # Uses default
#   VITE_DEFAULT_HOST=<your-github-host> ./build-editor.sh  # Use custom host
#
set -ueo pipefail

cd "$(dirname "$0")/editor"

if [[ ! -d node_modules ]]; then
    echo "Installing dependencies..."
    npm ci
fi

echo "Building editor SPA..."
npm run build

git add dist/

echo ""
echo "Build complete: editor/dist/ (staged for commit)"
