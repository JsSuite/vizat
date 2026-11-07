import { Container } from "./Container.js";
import { Layer } from "./Layer.js";
import { clamp, type Vec } from "./math.js";
import { findDraggable, Node } from "./Node.js";
import { hitTest } from "./render.js";
import { Transformer } from "./Transformer.js";
import type { PointerMods, StageConfig } from "./types.js";

interface Pan {
  screen: Vec;
  origin: Vec;
}

export class Stage extends Container {
  static override className = "Stage";

  readonly container: HTMLElement;
  private widthPx: number;
  private heightPx: number;
  private ratio: number;
  private minScale: number;
  private maxScale: number;
  private backgroundColor: string;
  private wheelEnabled: boolean;
  private frame = 0;
  private mode: "none" | "drag" | "pan" | "transform" = "none";
  private dragNode: Node | null = null;
  private dragOffset = { x: 0, y: 0 };
  private pan: Pan | null = null;
  private transformer: Transformer | null = null;
  private moved = false;
  private downHit: Node | null = null;
  private startScreen: Vec = { x: 0, y: 0 };
  private hovered: Node | null = null;
  private lastScreen: Vec | null = null;
  private forcePan = false;
  private resizeObserver: ResizeObserver | null = null;
  private gestureMove: (event: PointerEvent) => void;
  private gestureUp: (event: PointerEvent) => void;

