import { describe, expect, it } from "vitest";

import {
	ordinal,
	parseRankings,
	stripHtmlTable,
	stripHtmlTags,
	stripQuotedText,
} from "../src/parsing";

describe("stripQuotedText", () => {
	it("removes lines starting with >", () => {
		expect(stripQuotedText("> quoted\nnot quoted")).toBe("not quoted");
	});

	it("removes lines starting with &gt;", () => {
		expect(stripQuotedText("&gt; quoted\nnot quoted")).toBe("not quoted");
	});

	it("removes multiple quoted lines", () => {
		const input = "> line 1\n> line 2\nactual message";
		expect(stripQuotedText(input)).toBe("actual message");
	});

	it("leaves text with no quoted lines unchanged", () => {
		expect(stripQuotedText("hello\nworld")).toBe("hello\nworld");
	});
});

describe("stripHtmlTable", () => {
	it("removes an HTML table", () => {
		expect(stripHtmlTable("before<table><tr><td>data</td></tr></table>after")).toBe(
			"beforeafter",
		);
	});

	it("removes a table with attributes", () => {
		expect(stripHtmlTable('<table class="foo">content</table>rest')).toBe("rest");
	});

	it("leaves text with no tables unchanged", () => {
		expect(stripHtmlTable("no tables here")).toBe("no tables here");
	});
});

describe("stripHtmlTags", () => {
	it("removes simple tags", () => {
		expect(stripHtmlTags("<b>bold</b>")).toBe("bold");
	});

	it("removes tags with attributes", () => {
		expect(stripHtmlTags('<a href="url">link</a>')).toBe("link");
	});

	it("handles multiple tags", () => {
		expect(stripHtmlTags("<p>Hello <b>world</b></p>")).toBe("Hello world");
	});
});

describe("parseRankings", () => {
	describe("bracket notation with commas (best format)", () => {
		it("parses [A, B, C]", () => {
			expect(parseRankings("[A, B, C]")).toEqual(["A", "B", "C"]);
		});

		it("parses [A, 1, C, B]", () => {
			expect(parseRankings("[A, 1, C, B]")).toEqual(["A", "1", "C", "B"]);
		});

		it("parses with extra whitespace [A,  B , C]", () => {
			expect(parseRankings("[A,  B , C]")).toEqual(["A", "B", "C"]);
		});

		it("parses single item [A]", () => {
			expect(parseRankings("[A]")).toEqual(["A"]);
		});

		it("parses with surrounding text", () => {
			expect(parseRankings("My ranking is [A, B, C] thanks!")).toEqual(["A", "B", "C"]);
		});

		it("parses legacy-only rankings [1, 2, 3]", () => {
			expect(parseRankings("[1, 2, 3]")).toEqual(["1", "2", "3"]);
		});

		it("parses multi-digit legacy items [1, 10, 2]", () => {
			expect(parseRankings("[1, 10, 2]")).toEqual(["1", "10", "2"]);
		});
	});

	describe("bracket fallback (no commas)", () => {
		it("parses [ABC]", () => {
			expect(parseRankings("[ABC]")).toEqual(["A", "B", "C"]);
		});

		it("parses [A1B2]", () => {
			expect(parseRankings("[A1B2]")).toEqual(["A", "1", "B", "2"]);
		});

		it("parses [AB12]", () => {
			expect(parseRankings("[AB12]")).toEqual(["A", "B", "12"]);
		});
	});

	describe("no-bracket comma-separated", () => {
		it("parses A, B, C", () => {
			expect(parseRankings("A, B, C")).toEqual(["A", "B", "C"]);
		});

		it("parses A, 1, B at end of line", () => {
			expect(parseRankings("A, 1, B")).toEqual(["A", "1", "B"]);
		});

		it("parses followed by period: A, B, C.", () => {
			expect(parseRankings("A, B, C.")).toEqual(["A", "B", "C"]);
		});

		it("parses followed by exclamation: A, B, C!", () => {
			expect(parseRankings("A, B, C!")).toEqual(["A", "B", "C"]);
		});
	});

	describe("quoted text handling", () => {
		it("ignores rankings in quoted lines", () => {
			const input = "> [A, B, C]\nMy real ranking is [C, B, A]";
			expect(parseRankings(input)).toEqual(["C", "B", "A"]);
		});

		it("ignores rankings in &gt; quoted lines", () => {
			const input = "&gt; [A, B, C]\n[B, A, C]";
			expect(parseRankings(input)).toEqual(["B", "A", "C"]);
		});

		it("returns undefined when only quoted text has rankings", () => {
			expect(parseRankings("> [A, B, C]")).toBeUndefined();
		});
	});

	describe("HTML table handling", () => {
		it("ignores rankings inside HTML tables", () => {
			const input = "<table><tr><td>[A, B]</td></tr></table>[C, A, B]";
			expect(parseRankings(input)).toEqual(["C", "A", "B"]);
		});
	});

	describe("edge cases", () => {
		it("returns undefined for empty string", () => {
			expect(parseRankings("")).toBeUndefined();
		});

		it("returns undefined for text with no rankings", () => {
			expect(parseRankings("Hello, thanks for the info!")).toBeUndefined();
		});

		it("returns undefined for lowercase letters", () => {
			expect(parseRankings("[a, b, c]")).toBeUndefined();
		});

		it("prefers bracket notation over unbracketed", () => {
			const input = "A, B, C but actually [C, B, A]";
			expect(parseRankings(input)).toEqual(["C", "B", "A"]);
		});
	});
});

describe("ordinal", () => {
	it("handles 1st", () => {
		expect(ordinal(1)).toBe("1st");
	});

	it("handles 2nd", () => {
		expect(ordinal(2)).toBe("2nd");
	});

	it("handles 3rd", () => {
		expect(ordinal(3)).toBe("3rd");
	});

	it("handles 4th through 10th", () => {
		expect(ordinal(4)).toBe("4th");
		expect(ordinal(5)).toBe("5th");
		expect(ordinal(10)).toBe("10th");
	});

	it("handles teens (11th, 12th, 13th)", () => {
		expect(ordinal(11)).toBe("11th");
		expect(ordinal(12)).toBe("12th");
		expect(ordinal(13)).toBe("13th");
	});

	it("handles 21st, 22nd, 23rd", () => {
		expect(ordinal(21)).toBe("21st");
		expect(ordinal(22)).toBe("22nd");
		expect(ordinal(23)).toBe("23rd");
	});

	it("handles 100th, 101st", () => {
		expect(ordinal(100)).toBe("100th");
		expect(ordinal(101)).toBe("101st");
	});
});
