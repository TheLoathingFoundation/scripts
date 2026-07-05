// KoLmafia's JS engine (Rhino) doesn't support Number.toLocaleString with a
// locale argument, so insert thousands separators manually.
export const formatMeat = (meat: number): string =>
	Math.round(meat)
		.toString()
		.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
