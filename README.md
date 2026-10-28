# GRASP project website

Project page for **GRASP: Recovering Gradients for Contact-Rich Trajectory Optimization**.

Authors: Yang Liu*, Tong Wang*, Yiming Bao, Heng Yang.

Published at https://computationalrobotics.seas.harvard.edu/GRASP/ using GitHub Pages from the root of `main`.

## Preview

Run `python3 -m http.server 8765` here and open http://localhost:8765.

## Layout

The page opens on unobstructed video. The first downward scroll slides in the title, authors, institutional logos, and navigation while the background remains pinned. Four backgrounds rotate independently every 7 seconds:

1. Real dex — dexterous-hand demo mosaic.
2. Real humanoid — humanoid demo mosaic.
3. Sim dex — empty, reserved for future simulation video.
4. Sim humanoid — empty, reserved for future simulation video.

Pagination buttons change the background without moving the page and restart the 7-second interval. The global pause button, reduced-motion preference, hidden tab, or offscreen hero suspend automatic rotation. The two simulation stages retain their empty placeholders until footage is available.

Below the introduction, real-world demonstrations are separated into dexterous-hand (10 videos) and humanoid (7 videos) sections. The Sim dex section is a 4 × 4 wall of 16 selected OakInk2 bimanual trajectories; hovering it reveals “Open visualization”, and the whole wall links to `oakink2/`, which shows all 1,265 successful trajectories with motion-type filters, search, ordering, paging, and an enlarged view. The Sim humanoid gallery and both simulation hero backgrounds remain empty.

## Videos

The supplied GRASP videos are converted to H.264 MP4 at 960 × 540, 24 fps, **2× source speed**, with audio and source metadata removed. The originals are unchanged. The playback rate is baked into the files: JavaScript should not double it again. Hero videos are 16-second, 1920 × 1080 mosaics with 3 rows and 4 columns. The middle row’s two central tiles feature pumpkin-lantern lifting and whiteboard erasing for dex, and box lifting and pushing for humanoid. Existing clips fill the remaining 2 dex / 5 humanoid slots as temporary repeats. `hero-layout.json` records the exact row-major arrangement; rebuild with `python3 scripts/build-hero.py /path/to/ffmpeg`. The existing 2× clips are used without further acceleration. Short clips loop within the mosaics.

`media.json` lists the title, group, video, poster, and encoded speed for each clip. Entries in the `sim-dex` group fill the simulation wall in order; to add humanoid simulation demos, extend the gallery containers and manifest group handling in `app.js`, and replace the corresponding empty hero background in `index.html` with a video.

The OakInk2 clips are kinematic replays of the `executed_qpos` that GRASP produced for each successful task, rendered offline in MuJoCo on a white background (silver Sharpa hands, amber right-hand object, blue left-hand object, fixed camera behind the demonstrator). Clips longer than 8 s are sped up to fit, by the factor stored as `speed`. `media/oakink2/` holds 640 × 360 H.264 videos (about 100 MB in all) and posters taken at mid-clip; `oakink2/clips.json` holds the title, motion type, speed, length, and object tracking error of every clip. Rebuild both from the 960 × 540 renders with `python3 scripts/build-oakink2.py /path/to/render/out /path/to/ffmpeg`; existing posters are kept, so delete `media/oakink2/` to re-encode.

Offscreen videos are paused; gallery clips are loaded near the viewport. The global pause control stops all videos. Reduced-motion preferences disable autoplay. Native controls support scrubbing and fullscreen.

## Edit

- `index.html`: title, authors, four hero backgrounds, and four demo sections.
- `styles.css`: responsive layout and dark-to-light transition.
- `app.js`: scroll stages, media loading, video controls.
- `media.json`: demo manifest, including the 16 featured simulation clips. GitHub Pages caches files for 10 minutes, so after editing it bump the `media.json?v=` fetch in `app.js` (and `oakink2/clips.json?v=` in `oakink2/viewer.js` after a rebuild), then bump the script's `?v=` in the HTML that loads it.
- `media/`: web video and poster derivatives; `media/oakink2/` holds every OakInk2 simulation clip.
- `oakink2/`: the OakInk2 visualizer (`index.html`, `viewer.css`, `viewer.js`, `clips.json`).

No private Overleaf link, inferred author affiliations, or unpublished paper link is exposed. The structural reference is InterMimicGen; the implementation and all displayed media belong to this project. Assets from the earlier figure-based draft remain available but are no longer displayed.

## Institutional identity

Harvard crimson: `#A51C30`, per the [Harvard SEAS palette](https://seas.harvard.edu/office-communications/brand-style-guide/color-palette). Light text is retained over dark video for legibility.

Institutional logo sources (the Harvard shield is extracted from the official SVG without changing its paths; the wordmark is omitted):
- Harvard University: https://www.harvard.edu/wp-content/themes/core/assets/img/theme/branding-assets/footer-logo.svg
- Computational Robotics Group: https://computationalrobotics.seas.harvard.edu/lab_logo-horz-white-01.PNG
