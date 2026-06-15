export type GradientConfig = {
  type?: "linear" | "radial";
  colors?: [number, string][];
  points?: number[];
};

export class Gradient {
  type: "linear" | "radial";
  colors: [number, string][];
  points: number[];

  constructor(config: GradientConfig = {}) {
    this.type = config.type ?? "linear";
    this.colors = config.colors ?? [];
    this.points = config.points ?? [];
  }

  getGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
    const gradient =
      this.type === "radial"
        ? ctx.createRadialGradient(...(this.points as [number, number, number, number, number, number]))
        : ctx.createLinearGradient(...(this.points as [number, number, number, number]));

    for (const [offset, color] of this.colors) {
      gradient.addColorStop(offset, color);
    }
    return gradient;
  }
}
