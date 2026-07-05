# tlf

Tools for running **The Loathing Foundation's** main Kingdom of Loathing account.

Steps that touch KoL run as `tlf` commands inside KoLmafia's gCLI (the script is
TypeScript compiled to Rhino via Rollup). Steps that touch GitHub or Google Sheets
run as `yarn` scripts in this repo (Node).

## Monthly kickoff recipe

Each month the foundation runs a raffle. The full start-of-month sequence:

> **Everything that sends kmails, moves items, or posts publicly is dry-run by
> default.** Run it, read the output, then re-run with `forRealsies` (mafia) to
> commit. That review is the safety gate — don't automate it away.

Legend: ✅ built · 🔧 to build · ✋ manual

| # | Step | Where | Command | Status |
|---|------|-------|---------|--------|
| 1 | Sync the participant list from the sign-up sheet | repo (node) | `TLF_SHEET_ID=<id> yarn update-participants` | ✅ |
| 2 | Consolidate the Minting Pool (deposit + shelve Mr. A's / Uncle Bucks) | KoL (mafia) | `tlf syncMintingPool forRealsies` | ✅ |
| 3 | Organize the case by category **and value** (mature → Available Standard / Mature Legacy) | KoL (mafia) | `tlf syncDisplayCase forRealsies` | ✅ |
| 4 | Draw a new legacy pool — **quarterly, only when depleted** | KoL (mafia) | `tlf generateLegacyPool forRealsies` | ✅ |
| 5 | Post the legacy draw results to GitHub (cf. discussion #63) | repo (node) | `yarn post-legacy-draw` | 🔧 |
| 6 | Build the month's draw pool from the Available Standard + Legacy Pool shelves | KoL (mafia) | `tlf generateMonthlyPool forRealsies` | ✅ |
| 7 | Record the month's pool in `src/data/itemPools.ts`, then rebuild | repo (node) | `yarn archive-item-pool --date YYYY-MM && yarn build` | 🔧 |
| 8 | Send the kickoff announcement kmail | KoL (mafia) | `tlf kickoff forRealsies` | ✅ |
| 9 | Post the monthly announcement to GitHub (cf. discussion #67) | repo (node) | `yarn post-monthly --date YYYY-MM` | 🔧 |

Notes:

- **Maturity rule:** an item becomes available for trade once its cheapest mall
  price clears twice its original Mr. A cost. `syncDisplayCase` sorts on this for
  both standard (→ Available Standard) and legacy (→ Mature Legacy). Mature
  standard items are released gradually — `generateMonthlyPool` offers
  `max(1, round(copies / 12))` of each per month
  ([FAQ](https://foundation.loathers.net/faq#availableForTrade)).
- **Steps 4–5 are quarterly.** A batch of 12 legacy items is drawn, then
  distributed up to four per month until the pool runs out.
- **`tlf kickoff` reads the pool from the compiled `itemPools.ts`,** so step 7's
  rebuild must land before step 8.
- Command names for the 🔧 steps are proposals, not final.

After kickoff, the rest of the raffle runs later in the month via `tlf
processInbox` (collect rankings), `tlf registerResult` (record winners), and `tlf
announceWinners`.

### Command reference

| Command | Purpose |
|---|---|
| `tlf syncMintingPool` | Deposit and shelve Mr. A's / Uncle Bucks onto the Minting Pool |
| `tlf syncDisplayCase` | Sort the display case onto its shelves by category and cheapest mall price |
| `tlf generateLegacyPool` | Randomly draw the quarterly legacy pool and stage the Legacy Pool shelf |
| `tlf generateMonthlyPool` | Build the month's draw pool from the Available Standard + Legacy Pool shelves |
| `tlf dumpDisplayCase` | Snapshot the display case (with prices) to JSON |
| `tlf kickoff` | Send the monthly raffle announcement kmail |
| `tlf processInbox` | Read incoming kmails, parse rankings, save entries |
| `tlf registerResult` | Record a raffle winner |
| `tlf announceWinners` | Send the results kmail |
| `tlf generateStatistics` | Print participation / distribution stats |

Add `--date YYYY-MM` to target a specific month, `forRealsies` to commit side
effects, and `--debug` for verbose output (forces a dry run).

## Development

Compile the TypeScript into a KoLmafia-runnable script:

```bash
yarn build
```

Symlink the built script into KoLmafia so `tlf` works in the gCLI:

```bash
yarn install-mafia
```

The build is a one-shot Rollup run — re-run `yarn build` after changes, then run
`tlf` in the KoLmafia CLI. Before committing, run `yarn typecheck` and `yarn
lint` (or `yarn format` to apply Prettier).

> Uses **Yarn v1 (classic)**. Do not run this through Corepack's Yarn 4 — it
> rewrites the lockfile format.
