import "./playground.css";
import {
  Arrow,
  Circle,
  Connector,
  createNode,
  Ellipse,
  Group,
  Layer,
  Line,
  linkConnectors,
  Node,
  Rect,
  Shape,
  Stage,
  Star,
  Text,
  Transformer,
  type SerializedNode,
  type Vec,
  type VizatEvent,
} from "vizat";

type Tool = "select" | "pan" | "rect" | "ellipse" | "text" | "line" | "arrow" | "connector";

const HINTS: Record<Tool, string> = {
  select: "Drag to move · handles scale and rotate · shift adds to selection · scroll zooms",
  pan: "Drag to pan · scroll zooms · H or space from any tool",
  rect: "Drag to draw a rectangle",
  ellipse: "Drag to draw an ellipse",
  text: "Click to place text, then edit it in the panel",
  line: "Click to add points · double-click or Enter to finish · Esc cancels",
  arrow: "Drag to draw an arrow",
  connector: "Click one shape, then another, to connect them",
};

const FILLS = ["#243044", "#3a2a22", "#24342c", "#342838", "#2c2618"];
const STROKES = ["#9eb7ff", "#e8a25a", "#7dcec4", "#e7b4d4", "#f3ecdf"];

class Grid extends Shape {
  static override className = "Grid";
  override intersects(): boolean {
    return false;
  }
  override drawShape(ctx: CanvasRenderingContext2D): void {
    const scale = this.getStage()?.scaleX() || 1;
    const extent = 5000;
    const minor = 32;
    const major = 160;
    ctx.save();
    ctx.lineWidth = 1 / scale;
    ctx.beginPath();
    for (let x = -extent; x <= extent; x += minor) {
      if (x % major === 0) continue;
      ctx.moveTo(x, -extent);
      ctx.lineTo(x, extent);
    }
    for (let y = -extent; y <= extent; y += minor) {
      if (y % major === 0) continue;
      ctx.moveTo(-extent, y);
      ctx.lineTo(extent, y);
    }
    ctx.strokeStyle = "rgba(243,236,223,0.045)";
    ctx.stroke();
    ctx.beginPath();
    for (let x = -extent; x <= extent; x += major) {
      ctx.moveTo(x, -extent);
      ctx.lineTo(x, extent);
    }
    for (let y = -extent; y <= extent; y += major) {
      ctx.moveTo(-extent, y);
      ctx.lineTo(extent, y);
    }
    ctx.strokeStyle = "rgba(232,162,90,0.09)";
    ctx.stroke();
    ctx.restore();
  }
}

const board = document.getElementById("board")!;
const stage = new Stage({ container: board, background: "#12110f", wheelZoom: true });
const gridLayer = new Layer({ listening: false });
const layer = new Layer();
const transformer = new Transformer();
gridLayer.add(new Grid());
stage.add(gridLayer, layer);
layer.add(transformer);

let tool: Tool = "select";
let snap = true;
let space = false;
let selected: Node[] = [];
let history: string[] = [];
let future: string[] = [];
let lockHistory = false;
let quiet = false;
let palette = 0;
let rubber: Shape | null = null;
let rubberOrigin: Vec | null = null;
let draftLine: Line | null = null;
let band: Rect | null = null;
let bandOrigin: Vec | null = null;
let arm: Node | null = null;
let fitted = false;

const hint = document.getElementById("hint")!;
const coords = document.getElementById("coords")!;
const props = document.getElementById("props") as HTMLFormElement;
const propEmpty = document.getElementById("prop-empty")!;
const layersEl = document.getElementById("layers")!;

function $(id: string) {
  return document.getElementById(id) as HTMLInputElement;
}

function typingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
}

function snapPoint(p: Vec): Vec {
  if (!snap) return p;
  const g = 16;
  return { x: Math.round(p.x / g) * g, y: Math.round(p.y / g) * g };
}

function snapPos(p: Vec): Vec {
  return snapPoint(p);
}

