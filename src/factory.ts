import { Container } from "./Container.js";
import { Connector } from "./Connector.js";
import { Node } from "./Node.js";
import type { SerializedNode } from "./types.js";

const registry = new Map<string, new (config?: Record<string, unknown>) => Node>();

export function register(name: string, ctor: new (config?: Record<string, unknown>) => Node): void {
  registry.set(name, ctor);
}

export function createNode(data: SerializedNode): Node {
  const Ctor = registry.get(data.className);
  if (!Ctor) throw new Error(`[vizat] Unknown node "${data.className}"`);
  const node = new Ctor({ ...(data.attrs ?? {}) });
  if (data.children && node instanceof Container) {
    for (const child of data.children) node.add(createNode(child));
  }
  return node;
}

export function flatten(nodes: Node[]): Node[] {
  const out: Node[] = [];
  const walk = (node: Node) => {
    out.push(node);
    if (node instanceof Container) node.getChildren().forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

export function linkConnectors(nodes: Node[]): void {
  const flat = flatten(nodes);
  const byId = new Map(flat.map((node) => [node.id(), node]));
  for (const node of flat) {
    if (!(node instanceof Connector)) continue;
    const from = byId.get(String(node.getAttr("fromId") ?? ""));
    const to = byId.get(String(node.getAttr("toId") ?? ""));
    if (from) node.from(from);
    if (to) node.to(to);
    node.refresh();
  }
}
