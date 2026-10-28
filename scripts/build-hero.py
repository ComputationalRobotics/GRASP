"""Rebuild the 3-row / 4-column backgrounds from already accelerated web clips.
Usage: python3 scripts/build-hero.py /path/to/ffmpeg
"""
import json
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ffmpeg = sys.argv[1] if len(sys.argv) > 1 else 'ffmpeg'
layouts = json.loads((root / 'hero-layout.json').read_text())

def run(args):
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', *args], check=True)

for group, rows in layouts.items():
    assert len(rows) == 3 and all(len(row) == 4 for row in rows)
    clips = [clip for row in rows for clip in row]
    inputs = []
    for clip in clips:
        inputs += ['-stream_loop', '-1', '-i', str(root / 'media' / f'{clip}.mp4')]
    # 4:3 tiles produce a 16:9 full-screen mosaic; crop instead of stretching.
    filters = [f'[{i}:v]fps=20,scale=480:360:force_original_aspect_ratio=increase,crop=480:360,setsar=1[v{i}]' for i in range(12)]
    positions = '|'.join(f'{i % 4 * 480}_{i // 4 * 360}' for i in range(12))
    filters += [''.join(f'[v{i}]' for i in range(12)) + f'xstack=inputs=12:layout={positions}[out]']
    output = root / 'media' / f'hero-{group}-grid12.mp4'
    run([*inputs, '-filter_complex_threads', '2', '-filter_complex', ';'.join(filters), '-map', '[out]', '-t', '16', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '2', '-y', str(output)])
    run(['-ss', '1', '-i', str(output), '-frames:v', '1', '-q:v', '3', '-y', str(output.with_suffix('.jpg'))])
    print(f'{group}: 1920x1080, 12 tiles, {output.stat().st_size / 1e6:.2f} MB', flush=True)
