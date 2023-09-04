import { bufferToFile, fileToBuffer, entityDecode } from "kolmafia";
import { Kmail } from "libram";

import { getItemByRankCode, getItemPool, getRankCodes } from "../itemPools";
import { getMonthWithTrailingZero } from "../time";
import type { Entry, ItemPool } from "../types";

const BEST_RANKING_REGEX = /\[(([A-Z0-9](,\s*)?)+)\]/;
const RANKING_REGEX = /(([A-H0-9](,\s*)?)+)($|\s|\.|\!|\)|\"|\&)/;

const getCurrentEntriesFileName = (): string => {
	const date = new Date();
	return `TLF-entries-${date.getFullYear()}-${getMonthWithTrailingZero(date)}.json`;
};

const getMessageLogFileName = (): string => "TLF-message-log.json";

const loadCurrentEntries = (): Record<string, Entry> => {
	try {
		const entriesBuffer = fileToBuffer(getCurrentEntriesFileName());
		return JSON.parse(entriesBuffer) as Record<string, Entry>;
	} catch {
		return {};
	}
};

const saveCurrentEntries = (entries: Record<string, Entry>) => {
	const entriesBuffer = JSON.stringify(entries);
	bufferToFile(entriesBuffer, getCurrentEntriesFileName());
};

const loadMessageLog = (): Record<string, Kmail> => {
	try {
		const messagesBuffer = fileToBuffer(getMessageLogFileName());
		return JSON.parse(messagesBuffer) as Record<string, Kmail>;
	} catch {
		return {};
	}
};

const saveMessageLog = (messages: Record<string, Kmail>) => {
	const messagesBuffer = JSON.stringify(messages);
	bufferToFile(messagesBuffer, getMessageLogFileName());
};

const stripQuotedText = (text: string): string =>
	text
		.split("\n")
		.filter((line) => !line.startsWith(">"))
		.filter((line) => !line.startsWith("&gt;"))
		.join("\n");

const stripHtmlTable = (text: string): string => text.replace(/<table.*>.*<\/table>/g, "");

const stripHtmlTags = (text: string): string => text.replace(/<[^>]*>?/gm, "");

const tryToFindRankings = (text: string) =>
	text.match(BEST_RANKING_REGEX) || text.match(RANKING_REGEX);

const parseRankings = (text: string): string[] | undefined => {
	text = stripQuotedText(text);
	text = stripHtmlTable(text);
	const rankings = tryToFindRankings(text);
	if (rankings === null) {
		return undefined;
	}
	return rankings[1]
		.split("")
		.map((ranking) => ranking.trim())
		.filter((ranking) => ranking !== "" && ranking !== ",");
};

const ordinal = (n: number): string => {
	const endings = ["th", "st", "nd", "rd"];
	const base = n % 100;
	const ending = endings[(base - 20) % 10] || endings[base] || endings[0];
	return `${n}${ending}`;
};

const generateQuote = (message: Kmail): string =>
	entityDecode(stripHtmlTags(message.rawMessage))
		.replace(/\&/g, "")
		.split("\n")
		.map((line) => `> ${line}`)
		.join("\n");

const generateEntryMessage = (entry: Entry, itemPool: ItemPool, message: Kmail): string => {
	const possibleRankCodes = getRankCodes(itemPool);
	const rankings = entry.rankings.filter((ranking) => possibleRankCodes.includes(ranking.key));
	const unrankedItems = possibleRankCodes.filter(
		(rankCode) => !rankings.find((ranking) => ranking.key === rankCode)
	);
	const detailedRankingBlock = rankings
		.map(
			(ranking, index) =>
				`${ordinal(index + 1)}: ${getItemByRankCode(ranking.key, itemPool).name} (${ranking.key})`
		)
		.join("\n");
	const unrankedItemsBlock = unrankedItems
		.map((rankCode) => `* ${getItemByRankCode(rankCode, itemPool).name} (${rankCode})`)
		.join("\n");
	return `${generateQuote(message)}

Hello ${message.senderName},

Our robots parsed your entry as: ${rankings.map((ranking) => ranking.key).join(", ")}

You ranked the following items:

${detailedRankingBlock === "" ? "(none)" : detailedRankingBlock}

You did NOT rank the following items:

${unrankedItemsBlock}

---

If that's correct, you're all set (don't reply to this message).
If that is INCORRECT, reply to this kmail to update your ranking.  Use the following format:

[A, B, 1, C]

Our robots aren't very smart, so keep in mind that...

1. capitalization matters (so write "A" instead of "a").
2. Using the "[" and "]" around your ranking is a huge help.`;
};
const generateThankYouMessage = (message: Kmail): string => `${generateQuote(message)}

Thank you so much for the donation!`;

