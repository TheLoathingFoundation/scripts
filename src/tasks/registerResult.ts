import { getPlayerName } from "kolmafia";

import { getItemByRankCode, getItemPool } from "../itemPools";
import { loadResults, saveResults } from "../results";
import { getDateKey } from "../time";

export const registerResult = (
	playerId: string,
	rankCode: string,
	date = new Date(),
	save = false,
	debug = false,
) => {
	const results = loadResults();
	const key = getDateKey(date);
	const itemPool = getItemPool(date);

	if (!(key in results)) {
		results[key] = [];
	}
	const existingIndex = results[key].findIndex((r) => r.playerId === playerId);
	if (existingIndex >= 0) {
		console.log(`Player ${playerId} already has a result for ${key}. Skipping.`);
		return;
	}

	const item = getItemByRankCode(rankCode, itemPool);
	results[key].push({
		playerId: playerId,
		playerName: getPlayerName(Number.parseInt(playerId)),
		item: item.name,
		date: date.toISOString(),
		rankCode: rankCode,
	});
	results[key].forEach((result) => {
		console.log(`${result.playerName} (#${result.playerId}): ${result.item} (${result.rankCode})`);
	});

	if (save && !debug) {
		saveResults(results);
	}
};
