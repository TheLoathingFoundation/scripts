import { Item, mallPrice } from "kolmafia";

import {
	arrangeItems,
	type DisplayCaseItem,
	fetchArrangement,
	findShelfNumber,
} from "../displayCase";
import { formatMeat } from "../format";
import { cheapestMallPrice } from "../mall";
import { getCategory, lookupItem, maturityThresholdMeat } from "../registry";

// Shelves the sorter moves items onto (all must exist).
const SHELF = {
	availableStandard: "Available Standard Items",
	unavailableStandard: "Unavailable Standard Items",
	matureLegacy: '"Mature" Legacy Items',
	unavailableLegacy: "Unavailable Legacy Items",
	wtf: "wtf do we do with these...",
};
// Shelves the sorter never touches: the Minting Pool (currency) and the Legacy
// Pool (the quarter's RNG selection). Optional — absent ones are simply ignored.
const LEAVE_ALONE_SHELVES = ["Minting Pool", "Legacy Pool"];
const CURRENCY_NAMES = ["Mr. Accessory", "Uncle Buck"];

interface Move {
	entry: DisplayCaseItem;
	to: number;
	note: string;
}

/**
 * Sort the display case by category and value. An item is "mature" (worth making
 * available for trade) when its cheapest mall price clears twice its original
 * Mr. A cost:
 *   - standard, mature   -> Available Standard
 *   - standard, not      -> Unavailable Standard
 *   - legacy, mature     -> "Mature" Legacy
 *   - legacy, not        -> Unavailable Legacy
 *   - unknown items      -> parked on "wtf", and finalizing is refused
 *   - unpriced (no mall listing) -> left in place
 *
 * The Minting Pool, the Legacy Pool (quarterly RNG), and currency are left
 * untouched. Dry-run by default; pass forRealsies (send) to apply. debug forces
 * a dry run.
 */
