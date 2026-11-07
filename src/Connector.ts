import { Node } from "./Node.js";
import { Arrow } from "./shapes.js";
import type { ArrowConfig, Box } from "./types.js";

type Endpoint = Node | null;

export class Connector extends Arrow {
  static override className = "Connector";

  private fromNode: Endpoint = null;
  private toNode: Endpoint = null;
  private subs: { node: Node; type: string }[] = [];
  private handler = () => this.refresh();

  constructor(config: ArrowConfig & { from?: Node; to?: Node; fromId?: string; toId?: string } = {}) {
    const { from, to, ...rest } = config;
    super({
      stroke: "#ffb25b",
      strokeWidth: 2,
      pointerLength: 12,
      pointerWidth: 12,
      hitStrokeWidth: 14,
      draggable: false,
      ...rest,
    });
    if (from) this.from(from);
    if (to) this.to(to);
  }

  from(): Endpoint;
  from(node: Endpoint): this;
  from(node?: Endpoint): Endpoint | this {
    if (node === undefined) return this.fromNode;
    this.silence();
    this.fromNode = node;
    this.attrs.fromId = node?.id() ?? null;
    this.listen(node);
    this.listen(this.toNode);
    this.refresh();
    return this;
  }

  to(): Endpoint;
  to(node: Endpoint): this;
  to(node?: Endpoint): Endpoint | this {
    if (node === undefined) return this.toNode;
    this.silence();
    this.toNode = node;
    this.attrs.toId = node?.id() ?? null;
    this.listen(this.fromNode);
    this.listen(node);
    this.refresh();
    return this;
  }

  refresh(): this {
    const from = this.fromNode;
    const to = this.toNode;
    const space = this.parent;
    if (!from?.parent || !to?.parent || !space) return this;
    const fromCenter = centerIn(from, space);
    const toCenter = centerIn(to, space);
    const start = borderPoint(from, space, toCenter);
    const end = borderPoint(to, space, fromCenter);
    const localStart = space === this.parent ? start : start;
    this.points([localStart.x - this.x(), localStart.y - this.y(), end.x - this.x(), end.y - this.y()]);
    return this;
  }

  override destroy(): void {
    this.silence();
    super.destroy();
  }

  private listen(node: Endpoint): void {
    let current = node;
    while (current) {
      current.on("dragmove", this.handler);
      current.on("transform", this.handler);
      this.subs.push({ node: current, type: "dragmove" }, { node: current, type: "transform" });
      current = current.parent;
    }
  }

  private silence(): void {
    for (const sub of this.subs) sub.node.off(sub.type, this.handler);
    this.subs = [];
  }
}

function centerIn(node: Node, space: Node) {
  const rect = node.getSelfRect();
  return node.localTo(space, rect.x + rect.width / 2, rect.y + rect.height / 2);
}

function borderPoint(node: Node, space: Node, toward: { x: number; y: number }) {
  const rect = node.getSelfRect();
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const screen = space.getAbsoluteTransform().point(toward.x, toward.y);
  const target = node.getAbsoluteTransform().inverse().point(screen.x, screen.y);
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (dx === 0 && dy === 0) return node.localTo(space, cx, cy);
  const hw = rect.width / 2 || 1;
  const hh = rect.height / 2 || 1;
  let t: number;
  if (node.className === "Circle" || node.className === "Ellipse" || node.className === "Star") {
    const norm = Math.sqrt((dx * dx) / (hw * hw) + (dy * dy) / (hh * hh)) || 1;
    t = 1 / norm;
  } else {
    t = Infinity;
    if (dx !== 0) t = Math.min(t, hw / Math.abs(dx));
    if (dy !== 0) t = Math.min(t, hh / Math.abs(dy));
  }
  return node.localTo(space, cx + dx * t, cy + dy * t);
}

export function nodeBox(node: Node): Box {
  return node.getSelfRect();
}
