import { state } from './state.js';

export function isBlockedByObstacle(x, y, radius) {
  for (const obs of state.obstacles) {
    if (obs.r) {
      if (Math.hypot(x - obs.x, y - obs.y) < obs.r + radius) return true;
    } else {
      if (x + radius > obs.x && x - radius < obs.x + obs.w && y + radius > obs.y && y - radius < obs.y + obs.h) return true;
    }
  }
  return false;
}

export function isValidPosition(x, y, radius) {
  if (radius === undefined) radius = state.player.radius;
  if (isBlockedByObstacle(x, y, radius)) return false;
  for (const room of state.rooms) {
    if (x >= room.x + radius && x <= room.x + room.w - radius && y >= room.y + radius && y <= room.y + room.h - radius) return true;
  }
  for (const corridor of state.corridors) {
    if (x >= corridor.x + radius && x <= corridor.x + corridor.w - radius && y >= corridor.y + radius && y <= corridor.y + corridor.h - radius) return true;
  }
  return false;
}

export function tryMove(entity, dx, dy) {
  const nx = entity.x + dx;
  const ny = entity.y + dy;
  if (isValidPosition(nx, ny, entity.radius)) { entity.x = nx; entity.y = ny; return true; }
  if (isValidPosition(entity.x, ny, entity.radius)) { entity.y = ny; return true; }
  if (isValidPosition(nx, entity.y, entity.radius)) { entity.x = nx; return true; }
  return false;
}
