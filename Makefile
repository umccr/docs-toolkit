# Shortcuts for this repository: the toolkit and its tools in a virtualenv (.venv), and Node.js for the theme script's
# tests. Run `make install` once, then `make check`, `make test` and `make sites` before pushing; CI runs the same.

PYTHON ?= python3.12
VENV ?= .venv
NODE ?= node

BIN := $(VENV)/bin

# Recipes call the virtualenv's tools by path: make 3.81, as macOS ships it, runs a simple command without a shell and
# looks it up on its own PATH, ignoring this one. The export still reaches child processes, so pre-commit's hooks find
# ruff and the toolkit.
export PATH := $(abspath $(BIN)):$(PATH)

EXAMPLES := examples/basic-site/mkdocs.yml examples/obsidian-vault/mkdocs.yml

# The site `make serve` previews.
CONFIG ?= examples/basic-site/mkdocs.yml

.PHONY: install check fix test sites serve clean

# A virtualenv with the hash-pinned engine, the dev tools and the toolkit (editable), and the git hook that runs the
# pre-commit hooks on each commit, with their environments, so a first commit has nothing to download.
install:
	@test -x $(BIN)/python || $(PYTHON) -m venv $(VENV)
	@$(BIN)/pip install --quiet --require-hashes --no-deps -r requirements/build.txt
	@$(BIN)/pip install --quiet --require-hashes -r requirements/dev.txt
	@$(BIN)/pip install --quiet --no-deps -e .
	@pre-commit install --install-hooks

# Lint and formatting, the workflows, then the pre-commit hooks (secrets, the information boundary).
check:
	@$(BIN)/ruff check .
	@$(BIN)/ruff format --check .
	@$(BIN)/actionlint
	@$(BIN)/zizmor --no-progress .github/workflows
	@pre-commit run --all-files

fix:
	@$(BIN)/ruff check --fix .
	@$(BIN)/ruff format .

# pytest, with strict builds of the examples; then the theme script's tests, with Node's own test runner.
test:
	@$(BIN)/pytest
	@$(NODE) --test tests/js/*.test.mjs

# Strict builds and pre-publish checks of the examples, as CI runs them, each into build/sites/<example>.
sites:
	@for config in $(EXAMPLES); do \
	  site="build/sites/$$(basename "$$(dirname "$$config")")"; \
	  $(BIN)/umccr-docs check --config "$$config" && \
	  $(BIN)/umccr-docs build --config "$$config" --site-dir "$$site" && \
	  $(BIN)/umccr-docs verify-site "$$site" || exit 1; \
	done

# Preview an example on http://127.0.0.1:8000, rebuilt as it changes; the vault with
# `make serve CONFIG=examples/obsidian-vault/mkdocs.yml`.
serve:
	@$(BIN)/umccr-docs serve --config $(CONFIG)

# Build output only; the virtualenv stays.
clean:
	@rm -rf build dist .umccr-docs examples/*/.umccr-docs
