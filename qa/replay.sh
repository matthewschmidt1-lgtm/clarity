#!/bin/sh
# Replays persona sessions through the real engine and prints the transcript + report + model for each.
# Usage (server on :8960 running from the Clarity folder):  sh qa/replay.sh [personas/sessions.json]
FILE="${1:-personas/sessions.json}"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --virtual-time-budget=3000 --dump-dom "http://127.0.0.1:8960/qa/replay.html?file=$FILE" 2>/dev/null \
 | python3 -c 'import sys,re,html; d=sys.stdin.read(); m=re.search(r"<pre id=\"out\">(.*?)</pre>", d, re.S); print(html.unescape(m.group(1)) if m else "no output; is the server running?")'
