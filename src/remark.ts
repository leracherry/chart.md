import { parseChart } from './parser.js';

interface AstNode {
  type: string;
  lang?: string | null;
  value?: string;
  children?: AstNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
  position?: unknown;
}

function transform(node: AstNode): void {
  if (!node.children) return;

  node.children = node.children.map((child) => {
    if (child.type === 'code' && child.lang?.toLowerCase() === 'chart') {
      const definition = parseChart(child.value ?? '');
      return {
        type: 'chartMd',
        data: {
          hName: 'div',
          hProperties: {
            'data-chart': JSON.stringify(definition),
          },
        },
        position: child.position,
      };
    }
    transform(child);
    return child;
  });
}

/** Remark plugin that turns fenced `chart` blocks into renderable chart nodes. */
export function remarkChart(): (tree: AstNode) => void {
  return transform;
}
