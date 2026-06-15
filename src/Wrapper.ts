import { Canvas } from "./Canvas.js";
import { Drawable } from "./Drawable.js";
import type { CanvasOptions } from "./types.js";

export class Wrapper extends Drawable {
  private items: Canvas[] = [];
  private wrapper: HTMLElement | null;

  constructor(id: string, config: CanvasOptions = {}) {
    super();
    this.wrapper = document.getElementById(id);
    if (!this.wrapper) {
      console.warn(`[VIZAT] No DOM element with id "${id}"`);
      return;
    }
    this.wrapper.style.height = String(config.height ?? "400px");
    this.wrapper.style.width = String(config.width ?? "600px");
    this.wrapper.style.background = String(config.background ?? "transparent");
  }

  add(canvas: Canvas): void {
    if (!this.wrapper || this.wrapper.hasChildNodes()) return;
    this.wrapper.appendChild(canvas.getCanvas());
    this.items.push(canvas);
  }

  redraw(): void {
    for (const canvas of this.items) canvas.draw();
  }
}