function card(x: number, y: number, title: string, sub: string, fill: string, stroke: string) {
  const group = new Group({ x, y, name: title, draggable: true });
  group.add(
    new Rect({
      width: 188,
      height: 104,
      cornerRadius: 16,
      fill,
      stroke,
      strokeWidth: 1.5,
      shadowColor: "rgba(0,0,0,0.35)",
      shadowBlur: 24,
      shadowOffsetY: 10,
    }),
  );
  group.add(new Text({ text: title, x: 16, y: 22, fontSize: 18, fontStyle: "600", fill: "#f6f1ea", listening: false }));
  group.add(
    new Text({
      text: sub,
      x: 16,
      y: 50,
      width: 156,
      fontSize: 13,
      fill: "rgba(246,241,234,0.66)",
      listening: false,
    }),
  );
  return group;
}

function seed() {
  const client = card(80, 120, "Client", "Pointer, wheel, keys", "#243044", "#9eb7ff");
  const gateway = card(420, 70, "Scene graph", "Groups, hit testing", "#3a2a22", "#e8a25a");
  const worker = card(760, 180, "Renderer", "Layers and export", "#24342c", "#7dcec4");
  const mark = new Star({
    x: 500,
    y: 310,
    numPoints: 5,
    innerRadius: 16,
    outerRadius: 34,
    fill: "#e8a25a",
    stroke: "#f3ecdf",
    strokeWidth: 1.5,
    name: "Mark",
    draggable: true,
  });
  const note = new Circle({
    x: 250,
    y: 340,
    radius: 46,
    fill: "#342838",
    stroke: "#e7b4d4",
    strokeWidth: 1.5,
    name: "Node",
    draggable: true,
  });
  layer.add(client, gateway, worker, mark, note);
  layer.add(
    new Connector({ from: client, to: gateway, stroke: "#e8a25a", strokeWidth: 2.25 }),
    new Connector({ from: gateway, to: worker, stroke: "#7dcec4", strokeWidth: 2.25 }),
    new Connector({ from: note, to: client, stroke: "#e7b4d4", strokeWidth: 2 }),
  );
  transformer.moveToTop();
}

function snapshot() {
  return JSON.stringify(
    layer
      .getChildren()
      .filter((node) => node !== transformer && node.name() !== "__marquee")
      .map((node) => node.toObject()),
  );
}

function pushHistory() {
  if (lockHistory) return;
  history.push(snapshot());
  if (history.length > 80) history.shift();
  future = [];
}

function restore(json: string) {
  lockHistory = true;
  rubber = null;
  draftLine = null;
  band = null;
  arm = null;
  for (const child of [...layer.getChildren()]) {
    if (child !== transformer) child.destroy();
  }
  const data = JSON.parse(json) as SerializedNode[];
  for (const item of data) layer.add(createNode(item));
  linkConnectors(layer.getChildren());
  transformer.moveToTop();
  prepareTree();
  select([]);
  lockHistory = false;
  stage.batchDraw();
}

function undo() {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop()!);
}

function redo() {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop()!);
}

function prepare(node: Node, insideGroup = false) {
  const group = node instanceof Group;
  if (node instanceof Connector || node instanceof Transformer || node instanceof Grid) node.draggable(false);
  else if (node instanceof Shape || group) {
    node.draggable(tool === "select" && !insideGroup);
    node.dragBoundFunc(snapPos);
  }
  if (node instanceof Group) {
    for (const child of node.getChildren()) prepare(child, true);
  }
}

function prepareTree() {
  for (const child of layer.getChildren()) prepare(child);
}

function selectable(target: Node): Node | null {
  if (target === stage || target instanceof Transformer || target instanceof Grid) return null;
  let node: Node | null = target;
  while (node && node.parent && node.parent !== layer) node = node.parent;
  if (!node || node.parent !== layer || node === transformer || node.name() === "__marquee") return null;
  return node;
}

