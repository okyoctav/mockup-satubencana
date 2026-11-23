#!/usr/bin/env python3
"""
Convert DATAMDB.json raw dataset to Mapbox Vector Tiles (MVT) & PMTiles for Kota Bitung.
Outputs:
  - public/tiles/geotagging_bitung.pmtiles
  - public/tiles/bitung/{z}/{x}/{y}.pbf (MVT directory)
"""
import json
import os
import shutil
import subprocess
import sys
import time

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_file = os.path.join(base_dir, "DATAMDB.json")
    if not os.path.exists(src_file):
        # check parent or documents
        alt_path = "/Volumes/SAMSUNG/dokumen penting/DATAMDB.json"
        if os.path.exists(alt_path):
            src_file = alt_path
        else:
            print(f"Error: DATAMDB.json not found in {base_dir}")
            sys.exit(1)

    print(f"Source file: {src_file} ({os.path.getsize(src_file)/(1024*1024):.2f} MB)")
    out_dir = os.path.join(base_dir, "public", "tiles")
    os.makedirs(out_dir, exist_ok=True)

    tmp_geojsonl = "/tmp/bitung_geotagging.geojsonl"
    out_pmtiles = os.path.join(out_dir, "geotagging_bitung.pmtiles")
    out_mvt_dir = os.path.join(out_dir, "bitung")

    tippecanoe_bin = shutil.which("tippecanoe") or "/opt/homebrew/bin/tippecanoe"
    if not os.path.exists(tippecanoe_bin):
        print("Error: tippecanoe not found. Install with: brew install tippecanoe")
        sys.exit(1)

    print("\n[1/3] Parsing & filtering DATAMDB.json to Line-delimited GeoJSON...")
    t0 = time.time()
    count = 0
    skipped = 0

    with open(src_file, "r", encoding="utf-8") as fin, open(tmp_geojsonl, "w", encoding="utf-8") as fout:
        items = json.load(fin)
        for it in items:
            lat = it.get("lat") or it.get("latitude")
            lng = it.get("long") or it.get("longitude") or it.get("lng")
            if lat is None or lng is None:
                skipped += 1
                continue
            try:
                flat = float(lat)
                flng = float(lng)
                if not (-90 <= flat <= 90 and -180 <= flng <= 180):
                    skipped += 1
                    continue
            except (ValueError, TypeError):
                skipped += 1
                continue

            props = {
                "id": it.get("id"),
                "nama": it.get("nama_lengkap") or "",
                "hub": it.get("hubungan_keluarga") or "",
                "jk": it.get("jenis_kelamin") or "",
                "usia": str(it.get("usia")) if it.get("usia") is not None else "",
                "disabilitas": it.get("disabilitas_kerentanan") or "",
                "lansia": it.get("lansia") or "",
            }
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [flng, flat],
                },
                "properties": props,
            }
            fout.write(json.dumps(feature) + "\n")
            count += 1

    print(f"Generated {count:,} features in {time.time()-t0:.2f}s (skipped {skipped:,} without coords).")

    print("\n[2/3] Building PMTiles archive...")
    t1 = time.time()
    cmd_pm = [
        tippecanoe_bin,
        "-o", out_pmtiles,
        "-z", "16",
        "-Z", "10",
        "--drop-densest-as-needed",
        "--extend-zooms-if-still-dropping",
        "-l", "geotagging_bitung",
        "--force",
        tmp_geojsonl,
    ]
    subprocess.run(cmd_pm, check=True)
    print(f"PMTiles created in {time.time()-t1:.2f}s: {out_pmtiles} ({os.path.getsize(out_pmtiles)/(1024*1024):.2f} MB)")

    print("\n[3/3] Building MVT Directory (uncompressed .pbf for direct HTTP serving)...")
    t2 = time.time()
    if os.path.exists(out_mvt_dir):
        shutil.rmtree(out_mvt_dir)

    cmd_mvt = [
        tippecanoe_bin,
        "-e", out_mvt_dir,
        "-z", "16",
        "-Z", "10",
        "--no-tile-compression",
        "--drop-densest-as-needed",
        "--extend-zooms-if-still-dropping",
        "-l", "geotagging_bitung",
        "--force",
        tmp_geojsonl,
    ]
    subprocess.run(cmd_mvt, check=True)
    
    tile_count = sum(len([f for f in files if f.endswith(".pbf")]) for _, _, files in os.walk(out_mvt_dir))
    print(f"MVT directory created in {time.time()-t2:.2f}s: {tile_count} tiles in {out_mvt_dir}")

    # cleanup temp
    if os.path.exists(tmp_geojsonl):
        os.remove(tmp_geojsonl)

    print("\n✅ All done! Tile assets ready.")

if __name__ == "__main__":
    main()
