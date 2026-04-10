.PHONY: help dev build test check-bash

help:
	@echo "Metabrowse development commands:"
	@echo ""
	@echo "  make dev         - Start Vite dev server (port 3000)"
	@echo "  make build       - Production build to dist/"
	@echo "  make test        - Run vitest tests"
	@echo "  make check-bash  - Run shellcheck on metabrowse-wiz.sh"
	@echo "  make help        - Show this help message"

dev:
	VITE_BASE=/ npm run dev

build:
	VITE_BASE=/metabrowse/ npm run build

test:
	npm test

check-bash:
	shellcheck metabrowse-wiz.sh
