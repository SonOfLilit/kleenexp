import {selectNextOccurrence} from "@codemirror/search"
import {EditorState, EditorSelection, SelectionRange} from "@codemirror/state"
import ist from "ist"

function mkState(doc: string) {
  let ranges: SelectionRange[] = [], off = 0
  doc = doc.replace(/\||<([^]*?)>/g, (_m, content, index) => {
    ranges.push(EditorSelection.range(index - off, index - off + (content ? content.length : 0)))
    off += (content ? 2 : 1)
    return content || ""
  })
  return EditorState.create({
    doc,
    selection: EditorSelection.create(ranges, 0),
    extensions: EditorState.allowMultipleSelections.of(true)
  })
}

function stateStr(state: EditorState) {
  let doc = state.doc.toString()
  for (let i = state.selection.ranges.length - 1; i >= 0; i--) {
    let range = state.selection.ranges[i]
    if (range.empty)
      doc = doc.slice(0, range.from) + "|" + doc.slice(range.from)
    else
      doc = doc.slice(0, range.from) + "<" + doc.slice(range.from, range.to) + ">" + doc.slice(range.to)
  }
  return doc
}

describe("selectNextOccurrence", () => {
  function test(doc: string, expected: string) {
    let state = mkState(doc)
    selectNextOccurrence({state, dispatch: tr => { state = tr.state }})
    ist(stateStr(state), expected)
  }

  it("expands to the surrounding word", () => {
    test('one| two', '<one> two')
    test('|one two', '<one> two')
    test('o|ne two', '<one> two')
    test('one |two', 'one <two>')
  })

  it("selects the next occurrence", () => {
    test("<one> one one", "<one> <one> one")
    test("<one> <one> two one", "<one> <one> two <one>")
    test("one <one> one", "one <one> <one>")
    test("one <one> one", "one <one> <one>")
    test("one <one> <one>", "<one> <one> <one>")
    test("<one> <one> <one>", "<one> <one> <one>")
  })

  it("matches full words", () => {
    test("<one> two onetwo one", "<one> two onetwo <one>")
  })

  it("matches subwords if a subword is selected", () => {
    test("<one>two onethree", "<one>two <one>three")
    test("<one>two <one> onethree", "<one>two <one> <one>three")
  })
})
