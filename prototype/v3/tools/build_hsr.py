"""Convert raw Overpass JSON for HSR Layout into a compact game map (metres).

Usage: python3 -I tools/build_hsr.py data/raw.json data/hsr.json

x = east (m), z = south (m)  -> map "up" (north) is -z, matching the client.
Every record keeps its OSM id so attribution / corrections stay traceable.
"""
import json, math, sys, hashlib

SRC, DST = sys.argv[1], sys.argv[2]
HALF = 420.0  # crop half-size in metres

ROAD_W = {  # carriageway width in metres (stylised, not surveyed)
    'trunk': 20, 'primary': 16, 'secondary': 12, 'tertiary': 10,
    'residential': 7, 'unclassified': 7, 'living_street': 5, 'service': 4.5,
    'primary_link': 8, 'secondary_link': 7, 'tertiary_link': 6, 'trunk_link': 8,
}
FOOT = {'footway', 'path', 'pedestrian', 'steps', 'cycleway'}

data = json.load(open(SRC))['elements']

# centre = centroid of 27th Main Road
pts = [(g['lat'], g['lon']) for e in data if e['type'] == 'way'
       and e.get('tags', {}).get('name') == '27th Main Road' for g in e.get('geometry', [])]
lat0 = sum(p[0] for p in pts) / len(pts)
lon0 = sum(p[1] for p in pts) / len(pts)
KX = math.cos(math.radians(lat0)) * 111320.0
KZ = 110540.0

def xy(lat, lon):
    return (round((lon - lon0) * KX, 1), round(-(lat - lat0) * KZ, 1))

def inside(p, pad=0.0):
    return abs(p[0]) <= HALF + pad and abs(p[1]) <= HALF + pad

def h01(s):
    return int(hashlib.md5(str(s).encode()).hexdigest()[:8], 16) / 0xFFFFFFFF

def area(poly):
    a = 0.0
    for i in range(len(poly)):
        x1, z1 = poly[i]; x2, z2 = poly[(i + 1) % len(poly)]
        a += x1 * z2 - x2 * z1
    return a / 2

def simplify(poly, tol=0.6):
    out = [poly[0]]
    for p in poly[1:]:
        if math.dist(p, out[-1]) >= tol:
            out.append(p)
    return out

roads, foot, buildings, areas, pois = [], [], [], [], []
for e in data:
    t = e.get('tags', {})
    if e['type'] == 'node':
        p = xy(e['lat'], e['lon'])
        if inside(p) and t.get('name') and ('amenity' in t or 'shop' in t):
            pois.append({'id': e['id'], 'name': t['name'], 'kind': t.get('amenity') or t.get('shop'),
                         'cat': 'shop' if 'shop' in t else 'amenity', 'x': p[0], 'z': p[1]})
        continue
    geom = [xy(g['lat'], g['lon']) for g in e.get('geometry', [])]
    if len(geom) < 2:
        continue
    hw = t.get('highway')
    if hw:
        if not any(inside(p, 40) for p in geom):
            continue
        if hw in FOOT:
            foot.append({'id': e['id'], 'pts': geom})
        elif hw in ROAD_W:
            w = ROAD_W[hw]
            if t.get('lanes', '').isdigit():
                w = max(w, int(t['lanes']) * 3.3)
            roads.append({'id': e['id'], 'name': t.get('name', ''), 'type': hw, 'w': w,
                          'oneway': t.get('oneway') == 'yes', 'pts': geom})
        continue
    if len(geom) < 4 or geom[0] != geom[-1]:
        continue
    poly = simplify(geom[:-1])
    if len(poly) < 3:
        continue
    cx = sum(p[0] for p in poly) / len(poly); cz = sum(p[1] for p in poly) / len(poly)
    if not inside((cx, cz)):
        continue
    if area(poly) > 0:  # make winding consistent (counter-clockwise in x/-z)
        poly.reverse()
    if 'building' in t:
        lv = t.get('building:levels', '')
        if lv.replace('.', '', 1).isdigit():
            levels = max(1, round(float(lv))); approx = False
        else:
            a = abs(area(poly)); r = h01(e['id'])
            levels = 2 + int(r * 3) if a < 250 else 3 + int(r * 4) if a < 900 else 4 + int(r * 5)
            approx = True
        buildings.append({'id': e['id'], 'lv': levels, 'approx': approx,
                          'name': t.get('name', ''), 'kind': t.get('building'), 'pts': poly})
    elif t.get('leisure') in ('park', 'garden', 'playground', 'pitch') or t.get('landuse') in ('grass', 'recreation_ground', 'village_green'):
        areas.append({'id': e['id'], 'kind': 'park', 'name': t.get('name', ''), 'pts': poly})
    elif t.get('natural') == 'water' or t.get('landuse') == 'reservoir':
        areas.append({'id': e['id'], 'kind': 'water', 'name': t.get('name', ''), 'pts': poly})

out = {'name': 'HSR Layout (crop around 27th Main Road)', 'center': {'lat': lat0, 'lon': lon0}, 'half': HALF,
       'attribution': '© OpenStreetMap contributors (ODbL)', 'snapshot': 'Overpass API 2026-11-15',
       'roads': roads, 'foot': foot, 'buildings': buildings, 'areas': areas, 'pois': pois}
json.dump(out, open(DST, 'w'), separators=(',', ':'))
print(f"centre {lat0:.5f},{lon0:.5f} roads {len(roads)} foot {len(foot)} buildings {len(buildings)} "
      f"areas {len(areas)} pois {len(pois)}")
