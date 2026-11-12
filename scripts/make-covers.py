#!/usr/bin/env python3
"""Generate the isometric blog cover illustrations for hopeless-labs.com.

Pure-stdlib geometry -> SVG -> PNG (rsvg-convert). 1200x630 isometric scenes
built from shaded cuboids, plates, contact shadows and glow accents. Geometry
is authored in world units and auto-fitted to the canvas, so tweaking a scene
can never leave it marooned small in a corner.

    python3 scripts/make-covers.py [slug]     # writes public/blog/<slug>.png
"""

import math
import os
import subprocess
import sys

CW, CH = 1200, 630
COS30 = math.cos(math.radians(30))
SIN30 = math.sin(math.radians(30))
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "blog")

PAL = {
    "purple": "#7c3aed", "indigo": "#4f46e5", "blue": "#2563eb",
    "sky": "#0ea5e9", "cyan": "#06b6d4", "teal": "#14b8a6",
    "green": "#22c55e", "orange": "#f97316", "amber": "#f59e0b",
    "slate": "#475569", "slate2": "#64748b", "steel": "#94a3b8",
    "paper": "#e2e8f0", "ink": "#1e293b", "red": "#ef4444",
}


def _rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def shade(hex_color, factor):
    out = []
    for c in _rgb(hex_color):
        v = c * factor if factor <= 1 else c + (255 - c) * (factor - 1)
        out.append(max(0, min(255, int(round(v)))))
    return "#%02x%02x%02x" % tuple(out)


def faces(base):
    return shade(base, 1.20), shade(base, 0.90), shade(base, 0.58)  # top, +x, +y


class Iso:
    """Isometric projector that also records every projected point (for fit)."""

    def __init__(self, ox=0.0, oy=0.0, s=1.0):
        self.ox, self.oy, self.s = ox, oy, s
        self.pts = []

    def p(self, x, y, z=0.0):
        pt = (self.ox + (x - y) * COS30 * self.s,
              self.oy + (x + y) * SIN30 * self.s - z * self.s)
        self.pts.append(pt)
        return pt


def poly(pts, fill, opacity=None, stroke=None, sw=1.0, extra=""):
    d = " ".join("%.1f,%.1f" % (px, py) for px, py in pts)
    s = '<polygon points="%s" fill="%s"' % (d, fill)
    if stroke:
        s += ' stroke="%s" stroke-width="%s" stroke-linejoin="round"' % (stroke, sw)
    if opacity is not None:
        s += ' opacity="%s"' % opacity
    if extra:
        s += " " + extra
    return s + "/>"


def box(iso, x, y, z, dx, dy, dz, base, opacity=None, edge=None, sw=1.2):
    top_c, x_c, y_c = faces(base)
    top = [iso.p(x, y, z + dz), iso.p(x + dx, y, z + dz),
           iso.p(x + dx, y + dy, z + dz), iso.p(x, y + dy, z + dz)]
    right = [iso.p(x + dx, y, z), iso.p(x + dx, y + dy, z),
             iso.p(x + dx, y + dy, z + dz), iso.p(x + dx, y, z + dz)]
    left = [iso.p(x, y + dy, z), iso.p(x + dx, y + dy, z),
            iso.p(x + dx, y + dy, z + dz), iso.p(x, y + dy, z + dz)]
    return (poly(left, y_c, opacity=opacity, stroke=edge, sw=sw)
            + poly(right, x_c, opacity=opacity, stroke=edge, sw=sw)
            + poly(top, top_c, opacity=opacity, stroke=edge, sw=sw))


def plate(iso, x, y, z, dx, dy, base, thick=0.06, **kw):
    return box(iso, x, y, z, dx, dy, thick, base, **kw)


def shadow(iso, x, y, dx, dy, z=0.0, op=0.55, spread=1.35):
    cx, cy = iso.p(x + dx / 2.0, y + dy / 2.0, z)
    rx = (dx + dy) * 0.5 * COS30 * iso.s * spread
    ry = rx * 0.40
    return ('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#01030a" '
            'opacity="%s" filter="url(#soft)"/>' % (cx, cy, rx, ry, op))


