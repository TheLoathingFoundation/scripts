const BEST_RANKING_REGEX = /\[\s*((?:[A-Za-z]|\d+)(?:\s*,\s*(?:[A-Za-z]|\d+))*)\s*\]/;
const BRACKET_FALLBACK_REGEX = /\[([A-Za-z\d]+)\]/;
const RANKING_REGEX = /((?:[A-Z]|\d+)(?:\s*,\s*(?:[A-Z]|\d+))+)(?:$|\s|[.!)"&])/;

export const stripQuotedText = (text: string): string =>
	text
		.split("\n")
		.filter((line) => !line.startsWith(">"))
		.filter((line) => !line.startsWith("&gt;"))
		.join("\n");

export const stripHtmlTable = (text: string): string => text.replace(/<table.*>.*<\/table>/g, "");

export const stripHtmlTags = (text: string): string => text.replace(/<[^>]*>?/gm, "");

export const tryToFindRankings = (text: string) =>
	text.match(BEST_RANKING_REGEX) || text.match(BRACKET_FALLBACK_REGEX) || text.match(RANKING_REGEX);

export const parseRankings = (text: string): string[] | undefined => {
	text = stripQuotedText(text);
	text = stripHtmlTable(text);
	const rankings = tryToFindRankings(text);
	if (rankings === null) {
		return undefined;
	}
	const content = rankings[1].trim();
	if (content.includes(",")) {
		return content
			.split(",")
			.map((r) => r.trim().toUpperCase())
			.filter((r) => r !== "");
	}
	return content.toUpperCase().match(/[A-Z]|\d+/g) || undefined;
};

export const ordinal = (n: number): string => {
	const endings = ["th", "st", "nd", "rd"];
	const base = n % 100;
	const ending = endings[(base - 20) % 10] || endings[base] || endings[0];
	return `${n}${ending}`;
};
