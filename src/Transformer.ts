import { vectorFromOrigin, type Vec } from "./math.js";
import { Node } from "./Node.js";
import { Shape } from "./Shape.js";
import type { Box, PointerMods } from "./types.js";

const HANDLES = [
  "top-left",
  "top-center",
  "top-right",
  "middle-right",
  "bottom-right",
  "bottom-center",
  "bottom-left",
  "middle-left",
] as const;

type Handle = (typeof HANDLES)[number] | "rotater";

const OPPOSITE: Record<string, Handle> = {
  "top-left": "bottom-right",
  "top-center": "bottom-center",
  "top-right": "bottom-left",
  "middle-right": "middle-left",
  "bottom-right": "top-left",
  "bottom-center": "top-center",
  "bottom-left": "top-right",
  "middle-left": "middle-right",
};

interface SingleSnap {
  kind: "single";
  node: Node;
  rotation: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  fixedLocal: Vec;
  fixedParent: Vec;
  localDx: number;
  localDy: number;
  centerLocal: Vec;
  centerParent: Vec;
  startAngle: number;
}

interface MultiSnap {
  kind: "multi";
  parent: Node;
  fixed: Vec;
  startMoving: Vec;
  center: Vec;
  startAngle: number;
  nodes: {
    node: Node;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
    centerLocal: Vec;
    centerParent: Vec;
  }[];
}

export class Transformer extends Shape {
  static override className = "Transformer";
  static override transient = true;

  private nodesList: Node[] = [];
  private snap: SingleSnap | MultiSnap | null = null;
  private active: Handle | null = null;
  anchorSize = 7;
  rotateOffset = 28;
  borderStroke = "#8eb6ff";
  handleFill = "#101114";
  rotateFill = "#ffb25b";

  constructor(config: { nodes?: Node[]; borderStroke?: string } = {}) {
    super({ listening: true, draggable: false, strokeWidth: 0, fill: "", ...config });
    if (config.borderStroke) this.borderStroke = config.borderStroke;
    if (config.nodes) this.nodes(config.nodes);
  }

  nodes(): Node[];
  nodes(list: Node[]): this;
  nodes(list?: Node[]): Node[] | this {
    if (!list) return this.nodesList.slice();
    this.nodesList = list.filter((node) => node !== this && node.className !== "Transformer");
    this.requestDraw();
    return this;
  }

  anchorAt(local: Vec): Handle | null {
    const stageScale = this.pixelScale();
    const radius = (this.anchorSize + 4) / stageScale;
    const order: Handle[] = ["rotater", ...HANDLES];
    for (const name of order) {
      const point = this.handlePoint(name);
      if (!point) continue;
      if (Math.hypot(local.x - point.x, local.y - point.y) <= radius) return name;
    }
    return null;
  }

  override intersects(local: Vec): boolean {
    return this.anchorAt(local) !== null;
  }

