/* eslint-env node */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { parse } from "csv-parse/sync";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PARTICIPANTS_PATH = join(__dirname, "..", "data", "participants.ts");
const HEADER_NAME = "What is your Player Number?";

const sheetId = process.env.TLF_SHEET_ID;
if (!sheetId) {
	console.error("Error: TLF_SHEET_ID environment variable is required.");
	console.error("Usage: TLF_SHEET_ID=<google-sheet-id> yarn update-participants");
	process.exit(1);
}

const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
console.log("Fetching participant data from Google Sheets...");

const response = await fetch(url);
if (!response.ok) {
	console.error(`Error: Failed to fetch spreadsheet (HTTP ${response.status}).`);
	process.exit(1);
}

const csv = await response.text();
const records = parse(csv, { columns: true, skip_empty_lines: true });

if (records.length === 0) {
	console.error("Error: Spreadsheet CSV is empty.");
	process.exit(1);
}

// Extract and validate player IDs
const ids = [];
for (const record of records) {
	const raw = record[HEADER_NAME]?.trim();
	if (!raw) continue;
	if (!/^\d+$/.test(raw)) {
		console.warn(`Skipping invalid player number: "${raw}"`);
		continue;
	}
	const id = parseInt(raw, 10);
	if (id > 0) {
		ids.push(id);
	}
}

// Sort numerically and deduplicate
const unique = [...new Set(ids)].sort((a, b) => a - b);

// Format as TypeScript with one ID per line (prettier will reformat)
const formatParticipants = (ids) => {
	const lines = ids.map((id) => `\t${id},`);
	return `export const participants = [\n${lines.join("\n")}\n];\n`;
};

const output = formatParticipants(unique);
writeFileSync(PARTICIPANTS_PATH, output);
console.log(`Wrote ${unique.length} participants to ${PARTICIPANTS_PATH}`);
