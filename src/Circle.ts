import { Drawable } from "./Drawable.js";
import type { ShapeOptions } from "./types.js";

export class Circle extends Drawable {
  constructor(
    private config: { x?: number; y?: number; radius?: number; options?: ShapeOptions } = {}
  ) {
    super();
    this.options = config.options ?? {};
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x = 0, y = 0, radius = 0 } = this.config;
    ctx.beginPath();
    this.setCtxProperties(ctx);
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    if (this.options.fillStyle) ctx.fill();
    if (this.options.strokeStyle) ctx.stroke();
    this.resetCtxProperties(ctx);
  }
}
