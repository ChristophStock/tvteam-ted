# Result Page Videos

Add the final MP4 clips (approx. 45 seconds each) required by `RESULT_VIDEOS` in `src/videoManifest.js` to this folder. Example filenames:

- `intro.mp4`
- `performance.mp4`
- `reveal.mp4`

Keep the names and relative paths in sync with the manifest so the preloading logic on the result page can fetch and cache them ahead of time.
