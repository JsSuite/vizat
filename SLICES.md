# Vizat — Vertical Slices

| Slice | Status |
|-------|--------|
| TypeScript scene graph (`Stage`, `Layer`, `Group`, `Node`) | ✅ v3 |
| Primitives: Rect, Circle, Ellipse, Line, Arrow, Curve, Text, Star, Image | ✅ |
| Hit testing, pointer events, drag | ✅ |
| Wheel zoom, pan, `zoomAt` / `resetView` | ✅ |
| Transformer (scale, rotate, shift/alt) | ✅ |
| Connectors that follow nodes | ✅ |
| Serialize `toObject` / `createNode` | ✅ |
| Studio playground (tools, marquee, undo, export) | ✅ |
| Landing with a live stage | ✅ |
| Vitest (matrix, hit, drag, zoom, transform, connector) | ✅ |
| CI + release workflows | ✅ |
| `robots.txt` + sitemap + favicon | ✅ |
| Vercel deploy | ✅ [vizat.vercel.app](https://vizat.vercel.app) |
| npm publish `vizat@3` | tag `v3.0.0` → release workflow |

## CD

- Push → `CI` (test, lib build, demo build)
- Tag `v3.0.0` → npm publish
- Vercel root: `dist-demo` (see `vercel.json`)

## Next lap

- Resize that bakes scale back into width/height
- Snap-to-object while dragging
- Touch pinch zoom
