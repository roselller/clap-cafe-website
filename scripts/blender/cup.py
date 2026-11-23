"""
Builds the Clap Cafe double-walled glass cup and exports it for the website.

Run (from the project root):
  /Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/blender/cup.py

Outputs:
  public/models/cup.glb            glTF binary used by components/hero/cup3d.ts
  scripts/blender/out/preview.png  Cycles preview to compare against the reference photo
  scripts/blender/out/etch.png     the logo converted to a white-on-transparent etch

Scene units: the rim radius is 1.0. +Z is up in Blender (glTF export turns it into +Y).
The rim centre is the origin, so the cup tips about its mouth. The cup hangs
from z = 0 down to z = -HEIGHT (1.9). The front of the cup faces -Y in Blender (+Z in glTF).

Objects: Glass (both walls, one closed solid), Liquid (the bowl's fill, topped at LIQUID_TOP = -0.35),
Etch (a curved patch on the front carrying the logo).
"""

import math
import os

import bmesh
import bpy
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LOGO = os.path.join(ROOT, "scripts", "blender", "assets", "clap-logo.webp")
OUT_DIR = os.path.join(ROOT, "scripts", "blender", "out")
GLB = os.path.join(ROOT, "public", "models", "cup.glb")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(GLB), exist_ok=True)

SEGMENTS = 64
WALL = 0.04
HEIGHT = 1.9
LIQUID_TOP = -0.35  # the latte fills the bowl almost to the rim, as in the reference photo

# The etch: ink-on-white disc. The logo was 1.9 wide and centred at z = -1.15; now it is
# 0.70x that: a sticker on the outer wall.
ETCH_LOGO_SPAN = 1.9
ETCH_SCALE = 0.70  # 1.5 across (the wall is only ~1.9 tall, so 220% of the old 0.9 would not fit)
ETCH_CENTRE_Z = -0.90
ETCH_INK = (0.16, 0.10, 0.07)
ETCH_WIDEN = 1.14  # the disc is a touch wider than tall, which reads rounder on the curved wall

# ---------------------------------------------------------------- profiles ---


def linspace(a, b, n):
    return [a + (b - a) * i / (n - 1) for i in range(n)]


def outer_profile():
    """Outer wall, top to axis, as (r, z): nearly straight, a deep rounded corner, flat base."""
    pts = [(r, z) for r, z in zip(linspace(1.0, 0.955, 14), linspace(-0.05, -1.5, 14))]
    # corner: a quarter ellipse from the wall to the base
    for th in linspace(0, math.pi / 2, 22)[1:]:
        pts.append((0.5 + 0.455 * math.cos(th), -1.5 - (HEIGHT - 1.5) * math.sin(th)))
    # flat base to the axis
    for r in linspace(0.5, 0.0, 8)[1:]:
        pts.append((r, -HEIGHT))
    return pts


BOWL_BOTTOM = -1.74  # deeper inner bowl (was -1.55); the outer base is at -1.9


def bowl_profile():
    """Outer surface of the egg-shaped inner bowl, from the rim apex to the axis: nearly the
    full width of the cup at the top, then a deep round belly with a small air gap beside it."""
    pts = []
    for s in linspace(0, 1, 14):
        z = -0.10 + (-0.55 + 0.10) * s
        pts.append((0.90 + 0.055 * (1 - s) ** 2, z))
    for th in linspace(0, math.pi / 2, 30)[1:]:
        pts.append((0.90 * math.cos(th), -0.55 - (-BOWL_BOTTOM - 0.55) * math.sin(th)))
    return pts


def offset(pts, d):
    """Move a top-to-bottom polyline sideways by d (positive = away from the axis)."""
    out = []
    n = len(pts)
    for i, (r, z) in enumerate(pts):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, n - 1)]
        tr, tz = b[0] - a[0], b[1] - a[1]
        length = math.hypot(tr, tz) or 1.0
        nr, nz = -tz / length, tr / length
        out.append((max(r + nr * d, 0.0), z + nz * d))
    return out


def glass_loop():
    outer = outer_profile()
    c1 = offset(outer, -WALL)
    c1 = [p for p in c1 if p[1] <= -0.12]
    bowl = bowl_profile()
    inner = offset(bowl, -WALL)

    loop = list(outer)
    loop += list(reversed(c1))  # up the cavity side of the outer wall
    loop += bowl  # apex, then down the cavity side of the bowl
    loop += list(reversed(inner))  # up the inside of the bowl (liquid side)
    # rounded rim joining the inner bowl to the outer wall
    for th in linspace(math.pi, 0, 14)[:-1]:
        loop.append((0.95 + 0.05 * math.cos(th), -0.05 + 0.05 * math.sin(th)))
    return loop


