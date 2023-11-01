import { participants } from "../data/participants";
import { loadResults } from "../results";
import { loadEntriesCatalog } from "../entries";

export const generateStatistics = () => {
	console.log(`TLF Statistics\n`);
	console.log(`--------------\n`);

	// Total participants (standard vs legacy)
	// Rank count (for each item)
	// Items distributed
	// Meat saved
	// ^^ All of this for each month and in total

	const entriesCatalog = loadEntriesCatalog(new Date("2023-04-01"), new Date());

	Object.keys(entriesCatalog).forEach((month) => {
		const entries = entriesCatalog[month];
		console.log(month);
		console.log(Object.keys(entries).length);
		console.log(`--------------\n`);
	});
};
