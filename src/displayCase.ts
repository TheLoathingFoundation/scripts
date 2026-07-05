import { Item, myHash, visitUrl } from "kolmafia";

// KoLmafia has no display-case *shelf* API (getDisplay() is a flat item->qty
// map), so shelf reading/arranging is done via raw requests to the same page
// the browser uses. Request format mirrors KoLmafia's own DisplayCaseRequest:
// POST managecollectionshelves.php with action=arrange and one
// whichshelf<itemId>=<shelfNumber> field per item being moved. Only the items
// included in the POST are moved; everything else stays put.
export const SHELVES_URL = "managecollectionshelves.php";

export interface DisplayCaseItem {
	item: Item;
	itemId: number;
	shelf: number;
}

export interface ShelfArrangement {
	shelves: Record<number, string>;
	items: DisplayCaseItem[];
}

const decodeEntities = (value: string): string =>
	value
		.replace(/&quot;/g, '"')
		.replace(/&trade;/g, "™")
		.replace(/&ouml;/g, "ö")
		.replace(/&amp;/g, "&");

export const parseArrangement = (html: string): ShelfArrangement => {
	const shelves: Record<number, string> = {};
	const shelvesMatch = html.match(/var shelves = (\{.*?\});/);
	if (shelvesMatch) {
		const raw = JSON.parse(shelvesMatch[1]) as Record<string, string>;
		for (const key of Object.keys(raw)) {
			shelves[Number(key)] = decodeEntities(raw[key]);
		}
	}

	// Each item row exposes both its id and current shelf via addform(id, shelf).
	const items: DisplayCaseItem[] = [];
	const rowRegex = /addform\((\d+),\s*(\d+)\)/g;
	let match: RegExpExecArray | null;
	while ((match = rowRegex.exec(html)) !== null) {
		const itemId = Number(match[1]);
		items.push({ item: Item.get(itemId), itemId, shelf: Number(match[2]) });
	}

	return { shelves, items };
};

export const fetchArrangement = (): ShelfArrangement => parseArrangement(visitUrl(SHELVES_URL));

export const findShelfNumber = (shelves: Record<number, string>, name: string): number => {
	const entry = Object.keys(shelves).find((key) => shelves[Number(key)] === name);
	return entry === undefined ? -1 : Number(entry);
};

/**
 * Move the given items onto the given shelf via a single arrange request.
 * Only the listed items are affected. Returns the raw server response.
 */
export const arrangeItems = (moves: { itemId: number; shelf: number }[]): string => {
	const params = [
		"action=arrange",
		`pwd=${myHash()}`,
		...moves.map(({ itemId, shelf }) => `whichshelf${itemId}=${shelf}`),
	].join("&");
	return visitUrl(`${SHELVES_URL}?${params}`, true);
};
