"""槍擊演出圖集產生器（v0.48.0）。全部由程式繪製，不使用也不修改主人的美術。
用法：python3 tools/gun-vfx-sheets.py [輸出資料夾，預設 fx/]
產生 fx/gun-bullet-24.webp（子彈）與 fx/gun-pellet-24.webp（霰彈彈丸）：464×360 一格、4×6 格；
上半 3 列是命中層（錨點 250,160），下半 3 列是垂直曳光層（槍口 250,316），遊戲執行時旋轉到每一發的落點。"""
import math
import numpy as np
from PIL import Image

CW, CH = 464, 360
COLS, ROWS = 4, 3
HX, HY = 250.0, 160.0  # impact anchor on HP bar center
ANG = -math.pi / 2  # straight up from the bottom of the card (v1 look, vertical only)
UX, UY = math.cos(ANG), math.sin(ANG)
PX, PY = -UY, UX

def make_noise(h, w, scales=(6, 12, 24, 48), seed=42):
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    wt = 0.0
    for i, s in enumerate(scales):
        gh, gw = max(2, h // s), max(2, w // s)
        g = rng.random((gh, gw), dtype=np.float32)
        im = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.Resampling.BICUBIC)
        w_i = 0.5 ** i
        acc += (np.asarray(im, np.float32) / 255.0) * w_i
        wt += w_i
    acc /= wt
    return acc

N1 = make_noise(CH, CW, (4, 10, 22, 44), seed=101)
N2 = make_noise(CH, CW, (3, 7, 15, 30), seed=202)
N3 = make_noise(CH, CW, (8, 16, 32), seed=303)

YY, XX = np.mgrid[0:CH, 0:CW].astype(np.float32)
DX = XX - HX
DY = YY - HY
R = np.sqrt(DX * DX + DY * DY) + 1e-5
ALONG = DX * UX + DY * UY
CROSS = DX * PX + DY * PY
THETA = np.arctan2(DY, DX)

def soft_clamp(x):
    return np.clip(x, 0.0, 1.0)

def over_layer(canvas, rgb_arr, alpha):
    a = soft_clamp(alpha)
    if a.max() <= 1e-4:
        return
    src_a = a[..., None]
    dst_a = canvas[..., 3:4]
    out_a = src_a + dst_a * (1.0 - src_a)
    safe = np.maximum(out_a, 1e-5)
    if np.ndim(rgb_arr) == 1:
        c = np.array(rgb_arr, np.float32).reshape(1, 1, 3) / 255.0
    else:
        c = rgb_arr
    out_rgb = (c * src_a + canvas[..., :3] * dst_a * (1.0 - src_a)) / safe
    canvas[..., :3] = out_rgb
    canvas[..., 3:4] = out_a

def draw_segment(x0, y0, x1, y1, w0, w1, noise_cut=0.0):
    vx, vy = x1 - x0, y1 - y0
    L2 = vx * vx + vy * vy + 1e-5
    t = np.clip(((XX - x0) * vx + (YY - y0) * vy) / L2, 0.0, 1.0)
    px = x0 + t * vx
    py = y0 + t * vy
    dist = np.sqrt((XX - px) ** 2 + (YY - py) ** 2)
    rad = w0 + (w1 - w0) * t
    val = soft_clamp(1.0 - dist / np.maximum(rad, 0.35))
    if noise_cut > 0:
        # Only erode inside the stroke, never create background speckles where val==0
        eroded = soft_clamp((val - noise_cut * (N2 - 0.25)) / max(0.25, 1.0 - noise_cut * 0.4))
        val = np.where(val > 0.01, eroded * soft_clamp(val * 4.0), 0.0)
    return val

