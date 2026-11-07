import { vi } from "vitest";

const base: Record<string, unknown> = {
  measureText: (text: string) => ({ width: [...String(text)].length * 8 }),
  getLineDash: () => [] as number[],
  createLinearGradient: () => ({ addColorStop() {} }),
  createRadialGradient: () => ({ addColorStop() {} }),
  globalAlpha: 1,
  lineWidth: 1,
  fillStyle: "#000",
  strokeStyle: "#000",
  font: "16px sans-serif",
  textAlign: "left",
  textBaseline: "alphabetic",
  lineCap: "butt",
  lineJoin: "miter",
  shadowColor: "transparent",
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
};

function makeCtx() {
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      if (typeof prop !== "string") return undefined;
      const fn = vi.fn();
      target[prop] = fn;
      return fn;
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  });
}

const ctx = makeCtx();

HTMLCanvasElement.prototype.getContext = vi.fn((type: string) =>
  type === "2d" ? ctx : null,
) as typeof HTMLCanvasElement.prototype.getContext;
