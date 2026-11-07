# vizat

**Vizat 3** — a production HTML5 canvas engine. Scene graph, hit testing, drag and drop, wheel zoom, a transformer, arrows, and connectors.

- **Site:** [vizat.vercel.app](https://vizat.vercel.app)
- **Studio:** [/playground](https://vizat.vercel.app/playground)
- **Docs:** [/docs](https://vizat.vercel.app/docs)
- **npm:** [vizat](https://www.npmjs.com/package/vizat)

## Install

```sh
npm i vizat
```

## Quick start

```js
import { Stage, Layer, Rect, Transformer } from "vizat";

const stage = new Stage({
  container: "board",
  width: 800,
  height: 500,
  background: "#12110f",
});

const layer = new Layer();
stage.add(layer);

const card = new Rect({
  x: 80,
  y: 72,
  width: 180,
  height: 110,
  cornerRadius: 16,
  fill: "#243044",
  stroke: "#e8a25a",
  strokeWidth: 1.5,
  draggable: true,
});

layer.add(card, new Transformer({ nodes: [card] }));
```

Scroll to zoom. Drag the rectangle. Pull a handle to scale it, or the stem above the box to rotate.

## What you get

| Piece | Role |
| --- | --- |
| `Stage` | DOM mount, camera, pointer, wheel zoom, PNG export |
| `Layer` | Own canvas, stacked in the stage |
| `Group` | Transforms children together |
| `Rect` `Circle` `Ellipse` `Line` `Arrow` `Curve` `Text` `Star` `Image` | Drawable nodes |
| `Transformer` | Scale and rotate selection |
| `Connector` | Arrow bound to two nodes |

Accessors read and write: `rect.x()` / `rect.x(40)`. Events bubble: `click`, `dragmove`, `transform`, `wheel`.

Version 3 replaces the v2 `Wrapper` / `Canvas.draw()` list. Shapes are live nodes, not one-shot draw calls.

## Develop

```sh
npm install
npm run dev          # landing + /playground.html
npm test
npm run build        # library → dist/
npm run build:demo   # site → dist-demo/
```

MIT · [@JsSuite](https://github.com/JsSuite)
