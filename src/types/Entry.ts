interface Ranking {
	key: string;
}
export interface Entry {
	date: string;
	message: string;
	rankings: Ranking[];
}
