import { bufferToFile, fileToBuffer } from "kolmafia";
import { Kmail } from "libram";

import { getMonthWithTrailingZero } from "../time";
import type { Entry } from "../types";

const BEST_RANKING_REGEX = /\[(([A-Z0-9](,\s*)?)+)\]/;
const RANKING_REGEX = /(([A-H0-9](,\s*)?)+)($|\s|\.)/;

const getCurrentFileName = (): string => {
  const date = new Date();
  return `TLF-entries-${date.getFullYear()}-${getMonthWithTrailingZero(date)}.json`;
};

const loadCurrentEntries = (): Record<string, Entry> => {
  try {
    const entriesBuffer = fileToBuffer(getCurrentFileName());
    return JSON.parse(entriesBuffer) as Record<string, Entry>;
  } catch {
    return {};
  }
};

const saveCurrentEntries = (entries: Record<string, Entry>) => {
  const entriesBuffer = JSON.stringify(entries);
  bufferToFile(entriesBuffer, getCurrentFileName());
};

const stripQuotedText = (text: string): string =>
  text
    .split("\n")
    .filter((line) => !line.startsWith(">"))
    .join("\n");

const tryToFindRankings = (text: string) =>
  text.match(BEST_RANKING_REGEX) || text.match(RANKING_REGEX);

const parseRankings = (text: string): string[] => {
  text = stripQuotedText(text);
  const rankings = tryToFindRankings(text);
  if (rankings === null) {
    return [];
  }
  return rankings[1]
    .split(",")
    .map((ranking) => ranking.trim())
    .filter((ranking) => ranking !== "");
};

const generateEntryMessage = (entry: Entry, playerName: string): string =>
  `Hello ${playerName},

Our robots parsed your entry as: ${entry.rankings.map((ranking) => ranking.key).join(", ")}

If that's correct, you're all set (don't reply to this message).
If that is INCORRECT, reply to this kmail to update your ranking.  Use the following format:

[A, B, 1, C]

Our robots aren't very smart, so keep in mind that...

1. capitalization matters (so write "A" instead of "a").
2. Using the "[" and "]" around your ranking is a huge help.`;

export const processEntries = (saveAndSend = false) => {
  const messages = Kmail.inbox(500);
  const entries = loadCurrentEntries();
  messages.forEach((message) => {
    const pastEntry = entries[message.senderId];

    // Don't process messages that have already been processed
    if (pastEntry) {
      const pastEntryDate = new Date(pastEntry.date);
      if (message.date <= pastEntryDate) {
        console.log(
          `Skipping obsolete entry from ${message.senderName} #${
            message.senderId
          } (${message.date.toISOString()})`
        );
        return;
      }
    }

    const rankings = parseRankings(message.message);
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
    const responseMessage = generateEntryMessage(entry, message.senderName);
    if (saveAndSend) {
      console.log(`Sending kmail to ${message.senderId}...`);
      Kmail.send(message.senderId, responseMessage);
    } else {
      console.log("The message sent would be...");
      responseMessage.split("\n").forEach((messageLine) => console.log(`${messageLine}\n`));
    }
  });

  if (saveAndSend) {
    saveCurrentEntries(entries);
  }
};
