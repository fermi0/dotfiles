#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT="/home/work/projects/zurnel-saas"
cd "$PROJECT_ROOT"
exec npx playwright test e2e "$@"
