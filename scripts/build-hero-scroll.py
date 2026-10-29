"""Build the sliding Sim humanoid hero background from the humanoid renders (needs numpy).
Usage: python3 scripts/build-hero-scroll.py /path/to/videos_final /path/to/ffmpeg
All 100 clips, shuffled with a fixed seed, fill four rows of 25 that slide left to right. Each row travels exactly
one row length per loop, and the loop is a multiple of every clip length, so the video loops without a seam.
"""
import json
import random
import subprocess
import sys
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parents[1]
renders = Path(sys.argv[1])
ffmpeg = sys.argv[2] if len(sys.argv) > 2 else 'ffmpeg'
FPS, SECONDS = 20, 60                     # 60 s is a multiple of the 6 s and 10 s clips
WIDTH, ROWS, CELL_W, CELL_H, GAP = 1920, 4, 288, 270, 4   # a 2 px gap breaks up under compression
PER_ROW = 25                              # 25 x 288 px = 7,200 px = 1,200 frames x 6 px: a whole-pixel step
FRAMES, ROW_LEN = FPS * SECONDS, PER_ROW * CELL_W
STEP = ROW_LEN // FRAMES
assert STEP * FRAMES == ROW_LEN
GAP_RGB = (233, 230, 225)
TILE_W, TILE_H = CELL_W - GAP, CELL_H - GAP

def decode(name):
    # The middle of each 960 x 540 render, cropped to the tile shape, holds the robot and its object.
    vf = f'fps={FPS},crop=ih*{TILE_W}/{TILE_H}:ih,scale={TILE_W}:{TILE_H}:flags=lanczos'
    raw = subprocess.run([ffmpeg, '-v', 'error', '-i', str(renders / name), '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True, check=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, TILE_H, TILE_W, 3)
    # Fit every clip to 6 s or 10 s, trimming or holding the last frame, so each one divides the loop.
    target = FPS * (10 if len(frames) > 8 * FPS else 6)
    frames = np.concatenate([frames[:target], np.repeat(frames[-1:], max(0, target - len(frames)), 0)])
    assert FRAMES % len(frames) == 0, name
    return frames

clips = sorted(c['video'] for c in json.loads((renders / 'index.json').read_text()))
assert len(clips) == ROWS * PER_ROW
rng = random.Random(0)
order = rng.sample(clips, len(clips))
rows = [order[r * PER_ROW:(r + 1) * PER_ROW] for r in range(ROWS)]
cache = {name: decode(name) for name in clips}
phase = [[rng.randrange(len(cache[name])) for name in row] for row in rows]
(root / 'hero-scroll-layout.json').write_text(json.dumps({'fps': FPS, 'seconds': SECONDS, 'rows': rows}, indent=1) + '\n')

output = root / 'media' / 'hero-sim-humanoid-scroll.mp4'
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
