import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as extension from "../../extension";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", async () => {
    let wasmPromise = require("kleenexp-wasm");
    let api = await wasmPromise();
    assert.strictEqual(api.transpile("[#token]"), "[A-Z_a-z]w*");
  });
});
