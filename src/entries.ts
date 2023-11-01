import { bufferToFile, fileToBuffer } from "kolmafia";
import { getDateKey, getMonthWithTrailingZero } from "./time";
import type { Entry } from "./types";

export const getEntriesFileName = (date: Date): string => {
	return `TLF-entries-${date.getFullYear()}-${getMonthWithTrailingZero(date)}.json`;
};

export const loadEntries = (date: Date): Record<string, Entry> => {
	try {
		const entriesBuffer = fileToBuffer(getEntriesFileName(date));
		return JSON.parse(entriesBuffer) as Record<string, Entry>;
	} catch {
		return {};
	}
};

export const saveEntries = (entries: Record<string, Entry>, date: Date) => {
	const entriesBuffer = JSON.stringify(entries);
	bufferToFile(entriesBuffer, getEntriesFileName(date));
};

export const loadEntriesCatalog = (
	start: Date,
	end: Date,
): Record<string, Record<string, Entry>> => {
	const monthCount =
		(end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
	const entryMonths = Array.from({ length: monthCount }, (_, index) => {
		const entryMonth = new Date(start);
		entryMonth.setDate(1);
		entryMonth.setMonth(start.getMonth() + index + 1);
		console.log(entryMonth.toDateString());
		return entryMonth;
	});

	const entries = entryMonths.reduce<Record<string, Record<string, Entry>>>(
		(entries, entryMonth) => {
			const dateKey = getDateKey(entryMonth);
			return {
				...entries,
				[dateKey]: loadEntries(entryMonth),
			};
		},
		{},
	);

	return entries;
};
