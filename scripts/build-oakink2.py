"""Build the OakInk2 simulation gallery from the cluster renders.
Usage: python3 scripts/build-oakink2.py /path/to/renders /path/to/selection.json /path/to/ffmpeg
The render directory holds one folder per hand (videos/ at 960 x 720, 25 fps). selection.json lists the clips shown
on the site (`site`) and the 16 featured per hand (`walls`).
"""
import json
import math
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

root = Path(__file__).resolve().parents[1]
renders = Path(sys.argv[1])
selection = json.loads(Path(sys.argv[2]).read_text())
ffmpeg = sys.argv[3] if len(sys.argv) > 3 else 'ffmpeg'
videos, posters = root / 'media' / 'oakink2' / 'videos', root / 'media' / 'oakink2' / 'posters'
videos.mkdir(parents=True, exist_ok=True)
posters.mkdir(parents=True, exist_ok=True)
HANDS = {'sharpa': 'Sharpa', 'xhand': 'XHand', 'wuji': 'Wuji'}
MAX_SECONDS = 8

def run(args):
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)

def clip_id(clip):
    return f"{clip['hand']}_{clip['task']}"

def speed_of(clip):
    # Clips over 8 s are sped up to fit, rounded up to the next 0.1x.
    return math.ceil(clip['seconds'] / MAX_SECONDS * 10) / 10 if clip['seconds'] > MAX_SECONDS else 1

def encode(clip):
    name, source = clip_id(clip), renders / clip['hand'] / 'videos' / f"{clip['task']}.mp4"
    if (posters / f'{name}.jpg').exists():
        return
    # 640 x 480 keeps the renders' 4:3 framing and stays sharp on the 4 x 4 wall and in the gallery grid.
    run(['-i', str(source), '-vf', f'setpts=PTS/{speed_of(clip)},fps=25,scale=640:480:flags=lanczos', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '1', str(videos / f'{name}.mp4')])
    run(['-ss', f"{clip['seconds'] / 2:.2f}", '-i', str(source), '-frames:v', '1', '-vf', 'scale=640:480:flags=lanczos', '-q:v', '4', str(posters / f'{name}.jpg')])

clips = selection['site']
keep = {clip_id(clip) for clip in clips}
for folder in (videos, posters):
    for stale in folder.iterdir():
        if stale.stem not in keep:
            stale.unlink()
with ThreadPoolExecutor(32) as pool:
    list(pool.map(encode, clips))

# Manifest read by assets/visualizer.js: media folder, filter facets, and display-ready text per clip.
gallery = []
for clip in sorted(clips, key=clip_id):
    title = re.sub(r'^(oakbi_\d+_|oakextra_[0-9a-f]{5}_\d+_)', '', clip['task']).replace('_', ' ').replace('usb', 'USB')
    title = title[:1].upper() + title[1:]
    speed = speed_of(clip)
    cm, rad = clip['error'], clip['rad']
    gallery.append({'id': clip_id(clip), 'title': title, 'subtitle': f"{HANDS[clip['hand']]} · {clip['task']}",
                    'facets': {'hand': HANDS[clip['hand']], 'motion': title.split()[0]},
                    'speed': speed, 'seconds': round(clip['seconds'] / speed, 3), 'error': round(cm, 2),
                    'stat': f'{cm:.1f} cm · {rad:.2f} rad', 'detail': f'object error {cm:.1f} cm · {rad:.2f} rad'})
manifest = {'media': '../media/oakink2/', 'facets': [{'key': 'hand', 'title': 'Hands'}, {'key': 'motion', 'title': 'Motion types', 'top': 14}], 'clips': gallery}
(root / 'oakink2').mkdir(exist_ok=True)
(root / 'oakink2' / 'clips.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))

# The featured clips replace the sim-dex entries of media.json in place.
titles = {clip['id']: clip['title'] for clip in gallery}
featured = [{'id': clip_id(clip), 'title': titles[clip_id(clip)], 'group': 'sim-dex', 'robot': hand,
             'src': f'media/oakink2/videos/{clip_id(clip)}.mp4', 'poster': f'media/oakink2/posters/{clip_id(clip)}.jpg', 'speed': speed_of(clip)}
            for hand, wall in selection['walls'].items() for clip in wall]
media_path = root / 'media.json'
entries = json.loads(media_path.read_text())
start = next(i for i, entry in enumerate(entries) if entry['group'] == 'sim-dex')
entries = entries[:start] + featured + [entry for entry in entries[start:] if entry['group'] != 'sim-dex']
media_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n')
size = sum(f.stat().st_size for f in videos.iterdir()) / 1e6
print(f'{len(gallery)} clips, {size:.1f} MB of video', flush=True)
