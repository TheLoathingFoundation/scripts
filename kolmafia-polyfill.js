const kolmafia = require("kolmafia");
export let console = { log: kolmafia.print };

// Pure-JS atob polyfill for Rhino. The `entities` package (via libram) has a
// decodeBase64 function that falls through to Node's `Buffer` when `atob` is
// missing. Rhino has neither, so we provide atob here. esbuild's `inject`
// ensures the bundled `typeof atob` references resolve to this function.
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
export let atob = function (input) {
	var str = String(input).replace(/=+$/, "");
	var output = "";
	for (var bc = 0, bs, buffer, idx = 0; (buffer = str.charAt(idx++)); ) {
		buffer = chars.indexOf(buffer);
		if (buffer === -1) continue;
		bs = bc % 4 ? bs * 64 + buffer : buffer;
		if (bc++ % 4) {
			output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
		}
	}
	return output;
};