def liquid_loop():
    inner = offset(bowl_profile(), -WALL - 0.006)
    pts = []
    for (r0, z0), (r1, z1) in zip(inner, inner[1:]):
        if z0 >= LIQUID_TOP >= z1:
            t = (z0 - LIQUID_TOP) / (z0 - z1)
            pts.append((r0 + (r1 - r0) * t, LIQUID_TOP))
        if z1 < LIQUID_TOP:
            pts.append((r1, z1))
    return [(0.0, LIQUID_TOP)] + pts


# ---------------------------------------------------------------- meshing ---


def revolve(name, loop, closed):
    """Spin an (r, z) loop around Z. Points on the axis become single vertices."""
    verts, index = [], {}

    def vid(i, j):
        r, z = loop[i]
        if r < 1e-6:
            key = ("axis", i)
            if key not in index:
                index[key] = len(verts)
                verts.append((0.0, 0.0, z))
            return index[key]
        key = (i, j % SEGMENTS)
        if key not in index:
            index[key] = len(verts)
            a = 2 * math.pi * (j % SEGMENTS) / SEGMENTS
            verts.append((r * math.cos(a), r * math.sin(a), z))
        return index[key]

    faces = []
    count = len(loop) if closed else len(loop) - 1
    for i in range(count):
        k = (i + 1) % len(loop)
        if loop[i][0] < 1e-6 and loop[k][0] < 1e-6:
            continue
        for j in range(SEGMENTS):
            quad = [vid(i, j), vid(i, j + 1), vid(k, j + 1), vid(k, j)]
            dedup = [v for n, v in enumerate(quad) if v != quad[n - 1]]
            if len(dedup) >= 3:
                faces.append(dedup)

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def etch_patch():
    """A thin curved patch hugging the front of the outer wall; UV 0..1 = the logo."""
    _, size = etch_texture()  # side of the square patch, in model units
    z_mid = ETCH_CENTRE_Z
    z_top, z_bot = z_mid + size / 2, z_mid - size / 2
    cols, rows = 32, 32
    outer = outer_profile()  # the sticker goes on the outer wall

    def wall_r(z):
        for (r0, z0), (r1, z1) in zip(outer, outer[1:]):
            if z0 >= z >= z1:
                return r0 + (r1 - r0) * (z0 - z) / (z0 - z1)
        return outer[-1][0]

    half = (size * ETCH_WIDEN / 2) / wall_r(z_mid)  # half arc in radians: a bit wider than tall
    verts, uvs, faces = [], [], []
    for row in range(rows + 1):
        v = row / rows
        z = z_top + (z_bot - z_top) * v
        r = wall_r(z) + 0.006
        for col in range(cols + 1):
            u = col / cols
            a = -math.pi / 2 - half * (1 - 2 * u)  # centred on -Y; seen from the front u runs left to right
            verts.append((r * math.cos(a), r * math.sin(a), z))
            uvs.append((u, 1 - v))
    for row in range(rows):
        for col in range(cols):
            a = row * (cols + 1) + col
            faces.append([a, a + 1, a + cols + 2, a + cols + 1])

    mesh = bpy.data.meshes.new("Etch")
    mesh.from_pydata(verts, [], faces)
    layer = mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        for li, vi in zip(poly.loop_indices, poly.vertices):
            layer.data[li].uv = uvs[vi]
    mesh.update()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new("Etch", mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    bm.from_mesh(mesh)
    # make the patch face outward (away from the axis)
    bm.faces.ensure_lookup_table()
    face = bm.faces[len(bm.faces) // 2]
    c = face.calc_center_median()
    if face.normal.x * c.x + face.normal.y * c.y < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    return obj


# --------------------------------------------------------------- materials ---


def principled(mat):
    mat.use_nodes = True
    return mat.node_tree.nodes["Principled BSDF"]


_etch_cache = None


def etch_texture():
    """The logo as dark ink on a white disc, sized to the disc. Returns (image, patch side)."""
    global _etch_cache
    if _etch_cache:
        return _etch_cache
    src = bpy.data.images.load(LOGO)
    w, h = src.size
    px = np.array(src.pixels[:], dtype=np.float32).reshape(h, w, 4)
    lum = px[..., :3].mean(axis=2)
    ink = np.clip((1.0 - lum) * 1.4, 0.0, 1.0)

    ys, xs = np.where(ink > 0.15)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    bw, bh = xs.max() - xs.min(), ys.max() - ys.min()
    radius = 0.5 * math.hypot(bw, bh) * 1.08  # the disc just clears the logo's corners
    n = int(math.ceil(2 * radius))
    pad = n
    padded = np.pad(ink, pad)
    x0, y0 = int(round(cx - n / 2)) + pad, int(round(cy - n / 2)) + pad
    crop = padded[y0 : y0 + n, x0 : x0 + n]

    yy, xx = np.mgrid[0:n, 0:n]
    dist = np.hypot(xx - (n - 1) / 2, yy - (n - 1) / 2)
    disc = np.clip(radius - dist + 0.5, 0.0, 1.0)  # 1 px soft edge

    paper = np.array([1.0, 1.0, 1.0], dtype=np.float32)
    ink_rgb = np.array(ETCH_INK, dtype=np.float32)
    out = np.empty((n, n, 4), dtype=np.float32)
    out[..., :3] = paper * (1 - crop[..., None]) + ink_rgb * crop[..., None]
    out[..., 3] = disc

    img = bpy.data.images.new("etch", n, n, alpha=True)
    img.pixels = out.ravel().tolist()
    img.alpha_mode = "STRAIGHT"
    img.scale(512, 512)  # the disc covers a small part of the screen
    img.filepath_raw = os.path.join(OUT_DIR, "etch.png")
    img.file_format = "PNG"
    img.save()
    # reload so the exporter sees a file-backed image
    bpy.data.images.remove(img)
    bpy.data.images.remove(src)
    loaded = bpy.data.images.load(os.path.join(OUT_DIR, "etch.png"))
    size = 2 * radius * (ETCH_LOGO_SPAN * ETCH_SCALE / w)
    _etch_cache = (loaded, size)
    return _etch_cache


def build_materials(glass, liquid, etch):
    gm = bpy.data.materials.new("GlassMat")
    b = principled(gm)
    b.inputs["Base Color"].default_value = (0.97, 1.0, 0.99, 1)
    b.inputs["Roughness"].default_value = 0.0
    b.inputs["IOR"].default_value = 1.5
    b.inputs["Transmission Weight"].default_value = 1.0
    glass.data.materials.append(gm)

    lm = bpy.data.materials.new("LiquidMat")
    b = principled(lm)
    b.inputs["Base Color"].default_value = (0.69, 0.48, 0.28, 1)  # ~#d9b98f in linear space
    b.inputs["Roughness"].default_value = 0.35
    liquid.data.materials.append(lm)

    em = bpy.data.materials.new("EtchMat")
    em.blend_method = "BLEND"
    b = principled(em)
    tex = em.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = etch_texture()[0]
    b.inputs["Roughness"].default_value = 0.6
    em.node_tree.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    em.node_tree.links.new(tex.outputs["Alpha"], b.inputs["Alpha"])
    etch.data.materials.append(em)


# -------------------------------------------------------------- preview ---


def render_preview():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    scene.cycles.transparent_max_bounces = 16
    scene.cycles.transmission_bounces = 16
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1000
    scene.render.filepath = os.path.join(OUT_DIR, "preview.png")

    # soft studio world + a marble-ish floor so the glass has something to refract
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.9, 0.88, 0.85, 1)
    bg.inputs["Strength"].default_value = 1.0
    scene.world = world

    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -HEIGHT))
    floor = bpy.context.active_object
    fm = bpy.data.materials.new("Floor")
    principled(fm).inputs["Base Color"].default_value = (0.85, 0.83, 0.8, 1)
    floor.data.materials.append(fm)

    bpy.ops.object.light_add(type="AREA", location=(-4, -6, 4))
    key = bpy.context.active_object
    key.data.energy = 600
    key.data.size = 5
    key.rotation_euler = (math.radians(60), 0, math.radians(-30))

    bpy.ops.object.camera_add(location=(0, -11, -0.6))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(86), 0, 0)
    cam.data.lens = 70
    scene.camera = cam
    bpy.ops.render.render(write_still=True)

    for obj in (floor, key, cam):
        bpy.data.objects.remove(obj, do_unlink=True)


# -------------------------------------------------------------------- main ---


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    glass = revolve("Glass", glass_loop(), closed=True)
    liquid = revolve("Liquid", liquid_loop(), closed=True)
    etch = etch_patch()
    build_materials(glass, liquid, etch)

    render_preview()

    bpy.ops.object.select_all(action="DESELECT")
    for obj in (glass, liquid, etch):
        obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=GLB,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_draco_mesh_compression_enable=False,
    )
    print("exported", GLB, os.path.getsize(GLB), "bytes")


main()
