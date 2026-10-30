"""Rebuild four-column backgrounds at 2x original speed.
Usage: python3 scripts/build-hero.py /path/to/ffmpeg [dex|humanoid]
"""
import json
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ffmpeg = sys.argv[1] if len(sys.argv) > 1 else 'ffmpeg'
layouts = json.loads((root / 'hero-layout.json').read_text())
speeds = {clip['src']: clip['speed'] for clip in json.loads((root / 'media.json').read_text())}

def run(args):
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', *args], check=True)

for group, rows in layouts.items():
    if len(sys.argv) > 2 and group not in sys.argv[2:]:
        continue
    assert len(rows) in (3, 4) and all(len(row) == 4 for row in rows)
    tile_height = 1080 // len(rows)
    clips = [clip for row in rows for clip in row]
    inputs = []
    for clip in clips:
        inputs += ['-stream_loop', '-1', '-i', str(root / 'media' / f'{clip}.mp4')]
    # Four-row mosaics retain each source's 16:9 framing. Three-row mosaics crop to 4:3.
    filters = []
    for i, clip in enumerate(clips):
        speedup = 2 / speeds.get(f'media/{clip}.mp4', 2)
        filters.append(f'[{i}:v]setpts=(PTS-STARTPTS)/{speedup},fps=20,scale=480:{tile_height}:force_original_aspect_ratio=increase,crop=480:{tile_height},setsar=1[v{i}]')
    count = len(clips)
    positions = '|'.join(f'{i % 4 * 480}_{i // 4 * tile_height}' for i in range(count))
    filters += [''.join(f'[v{i}]' for i in range(count)) + f'xstack=inputs={count}:layout={positions}[out]']
    output = root / 'media' / f'hero-{group}-grid{count}.mp4'
    run([*inputs, '-filter_complex_threads', '2', '-filter_complex', ';'.join(filters), '-map', '[out]', '-t', '16', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '2', '-y', str(output)])
    run(['-ss', '1', '-i', str(output), '-frames:v', '1', '-q:v', '3', '-y', str(output.with_suffix('.jpg'))])
    print(f'{group}: 1920x1080, {count} tiles, {output.stat().st_size / 1e6:.2f} MB', flush=True)
