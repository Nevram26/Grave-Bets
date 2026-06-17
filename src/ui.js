import { state } from './state.js';
import { generateRoom } from './rooms.js';

export function renderMapUI() {
  const mapOverlay = document.getElementById('map-screen');
  const svg = document.getElementById('map-svg');

  mapOverlay.style.display = 'flex';
  svg.innerHTML = '';

  const mapData = state.mapData;
  const currentNodeIdx = state.currentNodeIndex;

  const svgW = svg.clientWidth || 800;
  const svgH = svg.clientHeight || 600;
  const padding = 60;
  const usableW = svgW - padding * 2;
  const usableH = svgH - padding * 2;
  const nodeRadius = 24;

  const reachable = new Set();

  if (currentNodeIdx === -1) {
    for (const idx of mapData.rows[0]?.nodes || []) {
      reachable.add(idx);
    }
  } else {
    const currentNode = mapData.nodes[currentNodeIdx];
    if (currentNode) {
      for (const conn of currentNode.connections) {
        reachable.add(conn);
      }
    }
  }
  mapData.reachable = [...reachable];

  for (let i = 0; i < mapData.nodes.length; i++) {
    const n = mapData.nodes[i];
    const row = mapData.rows.find(r => r.nodes.includes(i));
    const rowIdx = mapData.rows.indexOf(row);
    const colIdx = row.nodes.indexOf(i);
    const totalCols = row.nodes.length;
    n.cx = padding + ((colIdx + 0.5) / totalCols) * usableW;
    n.cy = padding + ((rowIdx + 0.5) / mapData.rows.length) * usableH;
  }

  const drawnEdges = new Set();
  for (const n of mapData.nodes) {
    if (!n.connections) continue;
    for (const conn of n.connections) {
      const target = mapData.nodes[conn];
      if (!target) continue;
      const key = `${Math.min(mapData.nodes.indexOf(n), conn)}-${Math.max(mapData.nodes.indexOf(n), conn)}`;
      if (drawnEdges.has(key)) continue;
      drawnEdges.add(key);
      if (n.cx == null || target.cx == null) continue;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', n.cx);
      line.setAttribute('y1', n.cy);
      line.setAttribute('x2', target.cx);
      line.setAttribute('y2', target.cy);
      line.setAttribute('stroke', '#555');
      line.setAttribute('stroke-width', '3');
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
    }
  }

  for (let i = 0; i < mapData.nodes.length; i++) {
    const n = mapData.nodes[i];
    if (n.cx == null) continue;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', n.cx);
    circle.setAttribute('cy', n.cy);
    circle.setAttribute('r', nodeRadius);
    if (i === currentNodeIdx) {
      circle.setAttribute('fill', '#fbbf24');
      circle.setAttribute('stroke', '#f59e0b');
      circle.setAttribute('stroke-width', '3');
    } else if (mapData.visited && mapData.visited[i]) {
      circle.setAttribute('fill', '#4ade80');
      circle.setAttribute('stroke', '#22c55e');
      circle.setAttribute('stroke-width', '2');
    } else if (reachable.has(i)) {
      circle.setAttribute('fill', '#60a5fa');
      circle.setAttribute('stroke', '#3b82f6');
      circle.setAttribute('stroke-width', '2');
    } else {
      circle.setAttribute('fill', '#374151');
      circle.setAttribute('stroke', '#6b7280');
      circle.setAttribute('stroke-width', '1');
    }
    circle.setAttribute('data-index', i);
    g.appendChild(circle);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', n.cx);
    text.setAttribute('y', n.cy + nodeRadius + 16);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#e5e7eb');
    text.setAttribute('font-size', '12');
    text.textContent = n.label || n.type;
    g.appendChild(text);
    svg.appendChild(g);
  }

  const helpText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  helpText.setAttribute('x', svgW / 2);
  helpText.setAttribute('y', svgH - 10);
  helpText.setAttribute('text-anchor', 'middle');
  helpText.setAttribute('fill', '#9ca3af');
  helpText.setAttribute('font-size', '14');
  helpText.textContent = 'Click a gold node to travel | Close (ESC) to stay';
  svg.appendChild(helpText);
}

export function onNodeClick(e) {
  const target = e.target;
  if (target.tagName !== 'circle') return;
  const index = parseInt(target.getAttribute('data-index'));
  if (isNaN(index)) return;

  const mapData = state.mapData;
  if (!mapData.reachable.includes(index)) return;

  const node = mapData.nodes[index];
  if (!mapData.visited) mapData.visited = {};
  mapData.visited[index] = true;
  state.currentNodeIndex = index;
  state.totalEncounters = (state.totalEncounters || 0) + 1;
  document.getElementById('map-screen').style.display = 'none';
  generateRoom('combat', node.type);
}
