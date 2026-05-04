import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import libram from "eslint-plugin-libram";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{ ignores: ["dist/", "node_modules/"] },
	js.configs.recommended,
	tseslint.configs.recommended,
	{
		files: ["src/**/*.ts"],
		plugins: { libram },
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "module",
		},
		rules: {
			"block-scoped-var": "error",
			"eol-last": "error",
			eqeqeq: "error",
			"no-trailing-spaces": "error",
			"no-var": "error",
			"prefer-arrow-callback": "error",
			"prefer-const": "error",
			"prefer-template": "error",
			"sort-imports": [
				"error",
				{
					ignoreCase: true,
					ignoreDeclarationSort: true,
				},
			],
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "error",
			"libram/verify-constants": "error",
			"no-restricted-syntax": [
				"error",
				{
					selector: "TSEnumDeclaration:not([const=true])",
					message: "Don't declare non-const enums",
				},
			],
		},
	},
	prettier,
);