def paint_smoke(canvas, cx, cy, dir_x, dir_y, length, spread, density, seed_shift=0.0, lit=0.55):
    ns = make_noise(CH, CW, (6, 14, 28, 56), seed=500 + int(seed_shift * 131))
    dx, dy = XX - cx, YY - cy
    al = dx * dir_x + dy * dir_y
    cr = dx * (-dir_y) + dy * dir_x
    u = np.clip(al / max(length, 1.0), 0.0, 1.3)
    w_env = spread * (0.28 + 0.95 * np.sqrt(np.clip(u, 0.0, 1.2)))
    shape = (
        np.exp(-0.5 * (cr / np.maximum(w_env, 1.0)) ** 2)
        * soft_clamp(1.0 - (al - length * 0.12) / (length * 0.92))
        * soft_clamp((al + 16.0) / 22.0)
    )
    wisps = soft_clamp((shape * (0.35 + 1.15 * ns) - 0.25) * 1.85) * density
    tone = (92.0 + 98.0 * ns) * lit + 36.0
    rgb = np.zeros((CH, CW, 3), np.float32)
    rgb[..., 0] = np.clip(tone + 10.0 * lit, 0, 255) / 255.0
    rgb[..., 1] = np.clip(tone + 3.0 * lit, 0, 255) / 255.0
    rgb[..., 2] = np.clip(tone, 0, 255) / 255.0
    over_layer(canvas, rgb, wisps)

def paint_jagged_burst(canvas, cx, cy, strength, prog, seed=41):
    if strength <= 0:
        return
    rng = np.random.default_rng(seed)
    dx, dy = XX - cx, YY - cy
    rr = np.sqrt(dx * dx + dy * dy) + 1e-5
    th = np.arctan2(dy, dx)

    burst = np.zeros((CH, CW), np.float32)
    for i in range(18):
        if i < 7:
            a = ANG + rng.uniform(-0.68, 0.68)
            L = rng.uniform(55.0, 148.0) * (0.65 + 0.55 * prog) * strength
        elif i < 13:
            a = ANG + math.pi * rng.choice([-0.5, 0.5]) + rng.uniform(-0.40, 0.40)
            L = rng.uniform(40.0, 102.0) * (0.65 + 0.45 * prog) * strength
        else:
            a = ANG + math.pi + rng.uniform(-0.70, 0.70)
            L = rng.uniform(25.0, 68.0) * (0.6 + 0.4 * prog) * strength
        w0 = rng.uniform(6.5, 14.5) * strength
        x1, y1 = cx + math.cos(a) * L, cy + math.sin(a) * L
        seg = draw_segment(cx, cy, x1, y1, w0, 0.35, noise_cut=0.45)
        burst = np.maximum(burst, seg)

    wob = 0.25 * np.sin(th * 3 + 0.4) + 0.22 * np.cos(th * 7 - 0.9) + 0.45 * (N2 - 0.5)
    core_r = 25.0 * strength * (1.0 + wob)
    core = soft_clamp((core_r - rr) / 6.5)
    val = soft_clamp(np.maximum(burst * 0.96, core) * min(1.0, strength * 1.12))

    rgb = np.zeros((CH, CW, 3), np.float32)
    hot = soft_clamp((val - 0.38) / 0.62)
    rgb[..., 0] = 1.0
    rgb[..., 1] = soft_clamp(0.26 + 0.74 * (hot ** 0.72))
    rgb[..., 2] = soft_clamp(0.08 + 0.90 * (hot ** 1.30))
    over_layer(canvas, rgb, val)

