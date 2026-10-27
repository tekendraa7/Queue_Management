#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -c 'import sys; assert sys.version_info >= (3, 10), "Python 3.10 or newer is required"'
if [ ! -d .venv ]; then
  python3 -m venv .venv || { echo 'Install python3-venv using your distribution package manager, then retry.'; exit 1; }
fi
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo
.venv/bin/python manage.py check
echo 'Setup complete. Start with: bash scripts/run.sh'
