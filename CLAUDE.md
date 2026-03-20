# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Metabrowse is a markdown-to-HTML static site generator designed for teaching materials. It converts README.md files in `text/` to HTML in `docs/` with two key features:
1. **Collapsible link groups** - organize links into expandable sections
2. **Browser tab reuse** - each unique URL gets a deterministic hash-based target attribute so clicking the same link reuses the same browser tab

## Build Commands

```bash
# Build the entire site
make build
# or directly:
~/.local/bin/python3 build.py

# Clean generated files
make clean

# Install dependencies
~/.local/bin/python3 -m pip install -r requirements.txt
```

Note: This project uses `~/.local/bin/python3` as the Python interpreter path.

## Architecture

The codebase implements a three-stage pipeline:

### 1. Parser (`parser.py`)
- Reads README.md files and extracts structured data
- Uses regex patterns to identify different link formats:
  - Plain URLs: `https://example.com`
  - Markdown links: `[text](url)` or `[text](url){target="..."}`
  - Raw HTML `<a>` tags (passed through unchanged)
  - Title + URL: `Title text https://example.com`
- Detects groups: lines starting with `- ` but containing no URL
- Returns `ParsedDocument` containing ungrouped links and groups

Key classes:
- `Link`: Represents a single link with metadata (url, text, target, indent_level)
- `Group`: Represents a collapsible group with name and child links
- `ParsedDocument`: Contains ungrouped_links and groups

### 2. Transformer (`transformer.py`)
- Converts parsed data to HTML-ready structures
- **Critical feature**: Generates deterministic target names using SHA256 hash (first 8 chars)
  - Same URL always gets same target → enables tab reuse
  - Explicit `{target="..."}` attributes override the hash
- Returns `HTMLDocument` with title, ungrouped_links, and groups

Key method: `generate_target(url)` - creates hash-based target for tab reuse

### 3. Generator (`generator.py`)
- Uses Jinja2 templates to render final HTML
- Template location: `templates/index.html`
- Copies static assets (CSS) to docs/
- Creates `.nojekyll` file for GitHub Pages compatibility
- Calculates relative CSS paths for nested directories

### 4. Build Script (`build.py`)
- Orchestrates the pipeline
- Walks `text/` directory tree to find all README.md files
- Mirrors directory structure: `text/foo/README.md` → `docs/foo/index.html`
- Generates page titles from directory names
- Calculates relative CSS paths based on nesting depth

## Directory Structure

```
metabrowse/
├── text/              # Source markdown files (input)
│   ├── README.md      # Root index
│   └── <course>/
│       └── README.md  # Course-specific links
├── docs/              # Generated HTML (output, GitHub Pages)
├── templates/         # Jinja2 templates
│   ├── index.html     # Main template
│   └── style.css      # Shared stylesheet
├── parser.py          # Stage 1: Extract links/groups
├── transformer.py     # Stage 2: Generate targets, prepare HTML data
├── generator.py       # Stage 3: Render templates
└── build.py           # Main orchestrator
```

## Markdown Syntax for text/ Files

**Groups** (collapsible sections):
```markdown
- Group Name
  - https://link1.com
  - Link title https://link2.com
  - [Link text](https://link3.com)
```

**Link formats supported**:
- Plain URL: `- https://example.com`
- With title: `- Link title https://example.com`
- Markdown: `- [Link text](https://example.com)`
- With explicit target: `- [Link text](https://example.com){target="_custom"}`
- Raw HTML: `- <a href="https://example.com">Text</a>`

**Group detection rule**: A line starting with `- ` that contains no URL is treated as a group header. Links indented with more spaces than the group header become children of that group.

## Key Implementation Details

1. **Target generation**: The transformer uses `hashlib.sha256(url.encode()).hexdigest()[:8]` to create deterministic 8-character target names. This is the core feature enabling tab reuse.

2. **Indentation handling**: The parser tracks indent levels (spaces before content) to determine group membership. Children must have more spaces than their parent group header.

3. **CSS path calculation**: `build.py:calculate_css_path()` computes relative paths using `../` based on directory depth to ensure CSS loads correctly at all nesting levels.

4. **HTML rendering**: Uses `<details>` and `<summary>` elements for collapsible groups (no JavaScript needed).

## Development Workflow

When modifying the pipeline:
1. Parser changes affect link/group extraction from markdown
2. Transformer changes affect target generation or data structure
3. Generator changes affect HTML rendering or template usage
4. Build script changes affect file discovery or path handling

After changes, run `make build` to regenerate all HTML files.

## GitHub Pages Deployment

The `docs/` directory is configured for GitHub Pages:
- `.nojekyll` file disables Jekyll processing
- All paths are relative for portability
- Static HTML requires no build step on GitHub's end