def paint_sparks(canvas, cx, cy, intensity, spread_prog, seed=31):
    if intensity <= 0:
        return
    rng = np.random.default_rng(seed)
    sp = np.zeros((CH, CW), np.float32)
    for i in range(36):
        if i < 22:
            a = ANG + rng.uniform(-0.92, 0.92)
            spd = rng.uniform(70.0, 225.0)
        else:
            a = rng.uniform(-math.pi, math.pi)
            spd = rng.uniform(45.0, 160.0)
        d_head = 10.0 + spd * spread_prog
        d_tail = max(3.0, d_head - rng.uniform(18.0, 54.0) * (1.0 - 0.35 * spread_prog))
        x0, y0 = cx + math.cos(a) * d_tail, cy + math.sin(a) * d_tail
        x1, y1 = cx + math.cos(a) * d_head, cy + math.sin(a) * d_head
        seg = draw_segment(x0, y0, x1, y1, 0.65, 2.4)
        sp = np.maximum(sp, seg * rng.uniform(0.65, 1.0))
    sp = soft_clamp(sp * intensity)
    rgb = np.zeros((CH, CW, 3), np.float32)
    rgb[..., 0] = 1.0
    rgb[..., 1] = soft_clamp(0.45 + 0.53 * sp)
    rgb[..., 2] = soft_clamp(0.15 + 0.82 * (sp ** 1.7))
    over_layer(canvas, rgb, sp)

def paint_blood_arcs(canvas, t_prog, seed=99):
    rng = np.random.default_rng(seed)
    spray = np.zeros((CH, CW), np.float32)

    # 1. Crisp directional crimson spray fan (no geometric edge, rich brushy streaks)
    if t_prog < 0.78:
        mist_fade = soft_clamp(1.0 - t_prog / 0.78) ** 1.2
        shift = 34.0 + 74.0 * min(1.0, t_prog / 0.34)
        sx, sy = ALONG - shift, CROSS
        rx = 55.0 + 88.0 * min(1.0, t_prog / 0.45)
        ry = 34.0 + 46.0 * min(1.0, t_prog / 0.45)
        ell = np.exp(-0.5 * ((sx / rx) ** 2 + (sy / ry) ** 2))
        ragged = soft_clamp((ell * (0.18 + 1.40 * N2) - 0.28 - 0.24 * t_prog) * 2.4)
        spray = np.maximum(spray, ragged * mist_fade * 0.88)

    # 2. Vivid crimson blood whip-ribbons & splatter droplets
    for i in range(52):
        if i < 34:
            a = ANG + rng.uniform(-0.88, 0.80)
            spd = rng.uniform(68.0, 232.0)
            w0 = rng.uniform(2.8, 7.6)
            tail = rng.uniform(22.0, 66.0)
        else:
            a = ANG + math.pi + rng.uniform(-1.15, 1.15)
            spd = rng.uniform(26.0, 110.0)
            w0 = rng.uniform(2.2, 5.2)
            tail = rng.uniform(12.0, 30.0)
        dist = 8.0 + spd * (t_prog ** 0.70) * 0.94
        grav = 20.0 * (t_prog ** 1.65)
        hx = HX + math.cos(a) * dist
        hy = HY + math.sin(a) * dist + grav
        tx = hx - math.cos(a) * tail * (1.0 - 0.52 * t_prog)
        ty = hy - math.sin(a) * tail * (1.0 - 0.52 * t_prog)
        fade = soft_clamp(1.0 - max(0.0, t_prog - 0.14) / 0.86) * rng.uniform(0.78, 1.0)
        seg = draw_segment(tx, ty, hx, hy, w0 * 0.20, w0 * (1.0 - 0.32 * t_prog), noise_cut=0.42)
        spray = np.maximum(spray, seg * fade)

    bright = soft_clamp((N1 * 0.85 + spray * 0.55) - 0.32)
    rgb = np.zeros((CH, CW, 3), np.float32)
    rgb[..., 0] = (158.0 + 94.0 * bright) / 255.0
    rgb[..., 1] = (12.0 + 44.0 * (bright ** 1.7)) / 255.0
    rgb[..., 2] = (12.0 + 26.0 * (bright ** 1.9)) / 255.0
    over_layer(canvas, rgb, spray)

