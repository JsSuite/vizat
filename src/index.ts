import { register } from "./factory.js";
import { Group } from "./Group.js";
import { Layer } from "./Layer.js";
import { Stage } from "./Stage.js";
import { Connector } from "./Connector.js";
import { Transformer } from "./Transformer.js";
import { Arrow, Circle, Curve, Ellipse, ImageShape, Line, Rect, Star, Text } from "./shapes.js";

export { Matrix } from "./math.js";
export { Node, VizatEvent } from "./Node.js";
export type { Handler } from "./Node.js";
export { Container } from "./Container.js";
export { Shape } from "./Shape.js";
export { Group } from "./Group.js";
export { Layer } from "./Layer.js";
export { Stage } from "./Stage.js";
export { Transformer } from "./Transformer.js";
export { Connector } from "./Connector.js";
export { Gradient } from "./Gradient.js";
export { Rect, Circle, Ellipse, Line, Arrow, Text, ImageShape, ImageShape as Image, Star, Curve };
export { createNode, linkConnectors } from "./factory.js";
export type {
  NodeConfig,
  ShapeConfig,
  RectConfig,
  CircleConfig,
  EllipseConfig,
  LineConfig,
  ArrowConfig,
  TextConfig,
  ImageConfig,
  StarConfig,
  CurveConfig,
  StageConfig,
  SerializedNode,
  Paint,
  Vec,
  Box,
} from "./types.js";

register("Group", Group as never);
register("Rect", Rect as never);
register("Circle", Circle as never);
register("Ellipse", Ellipse as never);
register("Line", Line as never);
register("Arrow", Arrow as never);
register("Text", Text as never);
register("Image", ImageShape as never);
register("Star", Star as never);
register("Curve", Curve as never);
register("Connector", Connector as never);

export const Vizat = {
  Stage,
  Layer,
  Group,
  Rect,
  Circle,
  Ellipse,
  Line,
  Arrow,
  Text,
  Image: ImageShape,
  Star,
  Curve,
  Transformer,
  Connector,
};

declare global {
  interface Window {
    VIZAT: typeof Vizat;
  }
}

if (typeof window !== "undefined") window.VIZAT = Vizat;

export default Vizat;
