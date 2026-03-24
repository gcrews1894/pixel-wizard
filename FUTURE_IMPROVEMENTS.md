# Future Improvements

Ideas worth building eventually — not on the immediate roadmap but good enough to keep track of.

---

## 1. Public Share Links (Read-Only Project Access)

Generate a shareable URL that lets anyone view a project without an account. The project would render in a lightweight read-only mode — no toolbar, no editing — just the pixel art displayed at a nice scale.

**Rough approach:**
- Add a `public` boolean and `share_token` (random UUID) column to the `projects` table
- A "Share" button in the editor copies a link like `/share/<token>` to clipboard
- A new `/share/:token` route fetches the project by token (no auth required, public RLS policy for that column) and renders it
- Could also embed an export/download button on the share page so viewers can grab a PNG

**Why it matters:** Viral growth — users share their work and drive new signups.

---

## 2. Reference Image Overlay for Tracing

Let users upload a reference pixel art image (PNG/GIF/etc.) that displays as a semi-transparent overlay on the canvas so they can trace over it cell by cell.

**Key UX considerations:**
- Upload a reference image via a file picker in a new "Reference" panel
- Snap the image to the canvas grid — scale and align it so the image pixels map 1:1 to grid cells, making tracing intuitive
- Offer nudge controls (arrow buttons or drag) to fine-tune alignment after snapping
- Opacity slider to control how visible the reference is while drawing (e.g. 20–80%)
- Toggle the overlay on/off quickly with a keyboard shortcut (e.g. `T` for trace)
- The reference image is local only — never uploaded to the server, just held in memory

## 3. Symmetry Drawing

Mirror brush strokes across one or more axes while drawing, so every mark is reflected simultaneously. Extremely common for pixel art characters and objects with natural symmetry (faces, bodies, icons).

**Key UX considerations:**
- Toggle buttons in the toolbar or header: horizontal mirror, vertical mirror, or both
- The mirrored stroke renders in real-time as a preview before committing
- Works with all draw-type tools (draw, erase, line) — not applicable to fill/pick

**Rough approach:**
- Add `symmetryX: boolean` and `symmetryY: boolean` flags to `canvasStore`
- In `applyToolAt`, after writing the primary pixel, compute the mirrored coordinates and write those too: `mirrorX = gridW - 1 - x`, `mirrorY = gridH - 1 - y`
- For shape tools, mirror the entire preview cell list before rendering

---

## 4. Animation Frames

A multi-frame timeline that turns a single canvas into a sprite sheet or looping animation. Users can add/reorder/delete frames, preview playback at adjustable FPS, and export as an animated GIF or sprite sheet PNG.

**Key UX considerations:**
- Frame strip at the bottom of the editor showing thumbnail previews of each frame
- Add frame (duplicate current or blank), delete frame, drag to reorder
- Playback controls: play/pause loop, FPS slider (1–30)
- Onion skinning: ghost of the previous frame at reduced opacity as a drawing guide
- Export options: animated GIF, or a flat sprite sheet (all frames tiled horizontally)

**Rough approach:**
- Replace `pixels: Pixels` in the project with `frames: Pixels[]` (array of pixel grids)
- Add `activeFrame: number` index to `canvasStore`; all draw operations target `frames[activeFrame]`
- Schema migration: wrap existing `pixels` column into a single-element `frames` JSONB array
- GIF export via a lightweight JS GIF encoder (e.g. `gif.js` or `gifenc`)
- Onion skinning: render previous frame's pixels at ~25% opacity on a separate canvas layer before the active pixel layer
