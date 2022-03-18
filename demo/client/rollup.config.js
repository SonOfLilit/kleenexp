import { nodeResolve } from "@rollup/plugin-node-resolve";
import async from "rollup-plugin-async";
import { string } from "rollup-plugin-string";

export default {
  input: "./editor.ts",
  output: {
    file: "./editor.bundle.js",
    format: "iife",
  },
  plugins: [
    nodeResolve(),
    async(),
    string({
      include: "**/*.txt",
    }),
  ],
};
