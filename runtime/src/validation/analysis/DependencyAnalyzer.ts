import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

export interface DependencyEdge {
  from: string;
  to: string;
}

export interface DependencyGraph {
  nodes: string[];
  edges: DependencyEdge[];
}

export interface CycleAnalysis {
  hasCycles: boolean;
  cycles: string[][];
}

/**
 * Deterministic dependency analyser.
 * Parses import/require statements, builds a directed graph, and runs DFS cycle detection.
 */
export class DependencyAnalyzer {
  buildGraph(rootPath: string, extensions = ['.ts', '.js']): DependencyGraph {
    const files = this.collectFiles(rootPath, extensions);
    const edges: DependencyEdge[] = [];
    const nodes = new Set<string>(files);

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const imports = this.extractImports(content);
        for (const imp of imports) {
          if (!imp.startsWith('.')) continue;  // skip node_modules
          const resolvedBase = join(file, '..', imp);
          const resolved = this.resolveExtension(resolvedBase, extensions);
          if (resolved) {
            nodes.add(resolved);
            edges.push({ from: file, to: resolved });
          }
        }
      } catch {
        // unreadable → skip
      }
    }

    return { nodes: Array.from(nodes), edges };
  }

  detectCycles(graph: DependencyGraph): CycleAnalysis {
    const adjacency = new Map<string, string[]>();
    for (const node of graph.nodes) adjacency.set(node, []);
    for (const edge of graph.edges) {
      adjacency.get(edge.from)?.push(edge.to);
    }

    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<string, number>();
    for (const n of graph.nodes) color.set(n, WHITE);

    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]) => {
      color.set(node, GRAY);
      for (const neighbor of (adjacency.get(node) ?? [])) {
        if (color.get(neighbor) === GRAY) {
          const idx = path.indexOf(neighbor);
          cycles.push([...path.slice(idx), neighbor]);
        } else if (color.get(neighbor) === WHITE) {
          dfs(neighbor, [...path, neighbor]);
        }
      }
      color.set(node, BLACK);
    };

    for (const node of graph.nodes) {
      if (color.get(node) === WHITE) dfs(node, [node]);
    }

    return { hasCycles: cycles.length > 0, cycles };
  }

  private extractImports(content: string): string[] {
    const found: string[] = [];
    const importRe = /(?:import|export)\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    const requireRe = /require\(['"]([^'"]+)['"]\)/g;
    for (const re of [importRe, requireRe]) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) {
        found.push(m[1]!);
      }
    }
    return found;
  }

  private resolveExtension(base: string, exts: string[]): string | null {
    // strip existing .js/.ts extension to test both
    const stripped = base.replace(/\.(js|ts)$/, '');
    for (const ext of exts) {
      const candidate = stripped + ext;
      if (existsSync(candidate)) return resolve(candidate);
    }
    return null;
  }

  private collectFiles(dir: string, exts: string[]): string[] {
    if (!existsSync(dir)) return [];
    const results: string[] = [];
    const IGNORED = new Set(['node_modules', '.git', 'dist']);
    function walk(d: string) {
      for (const entry of readdirSync(d)) {
        if (IGNORED.has(entry)) continue;
        const full = join(d, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (exts.includes(extname(entry))) results.push(resolve(full));
      }
    }
    walk(dir);
    return results;
  }
}
