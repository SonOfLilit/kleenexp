import * as vscode from "vscode";
import { transpile } from "../out/kleenexp_wasm.js";

const MAX_HISTORY_LENGTH = 20;
const inputHistory = ['My ["1st"|"2nd"|"3rd"|[1+ #d]"th"] KleenExp'];

async function promptForKleenExp() {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }
  let value = chooseInitialValue(editor);
  let regex = await kleenExpQuickPick(value);
  return regex;
}

function chooseInitialValue(editor: vscode.TextEditor) {
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
      let regex;
      try {
        regex = compileKleenExp(kleenexp);
        console.log(regex);
      } catch (e) {
        quickPick.title = e as string;
        return;
      }
      updateHistory(kleenexp);
      resolve(regex);
    });
    quickPick.onDidChangeValue((value) => {
      quickPick.title = value;
    });
    quickPick.onDidChangeActive((items) => {
      if (items.length > 0) {
        quickPick.title = items[0].label;
      }
    });

    quickPick.show();
  });
}

class SyntaxError extends Error {}

function compileKleenExp(pattern: string): string {
  let re;
  re = transpile(pattern);
  console.log(`Kleenexp successfully compiled: ${pattern} => /${re}/`);
  return re;
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
      vscode.commands.executeCommand("workbench.action.findInFiles", {
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
