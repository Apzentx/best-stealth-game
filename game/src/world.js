// The game's rules and state, with no drawing and no browser in it: the thief, the guards and
// their patrols, vision cones and line of sight, the detection meter, pebble noise, relics and
// the exit. step() advances one fixed step and returns what happened as bit flags, so the
// caller can react without the world knowing about screens or sound.
import { DETECTION, FIELD, GUARD, LEVEL_POINTS, LIVES, PEBBLE, PLAYER, RELIC_POINTS } from './config.js';
import { LEVELS } from './levels.js';
import { angleDifference, distance, lineOfSight, moveCircle, pointInRect } from './vision.js';

export const MODE_PATROL = 'patrol';
export const MODE_SUSPICIOUS = 'suspicious';
export const MODE_ALERT = 'alert';
export const MODE_INVESTIGATE = 'investigate';
export const MODE_SEARCH = 'search';

export const EVENT_RELIC = 1;
export const EVENT_CAUGHT = 2;
export const EVENT_LEVEL = 4;
export const EVENT_WIN = 8;
export const EVENT_OVER = 16;
export const EVENT_SPOTTED = 32;
export const EVENT_NOISE = 64;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random) {
  const state = {
    levelIndex: 0,
    level: null,
    blockers: [],
    player: { x: 0, y: 0, angle: -Math.PI / 2, sneak: false, moving: false, hidden: false, inLight: false },
    guards: [],
    relics: [],
    pebbles: [],
    score: 0,
    lives: LIVES,
    elapsed: 0,
    pebbleCooldown: 0,
    status: 'playing',
    caughtTimer: 0,
    levelTimer: 0,
    maxDetection: 0,
    anyAlert: false,
  };

  function loadLevel(index) {
    const def = LEVELS[index];
    state.levelIndex = index;
    state.level = def;
    state.blockers = def.walls.concat(def.cover);
    state.player.x = def.player.x;
    state.player.y = def.player.y;
    state.player.angle = -Math.PI / 2;
    state.player.sneak = false;
    state.player.moving = false;
    state.guards = def.guards.map((guard) => {
      const start = guard.path[0];
      const next = guard.path[1] ?? guard.path[0];
      return {
        x: start.x,
        y: start.y,
        angle: Math.atan2(next.y - start.y, next.x - start.x),
        path: guard.path,
        waypointIndex: 1 % guard.path.length,
        pause: 0,
        mode: MODE_PATROL,
        detection: 0,
        lastSeen: { x: start.x, y: start.y },
        lostTime: 0,
        searchTime: 0,
        target: null,
        stuckTime: 0,
        spin: 0,
      };
    });
    state.relics = def.relics.map((relic) => ({ x: relic.x, y: relic.y, taken: false }));
    state.pebbles = [];
    state.pebbleCooldown = 0;
    state.maxDetection = 0;
    state.anyAlert = false;
    state.levelTimer = 0;
  }

  function reset() {
    state.score = 0;
    state.lives = LIVES;
    state.elapsed = 0;
    state.status = 'playing';
    state.caughtTimer = 0;
    loadLevel(0);
  }

  function inShadow(x, y) {
    const zones = state.level.shadows;
    for (let index = 0; index < zones.length; index += 1) {
      if (pointInRect(x, y, zones[index])) return true;
    }
    return false;
  }

  function inLight(x, y) {
    const lamps = state.level.lamps;
    for (let index = 0; index < lamps.length; index += 1) {
      if (distance(x, y, lamps[index].x, lamps[index].y) < lamps[index].r) return true;
    }
    return false;
  }

  function canSee(guard) {
    const player = state.player;
    const dist = distance(guard.x, guard.y, player.x, player.y);
    if (dist > GUARD.viewRange) return false;
    const angleTo = Math.atan2(player.y - guard.y, player.x - guard.x);
    if (Math.abs(angleDifference(guard.angle, angleTo)) > GUARD.viewHalfAngle) return false;
    return lineOfSight(guard.x, guard.y, player.x, player.y, state.blockers);
  }

  function detectionRate(guard, dist) {
    const closeness = 1 - dist / GUARD.viewRange;
    let rate = DETECTION.farRate + (DETECTION.nearRate - DETECTION.farRate) * closeness;
    const player = state.player;
    if (player.sneak) rate *= DETECTION.sneakMultiplier;
    if (!player.moving) rate *= DETECTION.stillMultiplier;
    if (player.hidden) rate *= DETECTION.shadowMultiplier;
    if (player.inLight) rate *= DETECTION.lightMultiplier;
    return rate;
  }

  function moveGuard(guard, targetX, targetY, speed, dt) {
    const dx = targetX - guard.x;
    const dy = targetY - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return 0;
    const step = Math.min(dist, speed * dt);
    const before = { x: guard.x, y: guard.y };
    const moved = moveCircle(guard.x, guard.y, GUARD.radius, (dx / dist) * step, (dy / dist) * step, state.blockers, FIELD);
    guard.x = moved.x;
    guard.y = moved.y;
    guard.angle = Math.atan2(dy, dx);
    return distance(before.x, before.y, guard.x, guard.y);
  }

  function updateGuard(guard, dt) {
    const player = state.player;
    const seen = canSee(guard);
    const dist = distance(guard.x, guard.y, player.x, player.y);
    let events = 0;

    if (seen) {
      guard.detection = Math.min(1, guard.detection + detectionRate(guard, dist) * dt);
      guard.lastSeen = { x: player.x, y: player.y };
      guard.lostTime = 0;
      if (guard.detection >= 1 && guard.mode !== MODE_ALERT) {
        guard.mode = MODE_ALERT;
        events |= EVENT_SPOTTED;
      } else if (guard.detection >= GUARD.suspiciousAt && guard.mode === MODE_PATROL) {
        guard.mode = MODE_SUSPICIOUS;
      }
    } else {
      guard.detection = Math.max(0, guard.detection - DETECTION.decayRate * dt);
      if (guard.mode === MODE_SUSPICIOUS && guard.detection < 0.3) guard.mode = MODE_PATROL;
      if (guard.mode === MODE_ALERT) {
        guard.lostTime += dt;
        if (guard.lostTime > GUARD.chaseMemory) {
          guard.mode = MODE_INVESTIGATE;
          guard.target = { x: guard.lastSeen.x, y: guard.lastSeen.y };
        }
      }
    }

    if (guard.mode === MODE_PATROL) {
      const target = guard.path[guard.waypointIndex];
      if (guard.pause > 0) {
        guard.pause -= dt;
      } else if (distance(guard.x, guard.y, target.x, target.y) < 6) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.path.length;
        guard.pause = GUARD.waypointPause * (0.8 + random() * 0.4);
      } else {
        moveGuard(guard, target.x, target.y, GUARD.patrolSpeed, dt);
      }
    } else if (guard.mode === MODE_SUSPICIOUS) {
      // Stopped, staring at where the thief was glimpsed.
      const angleTo = Math.atan2(player.y - guard.y, player.x - guard.x);
      guard.angle += angleDifference(guard.angle, angleTo) * Math.min(1, dt * 6);
    } else if (guard.mode === MODE_ALERT) {
      const moved = moveGuard(guard, player.x, player.y, GUARD.chaseSpeed, dt);
      if (moved < 0.01) {
        guard.stuckTime += dt;
        if (guard.stuckTime > 1.2) {
          guard.mode = MODE_INVESTIGATE;
          guard.target = { x: guard.lastSeen.x, y: guard.lastSeen.y };
          guard.stuckTime = 0;
        }
      } else {
        guard.stuckTime = 0;
      }
      if (distance(guard.x, guard.y, player.x, player.y) < PLAYER.caughtRadius) {
        events |= EVENT_CAUGHT;
      }
    } else if (guard.mode === MODE_INVESTIGATE) {
      const target = guard.target ?? guard.lastSeen;
      if (distance(guard.x, guard.y, target.x, target.y) < 10) {
        guard.mode = MODE_SEARCH;
        guard.searchTime = GUARD.searchTime;
      } else {
        moveGuard(guard, target.x, target.y, GUARD.investigateSpeed, dt);
      }
    } else if (guard.mode === MODE_SEARCH) {
      guard.searchTime -= dt;
      guard.angle += dt * 1.6;
      if (guard.searchTime <= 0) {
        guard.mode = MODE_PATROL;
        guard.detection = 0;
      }
    }
    return events;
  }

  /** Throw a pebble toward (x, y): guards near the landing go to investigate the sound. */
  function throwPebble(x, y) {
    if (state.status !== 'playing' || state.pebbleCooldown > 0) return 0;
    const player = state.player;
    const dist = distance(player.x, player.y, x, y);
    if (dist > PEBBLE.throwRange) return 0;
    state.pebbleCooldown = PEBBLE.cooldown;
    state.pebbles.push({ x, y, age: 0 });
    for (const guard of state.guards) {
      if (distance(guard.x, guard.y, x, y) < PEBBLE.hearRadius) {
        guard.mode = MODE_INVESTIGATE;
        guard.target = { x, y };
        guard.detection = Math.max(guard.detection, 0.45);
        guard.lostTime = 0;
      }
    }
    return EVENT_NOISE;
  }

  /**
   * One fixed step. `move` is {x, y} in -1..1, `sneak` is the sneak key. With `harmless`
   * set (the title screen's backdrop) the thief wanders but nothing is caught and nothing scores.
   */
  function step(dt, move, sneak, harmless) {
    let events = 0;
    state.elapsed += dt;

    if (state.status === 'caught') {
      state.caughtTimer -= dt;
      if (state.caughtTimer <= 0) {
        if (state.lives <= 0) {
          state.status = 'over';
          return EVENT_OVER;
        }
        loadLevel(state.levelIndex);
        state.status = 'playing';
      }
      return 0;
    }
    if (state.status !== 'playing') return 0;

    state.levelTimer += dt;
    if (state.pebbleCooldown > 0) state.pebbleCooldown -= dt;
    for (let index = state.pebbles.length - 1; index >= 0; index -= 1) {
      state.pebbles[index].age += dt;
      if (state.pebbles[index].age > 1.1) state.pebbles.splice(index, 1);
    }

    const player = state.player;
    const length = Math.hypot(move.x, move.y);
    const speed = sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    player.sneak = sneak;
    player.moving = length > 0.1;
    if (player.moving) {
      const nx = (move.x / length) * speed * dt;
      const ny = (move.y / length) * speed * dt;
      const moved = moveCircle(player.x, player.y, PLAYER.radius, nx, ny, state.blockers, FIELD);
      player.angle = Math.atan2(ny, nx);
      player.x = moved.x;
      player.y = moved.y;
    }
    player.hidden = inShadow(player.x, player.y) && (sneak || !player.moving);
    player.inLight = inLight(player.x, player.y);

    for (const guard of state.guards) {
      events |= updateGuard(guard, dt);
    }
    state.maxDetection = 0;
    state.anyAlert = false;
    for (const guard of state.guards) {
      if (guard.detection > state.maxDetection) state.maxDetection = guard.detection;
      if (guard.mode === MODE_ALERT) state.anyAlert = true;
    }

    if (!harmless) {
      for (const relic of state.relics) {
        if (!relic.taken && distance(player.x, player.y, relic.x, relic.y) < 28) {
          relic.taken = true;
          state.score += RELIC_POINTS;
          events |= EVENT_RELIC;
        }
      }
      if (pointInRect(player.x, player.y, state.level.exit)) {
        state.score += LEVEL_POINTS;
        if (state.levelIndex + 1 >= LEVELS.length) {
          state.status = 'won';
          return events | EVENT_WIN;
        }
        loadLevel(state.levelIndex + 1);
        return events | EVENT_LEVEL;
      }
      if (events & EVENT_CAUGHT) {
        state.lives -= 1;
        state.status = 'caught';
        state.caughtTimer = 1.4;
        if (state.lives <= 0) {
          // The caught screen still plays out, then step() flips it to 'over'.
        }
      }
    }
    return events;
  }

  reset();
  return {
    state,
    reset,
    step,
    throwPebble,
    loadLevel,
    relicCount() {
      return state.relics.filter((relic) => relic.taken).length;
    },
    relicTotal() {
      return state.relics.length;
    },
  };
}