def paint_bullet_wound(canvas, strength, erosion=0.0, ember=0.0):
    if strength <= 0:
        return
    rng = np.random.default_rng(777)
    # Irregular elliptical bullet crater (angled along shot, organic wobble — not a 5-point star)
    r_ell = np.sqrt((ALONG * 0.82) ** 2 + (CROSS * 1.12) ** 2) + 1e-5
    ang_wob = (
        0.16 * np.sin(THETA * 3 + 0.5)
        + 0.14 * np.cos(THETA * 7 - 1.3)
        + 0.11 * np.sin(THETA * 11 + 2.1)
        + 0.55 * (N2 - 0.5)
    )
    hole_r = 9.5 * (1.0 + ang_wob) * (1.0 - 0.32 * erosion)
    hole = soft_clamp((hole_r - r_ell) / 2.2)

    # Jagged hairline fractures branching asymmetrically
    cracks = np.zeros((CH, CW), np.float32)
    angles = [-2.95, -2.10, -1.38, -0.62, -0.14, 0.35, 1.05, 1.95, 2.58]
    lengths = [38, 24, 46, 62, 74, 54, 34, 26, 42]
    for a0, L in zip(angles, lengths):
        L_eff = L * (1.0 - 0.48 * erosion)
        mid_L = L_eff * rng.uniform(0.38, 0.55)
        kink = rng.uniform(-0.36, 0.36)
        x1, y1 = HX + math.cos(a0) * mid_L, HY + math.sin(a0) * mid_L
        x2, y2 = x1 + math.cos(a0 + kink) * (L_eff - mid_L), y1 + math.sin(a0 + kink) * (L_eff - mid_L)
        s1 = draw_segment(HX, HY, x1, y1, 3.2, 1.6, noise_cut=0.35)
        s2 = draw_segment(x1, y1, x2, y2, 1.6, 0.45, noise_cut=0.45)
        cracks = np.maximum(cracks, np.maximum(s1, s2))

    if erosion > 0:
        erode_t = erosion * 0.85 * (0.35 + 0.65 * N1) + erosion * 0.42 * (R / 64.0)
        hole = soft_clamp((hole - erode_t) * 1.45)
        cracks = soft_clamp((cracks - erode_t * 0.95) * 1.5)

    rim = soft_clamp((hole_r + 5.0 - r_ell) / 3.0) * (1.0 - hole * 0.88)
    crack_rim = soft_clamp(cracks * 1.15) * (1.0 - cracks * 0.65)
    rim_tot = soft_clamp(np.maximum(rim, crack_rim * 0.72)) * strength
    if rim_tot.max() > 1e-4:
        rgb_rim = np.zeros((CH, CW, 3), np.float32)
        rgb_rim[..., 0] = (150.0 + 105.0 * ember) / 255.0
        rgb_rim[..., 1] = (108.0 * (1.0 - 0.5 * ember) + 125.0 * ember) / 255.0
        rgb_rim[..., 2] = (104.0 * (1.0 - 0.7 * ember) + 35.0 * ember) / 255.0
        over_layer(canvas, rgb_rim, rim_tot * 0.75)

    pit = soft_clamp(np.maximum(hole, cracks * 0.92)) * strength
    over_layer(canvas, (10, 5, 5), pit)