  startTransform(anchor: string, screen: Vec, mods: PointerMods = {}): void {
    const nodes = this.liveNodes();
    if (!nodes.length) return;
    const handle = anchor as Handle;
    this.active = handle;
    const parent = nodes[0].parent;
    if (!parent || nodes.some((node) => node.parent !== parent)) return;

    if (nodes.length === 1) {
      const node = nodes[0];
      const rect = safeRect(node);
      const moving = anchorLocal(handle === "rotater" ? "top-center" : handle, rect);
      const fixedName = handle === "rotater" ? "top-center" : OPPOSITE[handle];
      const fixedLocal = mods.alt ? centerOf(rect) : anchorLocal(fixedName, rect);
      const centerLocal = centerOf(rect);
      const pointer = parent.screenToLocal(screen.x, screen.y);
      const centerParent = node.localTo(parent, centerLocal.x, centerLocal.y);
      this.snap = {
        kind: "single",
        node,
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        offsetX: node.offsetX(),
        offsetY: node.offsetY(),
        fixedLocal,
        fixedParent: node.localTo(parent, fixedLocal.x, fixedLocal.y),
        localDx: moving.x - fixedLocal.x,
        localDy: moving.y - fixedLocal.y,
        centerLocal,
        centerParent,
        startAngle: Math.atan2(pointer.y - centerParent.y, pointer.x - centerParent.x),
      };
    } else {
      const box = unionParent(nodes, parent);
      const fixed = mods.alt ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : corner(box, OPPOSITE[handle] ?? "top-left");
      const startMoving = corner(box, handle === "rotater" ? "top-center" : handle);
      const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const pointer = parent.screenToLocal(screen.x, screen.y);
      this.snap = {
        kind: "multi",
        parent,
        fixed,
        startMoving,
        center,
        startAngle: Math.atan2(pointer.y - center.y, pointer.x - center.x),
        nodes: nodes.map((node) => {
          const rect = safeRect(node);
          const centerLocal = centerOf(rect);
          return {
            node,
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
            offsetX: node.offsetX(),
            offsetY: node.offsetY(),
            centerLocal,
            centerParent: node.localTo(parent, centerLocal.x, centerLocal.y),
          };
        }),
      };
    }
    for (const node of nodes) node.fire("transformstart");
  }

  updateTransform(screen: Vec, mods: PointerMods = {}): void {
    if (!this.snap || !this.active) return;
    if (this.snap.kind === "single") this.updateSingle(screen, mods);
    else this.updateMulti(screen, mods);
    for (const node of this.liveNodes()) node.fire("transform");
  }

  endTransform(): void {
    if (this.snap) {
      for (const node of this.liveNodes()) node.fire("transformend");
    }
    this.snap = null;
    this.active = null;
  }

  override drawShape(ctx: CanvasRenderingContext2D): void {
    const nodes = this.liveNodes();
    if (!nodes.length) return;
    const space = this.parent;
    if (!space) return;
    const scale = this.pixelScale();
    const size = this.anchorSize / scale;

    if (nodes.length === 1) {
      const node = nodes[0];
      const rect = safeRect(node);
      const corners = (["top-left", "top-right", "bottom-right", "bottom-left"] as const).map((name) =>
        node.localTo(space, ...pair(anchorLocal(name, rect))),
      );
      strokeLoop(ctx, corners, this.borderStroke, 1.25 / scale);
      for (const name of HANDLES) {
        const point = node.localTo(space, ...pair(anchorLocal(name, rect)));
        dot(ctx, point, size, this.handleFill, this.borderStroke, 1.25 / scale);
      }
      const rot = this.rotatePoint(node, space, rect, scale);
      const top = node.localTo(space, ...pair(anchorLocal("top-center", rect)));
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(rot.x, rot.y);
      ctx.strokeStyle = this.borderStroke;
      ctx.lineWidth = 1.25 / scale;
      ctx.stroke();
      dot(ctx, rot, size, this.rotateFill, this.rotateFill, 1 / scale);
      return;
    }

    const parent = nodes[0].parent;
    if (!parent) return;
    const box = unionParent(nodes, parent);
    const corners = (["top-left", "top-right", "bottom-right", "bottom-left"] as const).map((name) =>
      parent.localTo(space, ...pair(corner(box, name))),
    );
    strokeLoop(ctx, corners, this.borderStroke, 1.25 / scale);
    for (const name of HANDLES) {
      const point = parent.localTo(space, ...pair(corner(box, name)));
      dot(ctx, point, size, this.handleFill, this.borderStroke, 1.25 / scale);
    }
  }

