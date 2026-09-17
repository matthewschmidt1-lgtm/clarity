#!/bin/sh
# Runs the engine tests in headless Chrome against a local server on :8960 and prints a scorecard.
# Usage: from the Clarity folder, with `python3 -m http.server 8960` running:  sh qa/run.sh
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CH" --headless=new --disable-gpu --virtual-time-budget=3000 --dump-dom "http://127.0.0.1:8960/qa/run.html" 2>/dev/null \
 | python3 -c '
import sys, re, json, html
dom = sys.stdin.read()
m = re.search(r"<pre id=\"out\">(.*?)</pre>", dom, re.S)
if not m: print("no output; is the server running?"); sys.exit(1)
d = json.loads(html.unescape(m.group(1)))
tot = ok = 0
print("CLARITY ENGINE TESTS\n" + "-"*60)
for r in d["results"]:
    fails = [c for c in r["checks"] if not c["ok"]]
    tot += len(r["checks"]); ok += len(r["checks"]) - len(fails)
    print(("PASS" if not fails else "FAIL") + "  " + r["id"] + "   pivot: " + r["pivot"])
    for c in fails: print("      x " + c["name"] + "  (got: " + str(c["got"]) + ")")
print("-"*60 + "\nMUTATIONS")
for mu in d["muts"]:
    tot += 1; ok += mu["ok"]
    print(("PASS" if mu["ok"] else "FAIL") + "  " + mu["id"])
    if not mu["ok"]: print("      before: " + str(mu["before"]) + "\n      after:  " + str(mu["after"]))
print("-"*60 + "\n%d / %d checks passed" % (ok, tot))
sys.exit(0 if ok == tot else 2)
'
