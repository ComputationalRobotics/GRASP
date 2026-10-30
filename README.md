# GRASP project website

Project page for **GRASP: Gradient-Guided Sampling for Contact-Rich Physics-Based Motion Retargeting**.

Authors: Yang Liu*, Tong Wang*, Yiming Bao, Heng Yang.

Published at https://computationalrobotics.seas.harvard.edu/GRASP/ using GitHub Pages from the root of `main`.

## Preview

Run `python3 -m http.server 8765` here and open http://localhost:8765.

## Layout

The page opens on unobstructed video. The first downward scroll slides in the title, authors, institutional logos, and navigation while the background remains pinned. Four backgrounds rotate independently every 7 seconds:

1. Real dex — dexterous-hand demo mosaic.
2. Real humanoid — humanoid demo mosaic.
3. Sim dex — empty, reserved for future simulation video.
4. Sim humanoid — all 100 humanoid clips, shuffled into four rows of 25 that slide left to right.

Pagination buttons change the background without moving the page and restart the 7-second interval. The global pause button, reduced-motion preference, hidden tab, or offscreen hero suspend automatic rotation. The Sim dex stage retains its empty placeholder until footage is available.

Below the introduction, real-world demonstrations are separated into dexterous-hand (10 videos) and humanoid (16 videos) sections. The Sim dex section is a 4 × 4 wall of 16 selected OakInk2 bimanual trajectories; hovering it reveals “Open visualization”, and the whole wall links to `oakink2/`, which shows all 1,265 successful trajectories with motion-type filters, search, ordering, paging, and an enlarged view. The Sim humanoid section has Unitree G1, Unitree H2 and Booster T1 tabs, each showing a 4 × 4 wall of 16 selected clips; every wall links to `humanoid/`, which shows all 100 humanoid trajectories with robot and object filters.

## Videos

The original dex gallery and hero-source GRASP videos are converted to H.264 MP4 at 960 × 540, 24 fps, **2× source speed**, with audio and source metadata removed. The originals are unchanged. The playback rate is baked into the files: JavaScript should not double it again. Real hero videos are 16-second, 1920 × 1080 mosaics. Dex retains 3 rows and 4 columns, with pumpkin-lantern lifting and whiteboard erasing in the middle row. Humanoid uses 4 rows and 4 columns with all 16 current demos, each once. Its center four tiles are the new crawl clip and three new box-handling clips (new-10, new-06, new-04, new-08). `hero-layout.json` records the exact row-major arrangement; rebuild with `python3 scripts/build-hero.py /path/to/ffmpeg`. The builder reads encoded speeds from media.json: dex clips are already 2×; original-speed humanoid clips are accelerated only in the hero output. Short clips loop within the mosaics.

`media.json` lists the title, group, video, poster, and encoded speed for each clip. Entries in the `sim-dex` group fill the dexterous simulation wall in order; `sim-humanoid` entries fill the wall of the robot named by their `robot` field (`g1`, `h2` or `t1`). To give a simulation stage hero footage, replace the corresponding empty hero background in `index.html` with a video.

The OakInk2 clips are kinematic replays of the `executed_qpos` that GRASP produced for each successful task, rendered offline in MuJoCo on a white background (silver Sharpa hands, amber right-hand object, blue left-hand object, fixed camera behind the demonstrator). Clips longer than 8 s are sped up to fit, by the factor stored as `speed`. `media/oakink2/` holds 640 × 360 H.264 videos (about 100 MB in all) and posters taken at mid-clip; `oakink2/clips.json` holds the title, motion type, speed, length, and object tracking error of every clip. Rebuild both from the 960 × 540 renders with `python3 scripts/build-oakink2.py /path/to/render/out /path/to/ffmpeg`; existing posters are kept, so delete `media/oakink2/` to re-encode.

The humanoid clips are MuJoCo rollouts of GRASP tracking OMOMO human–object interactions (all three robots) and LAFAN motions (Booster T1), rendered at 960 × 540 in real time. `media/humanoid/` holds their 640 × 360 derivatives and mid-clip posters, and `humanoid/clips.json` lists robot, object, length, and mean object and root errors; rebuild with `python3 scripts/build-humanoid.py /path/to/videos_final /path/to/ffmpeg`. The Sim humanoid hero background, `media/hero-sim-humanoid-scroll.mp4`, is a 60-second, 1920 × 1080, 20 fps loop: the 100 clips, shuffled with a fixed seed into four rows of 25 (recorded in `hero-scroll-layout.json`), slide left to right at 120 px/s, each tile playing its clip from a random phase. A row travels exactly its own length per loop and every tile clip is fitted to 6 s or 10 s, so the loop has no seam. Rebuild with `python3 scripts/build-hero-scroll.py /path/to/videos_final /path/to/ffmpeg` (needs numpy). Both visualizers run the same `assets/visualizer.js` and `assets/visualizer.css`; each page names its manifest in `<body data-clips>`, and the manifest supplies the media folder, filter facets, and caption text.

