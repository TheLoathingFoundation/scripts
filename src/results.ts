import { bufferToFile, fileToBuffer } from "kolmafia";

import { getDateKey } from "./time";
import type { Result } from "./types";

const getResultsFileName = (): string => "TLF-raffle-results.json";

export const loadResults = (): Record<string, Result[]> => {
	try {
		const entriesBuffer = fileToBuffer(getResultsFileName());
		return JSON.parse(entriesBuffer) as Record<string, Result[]>;
	} catch {
		return {};
	}
};

export const saveResults = (results: Record<string, Result[]>) => {
	const resultsBuffer = JSON.stringify(results);
	bufferToFile(resultsBuffer, getResultsFileName());
};

export const getResultsByDate = (date: Date): Result[] => {
	const results = loadResults();
	const dateKey = getDateKey(date);
	return results[dateKey];
};
