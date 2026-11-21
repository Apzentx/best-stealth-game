// The screenshot scenes behind ?shot=start|play|alert|win. Each one plays the real rules
// forward from a fresh world, steered by a simple waypoint driver, so the frame is what a
// short game really looks like and the same seed always gives the same frame.
import { EVENT_CAUGHT, EVENT_SPOTTED, EVENT_WIN } from './world.js';
import { SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { STEP } from './config.js';

const START_SECONDS = 5;
const MAX_SECONDS = 90;

/** Steer the player toward a point, one step at a time; returns the events seen, or 0 at the point. */
function driveTo(world, target, sneak, seconds) {
  let events = 0;
  const limit = Math.floor(seconds / STEP);
  for (let index = 0; index < limit; index += 1) {
    const player = world.state.player;
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 14) return events;
    const stepEvents = world.step(STEP, { x: dx / distance, y: dy / distance }, sneak, false);
    events |= stepEvents;
    if (stepEvents & (EVENT_SPOTTED | EVENT_CAUGHT)) return events;
  }
  return events;
}

/** Step with the player standing still until `stop` says so, or the seconds run out. */
function waitFor(world, seconds, stop) {
  let events = 0;
  const limit = Math.floor(seconds / STEP);
  for (let index = 0; index < limit; index += 1) {
    const stepEvents = world.step(STEP, { x: 0, y: 0 }, false, false);
    events |= stepEvents;
    if (stop(world, stepEvents)) return events;
    if (stepEvents & EVENT_CAUGHT) return events;
  }
  return events;
}

/**
 * Set `world` to the named scene (start, play, alert or win; any other name is start) and
 * return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'alert' && name !== 'win') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, { x: 0, y: 0 }, false, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'play') {
    // Sneak along the bottom, pocket the relic by the south wall, and hold behind the
    // crates while a watchman sweeps past below.
    driveTo(world, { x: 640, y: 640 }, false, 12);
    driveTo(world, { x: 640, y: 500 }, true, 12);
    waitFor(world, 1, () => false);
    return { screen: SCREEN_PLAY, best: 250 };
  }

  if (name === 'alert') {
    // Walk up into the Marble Hall until a watchman's cone fills and he gives chase.
    driveTo(world, { x: 500, y: 430 }, false, 20);
    const events = driveTo(world, { x: 500, y: 260 }, false, 20);
    if (!(events & EVENT_SPOTTED)) {
      waitFor(world, 25, (w, stepEvents) => Boolean(stepEvents & EVENT_SPOTTED));
    }
    return { screen: SCREEN_PLAY, best: 250 };
  }

  // win: the Vault of Embers. Slip along the south wall, throw a pebble west to pull the
  // top watchman away from the exit, then dash north through the door.
  world.loadLevel(2);
  driveTo(world, { x: 1230, y: 700 }, true, 30);
  world.throwPebble(950, 120);
  waitFor(world, 1.2, () => false);
  driveTo(world, { x: 1230, y: 140 }, true, 20);
  const events = driveTo(world, { x: 1182, y: 92 }, true, 10);
  if (events & EVENT_WIN) return { screen: SCREEN_WIN, best: 1250 };
  // The dash fell short of the door: stand at the exit and let the world finish it.
  waitFor(world, 10, (w, stepEvents) => {
    if (stepEvents & EVENT_WIN) return true;
    const player = w.state.player;
    const exit = w.state.level.exit;
    return player.x > exit.x - 20 && player.y < exit.y + exit.h + 20;
  });
  const won = world.state.status === 'won';
  return { screen: won ? SCREEN_WIN : SCREEN_PLAY, best: 1250 };
}
