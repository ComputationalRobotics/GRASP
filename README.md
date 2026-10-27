# GRASP project website

Project page for **GRASP: Recovering Gradients for Contact-Rich Trajectory Optimization**.

Authors: Yang Liu*, Tong Wang*, Yiming Bao, Heng Yang.

Published at https://computationalrobotics.seas.harvard.edu/GRASP/ using GitHub Pages from the root of `main`.

## Preview

Run `python3 -m http.server 8765` here and open http://localhost:8765.

## Layout

The first screen remains pinned while scrolling through four background stages:

1. Real dex — dexterous-hand demo mosaic.
2. Real humanoid — humanoid demo mosaic.
3. Sim dex — empty, reserved for future simulation video.
4. Sim humanoid — empty, reserved for future simulation video.

Below the introduction, real-world demonstrations are separated into dexterous-hand (10 videos) and humanoid (7 videos) sections. The two simulation galleries intentionally remain empty.

## Videos

The supplied GRASP videos are converted to H.264 MP4 at 960 × 540, 24 fps, **2× source speed**, with audio and source metadata removed. The originals are unchanged. The playback rate is baked into the files: JavaScript should not double it again. Hero videos are 16-second mosaics of selected real clips. Short clips loop within the mosaics.

`media.json` lists the title, group, video, poster, and encoded speed for each clip. To add simulation demos, extend the gallery containers and manifest group handling in `app.js`, and replace the corresponding empty hero background in `index.html` with a video.

Offscreen videos are paused; gallery clips are loaded near the viewport. The global pause control stops all videos. Reduced-motion preferences disable autoplay. Native controls support scrubbing and fullscreen.

## Edit

- `index.html`: title, authors, four hero backgrounds, and four demo sections.
- `styles.css`: responsive layout and dark-to-light transition.
- `app.js`: scroll stages, media loading, video controls.
- `media.json`: demo manifest.
- `media/`: web video and poster derivatives.

No private Overleaf link, inferred author affiliations, or unpublished paper link is exposed. The structural reference is InterMimicGen; the implementation and all displayed media belong to this project. Assets from the earlier figure-based draft remain available but are no longer displayed.

## Institutional identity

Harvard crimson: `#A51C30`, per the [Harvard SEAS palette](https://seas.harvard.edu/office-communications/brand-style-guide/color-palette). Light text is retained over dark video for legibility.

Unaltered institutional logo sources:
- Harvard University: https://www.harvard.edu/wp-content/themes/core/assets/img/theme/branding-assets/footer-logo.svg
- Computational Robotics Group: https://computationalrobotics.seas.harvard.edu/lab_logo-horz-white-01.PNG
