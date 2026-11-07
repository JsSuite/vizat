import { lineHits, pointsBox, resolvePaint, Shape } from "./Shape.js";
import type {
  ArrowConfig,
  CircleConfig,
  CurveConfig,
  EllipseConfig,
  ImageConfig,
  LineConfig,
  RectConfig,
  StarConfig,
  TextConfig,
} from "./types.js";
import type { Box, Vec } from "./math.js";

export class Rect extends Shape {
  static override className = "Rect";

  constructor(config: RectConfig = {}) {
    super({ width: 0, height: 0, cornerRadius: 0, ...config });
  }

  width(): number;
  width(value: number): this;
  width(value?: number): number | this {
    return this.num("width", value, 0);
  }

  height(): number;
  height(value: number): this;
  height(value?: number): number | this {
    return this.num("height", value, 0);
  }

  cornerRadius(): number;
  cornerRadius(value: number): this;
  cornerRadius(value?: number): number | this {
    return this.num("cornerRadius", value, 0);
  }

  override getSelfRect(): Box {
    return { x: 0, y: 0, width: this.width(), height: this.height() };
  }

  override sceneFunc(ctx: CanvasRenderingContext2D): void {
    const w = this.width();
    const h = this.height();
    const r = Math.max(0, Math.min(this.cornerRadius(), w / 2, h / 2));
    if (r <= 0) {
      ctx.rect(0, 0, w, h);
      return;
    }
    ctx.moveTo(r, 0);
    ctx.arcTo(w, 0, w, h, r);
    ctx.arcTo(w, h, 0, h, r);
    ctx.arcTo(0, h, 0, 0, r);
    ctx.arcTo(0, 0, w, 0, r);
    ctx.closePath();
  }
}

export class Ellipse extends Shape {
  static override className = "Ellipse";

  constructor(config: EllipseConfig = {}) {
    super({ radiusX: 0, radiusY: 0, ...config });
  }

  radiusX(): number;
  radiusX(value: number): this;
  radiusX(value?: number): number | this {
    return this.num("radiusX", value, 0);
  }

  radiusY(): number;
  radiusY(value: number): this;
  radiusY(value?: number): number | this {
    return this.num("radiusY", value, 0);
  }

  override getSelfRect(): Box {
    return { x: -this.radiusX(), y: -this.radiusY(), width: this.radiusX() * 2, height: this.radiusY() * 2 };
  }

  override sceneFunc(ctx: CanvasRenderingContext2D): void {
    const rx = this.radiusX();
    const ry = this.radiusY();
    if (rx <= 0 || ry <= 0) return;
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  }

  override intersects(local: Vec): boolean {
    const pad = this.hitPad();
    const rx = this.radiusX() + pad;
    const ry = this.radiusY() + pad;
    if (rx <= 0 || ry <= 0) return false;
    const nx = local.x / rx;
    const ny = local.y / ry;
    return nx * nx + ny * ny <= 1;
  }
}

export class Circle extends Ellipse {
  static override className = "Circle";

  constructor(config: CircleConfig = {}) {
    const radius = config.radius ?? 0;
    super({ ...config, radiusX: radius, radiusY: radius });
  }

  radius(): number;
  radius(value: number): this;
  radius(value?: number): number | this {
    if (value === undefined) return this.radiusX();
    this.radiusX(value);
    this.radiusY(value);
    return this;
  }
}

export class Line extends Shape {
  static override className = "Line";

  constructor(config: LineConfig = {}) {
    super({
      stroke: "#111111",
      strokeWidth: 2,
      hitStrokeWidth: 12,
      lineCap: "round",
      lineJoin: "round",
      points: [],
      ...config,
    });
  }

  points(): number[];
  points(value: number[]): this;
  points(value?: number[]): number[] | this {
    if (value === undefined) return (this.attrs.points ?? []) as number[];
    this.attrs.points = [...value];
    this.requestDraw();
    return this;
  }

  override getSelfRect(): Box {
    return pointsBox(this.points(), this.hitPad());
  }

  override sceneFunc(ctx: CanvasRenderingContext2D): void {
    const pts = this.points();
    if (pts.length < 4) return;
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  }

  override intersects(local: Vec): boolean {
    return lineHits(local, this.points(), this.hitPad());
  }
}

export class Arrow extends Line {
  static override className = "Arrow";

  constructor(config: ArrowConfig = {}) {
    super({ pointerLength: 14, pointerWidth: 14, pointerAtBeginning: false, ...config });
  }

  pointerLength(): number;
  pointerLength(value: number): this;
  pointerLength(value?: number): number | this {
    return this.num("pointerLength", value, 14);
  }

  pointerWidth(): number;
  pointerWidth(value: number): this;
  pointerWidth(value?: number): number | this {
    return this.num("pointerWidth", value, 14);
  }

  pointerAtBeginning(): boolean;
  pointerAtBeginning(value: boolean): this;
  pointerAtBeginning(value?: boolean): boolean | this {
    return this.bool("pointerAtBeginning", value, false);
  }

