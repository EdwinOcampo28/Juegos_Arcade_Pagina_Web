#!/bin/sh
cd "$(dirname "$0")/frontend" || exit 1
python3 -m http.server 5500
