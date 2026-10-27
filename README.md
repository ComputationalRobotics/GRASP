# GRASP project website

Static research page for **GRASP: Recovering Gradients for Contact-Rich Trajectory Optimization**.

Authors: Yang Liu*, Tong Wang*, Yiming Bao, Heng Yang.

## Preview

Run `python3 -m http.server 8765` in this directory, then visit `http://localhost:8765`.

## GitHub Pages

Publish the root of the `main` branch with GitHub Pages in `ComputationalRobotics/GRASP`. All local links use relative paths and support a project subdirectory. The organization site's custom domain can be inherited; no project CNAME is needed.

## Edit

- `index.html`: narrative, author list, and initial results table.
- `styles.css`: responsive layout and colors.
- `app.js`: motion keyframes and results subset controls.
- `assets/`: original paper figures and extracted keyframes.

Content and measurements are transcribed from the supplied manuscript. No additional experiments were run for this webpage. The motion viewer shows four sampled simulation keyframes per task, not video. The 500-task collection is reported for GRASP only; baseline comparisons use the shared 100-task subset or its 61 longer tasks.

The optimization figure is preserved from the manuscript. Its `exact-grad` label on the pusher-slider comparator refers to differentiation through a contact relaxation, as clarified in the page caption and manuscript.

Add a public paper URL, code release link, and videos when available. The page currently has no paper/code release buttons, private Overleaf links, inferred author affiliations, analytics, or backend dependencies. Google Fonts is optional; system font fallbacks are specified.

The layout was written for this project, with the supplied InterMimicGen page used as a structural reference. No source code or media from that project is included.
