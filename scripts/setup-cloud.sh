#!/bin/bash
# Script di preparazione per l'ambiente cloud di Claude Code (campo "Setup script").
# Se il browser di test non si installa per i limiti di rete, non è grave:
# i test completi girano comunque su GitHub Actions a ogni modifica.
pip install -r requirements.txt || true
python3 -m playwright install --with-deps chromium || echo "Browser di test non installato: usa i risultati di GitHub Actions"