  constructor(config: StageConfig) {
    super();
    const element =
      typeof config.container === "string" ? document.getElementById(config.container) : config.container;
    if (!element) throw new Error(`[vizat] No container "${String(config.container)}"`);
    this.container = element;
    this.backgroundColor = config.background ?? "transparent";
    this.wheelEnabled = config.wheelZoom !== false;
    this.minScale = config.minScale ?? 0.08;
    this.maxScale = config.maxScale ?? 12;
    this.ratio = config.pixelRatio ?? Math.min(typeof devicePixelRatio === "number" ? devicePixelRatio : 1, 2.5);
    this.container.style.position = "relative";
    this.container.style.overflow = "hidden";
    this.container.style.touchAction = "none";
    this.container.style.background = this.backgroundColor;
    const initialW = config.width ?? (element.clientWidth || 300);
    const initialH = config.height ?? (element.clientHeight || 150);
    this.widthPx = initialW;
    this.heightPx = initialH;
    if (!element.clientWidth && config.width) element.style.width = `${config.width}px`;
    if (!element.clientHeight && config.height) element.style.height = `${config.height}px`;

    this.gestureMove = (event) => this.onGestureMove(event);
    this.gestureUp = (event) => this.onGestureEnd(event);
    this.container.addEventListener("pointerdown", this.onPointerDown);
    this.container.addEventListener("pointermove", this.onHoverMove);
    this.container.addEventListener("dblclick", this.onDblClick);
    this.container.addEventListener("wheel", this.onWheel, { passive: false });
    this.container.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  width(): number;
  width(value: number): this;
  width(value?: number): number | this {
    if (value === undefined) return this.widthPx;
    this.resize(value, this.heightPx);
    return this;
  }

  height(): number;
  height(value: number): this;
  height(value?: number): number | this {
    if (value === undefined) return this.heightPx;
    this.resize(this.widthPx, value);
    return this;
  }

  background(): string {
    return this.backgroundColor;
  }

  pixelRatio(): number {
    return this.ratio;
  }

  forcePanMode(): boolean;
  forcePanMode(value: boolean): this;
  forcePanMode(value?: boolean): boolean | this {
    if (value === undefined) return this.forcePan;
    this.forcePan = value;
    return this;
  }

  resize(width: number, height: number): this {
    this.widthPx = Math.max(1, width);
    this.heightPx = Math.max(1, height);
    for (const layer of this.layers()) layer.syncSize(this.widthPx, this.heightPx, this.ratio);
    this.batchDraw();
    return this;
  }

  resizeToContainer(): this {
    const apply = () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      if (width > 0 && height > 0) this.resize(width, height);
    };
    apply();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(() => apply());
      this.resizeObserver.observe(this.container);
    }
    return this;
  }

  override add(...nodes: Node[]): this {
    for (const node of nodes) {
      if (!(node instanceof Layer)) throw new Error("[vizat] Stage.add() only accepts Layer nodes");
      super.add(node);
      this.container.appendChild(node.canvasElement());
      node.syncSize(this.widthPx, this.heightPx, this.ratio);
    }
    this.batchDraw();
    return this;
  }

  layers(): Layer[] {
    return this.children.filter((node): node is Layer => node instanceof Layer);
  }

  draw(): this {
    for (const layer of this.layers()) layer.draw();
    return this;
  }

  batchDraw(): this {
    if (this.frame) return this;
    const schedule = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (fn: FrameRequestCallback) => window.setTimeout(() => fn(0), 16) as unknown as number;
    this.frame = schedule(() => {
      this.frame = 0;
      this.draw();
    });
    return this;
  }

  getPointerPosition(): Vec | null {
    if (!this.lastScreen) return null;
    return this.screenToLocal(this.lastScreen.x, this.lastScreen.y);
  }

  getIntersection(screen?: Vec): Node | null {
    const point = screen ?? this.lastScreen;
    if (!point) return null;
    const layers = this.layers();
    for (let i = layers.length - 1; i >= 0; i--) {
      const hit = hitTest(layers[i], point);
      if (hit) return hit;
    }
    return null;
  }

  zoomAt(factor: number, screen?: Vec): this {
    const origin = screen ?? { x: this.widthPx / 2, y: this.heightPx / 2 };
    const world = this.screenToLocal(origin.x, origin.y);
    const next = clamp(this.scaleX() * factor, this.minScale, this.maxScale);
    this.scale({ x: next, y: next });
    this.position({ x: origin.x - world.x * next, y: origin.y - world.y * next });
    return this;
  }

  resetView(): this {
    this.scale({ x: 1, y: 1 });
    this.position({ x: 0, y: 0 });
    return this;
  }

  toDataURL(options: { background?: string; mimeType?: string; quality?: number } = {}): string {
    this.draw();
    const canvas = document.createElement("canvas");
    const layer = this.layers()[0];
    const source = layer?.canvasElement();
    canvas.width = source?.width || Math.round(this.widthPx * this.ratio);
    canvas.height = source?.height || Math.round(this.heightPx * this.ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    const background = options.background ?? this.backgroundColor;
    if (background && background !== "transparent") {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    for (const item of this.layers()) ctx.drawImage(item.canvasElement(), 0, 0);
    return canvas.toDataURL(options.mimeType ?? "image/png", options.quality);
  }

  override destroy(): void {
    this.resizeObserver?.disconnect();
    this.container.removeEventListener("pointerdown", this.onPointerDown);
    this.container.removeEventListener("pointermove", this.onHoverMove);
    this.container.removeEventListener("dblclick", this.onDblClick);
    this.container.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("pointermove", this.gestureMove);
    window.removeEventListener("pointerup", this.gestureUp);
    super.destroy();
  }

  private layersHit(screen: Vec): Node | null {
    return this.getIntersection(screen);
  }

  private screenOf(event: { clientX: number; clientY: number }): Vec {
    const rect = this.container.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private world(screen: Vec): Vec {
    return this.screenToLocal(screen.x, screen.y);
  }

  private mods(event: MouseEvent): PointerMods {
    return { shift: event.shiftKey, alt: event.altKey };
  }

  private onPointerDown = (event: PointerEvent) => {
    if (event.button === 1 || event.button === 2 || this.forcePan) {
      this.beginPan(event);
      return;
    }
    const screen = this.screenOf(event);
    this.lastScreen = screen;
    this.startScreen = screen;
    const hit = this.layersHit(screen);
    this.downHit = hit;
    this.moved = false;
    event.preventDefault();

    if (hit instanceof Transformer) {
      const anchor = hit.anchorAt(hit.screenToLocal(screen.x, screen.y));
      if (anchor) {
        this.mode = "transform";
        this.transformer = hit;
        this.startScreen = screen;
        hit.startTransform(anchor, screen, this.mods(event));
        this.track(event);
        return;
      }
    }

    const draggable = findDraggable(hit);
    if (draggable) {
      this.mode = "drag";
      this.dragNode = draggable;
      this.startScreen = screen;
      const parent = draggable.parent ?? this;
      const local = parent.screenToLocal(screen.x, screen.y);
      this.dragOffset = { x: local.x - draggable.x(), y: local.y - draggable.y() };
    } else if (this.draggable()) {
      this.beginPan(event);
      return;
    }

    const world = this.world(screen);
    if (hit) hit.fire("pointerdown", event, screen, world);
    else this.fire("pointerdown", event, screen, world);
    this.track(event);
  };

  private beginPan(event: PointerEvent): void {
    const screen = this.screenOf(event);
    this.lastScreen = screen;
    this.mode = "pan";
    this.moved = false;
    this.pan = { screen, origin: { x: this.x(), y: this.y() } };
    event.preventDefault();
    this.track(event);
  }

  private track(event: PointerEvent): void {
    try {
      this.container.setPointerCapture?.(event.pointerId);
    } catch {
      /* capture is optional */
    }
    window.addEventListener("pointermove", this.gestureMove);
    window.addEventListener("pointerup", this.gestureUp);
    window.addEventListener("pointercancel", this.gestureUp);
  }

  private onGestureMove = (event: PointerEvent) => {
    const screen = this.screenOf(event);
    this.lastScreen = screen;
    if (this.mode === "pan" && this.pan) {
      this.moved = true;
      this.position({
        x: this.pan.origin.x + (screen.x - this.pan.screen.x),
        y: this.pan.origin.y + (screen.y - this.pan.screen.y),
      });
      return;
    }
    if (this.mode === "transform" && this.transformer) {
      this.moved = true;
      this.transformer.updateTransform(screen, this.mods(event));
      return;
    }
    if (this.mode === "none" && Math.hypot(screen.x - this.startScreen.x, screen.y - this.startScreen.y) >= 3) {
      this.moved = true;
    }
    if (this.mode === "drag" && this.dragNode?.parent) {
      if (!this.moved && Math.hypot(screen.x - this.startScreen.x, screen.y - this.startScreen.y) < 3) return;
      const local = this.dragNode.parent.screenToLocal(screen.x, screen.y);
      let next = { x: local.x - this.dragOffset.x, y: local.y - this.dragOffset.y };
      const bound = this.dragNode.dragBoundFunc();
      if (bound) next = bound(next);
      if (!this.moved) {
        this.moved = true;
        this.dragNode.fire("dragstart", event, screen, this.world(screen));
      }
      this.dragNode.position(next);
      this.dragNode.fire("dragmove", event, screen, this.world(screen));
    }
  };

  private onGestureEnd = (event: PointerEvent) => {
    window.removeEventListener("pointermove", this.gestureMove);
    window.removeEventListener("pointerup", this.gestureUp);
    window.removeEventListener("pointercancel", this.gestureUp);
    const screen = this.screenOf(event);
    this.lastScreen = screen;
    if (this.mode === "drag" && this.dragNode) {
      if (this.moved) this.dragNode.fire("dragend", event, screen, this.world(screen));
      else this.downHit?.fire("click", event, screen, this.world(screen));
    } else if (this.mode === "transform" && this.transformer) {
      this.transformer.endTransform();
    } else if (!this.moved) {
      const world = this.world(screen);
      if (this.downHit) this.downHit.fire("click", event, screen, world);
      else this.fire("click", event, screen, world);
    }
    this.mode = "none";
    this.dragNode = null;
    this.transformer = null;
    this.pan = null;
    this.fire("pointerup", event, screen, this.world(screen));
  };

  private onHoverMove = (event: PointerEvent) => {
    if (this.mode !== "none") return;
    const screen = this.screenOf(event);
    this.lastScreen = screen;
    const hit = this.layersHit(screen);
    if (hit !== this.hovered) {
      this.hovered?.fire("mouseleave", event, screen, this.world(screen));
      hit?.fire("mouseenter", event, screen, this.world(screen));
      this.hovered = hit;
    }
    const world = this.world(screen);
    if (hit) hit.fire("pointermove", event, screen, world);
    else this.fire("pointermove", event, screen, world);
  };

  private onDblClick = (event: MouseEvent) => {
    const screen = this.screenOf(event);
    this.lastScreen = screen;
    const world = this.world(screen);
    const hit = this.layersHit(screen);
    if (hit) hit.fire("dblclick", event, screen, world);
    else this.fire("dblclick", event, screen, world);
  };

  private onWheel = (event: WheelEvent) => {
    const screen = this.screenOf(event);
    this.lastScreen = screen;
    if (this.wheelEnabled && Number.isFinite(screen.x) && Number.isFinite(screen.y)) {
      event.preventDefault();
      const world = this.screenToLocal(screen.x, screen.y);
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const next = clamp(this.scaleX() * Math.exp(-delta * 0.0015), this.minScale, this.maxScale);
      if (Number.isFinite(next) && Number.isFinite(world.x) && Number.isFinite(world.y)) {
        this.scale({ x: next, y: next });
        this.position({ x: screen.x - world.x * next, y: screen.y - world.y * next });
      }
    }
    this.fire("wheel", event, screen, this.getPointerPosition());
  };
}