function select(nodes: Node[]) {
  selected = nodes.filter((node) => node.parent === layer);
  const editable = selected.filter((node) => !(node instanceof Connector));
  transformer.nodes(tool === "select" ? editable : []);
  transformer.listening(tool === "select" && editable.length > 0);
  transformer.moveToTop();
  paintProps();
  stage.batchDraw();
}

function paintProps() {
  quiet = true;
  const node = selected.length === 1 ? selected[0] : null;
  props.hidden = !node;
  propEmpty.hidden = !!node;
  if (selected.length > 1) {
    propEmpty.hidden = false;
    propEmpty.textContent = `${selected.length} shapes selected`;
    props.hidden = true;
  } else if (!node) {
    propEmpty.textContent = "Select a shape, or draw one. Scroll to zoom, space to pan, handles to scale and rotate.";
  }
  document.querySelectorAll<HTMLElement>(".for-text, .for-rect, .for-radius").forEach((el) => {
    el.hidden = true;
  });
  if (node) {
    const paint = paintOf(node);
    $("prop-fill").value = String(paint?.fill() ?? "");
    $("prop-stroke").value = String(paint?.stroke() ?? "");
    $("prop-sw").value = String(paint?.strokeWidth() ?? 1);
    $("prop-x").value = String(Math.round(node.x()));
    $("prop-y").value = String(Math.round(node.y()));
    $("prop-rot").value = String(Math.round(node.rotation()));
    $("prop-op").value = String(node.opacity());
    if (node instanceof Text) {
      show(".for-text");
      $("prop-text").value = node.text();
      $("prop-font").value = String(node.fontSize());
    }
    if (node instanceof Rect) {
      show(".for-rect");
      $("prop-w").value = String(Math.round(node.width()));
      $("prop-h").value = String(Math.round(node.height()));
    }
    if (node instanceof Circle || node instanceof Star) {
      show(".for-radius");
      $("prop-radius").value = String(Math.round(node instanceof Circle ? node.radius() : node.outerRadius()));
    }
  }
  renderLayers();
  quiet = false;
}

function paintOf(node: Node): Shape | null {
  if (node instanceof Shape) return node;
  if (node instanceof Group) {
    const child = node.getChildren().find((item) => item instanceof Rect || item instanceof Shape);
    return child instanceof Shape ? child : null;
  }
  return null;
}

function show(selector: string) {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    el.hidden = false;
  });
}

function renderLayers() {
  layersEl.replaceChildren();
  const items = layer.getChildren().filter((node) => node !== transformer);
  for (const node of [...items].reverse()) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = selected.includes(node) ? "on" : "";
    const label = node.name() || node.className;
    button.append(label);
    if (node instanceof Text) {
      const small = document.createElement("small");
      small.textContent = node.text().slice(0, 18);
      button.append(small);
    }
    button.addEventListener("click", () => {
      setTool("select");
      select([node]);
    });
    li.append(button);
    layersEl.append(li);
  }
}

function setTool(next: Tool) {
  if (draftLine && next !== "line") finishLine();
  tool = next;
  arm = null;
  document.body.dataset.tool = tool;
  stage.forcePanMode(tool === "pan" || space);
  document.querySelectorAll<HTMLButtonElement>(".tool").forEach((button) => {
    button.classList.toggle("on", button.dataset.tool === tool);
  });
  hint.textContent = HINTS[tool];
  prepareTree();
  select(selected);
}

function nextStyle() {
  const index = palette++ % FILLS.length;
  return { fill: FILLS[index], stroke: STROKES[index], strokeWidth: 1.5 };
}

function pointer(event: VizatEvent): Vec {
  return snapPoint(event.pointer ?? { x: 0, y: 0 });
}

