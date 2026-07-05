export interface ItemRecord {
	name: string;
	// Release year. 0 marks a pre-Standard classic (always legacy).
	year: number;
	// Mr. Accessory price at release (most IOTMs cost 1; some IOTYs cost 2).
	originalCost: number;
	// Optional KoLmafia item id. Set this for items whose name has special
	// characters (ö, TM, curly quotes): KoLmafia mangles those when it reads the
	// bundled script, so the name won't match the game's name. Matching by id
	// sidesteps that entirely.
	id?: number;
	// Optional plain-ASCII mall-search string. KoL's mall search can't match the
	// special characters in some canonical names (searching "Möbius ring box"
	// returns nothing), so give it an ASCII approximation ("mobius ring box")
	// that the search does match. Used only as a fallback when the id search
	// comes back empty.
	search?: string;
}
