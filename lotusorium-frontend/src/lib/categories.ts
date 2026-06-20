import type { CategoryNode } from "./api/types";

/** Flatten a category tree into a list, preserving order (parents before children). */
export function flattenCategories(
  nodes: CategoryNode[],
): { slug: string; name: string }[] {
  const out: { slug: string; name: string }[] = [];
  const walk = (list: CategoryNode[], depth = 0) => {
    for (const node of list) {
      out.push({
        slug: node.slug,
        name: depth > 0 ? `— ${node.name}` : node.name,
      });
      if (node.children?.length) walk(node.children, depth + 1);
    }
  };
  walk(nodes);
  return out;
}

/** Depth-first lookup of a category node by slug. */
export function findCategoryBySlug(
  nodes: CategoryNode[],
  slug: string,
): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const child = node.children?.length
      ? findCategoryBySlug(node.children, slug)
      : undefined;
    if (child) return child;
  }
  return undefined;
}
