import { Drawable } from "./Drawable.js";
import type { ShapeOptions } from "./types.js";

export class Line extends Drawable {
  private points: [number, number][];
  constructor(config: { points?: [number, number][]; options?: ShapeOptions } = {}) {
    super();
    this.points = config.points ?? [];
    this.options = config.options ?? {};
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    this.setCtxProperties(ctx);
    this.points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(...point);
      else ctx.lineTo(...point);
    });
    ctx.stroke();
    this.resetCtxProperties(ctx);
  }
}
