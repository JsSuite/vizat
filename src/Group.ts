import { Container } from "./Container.js";
import type { Box } from "./math.js";
import type { NodeConfig } from "./types.js";

export class Group extends Container {
  static override className = "Group";

  constructor(config: NodeConfig = {}) {
    super(config);
  }

  override getSelfRect(): Box {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const child of this.children) {
      const rect = child.getSelfRect();
      const matrix = child.getTransform();
      const corners = [
        [rect.x, rect.y],
        [rect.x + rect.width, rect.y],
        [rect.x + rect.width, rect.y + rect.height],
        [rect.x, rect.y + rect.height],
      ];
      for (const [x, y] of corners) {
        const point = matrix.point(x, y);
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    }
    if (!Number.isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}