def glow(iso, x, y, z, r, color, opacity=0.30):
    cx, cy = iso.p(x, y, z)
    return '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" opacity="%s" filter="url(#soft)"/>' % (
        cx, cy, r, color, opacity)


def arrow2d(p1, p2, color, sw=6, op=0.95):
    ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    L, W = 22, 12
    bx, by = p2[0] - L * math.cos(ang), p2[1] - L * math.sin(ang)
    nx, ny = -math.sin(ang), math.cos(ang)
    tri = [tuple(p2), (bx + W * nx, by + W * ny), (bx - W * nx, by - W * ny)]
    body = ('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" '
            'stroke-width="%s" stroke-linecap="round" opacity="%s"/>'
            % (p1[0], p1[1], bx, by, color, sw, op))
    return body + poly(tri, color, opacity=op)


def monogram(x, y, scale, color, op=0.5):
    segs = [[(0, 0), (0, 32)], [(16.6, 0), (16.6, 32)], [(0, 16), (16.6, 16)],
            [(16.6, 16), (31.48, 30.88)], [(31.08, 31.5), (42.3, 31.5)]]
    g = ['<g transform="translate(%.1f %.1f) scale(%.3f)" stroke="%s" '
         'stroke-width="5.85" fill="none" opacity="%s" stroke-linecap="butt">'
         % (x, y, scale, color, op)]
    for seg in segs:
        g.append('<path d="M%s %sL%s %s"/>' % (seg[0][0], seg[0][1], seg[1][0], seg[1][1]))
    return "".join(g) + "</g>"


# The watermark is the HL glyph itself — a transparent PNG (white ink, alpha from
# the artwork) so it blends into the cover background instead of sitting in a tile.
def _load_glyph():
    import base64
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for rel in ("public/logo-glyph.png",):
        p = os.path.join(here, rel)
        if os.path.exists(p):
            from PIL import Image as _Img  # only for measuring the aspect
            with open(p, "rb") as f:
                uri = "data:image/png;base64," + base64.b64encode(f.read()).decode()
            try:
                w, h = _Img.open(p).size
            except Exception:
                w, h = 320, 285
            return uri, (h / w if w else 0.89)
    return None, 0.89


ICON_URI, ICON_AR = _load_glyph()


def watermark(width=78, right=30, bottom=26, op=0.6):
    """HL glyph, bottom-right of the canvas, blended into the background."""
    if not ICON_URI:
        return ""
    h = int(width * ICON_AR)
    x, y = CW - right - width, CH - bottom - h
    return ('<image x="%d" y="%d" width="%d" height="%d" opacity="%s" '
            'href="%s" xlink:href="%s"/>'
            % (x, y, width, h, op, ICON_URI, ICON_URI))


DEFS = """<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#0d121b"/>
    <stop offset="0.55" stop-color="#0a0e15"/>
    <stop offset="1" stop-color="#121a26"/>
  </linearGradient>
  <radialGradient id="vig" cx="0.5" cy="0.44" r="0.78">
    <stop offset="0" stop-color="#1d2836" stop-opacity="0.5"/>
    <stop offset="1" stop-color="#05070b" stop-opacity="0"/>
  </radialGradient>
  <filter id="soft" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="20"/>
  </filter>
</defs>"""


