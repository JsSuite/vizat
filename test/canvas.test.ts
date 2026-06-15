import { describe, expect, it } from "vitest";
import { Canvas, Rect, Line } from "../src/index.js";

describe("Canvas scene tree", () => {
  it("adds shapes and draws without error", () => {
    const canvas = new Canvas({ width: "400px", height: "300px", background: "#111" });
    canvas.add(
      new Rect({
        x: 10,
        y: 10,
        width: 80,
        height: 60,
        options: { fillStyle: "blueviolet" },
      })
    );
    canvas.add(
      new Line({
        points: [
          [0, 0],
          [100, 100],
        ],
        options: { strokeStyle: "deeppink", lineWidth: 4 },
      })
    );
    expect(() => canvas.draw()).not.toThrow();
    expect(canvas.getCanvas().width).toBeGreaterThan(0);
  });

  it("clears items", () => {
    const canvas = new Canvas({ width: "200px", height: "200px" });
    canvas.add(new Rect({ x: 0, y: 0, width: 50, height: 50, options: { fillStyle: "#fff" } }));
    canvas.clear();
    expect(() => canvas.draw()).not.toThrow();
  });
});
