# @jssuite/vizat

**Vizat v2** — blazing-fast HTML5 Canvas 2D library with a scene-tree rendering model.

- **Site:** [vizat.vercel.app](https://vizat.vercel.app) (deploy after push)
- **Playground:** `/playground`
- **Docs:** `/docs`

## Install

```sh
npm i @jssuite/vizat
```

## Quick start

```js
import { Wrapper, Canvas, Rect } from "@jssuite/vizat";

const wrapper = new Wrapper("container", { height: "400px", width: "100%" });
const canvas = new Canvas({ height: "400px", width: "800px", background: "#1a1a2e" });
wrapper.add(canvas);

canvas.add(new Rect({ x: 40, y: 40, width: 120, height: 80, options: { fillStyle: "blueviolet" } }));
canvas.draw();
```

## Develop

```sh
npm install
npm run dev          # playground at localhost:5173/playground.html
npm test
npm run build        # npm lib → dist/
npm run build:demo   # static site → dist-demo/
```

MIT · [@JsSuite](https://github.com/JsSuite)
