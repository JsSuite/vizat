import { Circle, Connector, Group, Layer, Rect, Stage, Star, Text } from "vizat";

const host = document.getElementById("hero-stage");
if (host) {
  const stage = new Stage({ container: host, background: "#191714", wheelZoom: true });
  const layer = new Layer();
  stage.add(layer);

  const note = new Group({ x: 36, y: 70, draggable: true });
  note.add(
    new Rect({
      width: 150,
      height: 92,
      cornerRadius: 16,
      fill: "#243044",
      stroke: "#9eb7ff",
      strokeWidth: 1.5,
      shadowColor: "rgba(0,0,0,0.35)",
      shadowBlur: 18,
      shadowOffsetY: 8,
    }),
    new Text({ x: 16, y: 30, text: "Drag me", fontSize: 18, fontStyle: "600", fill: "#f6f1ea", listening: false }),
  );
  const engine = new Group({ x: 250, y: 48, draggable: true });
  engine.add(
    new Rect({
      width: 160,
      height: 96,
      cornerRadius: 16,
      fill: "#3a2a22",
      stroke: "#e8a25a",
      strokeWidth: 1.5,
      shadowColor: "rgba(0,0,0,0.35)",
      shadowBlur: 18,
      shadowOffsetY: 8,
    }),
    new Text({ x: 18, y: 34, text: "Vizat 3", fontSize: 20, fontStyle: "600", fill: "#f6f1ea", listening: false }),
  );
  const dot = new Circle({
    x: 150,
    y: 250,
    radius: 36,
    fill: "#24342c",
    stroke: "#7dcec4",
    strokeWidth: 1.5,
    draggable: true,
  });
  const mark = new Star({
    x: 330,
    y: 230,
    innerRadius: 14,
    outerRadius: 30,
    fill: "#e8a25a",
    draggable: true,
  });
  layer.add(
    note,
    engine,
    dot,
    mark,
    new Connector({ from: note, to: engine, stroke: "#e8a25a", strokeWidth: 2 }),
    new Connector({ from: dot, to: note, stroke: "#7dcec4", strokeWidth: 2 }),
  );
  stage.resizeToContainer();
}
