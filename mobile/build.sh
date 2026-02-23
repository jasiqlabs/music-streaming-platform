#!/usr/bin/env bash
set -euo pipefail

npm install --legacy-peer-deps
npx expo export --platform web --output-dir dist