const generateGenericResponseMessage = (message: Kmail): string =>
	`${generateQuote(message)}

Hello ${message.senderName},

You've reached our automated response robot.

If you were asking a question, please either head to the TLF discord channel (https://discord.gg/Jbygme67Sy) or send a kmail to slifty (#1740367)

If you were attempting to submit a ranking for the current month's draw, then please try again.  Be sure to use the right format:

[A, 1, C, D] <-- include the "[" and "]" and use capital letters.`;

const hasBeenProcessed = (message: Kmail, messageLog: Record<string, Kmail>): boolean => {
	return message.id in messageLog;
};

const isObsolete = (message: Kmail, entries: Record<string, Entry>): boolean => {
	const pastEntry = entries[message.senderId];
	if (pastEntry) {
		const pastEntryDate = new Date(pastEntry.date);
		if (message.date <= pastEntryDate) {
			return true;
		}
	}
	return false;
};

export const processInbox = (baseDate: Date, saveAndSend = false, debug = false) => {
	const inboxMessages = Kmail.inbox(9001);
	const messageLog = loadMessageLog();
	const entries = loadCurrentEntries();
	const itemPool = getItemPool(baseDate);
	inboxMessages.forEach((message) => {
		if (hasBeenProcessed(message, messageLog) && !debug) {
			console.log(
				`Skipping processed entry ${message.id} from ${message.senderName} #${
					message.senderId
				} (${message.date.toISOString()})`
			);
			return;
		}
		if (isObsolete(message, entries) && !debug) {
			console.log(
				`Skipping obsolete entry ${message.id} from ${message.senderName} #${
					message.senderId
				} (${message.date.toISOString()})`
			);
			return;
		}
		messageLog[message.id] = message;

		const rankings = parseRankings(message.rawMessage);
		let responseMessage;
		if (rankings === undefined) {
			if (message.items().size > 0) {
				console.log(
					`New donation from ${message.senderName} #${message.senderId}: [${Array.from(
						message.items().keys()
					)
						.map((item) => item.name)
						.join(", ")}]`
				);
				responseMessage = generateThankYouMessage(message);
			} else {
				console.log("====");
				console.log(`New general message from ${message.senderName} #${message.senderId}:`);
				responseMessage = generateGenericResponseMessage(message);
				console.log(message.rawMessage);
				console.log("====");
			}
		} else {
			console.log(
				`New entry from ${message.senderName} #${message.senderId}: [${rankings.join(", ")}]`
			);
			const entry = {
				date: message.date.toISOString(),
				message: message.message,
				rankings: rankings.map((ranking) => ({
					key: ranking,
					item: "",
				})),
			};
			entries[message.senderId] = entry;
			responseMessage = generateEntryMessage(entry, itemPool, message);
		}
		if (responseMessage !== undefined) {
			if (saveAndSend) {
				console.log(`Sending kmail to ${message.senderId}...`);
				Kmail.send(message.senderId, responseMessage);
			} else {
				if (debug) {
					console.log("The message sent would be...");
					responseMessage.split("\n").forEach((messageLine) => console.log(`${messageLine}\n`));
				}
			}
		}
	});

	if (saveAndSend) {
		saveCurrentEntries(entries);
		saveMessageLog(messageLog);
	}
};
