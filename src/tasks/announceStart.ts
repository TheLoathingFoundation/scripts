import { Kmail } from 'libram';
import { participants } from '../data/participants'
import { itemPools } from '../data/itemPools'
import {
	getMonthWithTrailingZero,
	getMonthName,
	formatDate,
	getDrawDate,
	getDeadline,
} from '../time'
import type { ItemPool } from '../types'

const getItemPool = (
	pools: Record<string, ItemPool>,
	baseDate: Date,
): ItemPool => {
	const year = baseDate.getFullYear();
	const month = getMonthWithTrailingZero(baseDate);
	const key = `${year}-${month}`;
	return pools[key];
}

const getMessage = (
	itemPool: ItemPool,
	baseDate: Date,
): string => {
	const standardItemList = itemPool.standard.map(
		(itemClass, index) => `${String.fromCharCode(65 + index)}. ${itemClass.name} (${itemClass.quantity}x)`
	)
	const legacyItemList = itemPool.legacy.map(
		(itemClass, index) => `${(1 + index)}. ${itemClass.name} (${itemClass.quantity}x)`
	)

	const month = getMonthName(baseDate)
	const deadline = formatDate(getDeadline(baseDate))
	const draw = formatDate(getDrawDate(baseDate))

	return `Hello from The Loathing Foundation!
For ${month} the following IOTMs will be made available for trade:

${standardItemList.join('\n')}

The current legacy item pool contains:

${legacyItemList.join('\n')}

You may include *ONE* legacy item in your rankings; only one of them will be distributed in ${month}.

An example ranking: "C, 1, A, B"

Please respond to this message by ${deadline} if you want to participate in the drawing.
Winners will have an opportunity to trade 1 Mr. A + 3 Uncle Bucks (OR 13 Uncle Bucks) for the available item.
Selected players will be announced via k-mail and on the foundation website on ${draw}.

Remember:
* Do NOT rank any items that you do not want.
* Do NOT rank any items that you already own.
* Do NOT interact with The Loathing Foundation from a multi account.
* Only respond to this message from your main account (if you signed up with a multi account please let us know so we can fix it).

(You're receiving this because you signed up to The Loathing Foundation.  Learn more at https://foundation.loathers.net).`
}

export const announceStart = (send = false) => {
	const baseDate = new Date();
	const itemPool = getItemPool(
		itemPools,
		baseDate,
	)
	const message = getMessage(
		itemPool,
		baseDate,
	);

	console.log(`Kickoff Message:\n`)
	console.log(`--------------\n`)
	message.split('\n').forEach((messageLine) => console.log(`${messageLine}\n`));
	console.log(`--------------\n`)

	if (send) {
		participants.forEach((recipient) => {
				console.log(`sending to ${recipient}`);
				Kmail.send(recipient, message);
		})
	} else {
		console.log('Kmails were not actually sent, use the command `tlf kickoff send`');
	}
}
