#!/usr/bin/env python3
"""
Extract base minweight/maxweight from Lua fish files and output
a fish-config.ts compatible mapping.
"""

import os
import re
import json

BASE_WEIGHT_DIR = os.path.join(os.path.dirname(__file__), "..", "base_weight")

AREA_MAP = {
    "0 - Ocean": "Ocean",
    "1 - Forgotten Deep": "Forgotten Deep",
    "2 - Ancient Sands": "Ancient Sands",
    "3 - Spirit Roots": "Spirit Roots",
    "4 - Angler Cave": "Angler Cave",
    "5 - Sunken Wilds": "Sunken Wilds",
    "6 - Gloomspore Valley": "Gloomspore Valley",
}

def parse_lua_value(lua_src, key):
    pattern = rf'\["{key}"\]\s*=\s*([\d.]+)'
    m = re.search(pattern, lua_src)
    return float(m.group(1)) if m else None

def main():
    results = {}  # fish_name -> {minWeight, maxWeight, areas}

    for folder in sorted(os.listdir(BASE_WEIGHT_DIR)):
        folder_path = os.path.join(BASE_WEIGHT_DIR, folder)
        if not os.path.isdir(folder_path):
            continue
        area = AREA_MAP.get(folder)
        if area is None:
            continue

        for filename in sorted(os.listdir(folder_path)):
            if not filename.endswith(".lua"):
                continue
            fish_name = filename[:-4]  # strip .lua
            with open(os.path.join(folder_path, filename), "r") as f:
                src = f.read()

            min_w = parse_lua_value(src, "minweight")
            max_w = parse_lua_value(src, "maxweight")

            if min_w is None or max_w is None:
                print(f"  WARNING: missing weights for {fish_name} in {folder}")
                continue

            if fish_name not in results:
                results[fish_name] = {"baseMinWeight": min_w, "baseMaxWeight": max_w, "areas": []}

            if area not in results[fish_name]["areas"]:
                results[fish_name]["areas"].append(area)

            # Warn if same fish appears in multiple areas with different base weights
            if results[fish_name]["baseMinWeight"] != min_w or results[fish_name]["baseMaxWeight"] != max_w:
                print(f"  WARNING: {fish_name} has conflicting weights across areas!")
                print(f"    existing: {results[fish_name]['baseMinWeight']} - {results[fish_name]['baseMaxWeight']}")
                print(f"    {area}:   {min_w} - {max_w}")

    print("\n=== BASE WEIGHTS ===")
    print(f"{'Fish':<25} {'baseMinWeight':>14} {'baseMaxWeight':>14}  Areas")
    print("-" * 80)
    for name, data in sorted(results.items()):
        areas_str = ", ".join(data["areas"])
        print(f"{name:<25} {data['baseMinWeight']:>14.4g} {data['baseMaxWeight']:>14.4g}  {areas_str}")

    print(f"\nTotal fish found: {len(results)}")

    # Output JSON for easy copy-paste into fish-config.ts
    out_path = os.path.join(os.path.dirname(__file__), "base_weights.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nJSON written to: {out_path}")

if __name__ == "__main__":
    main()
