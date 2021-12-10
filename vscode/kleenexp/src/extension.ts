import * as vscode from "vscode";
const execFile = require("child_process").execFile;
import * as os from "os";

const MAX_HISTORY_LENGTH = 20;
const inputHistory = ['My ["1st"|"2nd"|"3rd"|[1+ #d]"th"] KleenExp'];

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
    if (value) {
      value = value.replace(/([\[\]]+)/g, '["$1"]');
    }

    let pattern = await kleenExpQuickPick(value);
    if (pattern === null) {
      return;
    }

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
    console.log(`Kleenexp successfully compiled: ${pattern} => /${stdout}/`);
    return stdout;
  }
}

class KleenexpItem implements vscode.QuickPickItem {
  alwaysShow = true;
  constructor(public label: string) {}
}

async function kleenExpQuickPick(initial: string) {
  return await new Promise((resolve, reject) => {
    let initialItems = (inputHistory[0] === initial ? [] : [initial])
      .concat(inputHistory)
      .map((k) => new KleenexpItem(k));
    let quickPick = vscode.window.createQuickPick();
    quickPick.items = initialItems;
    quickPick.value = initial;
    quickPick.title = "Enter KleenExp to find";
    quickPick.placeholder = 'Enter a literal[ | " or a KleenExp"]';
    quickPick.onDidHide(() => resolve(null));
    quickPick.onDidChangeSelection((items) => {
      let value = quickPick.value;
      inputHistory.unshift(value);
      if (inputHistory.length > MAX_HISTORY_LENGTH) {
        inputHistory.pop();
      }
      resolve(value);
    });

    // OK, pay attention:
    //
    // We want to change value to item label if user used arrows to navigate the quickpick list,
    // but not if user made an edit to the value that resulted in a different quickpick item becoming active.
    // Theoretically, we could store the current `quickPick.value` in `onDidChangeValue()` and compare the
    // current value to that in `onDidChangeActive()`: if it's the same, the change in active must have happened
    // because of navigation with the arrows, but if it's different the user changing it must have triggered the
    // change in active.
    //
    // In practice this doesn't work because when user types, `onDidChangeActive()` is called _before_
    // `onDidChangeValue()` and even before the change of value is visible in `quickPick.value`!
    //
    // Our simple hack is to postpone this check a few (20) milliseconds, to give time for `quickPick.value` to
    // get its new value.
    let lastEditedValue = initial;
    quickPick.onDidChangeValue((value) => {
      lastEditedValue = value;
    });
    quickPick.onDidChangeActive((items) => {
      let currentLastEdited = lastEditedValue;
      setTimeout(() => {
        if (quickPick.value === currentLastEdited) {
          // changed because of navigation, not filter-on-type
          lastEditedValue = quickPick.value = items[0].label;
        }
      }, 20);
    });

    quickPick.show();
  });
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "kleenexp" is now active!');

  let disposable = vscode.commands.registerCommand(
    "kleenexp.find",
    async () => {
      let kleenexp = await getKleenExp();
      if (kleenexp === null) {
        return;
      }
      vscode.commands.executeCommand("editor.actions.findWithArgs", {
        searchString: kleenexp,
        isRegex: true,
      });
    }
  );
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand("kleenexp.replace", async () => {
    let kleenexp = await getKleenExp();
    if (kleenexp === null) {
      return;
    }
    vscode.commands.executeCommand("editor.actions.findWithArgs", {
      searchString: kleenexp,
      replaceString: "",
      isRegex: true,
    });
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    "kleenexp.findInFiles",
    async () => {
      let kleenexp = await getKleenExp();
      if (kleenexp === null) {
        return;
      }
      vscode.commands.executeCommand("workbench.action.findInFiles", {
        query: kleenexp,
        isRegex: true,
      });
    }
  );
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    "kleenexp.replaceInFiles",
    async () => {
      let kleenexp = await getKleenExp();
      if (kleenexp === null) {
        return;
      }
      vscode.commands.executeCommand("editor.actions.findWithArgs", {
        query: kleenexp,
        replace: "",
        isRegex: true,
      });
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