def paint_tracer(canvas, p0, p1, w_core, alpha, muzzle_flash=0.0):
    if muzzle_flash > 0:
        mx, my = p0
        dx, dy = XX - mx, YY - my
        al = dx * UX + dy * UY
        cr = dx * PX + dy * PY
        cone = soft_clamp(1.0 - np.abs(cr) / np.maximum(6.0 + al * 0.38, 1.0)) * soft_clamp(al / 8.0) * soft_clamp(1.0 - al / (88.0 * muzzle_flash))
        side = np.exp(-0.5 * (al / 6.5) ** 2) * soft_clamp(1.0 - np.abs(cr) / (34.0 * muzzle_flash))
        m_val = soft_clamp(np.maximum(cone, side * 0.82) * (0.65 + 0.55 * N2)) * muzzle_flash
        rgb = np.zeros((CH, CW, 3), np.float32)
        rgb[..., 0] = 1.0
        rgb[..., 1] = soft_clamp(0.45 + 0.52 * m_val)
        rgb[..., 2] = soft_clamp(0.14 + 0.84 * (m_val ** 1.4))
        over_layer(canvas, rgb, m_val)

    if alpha > 0:
        sheath = draw_segment(p0[0], p0[1], p1[0], p1[1], w_core * 1.4, w_core * 2.2, noise_cut=0.32) * alpha * 0.85
        core = draw_segment(p0[0], p0[1], p1[0], p1[1], w_core * 0.35, w_core * 0.95) * alpha
        rgb_s = np.zeros((CH, CW, 3), np.float32)
        rgb_s[..., 0] = 1.0
        rgb_s[..., 1] = 0.42
        rgb_s[..., 2] = 0.14
        over_layer(canvas, rgb_s, sheath)
        rgb_c = np.zeros((CH, CW, 3), np.float32)
        rgb_c[..., 0] = 1.0
        rgb_c[..., 1] = 0.97
        rgb_c[..., 2] = 0.90
        over_layer(canvas, rgb_c, core)


# ---- v5 兩層圖集 ----
# v5：沿用 v3 的程式繪製函式（同一套筆觸），把曳光與命中拆成兩層，另產生霰彈彈丸圖集。
import math, numpy as np
from PIL import Image

MX, MY = HX, CH - 44.0  # 固定槍口原點（卡片正下方）
COLS, ROWS = 4, 3

def new():
    return np.zeros((CH, CW, 4), np.float32)

