import * as vscode from "vscode";
const execFile = require("child_process").execFile;

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

async function promptForKleenExp() {
  let value = chooseInitialValue();
  if (value === null) {
    return;
  }
  let regex = await kleenExpQuickPick(value);
  return regex;
}

function chooseInitialValue() {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }
  let selection = editor.selection.isEmpty
    ? editor.document.getWordRangeAtPosition(editor.selection.start)
    : editor.selection;
  let value = (selection && editor.document.getText(selection)) || "";
  if (value) {
    value = escapeKleenExpLiteral(value);
  }
  return value;
}

function escapeKleenExpLiteral(value: string) {
  return value.replace(/([\[\]]+)/g, '["$1"]');
}

function updateHistory(kleenexp: string) {
  inputHistory.unshift(kleenexp);
  for (let i = 1; i < inputHistory.length; i++) {
    if (inputHistory[i] === kleenexp) {
      inputHistory.splice(i, 1);
      break;
    }
  }
  if (inputHistory.length > MAX_HISTORY_LENGTH) {
    inputHistory.pop();
  }
}

class KleenexpItem implements vscode.QuickPickItem {
  alwaysShow = true;
  buttons = [new KleenexpItemFind(), new KleenexpItemEdit()];
  constructor(public label: string) {}
}

class KleenexpItemFind implements vscode.QuickInputButton {
  iconPath = new vscode.ThemeIcon("search");
  tooltip = "Find";
}
class KleenexpItemEdit implements vscode.QuickInputButton {
  iconPath = new vscode.ThemeIcon("edit");
  tooltip = "Edit";
}
async function kleenExpQuickPick(initial: string) {
  return await new Promise((resolve, reject) => {
    let initialItems: vscode.QuickPickItem[] = (
      inputHistory[0] === initial ? [] : [initial]
    )
      .concat(inputHistory)
      .map((k) => new KleenexpItem(k));
    let quickPick = vscode.window.createQuickPick();
    quickPick.items = initialItems;
    quickPick.value = initial;
    quickPick.title = "Enter KleenExp to find";
    quickPick.placeholder = 'Enter a literal[ | " or a KleenExp"]';
    quickPick.onDidHide(() => resolve(null));
    quickPick.onDidTriggerItemButton(async (e) => {
      if (e.button instanceof KleenexpItemEdit) {
        quickPick.value = e.item.label;
      } else {
      }
    });
    quickPick.onDidChangeSelection(async (items) => {
      let kleenexp = quickPick.title || "";
      let regex = await compileKleenExp(kleenexp);
      if (regex instanceof SyntaxError) {
        quickPick.title = regex.message;
        return;
      }
      if (regex instanceof Error) {
        vscode.window.showErrorMessage(regex.message);
        return;
      }
      updateHistory(kleenexp);
      resolve(regex);
    });
    quickPick.onDidChangeValue((value) => {
      quickPick.title = value;
    });
    quickPick.onDidChangeActive((items) => {
      quickPick.title = items[0].label;
    });

    quickPick.show();
  });
}

class SyntaxError extends Error {}

async function compileKleenExp(pattern: string): Promise<string | Error> {
  let path = vscode.workspace.getConfiguration().get<string>("kleenexp.kePath");
  if (!path) {
    return new Error("Please configure the path to the ke executable");
  }
  let promise = execFilePromise(path, ["--js", pattern]);
  let stdout, stderr;
  try {
    ({ stdout, stderr } = await promise);
  } catch (e) {
    let error = e as ExecError;
    if (error.error.code === 1) {
      return new SyntaxError(`Invalid KleenExp: ${error.out.stderr}`);
    } else {
      return new Error(
        `running ke failed with code ${error.error.code}: ${error.out.stderr}`
      );
    }
  }
  console.log(`Kleenexp successfully compiled: ${pattern} => /${stdout}/`);
  return stdout;
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "kleenexp.find",
    async () => {
      let kleenexp = await promptForKleenExp();
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
    let kleenexp = await promptForKleenExp();
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
      let kleenexp = await promptForKleenExp();
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
      let kleenexp = await promptForKleenExp();
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

  console.log('Extension "kleenexp" loaded');
}

export function deactivate() {}