function startRubber(p: Vec) {
  pushHistory();
  rubberOrigin = p;
  const style = nextStyle();
  if (tool === "rect") {
    rubber = new Rect({ x: p.x, y: p.y, width: 4, height: 4, cornerRadius: 12, ...style, name: "Rectangle" });
  } else if (tool === "ellipse") {
    rubber = new Ellipse({ x: p.x, y: p.y, radiusX: 2, radiusY: 2, ...style, name: "Ellipse" });
  } else if (tool === "arrow") {
    rubber = new Arrow({
      points: [p.x, p.y, p.x + 1, p.y + 1],
      stroke: style.stroke,
      strokeWidth: 2.5,
      hitStrokeWidth: 14,
      name: "Arrow",
    });
  }
  if (!rubber) return;
  layer.add(rubber);
  prepare(rubber);
  transformer.moveToTop();
}

function updateRubber(p: Vec) {
  if (!rubber || !rubberOrigin) return;
  const x = Math.min(rubberOrigin.x, p.x);
  const y = Math.min(rubberOrigin.y, p.y);
  const w = Math.max(1, Math.abs(p.x - rubberOrigin.x));
  const h = Math.max(1, Math.abs(p.y - rubberOrigin.y));
  if (rubber instanceof Rect) {
    rubber.position({ x, y });
    rubber.width(w);
    rubber.height(h);
  } else if (rubber instanceof Ellipse) {
    rubber.position({ x: x + w / 2, y: y + h / 2 });
    rubber.radiusX(Math.max(1, w / 2));
    rubber.radiusY(Math.max(1, h / 2));
  } else if (rubber instanceof Arrow) {
    rubber.points([rubberOrigin.x, rubberOrigin.y, p.x, p.y]);
  }
}

function finishRubber() {
  if (!rubber || !rubberOrigin) return;
  if (rubber instanceof Rect && (rubber.width() < 8 || rubber.height() < 8)) {
    rubber.width(160);
    rubber.height(96);
  } else if (rubber instanceof Ellipse && rubber.radiusX() < 6) {
    rubber.radiusX(56);
    rubber.radiusY(40);
  } else if (rubber instanceof Arrow) {
    const pts = rubber.points();
    if (Math.hypot(pts[2] - pts[0], pts[3] - pts[1]) < 8) rubber.points([pts[0], pts[1], pts[0] + 160, pts[1] + 40]);
  }
  const created = rubber;
  rubber = null;
  rubberOrigin = null;
  setTool("select");
  select([created]);
}

function addLinePoint(p: Vec) {
  if (!draftLine) {
    pushHistory();
    const style = nextStyle();
    draftLine = new Line({
      points: [p.x, p.y, p.x, p.y],
      stroke: style.stroke,
      strokeWidth: 2.5,
      hitStrokeWidth: 14,
      name: "Line",
    });
    layer.add(draftLine);
    prepare(draftLine);
    transformer.moveToTop();
    return;
  }
  const pts = draftLine.points();
  pts[pts.length - 2] = p.x;
  pts[pts.length - 1] = p.y;
  pts.push(p.x, p.y);
  draftLine.points(pts);
}

function finishLine() {
  if (!draftLine) return;
  let pts = draftLine.points().slice();
  while (pts.length >= 4) {
    const n = pts.length;
    if (Math.hypot(pts[n - 2] - pts[n - 4], pts[n - 1] - pts[n - 3]) >= 3) break;
    pts = pts.slice(0, -2);
  }
  const line = draftLine;
  draftLine = null;
  if (pts.length < 4) line.destroy();
  else {
    line.points(pts);
    setTool("select");
    select([line]);
  }
}

function connect(target: Node) {
  const node = selectable(target);
  if (!node || node instanceof Connector || node instanceof Line || node instanceof Arrow) {
    arm = null;
    return;
  }
  if (!arm) {
    arm = node;
    hint.textContent = `Connect from ${node.name() || node.className} — click the target`;
    return;
  }
  if (arm === node || !arm.parent) {
    arm = null;
    return;
  }
  pushHistory();
  const link = new Connector({
    from: arm,
    to: node,
    stroke: "#e8a25a",
    strokeWidth: 2.25,
    name: "Link",
  });
  layer.add(link);
  prepare(link);
  arm = null;
  setTool("select");
  select([link]);
}

