#!/usr/bin/env bash
# build-metabrowse.sh - Build metabrowse HTML from markdown content
#
# This script should be run from a metabrowse content directory (containing text/ and docs/).
# It locates the metabrowse code repository and invokes the build pipeline.

set -euo pipefail

# PS4 provides good diagnostics when -x is turned on
#shellcheck disable=2154
PS4='$( _0=$?; exec 2>/dev/null; realpath -- "${BASH_SOURCE[0]:-?}:${LINENO} ^$_0 ${FUNCNAME[0]:-?}()=>" ) '
[[ -n "${DEBUGSH:-}" ]] && set -x

scriptName="${scriptName:-"$(command readlink -f -- "$0")"}"
scriptDir="$(command dirname -- "${scriptName}")"

export METABROWSE_CODE_DIR=${METABROWSE_CODE_DIR:-"${scriptDir}"}
export METABROWSE_PYTHON="${HOME}/.local/bin/python3"

die() {
    builtin echo "ERROR($(basename "${scriptName}")): $*" >&2
    builtin exit 1
}

{  # outer scope braces

    usage() {
        cut -c 12- <<'EOF'
            Usage: build-metabrowse.sh [OPTIONS]

            Build metabrowse HTML from markdown content in the current directory.

            This script must be run from a metabrowse content directory containing:
              - text/     Source markdown files
              - docs/     Generated HTML output (will be created/updated)

            OPTIONS:
              -h, --help    Show this help message

            ENVIRONMENT VARIABLES:
              METABROWSE_CODE_DIR   Path to metabrowse code repository
                                    (default: directory containing this script)
              METABROWSE_PYTHON     Python interpreter path
                                    (default: ~/.local/bin/python3)

            EXAMPLES:
              cd ~/my-metabrowse-links
              build-metabrowse.sh

              # Use different metabrowse code location
              METABROWSE_CODE_DIR=/opt/metabrowse build-metabrowse.sh
EOF
        builtin exit 2
    }

    validate_content_dir() {
        local content_dir="$1"

        if [[ ! -d "${content_dir}/text" ]]; then
            die "No text/ directory found in ${content_dir}. Please run from a metabrowse content directory."
        fi

        if [[ ! -e "${content_dir}/text/README.md" ]]; then
            die "No text/README.md file found. The content directory must contain text/README.md as the root index."
        fi
    }

    validate_code_dir() {
        local code_dir="$1"

        if [[ ! -d "${code_dir}" ]]; then
            die "Metabrowse code directory not found: ${code_dir}"
        fi

        if [[ ! -f "${code_dir}/build.py" ]]; then
            die "build.py not found in ${code_dir}. METABROWSE_CODE_DIR must point to the metabrowse code repository."
        fi

        if [[ ! -f "${code_dir}/parser.py" ]] || [[ ! -f "${code_dir}/transformer.py" ]] || [[ ! -f "${code_dir}/generator.py" ]]; then
            die "Missing required modules in ${code_dir}. Expected parser.py, transformer.py, and generator.py."
        fi
    }

    validate_python() {
        local python_path="$1"

        if [[ ! -x "${python_path}" ]]; then
            die "Python interpreter not found or not executable: ${python_path}"
        fi

        # Check for required modules
        if ! "${python_path}" -c "import jinja2" &>/dev/null; then
            die "Python module 'jinja2' not found. Install with: ${python_path} -m pip install -r ${METABROWSE_CODE_DIR}/requirements.txt"
        fi
    }

    run_build() {
        local content_dir="$1"
        local code_dir="$2"
        local python_path="$3"

        echo "==> Building metabrowse site" >&2
        echo "    Content directory: ${content_dir}" >&2
        echo "    Code directory: ${code_dir}" >&2
        echo "    Python: ${python_path}" >&2
        echo "" >&2

        # Change to content directory and run build.py from code directory
        cd "${content_dir}" || die "Failed to change to content directory: ${content_dir}"

        # Run build.py with code directory in Python path
        PYTHONPATH="${code_dir}:${PYTHONPATH:-}" "${python_path}" "${code_dir}/build.py" || die "Build failed"

        echo "" >&2
        echo "==> Build complete!" >&2
        echo "    Generated HTML in: ${content_dir}/docs/" >&2
    }

}

main() {
    # Parse arguments
    if [[ "${1:-}" = "-h" ]] || [[ "${1:-}" = "--help" ]]; then
        usage
    fi

    if [[ "$#" -gt 0 ]]; then
        die "Unknown option: $1 (use -h for help)"
    fi

    # Get current directory as content directory
    local content_dir
    content_dir="$(pwd)"

    # Validate all requirements
    validate_content_dir "${content_dir}"
    validate_code_dir "${METABROWSE_CODE_DIR}"
    validate_python "${METABROWSE_PYTHON}"

    # Run the build
    run_build "${content_dir}" "${METABROWSE_CODE_DIR}" "${METABROWSE_PYTHON}"
}

if [[ -z "${sourceMe:-}" ]]; then
    main "$@"
    builtin exit
fi
command true
