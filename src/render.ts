import { Container } from "./Container.js";
import type { Vec } from "./math.js";
import { Node } from "./Node.js";
import { Shape } from "./Shape.js";

export function renderNode(ctx: CanvasRenderingContext2D, node: Node): void {
  if (!node.visible()) return;
  ctx.save();
  const matrix = node.getTransform();
  ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
  const opacity = node.opacity();
  if (opacity !== 1) ctx.globalAlpha *= opacity;
  if (node instanceof Shape) node.drawShape(ctx);
  if (node instanceof Container) {
    for (const child of node.getChildren()) renderNode(ctx, child);
  }
  ctx.restore();
}

export function hitTest(node: Node, screen: Vec): Node | null {
  if (!node.visible() || !node.listening()) return null;
  if (node instanceof Container) {
    const children = node.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const hit = hitTest(children[i], screen);
      if (hit) return hit;
    }
    return null;
  }
  if (node instanceof Shape) {
    const local = node.screenToLocal(screen.x, screen.y);
    if (node.intersects(local)) return node;
  }
  return null;
}
