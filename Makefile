.PHONY: help install test check-bash

PYTHON := ~/.local/bin/python3

help:
	@echo "Metabrowse development commands:"
	@echo ""
	@echo "  make install     - Install Python dependencies"
	@echo "  make check-bash  - Run shellcheck on build-metabrowse.sh"
	@echo "  make test        - Run tests (if implemented)"
	@echo "  make help        - Show this help message"
	@echo ""
	@echo "Note: This is the CODE repository. To build content:"
	@echo "  cd /path/to/your-content-repo"
	@echo "  /path/to/metabrowse/build-metabrowse.sh"

install:
	$(PYTHON) -m pip install -r requirements.txt

check-bash:
	shellcheck build-metabrowse.sh

test:
	@echo "No tests implemented yet"
	@exit 1
