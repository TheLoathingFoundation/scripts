/* eslint-env node */
import { build } from "esbuild";
import babel from "esbuild-plugin-babel";

build({
  entryPoints: { tlf: "src/main.ts" },
  bundle: true,
  minifySyntax: true,
  platform: "node",
	packages: "bundle",
  target: "rhino1.7.14",
  external: ["kolmafia"],
  plugins: [babel()],
  outdir: "dist/scripts/tlf",
  loader: { ".json": "text" },
  inject: ["./kolmafia-polyfill.js"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
