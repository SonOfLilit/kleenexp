import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { search, openSearchPanel } from "@codemirror/search";
import alice from "./alice.txt";

let startState = EditorState.create({
  doc: alice,
  extensions: [
    search({ top: true, caseSensitive: true, regexp: true, kleenexp: true }),
    EditorState.readOnly.of(true),
    EditorView.editable.of(false),
  ],
});

let view = new EditorView({
  state: startState,
  parent: document.body,
});

openSearchPanel(view);