  override drawShape(ctx: CanvasRenderingContext2D): void {
    const pts = this.points();
    if (pts.length < 4) return;
    const length = this.pointerLength();
    const width = this.pointerWidth();

    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length - 2; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    const x1 = pts[pts.length - 4];
    const y1 = pts[pts.length - 3];
    const x2 = pts[pts.length - 2];
    const y2 = pts[pts.length - 1];
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const shaft = Math.hypot(x2 - x1, y2 - y1);
    const trim = Math.min(length, Math.max(0, shaft - 0.5));
    ctx.lineTo(x2 - Math.cos(angle) * trim, y2 - Math.sin(angle) * trim);
    this.strokePath(ctx);

    const paint = this.stroke() || this.fill() || "#111111";
    ctx.beginPath();
    head(ctx, x2, y2, angle, length, width);
    ctx.fillStyle = resolvePaint(paint, ctx);
    ctx.fill();
    if (this.pointerAtBeginning() && pts.length >= 4) {
      const angle0 = Math.atan2(pts[1] - pts[3], pts[0] - pts[2]);
      ctx.beginPath();
      head(ctx, pts[0], pts[1], angle0, length, width);
      ctx.fill();
    }
  }
}

function head(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, length: number, width: number) {
  const hx = x - length * Math.cos(angle);
  const hy = y - length * Math.sin(angle);
  const left = angle + Math.PI / 2;
  ctx.moveTo(x, y);
  ctx.lineTo(hx + (width / 2) * Math.cos(left), hy + (width / 2) * Math.sin(left));
  ctx.lineTo(hx - (width / 2) * Math.cos(left), hy - (width / 2) * Math.sin(left));
  ctx.closePath();
}

let measureCtx: CanvasRenderingContext2D | null | undefined;

function measureContext(): CanvasRenderingContext2D | null {
  if (measureCtx !== undefined) return measureCtx;
  if (typeof document === "undefined") {
    measureCtx = null;
    return null;
  }
  measureCtx = document.createElement("canvas").getContext("2d");
  return measureCtx;
}

export class Text extends Shape {
  static override className = "Text";

  constructor(config: TextConfig = {}) {
    super({
      text: "",
      fontSize: 16,
      fontFamily: "Inter, sans-serif",
      fontStyle: "normal",
      align: "left",
      width: 0,
      lineHeight: 1.25,
      fill: "#111111",
      ...config,
    });
  }

  text(): string;
  text(value: string): this;
  text(value?: string): string | this {
    return this.str("text", value, "");
  }

  fontSize(): number;
  fontSize(value: number): this;
  fontSize(value?: number): number | this {
    return this.num("fontSize", value, 16);
  }

  fontFamily(): string;
  fontFamily(value: string): this;
  fontFamily(value?: string): string | this {
    return this.str("fontFamily", value, "sans-serif");
  }

  fontStyle(): string;
  fontStyle(value: string): this;
  fontStyle(value?: string): string | this {
    return this.str("fontStyle", value, "normal");
  }

  align(): CanvasTextAlign;
  align(value: CanvasTextAlign): this;
  align(value?: CanvasTextAlign): CanvasTextAlign | this {
    if (value === undefined) return (this.attrs.align ?? "left") as CanvasTextAlign;
    this.attrs.align = value;
    this.requestDraw();
    return this;
  }

  width(): number;
  width(value: number): this;
  width(value?: number): number | this {
    return this.num("width", value, 0);
  }

  lineHeight(): number;
  lineHeight(value: number): this;
  lineHeight(value?: number): number | this {
    return this.num("lineHeight", value, 1.25);
  }

  font(): string {
    return `${this.fontStyle()} ${this.fontSize()}px ${this.fontFamily()}`;
  }

  lines(): string[] {
    const ctx = measureContext();
    const text = this.text() || "";
    const max = this.width();
    if (ctx) ctx.font = this.font();
    const lines: string[] = [];
    for (const para of text.split("\n")) {
      if (!max || !ctx) {
        lines.push(para);
        continue;
      }
      const words = para.split(" ");
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > max && line) {
          lines.push(line);
          line = word;
        } else line = test;
      }
      lines.push(line);
    }
    return lines.length ? lines : [""];
  }

  override getSelfRect(): Box {
    const ctx = measureContext();
    if (ctx) ctx.font = this.font();
    const lines = this.lines();
    const measured = Math.max(
      1,
      ...lines.map((line) => (ctx ? ctx.measureText(line).width : line.length * this.fontSize() * 0.5)),
    );
    const width = this.width() || measured;
    const height = Math.max(this.fontSize(), lines.length * this.fontSize() * this.lineHeight());
    return { x: 0, y: 0, width, height };
  }

  override drawShape(ctx: CanvasRenderingContext2D): void {
    const lines = this.lines();
    const size = this.fontSize();
    const gap = size * this.lineHeight();
    const box = this.width();
    ctx.font = this.font();
    ctx.textBaseline = "top";
    ctx.textAlign = box ? this.align() : "left";
    const fill = this.fill();
    if (fill) ctx.fillStyle = resolvePaint(fill, ctx);
    const alignX = !box || this.align() === "left" ? 0 : this.align() === "center" ? box / 2 : box;
    lines.forEach((line, index) => {
      const y = index * gap;
      if (fill) ctx.fillText(line, alignX, y);
      if (this.stroke() && this.strokeWidth() > 0) {
        ctx.lineWidth = this.strokeWidth();
        ctx.strokeStyle = resolvePaint(this.stroke(), ctx);
        ctx.strokeText(line, alignX, y);
      }
    });
  }
}

