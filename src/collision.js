import { state } from './state.js';

export function isValidPosition(x, y, radius) {
  if (radius === undefined) radius = state.player.radius;
  for (const room of state.rooms) {
    if (x >= room.x + radius && x <= room.x + room.w - radius && y >= room.y + radius && y <= room.y + room.h - radius) return true;
  }
  for (const corridor of state.corridors) {
    if (x >= corridor.x + radius && x <= corridor.x + corridor.w - radius && y >= corridor.y + radius && y <= corridor.y + corridor.h - radius) return true;
  }
  return false;
}