  private updateSingle(screen: Vec, mods: PointerMods): void {
    const snap = this.snap as SingleSnap;
    const node = snap.node;
    const parent = node.parent;
    if (!parent) return;
    const pointer = parent.screenToLocal(screen.x, screen.y);

    if (this.active === "rotater") {
      let deg =
        snap.rotation +
        ((Math.atan2(pointer.y - snap.centerParent.y, pointer.x - snap.centerParent.x) - snap.startAngle) * 180) /
          Math.PI;
      if (mods.shift) deg = Math.round(deg / 15) * 15;
      node.rotation(deg);
      const vector = vectorFromOrigin(
        snap.centerLocal.x,
        snap.centerLocal.y,
        deg,
        node.scaleX(),
        node.scaleY(),
        snap.offsetX,
        snap.offsetY,
      );
      node.position({ x: snap.centerParent.x - vector.x, y: snap.centerParent.y - vector.y });
      return;
    }

    const rel = unrotate(
      { x: pointer.x - snap.fixedParent.x, y: pointer.y - snap.fixedParent.y },
      snap.rotation,
    );
    let sx = Math.abs(snap.localDx) < 1e-4 ? snap.scaleX : rel.x / snap.localDx;
    let sy = Math.abs(snap.localDy) < 1e-4 ? snap.scaleY : rel.y / snap.localDy;
    if (this.active?.includes("center")) sx = snap.scaleX;
    if (this.active?.includes("middle")) sy = snap.scaleY;
    if (mods.shift && !this.active?.includes("center") && !this.active?.includes("middle")) {
      const uniform = Math.max(Math.abs(sx), Math.abs(sy));
      sx = Math.sign(sx || 1) * uniform;
      sy = Math.sign(sy || 1) * uniform;
    }
    sx = finiteScale(sx);
    sy = finiteScale(sy);
    node.scale({ x: sx, y: sy });
    const vector = vectorFromOrigin(
      snap.fixedLocal.x,
      snap.fixedLocal.y,
      snap.rotation,
      sx,
      sy,
      snap.offsetX,
      snap.offsetY,
    );
    node.position({ x: snap.fixedParent.x - vector.x, y: snap.fixedParent.y - vector.y });
  }

  private updateMulti(screen: Vec, mods: PointerMods): void {
    const snap = this.snap as MultiSnap;
    const pointer = snap.parent.screenToLocal(screen.x, screen.y);
    if (this.active === "rotater") {
      let delta = Math.atan2(pointer.y - snap.center.y, pointer.x - snap.center.x) - snap.startAngle;
      if (mods.shift) delta = (Math.round(((delta * 180) / Math.PI) / 15) * 15 * Math.PI) / 180;
      const deg = (delta * 180) / Math.PI;
      for (const item of snap.nodes) {
        const orbit = rotateAround(item.centerParent, snap.center, delta);
        item.node.rotation(item.rotation + deg);
        const vector = vectorFromOrigin(
          item.centerLocal.x,
          item.centerLocal.y,
          item.rotation + deg,
          item.scaleX,
          item.scaleY,
          item.offsetX,
          item.offsetY,
        );
        item.node.position({ x: orbit.x - vector.x, y: orbit.y - vector.y });
      }
      return;
    }

    let sx = Math.abs(snap.startMoving.x - snap.fixed.x) < 1e-4 ? 1 : (pointer.x - snap.fixed.x) / (snap.startMoving.x - snap.fixed.x);
    let sy = Math.abs(snap.startMoving.y - snap.fixed.y) < 1e-4 ? 1 : (pointer.y - snap.fixed.y) / (snap.startMoving.y - snap.fixed.y);
    if (this.active?.includes("center")) sx = 1;
    if (this.active?.includes("middle")) sy = 1;
    if (mods.shift) {
      const uniform = Math.max(Math.abs(sx), Math.abs(sy));
      sx = Math.sign(sx || 1) * uniform;
      sy = Math.sign(sy || 1) * uniform;
    }
    sx = finiteScale(sx);
    sy = finiteScale(sy);
    for (const item of snap.nodes) {
      item.node.scale({ x: item.scaleX * sx, y: item.scaleY * sy });
      item.node.position({
        x: snap.fixed.x + (item.x - snap.fixed.x) * sx,
        y: snap.fixed.y + (item.y - snap.fixed.y) * sy,
      });
    }
  }

