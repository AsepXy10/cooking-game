# Warung Kilat — Masak Cepat, Antar Tepat!

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/AsepXy10/cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/AsepXy10/cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

An original cooking game built for the [best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). You run the busiest nasi goreng stall in town: take orders from the board, fry ingredients in the wok, mind the burn, plate the dish, and serve it before the customer's patience runs out.

## How to play

1. **Take ingredients** — click a bin on the counter (or keys `1`–`8`).
2. **Cook in the wok** — click the wok to drop food in. Portions go raw → cooking → done → burning → burnt. Stir with `Space` (or click the wok) to cook faster and rescue a burning portion.
3. **Plate it** — click a done portion in the wok to move it to the plate. When the plate matches a ticket's recipe it glows green: **SIAP!**
4. **Serve** — click the ready plate (or the serve window) to deliver it. Fast service pays a tip; serving in a row builds a combo.

Three working days, a growing menu (6 dishes), and a rush hour halfway through every shift. Burned food must be trashed by clicking it. An order that waits too long walks out and breaks your combo.

## Controls

| Input | Action |
| ----- | ------ |
| Click / tap | Pick, drop, stir, plate, serve |
| `1`–`8` | Pick an ingredient bin |
| `Space` | Stir the wok |
| `Enter` | Serve the ready plate |
| `P` | Pause |
| `M` | Mute |
| `R` | Restart (results screen) |

## Run it

Static files, no build step, no network requests. Serve `game/` with any
static server and open `game/index.html` in desktop Chrome:

```sh
node serve.ts
# open http://localhost:8080
```

Sounds are synthesized with WebAudio — no audio files.

## Screenshots

The game stages four scenes for the entry screenshots
(`game/index.html?shot=kitchen|serve|rush|combo`); see `SHOTS.md` for the
capture plan. Screenshots are real renders of the game's own code.

## Hand in

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## Structure

- `game/index.html` — page shell and canvas
- `game/style.css` — page chrome around the canvas
- `game/src/main.js` — boot, game loop, three-day shift flow
- `game/src/recipes.js` — menu, ingredients, dish matching
- `game/src/kitchen.js` — wok, plate, bins, serve window, cooking rules
- `game/src/orders.js` — order tickets, patience, tips, serving
- `game/src/render.js` — everything drawn on the canvas
- `game/src/input.js` — mouse and keyboard, hit-testing
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/shots.js` — staged scenes for the screenshots
- `vendor/makefun-game.ts` — make.fun dossier library, unchanged from the kit

## License

MIT — see `LICENSE`.
