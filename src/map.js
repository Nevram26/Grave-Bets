export function generateMapData(floorIndex = 0) {
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

  // Generate 20 rows of 4 nodes each (20 * 4 = 80 nodes)
  const totalRows = 20;
  for (let r = 0; r < totalRows; r++) {
    const rowNodes = [];
    for (let c = 0; c < 4; c++) {
      const idx = nodes.length;
      const type = r === 0 ? 'Normal' : pickType();
      nodes.push({ type: type, label: type, connections: [] });
      rowNodes.push(idx);
    }
    rows.push({ nodes: rowNodes });
  }

  // Add the 1 Boss node on the 21st row (row Index 20)
  const bossIdx = nodes.length;
  nodes.push({ type: 'Boss', label: 'Boss', connections: [] });
  rows.push({ nodes: [bossIdx] });

  // Generate connections between consecutive rows
  for (let r = 0; r < totalRows; r++) {
    const currentRow = rows[r].nodes;
    const nextRow = rows[r + 1].nodes;

    if (nextRow.length === 1) {
      // Connect each node in the last 4-node row to the single Boss node
      for (const nodeIdx of currentRow) {
        nodes[nodeIdx].connections.push(bossIdx);
      }
    } else {
      // Connect each node in currentRow to 1 or 2 nodes in nextRow
      for (let c = 0; c < 4; c++) {
        const nodeIdx = currentRow[c];
        const targets = [nextRow[c]]; // Always connect straight ahead

        // 50% chance to also connect to an adjacent column
        if (Math.random() < 0.5) {
          const adjCol = c + (Math.random() < 0.5 ? -1 : 1);
          if (adjCol >= 0 && adjCol < 4) {
            targets.push(nextRow[adjCol]);
          }
        }

        for (const target of targets) {
          if (!nodes[nodeIdx].connections.includes(target)) {
            nodes[nodeIdx].connections.push(target);
          }
        }
      }

      // Guarantee every node in nextRow has at least one incoming connection
      for (let c = 0; c < 4; c++) {
        const targetIdx = nextRow[c];
        const hasParent = currentRow.some(pidx => nodes[pidx].connections.includes(targetIdx));
        if (!hasParent) {
          const potentialParents = [currentRow[c]];
          if (c > 0) potentialParents.push(currentRow[c - 1]);
          if (c < 3) potentialParents.push(currentRow[c + 1]);
          const parentIdx = potentialParents[Math.floor(Math.random() * potentialParents.length)];
          if (!nodes[parentIdx].connections.includes(targetIdx)) {
            nodes[parentIdx].connections.push(targetIdx);
          }
        }
      }
    }
  }

  return { nodes, rows, visited: {}, reachable: [] };
}