export class ImageShape extends Shape {
  static override className = "Image";

  constructor(config: ImageConfig = {}) {
    super({ width: 0, height: 0, ...config });
  }

  image(): CanvasImageSource | undefined;
  image(value: CanvasImageSource): this;
  image(value?: CanvasImageSource): CanvasImageSource | undefined | this {
    if (value === undefined) return this.attrs.image as CanvasImageSource | undefined;
    this.attrs.image = value;
    this.requestDraw();
    return this;
  }

  width(): number;
  width(value: number): this;
  width(value?: number): number | this {
    return this.num("width", value, 0);
  }

  height(): number;
  height(value: number): this;
  height(value?: number): number | this {
    return this.num("height", value, 0);
  }

  override getSelfRect(): Box {
    return { x: 0, y: 0, width: this.width(), height: this.height() };
  }

  override drawShape(ctx: CanvasRenderingContext2D): void {
    const image = this.image();
    if (!image || this.width() <= 0 || this.height() <= 0) return;
    this.applyShadow(ctx);
    ctx.drawImage(image, 0, 0, this.width(), this.height());
  }
}

export class Star extends Shape {
  static override className = "Star";

  constructor(config: StarConfig = {}) {
    super({ numPoints: 5, innerRadius: 20, outerRadius: 40, ...config });
  }

  numPoints(): number;
  numPoints(value: number): this;
  numPoints(value?: number): number | this {
    return this.num("numPoints", value, 5);
  }

  innerRadius(): number;
  innerRadius(value: number): this;
  innerRadius(value?: number): number | this {
    return this.num("innerRadius", value, 20);
  }

  outerRadius(): number;
  outerRadius(value: number): this;
  outerRadius(value?: number): number | this {
    return this.num("outerRadius", value, 40);
  }

  override getSelfRect(): Box {
    const r = this.outerRadius();
    return { x: -r, y: -r, width: r * 2, height: r * 2 };
  }

  override sceneFunc(ctx: CanvasRenderingContext2D): void {
    const spikes = Math.max(3, this.numPoints());
    const inner = this.innerRadius();
    const outer = this.outerRadius();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / spikes;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
}

export class Curve extends Shape {
  static override className = "Curve";

  constructor(config: CurveConfig = {}) {
    super({
      stroke: "#111111",
      strokeWidth: 2,
      hitStrokeWidth: 12,
      points: [],
      curve: "quadratic",
      ...config,
    });
  }

  points(): number[];
  points(value: number[]): this;
  points(value?: number[]): number[] | this {
    if (value === undefined) return (this.attrs.points ?? []) as number[];
    this.attrs.points = [...value];
    this.requestDraw();
    return this;
  }

  curve(): "quadratic" | "bezier";
  curve(value: "quadratic" | "bezier"): this;
  curve(value?: "quadratic" | "bezier"): "quadratic" | "bezier" | this {
    if (value === undefined) return this.attrs.curve === "bezier" ? "bezier" : "quadratic";
    this.attrs.curve = value;
    this.requestDraw();
    return this;
  }

  samples(): number[] {
    const pts = this.points();
    const out: number[] = [];
    const steps = 24;
    if (this.curve() === "bezier" && pts.length >= 8) {
      const [x0, y0, cx1, cy1, cx2, cy2, x1, y1] = pts;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        out.push(
          mt ** 3 * x0 + 3 * mt ** 2 * t * cx1 + 3 * mt * t ** 2 * cx2 + t ** 3 * x1,
          mt ** 3 * y0 + 3 * mt ** 2 * t * cy1 + 3 * mt * t ** 2 * cy2 + t ** 3 * y1,
        );
      }
      return out;
    }
    if (pts.length >= 6) {
      const [x0, y0, cx, cy, x1, y1] = pts;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        out.push(mt * mt * x0 + 2 * mt * t * cx + t * t * x1, mt * mt * y0 + 2 * mt * t * cy + t * t * y1);
      }
    }
    return out;
  }

  override getSelfRect(): Box {
    return pointsBox(this.samples(), this.hitPad());
  }

  override sceneFunc(ctx: CanvasRenderingContext2D): void {
    const pts = this.points();
    if (this.curve() === "bezier" && pts.length >= 8) {
      ctx.moveTo(pts[0], pts[1]);
      ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
      return;
    }
    if (pts.length >= 6) {
      ctx.moveTo(pts[0], pts[1]);
      ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
    }
  }

  override intersects(local: Vec): boolean {
    return lineHits(local, this.samples(), this.hitPad());
  }
}
