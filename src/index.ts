export { Canvas } from "./Canvas.js";
export { Wrapper } from "./Wrapper.js";
export { Drawable } from "./Drawable.js";
export { Line } from "./Line.js";
export { Rect } from "./Rect.js";
export { Circle } from "./Circle.js";
export { Curve } from "./Curve.js";
export { Text } from "./Text.js";
export { Gradient } from "./Gradient.js";
export { ImageShape, Image } from "./Image.js";
export type { CanvasOptions, ShapeOptions, DrawableItem } from "./types.js";

import { Canvas } from "./Canvas.js";
import { Wrapper } from "./Wrapper.js";
import { Line } from "./Line.js";
import { Rect } from "./Rect.js";
import { Circle } from "./Circle.js";
import { Curve } from "./Curve.js";
import { Text } from "./Text.js";
import { Gradient } from "./Gradient.js";
import { Image } from "./Image.js";

export const Vizat = { Wrapper, Canvas, Line, Rect, Circle, Curve, Text, Gradient, Image };

declare global {
  interface Window {
    VIZAT: typeof Vizat;
  }
}

if (typeof window !== "undefined") {
  window.VIZAT = Vizat;
}
