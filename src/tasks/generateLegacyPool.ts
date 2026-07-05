import { bufferToFile, getDisplay, random } from "kolmafia";

import { arrangeItems, fetchArrangement, findShelfNumber } from "../displayCase";
import { getDateKey } from "../time";
import type { ItemClass } from "../types";

const POOL_SIZE = 12;
const OUTPUT_FILE = "TLF-legacy-pool.json";
const MATURE_SHELF = '"Mature" Legacy Items';
const LEGACY_POOL_SHELF = "Legacy Pool";

interface Copy {
	name: string;
	itemId: number;
}

/**
 * Build the quarterly legacy pool. Expand the "Mature" Legacy Items shelf into
 * one entry per physical copy (an item with 4 copies gets 4 chances), draw
 * POOL_SIZE copies at random, move the drawn item types onto the Legacy Pool
 * shelf, and write the pool as JSON for src/data/itemPools.ts.
 *
 * Refuses to run if the Legacy Pool shelf already holds items — clear it first.
 * Dry-run by default; pass forRealsies (send) to move shelves and write the
 * file. debug forces a dry run.
 */
export const generateLegacyPool = (baseDate = new Date(), send = false, debug = false) => {
	const { shelves, items } = fetchArrangement();

	const matureShelf = findShelfNumber(shelves, MATURE_SHELF);
	if (matureShelf < 0) {
		console.log(`Could not find the "${MATURE_SHELF}" shelf. Aborting.`);
		return;
	}
	const legacyPoolShelf = findShelfNumber(shelves, LEGACY_POOL_SHELF);
	if (legacyPoolShelf < 0) {
		console.log(`Could not find the "${LEGACY_POOL_SHELF}" shelf. Aborting.`);
		return;
	}

	// Refuse to build over an existing pool — the user must clear it first.
	const existing = items.filter((entry) => entry.shelf === legacyPoolShelf);
	if (existing.length > 0) {
		console.log(`# Legacy pool builder\n`);
		console.log(
			`!! The "${LEGACY_POOL_SHELF}" shelf already holds ${existing.length} item type(s):`,
		);
		existing.forEach((entry) => console.log(`* ${entry.item.name}`));
		console.log(`\nClear that shelf before building a new pool. Aborting — nothing changed.`);
		return;
	}

	// Expand the mature shelf into one entry per physical copy.
	const display = getDisplay();
	const matureItems = items.filter((entry) => entry.shelf === matureShelf);
	const copies: Copy[] = [];
	matureItems.forEach((entry) => {
		const quantity = display[entry.item.name] ?? 0;
		for (let i = 0; i < quantity; i++) {
			copies.push({ name: entry.item.name, itemId: entry.itemId });
		}
	});

	console.log(`# Legacy pool builder\n`);
	console.log(`${matureItems.length} mature legacy item type(s), ${copies.length} total copies.`);

	if (copies.length === 0) {
		console.log(`\nNothing on the "${MATURE_SHELF}" shelf to draw from. Aborting.`);
		return;
	}

	const drawCount = Math.min(POOL_SIZE, copies.length);
	if (drawCount < POOL_SIZE) {
		console.log(
			`\nWARNING: only ${copies.length} copies available; drawing ${drawCount} (< ${POOL_SIZE}).`,
		);
	}

	// Partial Fisher-Yates: shuffle the first drawCount entries into place using
	// KoLmafia's RNG (random(n) returns 0..n-1), then take them.
	for (let i = 0; i < drawCount; i++) {
		const j = i + random(copies.length - i);
		const swap = copies[i];
		copies[i] = copies[j];
		copies[j] = swap;
	}
	const picks = copies.slice(0, drawCount);

	// Tally how many copies of each type were drawn.
	const tally: Record<number, { name: string; itemId: number; quantity: number }> = {};
	picks.forEach((pick) => {
		if (tally[pick.itemId] === undefined) {
			tally[pick.itemId] = { name: pick.name, itemId: pick.itemId, quantity: 0 };
		}
		tally[pick.itemId].quantity++;
	});
	const drawn = Object.keys(tally).map((id) => tally[Number(id)]);

	console.log(`\n## Drawn pool (${drawCount} copies, ${drawn.length} type(s))\n`);
	drawn.forEach((entry) => {
		const available = display[entry.name] ?? entry.quantity;
		// Whole item types move to the shelf, so flag when not every copy was drawn.
		const note = entry.quantity < available ? ` (${available} on shelf)` : "";
		console.log(`* ${entry.name} x${entry.quantity}${note}`);
	});

	const legacy: ItemClass[] = drawn.map((entry) => ({
		name: entry.name,
		quantity: entry.quantity,
	}));
	const key = getDateKey(baseDate);
	const poolJson = JSON.stringify({ [key]: { standard: [], legacy } }, null, "\t");

	console.log(`\n## Pool JSON (for src/data/itemPools.ts)\n`);
	console.log(poolJson);

	if (!send || debug) {
		console.log(
			`\nDry run — no shelves moved, no file written. Re-run with \`forRealsies\` to apply.`,
		);
		return;
	}

	// Move the drawn item types onto the Legacy Pool shelf and save the JSON.
	arrangeItems(drawn.map((entry) => ({ itemId: entry.itemId, shelf: legacyPoolShelf })));
	const wrote = bufferToFile(poolJson, OUTPUT_FILE);
	console.log(
		`\nMoved ${drawn.length} type(s) to "${LEGACY_POOL_SHELF}" and ` +
			`${wrote ? "wrote" : "FAILED to write"} ${OUTPUT_FILE}.`,
	);
};
