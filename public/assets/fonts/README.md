# Self-hosted display font

**Fredoka** (weight 600, latin subset), used for arcade headings, the play-break
title, game status text, and wallet/score numbers.

- File: `Fredoka.woff2` (latin subset, ~16 KB)
- License: SIL Open Font License 1.1 — see `OFL.txt`
- Source: https://fonts.google.com/specimen/Fredoka

Declared via `@font-face` in `public/css/arcade.css` with `font-display: swap`
and a rounded system fallback stack, so the UI degrades gracefully if the font
fails to load. No external/CDN runtime dependency.
