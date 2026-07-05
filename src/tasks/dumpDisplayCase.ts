import { bufferToFile, getDisplay, Item, mallPrice } from "kolmafia";

import { formatMeat } from "../format";
import { cheapestMallPrice } from "../mall";
import { lookupItem } from "../registry";

const MR_A = "Mr. Accessory";
const OUTPUT_FILE = "TLF-displaycase.json";

interface DisplayCaseEntry {
	name: string;
	quantity: number;
	unitPrice: number;
	originalCost: number;
	threshold: number;
	qualifiesLegacy: boolean;
}

interface DisplayCaseSnapshot {
	mrAPrice: number;
	items: DisplayCaseEntry[];
}

/**
 * Non-destructive snapshot of the display case. Prices every item, flags the
 * ones worth more than their per-item legacy threshold (2x the item's original
 * Mr. A cost, so a 2-A Item of the Year needs >4x), and writes a JSON file that
 * node-side scripts can read to do RNG selection and write src/data/itemPools.ts.
 *
 * Does NOT modify the display case.
 */
export const dumpDisplayCase = (debug = false, useCache = true) => {
	// Mr. A: stable built-in price (it's the threshold basis). Case items below
	// use the cheapest listing.
	const mrAPrice = mallPrice(Item.get(MR_A));

	const display = getDisplay();
	const items: DisplayCaseEntry[] = Object.keys(display)
		.map((name) => {
			const item = Item.get(name);
			const record = lookupItem(name, item.id);
			const originalCost = record ? record.originalCost : 1;
			const threshold = 2 * originalCost * mrAPrice;
			const unitPrice = cheapestMallPrice(item, useCache);
			return {
				name,
				quantity: display[name],
				unitPrice,
				originalCost,
				threshold,
				qualifiesLegacy: unitPrice > threshold,
			};
		})
		.sort((a, b) => b.unitPrice - a.unitPrice);

	const snapshot: DisplayCaseSnapshot = { mrAPrice, items };

	console.log(`# Display Case Snapshot\n`);
	console.log(`Mr. A mall price: ${formatMeat(mrAPrice)} meat`);
	console.log(`Threshold: >2x each item's original Mr. A cost (a 2-A item needs >4x).`);
	console.log(`Items in case: ${items.length}\n`);

	if (debug) {
		items.forEach((item) => {
			const flag = item.qualifiesLegacy ? "legacy" : "-";
			console.log(
				`* ${item.name} — ${formatMeat(item.unitPrice)} meat each vs ` +
					`${formatMeat(item.threshold)} (${item.originalCost}-A) (${item.quantity} in case) [${flag}]`,
			);
		});
		console.log("");
	}

	const wrote = bufferToFile(JSON.stringify(snapshot, null, "\t"), OUTPUT_FILE);
	if (wrote) {
		console.log(`Wrote snapshot to KoLmafia data file: ${OUTPUT_FILE}`);
	} else {
		console.log(`FAILED to write ${OUTPUT_FILE}`);
	}
};
