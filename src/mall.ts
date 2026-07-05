import { bufferToFile, cliExecuteOutput, fileToBuffer, Item, nowToInt } from "kolmafia";

import { getSearchOverride } from "./registry";

// KoLmafia's mallPrice() returns the 5th-cheapest listing (it counts up the five
// cheapest purchasable copies to dodge lowball / purchase-limited stores). For
// the foundation we specifically want the floor — the least expensive copy
// actually for sale right now — because a single cheap copy means the item is
// "available" at that price.
//
// Scripts can't read raw mall listings (there's no search_mall in the JS/ASH
// bindings, and mall.php visitUrl requests are consumed internally). But the
// gCLI `searchmall` command prints every distinct price point sorted
// cheapest-first, and cliExecuteOutput() returns that printed text. Each line
// looks like `  3 @ 1,250 meat` (total quantity available @ price). The first
// such line is the genuine cheapest listing.

const CACHE_FILE = "TLF-price-cache.json";
// Prices are cached for an hour so repeated dry runs don't re-search the mall.
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
	price: number;
	time: number;
}

// Loaded once per run from the data file, then kept in memory. Each run is a
// fresh JS context, so the file is what carries the cache between invocations.
let cache: Record<string, CacheEntry> | null = null;

const loadCache = (): Record<string, CacheEntry> => {
	if (cache === null) {
		const raw = fileToBuffer(CACHE_FILE);
		try {
			cache = raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
		} catch {
			cache = {};
		}
	}
	return cache;
};

const saveCache = (): void => {
	if (cache !== null) {
		bufferToFile(JSON.stringify(cache), CACHE_FILE);
	}
};

// Parse the cheapest "<qty> @ <price> meat" line out of a searchmall response.
const parseCheapest = (output: string): number => {
	const regex = /([\d,]+)\s*@\s*([\d,]+)\s*meat/g;
	let match: RegExpExecArray | null;
	let cheapest = 0;
	while ((match = regex.exec(output)) !== null) {
		const price = Number(match[2].replace(/,/g, ""));
		if (price > 0 && (cheapest === 0 || price < cheapest)) {
			cheapest = price;
		}
	}
	return cheapest;
};

// Ask the mall for the item's listings and parse out the cheapest price.
// Returns 0 when the item has no mall listings.
const searchCheapest = (item: Item): number => {
	// If the directory provides an ASCII search override, use it directly: it's
	// set precisely because KoL's mall search can't match the special characters
	// in this item's canonical name (a search for "Möbius ring box" returns
	// nothing), so a search by id/name would come back empty.
	const override = getSearchOverride(item.id);
	if (override !== undefined) {
		return parseCheapest(cliExecuteOutput(`searchmall "${override}"`));
	}

	// Otherwise search by bracketed item id, which resolves to the exact item (no
	// substring collisions with similarly-named items).
	return parseCheapest(cliExecuteOutput(`searchmall [${item.id}]`));
};

/**
 * The cheapest current mall listing for an item, in meat (0 if none listed).
 *
 * Results are cached to a data file for an hour, keyed by item id, so repeated
 * dry runs reuse the same prices instead of re-searching the mall every time.
 * Pass useCache = false to ignore any cached value and force a fresh search
 * (the fresh price is still written back to the cache).
 */
export const cheapestMallPrice = (item: Item, useCache = true): number => {
	const store = loadCache();
	const key = `${item.id}`;
	const now = nowToInt();

	if (useCache) {
		const hit = store[key];
		if (hit && now - hit.time < CACHE_TTL_MS) {
			return hit.price;
		}
	}

	const price = searchCheapest(item);
	// Only cache real prices. A 0 means "no listing found", which may be a
	// transient/empty search result — don't let it stick for an hour; re-search
	// next time so a genuine listing isn't masked.
	if (price > 0) {
		store[key] = { price, time: now };
		saveCache();
	}
	return price;
};
