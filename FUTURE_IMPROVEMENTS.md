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

**Rough approach:**
- Store the reference image as a data URL in `canvasStore` (ephemeral, not persisted)
- Render it on a dedicated 4th canvas layer (below the pixel layer) at the computed scale/offset
- Grid-snapping logic: divide reference image dimensions by canvas grid dimensions to get a scale factor, then center-align by default
