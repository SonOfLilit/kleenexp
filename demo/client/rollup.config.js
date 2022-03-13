import { nodeResolve } from "@rollup/plugin-node-resolve";
import { string } from "rollup-plugin-string";

export default {
  input: "./editor.ts",
  output: {
    file: "./editor.bundle.js",
    format: "iife",
  },
  plugins: [
    nodeResolve(),
    string({
      include: "**/*.txt",
    }),
  ],
};
