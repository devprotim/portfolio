import { LANES, LOG, type Commit, type LaneId } from './career-log.data';

export interface Rail {
  id: LaneId;
  row: number;
  y: number;
  /** x of this lane's first commit, null if the lane never opened. */
  x0: number | null;
  x1: number;
  lastNodeX: number | null;
  color: string;
  /** Where this lane forked from, in its parent's coordinates. */
  parent: { x: number; y: number; color: string } | null;
}

export interface GraphNode {
  i: number;
  x: number;
  y: number;
  row: number;
  color: string;
  msg: string;
  skill: string;
  ref: string;
  sha: string;
  merge: boolean;
  mergeFrom?: { x: number; y: number; color: string };
  /** Blink brightness, 1 on ignition and decaying to 0. */
  v: number;
}

export interface Graph {
  nodes: GraphNode[];
  rails: Rail[];
  gap: number;
  width: number;
  height: number;
}

export const LANE_GAP = 16;
const TOP = 20;

/** Stable per-index hash so the server and the client render the same shas. */
export function shaFor(i: number): string {
  const alphabet = 'abcdef0123456789';
  let out = '';
  for (let k = 0; k < 7; k++) out += alphabet[(i * 37 + k * 19 + 7) % 16];
  return out;
}

/**
 * Walks the log left to right, one commit per column. Every open lane gets a
 * point in every column, which is what keeps a rail running behind a commit
 * that happened on some other branch. Rows are freed on merge and reused, the
 * same bookkeeping a real graph panel does.
 */
export function layout(gap: number, log: Commit[] = LOG): Graph {
  const open = new Map<LaneId, Rail>();
  const usedRows = new Set<number>();
  const nodes: GraphNode[] = [];
  const rails: Rail[] = [];
  const padL = Math.max(14, gap * 0.5);

  const yFor = (row: number) => TOP + row * LANE_GAP;

  function openLane(id: LaneId, parent: Rail['parent']): Rail {
    let row = 0;
    if (id !== 'main') {
      for (let r = 1; r < 8; r++) {
        if (!usedRows.has(r)) {
          row = r;
          break;
        }
      }
    }
    usedRows.add(row);
    const rail: Rail = {
      id,
      row,
      y: yFor(row),
      x0: null,
      x1: 0,
      lastNodeX: null,
      color: LANES[id].color,
      parent,
    };
    open.set(id, rail);
    rails.push(rail);
    return rail;
  }

  openLane('main', null);

  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    // Integer columns keep dots and vertical elbow segments on whole device
    // pixels instead of straddling two, which reads as blur.
    const x = Math.round(padL + i * gap);

    // A branch leaves from its parent's most recent commit, not from wherever
    // the parent rail happens to be.
    if (e.fork && !open.has(e.lane)) {
      const p = open.get(e.fork)!;
      openLane(e.lane, { x: p.lastNodeX ?? x - gap, y: p.y, color: p.color });
    }

    for (const rail of open.values()) {
      if (rail.x0 === null) rail.x0 = x;
      rail.x1 = x;
    }

    const lane = open.get(e.lane)!;
    const node: GraphNode = {
      i,
      x,
      y: lane.y,
      row: lane.row,
      color: lane.color,
      msg: e.msg,
      skill: e.skill,
      ref: LANES[e.lane].ref,
      sha: shaFor(i),
      merge: !!e.merge,
      v: 0,
    };
    nodes.push(node);
    lane.lastNodeX = x;

    if (e.merge && open.has(e.merge)) {
      const src = open.get(e.merge)!;
      // The rail stops at the branch's last commit and the elbow covers the
      // run into the merge node, so the two actually meet. Letting the rail
      // reach the merge column puts the elbow's turn behind its own start.
      src.x1 = src.lastNodeX!;
      node.mergeFrom = { x: src.lastNodeX!, y: src.y, color: src.color };
      usedRows.delete(src.row);
      open.delete(e.merge);
    }
  }

  const total = Math.round(padL * 2 + (log.length - 1) * gap);

  // Lanes never merged are still running: carry them to the edge.
  for (const rail of open.values()) rail.x1 = total;

  let maxRow = 0;
  for (const rail of rails) maxRow = Math.max(maxRow, rail.row);

  return { nodes, rails, gap, width: total, height: TOP + maxRow * LANE_GAP + TOP };
}

/**
 * Row assignment does not depend on column width, so the height is known
 * before any measurement. The prerendered HTML reserves it and nothing shifts
 * when the component hydrates.
 */
export const GRAPH_HEIGHT = layout(24).height;
