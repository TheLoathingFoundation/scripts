interface Ranking {
	key: string;
	item: string;
}
export interface Entry {
	date: string;
	message: string;
	rankings: Ranking[];
}
