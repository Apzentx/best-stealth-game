// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 175,
  sneakSpeed: 92,
  /** How close a guard must get to catch the player. */
  caughtRadius: 27,
};

export const GUARD = {
  radius: 14,
  /** How far a guard can see, in pixels. */
  viewRange: 250,
  /** Half of the vision cone's angle, in radians. */
  viewHalfAngle: 0.66,
  patrolSpeed: 78,
  investigateSpeed: 112,
  chaseSpeed: 168,
  /** Seconds a guard waits at each patrol waypoint. */
  waypointPause: 1.4,
  /** Detection (0..1) at which a guard stops and stares, suspicious. */
  suspiciousAt: 0.5,
  /** Seconds a chasing guard keeps hunting after losing sight. */
  chaseMemory: 2.5,
  /** Seconds a guard looks around at the last seen spot before giving up. */
  searchTime: 2.2,
};

export const DETECTION = {
  /** Fill per second at point blank; at the edge of the cone it is far slower. */
  nearRate: 1.15,
  farRate: 0.22,
  /** How fast the meter drains when the guard cannot see the player. */
  decayRate: 0.55,
  /** Multipliers on the fill rate. */
  sneakMultiplier: 0.55,
  stillMultiplier: 0.8,
  shadowMultiplier: 0.45,
  lightMultiplier: 1.3,
};

export const PEBBLE = {
  /** How far from the player a pebble can be thrown. */
  throwRange: 330,
  /** Guards within this distance of the landing hear it. */
  hearRadius: 340,
  cooldown: 1.2,
};

export const LIVES = 3;
export const RELIC_POINTS = 100;
export const LEVEL_POINTS = 250;

export const PALETTE = {
  backdrop: '#0b0e14',
  floorA: '#232936',
  floorB: '#1e2431',
  floorLine: '#2b3242',
  wall: '#4a5468',
  wallTop: '#5d6a84',
  crate: '#6b5433',
  crateTop: '#8a6f45',
  caseGlass: '#3d5a6e',
  caseFrame: '#7a6a4a',
  shadow: '#0d1017',
  lampGlow: '#f2c94c',
  player: '#5ee6a8',
  playerDark: '#2f8f66',
  guard: '#e5534b',
  guardSuspicious: '#f2a93c',
  coneCalm: 'rgba(242, 201, 76, 0.20)',
  coneSuspicious: 'rgba(242, 169, 60, 0.30)',
  coneAlert: 'rgba(229, 83, 75, 0.34)',
  relic: '#ffd94d',
  exit: '#4ade80',
  exitGlow: 'rgba(74, 222, 128, 0.25)',
  pebble: '#c8cdd8',
  text: '#eef1f5',
  muted: '#9aa3b2',
  panel: '#171c28',
  danger: '#ff6b61',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'lantern-thief.best';
