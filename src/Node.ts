import type { Stage } from "./Stage.js";
import { Matrix, type Vec } from "./math.js";
import type { SerializedNode } from "./types.js";

let seq = 1;

export function claimId(id: string): void {
  const match = /^vz_(\d+)$/.exec(id);
  if (match) seq = Math.max(seq, Number(match[1]) + 1);
}

function nextId(): string {
  return `vz_${seq++}`;
}

export class VizatEvent {
  cancelBubble = false;
  currentTarget: Node | null = null;

  constructor(
    public type: string,
    public target: Node,
    public evt: Event | null,
    public pointer: Vec | null,
    public screen: Vec | null,
  ) {}

  stopPropagation(): void {
    this.cancelBubble = true;
  }

  preventDefault(): void {
    this.evt?.preventDefault();
  }
}

export type Handler = (evt: VizatEvent) => void;

export class Node {
  static className = "Node";
  static transient = false;

  attrs: Record<string, any> = {};
  parent: Node | null = null;

  private _id: string;
  private listeners = new Map<string, Set<Handler>>();

  constructor(config: Record<string, any> = {}) {
    this._id = config.id ? String(config.id) : nextId();
    if (config.id) claimId(this._id);
    this.attrs = {
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      opacity: 1,
      visible: true,
      draggable: false,
      listening: true,
      name: "",
      ...config,
    };
    delete this.attrs.id;
  }

  get className(): string {
    return (this.constructor as typeof Node).className;
  }

  id(): string;
  id(value: string): this;
  id(value?: string): string | this {
    if (value === undefined) return this._id;
    this._id = value;
    claimId(value);
    return this;
  }

  name(): string;
  name(value: string): this;
  name(value?: string): string | this {
    return this.str("name", value, "");
  }

  x(): number;
  x(value: number): this;
  x(value?: number): number | this {
    return this.num("x", value, 0);
  }

  y(): number;
  y(value: number): this;
  y(value?: number): number | this {
    return this.num("y", value, 0);
  }

  rotation(): number;
  rotation(value: number): this;
  rotation(value?: number): number | this {
    return this.num("rotation", value, 0);
  }

  scaleX(): number;
  scaleX(value: number): this;
  scaleX(value?: number): number | this {
    return this.num("scaleX", value, 1);
  }

  scaleY(): number;
  scaleY(value: number): this;
  scaleY(value?: number): number | this {
    return this.num("scaleY", value, 1);
  }

  offsetX(): number;
  offsetX(value: number): this;
  offsetX(value?: number): number | this {
    return this.num("offsetX", value, 0);
  }

  offsetY(): number;
  offsetY(value: number): this;
  offsetY(value?: number): number | this {
    return this.num("offsetY", value, 0);
  }

  opacity(): number;
  opacity(value: number): this;
  opacity(value?: number): number | this {
    return this.num("opacity", value, 1);
  }

  visible(): boolean;
  visible(value: boolean): this;
  visible(value?: boolean): boolean | this {
    return this.bool("visible", value, true);
  }

  draggable(): boolean;
  draggable(value: boolean): this;
  draggable(value?: boolean): boolean | this {
    return this.bool("draggable", value, false);
  }

  listening(): boolean;
  listening(value: boolean): this;
  listening(value?: boolean): boolean | this {
    return this.bool("listening", value, true);
  }

  dragBoundFunc(): ((pos: Vec) => Vec) | undefined;
  dragBoundFunc(fn: (pos: Vec) => Vec): this;
  dragBoundFunc(fn?: (pos: Vec) => Vec): ((pos: Vec) => Vec) | undefined | this {
    if (fn === undefined) return this.attrs.dragBoundFunc;
    this.attrs.dragBoundFunc = fn;
    return this;
  }

  position(): Vec;
  position(value: Vec): this;
  position(value?: Vec): Vec | this {
    if (!value) return { x: this.x(), y: this.y() };
    this.x(value.x);
    this.y(value.y);
    return this;
  }

  scale(): Vec;
  scale(value: Vec): this;
  scale(value?: Vec): Vec | this {
    if (!value) return { x: this.scaleX(), y: this.scaleY() };
    this.scaleX(value.x);
    this.scaleY(value.y);
    return this;
  }

  move(dx: number, dy: number): this {
    this.x(this.x() + dx);
    this.y(this.y() + dy);
    return this;
  }

  setAttrs(attrs: Record<string, unknown>): this {
    for (const [key, value] of Object.entries(attrs)) {
      const fn = (this as unknown as Record<string, unknown>)[key];
      if (typeof fn === "function") fn.call(this, value);
      else this.attrs[key] = value;
    }
    this.requestDraw();
    return this;
  }

  getAttr<T = unknown>(key: string): T {
    return this.attrs[key] as T;
  }

  on(type: string, handler: Handler): this {
    for (const name of type.split(/\s+/)) {
      if (!name) continue;
      let set = this.listeners.get(name);
      if (!set) {
        set = new Set();
        this.listeners.set(name, set);
      }
      set.add(handler);
    }
    return this;
  }

  off(type?: string, handler?: Handler): this {
    if (!type) {
      this.listeners.clear();
      return this;
    }
    for (const name of type.split(/\s+/)) {
      const set = this.listeners.get(name);
      if (!set) continue;
      if (handler) set.delete(handler);
      else this.listeners.delete(name);
    }
    return this;
  }

  fire(type: string, evt: Event | null = null, screen: Vec | null = null, pointer: Vec | null = null): this {
    const event = new VizatEvent(type, this, evt, pointer, screen);
    let node: Node | null = this;
    while (node) {
      event.currentTarget = node;
      const set = node.listeners.get(type);
      if (set) {
        for (const handler of [...set]) handler(event);
      }
      if (event.cancelBubble) break;
      node = node.parent;
    }
    return this;
  }