Offscreen videos are paused; gallery clips are loaded near the viewport. The global pause control stops all videos. Reduced-motion preferences disable autoplay. Native controls support scrubbing and fullscreen.

## Edit

- `index.html`: title, authors, four hero backgrounds, and four demo sections.
- `styles.css`: responsive layout and dark-to-light transition.
- `app.js`: scroll stages, media loading, video controls.
- `media.json`: demo manifest, including the featured simulation clips (16 dex, 16 per humanoid). GitHub Pages caches files for 10 minutes, so after editing it bump the `media.json?v=` fetch in `app.js` and then `app.js?v=` in `index.html`; after rebuilding a visualizer, bump `clips.json?v=` in that page's `data-clips`.
- `media/`: web video and poster derivatives; `media/oakink2/` and `media/humanoid/` hold every simulation clip.
- `oakink2/`, `humanoid/`: visualizer pages and their `clips.json`; `assets/visualizer.js` and `assets/visualizer.css` are shared by both.

No private Overleaf link, inferred author affiliations, or unpublished paper link is exposed. The structural reference is InterMimicGen; the implementation and all displayed media belong to this project. Assets from the earlier figure-based draft remain available but are no longer displayed.

## Institutional identity

Harvard crimson: `#A51C30`, per the [Harvard SEAS palette](https://seas.harvard.edu/office-communications/brand-style-guide/color-palette). Light text is retained over dark video for legibility.

Institutional logo sources (the Harvard shield is extracted from the official SVG without changing its paths; the wordmark is omitted):
- Harvard University: https://www.harvard.edu/wp-content/themes/core/assets/img/theme/branding-assets/footer-logo.svg
- Computational Robotics Group: transparent Halloween variant with warm gold lettering in `assets/computational-robotics-halloween-gold.png`, edited with imagegen from the supplied artwork. The original remains unchanged as `assets/computational-robotics-halloween.png`. Transparent margins are cropped in CSS; no white backing panel is used.

## Project resources

The hero links are ordered Paper, Code, Dataset, TL;DR, then Explore the demos. Paper, Code, and Dataset are intentionally disabled without release-status labels until public release URLs are provided. The buttons use document, GitHub, Hugging Face, and X icons respectively. The Hugging Face SVG comes from https://huggingface.co/front/assets/huggingface_logo-noborder.svg. TL;DR is reserved for the Twitter/X announcement post. It is disabled without a release-status label until the post URL is available.

## Real humanoid refresh (2026-10-30)
The real humanoid section shows all ten `humanoid_new` clips plus six original demonstrations, excluding the second pushing view. The sixteen clips use a fixed shuffled order (seed 20261030), a four-column desktop grid, and a two-column mobile grid. They play at original source speed, without captions, numbering, or speed badges. `media/real-humanoid/` contains freshly encoded H.264 960 × 540 derivatives and posters; `sourceFile` in the manifest records each original file relative to the GRASP source directory. Audio is removed and original timestamps are preserved. The humanoid hero uses the same 16 clips in a separate 4 × 4 mosaic at 2× speed, with today’s crawl and box-handling footage in the center four positions.

## Quantitative results
The final `#results` section has independent accessible tabs for OakInk2 dexterous retargeting and G1 humanoid retargeting (LAFAN1, AMASS, OMOMO). Values are transcribed from Overleaf commit `cbb75e9`, `arxiv/generated/main_table.tex` and `humanoid_table.tex`. Baseline provenance and evaluation-scope notes are visible beneath each table; protocol details expand on demand. GRASP rows have a pale crimson background; numerical bolding denotes best reported values per metric (within each humanoid dataset), including ties. HOT3D and cross-embodiment results are not included. Existing demo sections are unchanged.

## Abstract and overview
The full paper abstract (Overleaf commit `cbb75e9`, `arxiv/main.tex`) follows Results near the end of the page. It is split into three paragraphs for web readability without changing its wording. The existing short method summary keeps the `#method` anchor; a method figure and overview video will be added when available.

## Section navigation
The header and body follow Overview → Real robots → Simulation → Method → Results → Abstract → Cite. Real robots (`#tasks`) groups the existing `#real-dex` and `#real-humanoid` galleries; Simulation (`#sim`) groups both existing simulation sections. Overview has an explicitly labeled video placeholder, and Method has a figure placeholder with a brief explanation below. Replace these with the finished assets when available. The original full-screen hero is preserved. The citation is a website-linked `@misc` entry with the current title, author order and year; no arXiv identifier or publication venue is assumed. The Copy BibTeX button copies the visible entry.
