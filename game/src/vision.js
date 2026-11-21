// Geometry for sight and movement: what blocks a view, where a ray stops, and how a circle
// slides along a rectangle. Walls and cover are all rectangles; the guards' cones are drawn
// by casting rays and stopping each one at the first rectangle it hits.

/** True when the point is inside the rectangle (edges count). */
export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/**
 * Distance from (x, y) along the unit direction (dx, dy) to the first hit on the rectangle,
 * or Infinity when the ray misses. Slab method: the ray enters the rectangle's x-span and
 * y-span at some distances, and the later of the two entries is the hit.
 */
export function rayRect(x, y, dx, dy, rect) {
  let near = -Infinity;
  let far = Infinity;
  if (dx === 0) {
    if (x < rect.x || x > rect.x + rect.w) return Infinity;
  } else {
    let t1 = (rect.x - x) / dx;
    let t2 = (rect.x + rect.w - x) / dx;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    near = Math.max(near, t1);
    far = Math.min(far, t2);
    if (near > far) return Infinity;
  }
  if (dy === 0) {
    if (y < rect.y || y > rect.y + rect.h) return Infinity;
  } else {
    let t1 = (rect.y - y) / dy;
    let t2 = (rect.y + rect.h - y) / dy;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    near = Math.max(near, t1);
    far = Math.min(far, t2);
    if (near > far) return Infinity;
  }
  if (far < 0) return Infinity;
  return near < 0 ? 0 : near;
}

/** Distance to the nearest rectangle the ray hits, or Infinity when it hits none. */
export function rayBlockers(x, y, dx, dy, blockers) {
  let best = Infinity;
  for (let index = 0; index < blockers.length; index += 1) {
    const hit = rayRect(x, y, dx, dy, blockers[index]);
    if (hit < best) best = hit;
  }
  return best;
}

/**
 * True when the segment from (x1, y1) to (x2, y2) is clear of every blocker: the ray must
 * reach the target before it reaches any rectangle.
 */
export function lineOfSight(x1, y1, x2, y2, blockers) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return true;
  const hit = rayBlockers(x1, y1, dx / distance, dy / distance, blockers);
  return hit >= distance;
}

/**
 * The vision cone as a fan of points: one ray per step across the cone, each stopped at the
 * first blocker or at the cone's range, so the drawn cone hugs the walls instead of shining
 * through them.
 */
export function coneFan(x, y, angle, halfAngle, range, blockers, steps) {
  const points = [];
  for (let index = 0; index <= steps; index += 1) {
    const rayAngle = angle - halfAngle + (2 * halfAngle * index) / steps;
    const dx = Math.cos(rayAngle);
    const dy = Math.sin(rayAngle);
    const hit = rayBlockers(x, y, dx, dy, blockers);
    const length = Math.min(range, hit);
    points.push({ x: x + dx * length, y: y + dy * length });
  }
  return points;
}

/**
 * Move a circle (centre x, y, radius r) by (dx, dy), sliding along any blocker it touches:
 * try the full move, then each axis alone, so the circle never ends up inside a rectangle.
 */
export function moveCircle(x, y, r, dx, dy, blockers, bounds) {
  let nx = x;
  let ny = y;
  const hits = (cx, cy) => {
    if (cx - r < 0 || cx + r > bounds.width || cy - r < 0 || cy + r > bounds.height) return true;
    for (let index = 0; index < blockers.length; index += 1) {
      const b = blockers[index];
      const closestX = Math.max(b.x, Math.min(cx, b.x + b.w));
      const closestY = Math.max(b.y, Math.min(cy, b.y + b.h));
      const ddx = cx - closestX;
      const ddy = cy - closestY;
      if (ddx * ddx + ddy * ddy < r * r) return true;
    }
    return false;
  };
  if (!hits(x + dx, y + dy)) {
    nx = x + dx;
    ny = y + dy;
  } else if (!hits(x + dx, y)) {
    nx = x + dx;
  } else if (!hits(x, y + dy)) {
    ny = y + dy;
  }
  return { x: nx, y: ny };
}

/** Smallest signed difference between two angles, in (-PI, PI]. */
export function angleDifference(from, to) {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff <= -Math.PI) diff += Math.PI * 2;
  return diff;
}

/** Distance between two points. */
export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}
