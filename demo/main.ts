import {
  Canvas,
  Wrapper,
  Line,
  Rect,
  Circle,
  Curve,
  Text,
  Gradient,
} from "@jssuite/vizat";

const primary = "blueviolet";
const secondary = "deeppink";
const config = { height: "70vh", width: "100vw", background: "#1a1a2e" };

const wrapper = new Wrapper("vizat-container", config);
const canvas = new Canvas(config);
wrapper.add(canvas);

function drawDemo() {
  canvas.clear();

  canvas.add(
    new Line({
      points: [
        [80, 80],
        [200, 180],
        [320, 100],
      ],
      options: { strokeStyle: primary, lineWidth: 8, lineCap: "round" },
    })
  );

  canvas.add(
    new Rect({
      x: 360,
      y: 60,
      width: 140,
      height: 120,
      options: { strokeStyle: primary, lineWidth: 6, fillStyle: "rgba(138,43,226,0.3)" },
    })
  );

  canvas.add(
    new Circle({
      x: 580,
      y: 120,
      radius: 60,
      options: { fillStyle: secondary, strokeStyle: primary, lineWidth: 4 },
    })
  );

  canvas.add(
    new Curve({
      type: "bezier",
      points: [[80, 280, 200, 200, 360, 320]],
      options: { strokeStyle: secondary, lineWidth: 6 },
    })
  );

  canvas.add(
    new Text({
      text: "Vizat 2",
      x: 400,
      y: 280,
      options: { fillStyle: primary, font: "bold 72px Inter, sans-serif" },
    })
  );

  const grad = new Gradient({
    type: "linear",
    colors: [
      [0, secondary],
      [1, primary],
    ],
    points: [520, 220, 720, 380],
  });

  canvas.add(
    new Rect({
      x: 520,
      y: 240,
      width: 200,
      height: 140,
      options: { fillStyle: grad },
    })
  );

  canvas.draw();
}

drawDemo();

document.getElementById("btn-redraw")?.addEventListener("click", drawDemo);
document.getElementById("btn-clear")?.addEventListener("click", () => {
  canvas.clear();
  canvas.draw();
});
