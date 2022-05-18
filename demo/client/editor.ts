import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { search, openSearchPanel } from "@codemirror/search";
import alice from "./alice.txt";
import accesslog from "./accesslog.txt";

let path = window.location.pathname
let regexp = path.endsWith('/regex/')
let kleenexp = path.endsWith('/kleenexp/')
let lock = regexp || kleenexp

let aliceStartState = EditorState.create({
  doc: alice,
  extensions: [
    search({ top: true, caseSensitive: true, regexp, kleenexp: kleenexp || !lock, lock }),
    EditorState.readOnly.of(lock),
    EditorView.editable.of(!lock),
  ],
});

let aliceView = new EditorView({
  state: aliceStartState,
  parent: document.getElementById('alice'),
});

openSearchPanel(aliceView);


let accesslogStartState = EditorState.create({
  doc: accesslog,
  extensions: [
    search({ top: true, caseSensitive: true, regexp, kleenexp: kleenexp || !lock, lock }),
    EditorState.readOnly.of(lock),
    EditorView.editable.of(!lock),
  ],
});

let accesslogView = new EditorView({
  state: accesslogStartState,
  parent: document.getElementById('accesslog'),
});

openSearchPanel(accesslogView);
