import { fileURLToPath } from "node:url";

import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import inject from "@rollup/plugin-inject";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";

const polyfill = fileURLToPath(new URL("./kolmafia-polyfill.mjs", import.meta.url));

export default {
  input: { tlf: "src/main.ts" },

  output: {
    dir: "dist/scripts/tlf",
    format: "cjs",
    exports: "auto",
    entryFileNames: "[name].js",
    chunkFileNames: "_[name].js",
  },

  // kolmafia is provided by the runtime, not bundled.
  external: ["kolmafia"],

  plugins: [
    replace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    }),

    resolve({
      extensions: [".js", ".ts"],
    }),

    commonjs(),

    babel({
      babelHelpers: "bundled",
      babelrc: false,
      configFile: false,
      extensions: [".js", ".ts"],
      presets: [
        "@babel/preset-typescript",
        ["@babel/preset-env", { targets: { rhino: "1.7.14" } }],
      ],
    }),

    // Replace free references to `console` / `atob` with the Rhino polyfills.
    // (esbuild's `inject` did this previously.)
    inject({
      console: [polyfill, "console"],
      atob: [polyfill, "atob"],
    }),
  ],
};
