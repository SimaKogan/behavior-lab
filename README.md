# ◉ Behavior Lab

Interactive browser lab that measures **how you move, click and type**, and shows it as live charts. Trilingual UI: עברית / Русский / English.

## Features
- Live mouse **heatmap** (canvas, additive glow)
- **Typing rhythm** histogram (intervals between keystrokes)
- Cursor speed, Backspace share, click count
- **Radar chart** of self-reported mood (joy, fear, anger, sadness, stress, tiredness, focus)
- Dark glassmorphism UI, RTL support for Hebrew

## Personal model (in-browser ML)
After each session you can save your features (cursor speed, key intervals, Backspace share, clicks/min, keys/s) together with your self-reported mood to `localStorage`. From 5 sessions on, a small **ridge regression** (implemented from scratch in `src/model.ts`, no libraries) is trained on *your own* data and predicts your mood from your behavior. Honesty built in: accuracy is measured with leave-one-out cross-validation and compared with the baseline "always guess your average", so you see whether it actually learned something.

## Privacy
- 100% client-side: no backend, no analytics, no network requests.
- Key **characters are never stored**, only timestamps and whether a key was Backspace.
- Data leaves the page only if you press **Download JSON**.
- Results are raw measurements, not an emotion prediction or diagnosis.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output in dist/
```

## Deploy to GitHub Pages
Push to `main`, then in the repo go to Settings → Pages → Source: **GitHub Actions**. The included workflow builds and publishes automatically.

## Stack
Vite + TypeScript, no runtime dependencies.

## Author
Sima Kogan, 
