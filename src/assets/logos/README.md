# LibreChart Logo — Usage Guide

Brand direction: **Steady Signal**. A rounded patient-chart card crossed by a continuous ECG
trace whose baseline runs steadily past both edges — a signal that keeps going, even offline.

## Files

| File | Use |
|------|-----|
| `librechart-mark.svg` | Primary mark (full color). App icons, avatars, tight spaces. |
| `librechart-lockup.svg` | Mark + wordmark. Default logo for light backgrounds. |
| `librechart-lockup-reversed.svg` | Lockup for dark backgrounds (white wordmark, white card, teal trace). |
| `librechart-mark-mono.svg` | Single-color Ink mark. Black-and-white / field printing, faxes, stamps. |
| `librechart-mark-reversed.svg` | Single-color white mark for dark or photographic backgrounds. |
| `favicon.svg` | Simplified mark (no tab, single spike) for browser tabs and tiny sizes. |
| `favicon-16.png`, `favicon-32.png` | Raster favicons. |
| `apple-touch-icon-180.png` | iOS home-screen icon. |
| `icon-512.png` | PWA / high-res app icon. |

## Colors

| Name | Hex | Role |
|------|-----|------|
| Chart Blue | `#155B8B` | Card fill, "Chart" in wordmark |
| Vital Teal | `#0E8C7F` | ECG trace |
| Ink | `#14283C` | "Libre" in wordmark, mono mark |
| White | `#FFFFFF` | Reversed marks, trace on favicon, knockouts |

## Typography

Wordmark is set in **Public Sans** with system fallbacks
(`'Public Sans','Helvetica Neue',Arial,sans-serif`): "Libre" Regular (400) in Ink,
"Chart" Bold (700) in Chart Blue.

## Clearspace

Keep clear space equal to **½ the mark's height** on all sides of the mark or lockup. Nothing —
text, imagery, or edges — should intrude into that zone.

## Minimum sizes

- **Lockup:** never below **120px wide** (print: ~32mm). Below this, use the mark alone.
- **Mark:** legible down to ~24px. At **16px** use the dedicated `favicon.svg` variant only.

## When to use which

- **Light background:** `librechart-lockup.svg` (default) or `librechart-mark.svg`.
- **Dark / colored / photo background:** `librechart-lockup-reversed.svg` or `librechart-mark-reversed.svg`.
- **One ink, B/W, fax, embossing:** `librechart-mark-mono.svg`.
- **Browser tab / app tile ≤32px:** favicon set.

## Don'ts

- **Don't recolor.** Use only the palette above; never swap card, trace, or wordmark colors.
- **Don't stretch or distort.** Scale proportionally only.
- **Don't add drop shadows, glows, gradients, or outlines.** The mark is flat by design.
- **Don't rotate** the mark or trace.
- **Don't rearrange** — keep the mark's position and size relative to the wordmark fixed.
- **Don't place the full-color mark on busy or low-contrast backgrounds** — use a reversed or mono variant.
- **Don't recreate or re-type the wordmark** in another typeface; use the supplied SVG.
