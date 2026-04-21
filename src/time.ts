export const getMonthWithLeadingZero = (date: Date): string => {
	const month = date.getMonth() + 1;
	const monthWithTrailingZero = month < 10 ? `0${month}` : `${month}`;
	return monthWithTrailingZero;
};

export const getMonthName = (date: Date): string => {
	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	return months[date.getMonth()];
};

export const formatDate = (date: Date): string => {
	const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	const dayOfWeek = daysOfWeek[date.getDay()];
	const month = getMonthName(date);
	const day = date.getDate();

	return `${dayOfWeek}, ${month} ${day}`;
};

export const getDrawDate = (baseDate: Date): Date => {
	const drawDate = new Date(baseDate);
	drawDate.setDate(baseDate.getDate() + 8);
	return drawDate;
};

export const getDeadline = (baseDate: Date): Date => {
	const drawDate = new Date(baseDate);
	drawDate.setDate(baseDate.getDate() + 7);
	return drawDate;
};

export const getDateKey = (date = new Date()): string => {
	const year = date.getFullYear();
	const month = getMonthWithLeadingZero(date);
	const key = `${year}-${month}`;
	return key;
};

export const getDateFromKey = (key: string): Date => {
	const [year, month] = key.split("-");
	return new Date(Number(year), Number(month) - 1, 1);
};
