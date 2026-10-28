"""Build the OakInk2 simulation gallery from the cluster renders.
Usage: python3 scripts/build-oakink2.py /path/to/render/out /path/to/ffmpeg
The render directory holds manifest.json, videos/ (960 x 540) and posters/.
"""
import json
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

root = Path(__file__).resolve().parents[1]
renders = Path(sys.argv[1])
ffmpeg = sys.argv[2] if len(sys.argv) > 2 else 'ffmpeg'
videos, posters = root / 'media' / 'oakink2' / 'videos', root / 'media' / 'oakink2' / 'posters'
videos.mkdir(parents=True, exist_ok=True)
posters.mkdir(parents=True, exist_ok=True)

def run(args):
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)

def encode(clip):
    if (posters / f"{clip['id']}.jpg").exists():
        return
    # 640 x 360 keeps the 4 x 4 wall and the gallery grid sharp at about 80 kB per clip.
    run(['-i', str(renders / clip['src']), '-vf', 'scale=640:360:flags=lanczos', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '1', str(videos / f"{clip['id']}.mp4")])
    run(['-i', str(renders / clip['poster']), '-vf', 'scale=640:360:flags=lanczos', '-q:v', '4', str(posters / f"{clip['id']}.jpg")])

clips = json.loads((renders / 'manifest.json').read_text())
with ThreadPoolExecutor(32) as pool:
    list(pool.map(encode, clips))

# Manifest read by assets/visualizer.js: media folder, filter facets, and display-ready text per clip.
gallery = []
for clip in clips:
    title = re.sub(r'^(oakbi_\d+_|oakextra_[0-9a-f]{5}_\d+_)', '', clip['id']).replace('_', ' ').replace('usb', 'USB')
    title = title[:1].upper() + title[1:]
    cm, rad = clip['metrics']['obj_pos_err'] * 100, clip['metrics']['obj_quat_err']
    gallery.append({'id': clip['id'], 'title': title, 'facets': {'motion': title.split()[0]},
                    'speed': clip['speed'], 'seconds': clip['video_s'], 'error': round(cm, 2),
                    'stat': f'{cm:.1f} cm · {rad:.2f} rad', 'detail': f'object error {cm:.1f} cm · {rad:.2f} rad'})
manifest = {'media': '../media/oakink2/', 'facets': [{'key': 'motion', 'title': 'Motion types', 'top': 14}], 'clips': gallery}
(root / 'oakink2').mkdir(exist_ok=True)
(root / 'oakink2' / 'clips.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))
size = sum(f.stat().st_size for f in videos.iterdir()) / 1e6
print(f'{len(gallery)} clips, {size:.1f} MB of video', flush=True)
