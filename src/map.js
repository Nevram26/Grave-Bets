export function generateMapData() {
  const NODE_TYPES = ['Normal', 'Elite', 'Treasure', 'Shop'];
  const TYPE_WEIGHTS = [0.55, 0.20, 0.15, 0.10];

  function pickType() {
    const roll = Math.random();
    let cumulative = 0;
    for (let i = 0; i < TYPE_WEIGHTS.length; i++) {
      cumulative += TYPE_WEIGHTS[i];
      if (roll < cumulative) return NODE_TYPES[i];
    }
    return 'Normal';
  }

  const rows = [];
  const nodes = [];

  const row0Count = 3;
  const row0 = [];
  for (let i = 0; i < row0Count; i++) {
    const idx = nodes.length;
    nodes.push({ type: 'Normal', label: 'Normal', connections: [] });
    row0.push(idx);
  }
  rows.push({ nodes: row0 });

  for (let r = 1; r <= 4; r++) {
    const count = 3 + Math.floor(Math.random() * 3);
    const row = [];
    for (let i = 0; i < count; i++) {
      const idx = nodes.length;
      const t = pickType();
      nodes.push({ type: t, label: t, connections: [] });
      row.push(idx);
    }
    rows.push({ nodes: row });
  }

  {
    const idx = nodes.length;
    nodes.push({ type: 'Boss', label: 'Boss', connections: [] });
    rows.push({ nodes: [idx] });
  }

  for (let r = 0; r < rows.length - 1; r++) {
    const currentRow = rows[r].nodes;
    const nextRow = rows[r + 1].nodes;

    for (const nodeIdx of currentRow) {
      const colIdx = currentRow.indexOf(nodeIdx);
      const totalCols = currentRow.length;
      const nextCount = nextRow.length;
      const ratio = totalCols > 1 ? colIdx / (totalCols - 1) : 0.5;
      const target = Math.round(ratio * (nextCount - 1));
      const numChildren = 1 + (Math.random() < 0.5 ? 1 : 0);
      const children = [nextRow[target]];
      if (numChildren > 1) {
        const adj = Math.random() < 0.5 ? -1 : 1;
        const adjCol = Math.max(0, Math.min(nextCount - 1, target + adj));
        if (adjCol !== target && !children.includes(nextRow[adjCol])) {
          children.push(nextRow[adjCol]);
        }
      }
      for (const child of children) {
        if (!nodes[nodeIdx].connections.includes(child)) {
          nodes[nodeIdx].connections.push(child);
        }
      }
    }

    for (let i = 0; i < nextRow.length; i++) {
      const targetIdx = nextRow[i];
      const hasParent = currentRow.some(pidx => nodes[pidx].connections.includes(targetIdx));
      if (!hasParent) {
        const parentIdx = currentRow[Math.floor(Math.random() * currentRow.length)];
        if (!nodes[parentIdx].connections.includes(targetIdx)) {
          nodes[parentIdx].connections.push(targetIdx);
        }
      }
    }
  }

  return { nodes, rows, visited: { 0: true }, reachable: [] };
}
