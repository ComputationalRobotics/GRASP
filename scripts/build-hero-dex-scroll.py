"""Build the sliding Sim dex hero background from the 960 x 720 renders (needs numpy).
Usage: python3 scripts/build-hero-dex-scroll.py /path/to/renders /path/to/selection.json /path/to/ffmpeg
The 100 `hero` clips of selection.json fill four rows of 25 that slide left to right, like the Sim humanoid hero.
Each row travels exactly one row length per loop and every tile lasts a whole number of seconds up to 6, all
divisors of the 60 s loop, so the video loops without a seam.
"""
import json
import random
import subprocess
import sys
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parents[1]
renders = Path(sys.argv[1])
selection = json.loads(Path(sys.argv[2]).read_text())
ffmpeg = sys.argv[3] if len(sys.argv) > 3 else 'ffmpeg'
FPS, SECONDS = 20, 60
WIDTH, ROWS, CELL_W, CELL_H, GAP = 1920, 4, 288, 270, 4   # a 2 px gap breaks up under compression
PER_ROW = 25                              # 25 x 288 px = 7,200 px = 1,200 frames x 6 px: a whole-pixel step
FRAMES, ROW_LEN = FPS * SECONDS, PER_ROW * CELL_W
STEP = ROW_LEN // FRAMES
assert STEP * FRAMES == ROW_LEN
GAP_RGB = (233, 230, 225)
TILE_W, TILE_H = CELL_W - GAP, CELL_H - GAP
SOURCE_W, SOURCE_H = 960, 720

def crop_window(box):
    # A fixed window around everything that moves in the clip, in the tile's shape and at least 440 px tall.
    aspect = TILE_W / TILE_H
    x0, y0, x1, y1 = box
    height = min(SOURCE_H, max(440, (y1 - y0) * 1.16, (x1 - x0) * 1.16 / aspect))
    width = height * aspect
    left = min(max(0, (x0 + x1 - width) / 2), SOURCE_W - width)
    top = min(max(0, (y0 + y1 - height) / 2), SOURCE_H - height)
    return int(width) // 2 * 2, int(height) // 2 * 2, int(left), int(top)

def decode(clip):
    width, height, left, top = crop_window(clip['box'])
    speed = max(1, clip['seconds'] / 6)       # clips over 6 s are sped up to fit a tile
    vf = f'setpts=PTS/{speed:.4f},fps={FPS},crop={width}:{height}:{left}:{top},scale={TILE_W}:{TILE_H}:flags=lanczos'
    raw = subprocess.run([ffmpeg, '-v', 'error', '-i', str(renders / clip['hand'] / 'videos' / f"{clip['task']}.mp4"), '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True, check=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, TILE_H, TILE_W, 3)
    # Trim to a whole number of seconds so the clip repeats inside the loop; only a sub-second clip needs padding.
    target = FPS * max(1, min(6, len(frames) // FPS))
    frames = np.concatenate([frames[:target], np.repeat(frames[-1:], max(0, target - len(frames)), 0)])
    assert FRAMES % len(frames) == 0, clip['task']
    return frames

clips = selection['hero']
assert len(clips) == ROWS * PER_ROW
names = [f"{clip['hand']}_{clip['task']}" for clip in clips]
rows = [names[r * PER_ROW:(r + 1) * PER_ROW] for r in range(ROWS)]
cache = {name: decode(clip) for name, clip in zip(names, clips)}
rng = random.Random(0)
phase = [[rng.randrange(len(cache[name])) for name in row] for row in rows]
(root / 'hero-dex-scroll-layout.json').write_text(json.dumps({'fps': FPS, 'seconds': SECONDS, 'rows': rows}, indent=1) + '\n')

output = root / 'media' / 'hero-sim-dex-scroll.mp4'
encoder = subprocess.Popen([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{WIDTH}x{ROWS * CELL_H}', '-r', str(FPS), '-i', '-',
                            '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(output)], stdin=subprocess.PIPE)
canvas = np.empty((ROWS * CELL_H, WIDTH, 3), np.uint8)
for k in range(FRAMES):
    canvas[:] = GAP_RGB
    for r, row in enumerate(rows):
        shift = (k * STEP + r * CELL_W // ROWS) % ROW_LEN  # rows start staggered by a fraction of a tile
        for j, name in enumerate(row):
            x = (j * CELL_W + shift) % ROW_LEN
            if x > ROW_LEN - CELL_W:                       # tile entering on the left edge
                x -= ROW_LEN
            if x >= WIDTH:
                continue
            tile = cache[name][(k + phase[r][j]) % len(cache[name])]
            left, top = x + GAP // 2, r * CELL_H + GAP // 2
            a, b = max(0, -left), min(TILE_W, WIDTH - left)
            if a < b:
                canvas[top:top + TILE_H, left + a:left + b] = tile[:, a:b]
    encoder.stdin.write(canvas.tobytes())
encoder.stdin.close()
encoder.wait()
subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-ss', '1', '-i', str(output), '-frames:v', '1', '-q:v', '3', str(output.with_suffix('.jpg'))], check=True)
print(f'{len(clips)} clips in {ROWS} x {PER_ROW} tiles, {SECONDS} s at {STEP * FPS} px/s, {output.stat().st_size / 1e6:.1f} MB', flush=True)
