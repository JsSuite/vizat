import { Gradient } from "./Gradient.js";
import { distToSegment, type Box, type Vec } from "./math.js";
import { Node } from "./Node.js";
import type { Paint, ShapeConfig } from "./types.js";

export class Shape extends Node {
  static override className = "Shape";

  constructor(config: ShapeConfig = {}) {
    super({
      fill: "",
      stroke: "",
      strokeWidth: 1,
      lineCap: "butt",
      lineJoin: "miter",
      dash: [],
      shadowColor: "",
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      hitStrokeWidth: 0,
      ...config,
    });
  }

  fill(): Paint;
  fill(value: Paint): this;
  fill(value?: Paint): Paint | this {
    if (value === undefined) return (this.attrs.fill ?? "") as Paint;
    this.attrs.fill = value;
    this.requestDraw();
    return this;
  }

  stroke(): Paint;
  stroke(value: Paint): this;
  stroke(value?: Paint): Paint | this {
    if (value === undefined) return (this.attrs.stroke ?? "") as Paint;
    this.attrs.stroke = value;
    this.requestDraw();
    return this;
  }

  strokeWidth(): number;
  strokeWidth(value: number): this;
  strokeWidth(value?: number): number | this {
    return this.num("strokeWidth", value, 1);
  }

  lineCap(): CanvasLineCap;
  lineCap(value: CanvasLineCap): this;
  lineCap(value?: CanvasLineCap): CanvasLineCap | this {
    if (value === undefined) return (this.attrs.lineCap ?? "butt") as CanvasLineCap;
    this.attrs.lineCap = value;
    this.requestDraw();
    return this;
  }

  lineJoin(): CanvasLineJoin;
  lineJoin(value: CanvasLineJoin): this;
  lineJoin(value?: CanvasLineJoin): CanvasLineJoin | this {
    if (value === undefined) return (this.attrs.lineJoin ?? "miter") as CanvasLineJoin;
    this.attrs.lineJoin = value;
    this.requestDraw();
    return this;
  }

  dash(): number[];
  dash(value: number[]): this;
  dash(value?: number[]): number[] | this {
    if (value === undefined) return (this.attrs.dash ?? []) as number[];
    this.attrs.dash = [...value];
    this.requestDraw();
    return this;
  }

  shadowColor(): string;
  shadowColor(value: string): this;
  shadowColor(value?: string): string | this {
    return this.str("shadowColor", value, "");
  }

  shadowBlur(): number;
  shadowBlur(value: number): this;
  shadowBlur(value?: number): number | this {
    return this.num("shadowBlur", value, 0);
  }

  shadowOffsetX(): number;
  shadowOffsetX(value: number): this;
  shadowOffsetX(value?: number): number | this {
    return this.num("shadowOffsetX", value, 0);
  }

  shadowOffsetY(): number;
  shadowOffsetY(value: number): this;
  shadowOffsetY(value?: number): number | this {
    return this.num("shadowOffsetY", value, 0);
  }

  hitStrokeWidth(): number;
  hitStrokeWidth(value: number): this;
  hitStrokeWidth(value?: number): number | this {
    return this.num("hitStrokeWidth", value, 0);
  }

  drawShape(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    this.sceneFunc(ctx);
    const fill = this.fill();
    if (fill) {
      this.applyShadow(ctx);
      ctx.fillStyle = resolvePaint(fill, ctx);
      ctx.fill();
      ctx.shadowColor = "rgba(0,0,0,0)";
    }
    this.strokePath(ctx);
  }

  sceneFunc(_ctx: CanvasRenderingContext2D): void {}

  intersects(local: Vec): boolean {
    const rect = this.getSelfRect();
    const pad = this.stroke() ? Math.max(this.strokeWidth(), this.hitStrokeWidth()) / 2 : this.hitStrokeWidth() / 2;
    return (
      local.x >= rect.x - pad &&
      local.y >= rect.y - pad &&
      local.x <= rect.x + rect.width + pad &&
      local.y <= rect.y + rect.height + pad
    );
  }

  protected strokePath(ctx: CanvasRenderingContext2D): void {
    const stroke = this.stroke();
    if (!stroke || this.strokeWidth() <= 0) return;
    ctx.lineWidth = this.strokeWidth();
    ctx.lineCap = this.lineCap();
    ctx.lineJoin = this.lineJoin();
    ctx.strokeStyle = resolvePaint(stroke, ctx);
    const dash = this.dash();
    if (dash.length) ctx.setLineDash(dash);
    ctx.stroke();
    if (dash.length) ctx.setLineDash([]);
  }

  protected applyShadow(ctx: CanvasRenderingContext2D): void {
    const color = this.shadowColor();
    if (!color) return;
    ctx.shadowColor = color;
    ctx.shadowBlur = this.shadowBlur();
    ctx.shadowOffsetX = this.shadowOffsetX();
    ctx.shadowOffsetY = this.shadowOffsetY();
  }

  protected hitPad(): number {
    return Math.max(this.strokeWidth(), this.hitStrokeWidth() || 0) / 2;
  }
}

export function resolvePaint(paint: Paint, ctx: CanvasRenderingContext2D): string | CanvasGradient {
  if (paint instanceof Gradient) return paint.getGradient(ctx);
  return String(paint);
}

export function lineHits(local: Vec, points: number[], pad: number): boolean {
  for (let i = 0; i < points.length - 2; i += 2) {
    if (distToSegment(local.x, local.y, points[i], points[i + 1], points[i + 2], points[i + 3]) <= pad) {
      return true;
    }
  }
  return false;
}

export function pointsBox(points: number[], pad = 0): Box {
  if (points.length < 2) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    minX = Math.min(minX, points[i]);
    maxX = Math.max(maxX, points[i]);
    minY = Math.min(minY, points[i + 1]);
    maxY = Math.max(maxY, points[i + 1]);
  }
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}
