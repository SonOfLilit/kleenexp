import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { search, openSearchPanel } from "@codemirror/search";
import alice from "./alice.txt";

let path = window.location.pathname
let regexp = path.endsWith('/regex/')
let kleenexp = path.endsWith('/kleenexp/')
let lock = regexp || kleenexp

let startState = EditorState.create({
  doc: alice,
  extensions: [
    search({ top: true, caseSensitive: true, regexp, kleenexp: kleenexp || !lock, lock }),
    EditorState.readOnly.of(lock),
    EditorView.editable.of(!lock),
  ],
});

let view = new EditorView({
  state: startState,
  parent: document.body,
});

openSearchPanel(view);