  getTransform(): Matrix {
    return new Matrix()
      .translate(this.x(), this.y())
      .rotate(this.rotation())
      .scale(this.scaleX(), this.scaleY())
      .translate(-this.offsetX(), -this.offsetY());
  }

  getAbsoluteTransform(): Matrix {
    const chain: Node[] = [];
    let node: Node | null = this;
    while (node) {
      chain.push(node);
      node = node.parent;
    }
    chain.reverse();
    let matrix = new Matrix();
    for (const item of chain) matrix = matrix.multiply(item.getTransform());
    return matrix;
  }

  screenToLocal(x: number, y: number): Vec {
    return this.getAbsoluteTransform().inverse().point(x, y);
  }

  localTo(space: Node, x: number, y: number): Vec {
    const screen = this.getAbsoluteTransform().point(x, y);
    return space.getAbsoluteTransform().inverse().point(screen.x, screen.y);
  }

  getSelfRect(): { x: number; y: number; width: number; height: number } {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  getStage(): Stage | null {
    let node: Node | null = this;
    while (node) {
      if (node.className === "Stage") return node as Stage;
      node = node.parent;
    }
    return null;
  }

  getLayer(): Node | null {
    let node: Node | null = this;
    while (node) {
      if (node.className === "Layer") return node;
      node = node.parent;
    }
    return null;
  }

  requestDraw(): void {
    this.getStage()?.batchDraw();
  }

  moveUp(): this {
    const parent = this.parent as Node & { children?: Node[]; liftTransient?: () => void };
    const kids = parent?.children;
    if (!kids) return this;
    const index = kids.indexOf(this);
    if (index >= 0 && index < kids.length - 1) {
      kids.splice(index, 1);
      kids.splice(index + 1, 0, this);
      parent.liftTransient?.();
      this.requestDraw();
    }
    return this;
  }

  moveDown(): this {
    const parent = this.parent as Node & { children?: Node[]; liftTransient?: () => void };
    const kids = parent?.children;
    if (!kids) return this;
    const index = kids.indexOf(this);
    if (index > 0) {
      kids.splice(index, 1);
      kids.splice(index - 1, 0, this);
      parent.liftTransient?.();
      this.requestDraw();
    }
    return this;
  }

  moveToTop(): this {
    const parent = this.parent as Node & { children?: Node[]; liftTransient?: () => void };
    const kids = parent?.children;
    if (!kids) return this;
    const index = kids.indexOf(this);
    if (index >= 0) {
      kids.splice(index, 1);
      kids.push(this);
      parent.liftTransient?.();
      this.requestDraw();
    }
    return this;
  }

  moveToBottom(): this {
    const parent = this.parent as Node & { children?: Node[]; liftTransient?: () => void };
    const kids = parent?.children;
    if (!kids) return this;
    const index = kids.indexOf(this);
    if (index >= 0) {
      kids.splice(index, 1);
      kids.unshift(this);
      parent.liftTransient?.();
      this.requestDraw();
    }
    return this;
  }

  remove(): this {
    const parent = this.parent as (Node & { removeChild?: (n: Node) => void }) | null;
    parent?.removeChild?.(this);
    return this;
  }

  destroy(): void {
    this.remove();
    this.listeners.clear();
  }

  toObject(): SerializedNode {
    const attrs: Record<string, unknown> = { id: this._id };
    for (const [key, value] of Object.entries(this.attrs)) {
      if (typeof value === "function") continue;
      if (value instanceof Node) continue;
      if (isDomSource(value)) continue;
      attrs[key] = value;
    }
    return { className: this.className, attrs };
  }

  tween(target: Record<string, number>, duration = 0.35): Promise<void> {
    const keys = Object.keys(target);
    const start: Record<string, number> = {};
    for (const key of keys) {
      const fn = (this as unknown as Record<string, (v?: number) => number>)[key];
      start[key] = typeof fn === "function" ? fn.call(this) : Number(this.attrs[key] ?? 0);
    }
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / Math.max(1, duration * 1000));
        const eased = 1 - (1 - t) ** 3;
        for (const key of keys) {
          const fn = (this as unknown as Record<string, (v: number) => void>)[key];
          const value = start[key] + (target[key] - start[key]) * eased;
          if (typeof fn === "function") fn.call(this, value);
        }
        if (t < 1 && typeof requestAnimationFrame === "function") requestAnimationFrame(step);
        else resolve();
      };
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(step);
      else resolve();
    });
  }

  protected num(key: string, value: number | undefined, fallback: number): number | this {
    if (value === undefined) return Number(this.attrs[key] ?? fallback);
    this.attrs[key] = value;
    this.requestDraw();
    return this;
  }

  protected bool(key: string, value: boolean | undefined, fallback: boolean): boolean | this {
    if (value === undefined) return Boolean(this.attrs[key] ?? fallback);
    this.attrs[key] = value;
    this.requestDraw();
    return this;
  }

  protected str(key: string, value: string | undefined, fallback: string): string | this {
    if (value === undefined) return String(this.attrs[key] ?? fallback);
    this.attrs[key] = value;
    this.requestDraw();
    return this;
  }
}

function isDomSource(value: unknown): boolean {
  return !!value && typeof value === "object" && "nodeName" in (value as object);
}

export function findDraggable(node: Node | null): Node | null {
  let current = node;
  while (current) {
    if (current.draggable() && current.className !== "Stage" && current.className !== "Layer") return current;
    current = current.parent;
  }
  return null;
}
