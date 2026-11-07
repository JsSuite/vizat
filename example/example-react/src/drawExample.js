import { Stage, Layer, Rect, Circle, Arrow } from "vizat";

/** Vizat 3 — the v2 Wrapper/Canvas draw list is gone. */
export function drawExample() {
  const stage = new Stage({
    container: "viz-container",
    width: 800,
    height: 480,
    background: "#12110f",
  });
  const layer = new Layer();
  stage.add(layer);
  layer.add(
    new Rect({
      x: 48,
      y: 48,
      width: 160,
      height: 100,
      cornerRadius: 12,
      fill: "#243044",
      stroke: "#e8a25a",
      draggable: true,
    }),
    new Circle({ x: 320, y: 120, radius: 48, fill: "#24342c", stroke: "#7dcec4", draggable: true }),
    new Arrow({ points: [220, 100, 270, 120], stroke: "#e8a25a", strokeWidth: 2 }),
  );
}
