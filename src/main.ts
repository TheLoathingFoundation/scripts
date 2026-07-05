import { Args } from "grimoire-kolmafia";
import { myId } from "kolmafia";

import {
	announceStart,
	announceWinners,
	dumpDisplayCase,
	generateLegacyPool,
	generateMonthlyPool,
	generateStatistics,
	processInbox,
	registerResult,
	syncDisplayCase,
	syncMintingPool,
} from "./tasks";
import { getDateFromKey } from "./time";

const config = Args.create(
	"tlf",
	"For running various administrative tasks related to The Loathing Foundation",
	{
		kickoff: Args.flag({
			help: "Invoke the kmail announcing the raffle instructions for the month.",
			setting: "",
		}),
		announceWinners: Args.flag({
			help: "Invoke the kmail announcing the raffle results for the month.",
			setting: "",
		}),
		processInbox: Args.flag({
			help: "Process kmails for the current month.",
			setting: "",
		}),
		registerResult: Args.flag({
			help: "Register a winner",
			setting: "",
		}),
		playerId: Args.string({
			help: "The ID of the player that won",
			setting: "",
		}),
		rankCode: Args.string({
			help: "The rank code (e.g. A, B, 1, 2, etc.) of the item",
			setting: "",
		}),
		date: Args.string({
			help: "The month / year in question (yyyy-mm)",
			setting: "",
		}),
		forRealsies: Args.flag({
			help: "Actually send kmails / save results.",
			setting: "",
		}),
		debug: Args.flag({
			help: "Output more (and prevent sending kmails / saving results).  This overrides the forRealsies flag.",
			setting: "",
		}),
		generateStatistics: Args.flag({
			help: "Generate some fun statistics",
			setting: "",
		}),
		generateLegacyPool: Args.flag({
			help: "Randomly draw the quarterly legacy pool from the Mature Legacy shelf, stage it on the Legacy Pool shelf, and write JSON (dry-run unless forRealsies).",
			setting: "",
		}),
		generateMonthlyPool: Args.flag({
			help: "Build the month's draw pool from the Available Standard + Legacy Pool shelves and write JSON (dry-run unless forRealsies).",
			setting: "",
		}),
		dumpDisplayCase: Args.flag({
			help: "Snapshot the display case (with live mall prices) to a JSON file for node scripts.",
			setting: "",
		}),
		syncMintingPool: Args.flag({
			help: "Move Mr. A's and Uncle Bucks onto the Minting Pool shelf (dry-run unless forRealsies).",
			setting: "",
		}),
		syncDisplayCase: Args.flag({
			help: "Sort the display case by category/price into its shelves (dry-run unless forRealsies).",
			setting: "",
		}),
		nocache: Args.flag({
			help: "Ignore the cached mall prices and re-search the mall for every item.",
			setting: "",
		}),
	},
);

export function main(command = "help"): void {
	if (myId() !== "3580284") {
		// TheLoathingFoundation (#3580284)
		console.log(
			"You tried to run this on the wrong account!  Should be TheLoathingFoundation (#3580284).",
		);
		return;
	}

	Args.fill(config, command);
	if (config.help) {
		Args.showHelp(config);
		return;
	}
	const baseDate = config.date ? getDateFromKey(config.date) : new Date();

	if (config.kickoff) {
		announceStart(baseDate, config.forRealsies, config.debug);
		return;
	}

	if (config.announceWinners) {
		announceWinners(baseDate, config.forRealsies, config.debug);
		return;
	}

	if (config.processInbox) {
		processInbox(baseDate, config.forRealsies, config.debug);
		return;
	}

	if (config.generateStatistics) {
		generateStatistics();
		return;
	}

	if (config.generateLegacyPool) {
		generateLegacyPool(baseDate, config.forRealsies, config.debug);
		return;
	}

	if (config.generateMonthlyPool) {
		generateMonthlyPool(baseDate, config.forRealsies, config.debug);
		return;
	}

	if (config.dumpDisplayCase) {
		dumpDisplayCase(config.debug, !config.nocache);
		return;
	}

	if (config.syncMintingPool) {
		syncMintingPool(config.forRealsies, config.debug);
		return;
	}

	if (config.syncDisplayCase) {
		syncDisplayCase(baseDate, config.forRealsies, config.debug, !config.nocache);
		return;
	}

	if (config.registerResult) {
		if (config.playerId === undefined) {
			throw new Error("You need to specify a playerId");
		}
		if (config.rankCode === undefined) {
			throw new Error("You need to specify a rankCode");
		}
		registerResult(config.playerId, config.rankCode, baseDate, config.forRealsies, config.debug);
	}
}
