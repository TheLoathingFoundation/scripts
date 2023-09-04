import { Args } from "grimoire-kolmafia";
import { myId } from "kolmafia";

import { announceStart, announceWinners, processInbox, registerResult } from "./tasks";
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
	},
);

export default function main(command = "help"): void {
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
	let baseDate = config.date ? getDateFromKey(config.date) : new Date();

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
