#!/bin/bash
# build-editor.sh - Build the metabrowse editor SPA
#
# Run this after making changes to editor/ source files.
# The built output in editor/dist/ must be committed to this repo
# so that Jenkins can deploy it without needing Node.js.
#
# Usage:
#   ./build-editor.sh
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