def shell(body, dots=True):
    out = ['<svg xmlns="http://www.w3.org/2000/svg" '
           'xmlns:xlink="http://www.w3.org/1999/xlink" width="%d" height="%d" '
           'viewBox="0 0 %d %d">' % (CW, CH, CW, CH), DEFS]
    out.append('<rect width="%d" height="%d" fill="url(#bg)"/>' % (CW, CH))
    out.append('<rect width="%d" height="%d" fill="url(#vig)"/>' % (CW, CH))
    if dots:
        step = 30
        for gy in range(-30, CH + 30, step):
            for gx in range(-30, CW + 30, step):
                out.append('<circle cx="%d" cy="%d" r="1.2" fill="#2b3748" opacity="0.45"/>'
                           % (gx + ((gy // step) % 2) * (step // 2), gy))
    out.append(body)
    out.append("</svg>")
    return "".join(out)


def fit(build, mx=80, top=64, bottom=56):
    """Auto-fit a scene builder to the canvas: build once in unit space, measure
    the projected bbox, then rebuild with scale/origin that fills the frame."""
    probe = Iso(0, 0, 1.0)
    build(probe)
    xs = [p[0] for p in probe.pts]
    ys = [p[1] for p in probe.pts]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    availW = CW - 2 * mx
    availH = CH - top - bottom
    k = min(availW / max(maxx - minx, 1e-6), availH / max(maxy - miny, 1e-6))
    ox = mx + (availW - (maxx - minx) * k) / 2.0 - minx * k
    oy = top + (availH - (maxy - miny) * k) / 2.0 - miny * k
    return build(Iso(ox, oy, k))


def scene_bytecode(iso):
    """A thick stack of instruction plates with opcode cubes on top."""
    b = [shadow(iso, -0.1, -0.1, 3.0, 3.0, op=0.5)]
    b.append(glow(iso, 1.4, 1.4, 2.1, 300, PAL["orange"], 0.20))
    b.append(glow(iso, 0.4, 0.4, 3.4, 190, PAL["cyan"], 0.16))
    for i, col in enumerate([PAL["purple"], PAL["indigo"], PAL["cyan"], PAL["orange"]]):
        off = i * 0.055
        b.append(plate(iso, off, off, i * 0.42, 2.8, 2.8, col, thick=0.30))
        b.append(plate(iso, off, off, i * 0.42 + 0.30, 2.8, 2.8, col, thick=0.02,
                       opacity=0.95, edge=shade(col, 1.35), sw=1.4))
    topz = 3 * 0.42 + 0.32
    for cx, cy, s, col in [(0.55, 0.55, 0.62, PAL["amber"]),
                           (1.55, 0.5, 0.5, PAL["sky"]),
                           (1.7, 1.55, 0.44, PAL["purple"])]:
        b.append(shadow(iso, cx, cy, s, s, z=topz, op=0.4, spread=1.1))
        b.append(box(iso, cx, cy, topz, s, s, s, col))

    # a single compiled-artifact cube hovering to the right, with a cast shadow
    # on the floor so it reads as lifted rather than pasted on
    fx, fy, fz = 3.9, 0.6, 1.25
    b.append(shadow(iso, fx + 0.15, fy + 0.15, 0.7, 0.7, z=0.0, op=0.45, spread=1.0))
    b.append(glow(iso, fx + 0.35, fy + 0.35, fz + 0.35, 120, PAL["orange"], 0.24))
    b.append(box(iso, fx, fy, fz, 0.7, 0.7, 0.7, PAL["orange"]))

    # small in-flight instruction cubes on the left to widen the composition
    for lx, ly, lz, s, col in [(-1.55, 0.55, 0.55, 0.5, PAL["cyan"]),
                               (-1.95, 1.55, 1.05, 0.42, PAL["purple"]),
                               (-0.95, 2.35, 0.35, 0.36, PAL["sky"])]:
        b.append(shadow(iso, lx + 0.08, ly + 0.08, s, s, z=0.0, op=0.4, spread=1.0))
        b.append(box(iso, lx, ly, lz, s, s, s, col))

    b.append(watermark())
    return "".join(b)


def scene_first_script(iso):
    """Script sheet on the desk -> arrow -> server rack with a pass badge."""
    b = []
    b.append(glow(iso, 0.7, 0.7, 0.9, 260, PAL["cyan"], 0.15))
    b.append(glow(iso, 3.9, 0.5, 1.4, 250, PAL["orange"], 0.17))
    b.append(shadow(iso, 0.0, 0.0, 2.4, 1.9, op=0.5))
    b.append(plate(iso, 0.0, 0.0, 0.0, 2.4, 1.9, PAL["paper"], thick=0.12))
    for i, (lw, col) in enumerate([(1.55, PAL["orange"]), (1.15, PAL["slate2"]),
                                   (1.35, PAL["slate2"]), (0.85, PAL["slate2"]),
                                   (1.25, PAL["slate2"])]):
        b.append(plate(iso, 0.22, 0.20 + i * 0.30, 0.12, lw, 0.11, col, thick=0.02))
    b.append(arrow2d(iso.p(2.62, 1.1, 0.75), iso.p(3.45, 1.1, 0.95), PAL["orange"], 7))
    b.append(shadow(iso, 3.6, 0.0, 2.0, 1.8, op=0.5))
    for i in range(3):
        b.append(box(iso, 3.65, 0.02, i * 0.62, 2.0, 1.7, 0.56, PAL["slate"]))
        b.append(box(iso, 3.85, 0.42, i * 0.62 + 0.22, 0.12, 0.12, 0.12, PAL["green"]))
        b.append(box(iso, 4.10, 0.42, i * 0.62 + 0.22, 0.12, 0.12, 0.12,
                     PAL["orange"] if i == 2 else PAL["cyan"]))
    bx, by, bz = 4.05, 1.95, 2.35
    b.append(glow(iso, bx + 0.4, by + 0.2, bz + 0.4, 130, PAL["green"], 0.22))
    b.append(box(iso, bx, by, bz, 0.85, 0.85, 0.85, PAL["green"]))
    b.append(plate(iso, bx + 0.16, by + 0.34, bz + 0.85, 0.26, 0.09, PAL["paper"], thick=0.02))
    b.append(plate(iso, bx + 0.34, by + 0.18, bz + 0.85, 0.55, 0.09, PAL["paper"], thick=0.02))
    b.append(watermark())
    return "".join(b)


def scene_language(iso):
    """Left: tangled plugin blocks. Right: one clean sheet. Divider + arrow."""
    b = []
    b.append(glow(iso, 0.3, 0.3, 0.9, 230, PAL["red"], 0.12))
    b.append(glow(iso, 3.9, 0.3, 1.0, 260, PAL["cyan"], 0.16))
    b.append(shadow(iso, -0.3, -0.3, 2.6, 2.6, op=0.5))
    cubes = [(-0.15, 0.1, 0.72, PAL["slate"]), (0.85, 0.0, 0.9, PAL["purple"]),
             (0.35, 1.0, 0.6, PAL["blue"]), (1.25, 0.9, 0.55, PAL["indigo"]),
             (0.05, 1.55, 0.5, PAL["slate2"]), (1.15, 0.4, 0.46, PAL["purple"])]
    for cx, cy, s, col in cubes:
        b.append(box(iso, cx, cy, 0.0, s, s, s, col))
    for a, c in [((-0.1, 0.5, 0.2), (1.55, 0.7, 0.35)),
                 ((0.4, 0.4, 0.55), (1.35, 1.2, 0.3)),
                 ((0.2, 1.2, 0.3), (1.5, 0.85, 0.5))]:
        pa, pc = iso.p(*a), iso.p(*c)
        b.append('<path d="M%.1f %.1f Q %.1f %.1f %.1f %.1f" stroke="%s" '
                 'stroke-width="3" fill="none" stroke-dasharray="6 7" opacity="0.6"/>'
                 % (pa[0], pa[1], (pa[0] + pc[0]) / 2, min(pa[1], pc[1]) - 40,
                    pc[0], pc[1], PAL["red"]))
    d1 = iso.p(2.35, 2.9, 0)
    d2 = iso.p(2.35, -0.8, 0)
    b.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#3a4759" '
             'stroke-width="2.5" stroke-dasharray="12 14" opacity="0.85"/>'
             % (d1[0], d1[1], d2[0], d2[1]))
    b.append(arrow2d(iso.p(2.05, 0.9, 0.9), iso.p(2.75, 0.9, 0.9), PAL["cyan"], 6))
    b.append(shadow(iso, 2.75, 0.0, 2.0, 1.9, op=0.45))
    b.append(plate(iso, 2.8, 0.0, 0.0, 2.0, 1.9, PAL["paper"], thick=0.14))
    for i in range(4):
        lw = [1.4, 1.05, 1.25, 0.8][i]
        b.append(plate(iso, 3.02, 0.22 + i * 0.34, 0.14, lw, 0.10,
                       PAL["orange"] if i == 0 else PAL["slate"], thick=0.02))
    b.append(glow(iso, 4.35, 1.35, 0.8, 120, PAL["green"], 0.2))
    b.append(box(iso, 4.15, 1.25, 0.14, 0.7, 0.7, 0.7, PAL["green"]))
    b.append(plate(iso, 4.30, 1.55, 0.84, 0.20, 0.08, PAL["paper"], thick=0.02))
    b.append(plate(iso, 4.46, 1.42, 0.84, 0.42, 0.08, PAL["paper"], thick=0.02))
    b.append(watermark())
    return "".join(b)


def scene_unified(iso):
    """Three separate cubes (runtime, CLI, registry) merging into one unified cube."""
    b = []
    # Glow accents
    b.append(glow(iso, 1.0, 1.5, 1.2, 280, PAL["cyan"], 0.18))
    b.append(glow(iso, 2.5, 0.8, 1.5, 300, PAL["orange"], 0.20))
    
    # Left cube (purple - runtime)
    b.append(shadow(iso, -0.3, 0.2, 1.2, 1.2, op=0.45))
    b.append(box(iso, -0.3, 0.2, 0.0, 1.2, 1.2, 1.2, PAL["purple"]))
    
    # Middle cube (cyan - CLI)
    b.append(shadow(iso, 1.0, -0.1, 1.2, 1.2, op=0.45))
    b.append(box(iso, 1.0, -0.1, 0.0, 1.2, 1.2, 1.2, PAL["cyan"]))
    
    # Right cube (blue - registry)
    b.append(shadow(iso, 2.3, 0.5, 1.2, 1.2, op=0.45))
    b.append(box(iso, 2.3, 0.5, 0.0, 1.2, 1.2, 1.2, PAL["blue"]))
    
    # Center unified cube (orange - merged product)
    b.append(shadow(iso, 0.8, 0.5, 1.6, 1.6, z=0.8, op=0.5, spread=1.2))
    b.append(glow(iso, 1.6, 1.3, 1.4, 200, PAL["orange"], 0.25))
    b.append(box(iso, 0.8, 0.5, 0.8, 1.6, 1.6, 1.6, PAL["orange"]))
    
    # Small connecting elements
    for cx, cy, sz, s, col in [(0.2, 0.6, 0.5, 0.35, PAL["amber"]),
                               (2.0, 0.2, 0.4, 0.3, PAL["sky"]),
                               (1.5, 1.8, 0.55, 0.32, PAL["green"])]:
        b.append(shadow(iso, cx, cy, s, s, z=sz, op=0.35, spread=1.0))
        b.append(box(iso, cx, cy, sz, s, s, s, col))
    
    b.append(watermark())
    return "".join(b)


SCENES = {
    "inside-the-bytecode": scene_bytecode,
    "first-ruso-script": scene_first_script,
    "why-a-language-not-a-plugin-api": scene_language,
    "ruso-unified-release": scene_unified,
}
SCENES = {
    "inside-the-bytecode": scene_bytecode,
    "first-ruso-script": scene_first_script,
    "why-a-language-not-a-plugin-api": scene_language,
}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    only = sys.argv[1] if len(sys.argv) > 1 else None
    for slug, fn in SCENES.items():
        if only and only != slug:
            continue
        body = fit(fn)
        svg_path = "/tmp/cover-%s.svg" % slug
        png_path = os.path.join(OUT_DIR, "%s.png" % slug)
        with open(svg_path, "w") as f:
            f.write(shell(body))
        subprocess.run(["rsvg-convert", "-w", str(CW), "-h", str(CH), svg_path, "-o", png_path],
                       check=True)
        print("wrote", png_path)


if __name__ == "__main__":
    main()
