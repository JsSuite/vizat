import { describe, expect, it } from "vitest";
import { Matrix } from "../src/math.js";
import {
  Arrow,
  Circle,
  Connector,
  Group,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from "../src/index.js";

function host() {
  const el = document.createElement("div");
  document.body.appendChild(el);
  el.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      toJSON() {},
    }) as DOMRect;
  return el;
}

function stage() {
  const el = host();
  const root = new Stage({ container: el, width: 800, height: 600, background: "#111" });
  const layer = new Layer();
  root.add(layer);
  return { el, root, layer };
}

describe("matrix", () => {
  it("scales then translates", () => {
    const point = new Matrix().translate(50, 0).scale(2, 2).point(10, 4);
    expect(point.x).toBeCloseTo(70);
    expect(point.y).toBeCloseTo(8);
  });

  it("inverts a transform", () => {
    const matrix = new Matrix().translate(12, -4).rotate(30).scale(1.5, 0.5);
    const point = matrix.point(8, 3);
    const back = matrix.inverse().point(point.x, point.y);
    expect(back.x).toBeCloseTo(8);
    expect(back.y).toBeCloseTo(3);
  });

  it("rotates the x axis toward +y", () => {
    const point = new Matrix().rotate(90).point(10, 0);
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(10);
  });
});

describe("scene graph", () => {
  it("draws a stage full of shapes", () => {
    const { root, layer } = stage();
    layer.add(
      new Rect({ x: 10, y: 10, width: 80, height: 40, fill: "#6ee7b7" }),
      new Circle({ x: 140, y: 40, radius: 24, fill: "#ffb25b" }),
      new Line({ points: [0, 0, 40, 20] }),
      new Arrow({ points: [0, 40, 80, 10], stroke: "#fff" }),
      new Text({ x: 20, y: 80, text: "Vizat", fill: "#fff" }),
    );
    expect(() => root.draw()).not.toThrow();
    expect(layer.canvasElement().width).toBeGreaterThan(0);
  });

  it("hits the topmost shape", () => {
    const { root, layer } = stage();
    const bottom = new Rect({ x: 0, y: 0, width: 100, height: 100, fill: "red" });
    const top = new Rect({ x: 10, y: 10, width: 30, height: 30, fill: "blue" });
    layer.add(bottom, top);
    expect(root.getIntersection({ x: 20, y: 20 })).toBe(top);
    expect(root.getIntersection({ x: 90, y: 90 })).toBe(bottom);
    expect(root.getIntersection({ x: 400, y: 400 })).toBeNull();
  });

  it("hits a rotated rect in screen space", () => {
    const { root, layer } = stage();
    const rect = new Rect({ x: 0, y: 0, width: 100, height: 20, fill: "#fff", rotation: 90 });
    layer.add(rect);
    expect(root.getIntersection({ x: -10, y: 50 })).toBe(rect);
    expect(root.getIntersection({ x: 50, y: 10 })).toBeNull();
  });

  it("includes group position in the absolute transform", () => {
    const { layer } = stage();
    const group = new Group({ x: 10, y: 10 });
    const rect = new Rect({ x: 5, y: 5, width: 10, height: 10, fill: "#fff" });
    group.add(rect);
    layer.add(group);
    const point = rect.getAbsoluteTransform().point(0, 0);
    expect(point.x).toBeCloseTo(15);
    expect(point.y).toBeCloseTo(15);
  });

  it("stops event propagation", () => {
    const { layer } = stage();
    const rect = new Rect({ width: 10, height: 10, fill: "#fff" });
    layer.add(rect);
    let seen = 0;
    rect.on("click", (event) => {
      seen += 1;
      event.stopPropagation();
    });
    layer.on("click", () => {
      seen += 10;
    });
    rect.fire("click");
    expect(seen).toBe(1);
  });

  it("hits near a line and misses far away", () => {
    const line = new Line({ points: [0, 0, 100, 0], strokeWidth: 2, hitStrokeWidth: 8 });
    expect(line.intersects({ x: 50, y: 3 })).toBe(true);
    expect(line.intersects({ x: 50, y: 30 })).toBe(false);
  });
});

describe("interaction", () => {
  it("drags a shape", () => {
    const { el, layer } = stage();
    const rect = new Rect({ x: 10, y: 10, width: 100, height: 80, fill: "red", draggable: true });
    layer.add(rect);
    el.dispatchEvent(new PointerEvent("pointerdown", { clientX: 20, clientY: 20, bubbles: true }));
    el.dispatchEvent(new PointerEvent("pointermove", { clientX: 80, clientY: 70, bubbles: true }));
    el.dispatchEvent(new PointerEvent("pointerup", { clientX: 80, clientY: 70, bubbles: true }));
    expect(rect.x()).toBeCloseTo(70);
    expect(rect.y()).toBeCloseTo(60);
  });

  it("zooms toward the pointer", () => {
    const { el, root } = stage();
    const before = root.scaleX();
    const wheel = new WheelEvent("wheel", { clientX: 100, clientY: 80, deltaY: -120, bubbles: true, cancelable: true });
    if (!Number.isFinite(wheel.clientX)) {
      Object.defineProperty(wheel, "clientX", { value: 100 });
      Object.defineProperty(wheel, "clientY", { value: 80 });
    }
    el.dispatchEvent(wheel);
    expect(root.scaleX()).toBeGreaterThan(before);
    const world = root.getTransform().inverse().point(100, 80);
    const screen = root.getTransform().point(world.x, world.y);
    expect(screen.x).toBeCloseTo(100);
    expect(screen.y).toBeCloseTo(80);
  });

  it("scales a rect from the bottom-right handle", () => {
    const { layer } = stage();
    const rect = new Rect({ x: 0, y: 0, width: 100, height: 100, fill: "#fff" });
    const transformer = new Transformer({ nodes: [rect] });
    layer.add(rect, transformer);
    transformer.startTransform("bottom-right", { x: 100, y: 100 });
    transformer.updateTransform({ x: 160, y: 150 });
    transformer.endTransform();
    expect(rect.scaleX()).toBeCloseTo(1.6);
    expect(rect.scaleY()).toBeCloseTo(1.5);
    expect(rect.x()).toBeCloseTo(0);
    expect(rect.y()).toBeCloseTo(0);
  });

  it("keeps a connector attached when a node moves", () => {
    const { layer } = stage();
    const a = new Rect({ x: 0, y: 0, width: 100, height: 40, fill: "#fff" });
    const b = new Rect({ x: 220, y: 0, width: 80, height: 40, fill: "#fff" });
    const link = new Connector({ from: a, to: b, stroke: "#ffb25b" });
    layer.add(a, b, link);
    const start = link.points()[0];
    a.position({ x: 40, y: 0 });
    link.refresh();
    expect(link.points()[0]).toBeGreaterThan(start);
    expect(link.points()[2]).toBeLessThan(220 + 80);
  });
});
