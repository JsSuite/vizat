import { Drawable } from "./Drawable.js";
import type { ShapeOptions } from "./types.js";

export class Curve extends Drawable {
  private points: number[][];
  private type: "quadratic" | "bezier";

  constructor(
    config: {
      points?: number[][];
      type?: "quadratic" | "bezier";
      options?: ShapeOptions;
    } = {}
  ) {
    super();
    this.points = config.points ?? [];
    this.type = config.type ?? "quadratic";
    this.options = config.options ?? {};
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    this.setCtxProperties(ctx);

    this.points.forEach((point, index) => {
      if (this.type === "quadratic") {
        if (index === 0) ctx.moveTo(point[0], point[1]);
        ctx.quadraticCurveTo(point[2], point[3], point[4], point[5]);
      } else {
        ctx.bezierCurveTo(point[0], point[1], point[2], point[3], point[4], point[5]);
      }
    });

    ctx.stroke();
    this.resetCtxProperties(ctx);
  }
}
