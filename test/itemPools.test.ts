import { describe, expect, it } from "vitest";

import {
	getIndexForLegacyItemRankCode,
	getIndexForRankCode,
	getIndexForStandardItemRankCode,
	getRankCodeForLegacyItemIndex,
	getRankCodeForStandardItemIndex,
	getRankCodes,
} from "../src/itemPools";

describe("getRankCodeForStandardItemIndex", () => {
	it("maps index 0 to A", () => {
		expect(getRankCodeForStandardItemIndex(0)).toBe("A");
	});

	it("maps index 1 to B", () => {
		expect(getRankCodeForStandardItemIndex(1)).toBe("B");
	});

	it("maps index 25 to Z", () => {
		expect(getRankCodeForStandardItemIndex(25)).toBe("Z");
	});
});

describe("getRankCodeForLegacyItemIndex", () => {
	it("maps index 0 to 1", () => {
		expect(getRankCodeForLegacyItemIndex(0)).toBe("1");
	});

	it("maps index 1 to 2", () => {
		expect(getRankCodeForLegacyItemIndex(1)).toBe("2");
	});

	it("maps index 9 to 10", () => {
		expect(getRankCodeForLegacyItemIndex(9)).toBe("10");
	});
});

describe("getIndexForStandardItemRankCode", () => {
	it("maps A to 0", () => {
		expect(getIndexForStandardItemRankCode("A")).toBe(0);
	});

	it("maps C to 2", () => {
		expect(getIndexForStandardItemRankCode("C")).toBe(2);
	});

	it("round-trips with getRankCodeForStandardItemIndex", () => {
		for (let i = 0; i < 26; i++) {
			const code = getRankCodeForStandardItemIndex(i);
			expect(getIndexForStandardItemRankCode(code)).toBe(i);
		}
	});
});

describe("getIndexForLegacyItemRankCode", () => {
	it("maps 1 to 0", () => {
		expect(getIndexForLegacyItemRankCode("1")).toBe(0);
	});

	it("maps 3 to 2", () => {
		expect(getIndexForLegacyItemRankCode("3")).toBe(2);
	});

	it("round-trips with getRankCodeForLegacyItemIndex", () => {
		for (let i = 0; i < 20; i++) {
			const code = getRankCodeForLegacyItemIndex(i);
			expect(getIndexForLegacyItemRankCode(code)).toBe(i);
		}
	});
});

describe("getIndexForRankCode", () => {
	it("handles standard rank codes", () => {
		expect(getIndexForRankCode("A")).toBe(0);
		expect(getIndexForRankCode("C")).toBe(2);
	});

	it("handles legacy rank codes", () => {
		expect(getIndexForRankCode("1")).toBe(0);
		expect(getIndexForRankCode("3")).toBe(2);
	});
});

describe("getRankCodes", () => {
	it("generates codes for a pool with standard and legacy items", () => {
		const pool = {
			standard: [
				{ name: "item A", quantity: 1 },
				{ name: "item B", quantity: 1 },
				{ name: "item C", quantity: 1 },
			],
			legacy: [
				{ name: "legacy 1", quantity: 1 },
				{ name: "legacy 2", quantity: 1 },
			],
		};
		expect(getRankCodes(pool)).toEqual(["A", "B", "C", "1", "2"]);
	});

	it("handles pool with no legacy items", () => {
		const pool = {
			standard: [{ name: "item A", quantity: 1 }],
			legacy: [],
		};
		expect(getRankCodes(pool)).toEqual(["A"]);
	});

	it("handles pool with no standard items", () => {
		const pool = {
			standard: [],
			legacy: [{ name: "legacy 1", quantity: 1 }],
		};
		expect(getRankCodes(pool)).toEqual(["1"]);
	});
});
