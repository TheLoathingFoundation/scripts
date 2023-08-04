import { participants } from '../data/participants'

export const announceWinners = () => {
	const letter = `Hello from The Loathing Foundation!

The June drawing was held this afternoon (one of us had a baby on Thursday, sorry for the delay).

The results are as follows:

1. Lesbian_Syphilitic_Spanker (#2732184): Origami Pasties
2. Infopowerbroker (#2109704): Train Set
3. XWiz (#1057104): Grey Gosling
4. LucasYeo (#2072416): Autumn Bot
5. Hedgemonster (#2270868): Cook Book Bat
6: Djansou (#3143706): Autumn Bot

If your name is listed above, you are invited to trade 1 Mr. A + 3 Uncle Bucks for your item. Please respond to this message with an up to date "greenbox" for your account.

Once you reply we'll initiate the trade, and you'll have up to 3 months to complete it.

Learn more here: https://foundation.loathers.net/faq#iveBeenPicked

Thanks for participating, everybody, and see you next month.`;

	// participants.forEach((recipient) => {
	// 		console.log(`sending to ${recipient}`);
	// 		Kmail.send(recipient, letter);
	// })
}
