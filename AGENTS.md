# AGENTS.md

## Cursor Cloud specific instructions

This repository is **MiniCraft**: a single browser-based voxel sandbox game (Minecraft-style) built with vanilla JS + Three.js. It is a static client-side app — there is no backend, database, or build step.

### Run (dev)
- `npm run dev` (alias `npm start`) → runs `node server.js`, a zero-dependency static file server on `http://localhost:5000`. Set `PORT` to change the port.
- Any Node.js version works (the server only uses Node's built-in `http`/`fs`). Alternatively serve the folder with anything else, e.g. `python3 -m http.server 5000`.
- The game uses ES Modules + an `importmap`, so it MUST be loaded over HTTP. Opening `index.html` via `file://` will not work.

### Dependencies
- There are **no npm dependencies**. Three.js is vendored at `js/lib/three.module.js` (r160) and imported via the `"three"` importmap entry. Do not `npm install` Three.js; edit/replace the vendored file if an upgrade is needed.

### Lint / Test / Build
- None configured. There is no build step, no linter, and no test suite. Verify changes by running the dev server and playing in the browser.

### Code layout / notes
- Game logic lives in `js/game/`: `blocks.js` (block defs + procedural texture atlas), `world.js` (voxel data, terrain gen, meshing, DDA raycast), `player.js` (physics/AABB collision), `controls.js` (pointer lock + input), `main.js` (scene + render loop + dig/place + hotbar).
- The world is one merged, face-culled mesh; it is fully rebuilt on every block edit (`world.rebuild()`), which is fine for the current `SIZE` (48²).
- Manual testing requires pointer lock: click the canvas to lock the mouse before WASD/mouse-look/dig/place will respond.
