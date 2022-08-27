// this exists to make tsc happy because vscode doesn't include it in its node.d.ts, see:
// https://github.com/Microsoft/vscode/issues/65559#issuecomment-751439479
// https://stackoverflow.com/questions/42233987/how-to-configure-custom-global-interfaces-d-ts-files-for-typescript
export {};
declare global {
  namespace WebAssembly {
    type Memory = any;
  }
}