def put(sheet, canvas, f, row0):
    rgba = (np.clip(canvas, 0, 1) * 255).astype(np.uint8)
    sheet.alpha_composite(Image.fromarray(rgba, 'RGBA'), ((f % 4) * CW, (row0 + f // 4) * CH))

# ---------- 子彈：上半 3 列命中層、下半 3 列曳光層（垂直，渲染時旋轉到各發落點） ----------
bullet = Image.new('RGBA', (CW * 4, CH * 6), (0, 0, 0, 0))
mx, my = MX, MY
for f in range(12):
    imp, trc = new(), new()
    if f == 0:
        paint_smoke(trc, mx, my, UX, UY, 115, 14, 0.38, seed_shift=0.1, lit=0.85)
        paint_tracer(trc, (mx, my), (mx + (HX - mx) * 0.65, my + (HY - my) * 0.65), w_core=4.2, alpha=0.95, muzzle_flash=1.0)
    elif f == 1:
        paint_smoke(trc, mx, my, UX, UY, 185, 18, 0.44, seed_shift=0.2, lit=0.8)
        paint_tracer(trc, (mx + 14 * UX, my + 14 * UY), (HX, HY), w_core=4.6, alpha=1.0, muzzle_flash=0.45)
        paint_jagged_burst(imp, HX, HY, strength=0.60, prog=0.22, seed=41)
    elif f == 2:
        paint_smoke(trc, mx + 36 * UX, my + 36 * UY, UX, UY, 225, 22, 0.45, seed_shift=0.3, lit=0.9)
        paint_tracer(trc, (mx + 64 * UX, my + 64 * UY), (HX, HY), w_core=3.4, alpha=0.65)
        paint_blood_arcs(imp, t_prog=0.06, seed=102)
        paint_jagged_burst(imp, HX, HY, strength=1.24, prog=0.78, seed=42)
        paint_sparks(imp, HX, HY, intensity=1.15, spread_prog=0.16, seed=202)
        paint_bullet_wound(imp, strength=0.88, erosion=0.0, ember=1.0)
    elif f == 3:
        paint_smoke(imp, HX - 28 * UX, HY - 28 * UY, UX, UY, 210, 28, 0.56, seed_shift=0.4, lit=0.78)
        paint_blood_arcs(imp, t_prog=0.19, seed=103)
        paint_jagged_burst(imp, HX, HY, strength=0.90, prog=1.0, seed=43)
        paint_sparks(imp, HX, HY, intensity=0.96, spread_prog=0.38, seed=202)
        paint_bullet_wound(imp, strength=1.0, erosion=0.0, ember=0.85)
    elif f == 4:
        paint_smoke(imp, HX - 12 * UX, HY - 12 * UY, UX, UY, 215, 34, 0.58, seed_shift=0.5, lit=0.68)
        paint_blood_arcs(imp, t_prog=0.33, seed=103)
        paint_jagged_burst(imp, HX, HY, strength=0.44, prog=1.0, seed=44)
        paint_sparks(imp, HX, HY, intensity=0.68, spread_prog=0.60, seed=202)
        paint_bullet_wound(imp, strength=1.0, erosion=0.05, ember=0.55)
    elif f == 5:
        paint_smoke(imp, HX, HY, UX, UY, 205, 38, 0.54, seed_shift=0.6, lit=0.60)
        paint_blood_arcs(imp, t_prog=0.47, seed=103)
        paint_sparks(imp, HX, HY, intensity=0.38, spread_prog=0.80, seed=202)
        paint_bullet_wound(imp, strength=0.95, erosion=0.12, ember=0.30)
    elif f == 6:
        paint_smoke(imp, HX + 10 * UX, HY + 10 * UY, UX, UY, 195, 42, 0.46, seed_shift=0.7, lit=0.52)
        paint_blood_arcs(imp, t_prog=0.61, seed=103)
        paint_bullet_wound(imp, strength=0.86, erosion=0.22, ember=0.12)
    else:
        sm = {7: (20, 185, 46, .36, .8, .46), 8: (30, 170, 50, .26, .9, .40), 9: (38, 155, 54, .17, 1.0, .36), 10: (46, 140, 56, .10, 1.1, .32), 11: (54, 125, 60, .04, 1.2, .28)}[f]
        paint_smoke(imp, HX + sm[0] * UX, HY + sm[0] * UY, UX, UY, sm[1], sm[2], sm[3], seed_shift=sm[4], lit=sm[5])
        if f <= 8: paint_blood_arcs(imp, t_prog={7: .75, 8: .88}[f], seed=103)
        wd = {7: (.74, .36), 8: (.58, .52), 9: (.40, .70), 10: (.22, .86), 11: (.08, .96)}[f]
        paint_bullet_wound(imp, strength=wd[0], erosion=wd[1], ember=0.0)
    put(bullet, imp, f, 0)
    put(bullet, trc, f, 3)

# ---------- 霰彈：同一原點扇形射出的彈丸，命中點群聚在血條周圍 ----------
rng = np.random.default_rng(870)
PEL = []
for i in range(11):
    a = rng.uniform(0, 2 * math.pi); r = math.sqrt(rng.uniform(0.04, 1.0))
    PEL.append((HX + math.cos(a) * r * 92.0, HY + math.sin(a) * r * 34.0))

def paint_pellet_hole(canvas, cx, cy, strength, erosion=0.0, ember=0.0, seed=0):
    dx, dy = XX - cx, YY - cy
    rr = np.sqrt(dx * dx + dy * dy) + 1e-5
    th = np.arctan2(dy, dx)
    wob = 0.18 * np.sin(th * 3 + seed) + 0.35 * (N2 - 0.5)
    hr = 4.2 * (1 + wob) * (1 - 0.35 * erosion)
    hole = soft_clamp((hr - rr) / 1.6)
    rim = soft_clamp((hr + 3.2 - rr) / 2.0) * (1 - hole)
    if erosion > 0:
        e = erosion * (0.4 + 0.8 * N1)
        hole = soft_clamp((hole - e) * 1.5); rim = soft_clamp((rim - e) * 1.5)
    rgb = np.zeros((CH, CW, 3), np.float32)
    rgb[..., 0] = (150 + 105 * ember) / 255; rgb[..., 1] = (108 * (1 - .5 * ember) + 125 * ember) / 255; rgb[..., 2] = (104 * (1 - .7 * ember) + 35 * ember) / 255
    over_layer(canvas, rgb, rim * 0.7 * strength)
    over_layer(canvas, (10, 5, 5), hole * strength)

def paint_pellet_mist(canvas, t_prog, strength=1.0):
    acc = np.zeros((CH, CW), np.float32)
    for i, (px, py) in enumerate(PEL):
        d = np.sqrt(((XX - px) / (10 + 26 * t_prog)) ** 2 + ((YY - py + 8 * t_prog) / (8 + 18 * t_prog)) ** 2)
        acc = np.maximum(acc, np.exp(-d * d))
    spray = soft_clamp((acc * (0.2 + 1.3 * N2) - 0.3) * 2.2) * soft_clamp(1.0 - t_prog) * strength
    bright = soft_clamp(N1 * 0.85 + spray * 0.5 - 0.3)
    rgb = np.zeros((CH, CW, 3), np.float32)
    rgb[..., 0] = (158 + 94 * bright) / 255; rgb[..., 1] = (12 + 44 * bright ** 1.7) / 255; rgb[..., 2] = (12 + 26 * bright ** 1.9) / 255
    over_layer(canvas, rgb, spray * 0.85)

pellet = Image.new('RGBA', (CW * 4, CH * 6), (0, 0, 0, 0))
for f in range(12):
    imp, trc = new(), new()
    if f <= 2:
        reach = [0.6, 1.0, 1.0][f]; wc = [1.7, 1.9, 1.3][f]; al = [0.95, 1.0, 0.5][f]
        paint_smoke(trc, mx, my, UX, UY, [80, 130, 170][f], [26, 34, 40][f], [0.5, 0.56, 0.5][f], seed_shift=0.15 + f * .1, lit=0.85)
        for i, (px, py) in enumerate(PEL):
            t0 = 0.0 if f < 2 else 0.45
            sx, sy = mx + (px - mx) * t0, my + (py - my) * t0
            ex, ey = mx + (px - mx) * reach, my + (py - my) * reach
            paint_tracer(trc, (sx, sy), (ex, ey), w_core=wc, alpha=al, muzzle_flash=0.0)
        if f < 2:
            paint_tracer(trc, (mx, my), (mx, my - 6), w_core=2.0, alpha=0.0, muzzle_flash=[1.35, 0.7][f])
    if f >= 1:
        for i, (px, py) in enumerate(PEL):
            if f in (1, 2, 3):
                paint_jagged_burst(imp, px, py, strength=[0.30, 0.42, 0.26][f - 1], prog=[0.3, 0.8, 1.0][f - 1], seed=60 + i)
            if f >= 2:
                er = max(0.0, (f - 5) / 6.5)
                paint_pellet_hole(imp, px, py, strength=min(1.0, 1.25 - er), erosion=er, ember=max(0.0, 1 - (f - 2) * 0.3), seed=i)
        if 2 <= f <= 8:
            paint_pellet_mist(imp, t_prog=(f - 2) / 7.0)
        if f >= 3:
            paint_smoke(imp, HX, HY + 10, UX, UY, 150 + 6 * f, 52 + 3 * f, max(0.0, 0.5 - 0.05 * (f - 3)), seed_shift=0.5 + f * .1, lit=0.6)
        if f in (2, 3):
            paint_sparks(imp, HX, HY, intensity=[0.8, 0.5][f - 2], spread_prog=[0.25, 0.5][f - 2], seed=303)
    put(pellet, imp, f, 0)
    put(pellet, trc, f, 3)

import sys, pathlib
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent / 'fx')
for name, sh in (('gun-bullet-24', bullet), ('gun-pellet-24', pellet)):
    sh.save(out / f'{name}.webp', 'WEBP', lossless=True, method=6)
print('ok', bullet.size, pellet.size)
