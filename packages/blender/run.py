#!/usr/bin/env python3
"""Blender cache runner (interface only).

usage: run.py --params params.json --object <name> --out <cache root>

Reads params.json, computes the cache key and prints the output directory
<out>/<object>/<key>/. The key is FNV-1a 64 (16 hex digits) over the UTF-8 bytes of the
canonical JSON of the params: object keys sorted at every level, no whitespace, numbers
and strings written the way JavaScript's JSON.stringify writes them. src/key.ts computes
the same value; tests/vectors.json pins both.

Contract for the part that is not implemented here: the Blender generator reads the same
params.json, renders the sequence and writes one PNG per frame into that directory as
%04d.png (0000.png, 0001.png, ...). The Remotion component BlenderSequence then reads
public/<base>/<object>/<key>/<frame>.png. This script never starts Blender.
"""
import argparse
import json
import math
import os
import sys
from decimal import Decimal

FNV_OFFSET = 0xCBF29CE484222325
FNV_PRIME = 0x100000001B3
MASK = 0xFFFFFFFFFFFFFFFF


def _js_number(x):
    """Format a number like JavaScript's Number.prototype.toString."""
    if isinstance(x, bool):
        raise TypeError("bool is not a number")
    if isinstance(x, int):
        x = float(x) if abs(x) >= 2**53 else x
        if isinstance(x, int):
            return str(x)
    if math.isnan(x) or math.isinf(x):
        return "null"  # JSON.stringify writes null for these
    if x == 0:
        return "0"
    sign = "-" if x < 0 else ""
    d = Decimal(repr(abs(x))).normalize()
    digits = "".join(str(t) for t in d.as_tuple().digits)
    n = len(digits) + d.as_tuple().exponent  # position of the decimal point relative to the digits
    k = len(digits)
    if k <= n <= 21:
        out = digits + "0" * (n - k)
    elif 0 < n <= 21:
        out = digits[:n] + "." + digits[n:]
    elif -6 < n <= 0:
        out = "0." + "0" * (-n) + digits
    else:
        e = n - 1
        es = ("+" if e >= 0 else "-") + str(abs(e))
        out = digits[0] + ("." + digits[1:] if k > 1 else "") + "e" + es
    return sign + out


def canonical_json(v):
    if v is None:
        return "null"
    if v is True:
        return "true"
    if v is False:
        return "false"
    if isinstance(v, (int, float)):
        return _js_number(v)
    if isinstance(v, str):
        return json.dumps(v, ensure_ascii=False)
    if isinstance(v, list):
        return "[" + ",".join(canonical_json(i) for i in v) + "]"
    if isinstance(v, dict):
        keys = sorted(v.keys(), key=lambda k: k.encode("utf-16-be"))  # JS sorts by UTF-16 code units
        return "{" + ",".join(json.dumps(k, ensure_ascii=False) + ":" + canonical_json(v[k]) for k in keys) + "}"
    raise TypeError("unsupported type: %s" % type(v).__name__)


def cache_key(params):
    h = FNV_OFFSET
    for b in canonical_json(params).encode("utf-8"):
        h = ((h ^ b) * FNV_PRIME) & MASK
    return "%016x" % h


def main(argv=None):
    ap = argparse.ArgumentParser(description="Print the Blender cache directory for a params file.")
    ap.add_argument("--params", required=True, help="params.json")
    ap.add_argument("--object", required=True, help="generator name")
    ap.add_argument("--out", required=True, help="cache root")
    a = ap.parse_args(argv)
    with open(a.params, encoding="utf-8") as f:
        params = json.load(f)
    print(os.path.join(a.out, a.object, cache_key(params)) + os.sep)
    return 0


if __name__ == "__main__":
    sys.exit(main())
