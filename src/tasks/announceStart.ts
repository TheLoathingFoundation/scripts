import { Kmail } from "libram";

import { participants } from "../data/participants";
import { getItemPool } from "../itemPools";
import { getMonthName, formatDate, getDrawDate, getDeadline } from "../time";
import type { ItemPool } from "../types";

const getMessage = (itemPool: ItemPool, baseDate: Date): string => {
	const standardItemList = itemPool.standard.map(
		(itemClass, index) =>
			`${String.fromCharCode(65 + index)}. ${itemClass.name} (${itemClass.quantity}x)`,
	);
	const legacyItemList = itemPool.legacy.map(
		(itemClass, index) => `${1 + index}. ${itemClass.name} (${itemClass.quantity}x)`,
	);

	const month = getMonthName(baseDate);
	const deadline = formatDate(getDeadline(baseDate));
	const draw = formatDate(getDrawDate(baseDate));
	let standardItemMessage = "";
	if (standardItemList.length === 0) {
		standardItemMessage = `For ${month} there are no standard IOTMs available for trade because everything in our standard vault is still relatively affordable.`;
	} else {
		standardItemMessage = `For ${month} the following standard IOTMs will be made available for trade:

${standardItemList.join("\n")}`;
	}

	return `*ACK*

Apologies everybody. The item pool had a mistake. We distributed the Crown of Thrones last month, and we still have a V for Vivala mask.

If you made a submission we still have it, but if you ranked a legacy item you may want to update with the new item codes.

Even if you don't, I'll make sure that anybody who wins a legacy item actually gets their first available choice.

So sorry for the confusion...

The 7 day timeline is being re-set due to this mistake.

${standardItemMessage}

The current legacy item pool contains:

${legacyItemList.join("\n")}

You may include *TWO* legacy items in your rankings; only two of them will be distributed in ${month}.

An example ranking: "[C, 1, A, 5, B]"

Use the [] since it will help our robots know what's going on.

Send a message to TheLoathingFoundation (#3580284) by ${deadline} if you want to participate in the drawing.

Winners will have an opportunity to trade 1 Mr. A + 3 Uncle Bucks (OR 13 Uncle Bucks) for the available item. Selected players will be announced via k-mail and on the foundation GitHub page on ${draw}.

You can follow the draw at https://github.com/orgs/TheLoathingFoundation/discussions

Remember:
* Do NOT rank any items that you do not want.
* Do NOT rank any items that you already own.
* Do NOT interact with The Loathing Foundation from a multi account.
* Only respond to this message from your main account (if you signed up with a multi account please let us know so we can fix it).

(You're receiving this because you signed up to The Loathing Foundation.  Learn more at https://foundation.loathers.net).`;
};

export const announceStart = (baseDate = new Date(), send = false, debug = false) => {
	const itemPool = getItemPool(baseDate);
	const message = getMessage(itemPool, baseDate);

	console.log(`Kickoff Message:\n`);
	console.log(`--------------\n`);
	message.split("\n").forEach((messageLine) => console.log(`${messageLine}\n`));
	console.log(`--------------\n`);

	if (send && !debug) {
		participants.forEach((recipient) => {
			console.log(`sending to ${recipient}`);
			Kmail.send(recipient, message);
		});
	} else {
		console.log("Kmails were not actually sent, use the command `tlf kickoff forRealsies`");
	}
};
