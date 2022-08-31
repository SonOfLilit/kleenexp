import { Configuration } from "webpack";
import { merge } from "webpack-merge";
import common from "./webpack.common";
import path from "path";
import WasmPackPlugin from "@wasm-tool/wasm-pack-plugin";

const config = [
  merge<Configuration>(common, {
    mode: "none",
    devtool: "nosources-source-map",
    plugins: [
      new WasmPackPlugin({
        crateDirectory: path.resolve(__dirname, "../../kleenexp-wasm"),
        forceMode: "development",
      }),
    ],
  }),
];

export default config;
