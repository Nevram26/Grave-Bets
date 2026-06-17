import { state } from './state.js';

const canvas = document.getElementById('gameCanvas');

export function updateCamera() {
  const p = state.player;
  state.mouse.worldX = state.mouse.screenX + state.camera.x - canvas.width / 2;
  state.mouse.worldY = state.mouse.screenY + state.camera.y - canvas.height / 2;
  const vecX = state.mouse.worldX - p.x;
  const vecY = state.mouse.worldY - p.y;
  state.camera.targetX = p.x + vecX * state.camera.mouseLookFactor;
  state.camera.targetY = p.y + vecY * state.camera.mouseLookFactor;
  state.camera.x += (state.camera.targetX - state.camera.x) * state.camera.lerp;
  state.camera.y += (state.camera.targetY - state.camera.y) * state.camera.lerp;
}
