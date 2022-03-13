import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { search, openSearchPanel } from "./search.js";
import alice from "./alice.txt";

let startState = EditorState.create({
  doc: alice,
  extensions: [
    search({ top: true, caseSensitive: true }),
    EditorState.readOnly.of(true),
    EditorView.editable.of(false),
  ],
});

let view = new EditorView({
  state: startState,
  parent: document.body,
});

openSearchPanel(view);
