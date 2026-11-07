import { Container } from "./Container.js";
import type { NodeConfig } from "./types.js";
import { renderNode } from "./render.js";

export class Layer extends Container {
  static override className = "Layer";

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;

  constructor(config: NodeConfig = {}) {
    super(config);
    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.inset = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.pointerEvents = "none";
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("[vizat] 2D context unavailable");
    this.ctx = ctx;
  }

  canvasElement(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  syncSize(width: number, height: number, pixelRatio: number): void {
    this.dpr = pixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(height * this.dpr));
  }

  draw(): void {
    const stage = this.getStage();
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (stage) {
      const matrix = stage.getTransform();
      ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
    }
    renderNode(ctx, this);
  }

  override destroy(): void {
    this.canvas.remove();
    super.destroy();
  }
}
