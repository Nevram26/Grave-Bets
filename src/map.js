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
      nodes.push({ type: pickType(), label: pickType(), connections: [] });
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
      const numChildren = 1 + (Math.random() < 0.5 ? 1 : 0);
      const available = [...nextRow].sort(() => Math.random() - 0.5);
      for (let k = 0; k < Math.min(numChildren, available.length); k++) {
        nodes[nodeIdx].connections.push(available[k]);
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
