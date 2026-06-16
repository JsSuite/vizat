/**
 * Playground interaction layer — demo-only, preserves vizat render-only core.
 * Supports drag + selection for rects and circles on the canvas.
 */

export type DraggableShape = {
  id: string;
  kind: "rect" | "circle";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
  stroke: string;
  selected?: boolean;
};

const GRID = 8;

function snap(n: number) {
  return Math.round(n / GRID) * GRID;
}

function hitTest(shape: DraggableShape, px: number, py: number): boolean {
  if (shape.kind === "rect") {
    const w = shape.width ?? 0;
    const h = shape.height ?? 0;
    return px >= shape.x && px <= shape.x + w && py >= shape.y && py <= shape.y + h;
  }
  const dx = px - shape.x;
  const dy = py - shape.y;
  return Math.hypot(dx, dy) <= (shape.radius ?? 0);
}

export function createInteraction(canvasEl: HTMLCanvasElement, shapes: DraggableShape[], onChange: () => void) {
  let selectedId: string | null = null;
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  function pointerPos(e: PointerEvent) {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function selectAt(px: number, py: number) {
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (hitTest(shapes[i], px, py)) {
        selectedId = shapes[i].id;
        shapes.forEach((s) => { s.selected = s.id === selectedId; });
        return shapes[i];
      }
    }
    selectedId = null;
    shapes.forEach((s) => { s.selected = false; });
    return null;
  }

  canvasEl.addEventListener("pointerdown", (e) => {
    const { x, y } = pointerPos(e);
    const hit = selectAt(x, y);
    if (!hit) {
      onChange();
      return;
    }
    dragging = true;
    offsetX = x - hit.x;
    offsetY = y - (hit.kind === "circle" ? hit.y : hit.y);
    canvasEl.setPointerCapture(e.pointerId);
    onChange();
  });

  canvasEl.addEventListener("pointermove", (e) => {
    if (!dragging || !selectedId) return;
    const shape = shapes.find((s) => s.id === selectedId);
    if (!shape) return;
    const { x, y } = pointerPos(e);
    shape.x = snap(x - offsetX);
    shape.y = snap(y - offsetY);
    onChange();
  });

  canvasEl.addEventListener("pointerup", () => {
    dragging = false;
  });

  return {
    drawOverlay(ctx: CanvasRenderingContext2D) {
      for (const shape of shapes) {
        if (!shape.selected) continue;
        ctx.save();
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        if (shape.kind === "rect") {
          ctx.strokeRect(shape.x - 4, shape.y - 4, (shape.width ?? 0) + 8, (shape.height ?? 0) + 8);
        } else {
          ctx.beginPath();
          ctx.arc(shape.x, shape.y, (shape.radius ?? 0) + 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    },
    getShapes: () => shapes,
  };
}

export function defaultShapes(): DraggableShape[] {
  return [
    { id: "r1", kind: "rect", x: 80, y: 80, width: 160, height: 120, fill: "rgba(37,99,235,0.15)", stroke: "#2563eb" },
    { id: "r2", kind: "rect", x: 320, y: 140, width: 140, height: 100, fill: "rgba(234,88,12,0.12)", stroke: "#ea580c" },
    { id: "c1", kind: "circle", x: 560, y: 160, radius: 56, fill: "rgba(5,150,105,0.15)", stroke: "#059669" },
  ];
}

export function drawShapes(ctx: CanvasRenderingContext2D, shapes: DraggableShape[]) {
  for (const s of shapes) {
    ctx.save();
    ctx.fillStyle = s.fill;
    ctx.strokeStyle = s.stroke;
    ctx.lineWidth = 2;
    if (s.kind === "rect") {
      ctx.fillRect(s.x, s.y, s.width ?? 0, s.height ?? 0);
      ctx.strokeRect(s.x, s.y, s.width ?? 0, s.height ?? 0);
    } else {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius ?? 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}
