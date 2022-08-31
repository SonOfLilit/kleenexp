import { Configuration, ProvidePlugin } from "webpack";
import * as path from "path";
import * as wasmPlugin from "vscode-web-wasm-webpack-plugin";

const config: Configuration = {
  //mode: "none", // different in dev/prod
  target: "webworker", // extensions run in a webworker context
  experiments: { asyncWebAssembly: true },
  entry: {
    extension: "./src/web/extension.ts", // source of the web extension main file
    "test/suite/index": "./src/web/test/suite/index.ts", // source of the web extension test runner
  },
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "./dist/web"),
    libraryTarget: "commonjs",
    enabledWasmLoadingTypes: ["async-vscode"],
    wasmLoading: "async-vscode",
  },
  resolve: {
    mainFields: ["browser", "module", "main"], // look for `browser` entry point in imported node modules
    extensions: [".ts", ".js"], // support ts-files and js-files
    alias: {
      // provides alternate implementation for node module and source files
    },
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
      assert: require.resolve("assert"),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  plugins: [
    new ProvidePlugin({
      process: "process/browser", // provide a shim for the global `process` variable
    }),
    /* new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, "../../kleenexp-wasm"),
      forceMode: "development", // different between dev/prod
    }), */
    new wasmPlugin.ReadFileVsCodeWebCompileAsyncWasmPlugin(),
  ],
  externals: {
    vscode: "commonjs vscode", // ignored because it doesn't exist
  },
  performance: {
    hints: false,
  },
  // devtool: "nosources-source-map", // different between dev/prod
  watchOptions: {
    poll: 2000,
  },
};

export default config;
