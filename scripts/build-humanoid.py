"""Build the humanoid simulation gallery from the cluster renders.
Usage: python3 scripts/build-humanoid.py /path/to/videos_final /path/to/ffmpeg
The render directory holds index.json and one 960 x 540 mp4 per clip; ffprobe is taken from ffmpeg's folder.
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
ffprobe = str(Path(ffmpeg).with_name('ffprobe'))
videos, posters = root / 'media' / 'humanoid' / 'videos', root / 'media' / 'humanoid' / 'posters'
videos.mkdir(parents=True, exist_ok=True)
posters.mkdir(parents=True, exist_ok=True)
OBJECTS = {'clothesstand': 'Clothes stand', 'floorlamp': 'Floor lamp', 'largebox': 'Large box', 'largetable': 'Large table',
           'monitor': 'Monitor', 'plasticbox': 'Plastic box', 'smallbox': 'Small box', 'smalltable': 'Small table',
           'suitcase': 'Suitcase', 'trashcan': 'Trash can', 'whitechair': 'White chair', 'woodchair': 'Wood chair'}

def run(args):
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)

def seconds(path):
    out = subprocess.run([ffprobe, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out)

def encode(clip):
    stem, source = clip['video'][:-4], renders / clip['video']
    if (posters / f'{stem}.jpg').exists():
        return
    # Same 640 x 360 encoding as the OakInk2 gallery; the poster is the middle frame.
    run(['-i', str(source), '-vf', 'scale=640:360:flags=lanczos', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '1', str(videos / f'{stem}.mp4')])
    run(['-ss', f'{seconds(source) / 2:.2f}', '-i', str(source), '-frames:v', '1', '-vf', 'scale=640:360:flags=lanczos', '-q:v', '4', str(posters / f'{stem}.jpg')])

clips = json.loads((renders / 'index.json').read_text())
with ThreadPoolExecutor(16) as pool:
    list(pool.map(encode, clips))

# Manifest read by assets/visualizer.js: media folder, filter facets, and display-ready text per clip.
gallery = []
for clip in clips:
    root_cm, obj = clip['root_err_mean_m'] * 100, clip.get('obj_err_mean_m')
    if clip['kind'] == 'lafan':
        # dance2_subject4 -> "Dance"; fallAndGetUp3_subject1 -> "Fall and get up"
        name = re.sub(r'\d+$', '', clip['clip'].split('_subject')[0])
        title, item, subtitle = re.sub(r'(?<!^)(?=[A-Z])', ' ', name).capitalize(), 'No object (LAFAN)', f"{clip['robot']} · LAFAN {clip['clip']}"
        stat, detail = f'root {root_cm:.1f} cm', f'mean root error {root_cm:.1f} cm'
    else:
        title = item = OBJECTS[clip['object']]
        subtitle = f"{clip['robot']} · {clip['clip']}"
        stat, detail = f'obj {obj * 100:.1f} · root {root_cm:.1f} cm', f'mean object error {obj * 100:.1f} cm · mean root error {root_cm:.1f} cm'
    gallery.append({'id': clip['video'][:-4], 'title': title, 'subtitle': subtitle, 'facets': {'robot': clip['robot'], 'object': item},
                    'speed': 1, 'seconds': round(seconds(videos / clip['video']), 2), 'error': None if obj is None else round(obj * 100, 2),
                    'stat': stat, 'detail': detail})
manifest = {'media': '../media/humanoid/', 'facets': [{'key': 'robot', 'title': 'Robots'}, {'key': 'object', 'title': 'Objects'}], 'clips': gallery}
(root / 'humanoid').mkdir(exist_ok=True)
(root / 'humanoid' / 'clips.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))
size = sum(f.stat().st_size for f in videos.iterdir()) / 1e6
print(f'{len(gallery)} clips, {size:.1f} MB of video', flush=True)
