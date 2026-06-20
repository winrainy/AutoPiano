# AGENTS.md

## Cursor Cloud specific instructions

AutoPiano is a single web application: a Vue 2 + webpack 2 online piano (Tone.js for audio). There is no backend service to run — everything is client-side served by the webpack dev server.

### Node version (important)
This is a 2019-era toolchain (webpack 2, Babel 6, vue-loader 13) that does **not** run on modern Node. The environment is pinned to **Node 10** (via nvm). Node 10 is set as the default in `~/.bashrc`, so a normal login shell already uses it. If you ever see the wrong version, the system `/exec-daemon/node` (Node 22) can shadow it on `PATH`; reactivate Node 10 with:

```
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 10
```

### Run (dev)
- Dev server: `npm run dev` (alias `npm start`) → serves at `http://localhost:5000` with hot reload. The script auto-opens a browser via `opn`; in a headless VM this open attempt fails harmlessly and the server keeps running.
- Production build: `npm run build` (outputs to `dist/`). Use dev for development.

### Lint / Test
There are no lint or test scripts defined in `package.json` (only `dev`, `start`, `build`). No test framework is configured.

### Notes / gotchas
- `npm install` reports many audit vulnerabilities and a few deprecation/`notsup` warnings (e.g. `fsevents` is macOS-only, `@noble/hashes` wants newer Node) — these are expected and do not break the Node 10 build.
- Harmless runtime console noise in the browser: a `favicon` 404 and an `AudioContext` "user gesture" warning (audio starts after the first click/keypress). Neither affects functionality.
- The piano is played by clicking on-screen keys or pressing mapped letter/number keyboard keys.
