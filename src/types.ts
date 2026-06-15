export type CanvasOptions = Record<string, string | number | undefined>;

export type ShapeOptions = Partial<
  Pick<
    CanvasRenderingContext2D,
    | "strokeStyle"
    | "fillStyle"
    | "lineWidth"
    | "lineCap"
    | "font"
    | "shadowColor"
    | "shadowBlur"
    | "shadowOffsetX"
    | "shadowOffsetY"
  >
> & {
  dash?: number[];
  rotation?: number;
};

export interface DrawableItem {
  draw(ctx: CanvasRenderingContext2D): void;
}
