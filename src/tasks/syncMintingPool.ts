import { Item, itemAmount, putDisplay } from "kolmafia";

import { arrangeItems, fetchArrangement, findShelfNumber } from "../displayCase";

const MINTING_POOL = "Minting Pool";
const CURRENCY_NAMES = ["Mr. Accessory", "Uncle Buck"];

/**
 * Keep the Minting Pool stocked and tidy:
 *   1. deposit any Mr. Accessory / Uncle Buck sitting in inventory into the
 *      display case (a stack already in the case just grows and keeps its
 *      shelf), and
 *   2. move any currency that's in the case but on the wrong shelf onto the
 *      Minting Pool.
 *
 * Dry-run by default; pass forRealsies (send) to actually apply. debug forces
 * a dry run even when send is set.
 */
export const syncMintingPool = (send = false, debug = false) => {
	const currency = CURRENCY_NAMES.map((name) => Item.get(name));
	const currencyIds = new Set(currency.map((item) => item.id));

	const { shelves, items } = fetchArrangement();
	const mintingShelf = findShelfNumber(shelves, MINTING_POOL);
	if (mintingShelf < 0) {
		console.log(`Could not find a "${MINTING_POOL}" shelf in the display case. Aborting.`);
		return;
	}

	const toDeposit = currency
		.map((item) => ({ item, count: itemAmount(item) }))
		.filter(({ count }) => count > 0);
	const misplaced = items.filter(
		(entry) => currencyIds.has(entry.itemId) && entry.shelf !== mintingShelf,
	);

	console.log(`# Minting Pool sync\n`);
	console.log(`"${MINTING_POOL}" is shelf ${mintingShelf}.`);

	if (toDeposit.length === 0 && misplaced.length === 0) {
		console.log(
			`Inventory is clear and all currency is already in the Minting Pool. Nothing to do.`,
		);
		return;
	}

	if (toDeposit.length > 0) {
		console.log(`\nDeposit from inventory into the case:`);
		toDeposit.forEach(({ item, count }) => console.log(`* ${item.name} x${count}`));
	}
	if (misplaced.length > 0) {
		console.log(`\nMove onto the Minting Pool (in case, wrong shelf):`);
		misplaced.forEach((entry) => {
			const from = shelves[entry.shelf] ?? `shelf ${entry.shelf}`;
			console.log(`* ${entry.item.name} (id ${entry.itemId}) — currently on "${from}"`);
		});
	}

	if (!send || debug) {
		console.log(`\nDry run — nothing changed. Re-run with \`forRealsies\` to apply.`);
		return;
	}

	toDeposit.forEach(({ item, count }) => putDisplay(count, item));

	// A freshly-deposited item merges into its existing case stack (keeping that
	// stack's shelf), so re-read and arrange whatever currency still isn't on
	// the Minting Pool — this also handles a currency that wasn't in the case.
	const stillMisplaced = fetchArrangement().items.filter(
		(entry) => currencyIds.has(entry.itemId) && entry.shelf !== mintingShelf,
	);
	if (stillMisplaced.length > 0) {
		arrangeItems(stillMisplaced.map((entry) => ({ itemId: entry.itemId, shelf: mintingShelf })));
	}

	const deposited = toDeposit.reduce((sum, entry) => sum + entry.count, 0);
	console.log(
		`\nDeposited ${deposited} item(s); arranged ${stillMisplaced.length} stack(s) onto the Minting Pool.`,
	);
};
