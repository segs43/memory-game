import type { WorldMap, WallRect, Vec2 } from '@types-game/game';

export const WORLD: WorldMap = {
  width: 800,
  height: 600,
  walls: [
    // Outer boundary
    { x: 0,   y: 0,   w: 800, h: 20  },
    { x: 0,   y: 580, w: 800, h: 20  },
    { x: 0,   y: 0,   w: 20,  h: 600 },
    { x: 780, y: 0,   w: 20,  h: 600 },
    // Inner rooms
    { x: 200, y: 100, w: 20,  h: 150 },
    { x: 550, y: 200, w: 150, h: 20  },
    { x: 350, y: 380, w: 20,  h: 150 },
    { x: 150, y: 450, w: 120, h: 20  },
    { x: 600, y: 400, w: 20,  h: 120 },
    // Extra rooms for depth
    { x: 400, y: 100, w: 20,  h: 100 },
    { x: 100, y: 280, w: 100, h: 20  },
    { x: 650, y: 300, w: 20,  h: 80  },
  ],
};

function rectOverlapsCircle(wall: WallRect, cx: number, cy: number, r: number): boolean {
  const nearestX = Math.max(wall.x, Math.min(cx, wall.x + wall.w));
  const nearestY = Math.max(wall.y, Math.min(cy, wall.y + wall.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

export function collidesWithWalls(
  walls: WallRect[],
  position: Vec2,
  radius: number
): boolean {
  for (const wall of walls) {
    if (rectOverlapsCircle(wall, position.x, position.y, radius)) return true;
  }
  return false;
}

export function resolveWallSlide(
  walls: WallRect[],
  from: Vec2,
  to: Vec2,
  radius: number
): Vec2 {
  // Try full move
  if (!collidesWithWalls(walls, to, radius)) return to;

  // Try X only
  const slideX = { x: to.x, y: from.y };
  if (!collidesWithWalls(walls, slideX, radius)) return slideX;

  // Try Y only
  const slideY = { x: from.x, y: to.y };
  if (!collidesWithWalls(walls, slideY, radius)) return slideY;

  return from;
}
