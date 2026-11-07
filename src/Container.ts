import { Node } from "./Node.js";
import type { SerializedNode } from "./types.js";

export class Container extends Node {
  static override className = "Container";
  children: Node[] = [];

  add(...nodes: Node[]): this {
    for (const node of nodes) {
      node.remove();
      node.parent = this;
      this.children.push(node);
    }
    this.liftTransient();
    for (const node of nodes) {
      const linked = node as Node & { refresh?: () => void };
      if (node.className === "Connector" && typeof linked.refresh === "function") linked.refresh();
    }
    this.requestDraw();
    return this;
  }

  removeChild(node: Node): this {
    const index = this.children.indexOf(node);
    if (index >= 0) {
      this.children.splice(index, 1);
      node.parent = null;
      this.requestDraw();
    }
    return this;
  }

  getChildren(): Node[] {
    return this.children.slice();
  }

  liftTransient(): void {
    const transient = this.children.filter((child) => (child.constructor as typeof Node).transient);
    if (!transient.length) return;
    const rest = this.children.filter((child) => !(child.constructor as typeof Node).transient);
    this.children = rest.concat(transient);
  }

  find(selector: string): Node[] {
    const out: Node[] = [];
    const walk = (node: Node) => {
      if (matches(node, selector)) out.push(node);
      if (node instanceof Container) node.children.forEach(walk);
    };
    this.children.forEach(walk);
    return out;
  }

  findOne(selector: string): Node | undefined {
    return this.find(selector)[0];
  }

  override destroy(): void {
    for (const child of [...this.children]) child.destroy();
    super.destroy();
  }

  override toObject(): SerializedNode {
    const data = super.toObject();
    data.children = this.children
      .filter((child) => !(child.constructor as typeof Node).transient)
      .map((child) => child.toObject());
    return data;
  }
}

function matches(node: Node, selector: string): boolean {
  if (selector.startsWith("#")) return node.id() === selector.slice(1);
  if (selector.startsWith(".")) return node.name() === selector.slice(1);
  return node.className === selector;
}
