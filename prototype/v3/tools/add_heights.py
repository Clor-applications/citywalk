"""Attach real estimated heights to HSR building footprints.

Source: Google Open Buildings 2.5D Temporal v1 (2023 epoch), CC BY 4.0 / ODbL.
Only the HSR window is read from the cloud-optimised GeoTIFF (HTTP range requests).

Usage (needs rasterio, pyproj, numpy, shapely):
  python -I tools/add_heights.py data/hsr.json
"""
import json, math, sys
import numpy as np
import rasterio
from rasterio.windows import from_bounds
from rasterio.features import rasterize
from pyproj import Transformer
from shapely.geometry import Polygon

TILE = ('/vsicurl/https://storage.googleapis.com/open-buildings-temporal-data/'
        'v1/geotiffs/3bae4_2023_06_30/tile_uFgpTUI6ToU.tif')
PRESENCE_MIN = 0.4   # mask pixels that are unlikely to be building
FLOOR_H = 3.2

path = sys.argv[1]
M = json.load(open(path))
lat0, lon0 = M['center']['lat'], M['center']['lon']
KX = math.cos(math.radians(lat0)) * 111320.0
KZ = 110540.0
to_utm = Transformer.from_crs(4326, 32643, always_xy=True)

def local_to_utm(x, z):
    return to_utm.transform(lon0 + x / KX, lat0 - z / KZ)

half = M['half'] + 60
corners = [local_to_utm(sx * half, sz * half) for sx in (-1, 1) for sz in (-1, 1)]
xs, ys = [c[0] for c in corners], [c[1] for c in corners]

with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR', CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif'):
    with rasterio.open(TILE) as src:
        win = from_bounds(min(xs), min(ys), max(xs), max(ys), src.transform).round_offsets().round_lengths()
        height = src.read(2, window=win).astype('float32')
        presence = src.read(3, window=win).astype('float32')
        tf = src.window_transform(win)
print('window', height.shape, 'height range', float(np.nanmax(height)))

valid = (presence >= PRESENCE_MIN) & (height > 0)
stats = {'ob25d': 0, 'osm': 0, 'kept_estimate': 0}
for b in M['buildings']:
    if not b.get('approx', True):
        b['h'] = round(b['lv'] * FLOOR_H, 1); b['hsrc'] = 'osm'; stats['osm'] += 1
        continue
    poly = Polygon([local_to_utm(x, z) for x, z in b['pts']])
    if not poly.is_valid:
        poly = poly.buffer(0)
    mask = rasterize([(poly, 1)], out_shape=height.shape, transform=tf, fill=0, dtype='uint8', all_touched=False).astype(bool)
    px = height[mask & valid]
    if px.size >= 12:                       # >= 3 m² of confident pixels
        h = float(np.percentile(px, 70))    # upper-middle value: roofs, not edges
        h = max(3.0, min(h, 100.0))
        b['h'] = round(h, 1); b['lv'] = max(1, round(h / FLOOR_H)); b['hsrc'] = 'ob25d'; b['approx'] = False
        stats['ob25d'] += 1
    else:
        b['h'] = round(b['lv'] * FLOOR_H, 1); b['hsrc'] = 'estimate'; stats['kept_estimate'] += 1

M['heights'] = {'source': 'Google Open Buildings 2.5D Temporal v1, 2023 epoch',
                'licence': 'CC BY 4.0 (dual ODbL)', 'note': 'height above ground, ~4 m effective resolution',
                'stats': stats}
json.dump(M, open(path, 'w'), separators=(',', ':'))
hs = sorted(b['h'] for b in M['buildings'])
print(stats, 'median', hs[len(hs) // 2], 'p90', hs[int(len(hs) * .9)], 'max', hs[-1])
