import { Drawable } from "./Drawable.js";
import type { CanvasOptions, DrawableItem } from "./types.js";

function parseDimension(value: string | number | undefined, vwFactor: number, vhFactor: number): number {
  if (value === undefined) return 0;
  const str = String(value);
  if (str.includes("vw")) return parseInt(str, 10) * vwFactor;
  if (str.includes("vh")) return parseInt(str, 10) * vhFactor;
  return parseInt(str, 10) || 0;
}

export class Canvas extends Drawable {
  private items: DrawableItem[] = [];
  private canvas: HTMLCanvasElement;

  constructor(config: CanvasOptions = {}) {
    super();
    this.canvas = document.createElement("canvas");
    const height = config.height ?? "400px";
    const width = config.width ?? "600px";

    this.canvas.style.height = String(height);
    this.canvas.style.width = String(width);
    this.canvas.style.background = String(config.background ?? "transparent");

    this.canvas.height = parseDimension(height, 19.2, 9.69);
    this.canvas.width = parseDimension(width, 19.2, 9.69);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("[VIZAT] 2D context unavailable");
    return ctx;
  }

  add(item: DrawableItem): void {
    this.items.push(item);
  }

  clear(): void {
    this.items = [];
    const ctx = this.getContext();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  draw(): void {
    const ctx = this.getContext();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const item of this.items) {
      item.draw(ctx);
    }
  }
}
