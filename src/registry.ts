import { itemDirectory } from "./data/itemDirectory";
import type { ItemRecord } from "./types";

// KoL Standard covers the current year plus this many prior years. Everything
// older is legacy, and the window rolls forward automatically each January.
const STANDARD_WINDOW = 2;

// Directory names come from a wiki scrape and are matched against KoLmafia's
// own item names, so normalize aggressively: lowercase and collapse every run
// of non-alphanumeric characters (spaces, punctuation, TM/accents, curly
// quotes, and any encoding garbage) down to a single space. That makes matching
// immune to special-character and file-encoding differences on either side.
const normalize = (name: string): string =>
	name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();

const byName = new Map<string, ItemRecord>(
	itemDirectory.map((record) => [normalize(record.name), record]),
);

// Special-character items carry an explicit KoLmafia item id (see ItemRecord).
// Match those by id, which is immune to the name mangling that breaks byName.
const byId = new Map<number, ItemRecord>(
	itemDirectory
		.filter((record) => record.id !== undefined)
		.map((record) => [record.id as number, record]),
);

// ASCII mall-search overrides, keyed by item id (see ItemRecord.search).
const searchById = new Map<number, string>(
	itemDirectory
		.filter((record) => record.id !== undefined && record.search !== undefined)
		.map((record) => [record.id as number, record.search as string]),
);

// The plain-ASCII search string for an item, if the directory provides one.
export const getSearchOverride = (id: number): string | undefined => searchById.get(id);

export type ItemCategory = "standard" | "legacy" | "unknown";

// Look up a display-case item. Prefer the item id (reliable) and fall back to
// the normalized name for the vast majority of items that have no id override.
export const lookupItem = (name: string, id?: number): ItemRecord | undefined => {
	if (id !== undefined) {
		const byIdRecord = byId.get(id);
		if (byIdRecord !== undefined) {
			return byIdRecord;
		}
	}
	return byName.get(normalize(name));
};

export const isStandard = (record: ItemRecord, baseDate = new Date()): boolean =>
	record.year >= baseDate.getFullYear() - STANDARD_WINDOW;

export const getCategory = (name: string, baseDate = new Date(), id?: number): ItemCategory => {
	const record = lookupItem(name, id);
	if (record === undefined) {
		return "unknown";
	}
	return isStandard(record, baseDate) ? "standard" : "legacy";
};

// An item (standard or legacy) is "mature" — worth making available for trade —
// when its mall value clears twice its original Mr. Accessory cost (so a 2-A
// Item of the Year needs to be worth more than 4 Mr. A's, not 2).
export const maturityThresholdMeat = (record: ItemRecord, mrAPrice: number): number =>
	2 * record.originalCost * mrAPrice;
