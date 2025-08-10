# Neon Password Generator UI

A sleek, futuristic front-end for generating strong passwords, featuring:

- Glassmorphism panels on a dark, neon-accented theme (blue and purple)
- Large password display with copy-to-clipboard
- Length slider (4–64)
- Toggles for uppercase letters, numbers, and symbols (lowercase always included)
- Real-time animated strength meter (red → green)
- Minimal modern typography (Inter + JetBrains Mono)

## Use

Just open `index.html` in your browser. No build or backend required.

## Notes

- Passwords are generated with secure randomness when `window.crypto.getRandomValues` is available. If not, it falls back to `Math.random()` (less secure).
- The strength meter uses a heuristic combining entropy estimate and pattern checks. It is informative, not a guarantee.

## Customize

- Tweak colors and glow in `styles.css` via CSS variables.
- Adjust character sets or logic in `app.js`.
