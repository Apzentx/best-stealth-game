# Lantern Thief

[![make.fun bounty](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Apzentx/best-stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Apzentx/best-stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

An original top-down stealth game built for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).

You are a hooded thief sneaking through three galleries — The Marble Hall, The Jade Wing, and The Vault of Embers — to reach the green exit unseen. Guards patrol learnable routes with wall-clipped vision cones; step into a cone and their detection meter climbs from calm to suspicious (`?`) to full alert (`!`) and chase. Hide in shadow zones, slip through lamp pools quickly, sneak with Shift, and throw a pebble (click) to lure a guard away to investigate. Grab the three optional relics in each level if you dare. Three lives, pause, game over and restart, and a win screen.

## Play

Open `game/index.html` in a desktop browser — no build step, no network requests, everything is local files.

- **Move:** WASD / arrow keys
- **Sneak:** hold Shift (slower, harder to spot)
- **Throw a pebble:** click (lures nearby guards to investigate)
- **Pause:** P · **Start / restart:** Space

## Layout

- `game/` — the static game (plain HTML/CSS/JS, no libraries)
- `screenshots/` — screenshots of the game running in a browser
- `main.ts` — hands the game in (copies `game/` and `screenshots/` to `/output` and writes `dossier.json`)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE).