  private handlePoint(name: Handle): Vec | null {
    const nodes = this.liveNodes();
    const space = this.parent;
    if (!nodes.length || !space) return null;
    if (nodes.length === 1) {
      const node = nodes[0];
      const rect = safeRect(node);
      if (name === "rotater") return this.rotatePoint(node, space, rect, this.pixelScale());
      return node.localTo(space, ...pair(anchorLocal(name, rect)));
    }
    const parent = nodes[0].parent;
    if (!parent) return null;
    const box = unionParent(nodes, parent);
    if (name === "rotater") {
      const top = corner(box, "top-center");
      const point = parent.localTo(space, top.x, top.y - this.rotateOffset / this.pixelScale());
      return point;
    }
    return parent.localTo(space, ...pair(corner(box, name)));
  }

  private rotatePoint(node: Node, space: Node, rect: Box, scale: number): Vec {
    const top = anchorLocal("top-center", rect);
    const left = anchorLocal("top-left", rect);
    const right = anchorLocal("top-right", rect);
    const center = centerOf(rect);
    const topSpace = node.localTo(space, top.x, top.y);
    const leftSpace = node.localTo(space, left.x, left.y);
    const rightSpace = node.localTo(space, right.x, right.y);
    const centerSpace = node.localTo(space, center.x, center.y);
    let nx = -(rightSpace.y - leftSpace.y);
    let ny = rightSpace.x - leftSpace.x;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    const toward = { x: topSpace.x - centerSpace.x, y: topSpace.y - centerSpace.y };
    if (nx * toward.x + ny * toward.y < 0) {
      nx *= -1;
      ny *= -1;
    }
    const dist = this.rotateOffset / scale;
    return { x: topSpace.x + nx * dist, y: topSpace.y + ny * dist };
  }

  private liveNodes(): Node[] {
    this.nodesList = this.nodesList.filter((node) => node.parent);
    return this.nodesList;
  }

  private pixelScale(): number {
    return this.getAbsoluteTransform().scaleX();
  }
}

function pair(v: Vec): [number, number] {
  return [v.x, v.y];
}

function centerOf(rect: Box): Vec {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function safeRect(node: Node): Box {
  const rect = node.getSelfRect();
  if (rect.width === 0 && rect.height === 0) return { x: -8, y: -8, width: 16, height: 16 };
  return rect;
}

function anchorLocal(name: string, rect: Box): Vec {
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  switch (name) {
    case "top-left":
      return { x: rect.x, y: rect.y };
    case "top-center":
      return { x: cx, y: rect.y };
    case "top-right":
      return { x: right, y: rect.y };
    case "middle-left":
      return { x: rect.x, y: cy };
    case "middle-right":
      return { x: right, y: cy };
    case "bottom-left":
      return { x: rect.x, y: bottom };
    case "bottom-center":
      return { x: cx, y: bottom };
    default:
      return { x: right, y: bottom };
  }
}

function corner(box: Box, name: string): Vec {
  return anchorLocal(name, box);
}

function unionParent(nodes: Node[], parent: Node): Box {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const rect = safeRect(node);
    for (const name of ["top-left", "top-right", "bottom-right", "bottom-left"] as const) {
      const local = anchorLocal(name, rect);
      const point = node.localTo(parent, local.x, local.y);
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function unrotate(v: Vec, deg: number): Vec {
  const r = (-deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

function finiteScale(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) < 0.02) return value < 0 ? -0.02 : 0.02;
  return value;
}

function rotateAround(point: Vec, origin: Vec, rad: number): Vec {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const x = point.x - origin.x;
  const y = point.y - origin.y;
  return { x: origin.x + x * cos - y * sin, y: origin.y + x * sin + y * cos };
}

function strokeLoop(ctx: CanvasRenderingContext2D, points: Vec[], color: string, width: number) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, point: Vec, size: number, fill: string, stroke: string, width: number) {
  ctx.beginPath();
  ctx.rect(point.x - size / 2, point.y - size / 2, size, size);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = width;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}
