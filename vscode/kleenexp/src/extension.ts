import * as vscode from "vscode";
const util = require("util");
const execFile = require("child_process").execFile;
import * as os from "os";

interface Output {
  stdout: string;
  stderr: string;
}
interface ExecError {
  error: {
    code: number;
  };
  out: Output;
}

let execFilePromise = function (
  command: string,
  options: Object
): Promise<Output> {
  return new Promise<Output>((resolve, reject) => {
    execFile(
      command,
      options,
      (error: Error, stdout: string, stderr: string) => {
        if (error) {
          reject({ error, out: { stdout, stderr } });
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
};

async function getKleenExp() {
  let activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    let value =
      activeEditor.document.getText(
        activeEditor.selection.isEmpty
          ? activeEditor.document.getWordRangeAtPosition(
              activeEditor.selection.start
            )
          : activeEditor.selection
      ) || "";
    let pattern = await vscode.window.showInputBox({
      value: value,
      valueSelection: [0, value.length],
      placeHolder: 'Enter a literal [ | "or a KleenExp"]',
      validateInput: (text) => {
        // TODO: compile here, cache compiled expressions
        return null;
      },
    });
    let promise = execFilePromise(
      os.homedir() + "/.virtualenvs/kleenexp/bin/ke",
      [pattern]
    );
    let stdout, stderr;
    try {
      ({ stdout, stderr } = await promise);
    } catch (e) {
      let error = e as ExecError;
      if (error.error.code === 1) {
        vscode.window.showErrorMessage(`Invalid KleenExp: ${error.out.stderr}`);
      } else {
        vscode.window.showErrorMessage(
          `running ke failed with code ${error.error.code}: ${error.out.stderr}`
        );
      }
      return;
    }
    return stdout;
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "kleenexp" is now active!');

  let disposable = vscode.commands.registerCommand(
    "kleenexp.search",
    async () => {
      let kleenexp = await getKleenExp();
      console.log(kleenexp);
      vscode.commands.executeCommand("editor.actions.findWithArgs", {
        searchString: kleenexp,
        isRegex: true,
      });
    }
  );
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand("kleenexp.replace", async () => {
    let kleenexp = await getKleenExp();
    console.log(kleenexp);
    vscode.commands.executeCommand("editor.actions.findWithArgs", {
      searchString: kleenexp,
      replaceString: "",
      isRegex: true,
    });
  });
  context.subscriptions.push(disposable);
}

export function deactivate() {}
