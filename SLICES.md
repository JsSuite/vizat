# Vizat — Vertical Slices

| Slice | Status |
|-------|--------|
| TypeScript rewrite (`src/`) | ✅ |
| Scene-tree Canvas + Wrapper | ✅ |
| Primitives: Line, Rect, Circle, Curve, Text, Gradient, Image | ✅ |
| Vite playground (`/playground`) | ✅ |
| Vitest + happy-dom | ✅ |
| Landing + `/docs` | ✅ |
| CI + release workflows | ✅ |
| `robots.txt` + sitemap | ✅ |
| Vercel deploy | ✅ [vizat.vercel.app](https://vizat.vercel.app) |
| npm publish `vizat@2` | ✅ [2.0.0](https://www.npmjs.com/package/vizat) |

## CD

- Push → `CI` (test, lib build, demo build)
- Tag `v2.0.0` → npm publish
- Vercel root: `dist-demo` (see `vercel.json`)

## Next lap (Boy Scout)

- Monaco live editor in playground
- favicon.svg