function startMarquee(p: Vec) {
  bandOrigin = p;
  band = new Rect({
    x: p.x,
    y: p.y,
    width: 0,
    height: 0,
    fill: "rgba(158,183,255,0.12)",
    stroke: "#9eb7ff",
    dash: [5, 4],
    listening: false,
    name: "__marquee",
  });
  layer.add(band);
  transformer.moveToTop();
}

function boxOf(node: Node) {
  const rect = node.getSelfRect();
  const corners = [
    node.localTo(layer, rect.x, rect.y),
    node.localTo(layer, rect.x + rect.width, rect.y),
    node.localTo(layer, rect.x + rect.width, rect.y + rect.height),
    node.localTo(layer, rect.x, rect.y + rect.height),
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const corner of corners) {
    minX = Math.min(minX, corner.x);
    minY = Math.min(minY, corner.y);
    maxX = Math.max(maxX, corner.x);
    maxY = Math.max(maxY, corner.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function finishMarquee() {
  if (!band || !bandOrigin) return;
  const box = { x: band.x(), y: band.y(), width: band.width(), height: band.height() };
  band.destroy();
  band = null;
  bandOrigin = null;
  if (box.width < 4 && box.height < 4) return;
  const hits = layer.getChildren().filter((node) => {
    if (node === transformer || node.name() === "__marquee") return false;
    const b = boxOf(node);
    return b.x < box.x + box.width && b.x + b.width > box.x && b.y < box.y + box.height && b.y + b.height > box.y;
  });
  select(hits);
}

function placeText(p: Vec) {
  pushHistory();
  const text = new Text({
    x: p.x,
    y: p.y,
    text: "Text",
    fontSize: 28,
    fontStyle: "600",
    fill: "#f3ecdf",
    name: "Text",
  });
  layer.add(text);
  prepare(text);
  setTool("select");
  select([text]);
  $("prop-text")?.focus();
  $("prop-text")?.select();
}

function isInside(root: Node, target: Node | null): boolean {
  let node = target;
  while (node) {
    if (node === root) return true;
    node = node.parent;
  }
  return false;
}

function removeSelected() {
  if (!selected.length) return;
  pushHistory();
  const doomed = new Set(selected);
  for (const node of [...layer.getChildren()]) {
    if (!(node instanceof Connector)) continue;
    if ([...doomed].some((item) => isInside(item, node.from()) || isInside(item, node.to()))) node.destroy();
  }
  for (const node of doomed) node.destroy();
  select([]);
}

function duplicate() {
  if (!selected.length) return;
  pushHistory();
  const copies: Node[] = [];
  for (const node of selected) {
    const data = shiftCopy(node.toObject(), true);
    const copy = createNode(data);
    layer.add(copy);
    copies.push(copy);
  }
  linkConnectors(layer.getChildren());
  prepareTree();
  transformer.moveToTop();
  select(copies);
}

function shiftCopy(data: SerializedNode, shift: boolean): SerializedNode {
  const attrs = { ...data.attrs };
  delete attrs.id;
  if (shift) {
    attrs.x = Number(attrs.x ?? 0) + 24;
    attrs.y = Number(attrs.y ?? 0) + 24;
  }
  return {
    className: data.className,
    attrs,
    children: data.children?.map((child) => shiftCopy(child, false)),
  };
}

function fitContent() {
  const nodes = layer.getChildren().filter((node) => node !== transformer);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const box = boxOf(node);
    if (!Number.isFinite(box.x)) continue;
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  if (!Number.isFinite(minX) || stage.width() < 40) {
    stage.resetView();
    return;
  }
  const pad = 72;
  const scale = Math.max(0.2, Math.min(1.4, Math.min((stage.width() - pad * 2) / (maxX - minX), (stage.height() - pad * 2) / (maxY - minY))));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  stage.scale({ x: scale, y: scale });
  stage.position({ x: stage.width() / 2 - cx * scale, y: stage.height() / 2 - cy * scale });
  updateZoom();
}

function updateZoom() {
  const label = document.getElementById("zoom-label");
  if (label) label.textContent = `${Math.round(stage.scaleX() * 100)}%`;
}

function refreshLinks() {
  for (const node of layer.getChildren()) {
    if (node instanceof Connector) node.refresh();
  }
}

stage.on("pointerdown", (event) => {
  if (tool === "pan" || space) return;
  const p = pointer(event);
  if (tool === "select") {
    const node = selectable(event.target);
    const shift = !!(event.evt as MouseEvent | null)?.shiftKey;
    if (node) {
      if (shift) select(selected.includes(node) ? selected.filter((item) => item !== node) : [...selected, node]);
      else if (!selected.includes(node)) select([node]);
      return;
    }
    if (!shift) select([]);
    startMarquee(p);
    return;
  }
  if (tool === "rect" || tool === "ellipse" || tool === "arrow") startRubber(p);
  if (tool === "connector") connect(event.target);
});

stage.on("pointermove", (event) => {
  const raw = event.pointer ?? { x: 0, y: 0 };
  coords.textContent = `${Math.round(raw.x)}, ${Math.round(raw.y)}`;
  const p = snapPoint(raw);
  if (band) {
    const x = Math.min(bandOrigin!.x, p.x);
    const y = Math.min(bandOrigin!.y, p.y);
    band.position({ x, y });
    band.width(Math.abs(p.x - bandOrigin!.x));
    band.height(Math.abs(p.y - bandOrigin!.y));
  }
  if (rubber) updateRubber(p);
  if (draftLine) {
    const pts = draftLine.points();
    pts[pts.length - 2] = p.x;
    pts[pts.length - 1] = p.y;
    draftLine.points(pts);
  }
});

stage.on("pointerup", () => {
  if (band) finishMarquee();
  if (rubber) finishRubber();
});

stage.on("click", (event) => {
  if (tool === "line") addLinePoint(pointer(event));
  if (tool === "text") placeText(pointer(event));
});

stage.on("dblclick", () => {
  if (tool === "line") finishLine();
});

stage.on("wheel", () => updateZoom());
layer.on("dragstart transformstart", () => pushHistory());
layer.on("dragend transformend", () => refreshLinks());

function bindNumber(id: string, apply: (node: Node, value: number) => void) {
  $(id).addEventListener("focus", () => pushHistory());
  $(id).addEventListener("input", () => {
    if (quiet || selected.length !== 1) return;
    apply(selected[0], Number($(id).value));
    refreshLinks();
  });
}

bindNumber("prop-x", (node, value) => node.x(value));
bindNumber("prop-y", (node, value) => node.y(value));
bindNumber("prop-rot", (node, value) => node.rotation(value));
bindNumber("prop-sw", (node, value) => {
  paintOf(node)?.strokeWidth(value);
});
bindNumber("prop-w", (node, value) => {
  if (node instanceof Rect) node.width(value);
});
bindNumber("prop-h", (node, value) => {
  if (node instanceof Rect) node.height(value);
});
bindNumber("prop-font", (node, value) => {
  if (node instanceof Text) node.fontSize(value);
});
bindNumber("prop-radius", (node, value) => {
  if (node instanceof Circle) node.radius(value);
  if (node instanceof Star) node.outerRadius(value);
});

$("prop-op").addEventListener("input", () => {
  if (quiet || selected.length !== 1) return;
  selected[0].opacity(Number($("prop-op").value));
});
$("prop-fill").addEventListener("input", () => {
  if (quiet || selected.length !== 1) return;
  paintOf(selected[0])?.fill($("prop-fill").value);
});
$("prop-stroke").addEventListener("input", () => {
  if (quiet || selected.length !== 1) return;
  paintOf(selected[0])?.stroke($("prop-stroke").value);
});
$("prop-text").addEventListener("focus", () => pushHistory());
$("prop-text").addEventListener("input", () => {
  if (quiet || !(selected[0] instanceof Text)) return;
  selected[0].text($("prop-text").value);
  renderLayers();
});
$("prop-fill").addEventListener("focus", () => pushHistory());
$("prop-stroke").addEventListener("focus", () => pushHistory());

document.getElementById("raise")?.addEventListener("click", () => {
  pushHistory();
  selected.forEach((node) => node.moveUp());
  transformer.moveToTop();
  renderLayers();
});
document.getElementById("lower")?.addEventListener("click", () => {
  pushHistory();
  selected.forEach((node) => node.moveDown());
  transformer.moveToTop();
  renderLayers();
});

document.querySelectorAll<HTMLButtonElement>(".tool").forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool as Tool));
});