export const syncDisplayCase = (
	baseDate = new Date(),
	send = false,
	debug = false,
	useCache = true,
) => {
	const { shelves, items } = fetchArrangement();

	const shelfNums = {} as Record<keyof typeof SHELF, number>;
	for (const key of Object.keys(SHELF) as (keyof typeof SHELF)[]) {
		const num = findShelfNumber(shelves, SHELF[key]);
		if (num < 0) {
			console.log(`Could not find the "${SHELF[key]}" shelf. Aborting.`);
			return;
		}
		shelfNums[key] = num;
	}

	const leaveAlone = new Set(
		LEAVE_ALONE_SHELVES.map((name) => findShelfNumber(shelves, name)).filter((num) => num >= 0),
	);

	// Mr. A is high-volume with a stable price and is the threshold basis, so use
	// mafia's built-in mallPrice (which ignores the cheapest few) rather than
	// letting a single lowball copy swing every item's cutoff.
	const mrAPrice = mallPrice(Item.get("Mr. Accessory"));
	const currencyIds = new Set(CURRENCY_NAMES.map((name) => Item.get(name).id));

	const moves: Move[] = [];
	const unknowns: DisplayCaseItem[] = [];
	const unpriced: DisplayCaseItem[] = [];
	const priced: {
		entry: DisplayCaseItem;
		category: "standard" | "legacy";
		price: number;
		threshold: number;
		mature: boolean;
		to: number;
	}[] = [];

	for (const entry of items) {
		if (leaveAlone.has(entry.shelf) || currencyIds.has(entry.itemId)) {
			continue;
		}
		const category = getCategory(entry.item.name, baseDate, entry.itemId);
		if (category === "unknown") {
			unknowns.push(entry);
			continue;
		}

		// An item is "mature" (worth offering) when its cheapest mall price clears
		// twice its original Mr. A cost. Standard and legacy use the same rule;
		// only the destination shelves differ.
		const price = cheapestMallPrice(entry.item, useCache);
		if (price === 0) {
			// No mall listing to price against — leave it where it is rather than
			// guessing at its maturity.
			unpriced.push(entry);
			continue;
		}
		const record = lookupItem(entry.item.name, entry.itemId)!;
		const threshold = maturityThresholdMeat(record, mrAPrice);
		const mature = price > threshold;
		const to =
			category === "standard"
				? mature
					? shelfNums.availableStandard
					: shelfNums.unavailableStandard
				: mature
					? shelfNums.matureLegacy
					: shelfNums.unavailableLegacy;
		const note = `${category} ${formatMeat(price)} ${mature ? ">" : "<="} ${formatMeat(threshold)}`;
		priced.push({ entry, category, price, threshold, mature, to });
		if (to !== entry.shelf) {
			moves.push({ entry, to, note });
		}
	}

	// Unknowns already sitting on "wtf" are acknowledged; only ones elsewhere
	// (freshly acquired / misfiled) block finalizing.
	const newUnknowns = unknowns.filter((entry) => entry.shelf !== shelfNums.wtf);

	console.log(`# Display case sync\n`);
	console.log(
		`Mr. A: ${formatMeat(mrAPrice)} meat | ${moves.length} move(s), ` +
			`${unknowns.length} unknown(s), ${unpriced.length} unpriced.`,
	);

	if (moves.length > 0) {
		console.log(`\nPlanned shelf moves:`);
		moves.forEach((move) => {
			console.log(
				`* ${move.entry.item.name}: "${shelves[move.entry.shelf]}" -> "${shelves[move.to]}"  [${move.note}]`,
			);
		});
	}

	const legacyPriced = priced.filter((info) => info.category === "legacy");
	if (legacyPriced.length > 0) {
		console.log(`\nLegacy mall prices (cheapest listing vs 2x-cost threshold):`);
		legacyPriced
			.slice()
			.sort((a, b) => b.price - a.price)
			.forEach((info) => {
				const target = info.mature ? "Mature" : "Unavailable";
				const moved =
					info.to === info.entry.shelf ? "" : ` [MOVE from "${shelves[info.entry.shelf]}"]`;
				console.log(
					`* ${info.entry.item.name}: ${formatMeat(info.price)} ${info.mature ? ">" : "<="} ` +
						`${formatMeat(info.threshold)} -> ${target} Legacy${moved}`,
				);
			});
	}

	const standardPriced = priced.filter((info) => info.category === "standard");
	if (standardPriced.length > 0) {
		console.log(`\nStandard mall prices (cheapest listing vs 2x-cost threshold):`);
		standardPriced
			.slice()
			.sort((a, b) => b.price - a.price)
			.forEach((info) => {
				const target = info.mature ? "Available" : "Unavailable";
				const moved =
					info.to === info.entry.shelf ? "" : ` [MOVE from "${shelves[info.entry.shelf]}"]`;
				console.log(
					`* ${info.entry.item.name}: ${formatMeat(info.price)} ${info.mature ? ">" : "<="} ` +
						`${formatMeat(info.threshold)} -> ${target} Standard${moved}`,
				);
			});
	}

	if (unknowns.length > 0) {
		console.log(`\n!! UNKNOWN items (not in itemDirectory) — add them or leave parked on "wtf":`);
		unknowns.forEach((entry) => {
			const tag = entry.shelf === shelfNums.wtf ? "already on wtf" : "NEEDS TRIAGE";
			console.log(
				`* ${entry.item.name} (id ${entry.itemId}) on "${shelves[entry.shelf]}" — ${tag}`,
			);
		});
	}

	if (unpriced.length > 0) {
		console.log(`\n?? No mall listing to price against (left in place — check manually):`);
		unpriced.forEach((entry) => {
			console.log(`* ${entry.item.name} (id ${entry.itemId}) on "${shelves[entry.shelf]}"`);
		});
	}

	if (moves.length === 0 && unknowns.length === 0 && unpriced.length === 0) {
		console.log(`\nEverything is already on the right shelf. Nothing to do.`);
		return;
	}

	// End-of-run recap so the moves aren't buried under the price listings above.
	if (moves.length > 0) {
		console.log(`\n## Move summary — ${moves.length} move(s)`);
		const byDestination: Record<string, string[]> = {};
		for (const move of moves) {
			const destination = shelves[move.to];
			if (byDestination[destination] === undefined) {
				byDestination[destination] = [];
			}
			byDestination[destination].push(move.entry.item.name);
		}
		for (const destination of Object.keys(byDestination)) {
			const names = byDestination[destination];
			console.log(`* -> "${destination}" (${names.length}): ${names.join(", ")}`);
		}
	} else {
		console.log(`\n## Move summary — no shelf moves needed.`);
	}

	if (!send || debug) {
		console.log(`\nDry run — nothing changed. Re-run with \`forRealsies\` to apply.`);
		return;
	}

	if (newUnknowns.length > 0) {
		arrangeItems(newUnknowns.map((entry) => ({ itemId: entry.itemId, shelf: shelfNums.wtf })));
		console.log(
			`\nParked ${newUnknowns.length} new unknown(s) on "wtf" and REFUSED to finalize. ` +
				`Add them to itemDirectory (or accept them on wtf), then re-run to sort the rest.`,
		);
		return;
	}

	if (moves.length > 0) {
		arrangeItems(moves.map((move) => ({ itemId: move.entry.itemId, shelf: move.to })));
	}
	console.log(`\nApplied ${moves.length} shelf move(s).`);
};
