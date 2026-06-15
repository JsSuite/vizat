import { Drawable } from "./Drawable.js";
import type { ShapeOptions } from "./types.js";

export class ImageShape extends Drawable {
  constructor(
    private config: {
      dx?: number;
      dy?: number;
      dWidth?: number;
      dHeight?: number;
      sx?: number;
      sy?: number;
      sWidth?: number;
      sHeight?: number;
      image?: CanvasImageSource;
      options?: ShapeOptions;
    } = {}
  ) {
    super();
    this.options = config.options ?? {};
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { image, dx = 0, dy = 0, dWidth, dHeight, sx, sy, sWidth, sHeight } = this.config;
    if (!image) return;

    this.setCtxProperties(ctx);

    if (sx != null && sy != null && sWidth != null && sHeight != null && dWidth != null && dHeight != null) {
      ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    } else if (dWidth != null && dHeight != null) {
      ctx.drawImage(image, dx, dy, dWidth, dHeight);
    } else {
      ctx.drawImage(image, dx, dy);
    }

    this.resetCtxProperties(ctx);
  }
}

/** @deprecated Use ImageShape — kept as Image for API compat */
export { ImageShape as Image };
