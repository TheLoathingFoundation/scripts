import { Item } from "kolmafia";

import { itemPools } from "./data/itemPools";
import { getDateKey } from "./time";
import type { ItemPool } from "./types";

export const getItemPool = (baseDate: Date): ItemPool => {
	const key = getDateKey(baseDate);
	return itemPools[key];
};

export const getRankCodeForLegacyItemIndex = (index: number) => `${index + 1}`;

export const getIndexForLegacyItemRankCode = (rankCode: string) => Number.parseInt(rankCode) - 1;

export const getRankCodeForStandardItemIndex = (index: number) => String.fromCharCode(65 + index);

export const getIndexForStandardItemRankCode = (rankCode: string) => rankCode.charCodeAt(0) - 65;

export const getIndexForRankCode = (rankCode: string) =>
	/[A-Z]/.test(rankCode)
		? getIndexForStandardItemRankCode(rankCode)
		: getIndexForLegacyItemRankCode(rankCode);

export const getItemByRankCode = (rankCode: string, itemPool: ItemPool): Item => {
	let itemName = "";
	if (/[A-Z]/.test(rankCode)) {
		const itemIndex = getIndexForStandardItemRankCode(rankCode);
		if (itemPool.standard.length <= itemIndex) {
			throw new Error(`${rankCode} is not a valid ranking for this item pool.`);
		}
		itemName = itemPool.standard[itemIndex].name;
	} else if (/[1-9]/.test(rankCode)) {
		const itemIndex = getIndexForLegacyItemRankCode(rankCode);
		if (itemPool.legacy.length <= itemIndex) {
			throw new Error(`${rankCode} is not a valid ranking for this item pool.`);
		}
		itemName = itemPool.legacy[itemIndex].name;
	}
	return Item.get(itemName);
};
