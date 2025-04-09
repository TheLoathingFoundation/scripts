import { participants } from "../data/participants";
import { loadResults } from "../results";
import {
	getItemByRankCode,
	getItemPool,
	getRankCodeForStandardItemIndex,
	getRankCodeForLegacyItemIndex,
} from "../itemPools";
import { loadEntriesCatalog } from "../entries";

export const generateStatistics = () => {
	console.log(`# TLF Statistics\n`);
	// Total participants (standard vs legacy)
	// Rank count (for each item)
	// Items distributed
	// Meat saved
	// ^^ All of this for each month and in total

	const entriesCatalog = loadEntriesCatalog(new Date("2023-04-01"), new Date());
	const resultsCatalog = loadResults();
	const distributionCountMap = {} as Record<string, number>;

	for (const month in entriesCatalog) {
		const itemPool = getItemPool(new Date(`${month}-02`));
		const entries = entriesCatalog[month];
		const results = resultsCatalog[month] || [];
		const totalEntries = Object.keys(entries).length;
		let legacyEntries = 0;
		let standardEntries = 0;
		const rankCounts = {} as Record<string, number>;
		for (const playerId in entries) {
			const entry = entries[playerId];
			let isStandardEntry = false;
			let isLegacyEntry = false;
			[...new Set(entry.rankings.map(({ key }) => key))].forEach((key) => {
				rankCounts[key] = (rankCounts[key] ?? 0) + 1;
				if (/\d+/.test(key)) {
					isLegacyEntry = true;
				} else {
					isStandardEntry = true;
				}
			});
			if (isStandardEntry) {
				standardEntries++;
			}
			if (isLegacyEntry) {
				legacyEntries++;
			}
		}

		console.log(`## ${month}`);
		itemPool.standard.forEach((item, index) => {
			const itemKey = getRankCodeForStandardItemIndex(index);
			const entryCount = rankCounts[itemKey];
			console.log(`${itemKey}: ${item.name} (${entryCount} entries)`);
		});
		itemPool.legacy.forEach((item, index) => {
			const itemKey = getRankCodeForLegacyItemIndex(index);
			const entryCount = rankCounts[itemKey];
			console.log(`${itemKey}: ${item.name} (${entryCount} entries)`);
		});
		console.log(` * ${legacyEntries} legacy entries`);
		console.log(` * ${standardEntries} standard entries`);
		console.log(` * ${totalEntries} total entries`);
		console.log("");

		results.forEach((result) => {
			distributionCountMap[result.item] = (distributionCountMap[result.item] || 0) + 1;
		});
	}

	console.log(`## Items distributed`);
	const sortedItemNames = Object.keys(distributionCountMap).sort();
	sortedItemNames.forEach((item) => {
		console.log(`* ${item} (x${distributionCountMap[item]})`);
	});
};