document.getElementById("zoom-in")?.addEventListener("click", () => {
  stage.zoomAt(1.12);
  updateZoom();
});
document.getElementById("zoom-out")?.addEventListener("click", () => {
  stage.zoomAt(1 / 1.12);
  updateZoom();
});
document.getElementById("zoom-label")?.addEventListener("click", () => {
  stage.resetView();
  updateZoom();
});
document.getElementById("zoom-fit")?.addEventListener("click", () => fitContent());
document.getElementById("snap")?.addEventListener("click", () => {
  snap = !snap;
  document.getElementById("snap")?.setAttribute("aria-pressed", String(snap));
});
document.getElementById("undo")?.addEventListener("click", () => undo());
document.getElementById("redo")?.addEventListener("click", () => redo());
document.getElementById("duplicate")?.addEventListener("click", () => duplicate());
document.getElementById("delete")?.addEventListener("click", () => removeSelected());
document.getElementById("export")?.addEventListener("click", () => {
  const url = stage.toDataURL({ background: "#12110f" });
  const link = document.createElement("a");
  link.href = url;
  link.download = "vizat.png";
  link.click();
});

window.addEventListener("keydown", (event) => {
  if (typingTarget(event.target)) {
    if (event.key === "Escape") (event.target as HTMLElement).blur();
    return;
  }
  const meta = event.metaKey || event.ctrlKey;
  if (event.code === "Space") {
    event.preventDefault();
    space = true;
    document.body.classList.add("is-space");
    stage.forcePanMode(true);
    return;
  }
  if (meta && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
    return;
  }
  if (meta && event.key.toLowerCase() === "d") {
    event.preventDefault();
    duplicate();
    return;
  }
  if (event.key === "Escape") {
    if (draftLine) undo();
    arm = null;
    select([]);
    return;
  }
  if (event.key === "Enter" && tool === "line") finishLine();
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    removeSelected();
  }
  const nudge = event.shiftKey ? 10 : 1;
  if (selected.length && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
    pushHistory();
    for (const node of selected) {
      if (event.key === "ArrowLeft") node.x(node.x() - nudge);
      if (event.key === "ArrowRight") node.x(node.x() + nudge);
      if (event.key === "ArrowUp") node.y(node.y() - nudge);
      if (event.key === "ArrowDown") node.y(node.y() + nudge);
    }
    refreshLinks();
    paintProps();
  }
  if (meta || event.altKey) return;
  const keys: Record<string, Tool> = { v: "select", h: "pan", r: "rect", o: "ellipse", t: "text", l: "line", a: "arrow", c: "connector" };
  const next = keys[event.key.toLowerCase()];
  if (next) setTool(next);
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    space = false;
    document.body.classList.remove("is-space");
    stage.forcePanMode(tool === "pan");
  }
});

board.addEventListener("pointerdown", () => {
  if (tool === "pan" || space) document.body.classList.add("is-panning");
}, true);
window.addEventListener("pointerup", () => document.body.classList.remove("is-panning"));

seed();
prepareTree();
stage.resizeToContainer();
const tryFit = () => {
  if (fitted || stage.width() < 80 || stage.height() < 80) return;
  fitted = true;
  fitContent();
};
requestAnimationFrame(() => requestAnimationFrame(tryFit));
if (typeof ResizeObserver !== "undefined") new ResizeObserver(() => tryFit()).observe(board);
document.fonts?.ready.then(() => stage.batchDraw());
setTool("select");
updateZoom();
