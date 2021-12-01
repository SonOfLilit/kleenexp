import * as vscode from "vscode";
const util = require("util");
const execFile = util.promisify(require("child_process").execFile);
import * as os from "os";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "kleenexp" is now active!');

  let disposable = vscode.commands.registerCommand(
    "kleenexp.search",
    async () => {
      let activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        let value = !activeEditor.selection.isEmpty
          ? activeEditor.document.getText(activeEditor.selection)
          : "";
        let pattern = await vscode.window.showInputBox({
          value: value,
          valueSelection: [0, value.length],
          placeHolder: 'Enter a literal [ | "or a KleenExp"]',
          validateInput: (text) => {
            // TODO: compile here, cache compiled expressions
            return null;
          },
        });
        let promise = execFile(os.homedir() + "/.virtualenvs/kleenexp/bin/ke", [
          pattern,
        ]);
        let stdout, stderr;
        try {
          ({ stdout, stderr } = await promise);
        } catch (error) {
          vscode.window.showErrorMessage(`running ke failed: ${error}`);
          return;
        }
        if (promise.child.exitCode === 0) {
          console.log(JSON.stringify(stdout));
          vscode.commands.executeCommand("editor.actions.findWithArgs", {
            searchString: stdout,
          });
        } else {
          vscode.window.showErrorMessage(
            `ke returned error: ${promise.child.exitCode}`
          );
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
