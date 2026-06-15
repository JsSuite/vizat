import { Drawable } from "./Drawable.js";
import type { ShapeOptions } from "./types.js";

export class Text extends Drawable {
  constructor(
    private config: { text?: string; x?: number; y?: number; options?: ShapeOptions } = {}
  ) {
    super();
    this.options = config.options ?? {};
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { text = "", x = 0, y = 0 } = this.config;
    this.setCtxProperties(ctx);
    if (this.options.strokeStyle) ctx.strokeText(text, x, y);
    if (this.options.fillStyle) ctx.fillText(text, x, y);
    this.resetCtxProperties(ctx);
  }
}
