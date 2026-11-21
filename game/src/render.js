// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with the backdrop
// colour. The floor is a checker of dark tiles; lamp pools are warm light, shadow zones are
// dark (safe), walls and cover are solid, guards are red with a vision cone that hugs the
// walls, the thief is a green hooded figure, and the exit glows green.
import { FIELD, FONT, LIVES, PALETTE } from './config.js';
import { MODE_ALERT, MODE_INVESTIGATE, MODE_SEARCH, MODE_SUSPICIOUS } from './world.js';
import { coneFan } from './vision.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

/** The panel's width; its height grows with its lines: room for the title, the lines and the prompt. */
const PANEL = { width: 640, top: 128, line: 32, bottom: 72 };
const TILE = 80;

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

/** Deterministic speckle for a tile, from its coordinates alone. */
function tileSpeckle(tx, ty) {
  let hash = (tx * 374761393 + ty * 668265263) ^ 0x5bf03635;
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const levelLabel = cachedLabel('');
  const bestLabel = cachedLabel('Best ');
  const finalLabel = cachedLabel('Score ');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawFloor(level) {
    for (let ty = 0; ty < FIELD.height / TILE; ty += 1) {
      for (let tx = 0; tx < FIELD.width / TILE; tx += 1) {
        context.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
        context.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        if (tileSpeckle(tx, ty) > 0.86) {
          context.fillStyle = PALETTE.floorLine;
          context.fillRect(tx * TILE + 14 + tileSpeckle(ty, tx) * 40, ty * TILE + 18 + tileSpeckle(tx + 9, ty) * 36, 5, 5);
        }
      }
    }
    // Shadow zones: dark and safe.
    for (const zone of level.shadows) {
      context.fillStyle = PALETTE.shadow;
      context.globalAlpha = 0.62;
      context.fillRect(zone.x, zone.y, zone.w, zone.h);
      context.globalAlpha = 1;
      context.strokeStyle = 'rgba(255,255,255,0.07)';
      context.lineWidth = 2;
      context.strokeRect(zone.x + 1, zone.y + 1, zone.w - 2, zone.h - 2);
    }
    // Lamp pools: warm light where guards spot you fast.
    for (const lamp of level.lamps) {
      const gradient = context.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
      gradient.addColorStop(0, 'rgba(242, 201, 76, 0.20)');
      gradient.addColorStop(1, 'rgba(242, 201, 76, 0)');
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.lampGlow;
      context.beginPath();
      context.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawBlockers(level) {
    for (const wall of level.walls) {
      context.fillStyle = PALETTE.wall;
      context.fillRect(wall.x, wall.y, wall.w, wall.h);
      context.fillStyle = PALETTE.wallTop;
      context.fillRect(wall.x, wall.y, wall.w, Math.min(6, wall.h));
    }
    for (const item of level.cover) {
      if (item.kind === 'crate') {
        context.fillStyle = PALETTE.crate;
        context.fillRect(item.x, item.y, item.w, item.h);
        context.fillStyle = PALETTE.crateTop;
        context.fillRect(item.x, item.y, item.w, 6);
        context.strokeStyle = 'rgba(0,0,0,0.35)';
        context.lineWidth = 2;
        context.strokeRect(item.x + 1, item.y + 1, item.w - 2, item.h - 2);
        context.beginPath();
        context.moveTo(item.x, item.y);
        context.lineTo(item.x + item.w, item.y + item.h);
        context.moveTo(item.x + item.w, item.y);
        context.lineTo(item.x, item.y + item.h);
        context.stroke();
      } else {
        context.fillStyle = PALETTE.caseFrame;
        context.fillRect(item.x, item.y, item.w, item.h);
        context.fillStyle = PALETTE.caseGlass;
        context.fillRect(item.x + 5, item.y + 5, item.w - 10, item.h - 10);
        context.fillStyle = 'rgba(255,255,255,0.16)';
        context.fillRect(item.x + 8, item.y + 8, item.w - 16, 7);
      }
    }
  }

  function drawExit(level, time) {
    const exit = level.exit;
    const pulse = 0.16 + 0.08 * Math.sin(time * 3);
    context.fillStyle = PALETTE.exitGlow;
    context.fillRect(exit.x - 10, exit.y - 10, exit.w + 20, exit.h + 20);
    context.fillStyle = PALETTE.exit;
    context.globalAlpha = 0.85 + pulse;
    context.fillRect(exit.x, exit.y, exit.w, exit.h);
    context.globalAlpha = 1;
    context.fillStyle = '#0b3d1e';
    context.fillRect(exit.x + exit.w / 2 - 3, exit.y + 8, 6, exit.h - 16);
    text('EXIT', exit.x + exit.w / 2, exit.y - 10, 18, PALETTE.exit, 'center');
  }

  function drawRelics(state, time) {
    for (const relic of state.relics) {
      if (relic.taken) continue;
      const pulse = 1 + 0.12 * Math.sin(time * 4 + relic.x);
      const size = 11 * pulse;
      const glow = context.createRadialGradient(relic.x, relic.y, 2, relic.x, relic.y, 30);
      glow.addColorStop(0, 'rgba(255, 217, 77, 0.45)');
      glow.addColorStop(1, 'rgba(255, 217, 77, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(relic.x, relic.y, 30, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.relic;
      context.beginPath();
      context.moveTo(relic.x, relic.y - size);
      context.lineTo(relic.x + size, relic.y);
      context.lineTo(relic.x, relic.y + size);
      context.lineTo(relic.x - size, relic.y);
      context.closePath();
      context.fill();
      context.fillStyle = '#fff6c9';
      context.beginPath();
      context.moveTo(relic.x, relic.y - size * 0.45);
      context.lineTo(relic.x + size * 0.45, relic.y);
      context.lineTo(relic.x, relic.y + size * 0.45);
      context.lineTo(relic.x - size * 0.45, relic.y);
      context.closePath();
      context.fill();
    }
  }

  function drawPebbles(state) {
    for (const pebble of state.pebbles) {
      const progress = pebble.age / 1.1;
      context.strokeStyle = `rgba(200, 205, 216, ${1 - progress})`;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(pebble.x, pebble.y, 6 + progress * 46, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = PALETTE.pebble;
      context.beginPath();
      context.arc(pebble.x, pebble.y, 4, 0, Math.PI * 2);
      context.fill();
    }
  }

  function coneColor(mode) {
    if (mode === MODE_ALERT) return PALETTE.coneAlert;
    if (mode === MODE_SUSPICIOUS || mode === MODE_INVESTIGATE || mode === MODE_SEARCH) return PALETTE.coneSuspicious;
    return PALETTE.coneCalm;
  }

  function drawGuards(state) {
    for (const guard of state.guards) {
      // Faint dotted patrol route, so the player can learn the pattern.
      context.strokeStyle = 'rgba(255,255,255,0.13)';
      context.lineWidth = 2;
      context.setLineDash([2, 8]);
      context.beginPath();
      for (let index = 0; index < guard.path.length; index += 1) {
        const point = guard.path[index];
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      }
      context.closePath();
      context.stroke();
      context.setLineDash([]);

      // Vision cone, clipped by walls.
      const fan = coneFan(guard.x, guard.y, guard.angle, 0.66, 250, state.blockers, 26);
      context.fillStyle = coneColor(guard.mode);
      context.beginPath();
      context.moveTo(guard.x, guard.y);
      for (const point of fan) context.lineTo(point.x, point.y);
      context.closePath();
      context.fill();

      // Body: a watchman with a lantern, facing along the cone.
      context.fillStyle = guard.mode === MODE_ALERT ? '#ff8a80' : PALETTE.guard;
      context.beginPath();
      context.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#3d0d0a';
      context.beginPath();
      context.arc(guard.x + Math.cos(guard.angle) * 6, guard.y + Math.sin(guard.angle) * 6, 5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.lampGlow;
      context.beginPath();
      context.arc(guard.x + Math.cos(guard.angle) * 16, guard.y + Math.sin(guard.angle) * 16, 3, 0, Math.PI * 2);
      context.fill();

      // Detection meter above the head, then ? or !.
      if (guard.detection > 0.02 && guard.mode !== MODE_ALERT) {
        context.fillStyle = 'rgba(0,0,0,0.6)';
        context.fillRect(guard.x - 16, guard.y - 30, 32, 6);
        context.fillStyle = guard.detection >= 0.5 ? PALETTE.guardSuspicious : PALETTE.lampGlow;
        context.fillRect(guard.x - 15, guard.y - 29, 30 * guard.detection, 4);
      }
      if (guard.mode === MODE_SUSPICIOUS) {
        text('?', guard.x, guard.y - 32, 22, PALETTE.guardSuspicious, 'center');
      } else if (guard.mode === MODE_ALERT) {
        text('!', guard.x, guard.y - 32, 24, '#ff6b61', 'center');
      }
    }
  }

  function drawPlayer(state, time) {
    const player = state.player;
    // The thief's own lantern glow.
    const glow = context.createRadialGradient(player.x, player.y, 4, player.x, player.y, 64);
    glow.addColorStop(0, 'rgba(94, 230, 168, 0.16)');
    glow.addColorStop(1, 'rgba(94, 230, 168, 0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(player.x, player.y, 64, 0, Math.PI * 2);
    context.fill();

    context.globalAlpha = player.hidden ? 0.55 : 1;
    // Hooded cloak: a circle with a pointed hood toward the facing angle.
    context.fillStyle = player.sneak ? PALETTE.playerDark : PALETTE.player;
    context.beginPath();
    context.arc(player.x, player.y, 13, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(player.x + Math.cos(player.angle) * 18, player.y + Math.sin(player.angle) * 18);
    context.lineTo(player.x + Math.cos(player.angle + 2.5) * 10, player.y + Math.sin(player.angle + 2.5) * 10);
    context.lineTo(player.x + Math.cos(player.angle - 2.5) * 10, player.y + Math.sin(player.angle - 2.5) * 10);
    context.closePath();
    context.fill();
    context.fillStyle = '#0b2b1d';
    context.beginPath();
    context.arc(player.x + Math.cos(player.angle) * 4, player.y + Math.sin(player.angle) * 4, 4, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    if (player.hidden) {
      text('HIDDEN', player.x, player.y + 30, 13, '#b8c4d4', 'center');
    } else if (player.sneak) {
      text('SNEAKING', player.x, player.y + 30, 13, '#8fd8b4', 'center');
    }
    void time;
  }

  function drawField(state, time) {
    const level = state.level;
    drawFloor(level);
    drawExit(level, time);
    drawRelics(state, time);
    drawPebbles(state);
    drawBlockers(level);
    drawGuards(state);
    drawPlayer(state, time);
  }

  function drawHud(state, best) {
    context.textBaseline = 'top';
    const level = state.level;
    text(levelLabel(`${state.levelIndex + 1} · ${level.name}`), 20, 16, 22, PALETTE.text, 'left');
    text(scoreLabel(state.score), FIELD.width - 20, 16, 22, PALETTE.text, 'right');
    context.textBaseline = 'alphabetic';

    // Lives as lanterns, relics as diamonds.
    for (let life = 0; life < LIVES; life += 1) {
      context.fillStyle = life < state.lives ? PALETTE.lampGlow : 'rgba(255,255,255,0.15)';
      context.beginPath();
      context.arc(28 + life * 26, 56, 7, 0, Math.PI * 2);
      context.fill();
    }
    const relicsTaken = state.relics.filter((relic) => relic.taken).length;
    text(`Relics ${relicsTaken}/${state.relics.length}`, 20, 78, 18, PALETTE.muted, 'left');
    if (state.pebbleCooldown > 0) {
      text('Pebble…', FIELD.width - 20, 48, 16, PALETTE.muted, 'right');
    }

    // The "seen" meter: the most suspicious guard's detection, centre top.
    const width = 220;
    const x = (FIELD.width - width) / 2;
    context.fillStyle = 'rgba(0,0,0,0.55)';
    context.fillRect(x - 8, 12, width + 16, 26);
    context.fillStyle = state.maxDetection >= 0.5 ? PALETTE.guardSuspicious : 'rgba(255,255,255,0.18)';
    context.fillRect(x, 18, width * state.maxDetection, 8);
    text(state.anyAlert ? 'SPOTTED!' : state.maxDetection >= 0.5 ? 'SUSPICIOUS' : 'UNSEEN', FIELD.width / 2, 42, 15, state.anyAlert ? '#ff6b61' : PALETTE.muted, 'center');

    text('WASD / arrows move · Shift sneak · Click throws a pebble · P pauses', FIELD.width / 2, FIELD.height - 26, 15, PALETTE.muted, 'center');
    void best;
  }

  function drawPanel(title, lines, prompt, dim = true) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    if (dim) {
      context.fillStyle = 'rgba(11, 14, 20, 0.72)';
      context.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = 'rgba(242, 201, 76, 0.35)';
    context.lineWidth = 2;
    context.strokeRect(x + 1, y + 1, PANEL.width - 2, height - 2);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 72, 44, PALETTE.text, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 36, 22, PALETTE.lampGlow, 'center');
  }

  const TITLE_LINES = [
    'Three galleries. Three relics a gallery. One way out — unseen.',
    'Sneak in the dark, hide behind crates and cases,',
    'throw pebbles to pull a watchman away, and mind the lamps:',
    'light is where they spot you fast. Reach the green exit.',
    'Move with WASD or arrows. Hold Shift to sneak.',
    'Click the floor to throw a pebble at that spot.',
    '',
  ];
  const PAUSED_LINES = ['The watchmen will wait for you.'];
  const CAUGHT_LINES = ['A watchman caught you by the lantern light.'];
  const OVER_LINES = ['', ''];
  const WIN_LINES = ['', ''];

  /** Paint one frame: the field, then the HUD or a panel for the screen the game is on. */
  function draw(state, screen, best, time) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state, time);
    if (screen === SCREEN_TITLE) {
      TITLE_LINES[6] = bestLabel(best);
      drawPanel('Lantern Thief', TITLE_LINES, 'Press Space or click to begin the heist', false);
      return;
    }
    drawHud(state, best);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', PAUSED_LINES, 'Press P to slip back into the dark');
    } else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = finalLabel(state.score);
      OVER_LINES[1] = bestLabel(best);
      drawPanel('Caught for good', OVER_LINES, 'Press Space or click to try the heist again');
    } else if (screen === SCREEN_WIN) {
      WIN_LINES[0] = finalLabel(state.score);
      WIN_LINES[1] = bestLabel(best);
      drawPanel('The heist is done', WIN_LINES, 'Press Space or click to steal it all again');
    } else if (state.status === 'caught') {
      drawPanel('Caught!', CAUGHT_LINES, '');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
