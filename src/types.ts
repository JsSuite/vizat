import type { Gradient } from "./Gradient.js";
import type { Vec } from "./math.js";

export type { Vec, Box } from "./math.js";

export type Paint = string | Gradient;

export interface NodeConfig {
  id?: string;
  name?: string;
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  visible?: boolean;
  draggable?: boolean;
  listening?: boolean;
  dragBoundFunc?: (pos: Vec) => Vec;
}

export interface ShapeConfig extends NodeConfig {
  fill?: Paint;
  stroke?: Paint;
  strokeWidth?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  dash?: number[];
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  hitStrokeWidth?: number;
}

export interface RectConfig extends ShapeConfig {
  width?: number;
  height?: number;
  cornerRadius?: number;
}

export interface EllipseConfig extends ShapeConfig {
  radiusX?: number;
  radiusY?: number;
}

export interface CircleConfig extends ShapeConfig {
  radius?: number;
}

export interface LineConfig extends ShapeConfig {
  points?: number[];
}

export interface ArrowConfig extends LineConfig {
  pointerLength?: number;
  pointerWidth?: number;
  pointerAtBeginning?: boolean;
}

export interface TextConfig extends ShapeConfig {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  align?: CanvasTextAlign;
  width?: number;
  lineHeight?: number;
}

export interface ImageConfig extends ShapeConfig {
  image?: CanvasImageSource;
  width?: number;
  height?: number;
}

export interface StarConfig extends ShapeConfig {
  numPoints?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export interface CurveConfig extends ShapeConfig {
  points?: number[];
  curve?: "quadratic" | "bezier";
}

export interface StageConfig {
  container: string | HTMLElement;
  width?: number;
  height?: number;
  background?: string;
  wheelZoom?: boolean;
  minScale?: number;
  maxScale?: number;
  pixelRatio?: number;
}

export interface SerializedNode {
  className: string;
  attrs: Record<string, unknown>;
  children?: SerializedNode[];
}

export interface PointerMods {
  shift?: boolean;
  alt?: boolean;
}
