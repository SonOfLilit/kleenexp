const production = process.argv[2] === "--production";
const watch = process.argv[2] === "--watch";
const wasmpack = require("esbuild-plugin-wasm-pack").wasmPack;

require("esbuild")
  .build({
    entryPoints: ["./src/extension.ts"],
    bundle: true,
    outdir: "./out",
    external: ["vscode"],
    format: "cjs",
    sourcemap: !production,
    minify: production,
    target: ["ES2020"],
    platform: "node",
    plugins: [
      wasmpack({
        target: "nodejs",
        path: "../../wasm",
        outDir: "../vscode/kleenexp/out",
      }),
    ],
    watch: watch && {
      onRebuild(error, result) {
        console.log("[watch] build started");
        if (error) {
          error.errors.forEach((error) =>
            console.error(
              `> ${error.location.file}:${error.location.line}:${error.location.column}: error: ${error.text}`
            )
          );
        } else {
          console.log("[watch] build finished");
        }
      },
    },
  })
  .then(() => {
    console.log("[watch] build finished");
  });
