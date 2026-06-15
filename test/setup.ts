import { vi } from "vitest";

const mockCtx = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  quadraticCurveTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  strokeText: vi.fn(),
  fillText: vi.fn(),
  drawImage: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  setLineDash: vi.fn(),
  getLineDash: vi.fn(() => []),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
} as unknown as CanvasRenderingContext2D;

HTMLCanvasElement.prototype.getContext = vi.fn((type: string) =>
  type === "2d" ? mockCtx : null
) as typeof HTMLCanvasElement.prototype.getContext;
