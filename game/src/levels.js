// The three galleries of the Lantern Thief's heist, hand-designed. Every rectangle is in
// playfield pixels (1280x720). `walls` block movement and sight; `cover` does the same but is
// drawn as crates and display cases you can hide behind; `shadows` are dark floor where guards
// spot you slowly; `lamps` are pools of light where they spot you fast; `relics` are optional
// pickups; each guard walks its `path` of waypoints and waits at each one.

export const LEVELS = [
  {
    name: 'The Marble Hall',
    sub: 'Level 1 — learn the dark, mind the lamps',
    player: { x: 90, y: 620 },
    exit: { x: 1150, y: 60, w: 64, h: 64 },
    walls: [
      { x: 240, y: 180, w: 420, h: 26 },
      { x: 640, y: 380, w: 420, h: 26 },
      { x: 880, y: 120, w: 26, h: 220 },
    ],
    cover: [
      { kind: 'crate', x: 150, y: 300, w: 64, h: 64 },
      { kind: 'crate', x: 500, y: 480, w: 64, h: 64 },
      { kind: 'crate', x: 980, y: 480, w: 64, h: 64 },
      { kind: 'crate', x: 1050, y: 220, w: 64, h: 64 },
      { kind: 'case', x: 340, y: 90, w: 90, h: 46 },
      { kind: 'case', x: 700, y: 560, w: 90, h: 46 },
    ],
    shadows: [
      { x: 60, y: 60, w: 260, h: 140 },
      { x: 960, y: 560, w: 260, h: 120 },
      { x: 420, y: 300, w: 200, h: 120 },
    ],
    lamps: [
      { x: 640, y: 140, r: 130 },
      { x: 320, y: 560, r: 120 },
      { x: 1080, y: 360, r: 120 },
    ],
    relics: [
      { x: 360, y: 120 },
      { x: 1120, y: 300 },
      { x: 640, y: 640 },
    ],
    guards: [
      { path: [{ x: 300, y: 260 }, { x: 700, y: 260 }] },
      { path: [{ x: 980, y: 180 }, { x: 980, y: 420 }] },
      { path: [{ x: 200, y: 560 }, { x: 600, y: 560 }] },
    ],
  },
  {
    name: 'The Jade Wing',
    sub: 'Level 2 — four watchmen, tighter corridors',
    player: { x: 90, y: 640 },
    exit: { x: 1180, y: 80, w: 64, h: 64 },
    walls: [
      { x: 180, y: 200, w: 26, h: 320 },
      { x: 420, y: 120, w: 26, h: 240 },
      { x: 700, y: 300, w: 26, h: 300 },
      { x: 900, y: 140, w: 300, h: 26 },
      { x: 500, y: 520, w: 300, h: 26 },
    ],
    cover: [
      { kind: 'crate', x: 300, y: 420, w: 64, h: 64 },
      { kind: 'crate', x: 820, y: 220, w: 64, h: 64 },
      { kind: 'crate', x: 1080, y: 560, w: 64, h: 64 },
      { kind: 'case', x: 240, y: 90, w: 90, h: 46 },
      { kind: 'case', x: 1000, y: 380, w: 90, h: 46 },
    ],
    shadows: [
      { x: 60, y: 560, w: 220, h: 120 },
      { x: 1100, y: 60, w: 120, h: 160 },
      { x: 560, y: 180, w: 180, h: 120 },
    ],
    lamps: [
      { x: 360, y: 300, r: 130 },
      { x: 880, y: 480, r: 130 },
      { x: 640, y: 80, r: 120 },
    ],
    relics: [
      { x: 120, y: 120 },
      { x: 640, y: 360 },
      { x: 1150, y: 640 },
    ],
    guards: [
      { path: [{ x: 60, y: 300 }, { x: 150, y: 300 }] },
      { path: [{ x: 520, y: 240 }, { x: 520, y: 480 }] },
      { path: [{ x: 820, y: 120 }, { x: 1120, y: 120 }] },
      { path: [{ x: 760, y: 620 }, { x: 1040, y: 620 }] },
    ],
  },
  {
    name: 'The Vault of Embers',
    sub: 'Level 3 — five watchmen, one way out',
    player: { x: 90, y: 640 },
    exit: { x: 1180, y: 80, w: 64, h: 64 },
    walls: [
      { x: 300, y: 160, w: 26, h: 260 },
      { x: 640, y: 80, w: 26, h: 260 },
      { x: 940, y: 360, w: 26, h: 280 },
      { x: 200, y: 480, w: 420, h: 26 },
      { x: 760, y: 220, w: 280, h: 26 },
    ],
    cover: [
      { kind: 'crate', x: 120, y: 300, w: 64, h: 64 },
      { kind: 'crate', x: 480, y: 420, w: 64, h: 64 },
      { kind: 'crate', x: 1120, y: 140, w: 64, h: 64 },
      { kind: 'crate', x: 880, y: 560, w: 64, h: 64 },
      { kind: 'case', x: 420, y: 90, w: 90, h: 46 },
      { kind: 'case', x: 1020, y: 480, w: 90, h: 46 },
    ],
    shadows: [
      { x: 60, y: 60, w: 200, h: 120 },
      { x: 1080, y: 560, w: 140, h: 120 },
      { x: 560, y: 480, w: 180, h: 140 },
    ],
    lamps: [
      { x: 200, y: 360, r: 120 },
      { x: 800, y: 140, r: 130 },
      { x: 560, y: 640, r: 120 },
    ],
    relics: [
      { x: 180, y: 640 },
      { x: 600, y: 160 },
      { x: 1180, y: 300 },
    ],
    guards: [
      { path: [{ x: 90, y: 180 }, { x: 90, y: 420 }] },
      { path: [{ x: 420, y: 300 }, { x: 600, y: 300 }] },
      { path: [{ x: 900, y: 120 }, { x: 1080, y: 120 }] },
      { path: [{ x: 700, y: 480 }, { x: 700, y: 640 }] },
      { path: [{ x: 1020, y: 420 }, { x: 1180, y: 420 }] },
    ],
  },
];
