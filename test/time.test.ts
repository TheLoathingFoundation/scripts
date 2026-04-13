import { describe, expect, it } from "vitest";

import {
	formatDate,
	getDateFromKey,
	getDateKey,
	getDeadline,
	getDrawDate,
	getMonthName,
	getMonthWithTrailingZero,
} from "../src/time";

describe("getMonthWithTrailingZero", () => {
	it("pads single-digit months", () => {
		expect(getMonthWithTrailingZero(new Date("2024-01-15"))).toBe("01");
		expect(getMonthWithTrailingZero(new Date("2024-09-15"))).toBe("09");
	});

	it("does not pad double-digit months", () => {
		expect(getMonthWithTrailingZero(new Date("2024-10-15"))).toBe("10");
		expect(getMonthWithTrailingZero(new Date("2024-12-15"))).toBe("12");
	});
});

describe("getMonthName", () => {
	it("returns correct month names", () => {
		expect(getMonthName(new Date("2024-01-15"))).toBe("January");
		expect(getMonthName(new Date("2024-06-15"))).toBe("June");
		expect(getMonthName(new Date("2024-12-15"))).toBe("December");
	});
});

describe("formatDate", () => {
	it("formats a date with day of week, month, and day", () => {
		// January 15, 2024 is a Monday
		expect(formatDate(new Date("2024-01-15T12:00:00"))).toBe("Monday, January 15");
	});

	it("formats another date correctly", () => {
		// December 25, 2024 is a Wednesday
		expect(formatDate(new Date("2024-12-25T12:00:00"))).toBe("Wednesday, December 25");
	});
});

describe("getDateKey", () => {
	it("returns YYYY-MM format", () => {
		expect(getDateKey(new Date("2024-03-15"))).toBe("2024-03");
	});

	it("pads single-digit months", () => {
		expect(getDateKey(new Date("2024-01-15"))).toBe("2024-01");
	});

	it("handles December correctly", () => {
		expect(getDateKey(new Date("2024-12-15"))).toBe("2024-12");
	});
});

describe("getDateFromKey", () => {
	it("returns a Date from a YYYY-MM key", () => {
		const date = getDateFromKey("2024-03");
		expect(date.getFullYear()).toBe(2024);
		expect(date.getMonth()).toBe(2); // 0-indexed
	});

	it("round-trips with getDateKey", () => {
		const key = "2024-07";
		const date = getDateFromKey(key);
		expect(getDateKey(date)).toBe(key);
	});
});

describe("getDeadline", () => {
	it("returns a date 7 days after the base date", () => {
		const base = new Date("2024-03-01T12:00:00");
		const deadline = getDeadline(base);
		expect(deadline.getDate()).toBe(8);
	});

	it("does not mutate the base date", () => {
		const base = new Date("2024-03-01T12:00:00");
		getDeadline(base);
		expect(base.getDate()).toBe(1);
	});
});

describe("getDrawDate", () => {
	it("returns a date 8 days after the base date", () => {
		const base = new Date("2024-03-01T12:00:00");
		const draw = getDrawDate(base);
		expect(draw.getDate()).toBe(9);
	});

	it("does not mutate the base date", () => {
		const base = new Date("2024-03-01T12:00:00");
		getDrawDate(base);
		expect(base.getDate()).toBe(1);
	});
});
