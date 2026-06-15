import { Drawable } from "./Drawable.js";
import type { ShapeOptions } from "./types.js";

export class Rect extends Drawable {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(
    config: { x?: number; y?: number; width?: number; height?: number; options?: ShapeOptions } = {}
  ) {
    super();
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.width = config.width ?? 0;
    this.height = config.height ?? 0;
    this.options = config.options ?? {};
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.setCtxProperties(ctx);
    const tx = this.x + this.width / 2;
    const ty = this.y + this.height / 2;
    const rot = this.options.rotation;

    if (rot) {
      ctx.translate(tx, ty);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.translate(-tx, -ty);
    }

    if (this.options.strokeStyle) ctx.strokeRect(this.x, this.y, this.width, this.height);
    if (this.options.fillStyle) ctx.fillRect(this.x, this.y, this.width, this.height);

    if (rot) {
      ctx.translate(tx, ty);
      ctx.rotate((-rot * Math.PI) / 180);
      ctx.translate(-tx, -ty);
    }
    this.resetCtxProperties(ctx);
  }
}
