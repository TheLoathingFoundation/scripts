import { Kmail } from "libram";

import { participants } from "../data/participants";
import { getResultsByDate } from "../results";
import { getMonthName } from "../time";

const getMessage = (baseDate: Date) => {
	const results = getResultsByDate(baseDate);
	const month = getMonthName(baseDate);

	const winnersList = results.map(
		(result, index) => `${index + 1}. ${result.playerName} (#${result.playerId}): ${result.item}`
	);

	return `Hello from The Loathing Foundation!

The ${month} drawing has been held and the results are as follows:

${winnersList.join("\n")}

If your name is listed above, you are invited to trade 1 Mr. A + 3 Uncle Bucks for your item. Please respond to this message with an up to date "greenbox" for your account.

Once you reply we'll initiate the trade, and you'll have up to 3 months to complete it.

Remember: this is *for your use!* do *not* resell these items!

Learn more here: https://foundation.loathers.net/faq#iveBeenPicked

Thanks for participating, everybody, and see you next month.`;
};

export const announceWinners = (baseDate = new Date(), send = false, debug = false) => {
	const message = getMessage(baseDate);

	console.log(`Winners Message:\n`);
	console.log(`--------------\n`);
	message.split("\n").forEach((messageLine) => console.log(`${messageLine}\n`));
	console.log(`--------------\n`);

	if (send && !debug) {
		participants.forEach((recipient) => {
			console.log(`sending to ${recipient}`);
			Kmail.send(recipient, message);
		});
	} else {
		console.log("Kmails were not actually sent, use the command `tlf announceWinners forRealsies`");
	}
};
