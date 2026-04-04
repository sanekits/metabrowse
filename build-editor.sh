#!/usr/bin/env bash
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
set -ue

#shellcheck disable=2154
PS4='$( _0=$?; exec 2>/dev/null; realpath -- "${BASH_SOURCE[0]:-?}:${LINENO} ^$_0 ${FUNCNAME[0]:-?}()=>" ) '
[[ -n "${DEBUGSH:-}" ]] && set -x

set -o pipefail

scriptName="${scriptName:-"$(command readlink -f -- "$0")"}"

main() {
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
}

if [[ -z "${sourceMe:-}" ]]; then
    main "$@"
    builtin exit
fi
command true
