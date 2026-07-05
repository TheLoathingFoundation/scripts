import { bufferToFile, getDisplay } from "kolmafia";

import { fetchArrangement, findShelfNumber } from "../displayCase";
import { getDateKey } from "../time";
import type { ItemClass } from "../types";

const OUTPUT_FILE = "TLF-monthly-pool.json";
const AVAILABLE_STANDARD_SHELF = "Available Standard Items";
const LEGACY_POOL_SHELF = "Legacy Pool";
// A mature standard item is released gradually: each month it offers
// max(1, round(copies / 12)) of its copies (see foundation FAQ).
const STANDARD_DISTRIBUTION_MONTHS = 12;

// Alphabetical, case-insensitive — gives stable rank codes (A, B, C… / 1, 2, 3…).
const byName = (a: ItemClass, b: ItemClass): number => {
	const x = a.name.toLowerCase();
	const y = b.name.toLowerCase();
	return x < y ? -1 : x > y ? 1 : 0;
};

/**
 * Build the month's draw pool from the shelves syncDisplayCase / generateLegacyPool
 * already staged — this command makes no decisions of its own, it just reads:
 *   - standard = the Available Standard shelf, each item offering
 *     max(1, round(copies / 12)) of its copies this month
 *   - legacy   = the whole current Legacy Pool shelf, at its copy counts
 *
 * Prints the pool as JSON for src/data/itemPools.ts and, with forRealsies, writes
 * it to a data file. debug forces a dry run.
 */
export const generateMonthlyPool = (baseDate = new Date(), send = false, debug = false) => {
	const { shelves, items } = fetchArrangement();

	const availableStandardShelf = findShelfNumber(shelves, AVAILABLE_STANDARD_SHELF);
	if (availableStandardShelf < 0) {
		console.log(`Could not find the "${AVAILABLE_STANDARD_SHELF}" shelf. Aborting.`);
		return;
	}
	const legacyPoolShelf = findShelfNumber(shelves, LEGACY_POOL_SHELF);
	if (legacyPoolShelf < 0) {
		console.log(`Could not find the "${LEGACY_POOL_SHELF}" shelf. Aborting.`);
		return;
	}

	const display = getDisplay();

	const standard: ItemClass[] = items
		.filter((entry) => entry.shelf === availableStandardShelf)
		.map((entry) => {
			const copies = display[entry.item.name] ?? 0;
			const quantity = Math.max(1, Math.round(copies / STANDARD_DISTRIBUTION_MONTHS));
			return { name: entry.item.name, quantity };
		})
		.sort(byName);

	const legacy: ItemClass[] = items
		.filter((entry) => entry.shelf === legacyPoolShelf)
		.map((entry) => ({ name: entry.item.name, quantity: display[entry.item.name] ?? 0 }))
		.sort(byName);

	console.log(`# Monthly pool builder\n`);
	console.log(`## Available standard (max(1, round(copies/12)) each)\n`);
	if (standard.length === 0) {
		console.log("(none)");
	}
	standard.forEach((item) => {
		const copies = display[item.name] ?? 0;
		console.log(`* ${item.name} — offering ${item.quantity} of ${copies} on shelf`);
	});

	console.log(`\n## Legacy pool (full current pool)\n`);
	if (legacy.length === 0) {
		console.log("(none)");
	}
	legacy.forEach((item) => console.log(`* ${item.name} x${item.quantity}`));

	const key = getDateKey(baseDate);
	const poolJson = JSON.stringify({ [key]: { standard, legacy } }, null, "\t");

	console.log(`\n## Pool JSON (for src/data/itemPools.ts)\n`);
	console.log(poolJson);

	if (!send || debug) {
		console.log(
			`\nDry run — no file written. Re-run with \`forRealsies\` to write ${OUTPUT_FILE}.`,
		);
		return;
	}

	const wrote = bufferToFile(poolJson, OUTPUT_FILE);
	console.log(`\n${wrote ? "Wrote" : "FAILED to write"} ${OUTPUT_FILE}.`);
};
