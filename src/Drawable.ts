import { Gradient } from "./Gradient.js";
import type { ShapeOptions } from "./types.js";

export abstract class Drawable {
  protected options: ShapeOptions = {};
  private originalCtx: Record<string, unknown> = {};

  protected setCtxProperties(ctx: CanvasRenderingContext2D): void {
    this.originalCtx = {};
    for (const key of Object.keys(this.options) as (keyof ShapeOptions)[]) {
      const value = this.options[key];
      if (value === undefined) continue;

      if (key === "dash" && Array.isArray(value)) {
        this.originalCtx.dash = ctx.getLineDash();
        ctx.setLineDash(value);
        continue;
      }

      if ((key === "fillStyle" || key === "strokeStyle") && value instanceof Gradient) {
        this.originalCtx[key] = ctx[key];
        ctx[key] = value.getGradient(ctx);
        continue;
      }

      this.originalCtx[key] = ctx[key as keyof CanvasRenderingContext2D];
      (ctx as unknown as Record<string, unknown>)[key] = value;
    }
  }

  protected resetCtxProperties(ctx: CanvasRenderingContext2D): void {
    for (const key of Object.keys(this.options)) {
      if (key === "dash" && Array.isArray(this.originalCtx.dash)) {
        ctx.setLineDash(this.originalCtx.dash as number[]);
        continue;
      }
      if (key in this.originalCtx) {
        (ctx as unknown as Record<string, unknown>)[key] = this.originalCtx[key];
      }
    }
  }
}
