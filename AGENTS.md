# AGENTS.md

## Project Overview

This is a TypeScript CLI tool (`tlf`) for managing **The Loathing Foundation's** monthly item raffle in [Kingdom of Loathing (KoL)](https://www.kingdomofloathing.com/), run via [KoLmafia](https://wiki.kolmafia.us/). The foundation distributes in-game items (IOTMs) to participants through a ranked-choice raffle system.

The script runs inside KoLmafia's embedded JavaScript runtime (Rhino 1.7.14), not Node.js. It is compiled from TypeScript via esbuild + Babel.

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Runtime target:** Rhino 1.7.14 (KoLmafia's JS engine, NOT Node.js)
- **Bundler:** esbuild with Babel plugin (`build.mjs`)
- **Linting:** ESLint + Prettier (100 char line width)
- **Package manager:** Yarn
- **Key libraries:**
  - `kolmafia` — KoLmafia API bindings (file I/O via `bufferToFile`/`fileToBuffer`, `Item`, `getPlayerName`, etc.). This is an external package provided by the runtime — it is never bundled.
  - `libram` — KoLmafia utility library (provides the `Kmail` class for sending/receiving kmails)
  - `grimoire-kolmafia` — CLI argument parsing (`Args`)

## Architecture

```
src/
├── main.ts              # Entry point: CLI arg parsing + task dispatch
├── tasks/               # One file per command/task
│   ├── index.ts         # Barrel re-export of all tasks
│   ├── announceStart.ts
│   ├── announceWinners.ts
│   ├── processInbox.ts
│   ├── registerResult.ts
│   └── generateStatistics.ts
├── types/               # TypeScript interfaces
│   ├── index.ts         # Barrel re-export
│   ├── Entry.ts         # { date, message, rankings: { key, item }[] }
│   ├── ItemPool.ts      # { standard: { name, quantity }[], legacy: { name, quantity }[] }
│   └── Result.ts        # { date, playerId, playerName, rankCode, item }
├── data/
│   ├── itemPools.ts     # Record<"YYYY-MM", ItemPool> — the monthly raffle item definitions
│   └── participants.ts  # Array of KoL player IDs registered with the foundation
├── entries.ts           # Load/save monthly entry JSON files
├── results.ts           # Load/save raffle results JSON
├── itemPools.ts         # Item pool lookups and rank code utilities
└── time.ts              # Date formatting and key generation helpers
```

### Data flow

- **Item pools** are defined statically in `src/data/itemPools.ts`, keyed by `"YYYY-MM"`.
- **Participants** are a static array of player IDs in `src/data/participants.ts`.
- **Entries** (player rankings) are stored as JSON files on KoLmafia's filesystem: `TLF-entries-YYYY-MM.json`.
- **Results** (raffle outcomes) are stored in a single file: `TLF-raffle-results.json`.
- **Message log** tracks processed kmails to avoid duplicates: `TLF-message-log.json`.

### Rank code system

Items in the pool are assigned rank codes based on their position in the arrays:
- **Standard items** get letter codes: A, B, C, D... (index 0 = A, 1 = B, etc.)
- **Legacy items** get number codes: 1, 2, 3... (index 0 = 1, 1 = 2, etc.)

Players submit rankings like `[A, 1, C, B]` to express their preferences.

## Commands

All commands are invoked through `main.ts` via `grimoire-kolmafia` Args. The shared flags are:

| Flag | Purpose |
|---|---|
| `--date YYYY-MM` | Target month (defaults to current) |
| `--forRealsies` | Actually send kmails / save files |
| `--debug` | Verbose output; prevents sends/saves (overrides `forRealsies`) |

Tasks:
1. **`kickoff`** — Send monthly raffle announcement kmail to all participants
2. **`processInbox`** — Read incoming kmails, parse rankings, save entries, send confirmations
3. **`announceWinners`** — Send results kmail to all participants
4. **`registerResult`** — Record a winner (requires `--playerId` and `--rankCode`)
5. **`generateStatistics`** — Print participation and distribution stats across all months

## How to Add a New Task

Follow this checklist:

### 1. Create the task file

Create `src/tasks/myNewTask.ts`. Follow the established function signature pattern:

```typescript
export const myNewTask = (baseDate = new Date(), send = false, debug = false) => {
	// Use console.log() for output
	// Respect the send and debug flags:
	//   - If !send || debug: do NOT send kmails or save files
	//   - If debug: print extra verbose output
};
```

Import utilities as needed:
- `getItemPool(date)` from `../itemPools` — get the item pool for a month
- `loadEntries(date)` / `saveEntries(entries, date)` from `../entries` — entry I/O
- `loadResults()` / `saveResults(results)` from `../results` — result I/O
- `getDateKey(date)` / `getMonthName(date)` / `formatDate(date)` from `../time` — date helpers
- `participants` from `../data/participants` — the list of registered player IDs
- `Kmail` from `libram` — for sending kmails
- `getRankCodes(itemPool)` / `getItemByRankCode(code, pool)` from `../itemPools` — rank code utilities

### 2. Export from the barrel file

Add to `src/tasks/index.ts`:
```typescript
export * from "./myNewTask";
```

### 3. Register the command in main.ts

Add a flag to the `Args.create()` config object:
```typescript
myNewTask: Args.flag({
	help: "Description of what this task does.",
	setting: "",
}),
```

Add a conditional block in the `main()` function (before the `registerResult` block, which has extra argument handling):
```typescript
if (config.myNewTask) {
	myNewTask(baseDate, config.forRealsies, config.debug);
	return;
}
```

### 4. If adding new args

Add extra `Args.string()` or `Args.flag()` entries to the config object in `main.ts`, then pass them through in the dispatch block. See `registerResult` for an example of a task with additional required args (`playerId`, `rankCode`).

## How to Add a New Month's Item Pool

Add a new `"YYYY-MM"` key to the `itemPools` record in `src/data/itemPools.ts`:

```typescript
"2026-02": {
	standard: [
		{ name: "exact KoL item name", quantity: 1 },
	],
	legacy: [
		{ name: "exact KoL item name", quantity: 1 },
	],
},
```

- Item names must exactly match KoLmafia's item database (they are resolved via `Item.get()`).
- The order of items in each array determines their rank codes (standard: A, B, C...; legacy: 1, 2, 3...).
- `quantity` indicates how many of that item are available for distribution that month.

## Build and Lint

```bash
yarn build        # Compile TypeScript → dist/scripts/tlf/tlf.js
yarn lint         # Check Prettier formatting
yarn format       # Apply Prettier formatting
```

CI runs `yarn build` and `yarn lint` on pushes/PRs to `main`.

There is no automated test suite. Testing is done manually via KoLmafia using the `--debug` flag to preview behavior before using `--forRealsies`.

## Code Style

- Prefer `const` and arrow functions
- Use template literals over string concatenation
- Use strict equality (`===`)
- No `var` declarations, no non-const enums
- Imports are sorted (enforced by ESLint + Prettier plugin)
- 100-character line width, tab indentation
- Export named functions (not default exports) from task files
- Use barrel `index.ts` files for re-exports in `tasks/` and `types/`

## Important Constraints

- **Account guard:** `main.ts` exits immediately if not running on account #3580284 (TheLoathingFoundation). Do not remove this check.
- **Send/save safety:** All tasks that send kmails or write files must respect the `send`/`forRealsies` and `debug` flags. Never send or save by default. The pattern is: `if (send && !debug)` to gate side effects.
- **No Node.js APIs:** The runtime is Rhino, not Node. File I/O uses KoLmafia's `bufferToFile`/`fileToBuffer`, not `fs`. There is no `fetch`, `process`, etc.
- **Entry JSON files are git-ignored.** They live on KoLmafia's filesystem, not in the repo.
- **The `kolmafia` package is external.** It is provided by the KoLmafia runtime and must never be bundled — it is listed in `external` in `build.mjs`.
