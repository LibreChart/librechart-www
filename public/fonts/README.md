# Fonts

Both families are self-hosted. LibreChart's product runs on offline clinic
networks, and the marketing site holds the same line: no Google Fonts, no CDN,
no third-party origin in the critical path.

| File | Family | Weight | Source |
|---|---|---|---|
| `public-sans-latin-400-normal.woff2` | Public Sans | 400 | Copied from the Drupal theme |
| `public-sans-latin-400-italic.woff2` | Public Sans | 400 italic | Fontsource `@fontsource/public-sans@5.3.0` |
| `public-sans-latin-500-normal.woff2` | Public Sans | 500 | Copied from the Drupal theme |
| `public-sans-latin-600-normal.woff2` | Public Sans | 600 | Copied from the Drupal theme |
| `public-sans-latin-700-normal.woff2` | Public Sans | 700 | Copied from the Drupal theme |
| `source-serif-4-latin-opsz-normal.woff2` | Source Serif 4 | variable, opsz 8–60 + wght 200–900 | Fontsource `@fontsource-variable/source-serif-4@5.3.0` |

## Licences

Both are under the **SIL Open Font License 1.1**; the full text is in `OFL.txt`.

- **Public Sans** — a U.S. Government (USWDS) typeface, public domain / OFL 1.1.
  Upstream: <https://github.com/uswds/public-sans>
- **Source Serif 4** — Copyright Adobe, OFL 1.1.
  Upstream: <https://github.com/adobe-fonts/source-serif>

`OFL.txt` ships with the Fontsource package and names Google Inc. as packager;
the licence terms are the same OFL 1.1 that governs both families above.

## Why the two-axis `opsz` file and not weight-only

The weight-only file is 50 KB against 122 KB, and the obvious call is to take it.
Measurement said otherwise. Source Serif 4's optical-size axis materially changes
metrics: with `opsz` pinned, headings render about 11% wider, which costs the h1
and two h2s an extra line at 480px and thickens every display glyph. The homepage
design was authored against the optical-size version, so the site ships it.

The extra 72 KB is one immutably-cached file carrying all display typography.
