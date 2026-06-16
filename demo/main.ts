import {
  Canvas,
  Wrapper,
  Line,
  Text,
} from "vizat";
import { createInteraction, defaultShapes, drawShapes } from "./interaction";

const config = { height: "68vh", width: "100%", background: "#f8fafc" };

const wrapper = new Wrapper("vizat-container", config);
const canvas = new Canvas(config);
wrapper.add(canvas);

const shapes = defaultShapes();
let interaction: ReturnType<typeof createInteraction> | null = null;

function render() {
  canvas.clear();

  canvas.add(
    new Line({
      points: [[40, 40], [180, 40]],
      options: { strokeStyle: "#cbd5e1", lineWidth: 1 },
    })
  );

  canvas.add(
    new Text({
      text: "Drag shapes · snap 8px grid",
      x: 48,
      y: 36,
      options: { fillStyle: "#64748b", font: "500 13px Inter, sans-serif" },
    })
  );

  canvas.draw();

  const canvasEl = document.querySelector<HTMLCanvasElement>("#vizat-container canvas");
  if (!canvasEl) return;

  const ctx = canvasEl.getContext("2d");
  if (!ctx) return;

  drawShapes(ctx, shapes);
  interaction?.drawOverlay(ctx);

  if (!interaction) {
    interaction = createInteraction(canvasEl, shapes, render);
  }
}

render();

document.getElementById("btn-redraw")?.addEventListener("click", () => {
  shapes.splice(0, shapes.length, ...defaultShapes());
  shapes.forEach((s) => { s.selected = false; });
  render();
});

document.getElementById("btn-clear")?.addEventListener("click", () => {
  shapes.length = 0;
  render();
});

document.getElementById("btn-add-rect")?.addEventListener("click", () => {
  shapes.push({
    id: `r${Date.now()}`,
    kind: "rect",
    x: 120 + shapes.length * 16,
    y: 240,
    width: 120,
    height: 88,
    fill: "rgba(99,102,241,0.12)",
    stroke: "#6366f1",
  });
  render();
});
