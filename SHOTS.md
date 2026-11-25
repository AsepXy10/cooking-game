# Warung Kilat — screenshot plan

The VM has no Chrome, so no screenshots exist yet. Capture them on the
user's PC Chrome from this repo served by GitHub Pages (the repo will be
`AsepXy10/cooking-game`, shotter at
`https://asepxy10.github.io/cooking-game/shotter.html?shot=<name>`).

## How to capture one shot

1. Open `shotter.html?shot=<name>` in desktop Chrome (1280×720 iframe).
2. Wait for the status line to say the shot is ready — the harness downloads
   `<name>.jpg` automatically (JPEG q80, 1280×720).
3. **Verify the download**: check the file actually landed in Downloads and
   note its exact byte size. A "downloaded" message alone is not proof.
4. Put the file in `screenshots/` as `1-kitchen.jpg`, `2-serve.jpg`,
   `3-rush.jpg`, `4-combo.jpg` (first by name is the cover).

## The four shots

| File | Shot | What must be visible |
| ---- | ---- | -------------------- |
| `1-kitchen.jpg` | `?shot=kitchen` | **Cover.** Full kitchen + order board with 3 tickets, ingredients on the counter, a dish mid-assembly in the wok (rice cooking, chicken + egg done), the shift timer at 1:02, a complete Nasi Goreng Telur on the plate glowing "SIAP!", combo x3, sambal held at the cursor. |
| `2-serve.jpg` | `?shot=serve` | Plating/serve moment: complete Mie Goreng Spesial on the plate, "+30" and "TIP +8" floats, coins flying to the serve window, "Terakhir: Nasi Goreng Ayam" in the window, 2 tickets waiting. |
| `3-rush.jpg` | `?shot=rush` | Rush hour: 4 tickets (one patience bar almost empty, red), a full wok with one portion burning ("GOSONG!"), "JAM SIBUK!" banner, timer at 0:38, plate mid-assembly (rice + chicken). |
| `4-combo.jpg` | `?shot=combo` | Combo moment: KOMBO x6, "+32" float, 214 coins, day 3, complete Mie Ayam Kilat on the plate, 2 tickets. |

## Checks before submit

- Each file ≤ 256 KiB, 1280×720, real JPEG renders of the game's own code.
- Exactly 3–4 files in `screenshots/`, names starting with a digit so the
  cover (`1-kitchen.jpg`) sorts first.
- Re-run `MAKEFUN_OUTPUT_DIR=out node main.ts` after adding the shots and
  confirm `out/dossier.json` lists all four.
