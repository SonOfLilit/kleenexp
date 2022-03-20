(function () {
    'use strict';

    // Compressed representation of the Grapheme_Cluster_Break=Extend
    // information from
    // http://www.unicode.org/Public/13.0.0/ucd/auxiliary/GraphemeBreakProperty.txt.
    // Each pair of elements represents a range, as an offet from the
    // previous range and a length. Numbers are in base-36, with the empty
    // string being a shorthand for 1.
    let extend = /*@__PURE__*/"lc,34,7n,7,7b,19,,,,2,,2,,,20,b,1c,l,g,,2t,7,2,6,2,2,,4,z,,u,r,2j,b,1m,9,9,,o,4,,9,,3,,5,17,3,3b,f,,w,1j,,,,4,8,4,,3,7,a,2,t,,1m,,,,2,4,8,,9,,a,2,q,,2,2,1l,,4,2,4,2,2,3,3,,u,2,3,,b,2,1l,,4,5,,2,4,,k,2,m,6,,,1m,,,2,,4,8,,7,3,a,2,u,,1n,,,,c,,9,,14,,3,,1l,3,5,3,,4,7,2,b,2,t,,1m,,2,,2,,3,,5,2,7,2,b,2,s,2,1l,2,,,2,4,8,,9,,a,2,t,,20,,4,,2,3,,,8,,29,,2,7,c,8,2q,,2,9,b,6,22,2,r,,,,,,1j,e,,5,,2,5,b,,10,9,,2u,4,,6,,2,2,2,p,2,4,3,g,4,d,,2,2,6,,f,,jj,3,qa,3,t,3,t,2,u,2,1s,2,,7,8,,2,b,9,,19,3,3b,2,y,,3a,3,4,2,9,,6,3,63,2,2,,1m,,,7,,,,,2,8,6,a,2,,1c,h,1r,4,1c,7,,,5,,14,9,c,2,w,4,2,2,,3,1k,,,2,3,,,3,1m,8,2,2,48,3,,d,,7,4,,6,,3,2,5i,1m,,5,ek,,5f,x,2da,3,3x,,2o,w,fe,6,2x,2,n9w,4,,a,w,2,28,2,7k,,3,,4,,p,2,5,,47,2,q,i,d,,12,8,p,b,1a,3,1c,,2,4,2,2,13,,1v,6,2,2,2,2,c,,8,,1b,,1f,,,3,2,2,5,2,,,16,2,8,,6m,,2,,4,,fn4,,kh,g,g,g,a6,2,gt,,6a,,45,5,1ae,3,,2,5,4,14,3,4,,4l,2,fx,4,ar,2,49,b,4w,,1i,f,1k,3,1d,4,2,2,1x,3,10,5,,8,1q,,c,2,1g,9,a,4,2,,2n,3,2,,,2,6,,4g,,3,8,l,2,1l,2,,,,,m,,e,7,3,5,5f,8,2,3,,,n,,29,,2,6,,,2,,,2,,2,6j,,2,4,6,2,,2,r,2,2d,8,2,,,2,2y,,,,2,6,,,2t,3,2,4,,5,77,9,,2,6t,,a,2,,,4,,40,4,2,2,4,,w,a,14,6,2,4,8,,9,6,2,3,1a,d,,2,ba,7,,6,,,2a,m,2,7,,2,,2,3e,6,3,,,2,,7,,,20,2,3,,,,9n,2,f0b,5,1n,7,t4,,1r,4,29,,f5k,2,43q,,,3,4,5,8,8,2,7,u,4,44,3,1iz,1j,4,1e,8,,e,,m,5,,f,11s,7,,h,2,7,,2,,5,79,7,c5,4,15s,7,31,7,240,5,gx7k,2o,3k,6o".split(",").map(s => s ? parseInt(s, 36) : 1);
    // Convert offsets into absolute values
    for (let i = 1; i < extend.length; i++)
        extend[i] += extend[i - 1];
    function isExtendingChar(code) {
        for (let i = 1; i < extend.length; i += 2)
            if (extend[i] > code)
                return extend[i - 1] <= code;
        return false;
    }
    function isRegionalIndicator(code) {
        return code >= 0x1F1E6 && code <= 0x1F1FF;
    }
    const ZWJ = 0x200d;
    /**
    Returns a next grapheme cluster break _after_ (not equal to)
    `pos`, if `forward` is true, or before otherwise. Returns `pos`
    itself if no further cluster break is available in the string.
    Moves across surrogate pairs, extending characters (when
    `includeExtending` is true), characters joined with zero-width
    joiners, and flag emoji.
    */
    function findClusterBreak(str, pos, forward = true, includeExtending = true) {
        return (forward ? nextClusterBreak : prevClusterBreak)(str, pos, includeExtending);
    }
    function nextClusterBreak(str, pos, includeExtending) {
        if (pos == str.length)
            return pos;
        // If pos is in the middle of a surrogate pair, move to its start
        if (pos && surrogateLow(str.charCodeAt(pos)) && surrogateHigh(str.charCodeAt(pos - 1)))
            pos--;
        let prev = codePointAt(str, pos);
        pos += codePointSize(prev);
        while (pos < str.length) {
            let next = codePointAt(str, pos);
            if (prev == ZWJ || next == ZWJ || includeExtending && isExtendingChar(next)) {
                pos += codePointSize(next);
                prev = next;
            }
            else if (isRegionalIndicator(next)) {
                let countBefore = 0, i = pos - 2;
                while (i >= 0 && isRegionalIndicator(codePointAt(str, i))) {
                    countBefore++;
                    i -= 2;
                }
                if (countBefore % 2 == 0)
                    break;
                else
                    pos += 2;
            }
            else {
                break;
            }
        }
        return pos;
    }
    function prevClusterBreak(str, pos, includeExtending) {
        while (pos > 0) {
            let found = nextClusterBreak(str, pos - 2, includeExtending);
            if (found < pos)
                return found;
            pos--;
        }
        return 0;
    }
    function surrogateLow(ch) { return ch >= 0xDC00 && ch < 0xE000; }
    function surrogateHigh(ch) { return ch >= 0xD800 && ch < 0xDC00; }
    /**
    Find the code point at the given position in a string (like the
    [`codePointAt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt)
    string method).
    */
    function codePointAt(str, pos) {
        let code0 = str.charCodeAt(pos);
        if (!surrogateHigh(code0) || pos + 1 == str.length)
            return code0;
        let code1 = str.charCodeAt(pos + 1);
        if (!surrogateLow(code1))
            return code0;
        return ((code0 - 0xd800) << 10) + (code1 - 0xdc00) + 0x10000;
    }
    /**
    Given a Unicode codepoint, return the JavaScript string that
    respresents it (like
    [`String.fromCodePoint`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint)).
    */
    function fromCodePoint(code) {
        if (code <= 0xffff)
            return String.fromCharCode(code);
        code -= 0x10000;
        return String.fromCharCode((code >> 10) + 0xd800, (code & 1023) + 0xdc00);
    }
    /**
    The first character that takes up two positions in a JavaScript
    string. It is often useful to compare with this after calling
    `codePointAt`, to figure out whether your character takes up 1 or
    2 index positions.
    */
    function codePointSize(code) { return code < 0x10000 ? 1 : 2; }
    /**
    Find the offset that corresponds to the given column position in a
    string, taking extending characters and tab size into account. By
    default, the string length is returned when it is too short to
    reach the column. Pass `strict` true to make it return -1 in that
    situation.
    */
    function findColumn(string, col, tabSize, strict) {
        for (let i = 0, n = 0;;) {
            if (n >= col)
                return i;
            if (i == string.length)
                break;
            n += string.charCodeAt(i) == 9 ? tabSize - (n % tabSize) : 1;
            i = findClusterBreak(string, i);
        }
        return strict === true ? -1 : string.length;
    }

    /**
    The data structure for documents.
    */
    class Text {
        /**
        @internal
        */
        constructor() { }
        /**
        Get the line description around the given position.
        */
        lineAt(pos) {
            if (pos < 0 || pos > this.length)
                throw new RangeError(`Invalid position ${pos} in document of length ${this.length}`);
            return this.lineInner(pos, false, 1, 0);
        }
        /**
        Get the description for the given (1-based) line number.
        */
        line(n) {
            if (n < 1 || n > this.lines)
                throw new RangeError(`Invalid line number ${n} in ${this.lines}-line document`);
            return this.lineInner(n, true, 1, 0);
        }
        /**
        Replace a range of the text with the given content.
        */
        replace(from, to, text) {
            let parts = [];
            this.decompose(0, from, parts, 2 /* To */);
            if (text.length)
                text.decompose(0, text.length, parts, 1 /* From */ | 2 /* To */);
            this.decompose(to, this.length, parts, 1 /* From */);
            return TextNode.from(parts, this.length - (to - from) + text.length);
        }
        /**
        Append another document to this one.
        */
        append(other) {
            return this.replace(this.length, this.length, other);
        }
        /**
        Retrieve the text between the given points.
        */
        slice(from, to = this.length) {
            let parts = [];
            this.decompose(from, to, parts, 0);
            return TextNode.from(parts, to - from);
        }
        /**
        Test whether this text is equal to another instance.
        */
        eq(other) {
            if (other == this)
                return true;
            if (other.length != this.length || other.lines != this.lines)
                return false;
            let start = this.scanIdentical(other, 1), end = this.length - this.scanIdentical(other, -1);
            let a = new RawTextCursor(this), b = new RawTextCursor(other);
            for (let skip = start, pos = start;;) {
                a.next(skip);
                b.next(skip);
                skip = 0;
                if (a.lineBreak != b.lineBreak || a.done != b.done || a.value != b.value)
                    return false;
                pos += a.value.length;
                if (a.done || pos >= end)
                    return true;
            }
        }
        /**
        Iterate over the text. When `dir` is `-1`, iteration happens
        from end to start. This will return lines and the breaks between
        them as separate strings, and for long lines, might split lines
        themselves into multiple chunks as well.
        */
        iter(dir = 1) { return new RawTextCursor(this, dir); }
        /**
        Iterate over a range of the text. When `from` > `to`, the
        iterator will run in reverse.
        */
        iterRange(from, to = this.length) { return new PartialTextCursor(this, from, to); }
        /**
        Return a cursor that iterates over the given range of lines,
        _without_ returning the line breaks between, and yielding empty
        strings for empty lines.
        
        When `from` and `to` are given, they should be 1-based line numbers.
        */
        iterLines(from, to) {
            let inner;
            if (from == null) {
                inner = this.iter();
            }
            else {
                if (to == null)
                    to = this.lines + 1;
                let start = this.line(from).from;
                inner = this.iterRange(start, Math.max(start, to == this.lines + 1 ? this.length : to <= 1 ? 0 : this.line(to - 1).to));
            }
            return new LineCursor(inner);
        }
        /**
        @internal
        */
        toString() { return this.sliceString(0); }
        /**
        Convert the document to an array of lines (which can be
        deserialized again via [`Text.of`](https://codemirror.net/6/docs/ref/#text.Text^of)).
        */
        toJSON() {
            let lines = [];
            this.flatten(lines);
            return lines;
        }
        /**
        Create a `Text` instance for the given array of lines.
        */
        static of(text) {
            if (text.length == 0)
                throw new RangeError("A document must have at least one line");
            if (text.length == 1 && !text[0])
                return Text.empty;
            return text.length <= 32 /* Branch */ ? new TextLeaf(text) : TextNode.from(TextLeaf.split(text, []));
        }
    }
    // Leaves store an array of line strings. There are always line breaks
    // between these strings. Leaves are limited in size and have to be
    // contained in TextNode instances for bigger documents.
    class TextLeaf extends Text {
        constructor(text, length = textLength(text)) {
            super();
            this.text = text;
            this.length = length;
        }
        get lines() { return this.text.length; }
        get children() { return null; }
        lineInner(target, isLine, line, offset) {
            for (let i = 0;; i++) {
                let string = this.text[i], end = offset + string.length;
                if ((isLine ? line : end) >= target)
                    return new Line(offset, end, line, string);
                offset = end + 1;
                line++;
            }
        }
        decompose(from, to, target, open) {
            let text = from <= 0 && to >= this.length ? this
                : new TextLeaf(sliceText(this.text, from, to), Math.min(to, this.length) - Math.max(0, from));
            if (open & 1 /* From */) {
                let prev = target.pop();
                let joined = appendText(text.text, prev.text.slice(), 0, text.length);
                if (joined.length <= 32 /* Branch */) {
                    target.push(new TextLeaf(joined, prev.length + text.length));
                }
                else {
                    let mid = joined.length >> 1;
                    target.push(new TextLeaf(joined.slice(0, mid)), new TextLeaf(joined.slice(mid)));
                }
            }
            else {
                target.push(text);
            }
        }
        replace(from, to, text) {
            if (!(text instanceof TextLeaf))
                return super.replace(from, to, text);
            let lines = appendText(this.text, appendText(text.text, sliceText(this.text, 0, from)), to);
            let newLen = this.length + text.length - (to - from);
            if (lines.length <= 32 /* Branch */)
                return new TextLeaf(lines, newLen);
            return TextNode.from(TextLeaf.split(lines, []), newLen);
        }
        sliceString(from, to = this.length, lineSep = "\n") {
            let result = "";
            for (let pos = 0, i = 0; pos <= to && i < this.text.length; i++) {
                let line = this.text[i], end = pos + line.length;
                if (pos > from && i)
                    result += lineSep;
                if (from < end && to > pos)
                    result += line.slice(Math.max(0, from - pos), to - pos);
                pos = end + 1;
            }
            return result;
        }
        flatten(target) {
            for (let line of this.text)
                target.push(line);
        }
        scanIdentical() { return 0; }
        static split(text, target) {
            let part = [], len = -1;
            for (let line of text) {
                part.push(line);
                len += line.length + 1;
                if (part.length == 32 /* Branch */) {
                    target.push(new TextLeaf(part, len));
                    part = [];
                    len = -1;
                }
            }
            if (len > -1)
                target.push(new TextLeaf(part, len));
            return target;
        }
    }
    // Nodes provide the tree structure of the `Text` type. They store a
    // number of other nodes or leaves, taking care to balance themselves
    // on changes. There are implied line breaks _between_ the children of
    // a node (but not before the first or after the last child).
    class TextNode extends Text {
        constructor(children, length) {
            super();
            this.children = children;
            this.length = length;
            this.lines = 0;
            for (let child of children)
                this.lines += child.lines;
        }
        lineInner(target, isLine, line, offset) {
            for (let i = 0;; i++) {
                let child = this.children[i], end = offset + child.length, endLine = line + child.lines - 1;
                if ((isLine ? endLine : end) >= target)
                    return child.lineInner(target, isLine, line, offset);
                offset = end + 1;
                line = endLine + 1;
            }
        }
        decompose(from, to, target, open) {
            for (let i = 0, pos = 0; pos <= to && i < this.children.length; i++) {
                let child = this.children[i], end = pos + child.length;
                if (from <= end && to >= pos) {
                    let childOpen = open & ((pos <= from ? 1 /* From */ : 0) | (end >= to ? 2 /* To */ : 0));
                    if (pos >= from && end <= to && !childOpen)
                        target.push(child);
                    else
                        child.decompose(from - pos, to - pos, target, childOpen);
                }
                pos = end + 1;
            }
        }
        replace(from, to, text) {
            if (text.lines < this.lines)
                for (let i = 0, pos = 0; i < this.children.length; i++) {
                    let child = this.children[i], end = pos + child.length;
                    // Fast path: if the change only affects one child and the
                    // child's size remains in the acceptable range, only update
                    // that child
                    if (from >= pos && to <= end) {
                        let updated = child.replace(from - pos, to - pos, text);
                        let totalLines = this.lines - child.lines + updated.lines;
                        if (updated.lines < (totalLines >> (5 /* BranchShift */ - 1)) &&
                            updated.lines > (totalLines >> (5 /* BranchShift */ + 1))) {
                            let copy = this.children.slice();
                            copy[i] = updated;
                            return new TextNode(copy, this.length - (to - from) + text.length);
                        }
                        return super.replace(pos, end, updated);
                    }
                    pos = end + 1;
                }
            return super.replace(from, to, text);
        }
        sliceString(from, to = this.length, lineSep = "\n") {
            let result = "";
            for (let i = 0, pos = 0; i < this.children.length && pos <= to; i++) {
                let child = this.children[i], end = pos + child.length;
                if (pos > from && i)
                    result += lineSep;
                if (from < end && to > pos)
                    result += child.sliceString(from - pos, to - pos, lineSep);
                pos = end + 1;
            }
            return result;
        }
        flatten(target) {
            for (let child of this.children)
                child.flatten(target);
        }
        scanIdentical(other, dir) {
            if (!(other instanceof TextNode))
                return 0;
            let length = 0;
            let [iA, iB, eA, eB] = dir > 0 ? [0, 0, this.children.length, other.children.length]
                : [this.children.length - 1, other.children.length - 1, -1, -1];
            for (;; iA += dir, iB += dir) {
                if (iA == eA || iB == eB)
                    return length;
                let chA = this.children[iA], chB = other.children[iB];
                if (chA != chB)
                    return length + chA.scanIdentical(chB, dir);
                length += chA.length + 1;
            }
        }
        static from(children, length = children.reduce((l, ch) => l + ch.length + 1, -1)) {
            let lines = 0;
            for (let ch of children)
                lines += ch.lines;
            if (lines < 32 /* Branch */) {
                let flat = [];
                for (let ch of children)
                    ch.flatten(flat);
                return new TextLeaf(flat, length);
            }
            let chunk = Math.max(32 /* Branch */, lines >> 5 /* BranchShift */), maxChunk = chunk << 1, minChunk = chunk >> 1;
            let chunked = [], currentLines = 0, currentLen = -1, currentChunk = [];
            function add(child) {
                let last;
                if (child.lines > maxChunk && child instanceof TextNode) {
                    for (let node of child.children)
                        add(node);
                }
                else if (child.lines > minChunk && (currentLines > minChunk || !currentLines)) {
                    flush();
                    chunked.push(child);
                }
                else if (child instanceof TextLeaf && currentLines &&
                    (last = currentChunk[currentChunk.length - 1]) instanceof TextLeaf &&
                    child.lines + last.lines <= 32 /* Branch */) {
                    currentLines += child.lines;
                    currentLen += child.length + 1;
                    currentChunk[currentChunk.length - 1] = new TextLeaf(last.text.concat(child.text), last.length + 1 + child.length);
                }
                else {
                    if (currentLines + child.lines > chunk)
                        flush();
                    currentLines += child.lines;
                    currentLen += child.length + 1;
                    currentChunk.push(child);
                }
            }
            function flush() {
                if (currentLines == 0)
                    return;
                chunked.push(currentChunk.length == 1 ? currentChunk[0] : TextNode.from(currentChunk, currentLen));
                currentLen = -1;
                currentLines = currentChunk.length = 0;
            }
            for (let child of children)
                add(child);
            flush();
            return chunked.length == 1 ? chunked[0] : new TextNode(chunked, length);
        }
    }
    Text.empty = /*@__PURE__*/new TextLeaf([""], 0);
    function textLength(text) {
        let length = -1;
        for (let line of text)
            length += line.length + 1;
        return length;
    }
    function appendText(text, target, from = 0, to = 1e9) {
        for (let pos = 0, i = 0, first = true; i < text.length && pos <= to; i++) {
            let line = text[i], end = pos + line.length;
            if (end >= from) {
                if (end > to)
                    line = line.slice(0, to - pos);
                if (pos < from)
                    line = line.slice(from - pos);
                if (first) {
                    target[target.length - 1] += line;
                    first = false;
                }
                else
                    target.push(line);
            }
            pos = end + 1;
        }
        return target;
    }
    function sliceText(text, from, to) {
        return appendText(text, [""], from, to);
    }
    class RawTextCursor {
        constructor(text, dir = 1) {
            this.dir = dir;
            this.done = false;
            this.lineBreak = false;
            this.value = "";
            this.nodes = [text];
            this.offsets = [dir > 0 ? 1 : (text instanceof TextLeaf ? text.text.length : text.children.length) << 1];
        }
        nextInner(skip, dir) {
            this.done = this.lineBreak = false;
            for (;;) {
                let last = this.nodes.length - 1;
                let top = this.nodes[last], offsetValue = this.offsets[last], offset = offsetValue >> 1;
                let size = top instanceof TextLeaf ? top.text.length : top.children.length;
                if (offset == (dir > 0 ? size : 0)) {
                    if (last == 0) {
                        this.done = true;
                        this.value = "";
                        return this;
                    }
                    if (dir > 0)
                        this.offsets[last - 1]++;
                    this.nodes.pop();
                    this.offsets.pop();
                }
                else if ((offsetValue & 1) == (dir > 0 ? 0 : 1)) {
                    this.offsets[last] += dir;
                    if (skip == 0) {
                        this.lineBreak = true;
                        this.value = "\n";
                        return this;
                    }
                    skip--;
                }
                else if (top instanceof TextLeaf) {
                    // Move to the next string
                    let next = top.text[offset + (dir < 0 ? -1 : 0)];
                    this.offsets[last] += dir;
                    if (next.length > Math.max(0, skip)) {
                        this.value = skip == 0 ? next : dir > 0 ? next.slice(skip) : next.slice(0, next.length - skip);
                        return this;
                    }
                    skip -= next.length;
                }
                else {
                    let next = top.children[offset + (dir < 0 ? -1 : 0)];
                    if (skip > next.length) {
                        skip -= next.length;
                        this.offsets[last] += dir;
                    }
                    else {
                        if (dir < 0)
                            this.offsets[last]--;
                        this.nodes.push(next);
                        this.offsets.push(dir > 0 ? 1 : (next instanceof TextLeaf ? next.text.length : next.children.length) << 1);
                    }
                }
            }
        }
        next(skip = 0) {
            if (skip < 0) {
                this.nextInner(-skip, (-this.dir));
                skip = this.value.length;
            }
            return this.nextInner(skip, this.dir);
        }
    }
    class PartialTextCursor {
        constructor(text, start, end) {
            this.value = "";
            this.done = false;
            this.cursor = new RawTextCursor(text, start > end ? -1 : 1);
            this.pos = start > end ? text.length : 0;
            this.from = Math.min(start, end);
            this.to = Math.max(start, end);
        }
        nextInner(skip, dir) {
            if (dir < 0 ? this.pos <= this.from : this.pos >= this.to) {
                this.value = "";
                this.done = true;
                return this;
            }
            skip += Math.max(0, dir < 0 ? this.pos - this.to : this.from - this.pos);
            let limit = dir < 0 ? this.pos - this.from : this.to - this.pos;
            if (skip > limit)
                skip = limit;
            limit -= skip;
            let { value } = this.cursor.next(skip);
            this.pos += (value.length + skip) * dir;
            this.value = value.length <= limit ? value : dir < 0 ? value.slice(value.length - limit) : value.slice(0, limit);
            this.done = !this.value;
            return this;
        }
        next(skip = 0) {
            if (skip < 0)
                skip = Math.max(skip, this.from - this.pos);
            else if (skip > 0)
                skip = Math.min(skip, this.to - this.pos);
            return this.nextInner(skip, this.cursor.dir);
        }
        get lineBreak() { return this.cursor.lineBreak && this.value != ""; }
    }
    class LineCursor {
        constructor(inner) {
            this.inner = inner;
            this.afterBreak = true;
            this.value = "";
            this.done = false;
        }
        next(skip = 0) {
            let { done, lineBreak, value } = this.inner.next(skip);
            if (done) {
                this.done = true;
                this.value = "";
            }
            else if (lineBreak) {
                if (this.afterBreak) {
                    this.value = "";
                }
                else {
                    this.afterBreak = true;
                    this.next();
                }
            }
            else {
                this.value = value;
                this.afterBreak = false;
            }
            return this;
        }
        get lineBreak() { return false; }
    }
    if (typeof Symbol != "undefined") {
        Text.prototype[Symbol.iterator] = function () { return this.iter(); };
        RawTextCursor.prototype[Symbol.iterator] = PartialTextCursor.prototype[Symbol.iterator] =
            LineCursor.prototype[Symbol.iterator] = function () { return this; };
    }
    /**
    This type describes a line in the document. It is created
    on-demand when lines are [queried](https://codemirror.net/6/docs/ref/#text.Text.lineAt).
    */
    class Line {
        /**
        @internal
        */
        constructor(
        /**
        The position of the start of the line.
        */
        from, 
        /**
        The position at the end of the line (_before_ the line break,
        or at the end of document for the last line).
        */
        to, 
        /**
        This line's line number (1-based).
        */
        number, 
        /**
        The line's content.
        */
        text) {
            this.from = from;
            this.to = to;
            this.number = number;
            this.text = text;
        }
        /**
        The length of the line (not including any line break after it).
        */
        get length() { return this.to - this.from; }
    }

    const DefaultSplit = /\r\n?|\n/;
    /**
    Distinguishes different ways in which positions can be mapped.
    */
    var MapMode = /*@__PURE__*/(function (MapMode) {
        /**
        Map a position to a valid new position, even when its context
        was deleted.
        */
        MapMode[MapMode["Simple"] = 0] = "Simple";
        /**
        Return null if deletion happens across the position.
        */
        MapMode[MapMode["TrackDel"] = 1] = "TrackDel";
        /**
        Return null if the character _before_ the position is deleted.
        */
        MapMode[MapMode["TrackBefore"] = 2] = "TrackBefore";
        /**
        Return null if the character _after_ the position is deleted.
        */
        MapMode[MapMode["TrackAfter"] = 3] = "TrackAfter";
    return MapMode})(MapMode || (MapMode = {}));
    /**
    A change description is a variant of [change set](https://codemirror.net/6/docs/ref/#state.ChangeSet)
    that doesn't store the inserted text. As such, it can't be
    applied, but is cheaper to store and manipulate.
    */
    class ChangeDesc {
        // Sections are encoded as pairs of integers. The first is the
        // length in the current document, and the second is -1 for
        // unaffected sections, and the length of the replacement content
        // otherwise. So an insertion would be (0, n>0), a deletion (n>0,
        // 0), and a replacement two positive numbers.
        /**
        @internal
        */
        constructor(
        /**
        @internal
        */
        sections) {
            this.sections = sections;
        }
        /**
        The length of the document before the change.
        */
        get length() {
            let result = 0;
            for (let i = 0; i < this.sections.length; i += 2)
                result += this.sections[i];
            return result;
        }
        /**
        The length of the document after the change.
        */
        get newLength() {
            let result = 0;
            for (let i = 0; i < this.sections.length; i += 2) {
                let ins = this.sections[i + 1];
                result += ins < 0 ? this.sections[i] : ins;
            }
            return result;
        }
        /**
        False when there are actual changes in this set.
        */
        get empty() { return this.sections.length == 0 || this.sections.length == 2 && this.sections[1] < 0; }
        /**
        Iterate over the unchanged parts left by these changes.
        */
        iterGaps(f) {
            for (let i = 0, posA = 0, posB = 0; i < this.sections.length;) {
                let len = this.sections[i++], ins = this.sections[i++];
                if (ins < 0) {
                    f(posA, posB, len);
                    posB += len;
                }
                else {
                    posB += ins;
                }
                posA += len;
            }
        }
        /**
        Iterate over the ranges changed by these changes. (See
        [`ChangeSet.iterChanges`](https://codemirror.net/6/docs/ref/#state.ChangeSet.iterChanges) for a
        variant that also provides you with the inserted text.)
        
        When `individual` is true, adjacent changes (which are kept
        separate for [position mapping](https://codemirror.net/6/docs/ref/#state.ChangeDesc.mapPos)) are
        reported separately.
        */
        iterChangedRanges(f, individual = false) {
            iterChanges(this, f, individual);
        }
        /**
        Get a description of the inverted form of these changes.
        */
        get invertedDesc() {
            let sections = [];
            for (let i = 0; i < this.sections.length;) {
                let len = this.sections[i++], ins = this.sections[i++];
                if (ins < 0)
                    sections.push(len, ins);
                else
                    sections.push(ins, len);
            }
            return new ChangeDesc(sections);
        }
        /**
        Compute the combined effect of applying another set of changes
        after this one. The length of the document after this set should
        match the length before `other`.
        */
        composeDesc(other) { return this.empty ? other : other.empty ? this : composeSets(this, other); }
        /**
        Map this description, which should start with the same document
        as `other`, over another set of changes, so that it can be
        applied after it. When `before` is true, map as if the changes
        in `other` happened before the ones in `this`.
        */
        mapDesc(other, before = false) { return other.empty ? this : mapSet(this, other, before); }
        mapPos(pos, assoc = -1, mode = MapMode.Simple) {
            let posA = 0, posB = 0;
            for (let i = 0; i < this.sections.length;) {
                let len = this.sections[i++], ins = this.sections[i++], endA = posA + len;
                if (ins < 0) {
                    if (endA > pos)
                        return posB + (pos - posA);
                    posB += len;
                }
                else {
                    if (mode != MapMode.Simple && endA >= pos &&
                        (mode == MapMode.TrackDel && posA < pos && endA > pos ||
                            mode == MapMode.TrackBefore && posA < pos ||
                            mode == MapMode.TrackAfter && endA > pos))
                        return null;
                    if (endA > pos || endA == pos && assoc < 0 && !len)
                        return pos == posA || assoc < 0 ? posB : posB + ins;
                    posB += ins;
                }
                posA = endA;
            }
            if (pos > posA)
                throw new RangeError(`Position ${pos} is out of range for changeset of length ${posA}`);
            return posB;
        }
        /**
        Check whether these changes touch a given range. When one of the
        changes entirely covers the range, the string `"cover"` is
        returned.
        */
        touchesRange(from, to = from) {
            for (let i = 0, pos = 0; i < this.sections.length && pos <= to;) {
                let len = this.sections[i++], ins = this.sections[i++], end = pos + len;
                if (ins >= 0 && pos <= to && end >= from)
                    return pos < from && end > to ? "cover" : true;
                pos = end;
            }
            return false;
        }
        /**
        @internal
        */
        toString() {
            let result = "";
            for (let i = 0; i < this.sections.length;) {
                let len = this.sections[i++], ins = this.sections[i++];
                result += (result ? " " : "") + len + (ins >= 0 ? ":" + ins : "");
            }
            return result;
        }
        /**
        Serialize this change desc to a JSON-representable value.
        */
        toJSON() { return this.sections; }
        /**
        Create a change desc from its JSON representation (as produced
        by [`toJSON`](https://codemirror.net/6/docs/ref/#state.ChangeDesc.toJSON).
        */
        static fromJSON(json) {
            if (!Array.isArray(json) || json.length % 2 || json.some(a => typeof a != "number"))
                throw new RangeError("Invalid JSON representation of ChangeDesc");
            return new ChangeDesc(json);
        }
    }
    /**
    A change set represents a group of modifications to a document. It
    stores the document length, and can only be applied to documents
    with exactly that length.
    */
    class ChangeSet extends ChangeDesc {
        /**
        @internal
        */
        constructor(sections, 
        /**
        @internal
        */
        inserted) {
            super(sections);
            this.inserted = inserted;
        }
        /**
        Apply the changes to a document, returning the modified
        document.
        */
        apply(doc) {
            if (this.length != doc.length)
                throw new RangeError("Applying change set to a document with the wrong length");
            iterChanges(this, (fromA, toA, fromB, _toB, text) => doc = doc.replace(fromB, fromB + (toA - fromA), text), false);
            return doc;
        }
        mapDesc(other, before = false) { return mapSet(this, other, before, true); }
        /**
        Given the document as it existed _before_ the changes, return a
        change set that represents the inverse of this set, which could
        be used to go from the document created by the changes back to
        the document as it existed before the changes.
        */
        invert(doc) {
            let sections = this.sections.slice(), inserted = [];
            for (let i = 0, pos = 0; i < sections.length; i += 2) {
                let len = sections[i], ins = sections[i + 1];
                if (ins >= 0) {
                    sections[i] = ins;
                    sections[i + 1] = len;
                    let index = i >> 1;
                    while (inserted.length < index)
                        inserted.push(Text.empty);
                    inserted.push(len ? doc.slice(pos, pos + len) : Text.empty);
                }
                pos += len;
            }
            return new ChangeSet(sections, inserted);
        }
        /**
        Combine two subsequent change sets into a single set. `other`
        must start in the document produced by `this`. If `this` goes
        `docA` → `docB` and `other` represents `docB` → `docC`, the
        returned value will represent the change `docA` → `docC`.
        */
        compose(other) { return this.empty ? other : other.empty ? this : composeSets(this, other, true); }
        /**
        Given another change set starting in the same document, maps this
        change set over the other, producing a new change set that can be
        applied to the document produced by applying `other`. When
        `before` is `true`, order changes as if `this` comes before
        `other`, otherwise (the default) treat `other` as coming first.
        
        Given two changes `A` and `B`, `A.compose(B.map(A))` and
        `B.compose(A.map(B, true))` will produce the same document. This
        provides a basic form of [operational
        transformation](https://en.wikipedia.org/wiki/Operational_transformation),
        and can be used for collaborative editing.
        */
        map(other, before = false) { return other.empty ? this : mapSet(this, other, before, true); }
        /**
        Iterate over the changed ranges in the document, calling `f` for
        each, with the range in the original document (`fromA`-`toA`)
        and the range that replaces it in the new document
        (`fromB`-`toB`).
        
        When `individual` is true, adjacent changes are reported
        separately.
        */
        iterChanges(f, individual = false) {
            iterChanges(this, f, individual);
        }
        /**
        Get a [change description](https://codemirror.net/6/docs/ref/#state.ChangeDesc) for this change
        set.
        */
        get desc() { return new ChangeDesc(this.sections); }
        /**
        @internal
        */
        filter(ranges) {
            let resultSections = [], resultInserted = [], filteredSections = [];
            let iter = new SectionIter(this);
            done: for (let i = 0, pos = 0;;) {
                let next = i == ranges.length ? 1e9 : ranges[i++];
                while (pos < next || pos == next && iter.len == 0) {
                    if (iter.done)
                        break done;
                    let len = Math.min(iter.len, next - pos);
                    addSection(filteredSections, len, -1);
                    let ins = iter.ins == -1 ? -1 : iter.off == 0 ? iter.ins : 0;
                    addSection(resultSections, len, ins);
                    if (ins > 0)
                        addInsert(resultInserted, resultSections, iter.text);
                    iter.forward(len);
                    pos += len;
                }
                let end = ranges[i++];
                while (pos < end) {
                    if (iter.done)
                        break done;
                    let len = Math.min(iter.len, end - pos);
                    addSection(resultSections, len, -1);
                    addSection(filteredSections, len, iter.ins == -1 ? -1 : iter.off == 0 ? iter.ins : 0);
                    iter.forward(len);
                    pos += len;
                }
            }
            return { changes: new ChangeSet(resultSections, resultInserted),
                filtered: new ChangeDesc(filteredSections) };
        }
        /**
        Serialize this change set to a JSON-representable value.
        */
        toJSON() {
            let parts = [];
            for (let i = 0; i < this.sections.length; i += 2) {
                let len = this.sections[i], ins = this.sections[i + 1];
                if (ins < 0)
                    parts.push(len);
                else if (ins == 0)
                    parts.push([len]);
                else
                    parts.push([len].concat(this.inserted[i >> 1].toJSON()));
            }
            return parts;
        }
        /**
        Create a change set for the given changes, for a document of the
        given length, using `lineSep` as line separator.
        */
        static of(changes, length, lineSep) {
            let sections = [], inserted = [], pos = 0;
            let total = null;
            function flush(force = false) {
                if (!force && !sections.length)
                    return;
                if (pos < length)
                    addSection(sections, length - pos, -1);
                let set = new ChangeSet(sections, inserted);
                total = total ? total.compose(set.map(total)) : set;
                sections = [];
                inserted = [];
                pos = 0;
            }
            function process(spec) {
                if (Array.isArray(spec)) {
                    for (let sub of spec)
                        process(sub);
                }
                else if (spec instanceof ChangeSet) {
                    if (spec.length != length)
                        throw new RangeError(`Mismatched change set length (got ${spec.length}, expected ${length})`);
                    flush();
                    total = total ? total.compose(spec.map(total)) : spec;
                }
                else {
                    let { from, to = from, insert } = spec;
                    if (from > to || from < 0 || to > length)
                        throw new RangeError(`Invalid change range ${from} to ${to} (in doc of length ${length})`);
                    let insText = !insert ? Text.empty : typeof insert == "string" ? Text.of(insert.split(lineSep || DefaultSplit)) : insert;
                    let insLen = insText.length;
                    if (from == to && insLen == 0)
                        return;
                    if (from < pos)
                        flush();
                    if (from > pos)
                        addSection(sections, from - pos, -1);
                    addSection(sections, to - from, insLen);
                    addInsert(inserted, sections, insText);
                    pos = to;
                }
            }
            process(changes);
            flush(!total);
            return total;
        }
        /**
        Create an empty changeset of the given length.
        */
        static empty(length) {
            return new ChangeSet(length ? [length, -1] : [], []);
        }
        /**
        Create a changeset from its JSON representation (as produced by
        [`toJSON`](https://codemirror.net/6/docs/ref/#state.ChangeSet.toJSON).
        */
        static fromJSON(json) {
            if (!Array.isArray(json))
                throw new RangeError("Invalid JSON representation of ChangeSet");
            let sections = [], inserted = [];
            for (let i = 0; i < json.length; i++) {
                let part = json[i];
                if (typeof part == "number") {
                    sections.push(part, -1);
                }
                else if (!Array.isArray(part) || typeof part[0] != "number" || part.some((e, i) => i && typeof e != "string")) {
                    throw new RangeError("Invalid JSON representation of ChangeSet");
                }
                else if (part.length == 1) {
                    sections.push(part[0], 0);
                }
                else {
                    while (inserted.length < i)
                        inserted.push(Text.empty);
                    inserted[i] = Text.of(part.slice(1));
                    sections.push(part[0], inserted[i].length);
                }
            }
            return new ChangeSet(sections, inserted);
        }
    }
    function addSection(sections, len, ins, forceJoin = false) {
        if (len == 0 && ins <= 0)
            return;
        let last = sections.length - 2;
        if (last >= 0 && ins <= 0 && ins == sections[last + 1])
            sections[last] += len;
        else if (len == 0 && sections[last] == 0)
            sections[last + 1] += ins;
        else if (forceJoin) {
            sections[last] += len;
            sections[last + 1] += ins;
        }
        else
            sections.push(len, ins);
    }
    function addInsert(values, sections, value) {
        if (value.length == 0)
            return;
        let index = (sections.length - 2) >> 1;
        if (index < values.length) {
            values[values.length - 1] = values[values.length - 1].append(value);
        }
        else {
            while (values.length < index)
                values.push(Text.empty);
            values.push(value);
        }
    }
    function iterChanges(desc, f, individual) {
        let inserted = desc.inserted;
        for (let posA = 0, posB = 0, i = 0; i < desc.sections.length;) {
            let len = desc.sections[i++], ins = desc.sections[i++];
            if (ins < 0) {
                posA += len;
                posB += len;
            }
            else {
                let endA = posA, endB = posB, text = Text.empty;
                for (;;) {
                    endA += len;
                    endB += ins;
                    if (ins && inserted)
                        text = text.append(inserted[(i - 2) >> 1]);
                    if (individual || i == desc.sections.length || desc.sections[i + 1] < 0)
                        break;
                    len = desc.sections[i++];
                    ins = desc.sections[i++];
                }
                f(posA, endA, posB, endB, text);
                posA = endA;
                posB = endB;
            }
        }
    }
    function mapSet(setA, setB, before, mkSet = false) {
        let sections = [], insert = mkSet ? [] : null;
        let a = new SectionIter(setA), b = new SectionIter(setB);
        for (let posA = 0, posB = 0;;) {
            if (a.ins == -1) {
                posA += a.len;
                a.next();
            }
            else if (b.ins == -1 && posB < posA) {
                let skip = Math.min(b.len, posA - posB);
                b.forward(skip);
                addSection(sections, skip, -1);
                posB += skip;
            }
            else if (b.ins >= 0 && (a.done || posB < posA || posB == posA && (b.len < a.len || b.len == a.len && !before))) {
                addSection(sections, b.ins, -1);
                while (posA > posB && !a.done && posA + a.len < posB + b.len) {
                    posA += a.len;
                    a.next();
                }
                posB += b.len;
                b.next();
            }
            else if (a.ins >= 0) {
                let len = 0, end = posA + a.len;
                for (;;) {
                    if (b.ins >= 0 && posB > posA && posB + b.len < end) {
                        len += b.ins;
                        posB += b.len;
                        b.next();
                    }
                    else if (b.ins == -1 && posB < end) {
                        let skip = Math.min(b.len, end - posB);
                        len += skip;
                        b.forward(skip);
                        posB += skip;
                    }
                    else {
                        break;
                    }
                }
                addSection(sections, len, a.ins);
                if (insert)
                    addInsert(insert, sections, a.text);
                posA = end;
                a.next();
            }
            else if (a.done && b.done) {
                return insert ? new ChangeSet(sections, insert) : new ChangeDesc(sections);
            }
            else {
                throw new Error("Mismatched change set lengths");
            }
        }
    }
    function composeSets(setA, setB, mkSet = false) {
        let sections = [];
        let insert = mkSet ? [] : null;
        let a = new SectionIter(setA), b = new SectionIter(setB);
        for (let open = false;;) {
            if (a.done && b.done) {
                return insert ? new ChangeSet(sections, insert) : new ChangeDesc(sections);
            }
            else if (a.ins == 0) { // Deletion in A
                addSection(sections, a.len, 0, open);
                a.next();
            }
            else if (b.len == 0 && !b.done) { // Insertion in B
                addSection(sections, 0, b.ins, open);
                if (insert)
                    addInsert(insert, sections, b.text);
                b.next();
            }
            else if (a.done || b.done) {
                throw new Error("Mismatched change set lengths");
            }
            else {
                let len = Math.min(a.len2, b.len), sectionLen = sections.length;
                if (a.ins == -1) {
                    let insB = b.ins == -1 ? -1 : b.off ? 0 : b.ins;
                    addSection(sections, len, insB, open);
                    if (insert && insB)
                        addInsert(insert, sections, b.text);
                }
                else if (b.ins == -1) {
                    addSection(sections, a.off ? 0 : a.len, len, open);
                    if (insert)
                        addInsert(insert, sections, a.textBit(len));
                }
                else {
                    addSection(sections, a.off ? 0 : a.len, b.off ? 0 : b.ins, open);
                    if (insert && !b.off)
                        addInsert(insert, sections, b.text);
                }
                open = (a.ins > len || b.ins >= 0 && b.len > len) && (open || sections.length > sectionLen);
                a.forward2(len);
                b.forward(len);
            }
        }
    }
    class SectionIter {
        constructor(set) {
            this.set = set;
            this.i = 0;
            this.next();
        }
        next() {
            let { sections } = this.set;
            if (this.i < sections.length) {
                this.len = sections[this.i++];
                this.ins = sections[this.i++];
            }
            else {
                this.len = 0;
                this.ins = -2;
            }
            this.off = 0;
        }
        get done() { return this.ins == -2; }
        get len2() { return this.ins < 0 ? this.len : this.ins; }
        get text() {
            let { inserted } = this.set, index = (this.i - 2) >> 1;
            return index >= inserted.length ? Text.empty : inserted[index];
        }
        textBit(len) {
            let { inserted } = this.set, index = (this.i - 2) >> 1;
            return index >= inserted.length && !len ? Text.empty
                : inserted[index].slice(this.off, len == null ? undefined : this.off + len);
        }
        forward(len) {
            if (len == this.len)
                this.next();
            else {
                this.len -= len;
                this.off += len;
            }
        }
        forward2(len) {
            if (this.ins == -1)
                this.forward(len);
            else if (len == this.ins)
                this.next();
            else {
                this.ins -= len;
                this.off += len;
            }
        }
    }

    /**
    A single selection range. When
    [`allowMultipleSelections`](https://codemirror.net/6/docs/ref/#state.EditorState^allowMultipleSelections)
    is enabled, a [selection](https://codemirror.net/6/docs/ref/#state.EditorSelection) may hold
    multiple ranges. By default, selections hold exactly one range.
    */
    class SelectionRange {
        /**
        @internal
        */
        constructor(
        /**
        The lower boundary of the range.
        */
        from, 
        /**
        The upper boundary of the range.
        */
        to, flags) {
            this.from = from;
            this.to = to;
            this.flags = flags;
        }
        /**
        The anchor of the range—the side that doesn't move when you
        extend it.
        */
        get anchor() { return this.flags & 16 /* Inverted */ ? this.to : this.from; }
        /**
        The head of the range, which is moved when the range is
        [extended](https://codemirror.net/6/docs/ref/#state.SelectionRange.extend).
        */
        get head() { return this.flags & 16 /* Inverted */ ? this.from : this.to; }
        /**
        True when `anchor` and `head` are at the same position.
        */
        get empty() { return this.from == this.to; }
        /**
        If this is a cursor that is explicitly associated with the
        character on one of its sides, this returns the side. -1 means
        the character before its position, 1 the character after, and 0
        means no association.
        */
        get assoc() { return this.flags & 4 /* AssocBefore */ ? -1 : this.flags & 8 /* AssocAfter */ ? 1 : 0; }
        /**
        The bidirectional text level associated with this cursor, if
        any.
        */
        get bidiLevel() {
            let level = this.flags & 3 /* BidiLevelMask */;
            return level == 3 ? null : level;
        }
        /**
        The goal column (stored vertical offset) associated with a
        cursor. This is used to preserve the vertical position when
        [moving](https://codemirror.net/6/docs/ref/#view.EditorView.moveVertically) across
        lines of different length.
        */
        get goalColumn() {
            let value = this.flags >> 5 /* GoalColumnOffset */;
            return value == 33554431 /* NoGoalColumn */ ? undefined : value;
        }
        /**
        Map this range through a change, producing a valid range in the
        updated document.
        */
        map(change, assoc = -1) {
            let from, to;
            if (this.empty) {
                from = to = change.mapPos(this.from, assoc);
            }
            else {
                from = change.mapPos(this.from, 1);
                to = change.mapPos(this.to, -1);
            }
            return from == this.from && to == this.to ? this : new SelectionRange(from, to, this.flags);
        }
        /**
        Extend this range to cover at least `from` to `to`.
        */
        extend(from, to = from) {
            if (from <= this.anchor && to >= this.anchor)
                return EditorSelection.range(from, to);
            let head = Math.abs(from - this.anchor) > Math.abs(to - this.anchor) ? from : to;
            return EditorSelection.range(this.anchor, head);
        }
        /**
        Compare this range to another range.
        */
        eq(other) {
            return this.anchor == other.anchor && this.head == other.head;
        }
        /**
        Return a JSON-serializable object representing the range.
        */
        toJSON() { return { anchor: this.anchor, head: this.head }; }
        /**
        Convert a JSON representation of a range to a `SelectionRange`
        instance.
        */
        static fromJSON(json) {
            if (!json || typeof json.anchor != "number" || typeof json.head != "number")
                throw new RangeError("Invalid JSON representation for SelectionRange");
            return EditorSelection.range(json.anchor, json.head);
        }
    }
    /**
    An editor selection holds one or more selection ranges.
    */
    class EditorSelection {
        /**
        @internal
        */
        constructor(
        /**
        The ranges in the selection, sorted by position. Ranges cannot
        overlap (but they may touch, if they aren't empty).
        */
        ranges, 
        /**
        The index of the _main_ range in the selection (which is
        usually the range that was added last).
        */
        mainIndex = 0) {
            this.ranges = ranges;
            this.mainIndex = mainIndex;
        }
        /**
        Map a selection through a change. Used to adjust the selection
        position for changes.
        */
        map(change, assoc = -1) {
            if (change.empty)
                return this;
            return EditorSelection.create(this.ranges.map(r => r.map(change, assoc)), this.mainIndex);
        }
        /**
        Compare this selection to another selection.
        */
        eq(other) {
            if (this.ranges.length != other.ranges.length ||
                this.mainIndex != other.mainIndex)
                return false;
            for (let i = 0; i < this.ranges.length; i++)
                if (!this.ranges[i].eq(other.ranges[i]))
                    return false;
            return true;
        }
        /**
        Get the primary selection range. Usually, you should make sure
        your code applies to _all_ ranges, by using methods like
        [`changeByRange`](https://codemirror.net/6/docs/ref/#state.EditorState.changeByRange).
        */
        get main() { return this.ranges[this.mainIndex]; }
        /**
        Make sure the selection only has one range. Returns a selection
        holding only the main range from this selection.
        */
        asSingle() {
            return this.ranges.length == 1 ? this : new EditorSelection([this.main]);
        }
        /**
        Extend this selection with an extra range.
        */
        addRange(range, main = true) {
            return EditorSelection.create([range].concat(this.ranges), main ? 0 : this.mainIndex + 1);
        }
        /**
        Replace a given range with another range, and then normalize the
        selection to merge and sort ranges if necessary.
        */
        replaceRange(range, which = this.mainIndex) {
            let ranges = this.ranges.slice();
            ranges[which] = range;
            return EditorSelection.create(ranges, this.mainIndex);
        }
        /**
        Convert this selection to an object that can be serialized to
        JSON.
        */
        toJSON() {
            return { ranges: this.ranges.map(r => r.toJSON()), main: this.mainIndex };
        }
        /**
        Create a selection from a JSON representation.
        */
        static fromJSON(json) {
            if (!json || !Array.isArray(json.ranges) || typeof json.main != "number" || json.main >= json.ranges.length)
                throw new RangeError("Invalid JSON representation for EditorSelection");
            return new EditorSelection(json.ranges.map((r) => SelectionRange.fromJSON(r)), json.main);
        }
        /**
        Create a selection holding a single range.
        */
        static single(anchor, head = anchor) {
            return new EditorSelection([EditorSelection.range(anchor, head)], 0);
        }
        /**
        Sort and merge the given set of ranges, creating a valid
        selection.
        */
        static create(ranges, mainIndex = 0) {
            if (ranges.length == 0)
                throw new RangeError("A selection needs at least one range");
            for (let pos = 0, i = 0; i < ranges.length; i++) {
                let range = ranges[i];
                if (range.empty ? range.from <= pos : range.from < pos)
                    return normalized(ranges.slice(), mainIndex);
                pos = range.to;
            }
            return new EditorSelection(ranges, mainIndex);
        }
        /**
        Create a cursor selection range at the given position. You can
        safely ignore the optional arguments in most situations.
        */
        static cursor(pos, assoc = 0, bidiLevel, goalColumn) {
            return new SelectionRange(pos, pos, (assoc == 0 ? 0 : assoc < 0 ? 4 /* AssocBefore */ : 8 /* AssocAfter */) |
                (bidiLevel == null ? 3 : Math.min(2, bidiLevel)) |
                ((goalColumn !== null && goalColumn !== void 0 ? goalColumn : 33554431 /* NoGoalColumn */) << 5 /* GoalColumnOffset */));
        }
        /**
        Create a selection range.
        */
        static range(anchor, head, goalColumn) {
            let goal = (goalColumn !== null && goalColumn !== void 0 ? goalColumn : 33554431 /* NoGoalColumn */) << 5 /* GoalColumnOffset */;
            return head < anchor ? new SelectionRange(head, anchor, 16 /* Inverted */ | goal | 8 /* AssocAfter */)
                : new SelectionRange(anchor, head, goal | (head > anchor ? 4 /* AssocBefore */ : 0));
        }
    }
    function normalized(ranges, mainIndex = 0) {
        let main = ranges[mainIndex];
        ranges.sort((a, b) => a.from - b.from);
        mainIndex = ranges.indexOf(main);
        for (let i = 1; i < ranges.length; i++) {
            let range = ranges[i], prev = ranges[i - 1];
            if (range.empty ? range.from <= prev.to : range.from < prev.to) {
                let from = prev.from, to = Math.max(range.to, prev.to);
                if (i <= mainIndex)
                    mainIndex--;
                ranges.splice(--i, 2, range.anchor > range.head ? EditorSelection.range(to, from) : EditorSelection.range(from, to));
            }
        }
        return new EditorSelection(ranges, mainIndex);
    }
    function checkSelection(selection, docLength) {
        for (let range of selection.ranges)
            if (range.to > docLength)
                throw new RangeError("Selection points outside of document");
    }

    let nextID = 0;
    /**
    A facet is a labeled value that is associated with an editor
    state. It takes inputs from any number of extensions, and combines
    those into a single output value.

    Examples of facets are the [theme](https://codemirror.net/6/docs/ref/#view.EditorView^theme) styles
    associated with an editor or the [tab
    size](https://codemirror.net/6/docs/ref/#state.EditorState^tabSize) (which is reduced to a single
    value, using the input with the hightest precedence).
    */
    class Facet {
        constructor(
        /**
        @internal
        */
        combine, 
        /**
        @internal
        */
        compareInput, 
        /**
        @internal
        */
        compare, isStatic, 
        /**
        @internal
        */
        extensions) {
            this.combine = combine;
            this.compareInput = compareInput;
            this.compare = compare;
            this.isStatic = isStatic;
            this.extensions = extensions;
            /**
            @internal
            */
            this.id = nextID++;
            this.default = combine([]);
        }
        /**
        Define a new facet.
        */
        static define(config = {}) {
            return new Facet(config.combine || ((a) => a), config.compareInput || ((a, b) => a === b), config.compare || (!config.combine ? sameArray : (a, b) => a === b), !!config.static, config.enables);
        }
        /**
        Returns an extension that adds the given value for this facet.
        */
        of(value) {
            return new FacetProvider([], this, 0 /* Static */, value);
        }
        /**
        Create an extension that computes a value for the facet from a
        state. You must take care to declare the parts of the state that
        this value depends on, since your function is only called again
        for a new state when one of those parts changed.
        
        In most cases, you'll want to use the
        [`provide`](https://codemirror.net/6/docs/ref/#state.StateField^define^config.provide) option when
        defining a field instead.
        */
        compute(deps, get) {
            if (this.isStatic)
                throw new Error("Can't compute a static facet");
            return new FacetProvider(deps, this, 1 /* Single */, get);
        }
        /**
        Create an extension that computes zero or more values for this
        facet from a state.
        */
        computeN(deps, get) {
            if (this.isStatic)
                throw new Error("Can't compute a static facet");
            return new FacetProvider(deps, this, 2 /* Multi */, get);
        }
        from(field, get) {
            if (!get)
                get = x => x;
            return this.compute([field], state => get(state.field(field)));
        }
    }
    function sameArray(a, b) {
        return a == b || a.length == b.length && a.every((e, i) => e === b[i]);
    }
    class FacetProvider {
        constructor(dependencies, facet, type, value) {
            this.dependencies = dependencies;
            this.facet = facet;
            this.type = type;
            this.value = value;
            this.id = nextID++;
        }
        dynamicSlot(addresses) {
            var _a;
            let getter = this.value;
            let compare = this.facet.compareInput;
            let id = this.id, idx = addresses[id] >> 1, multi = this.type == 2 /* Multi */;
            let depDoc = false, depSel = false, depAddrs = [];
            for (let dep of this.dependencies) {
                if (dep == "doc")
                    depDoc = true;
                else if (dep == "selection")
                    depSel = true;
                else if ((((_a = addresses[dep.id]) !== null && _a !== void 0 ? _a : 1) & 1) == 0)
                    depAddrs.push(addresses[dep.id]);
            }
            return {
                create(state) {
                    state.values[idx] = getter(state);
                    return 1 /* Changed */;
                },
                update(state, tr) {
                    if ((depDoc && tr.docChanged) || (depSel && (tr.docChanged || tr.selection)) ||
                        depAddrs.some(addr => (ensureAddr(state, addr) & 1 /* Changed */) > 0)) {
                        let newVal = getter(state);
                        if (multi ? !compareArray(newVal, state.values[idx], compare) : !compare(newVal, state.values[idx])) {
                            state.values[idx] = newVal;
                            return 1 /* Changed */;
                        }
                    }
                    return 0;
                },
                reconfigure(state, oldState) {
                    let newVal = getter(state);
                    let oldAddr = oldState.config.address[id];
                    if (oldAddr != null) {
                        let oldVal = getAddr(oldState, oldAddr);
                        if (multi ? compareArray(newVal, oldVal, compare) : compare(newVal, oldVal)) {
                            state.values[idx] = oldVal;
                            return 0;
                        }
                    }
                    state.values[idx] = newVal;
                    return 1 /* Changed */;
                }
            };
        }
    }
    function compareArray(a, b, compare) {
        if (a.length != b.length)
            return false;
        for (let i = 0; i < a.length; i++)
            if (!compare(a[i], b[i]))
                return false;
        return true;
    }
    function dynamicFacetSlot(addresses, facet, providers) {
        let providerAddrs = providers.map(p => addresses[p.id]);
        let providerTypes = providers.map(p => p.type);
        let dynamic = providerAddrs.filter(p => !(p & 1));
        let idx = addresses[facet.id] >> 1;
        function get(state) {
            let values = [];
            for (let i = 0; i < providerAddrs.length; i++) {
                let value = getAddr(state, providerAddrs[i]);
                if (providerTypes[i] == 2 /* Multi */)
                    for (let val of value)
                        values.push(val);
                else
                    values.push(value);
            }
            return facet.combine(values);
        }
        return {
            create(state) {
                for (let addr of providerAddrs)
                    ensureAddr(state, addr);
                state.values[idx] = get(state);
                return 1 /* Changed */;
            },
            update(state, tr) {
                if (!dynamic.some(dynAddr => ensureAddr(state, dynAddr) & 1 /* Changed */))
                    return 0;
                let value = get(state);
                if (facet.compare(value, state.values[idx]))
                    return 0;
                state.values[idx] = value;
                return 1 /* Changed */;
            },
            reconfigure(state, oldState) {
                let depChanged = providerAddrs.some(addr => ensureAddr(state, addr) & 1 /* Changed */);
                let oldProviders = oldState.config.facets[facet.id], oldValue = oldState.facet(facet);
                if (oldProviders && !depChanged && sameArray(providers, oldProviders)) {
                    state.values[idx] = oldValue;
                    return 0;
                }
                let value = get(state);
                if (facet.compare(value, oldValue)) {
                    state.values[idx] = oldValue;
                    return 0;
                }
                state.values[idx] = value;
                return 1 /* Changed */;
            }
        };
    }
    const initField = /*@__PURE__*/Facet.define({ static: true });
    /**
    Fields can store additional information in an editor state, and
    keep it in sync with the rest of the state.
    */
    class StateField {
        constructor(
        /**
        @internal
        */
        id, createF, updateF, compareF, 
        /**
        @internal
        */
        spec) {
            this.id = id;
            this.createF = createF;
            this.updateF = updateF;
            this.compareF = compareF;
            this.spec = spec;
            /**
            @internal
            */
            this.provides = undefined;
        }
        /**
        Define a state field.
        */
        static define(config) {
            let field = new StateField(nextID++, config.create, config.update, config.compare || ((a, b) => a === b), config);
            if (config.provide)
                field.provides = config.provide(field);
            return field;
        }
        create(state) {
            let init = state.facet(initField).find(i => i.field == this);
            return ((init === null || init === void 0 ? void 0 : init.create) || this.createF)(state);
        }
        /**
        @internal
        */
        slot(addresses) {
            let idx = addresses[this.id] >> 1;
            return {
                create: (state) => {
                    state.values[idx] = this.create(state);
                    return 1 /* Changed */;
                },
                update: (state, tr) => {
                    let oldVal = state.values[idx];
                    let value = this.updateF(oldVal, tr);
                    if (this.compareF(oldVal, value))
                        return 0;
                    state.values[idx] = value;
                    return 1 /* Changed */;
                },
                reconfigure: (state, oldState) => {
                    if (oldState.config.address[this.id] != null) {
                        state.values[idx] = oldState.field(this);
                        return 0;
                    }
                    state.values[idx] = this.create(state);
                    return 1 /* Changed */;
                }
            };
        }
        /**
        Returns an extension that enables this field and overrides the
        way it is initialized. Can be useful when you need to provide a
        non-default starting value for the field.
        */
        init(create) {
            return [this, initField.of({ field: this, create })];
        }
        /**
        State field instances can be used as
        [`Extension`](https://codemirror.net/6/docs/ref/#state.Extension) values to enable the field in a
        given state.
        */
        get extension() { return this; }
    }
    const Prec_ = { lowest: 4, low: 3, default: 2, high: 1, highest: 0 };
    function prec(value) {
        return (ext) => new PrecExtension(ext, value);
    }
    /**
    By default extensions are registered in the order they are found
    in the flattened form of nested array that was provided.
    Individual extension values can be assigned a precedence to
    override this. Extensions that do not have a precedence set get
    the precedence of the nearest parent with a precedence, or
    [`default`](https://codemirror.net/6/docs/ref/#state.Prec.default) if there is no such parent. The
    final ordering of extensions is determined by first sorting by
    precedence and then by order within each precedence.
    */
    const Prec = {
        /**
        The lowest precedence level. Meant for things that should end up
        near the end of the extension order.
        */
        lowest: /*@__PURE__*/prec(Prec_.lowest),
        /**
        A lower-than-default precedence, for extensions.
        */
        low: /*@__PURE__*/prec(Prec_.low),
        /**
        The default precedence, which is also used for extensions
        without an explicit precedence.
        */
        default: /*@__PURE__*/prec(Prec_.default),
        /**
        A higher-than-default precedence, for extensions that should
        come before those with default precedence.
        */
        high: /*@__PURE__*/prec(Prec_.high),
        /**
        The highest precedence level, for extensions that should end up
        near the start of the precedence ordering.
        */
        highest: /*@__PURE__*/prec(Prec_.highest),
        // FIXME Drop these in some future breaking version
        /**
        Backwards-compatible synonym for `Prec.lowest`.
        */
        fallback: /*@__PURE__*/prec(Prec_.lowest),
        /**
        Backwards-compatible synonym for `Prec.high`.
        */
        extend: /*@__PURE__*/prec(Prec_.high),
        /**
        Backwards-compatible synonym for `Prec.highest`.
        */
        override: /*@__PURE__*/prec(Prec_.highest)
    };
    class PrecExtension {
        constructor(inner, prec) {
            this.inner = inner;
            this.prec = prec;
        }
    }
    /**
    Extension compartments can be used to make a configuration
    dynamic. By [wrapping](https://codemirror.net/6/docs/ref/#state.Compartment.of) part of your
    configuration in a compartment, you can later
    [replace](https://codemirror.net/6/docs/ref/#state.Compartment.reconfigure) that part through a
    transaction.
    */
    class Compartment {
        /**
        Create an instance of this compartment to add to your [state
        configuration](https://codemirror.net/6/docs/ref/#state.EditorStateConfig.extensions).
        */
        of(ext) { return new CompartmentInstance(this, ext); }
        /**
        Create an [effect](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects) that
        reconfigures this compartment.
        */
        reconfigure(content) {
            return Compartment.reconfigure.of({ compartment: this, extension: content });
        }
        /**
        Get the current content of the compartment in the state, or
        `undefined` if it isn't present.
        */
        get(state) {
            return state.config.compartments.get(this);
        }
    }
    class CompartmentInstance {
        constructor(compartment, inner) {
            this.compartment = compartment;
            this.inner = inner;
        }
    }
    class Configuration {
        constructor(base, compartments, dynamicSlots, address, staticValues, facets) {
            this.base = base;
            this.compartments = compartments;
            this.dynamicSlots = dynamicSlots;
            this.address = address;
            this.staticValues = staticValues;
            this.facets = facets;
            this.statusTemplate = [];
            while (this.statusTemplate.length < dynamicSlots.length)
                this.statusTemplate.push(0 /* Unresolved */);
        }
        staticFacet(facet) {
            let addr = this.address[facet.id];
            return addr == null ? facet.default : this.staticValues[addr >> 1];
        }
        static resolve(base, compartments, oldState) {
            let fields = [];
            let facets = Object.create(null);
            let newCompartments = new Map();
            for (let ext of flatten(base, compartments, newCompartments)) {
                if (ext instanceof StateField)
                    fields.push(ext);
                else
                    (facets[ext.facet.id] || (facets[ext.facet.id] = [])).push(ext);
            }
            let address = Object.create(null);
            let staticValues = [];
            let dynamicSlots = [];
            for (let field of fields) {
                address[field.id] = dynamicSlots.length << 1;
                dynamicSlots.push(a => field.slot(a));
            }
            let oldFacets = oldState === null || oldState === void 0 ? void 0 : oldState.config.facets;
            for (let id in facets) {
                let providers = facets[id], facet = providers[0].facet;
                let oldProviders = oldFacets && oldFacets[id] || [];
                if (providers.every(p => p.type == 0 /* Static */)) {
                    address[facet.id] = (staticValues.length << 1) | 1;
                    if (sameArray(oldProviders, providers)) {
                        staticValues.push(oldState.facet(facet));
                    }
                    else {
                        let value = facet.combine(providers.map(p => p.value));
                        staticValues.push(oldState && facet.compare(value, oldState.facet(facet)) ? oldState.facet(facet) : value);
                    }
                }
                else {
                    for (let p of providers) {
                        if (p.type == 0 /* Static */) {
                            address[p.id] = (staticValues.length << 1) | 1;
                            staticValues.push(p.value);
                        }
                        else {
                            address[p.id] = dynamicSlots.length << 1;
                            dynamicSlots.push(a => p.dynamicSlot(a));
                        }
                    }
                    address[facet.id] = dynamicSlots.length << 1;
                    dynamicSlots.push(a => dynamicFacetSlot(a, facet, providers));
                }
            }
            let dynamic = dynamicSlots.map(f => f(address));
            return new Configuration(base, newCompartments, dynamic, address, staticValues, facets);
        }
    }
    function flatten(extension, compartments, newCompartments) {
        let result = [[], [], [], [], []];
        let seen = new Map();
        function inner(ext, prec) {
            let known = seen.get(ext);
            if (known != null) {
                if (known >= prec)
                    return;
                let found = result[known].indexOf(ext);
                if (found > -1)
                    result[known].splice(found, 1);
                if (ext instanceof CompartmentInstance)
                    newCompartments.delete(ext.compartment);
            }
            seen.set(ext, prec);
            if (Array.isArray(ext)) {
                for (let e of ext)
                    inner(e, prec);
            }
            else if (ext instanceof CompartmentInstance) {
                if (newCompartments.has(ext.compartment))
                    throw new RangeError(`Duplicate use of compartment in extensions`);
                let content = compartments.get(ext.compartment) || ext.inner;
                newCompartments.set(ext.compartment, content);
                inner(content, prec);
            }
            else if (ext instanceof PrecExtension) {
                inner(ext.inner, ext.prec);
            }
            else if (ext instanceof StateField) {
                result[prec].push(ext);
                if (ext.provides)
                    inner(ext.provides, prec);
            }
            else if (ext instanceof FacetProvider) {
                result[prec].push(ext);
                if (ext.facet.extensions)
                    inner(ext.facet.extensions, prec);
            }
            else {
                let content = ext.extension;
                if (!content)
                    throw new Error(`Unrecognized extension value in extension set (${ext}). This sometimes happens because multiple instances of @codemirror/state are loaded, breaking instanceof checks.`);
                inner(content, prec);
            }
        }
        inner(extension, Prec_.default);
        return result.reduce((a, b) => a.concat(b));
    }
    function ensureAddr(state, addr) {
        if (addr & 1)
            return 2 /* Computed */;
        let idx = addr >> 1;
        let status = state.status[idx];
        if (status == 4 /* Computing */)
            throw new Error("Cyclic dependency between fields and/or facets");
        if (status & 2 /* Computed */)
            return status;
        state.status[idx] = 4 /* Computing */;
        let changed = state.computeSlot(state, state.config.dynamicSlots[idx]);
        return state.status[idx] = 2 /* Computed */ | changed;
    }
    function getAddr(state, addr) {
        return addr & 1 ? state.config.staticValues[addr >> 1] : state.values[addr >> 1];
    }

    const languageData = /*@__PURE__*/Facet.define();
    const allowMultipleSelections = /*@__PURE__*/Facet.define({
        combine: values => values.some(v => v),
        static: true
    });
    const lineSeparator = /*@__PURE__*/Facet.define({
        combine: values => values.length ? values[0] : undefined,
        static: true
    });
    const changeFilter = /*@__PURE__*/Facet.define();
    const transactionFilter = /*@__PURE__*/Facet.define();
    const transactionExtender = /*@__PURE__*/Facet.define();
    const readOnly = /*@__PURE__*/Facet.define({
        combine: values => values.length ? values[0] : false
    });

    /**
    Annotations are tagged values that are used to add metadata to
    transactions in an extensible way. They should be used to model
    things that effect the entire transaction (such as its [time
    stamp](https://codemirror.net/6/docs/ref/#state.Transaction^time) or information about its
    [origin](https://codemirror.net/6/docs/ref/#state.Transaction^userEvent)). For effects that happen
    _alongside_ the other changes made by the transaction, [state
    effects](https://codemirror.net/6/docs/ref/#state.StateEffect) are more appropriate.
    */
    class Annotation {
        /**
        @internal
        */
        constructor(
        /**
        The annotation type.
        */
        type, 
        /**
        The value of this annotation.
        */
        value) {
            this.type = type;
            this.value = value;
        }
        /**
        Define a new type of annotation.
        */
        static define() { return new AnnotationType(); }
    }
    /**
    Marker that identifies a type of [annotation](https://codemirror.net/6/docs/ref/#state.Annotation).
    */
    class AnnotationType {
        /**
        Create an instance of this annotation.
        */
        of(value) { return new Annotation(this, value); }
    }
    /**
    Representation of a type of state effect. Defined with
    [`StateEffect.define`](https://codemirror.net/6/docs/ref/#state.StateEffect^define).
    */
    class StateEffectType {
        /**
        @internal
        */
        constructor(
        // The `any` types in these function types are there to work
        // around TypeScript issue #37631, where the type guard on
        // `StateEffect.is` mysteriously stops working when these properly
        // have type `Value`.
        /**
        @internal
        */
        map) {
            this.map = map;
        }
        /**
        Create a [state effect](https://codemirror.net/6/docs/ref/#state.StateEffect) instance of this
        type.
        */
        of(value) { return new StateEffect(this, value); }
    }
    /**
    State effects can be used to represent additional effects
    associated with a [transaction](https://codemirror.net/6/docs/ref/#state.Transaction.effects). They
    are often useful to model changes to custom [state
    fields](https://codemirror.net/6/docs/ref/#state.StateField), when those changes aren't implicit in
    document or selection changes.
    */
    class StateEffect {
        /**
        @internal
        */
        constructor(
        /**
        @internal
        */
        type, 
        /**
        The value of this effect.
        */
        value) {
            this.type = type;
            this.value = value;
        }
        /**
        Map this effect through a position mapping. Will return
        `undefined` when that ends up deleting the effect.
        */
        map(mapping) {
            let mapped = this.type.map(this.value, mapping);
            return mapped === undefined ? undefined : mapped == this.value ? this : new StateEffect(this.type, mapped);
        }
        /**
        Tells you whether this effect object is of a given
        [type](https://codemirror.net/6/docs/ref/#state.StateEffectType).
        */
        is(type) { return this.type == type; }
        /**
        Define a new effect type. The type parameter indicates the type
        of values that his effect holds.
        */
        static define(spec = {}) {
            return new StateEffectType(spec.map || (v => v));
        }
        /**
        Map an array of effects through a change set.
        */
        static mapEffects(effects, mapping) {
            if (!effects.length)
                return effects;
            let result = [];
            for (let effect of effects) {
                let mapped = effect.map(mapping);
                if (mapped)
                    result.push(mapped);
            }
            return result;
        }
    }
    /**
    This effect can be used to reconfigure the root extensions of
    the editor. Doing this will discard any extensions
    [appended](https://codemirror.net/6/docs/ref/#state.StateEffect^appendConfig), but does not reset
    the content of [reconfigured](https://codemirror.net/6/docs/ref/#state.Compartment.reconfigure)
    compartments.
    */
    StateEffect.reconfigure = /*@__PURE__*/StateEffect.define();
    /**
    Append extensions to the top-level configuration of the editor.
    */
    StateEffect.appendConfig = /*@__PURE__*/StateEffect.define();
    /**
    Changes to the editor state are grouped into transactions.
    Typically, a user action creates a single transaction, which may
    contain any number of document changes, may change the selection,
    or have other effects. Create a transaction by calling
    [`EditorState.update`](https://codemirror.net/6/docs/ref/#state.EditorState.update).
    */
    class Transaction {
        /**
        @internal
        */
        constructor(
        /**
        The state from which the transaction starts.
        */
        startState, 
        /**
        The document changes made by this transaction.
        */
        changes, 
        /**
        The selection set by this transaction, or undefined if it
        doesn't explicitly set a selection.
        */
        selection, 
        /**
        The effects added to the transaction.
        */
        effects, 
        /**
        @internal
        */
        annotations, 
        /**
        Whether the selection should be scrolled into view after this
        transaction is dispatched.
        */
        scrollIntoView) {
            this.startState = startState;
            this.changes = changes;
            this.selection = selection;
            this.effects = effects;
            this.annotations = annotations;
            this.scrollIntoView = scrollIntoView;
            /**
            @internal
            */
            this._doc = null;
            /**
            @internal
            */
            this._state = null;
            if (selection)
                checkSelection(selection, changes.newLength);
            if (!annotations.some((a) => a.type == Transaction.time))
                this.annotations = annotations.concat(Transaction.time.of(Date.now()));
        }
        /**
        The new document produced by the transaction. Contrary to
        [`.state`](https://codemirror.net/6/docs/ref/#state.Transaction.state)`.doc`, accessing this won't
        force the entire new state to be computed right away, so it is
        recommended that [transaction
        filters](https://codemirror.net/6/docs/ref/#state.EditorState^transactionFilter) use this getter
        when they need to look at the new document.
        */
        get newDoc() {
            return this._doc || (this._doc = this.changes.apply(this.startState.doc));
        }
        /**
        The new selection produced by the transaction. If
        [`this.selection`](https://codemirror.net/6/docs/ref/#state.Transaction.selection) is undefined,
        this will [map](https://codemirror.net/6/docs/ref/#state.EditorSelection.map) the start state's
        current selection through the changes made by the transaction.
        */
        get newSelection() {
            return this.selection || this.startState.selection.map(this.changes);
        }
        /**
        The new state created by the transaction. Computed on demand
        (but retained for subsequent access), so itis recommended not to
        access it in [transaction
        filters](https://codemirror.net/6/docs/ref/#state.EditorState^transactionFilter) when possible.
        */
        get state() {
            if (!this._state)
                this.startState.applyTransaction(this);
            return this._state;
        }
        /**
        Get the value of the given annotation type, if any.
        */
        annotation(type) {
            for (let ann of this.annotations)
                if (ann.type == type)
                    return ann.value;
            return undefined;
        }
        /**
        Indicates whether the transaction changed the document.
        */
        get docChanged() { return !this.changes.empty; }
        /**
        Indicates whether this transaction reconfigures the state
        (through a [configuration compartment](https://codemirror.net/6/docs/ref/#state.Compartment) or
        with a top-level configuration
        [effect](https://codemirror.net/6/docs/ref/#state.StateEffect^reconfigure).
        */
        get reconfigured() { return this.startState.config != this.state.config; }
        /**
        Returns true if the transaction has a [user
        event](https://codemirror.net/6/docs/ref/#state.Transaction^userEvent) annotation that is equal to
        or more specific than `event`. For example, if the transaction
        has `"select.pointer"` as user event, `"select"` and
        `"select.pointer"` will match it.
        */
        isUserEvent(event) {
            let e = this.annotation(Transaction.userEvent);
            return !!(e && (e == event || e.length > event.length && e.slice(0, event.length) == event && e[event.length] == "."));
        }
    }
    /**
    Annotation used to store transaction timestamps.
    */
    Transaction.time = /*@__PURE__*/Annotation.define();
    /**
    Annotation used to associate a transaction with a user interface
    event. Holds a string identifying the event, using a
    dot-separated format to support attaching more specific
    information. The events used by the core libraries are:

     - `"input"` when content is entered
       - `"input.type"` for typed input
         - `"input.type.compose"` for composition
       - `"input.paste"` for pasted input
       - `"input.drop"` when adding content with drag-and-drop
       - `"input.complete"` when autocompleting
     - `"delete"` when the user deletes content
       - `"delete.selection"` when deleting the selection
       - `"delete.forward"` when deleting forward from the selection
       - `"delete.backward"` when deleting backward from the selection
       - `"delete.cut"` when cutting to the clipboard
     - `"move"` when content is moved
       - `"move.drop"` when content is moved within the editor through drag-and-drop
     - `"select"` when explicitly changing the selection
       - `"select.pointer"` when selecting with a mouse or other pointing device
     - `"undo"` and `"redo"` for history actions

    Use [`isUserEvent`](https://codemirror.net/6/docs/ref/#state.Transaction.isUserEvent) to check
    whether the annotation matches a given event.
    */
    Transaction.userEvent = /*@__PURE__*/Annotation.define();
    /**
    Annotation indicating whether a transaction should be added to
    the undo history or not.
    */
    Transaction.addToHistory = /*@__PURE__*/Annotation.define();
    /**
    Annotation indicating (when present and true) that a transaction
    represents a change made by some other actor, not the user. This
    is used, for example, to tag other people's changes in
    collaborative editing.
    */
    Transaction.remote = /*@__PURE__*/Annotation.define();
    function joinRanges(a, b) {
        let result = [];
        for (let iA = 0, iB = 0;;) {
            let from, to;
            if (iA < a.length && (iB == b.length || b[iB] >= a[iA])) {
                from = a[iA++];
                to = a[iA++];
            }
            else if (iB < b.length) {
                from = b[iB++];
                to = b[iB++];
            }
            else
                return result;
            if (!result.length || result[result.length - 1] < from)
                result.push(from, to);
            else if (result[result.length - 1] < to)
                result[result.length - 1] = to;
        }
    }
    function mergeTransaction(a, b, sequential) {
        var _a;
        let mapForA, mapForB, changes;
        if (sequential) {
            mapForA = b.changes;
            mapForB = ChangeSet.empty(b.changes.length);
            changes = a.changes.compose(b.changes);
        }
        else {
            mapForA = b.changes.map(a.changes);
            mapForB = a.changes.mapDesc(b.changes, true);
            changes = a.changes.compose(mapForA);
        }
        return {
            changes,
            selection: b.selection ? b.selection.map(mapForB) : (_a = a.selection) === null || _a === void 0 ? void 0 : _a.map(mapForA),
            effects: StateEffect.mapEffects(a.effects, mapForA).concat(StateEffect.mapEffects(b.effects, mapForB)),
            annotations: a.annotations.length ? a.annotations.concat(b.annotations) : b.annotations,
            scrollIntoView: a.scrollIntoView || b.scrollIntoView
        };
    }
    function resolveTransactionInner(state, spec, docSize) {
        let sel = spec.selection, annotations = asArray(spec.annotations);
        if (spec.userEvent)
            annotations = annotations.concat(Transaction.userEvent.of(spec.userEvent));
        return {
            changes: spec.changes instanceof ChangeSet ? spec.changes
                : ChangeSet.of(spec.changes || [], docSize, state.facet(lineSeparator)),
            selection: sel && (sel instanceof EditorSelection ? sel : EditorSelection.single(sel.anchor, sel.head)),
            effects: asArray(spec.effects),
            annotations,
            scrollIntoView: !!spec.scrollIntoView
        };
    }
    function resolveTransaction(state, specs, filter) {
        let s = resolveTransactionInner(state, specs.length ? specs[0] : {}, state.doc.length);
        if (specs.length && specs[0].filter === false)
            filter = false;
        for (let i = 1; i < specs.length; i++) {
            if (specs[i].filter === false)
                filter = false;
            let seq = !!specs[i].sequential;
            s = mergeTransaction(s, resolveTransactionInner(state, specs[i], seq ? s.changes.newLength : state.doc.length), seq);
        }
        let tr = new Transaction(state, s.changes, s.selection, s.effects, s.annotations, s.scrollIntoView);
        return extendTransaction(filter ? filterTransaction(tr) : tr);
    }
    // Finish a transaction by applying filters if necessary.
    function filterTransaction(tr) {
        let state = tr.startState;
        // Change filters
        let result = true;
        for (let filter of state.facet(changeFilter)) {
            let value = filter(tr);
            if (value === false) {
                result = false;
                break;
            }
            if (Array.isArray(value))
                result = result === true ? value : joinRanges(result, value);
        }
        if (result !== true) {
            let changes, back;
            if (result === false) {
                back = tr.changes.invertedDesc;
                changes = ChangeSet.empty(state.doc.length);
            }
            else {
                let filtered = tr.changes.filter(result);
                changes = filtered.changes;
                back = filtered.filtered.invertedDesc;
            }
            tr = new Transaction(state, changes, tr.selection && tr.selection.map(back), StateEffect.mapEffects(tr.effects, back), tr.annotations, tr.scrollIntoView);
        }
        // Transaction filters
        let filters = state.facet(transactionFilter);
        for (let i = filters.length - 1; i >= 0; i--) {
            let filtered = filters[i](tr);
            if (filtered instanceof Transaction)
                tr = filtered;
            else if (Array.isArray(filtered) && filtered.length == 1 && filtered[0] instanceof Transaction)
                tr = filtered[0];
            else
                tr = resolveTransaction(state, asArray(filtered), false);
        }
        return tr;
    }
    function extendTransaction(tr) {
        let state = tr.startState, extenders = state.facet(transactionExtender), spec = tr;
        for (let i = extenders.length - 1; i >= 0; i--) {
            let extension = extenders[i](tr);
            if (extension && Object.keys(extension).length)
                spec = mergeTransaction(tr, resolveTransactionInner(state, extension, tr.changes.newLength), true);
        }
        return spec == tr ? tr : new Transaction(state, tr.changes, tr.selection, spec.effects, spec.annotations, spec.scrollIntoView);
    }
    const none$1 = [];
    function asArray(value) {
        return value == null ? none$1 : Array.isArray(value) ? value : [value];
    }

    /**
    The categories produced by a [character
    categorizer](https://codemirror.net/6/docs/ref/#state.EditorState.charCategorizer). These are used
    do things like selecting by word.
    */
    var CharCategory = /*@__PURE__*/(function (CharCategory) {
        /**
        Word characters.
        */
        CharCategory[CharCategory["Word"] = 0] = "Word";
        /**
        Whitespace.
        */
        CharCategory[CharCategory["Space"] = 1] = "Space";
        /**
        Anything else.
        */
        CharCategory[CharCategory["Other"] = 2] = "Other";
    return CharCategory})(CharCategory || (CharCategory = {}));
    const nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
    let wordChar;
    try {
        wordChar = /*@__PURE__*/new RegExp("[\\p{Alphabetic}\\p{Number}_]", "u");
    }
    catch (_) { }
    function hasWordChar(str) {
        if (wordChar)
            return wordChar.test(str);
        for (let i = 0; i < str.length; i++) {
            let ch = str[i];
            if (/\w/.test(ch) || ch > "\x80" && (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch)))
                return true;
        }
        return false;
    }
    function makeCategorizer(wordChars) {
        return (char) => {
            if (!/\S/.test(char))
                return CharCategory.Space;
            if (hasWordChar(char))
                return CharCategory.Word;
            for (let i = 0; i < wordChars.length; i++)
                if (char.indexOf(wordChars[i]) > -1)
                    return CharCategory.Word;
            return CharCategory.Other;
        };
    }

    /**
    The editor state class is a persistent (immutable) data structure.
    To update a state, you [create](https://codemirror.net/6/docs/ref/#state.EditorState.update) a
    [transaction](https://codemirror.net/6/docs/ref/#state.Transaction), which produces a _new_ state
    instance, without modifying the original object.

    As such, _never_ mutate properties of a state directly. That'll
    just break things.
    */
    class EditorState {
        /**
        @internal
        */
        constructor(
        /**
        @internal
        */
        config, 
        /**
        The current document.
        */
        doc, 
        /**
        The current selection.
        */
        selection, 
        /**
        @internal
        */
        values, computeSlot, tr) {
            this.config = config;
            this.doc = doc;
            this.selection = selection;
            this.values = values;
            this.status = config.statusTemplate.slice();
            this.computeSlot = computeSlot;
            // Fill in the computed state immediately, so that further queries
            // for it made during the update return this state
            if (tr)
                tr._state = this;
            for (let i = 0; i < this.config.dynamicSlots.length; i++)
                ensureAddr(this, i << 1);
            this.computeSlot = null;
        }
        field(field, require = true) {
            let addr = this.config.address[field.id];
            if (addr == null) {
                if (require)
                    throw new RangeError("Field is not present in this state");
                return undefined;
            }
            ensureAddr(this, addr);
            return getAddr(this, addr);
        }
        /**
        Create a [transaction](https://codemirror.net/6/docs/ref/#state.Transaction) that updates this
        state. Any number of [transaction specs](https://codemirror.net/6/docs/ref/#state.TransactionSpec)
        can be passed. Unless
        [`sequential`](https://codemirror.net/6/docs/ref/#state.TransactionSpec.sequential) is set, the
        [changes](https://codemirror.net/6/docs/ref/#state.TransactionSpec.changes) (if any) of each spec
        are assumed to start in the _current_ document (not the document
        produced by previous specs), and its
        [selection](https://codemirror.net/6/docs/ref/#state.TransactionSpec.selection) and
        [effects](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects) are assumed to refer
        to the document created by its _own_ changes. The resulting
        transaction contains the combined effect of all the different
        specs. For [selection](https://codemirror.net/6/docs/ref/#state.TransactionSpec.selection), later
        specs take precedence over earlier ones.
        */
        update(...specs) {
            return resolveTransaction(this, specs, true);
        }
        /**
        @internal
        */
        applyTransaction(tr) {
            let conf = this.config, { base, compartments } = conf;
            for (let effect of tr.effects) {
                if (effect.is(Compartment.reconfigure)) {
                    if (conf) {
                        compartments = new Map;
                        conf.compartments.forEach((val, key) => compartments.set(key, val));
                        conf = null;
                    }
                    compartments.set(effect.value.compartment, effect.value.extension);
                }
                else if (effect.is(StateEffect.reconfigure)) {
                    conf = null;
                    base = effect.value;
                }
                else if (effect.is(StateEffect.appendConfig)) {
                    conf = null;
                    base = asArray(base).concat(effect.value);
                }
            }
            let startValues;
            if (!conf) {
                conf = Configuration.resolve(base, compartments, this);
                let intermediateState = new EditorState(conf, this.doc, this.selection, conf.dynamicSlots.map(() => null), (state, slot) => slot.reconfigure(state, this), null);
                startValues = intermediateState.values;
            }
            else {
                startValues = tr.startState.values.slice();
            }
            new EditorState(conf, tr.newDoc, tr.newSelection, startValues, (state, slot) => slot.update(state, tr), tr);
        }
        /**
        Create a [transaction spec](https://codemirror.net/6/docs/ref/#state.TransactionSpec) that
        replaces every selection range with the given content.
        */
        replaceSelection(text) {
            if (typeof text == "string")
                text = this.toText(text);
            return this.changeByRange(range => ({ changes: { from: range.from, to: range.to, insert: text },
                range: EditorSelection.cursor(range.from + text.length) }));
        }
        /**
        Create a set of changes and a new selection by running the given
        function for each range in the active selection. The function
        can return an optional set of changes (in the coordinate space
        of the start document), plus an updated range (in the coordinate
        space of the document produced by the call's own changes). This
        method will merge all the changes and ranges into a single
        changeset and selection, and return it as a [transaction
        spec](https://codemirror.net/6/docs/ref/#state.TransactionSpec), which can be passed to
        [`update`](https://codemirror.net/6/docs/ref/#state.EditorState.update).
        */
        changeByRange(f) {
            let sel = this.selection;
            let result1 = f(sel.ranges[0]);
            let changes = this.changes(result1.changes), ranges = [result1.range];
            let effects = asArray(result1.effects);
            for (let i = 1; i < sel.ranges.length; i++) {
                let result = f(sel.ranges[i]);
                let newChanges = this.changes(result.changes), newMapped = newChanges.map(changes);
                for (let j = 0; j < i; j++)
                    ranges[j] = ranges[j].map(newMapped);
                let mapBy = changes.mapDesc(newChanges, true);
                ranges.push(result.range.map(mapBy));
                changes = changes.compose(newMapped);
                effects = StateEffect.mapEffects(effects, newMapped).concat(StateEffect.mapEffects(asArray(result.effects), mapBy));
            }
            return {
                changes,
                selection: EditorSelection.create(ranges, sel.mainIndex),
                effects
            };
        }
        /**
        Create a [change set](https://codemirror.net/6/docs/ref/#state.ChangeSet) from the given change
        description, taking the state's document length and line
        separator into account.
        */
        changes(spec = []) {
            if (spec instanceof ChangeSet)
                return spec;
            return ChangeSet.of(spec, this.doc.length, this.facet(EditorState.lineSeparator));
        }
        /**
        Using the state's [line
        separator](https://codemirror.net/6/docs/ref/#state.EditorState^lineSeparator), create a
        [`Text`](https://codemirror.net/6/docs/ref/#text.Text) instance from the given string.
        */
        toText(string) {
            return Text.of(string.split(this.facet(EditorState.lineSeparator) || DefaultSplit));
        }
        /**
        Return the given range of the document as a string.
        */
        sliceDoc(from = 0, to = this.doc.length) {
            return this.doc.sliceString(from, to, this.lineBreak);
        }
        /**
        Get the value of a state [facet](https://codemirror.net/6/docs/ref/#state.Facet).
        */
        facet(facet) {
            let addr = this.config.address[facet.id];
            if (addr == null)
                return facet.default;
            ensureAddr(this, addr);
            return getAddr(this, addr);
        }
        /**
        Convert this state to a JSON-serializable object. When custom
        fields should be serialized, you can pass them in as an object
        mapping property names (in the resulting object, which should
        not use `doc` or `selection`) to fields.
        */
        toJSON(fields) {
            let result = {
                doc: this.sliceDoc(),
                selection: this.selection.toJSON()
            };
            if (fields)
                for (let prop in fields) {
                    let value = fields[prop];
                    if (value instanceof StateField)
                        result[prop] = value.spec.toJSON(this.field(fields[prop]), this);
                }
            return result;
        }
        /**
        Deserialize a state from its JSON representation. When custom
        fields should be deserialized, pass the same object you passed
        to [`toJSON`](https://codemirror.net/6/docs/ref/#state.EditorState.toJSON) when serializing as
        third argument.
        */
        static fromJSON(json, config = {}, fields) {
            if (!json || typeof json.doc != "string")
                throw new RangeError("Invalid JSON representation for EditorState");
            let fieldInit = [];
            if (fields)
                for (let prop in fields) {
                    let field = fields[prop], value = json[prop];
                    fieldInit.push(field.init(state => field.spec.fromJSON(value, state)));
                }
            return EditorState.create({
                doc: json.doc,
                selection: EditorSelection.fromJSON(json.selection),
                extensions: config.extensions ? fieldInit.concat([config.extensions]) : fieldInit
            });
        }
        /**
        Create a new state. You'll usually only need this when
        initializing an editor—updated states are created by applying
        transactions.
        */
        static create(config = {}) {
            let configuration = Configuration.resolve(config.extensions || [], new Map);
            let doc = config.doc instanceof Text ? config.doc
                : Text.of((config.doc || "").split(configuration.staticFacet(EditorState.lineSeparator) || DefaultSplit));
            let selection = !config.selection ? EditorSelection.single(0)
                : config.selection instanceof EditorSelection ? config.selection
                    : EditorSelection.single(config.selection.anchor, config.selection.head);
            checkSelection(selection, doc.length);
            if (!configuration.staticFacet(allowMultipleSelections))
                selection = selection.asSingle();
            return new EditorState(configuration, doc, selection, configuration.dynamicSlots.map(() => null), (state, slot) => slot.create(state), null);
        }
        /**
        The size (in columns) of a tab in the document, determined by
        the [`tabSize`](https://codemirror.net/6/docs/ref/#state.EditorState^tabSize) facet.
        */
        get tabSize() { return this.facet(EditorState.tabSize); }
        /**
        Get the proper [line-break](https://codemirror.net/6/docs/ref/#state.EditorState^lineSeparator)
        string for this state.
        */
        get lineBreak() { return this.facet(EditorState.lineSeparator) || "\n"; }
        /**
        Returns true when the editor is
        [configured](https://codemirror.net/6/docs/ref/#state.EditorState^readOnly) to be read-only.
        */
        get readOnly() { return this.facet(readOnly); }
        /**
        Look up a translation for the given phrase (via the
        [`phrases`](https://codemirror.net/6/docs/ref/#state.EditorState^phrases) facet), or return the
        original string if no translation is found.
        */
        phrase(phrase) {
            for (let map of this.facet(EditorState.phrases))
                if (Object.prototype.hasOwnProperty.call(map, phrase))
                    return map[phrase];
            return phrase;
        }
        /**
        Find the values for a given language data field, provided by the
        the [`languageData`](https://codemirror.net/6/docs/ref/#state.EditorState^languageData) facet.
        */
        languageDataAt(name, pos, side = -1) {
            let values = [];
            for (let provider of this.facet(languageData)) {
                for (let result of provider(this, pos, side)) {
                    if (Object.prototype.hasOwnProperty.call(result, name))
                        values.push(result[name]);
                }
            }
            return values;
        }
        /**
        Return a function that can categorize strings (expected to
        represent a single [grapheme cluster](https://codemirror.net/6/docs/ref/#text.findClusterBreak))
        into one of:
        
         - Word (contains an alphanumeric character or a character
           explicitly listed in the local language's `"wordChars"`
           language data, which should be a string)
         - Space (contains only whitespace)
         - Other (anything else)
        */
        charCategorizer(at) {
            return makeCategorizer(this.languageDataAt("wordChars", at).join(""));
        }
        /**
        Find the word at the given position, meaning the range
        containing all [word](https://codemirror.net/6/docs/ref/#state.CharCategory.Word) characters
        around it. If no word characters are adjacent to the position,
        this returns null.
        */
        wordAt(pos) {
            let { text, from, length } = this.doc.lineAt(pos);
            let cat = this.charCategorizer(pos);
            let start = pos - from, end = pos - from;
            while (start > 0) {
                let prev = findClusterBreak(text, start, false);
                if (cat(text.slice(prev, start)) != CharCategory.Word)
                    break;
                start = prev;
            }
            while (end < length) {
                let next = findClusterBreak(text, end);
                if (cat(text.slice(end, next)) != CharCategory.Word)
                    break;
                end = next;
            }
            return start == end ? null : EditorSelection.range(start + from, end + from);
        }
    }
    /**
    A facet that, when enabled, causes the editor to allow multiple
    ranges to be selected. Be careful though, because by default the
    editor relies on the native DOM selection, which cannot handle
    multiple selections. An extension like
    [`drawSelection`](https://codemirror.net/6/docs/ref/#view.drawSelection) can be used to make
    secondary selections visible to the user.
    */
    EditorState.allowMultipleSelections = allowMultipleSelections;
    /**
    Configures the tab size to use in this state. The first
    (highest-precedence) value of the facet is used. If no value is
    given, this defaults to 4.
    */
    EditorState.tabSize = /*@__PURE__*/Facet.define({
        combine: values => values.length ? values[0] : 4
    });
    /**
    The line separator to use. By default, any of `"\n"`, `"\r\n"`
    and `"\r"` is treated as a separator when splitting lines, and
    lines are joined with `"\n"`.

    When you configure a value here, only that precise separator
    will be used, allowing you to round-trip documents through the
    editor without normalizing line separators.
    */
    EditorState.lineSeparator = lineSeparator;
    /**
    This facet controls the value of the
    [`readOnly`](https://codemirror.net/6/docs/ref/#state.EditorState.readOnly) getter, which is
    consulted by commands and extensions that implement editing
    functionality to determine whether they should apply. It
    defaults to false, but when its highest-precedence value is
    `true`, such functionality disables itself.

    Not to be confused with
    [`EditorView.editable`](https://codemirror.net/6/docs/ref/#view.EditorView^editable), which
    controls whether the editor's DOM is set to be editable (and
    thus focusable).
    */
    EditorState.readOnly = readOnly;
    /**
    Registers translation phrases. The
    [`phrase`](https://codemirror.net/6/docs/ref/#state.EditorState.phrase) method will look through
    all objects registered with this facet to find translations for
    its argument.
    */
    EditorState.phrases = /*@__PURE__*/Facet.define();
    /**
    A facet used to register [language
    data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt) providers.
    */
    EditorState.languageData = languageData;
    /**
    Facet used to register change filters, which are called for each
    transaction (unless explicitly
    [disabled](https://codemirror.net/6/docs/ref/#state.TransactionSpec.filter)), and can suppress
    part of the transaction's changes.

    Such a function can return `true` to indicate that it doesn't
    want to do anything, `false` to completely stop the changes in
    the transaction, or a set of ranges in which changes should be
    suppressed. Such ranges are represented as an array of numbers,
    with each pair of two number indicating the start and end of a
    range. So for example `[10, 20, 100, 110]` suppresses changes
    between 10 and 20, and between 100 and 110.
    */
    EditorState.changeFilter = changeFilter;
    /**
    Facet used to register a hook that gets a chance to update or
    replace transaction specs before they are applied. This will
    only be applied for transactions that don't have
    [`filter`](https://codemirror.net/6/docs/ref/#state.TransactionSpec.filter) set to `false`. You
    can either return a single transaction spec (possibly the input
    transaction), or an array of specs (which will be combined in
    the same way as the arguments to
    [`EditorState.update`](https://codemirror.net/6/docs/ref/#state.EditorState.update)).

    When possible, it is recommended to avoid accessing
    [`Transaction.state`](https://codemirror.net/6/docs/ref/#state.Transaction.state) in a filter,
    since it will force creation of a state that will then be
    discarded again, if the transaction is actually filtered.

    (This functionality should be used with care. Indiscriminately
    modifying transaction is likely to break something or degrade
    the user experience.)
    */
    EditorState.transactionFilter = transactionFilter;
    /**
    This is a more limited form of
    [`transactionFilter`](https://codemirror.net/6/docs/ref/#state.EditorState^transactionFilter),
    which can only add
    [annotations](https://codemirror.net/6/docs/ref/#state.TransactionSpec.annotations) and
    [effects](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects). _But_, this type
    of filter runs even the transaction has disabled regular
    [filtering](https://codemirror.net/6/docs/ref/#state.TransactionSpec.filter), making it suitable
    for effects that don't need to touch the changes or selection,
    but do want to process every transaction.

    Extenders run _after_ filters, when both are applied.
    */
    EditorState.transactionExtender = transactionExtender;
    Compartment.reconfigure = /*@__PURE__*/StateEffect.define();

    const C = "\u037c";
    const COUNT = typeof Symbol == "undefined" ? "__" + C : Symbol.for(C);
    const SET = typeof Symbol == "undefined" ? "__styleSet" + Math.floor(Math.random() * 1e8) : Symbol("styleSet");
    const top = typeof globalThis != "undefined" ? globalThis : typeof window != "undefined" ? window : {};

    // :: - Style modules encapsulate a set of CSS rules defined from
    // JavaScript. Their definitions are only available in a given DOM
    // root after it has been _mounted_ there with `StyleModule.mount`.
    //
    // Style modules should be created once and stored somewhere, as
    // opposed to re-creating them every time you need them. The amount of
    // CSS rules generated for a given DOM root is bounded by the amount
    // of style modules that were used. So to avoid leaking rules, don't
    // create these dynamically, but treat them as one-time allocations.
    class StyleModule {
      // :: (Object<Style>, ?{finish: ?(string) → string})
      // Create a style module from the given spec.
      //
      // When `finish` is given, it is called on regular (non-`@`)
      // selectors (after `&` expansion) to compute the final selector.
      constructor(spec, options) {
        this.rules = [];
        let {finish} = options || {};

        function splitSelector(selector) {
          return /^@/.test(selector) ? [selector] : selector.split(/,\s*/)
        }

        function render(selectors, spec, target, isKeyframes) {
          let local = [], isAt = /^@(\w+)\b/.exec(selectors[0]), keyframes = isAt && isAt[1] == "keyframes";
          if (isAt && spec == null) return target.push(selectors[0] + ";")
          for (let prop in spec) {
            let value = spec[prop];
            if (/&/.test(prop)) {
              render(prop.split(/,\s*/).map(part => selectors.map(sel => part.replace(/&/, sel))).reduce((a, b) => a.concat(b)),
                     value, target);
            } else if (value && typeof value == "object") {
              if (!isAt) throw new RangeError("The value of a property (" + prop + ") should be a primitive value.")
              render(splitSelector(prop), value, local, keyframes);
            } else if (value != null) {
              local.push(prop.replace(/_.*/, "").replace(/[A-Z]/g, l => "-" + l.toLowerCase()) + ": " + value + ";");
            }
          }
          if (local.length || keyframes) {
            target.push((finish && !isAt && !isKeyframes ? selectors.map(finish) : selectors).join(", ") +
                        " {" + local.join(" ") + "}");
          }
        }

        for (let prop in spec) render(splitSelector(prop), spec[prop], this.rules);
      }

      // :: () → string
      // Returns a string containing the module's CSS rules.
      getRules() { return this.rules.join("\n") }

      // :: () → string
      // Generate a new unique CSS class name.
      static newName() {
        let id = top[COUNT] || 1;
        top[COUNT] = id + 1;
        return C + id.toString(36)
      }

      // :: (union<Document, ShadowRoot>, union<[StyleModule], StyleModule>)
      //
      // Mount the given set of modules in the given DOM root, which ensures
      // that the CSS rules defined by the module are available in that
      // context.
      //
      // Rules are only added to the document once per root.
      //
      // Rule order will follow the order of the modules, so that rules from
      // modules later in the array take precedence of those from earlier
      // modules. If you call this function multiple times for the same root
      // in a way that changes the order of already mounted modules, the old
      // order will be changed.
      static mount(root, modules) {
        (root[SET] || new StyleSet(root)).mount(Array.isArray(modules) ? modules : [modules]);
      }
    }

    let adoptedSet = null;

    class StyleSet {
      constructor(root) {
        if (!root.head && root.adoptedStyleSheets && typeof CSSStyleSheet != "undefined") {
          if (adoptedSet) {
            root.adoptedStyleSheets = [adoptedSet.sheet].concat(root.adoptedStyleSheets);
            return root[SET] = adoptedSet
          }
          this.sheet = new CSSStyleSheet;
          root.adoptedStyleSheets = [this.sheet].concat(root.adoptedStyleSheets);
          adoptedSet = this;
        } else {
          this.styleTag = (root.ownerDocument || root).createElement("style");
          let target = root.head || root;
          target.insertBefore(this.styleTag, target.firstChild);
        }
        this.modules = [];
        root[SET] = this;
      }

      mount(modules) {
        let sheet = this.sheet;
        let pos = 0 /* Current rule offset */, j = 0; /* Index into this.modules */
        for (let i = 0; i < modules.length; i++) {
          let mod = modules[i], index = this.modules.indexOf(mod);
          if (index < j && index > -1) { // Ordering conflict
            this.modules.splice(index, 1);
            j--;
            index = -1;
          }
          if (index == -1) {
            this.modules.splice(j++, 0, mod);
            if (sheet) for (let k = 0; k < mod.rules.length; k++)
              sheet.insertRule(mod.rules[k], pos++);
          } else {
            while (j < index) pos += this.modules[j++].rules.length;
            pos += mod.rules.length;
            j++;
          }
        }

        if (!sheet) {
          let text = "";
          for (let i = 0; i < this.modules.length; i++)
            text += this.modules[i].getRules() + "\n";
          this.styleTag.textContent = text;
        }
      }
    }

    // Style::Object<union<Style,string>>
    //
    // A style is an object that, in the simple case, maps CSS property
    // names to strings holding their values, as in `{color: "red",
    // fontWeight: "bold"}`. The property names can be given in
    // camel-case—the library will insert a dash before capital letters
    // when converting them to CSS.
    //
    // If you include an underscore in a property name, it and everything
    // after it will be removed from the output, which can be useful when
    // providing a property multiple times, for browser compatibility
    // reasons.
    //
    // A property in a style object can also be a sub-selector, which
    // extends the current context to add a pseudo-selector or a child
    // selector. Such a property should contain a `&` character, which
    // will be replaced by the current selector. For example `{"&:before":
    // {content: '"hi"'}}`. Sub-selectors and regular properties can
    // freely be mixed in a given object. Any property containing a `&` is
    // assumed to be a sub-selector.
    //
    // Finally, a property can specify an @-block to be wrapped around the
    // styles defined inside the object that's the property's value. For
    // example to create a media query you can do `{"@media screen and
    // (min-width: 400px)": {...}}`.

    /**
    Each range is associated with a value, which must inherit from
    this class.
    */
    class RangeValue {
        /**
        Compare this value with another value. The default
        implementation compares by identity.
        */
        eq(other) { return this == other; }
        /**
        Create a [range](https://codemirror.net/6/docs/ref/#rangeset.Range) with this value.
        */
        range(from, to = from) { return new Range(from, to, this); }
    }
    RangeValue.prototype.startSide = RangeValue.prototype.endSide = 0;
    RangeValue.prototype.point = false;
    RangeValue.prototype.mapMode = MapMode.TrackDel;
    /**
    A range associates a value with a range of positions.
    */
    class Range {
        /**
        @internal
        */
        constructor(
        /**
        The range's start position.
        */
        from, 
        /**
        Its end position.
        */
        to, 
        /**
        The value associated with this range.
        */
        value) {
            this.from = from;
            this.to = to;
            this.value = value;
        }
    }
    function cmpRange(a, b) {
        return a.from - b.from || a.value.startSide - b.value.startSide;
    }
    class Chunk {
        constructor(from, to, value, 
        // Chunks are marked with the largest point that occurs
        // in them (or -1 for no points), so that scans that are
        // only interested in points (such as the
        // heightmap-related logic) can skip range-only chunks.
        maxPoint) {
            this.from = from;
            this.to = to;
            this.value = value;
            this.maxPoint = maxPoint;
        }
        get length() { return this.to[this.to.length - 1]; }
        // Find the index of the given position and side. Use the ranges'
        // `from` pos when `end == false`, `to` when `end == true`.
        findIndex(pos, side, end, startAt = 0) {
            let arr = end ? this.to : this.from;
            for (let lo = startAt, hi = arr.length;;) {
                if (lo == hi)
                    return lo;
                let mid = (lo + hi) >> 1;
                let diff = arr[mid] - pos || (end ? this.value[mid].endSide : this.value[mid].startSide) - side;
                if (mid == lo)
                    return diff >= 0 ? lo : hi;
                if (diff >= 0)
                    hi = mid;
                else
                    lo = mid + 1;
            }
        }
        between(offset, from, to, f) {
            for (let i = this.findIndex(from, -1000000000 /* Far */, true), e = this.findIndex(to, 1000000000 /* Far */, false, i); i < e; i++)
                if (f(this.from[i] + offset, this.to[i] + offset, this.value[i]) === false)
                    return false;
        }
        map(offset, changes) {
            let value = [], from = [], to = [], newPos = -1, maxPoint = -1;
            for (let i = 0; i < this.value.length; i++) {
                let val = this.value[i], curFrom = this.from[i] + offset, curTo = this.to[i] + offset, newFrom, newTo;
                if (curFrom == curTo) {
                    let mapped = changes.mapPos(curFrom, val.startSide, val.mapMode);
                    if (mapped == null)
                        continue;
                    newFrom = newTo = mapped;
                    if (val.startSide != val.endSide) {
                        newTo = changes.mapPos(curFrom, val.endSide);
                        if (newTo < newFrom)
                            continue;
                    }
                }
                else {
                    newFrom = changes.mapPos(curFrom, val.startSide);
                    newTo = changes.mapPos(curTo, val.endSide);
                    if (newFrom > newTo || newFrom == newTo && val.startSide > 0 && val.endSide <= 0)
                        continue;
                }
                if ((newTo - newFrom || val.endSide - val.startSide) < 0)
                    continue;
                if (newPos < 0)
                    newPos = newFrom;
                if (val.point)
                    maxPoint = Math.max(maxPoint, newTo - newFrom);
                value.push(val);
                from.push(newFrom - newPos);
                to.push(newTo - newPos);
            }
            return { mapped: value.length ? new Chunk(from, to, value, maxPoint) : null, pos: newPos };
        }
    }
    /**
    A range set stores a collection of [ranges](https://codemirror.net/6/docs/ref/#rangeset.Range) in a
    way that makes them efficient to [map](https://codemirror.net/6/docs/ref/#rangeset.RangeSet.map) and
    [update](https://codemirror.net/6/docs/ref/#rangeset.RangeSet.update). This is an immutable data
    structure.
    */
    class RangeSet {
        /**
        @internal
        */
        constructor(
        /**
        @internal
        */
        chunkPos, 
        /**
        @internal
        */
        chunk, 
        /**
        @internal
        */
        nextLayer = RangeSet.empty, 
        /**
        @internal
        */
        maxPoint) {
            this.chunkPos = chunkPos;
            this.chunk = chunk;
            this.nextLayer = nextLayer;
            this.maxPoint = maxPoint;
        }
        /**
        @internal
        */
        get length() {
            let last = this.chunk.length - 1;
            return last < 0 ? 0 : Math.max(this.chunkEnd(last), this.nextLayer.length);
        }
        /**
        The number of ranges in the set.
        */
        get size() {
            if (this.isEmpty)
                return 0;
            let size = this.nextLayer.size;
            for (let chunk of this.chunk)
                size += chunk.value.length;
            return size;
        }
        /**
        @internal
        */
        chunkEnd(index) {
            return this.chunkPos[index] + this.chunk[index].length;
        }
        /**
        Update the range set, optionally adding new ranges or filtering
        out existing ones.
        
        (The extra type parameter is just there as a kludge to work
        around TypeScript variance issues that prevented `RangeSet<X>`
        from being a subtype of `RangeSet<Y>` when `X` is a subtype of
        `Y`.)
        */
        update(updateSpec) {
            let { add = [], sort = false, filterFrom = 0, filterTo = this.length } = updateSpec;
            let filter = updateSpec.filter;
            if (add.length == 0 && !filter)
                return this;
            if (sort)
                add = add.slice().sort(cmpRange);
            if (this.isEmpty)
                return add.length ? RangeSet.of(add) : this;
            let cur = new LayerCursor(this, null, -1).goto(0), i = 0, spill = [];
            let builder = new RangeSetBuilder();
            while (cur.value || i < add.length) {
                if (i < add.length && (cur.from - add[i].from || cur.startSide - add[i].value.startSide) >= 0) {
                    let range = add[i++];
                    if (!builder.addInner(range.from, range.to, range.value))
                        spill.push(range);
                }
                else if (cur.rangeIndex == 1 && cur.chunkIndex < this.chunk.length &&
                    (i == add.length || this.chunkEnd(cur.chunkIndex) < add[i].from) &&
                    (!filter || filterFrom > this.chunkEnd(cur.chunkIndex) || filterTo < this.chunkPos[cur.chunkIndex]) &&
                    builder.addChunk(this.chunkPos[cur.chunkIndex], this.chunk[cur.chunkIndex])) {
                    cur.nextChunk();
                }
                else {
                    if (!filter || filterFrom > cur.to || filterTo < cur.from || filter(cur.from, cur.to, cur.value)) {
                        if (!builder.addInner(cur.from, cur.to, cur.value))
                            spill.push(new Range(cur.from, cur.to, cur.value));
                    }
                    cur.next();
                }
            }
            return builder.finishInner(this.nextLayer.isEmpty && !spill.length ? RangeSet.empty
                : this.nextLayer.update({ add: spill, filter, filterFrom, filterTo }));
        }
        /**
        Map this range set through a set of changes, return the new set.
        */
        map(changes) {
            if (changes.empty || this.isEmpty)
                return this;
            let chunks = [], chunkPos = [], maxPoint = -1;
            for (let i = 0; i < this.chunk.length; i++) {
                let start = this.chunkPos[i], chunk = this.chunk[i];
                let touch = changes.touchesRange(start, start + chunk.length);
                if (touch === false) {
                    maxPoint = Math.max(maxPoint, chunk.maxPoint);
                    chunks.push(chunk);
                    chunkPos.push(changes.mapPos(start));
                }
                else if (touch === true) {
                    let { mapped, pos } = chunk.map(start, changes);
                    if (mapped) {
                        maxPoint = Math.max(maxPoint, mapped.maxPoint);
                        chunks.push(mapped);
                        chunkPos.push(pos);
                    }
                }
            }
            let next = this.nextLayer.map(changes);
            return chunks.length == 0 ? next : new RangeSet(chunkPos, chunks, next, maxPoint);
        }
        /**
        Iterate over the ranges that touch the region `from` to `to`,
        calling `f` for each. There is no guarantee that the ranges will
        be reported in any specific order. When the callback returns
        `false`, iteration stops.
        */
        between(from, to, f) {
            if (this.isEmpty)
                return;
            for (let i = 0; i < this.chunk.length; i++) {
                let start = this.chunkPos[i], chunk = this.chunk[i];
                if (to >= start && from <= start + chunk.length &&
                    chunk.between(start, from - start, to - start, f) === false)
                    return;
            }
            this.nextLayer.between(from, to, f);
        }
        /**
        Iterate over the ranges in this set, in order, including all
        ranges that end at or after `from`.
        */
        iter(from = 0) {
            return HeapCursor.from([this]).goto(from);
        }
        /**
        @internal
        */
        get isEmpty() { return this.nextLayer == this; }
        /**
        Iterate over the ranges in a collection of sets, in order,
        starting from `from`.
        */
        static iter(sets, from = 0) {
            return HeapCursor.from(sets).goto(from);
        }
        /**
        Iterate over two groups of sets, calling methods on `comparator`
        to notify it of possible differences.
        */
        static compare(oldSets, newSets, 
        /**
        This indicates how the underlying data changed between these
        ranges, and is needed to synchronize the iteration. `from` and
        `to` are coordinates in the _new_ space, after these changes.
        */
        textDiff, comparator, 
        /**
        Can be used to ignore all non-point ranges, and points below
        the given size. When -1, all ranges are compared.
        */
        minPointSize = -1) {
            let a = oldSets.filter(set => set.maxPoint > 0 || !set.isEmpty && set.maxPoint >= minPointSize);
            let b = newSets.filter(set => set.maxPoint > 0 || !set.isEmpty && set.maxPoint >= minPointSize);
            let sharedChunks = findSharedChunks(a, b, textDiff);
            let sideA = new SpanCursor(a, sharedChunks, minPointSize);
            let sideB = new SpanCursor(b, sharedChunks, minPointSize);
            textDiff.iterGaps((fromA, fromB, length) => compare(sideA, fromA, sideB, fromB, length, comparator));
            if (textDiff.empty && textDiff.length == 0)
                compare(sideA, 0, sideB, 0, 0, comparator);
        }
        /**
        Compare the contents of two groups of range sets, returning true
        if they are equivalent in the given range.
        */
        static eq(oldSets, newSets, from = 0, to) {
            if (to == null)
                to = 1000000000 /* Far */;
            let a = oldSets.filter(set => !set.isEmpty && newSets.indexOf(set) < 0);
            let b = newSets.filter(set => !set.isEmpty && oldSets.indexOf(set) < 0);
            if (a.length != b.length)
                return false;
            if (!a.length)
                return true;
            let sharedChunks = findSharedChunks(a, b);
            let sideA = new SpanCursor(a, sharedChunks, 0).goto(from), sideB = new SpanCursor(b, sharedChunks, 0).goto(from);
            for (;;) {
                if (sideA.to != sideB.to ||
                    !sameValues(sideA.active, sideB.active) ||
                    sideA.point && (!sideB.point || !sideA.point.eq(sideB.point)))
                    return false;
                if (sideA.to > to)
                    return true;
                sideA.next();
                sideB.next();
            }
        }
        /**
        Iterate over a group of range sets at the same time, notifying
        the iterator about the ranges covering every given piece of
        content. Returns the open count (see
        [`SpanIterator.span`](https://codemirror.net/6/docs/ref/#rangeset.SpanIterator.span)) at the end
        of the iteration.
        */
        static spans(sets, from, to, iterator, 
        /**
        When given and greater than -1, only points of at least this
        size are taken into account.
        */
        minPointSize = -1) {
            var _a;
            let cursor = new SpanCursor(sets, null, minPointSize, (_a = iterator.filterPoint) === null || _a === void 0 ? void 0 : _a.bind(iterator)).goto(from), pos = from;
            let open = cursor.openStart;
            for (;;) {
                let curTo = Math.min(cursor.to, to);
                if (cursor.point) {
                    iterator.point(pos, curTo, cursor.point, cursor.activeForPoint(cursor.to), open);
                    open = cursor.openEnd(curTo) + (cursor.to > curTo ? 1 : 0);
                }
                else if (curTo > pos) {
                    iterator.span(pos, curTo, cursor.active, open);
                    open = cursor.openEnd(curTo);
                }
                if (cursor.to > to)
                    break;
                pos = cursor.to;
                cursor.next();
            }
            return open;
        }
        /**
        Create a range set for the given range or array of ranges. By
        default, this expects the ranges to be _sorted_ (by start
        position and, if two start at the same position,
        `value.startSide`). You can pass `true` as second argument to
        cause the method to sort them.
        */
        static of(ranges, sort = false) {
            let build = new RangeSetBuilder();
            for (let range of ranges instanceof Range ? [ranges] : sort ? lazySort(ranges) : ranges)
                build.add(range.from, range.to, range.value);
            return build.finish();
        }
    }
    /**
    The empty set of ranges.
    */
    RangeSet.empty = /*@__PURE__*/new RangeSet([], [], null, -1);
    function lazySort(ranges) {
        if (ranges.length > 1)
            for (let prev = ranges[0], i = 1; i < ranges.length; i++) {
                let cur = ranges[i];
                if (cmpRange(prev, cur) > 0)
                    return ranges.slice().sort(cmpRange);
                prev = cur;
            }
        return ranges;
    }
    RangeSet.empty.nextLayer = RangeSet.empty;
    /**
    A range set builder is a data structure that helps build up a
    [range set](https://codemirror.net/6/docs/ref/#rangeset.RangeSet) directly, without first allocating
    an array of [`Range`](https://codemirror.net/6/docs/ref/#rangeset.Range) objects.
    */
    class RangeSetBuilder {
        /**
        Create an empty builder.
        */
        constructor() {
            this.chunks = [];
            this.chunkPos = [];
            this.chunkStart = -1;
            this.last = null;
            this.lastFrom = -1000000000 /* Far */;
            this.lastTo = -1000000000 /* Far */;
            this.from = [];
            this.to = [];
            this.value = [];
            this.maxPoint = -1;
            this.setMaxPoint = -1;
            this.nextLayer = null;
        }
        finishChunk(newArrays) {
            this.chunks.push(new Chunk(this.from, this.to, this.value, this.maxPoint));
            this.chunkPos.push(this.chunkStart);
            this.chunkStart = -1;
            this.setMaxPoint = Math.max(this.setMaxPoint, this.maxPoint);
            this.maxPoint = -1;
            if (newArrays) {
                this.from = [];
                this.to = [];
                this.value = [];
            }
        }
        /**
        Add a range. Ranges should be added in sorted (by `from` and
        `value.startSide`) order.
        */
        add(from, to, value) {
            if (!this.addInner(from, to, value))
                (this.nextLayer || (this.nextLayer = new RangeSetBuilder)).add(from, to, value);
        }
        /**
        @internal
        */
        addInner(from, to, value) {
            let diff = from - this.lastTo || value.startSide - this.last.endSide;
            if (diff <= 0 && (from - this.lastFrom || value.startSide - this.last.startSide) < 0)
                throw new Error("Ranges must be added sorted by `from` position and `startSide`");
            if (diff < 0)
                return false;
            if (this.from.length == 250 /* ChunkSize */)
                this.finishChunk(true);
            if (this.chunkStart < 0)
                this.chunkStart = from;
            this.from.push(from - this.chunkStart);
            this.to.push(to - this.chunkStart);
            this.last = value;
            this.lastFrom = from;
            this.lastTo = to;
            this.value.push(value);
            if (value.point)
                this.maxPoint = Math.max(this.maxPoint, to - from);
            return true;
        }
        /**
        @internal
        */
        addChunk(from, chunk) {
            if ((from - this.lastTo || chunk.value[0].startSide - this.last.endSide) < 0)
                return false;
            if (this.from.length)
                this.finishChunk(true);
            this.setMaxPoint = Math.max(this.setMaxPoint, chunk.maxPoint);
            this.chunks.push(chunk);
            this.chunkPos.push(from);
            let last = chunk.value.length - 1;
            this.last = chunk.value[last];
            this.lastFrom = chunk.from[last] + from;
            this.lastTo = chunk.to[last] + from;
            return true;
        }
        /**
        Finish the range set. Returns the new set. The builder can't be
        used anymore after this has been called.
        */
        finish() { return this.finishInner(RangeSet.empty); }
        /**
        @internal
        */
        finishInner(next) {
            if (this.from.length)
                this.finishChunk(false);
            if (this.chunks.length == 0)
                return next;
            let result = new RangeSet(this.chunkPos, this.chunks, this.nextLayer ? this.nextLayer.finishInner(next) : next, this.setMaxPoint);
            this.from = null; // Make sure further `add` calls produce errors
            return result;
        }
    }
    function findSharedChunks(a, b, textDiff) {
        let inA = new Map();
        for (let set of a)
            for (let i = 0; i < set.chunk.length; i++)
                if (set.chunk[i].maxPoint <= 0)
                    inA.set(set.chunk[i], set.chunkPos[i]);
        let shared = new Set();
        for (let set of b)
            for (let i = 0; i < set.chunk.length; i++) {
                let known = inA.get(set.chunk[i]);
                if (known != null && (textDiff ? textDiff.mapPos(known) : known) == set.chunkPos[i] &&
                    !(textDiff === null || textDiff === void 0 ? void 0 : textDiff.touchesRange(known, known + set.chunk[i].length)))
                    shared.add(set.chunk[i]);
            }
        return shared;
    }
    class LayerCursor {
        constructor(layer, skip, minPoint, rank = 0) {
            this.layer = layer;
            this.skip = skip;
            this.minPoint = minPoint;
            this.rank = rank;
        }
        get startSide() { return this.value ? this.value.startSide : 0; }
        get endSide() { return this.value ? this.value.endSide : 0; }
        goto(pos, side = -1000000000 /* Far */) {
            this.chunkIndex = this.rangeIndex = 0;
            this.gotoInner(pos, side, false);
            return this;
        }
        gotoInner(pos, side, forward) {
            while (this.chunkIndex < this.layer.chunk.length) {
                let next = this.layer.chunk[this.chunkIndex];
                if (!(this.skip && this.skip.has(next) ||
                    this.layer.chunkEnd(this.chunkIndex) < pos ||
                    next.maxPoint < this.minPoint))
                    break;
                this.chunkIndex++;
                forward = false;
            }
            if (this.chunkIndex < this.layer.chunk.length) {
                let rangeIndex = this.layer.chunk[this.chunkIndex].findIndex(pos - this.layer.chunkPos[this.chunkIndex], side, true);
                if (!forward || this.rangeIndex < rangeIndex)
                    this.setRangeIndex(rangeIndex);
            }
            this.next();
        }
        forward(pos, side) {
            if ((this.to - pos || this.endSide - side) < 0)
                this.gotoInner(pos, side, true);
        }
        next() {
            for (;;) {
                if (this.chunkIndex == this.layer.chunk.length) {
                    this.from = this.to = 1000000000 /* Far */;
                    this.value = null;
                    break;
                }
                else {
                    let chunkPos = this.layer.chunkPos[this.chunkIndex], chunk = this.layer.chunk[this.chunkIndex];
                    let from = chunkPos + chunk.from[this.rangeIndex];
                    this.from = from;
                    this.to = chunkPos + chunk.to[this.rangeIndex];
                    this.value = chunk.value[this.rangeIndex];
                    this.setRangeIndex(this.rangeIndex + 1);
                    if (this.minPoint < 0 || this.value.point && this.to - this.from >= this.minPoint)
                        break;
                }
            }
        }
        setRangeIndex(index) {
            if (index == this.layer.chunk[this.chunkIndex].value.length) {
                this.chunkIndex++;
                if (this.skip) {
                    while (this.chunkIndex < this.layer.chunk.length && this.skip.has(this.layer.chunk[this.chunkIndex]))
                        this.chunkIndex++;
                }
                this.rangeIndex = 0;
            }
            else {
                this.rangeIndex = index;
            }
        }
        nextChunk() {
            this.chunkIndex++;
            this.rangeIndex = 0;
            this.next();
        }
        compare(other) {
            return this.from - other.from || this.startSide - other.startSide || this.rank - other.rank ||
                this.to - other.to || this.endSide - other.endSide;
        }
    }
    class HeapCursor {
        constructor(heap) {
            this.heap = heap;
        }
        static from(sets, skip = null, minPoint = -1) {
            let heap = [];
            for (let i = 0; i < sets.length; i++) {
                for (let cur = sets[i]; !cur.isEmpty; cur = cur.nextLayer) {
                    if (cur.maxPoint >= minPoint)
                        heap.push(new LayerCursor(cur, skip, minPoint, i));
                }
            }
            return heap.length == 1 ? heap[0] : new HeapCursor(heap);
        }
        get startSide() { return this.value ? this.value.startSide : 0; }
        goto(pos, side = -1000000000 /* Far */) {
            for (let cur of this.heap)
                cur.goto(pos, side);
            for (let i = this.heap.length >> 1; i >= 0; i--)
                heapBubble(this.heap, i);
            this.next();
            return this;
        }
        forward(pos, side) {
            for (let cur of this.heap)
                cur.forward(pos, side);
            for (let i = this.heap.length >> 1; i >= 0; i--)
                heapBubble(this.heap, i);
            if ((this.to - pos || this.value.endSide - side) < 0)
                this.next();
        }
        next() {
            if (this.heap.length == 0) {
                this.from = this.to = 1000000000 /* Far */;
                this.value = null;
                this.rank = -1;
            }
            else {
                let top = this.heap[0];
                this.from = top.from;
                this.to = top.to;
                this.value = top.value;
                this.rank = top.rank;
                if (top.value)
                    top.next();
                heapBubble(this.heap, 0);
            }
        }
    }
    function heapBubble(heap, index) {
        for (let cur = heap[index];;) {
            let childIndex = (index << 1) + 1;
            if (childIndex >= heap.length)
                break;
            let child = heap[childIndex];
            if (childIndex + 1 < heap.length && child.compare(heap[childIndex + 1]) >= 0) {
                child = heap[childIndex + 1];
                childIndex++;
            }
            if (cur.compare(child) < 0)
                break;
            heap[childIndex] = cur;
            heap[index] = child;
            index = childIndex;
        }
    }
    class SpanCursor {
        constructor(sets, skip, minPoint, filterPoint = () => true) {
            this.minPoint = minPoint;
            this.filterPoint = filterPoint;
            this.active = [];
            this.activeTo = [];
            this.activeRank = [];
            this.minActive = -1;
            // A currently active point range, if any
            this.point = null;
            this.pointFrom = 0;
            this.pointRank = 0;
            this.to = -1000000000 /* Far */;
            this.endSide = 0;
            this.openStart = -1;
            this.cursor = HeapCursor.from(sets, skip, minPoint);
        }
        goto(pos, side = -1000000000 /* Far */) {
            this.cursor.goto(pos, side);
            this.active.length = this.activeTo.length = this.activeRank.length = 0;
            this.minActive = -1;
            this.to = pos;
            this.endSide = side;
            this.openStart = -1;
            this.next();
            return this;
        }
        forward(pos, side) {
            while (this.minActive > -1 && (this.activeTo[this.minActive] - pos || this.active[this.minActive].endSide - side) < 0)
                this.removeActive(this.minActive);
            this.cursor.forward(pos, side);
        }
        removeActive(index) {
            remove(this.active, index);
            remove(this.activeTo, index);
            remove(this.activeRank, index);
            this.minActive = findMinIndex(this.active, this.activeTo);
        }
        addActive(trackOpen) {
            let i = 0, { value, to, rank } = this.cursor;
            while (i < this.activeRank.length && this.activeRank[i] <= rank)
                i++;
            insert(this.active, i, value);
            insert(this.activeTo, i, to);
            insert(this.activeRank, i, rank);
            if (trackOpen)
                insert(trackOpen, i, this.cursor.from);
            this.minActive = findMinIndex(this.active, this.activeTo);
        }
        // After calling this, if `this.point` != null, the next range is a
        // point. Otherwise, it's a regular range, covered by `this.active`.
        next() {
            let from = this.to, wasPoint = this.point;
            this.point = null;
            let trackOpen = this.openStart < 0 ? [] : null, trackExtra = 0;
            for (;;) {
                let a = this.minActive;
                if (a > -1 && (this.activeTo[a] - this.cursor.from || this.active[a].endSide - this.cursor.startSide) < 0) {
                    if (this.activeTo[a] > from) {
                        this.to = this.activeTo[a];
                        this.endSide = this.active[a].endSide;
                        break;
                    }
                    this.removeActive(a);
                    if (trackOpen)
                        remove(trackOpen, a);
                }
                else if (!this.cursor.value) {
                    this.to = this.endSide = 1000000000 /* Far */;
                    break;
                }
                else if (this.cursor.from > from) {
                    this.to = this.cursor.from;
                    this.endSide = this.cursor.startSide;
                    break;
                }
                else {
                    let nextVal = this.cursor.value;
                    if (!nextVal.point) { // Opening a range
                        this.addActive(trackOpen);
                        this.cursor.next();
                    }
                    else if (wasPoint && this.cursor.to == this.to && this.cursor.from < this.cursor.to) {
                        // Ignore any non-empty points that end precisely at the end of the prev point
                        this.cursor.next();
                    }
                    else if (!this.filterPoint(this.cursor.from, this.cursor.to, this.cursor.value, this.cursor.rank)) {
                        this.cursor.next();
                    }
                    else { // New point
                        this.point = nextVal;
                        this.pointFrom = this.cursor.from;
                        this.pointRank = this.cursor.rank;
                        this.to = this.cursor.to;
                        this.endSide = nextVal.endSide;
                        if (this.cursor.from < from)
                            trackExtra = 1;
                        this.cursor.next();
                        this.forward(this.to, this.endSide);
                        break;
                    }
                }
            }
            if (trackOpen) {
                let openStart = 0;
                while (openStart < trackOpen.length && trackOpen[openStart] < from)
                    openStart++;
                this.openStart = openStart + trackExtra;
            }
        }
        activeForPoint(to) {
            if (!this.active.length)
                return this.active;
            let active = [];
            for (let i = this.active.length - 1; i >= 0; i--) {
                if (this.activeRank[i] < this.pointRank)
                    break;
                if (this.activeTo[i] > to || this.activeTo[i] == to && this.active[i].endSide >= this.point.endSide)
                    active.push(this.active[i]);
            }
            return active.reverse();
        }
        openEnd(to) {
            let open = 0;
            for (let i = this.activeTo.length - 1; i >= 0 && this.activeTo[i] > to; i--)
                open++;
            return open;
        }
    }
    function compare(a, startA, b, startB, length, comparator) {
        a.goto(startA);
        b.goto(startB);
        let endB = startB + length;
        let pos = startB, dPos = startB - startA;
        for (;;) {
            let diff = (a.to + dPos) - b.to || a.endSide - b.endSide;
            let end = diff < 0 ? a.to + dPos : b.to, clipEnd = Math.min(end, endB);
            if (a.point || b.point) {
                if (!(a.point && b.point && (a.point == b.point || a.point.eq(b.point)) &&
                    sameValues(a.activeForPoint(a.to + dPos), b.activeForPoint(b.to))))
                    comparator.comparePoint(pos, clipEnd, a.point, b.point);
            }
            else {
                if (clipEnd > pos && !sameValues(a.active, b.active))
                    comparator.compareRange(pos, clipEnd, a.active, b.active);
            }
            if (end > endB)
                break;
            pos = end;
            if (diff <= 0)
                a.next();
            if (diff >= 0)
                b.next();
        }
    }
    function sameValues(a, b) {
        if (a.length != b.length)
            return false;
        for (let i = 0; i < a.length; i++)
            if (a[i] != b[i] && !a[i].eq(b[i]))
                return false;
        return true;
    }
    function remove(array, index) {
        for (let i = index, e = array.length - 1; i < e; i++)
            array[i] = array[i + 1];
        array.pop();
    }
    function insert(array, index, value) {
        for (let i = array.length - 1; i >= index; i--)
            array[i + 1] = array[i];
        array[index] = value;
    }
    function findMinIndex(value, array) {
        let found = -1, foundPos = 1000000000 /* Far */;
        for (let i = 0; i < array.length; i++)
            if ((array[i] - foundPos || value[i].endSide - value[found].endSide) < 0) {
                found = i;
                foundPos = array[i];
            }
        return found;
    }

    var base = {
      8: "Backspace",
      9: "Tab",
      10: "Enter",
      12: "NumLock",
      13: "Enter",
      16: "Shift",
      17: "Control",
      18: "Alt",
      20: "CapsLock",
      27: "Escape",
      32: " ",
      33: "PageUp",
      34: "PageDown",
      35: "End",
      36: "Home",
      37: "ArrowLeft",
      38: "ArrowUp",
      39: "ArrowRight",
      40: "ArrowDown",
      44: "PrintScreen",
      45: "Insert",
      46: "Delete",
      59: ";",
      61: "=",
      91: "Meta",
      92: "Meta",
      106: "*",
      107: "+",
      108: ",",
      109: "-",
      110: ".",
      111: "/",
      144: "NumLock",
      145: "ScrollLock",
      160: "Shift",
      161: "Shift",
      162: "Control",
      163: "Control",
      164: "Alt",
      165: "Alt",
      173: "-",
      186: ";",
      187: "=",
      188: ",",
      189: "-",
      190: ".",
      191: "/",
      192: "`",
      219: "[",
      220: "\\",
      221: "]",
      222: "'",
      229: "q"
    };

    var shift = {
      48: ")",
      49: "!",
      50: "@",
      51: "#",
      52: "$",
      53: "%",
      54: "^",
      55: "&",
      56: "*",
      57: "(",
      59: ":",
      61: "+",
      173: "_",
      186: ":",
      187: "+",
      188: "<",
      189: "_",
      190: ">",
      191: "?",
      192: "~",
      219: "{",
      220: "|",
      221: "}",
      222: "\"",
      229: "Q"
    };

    var chrome$1 = typeof navigator != "undefined" && /Chrome\/(\d+)/.exec(navigator.userAgent);
    var safari$1 = typeof navigator != "undefined" && /Apple Computer/.test(navigator.vendor);
    var gecko$1 = typeof navigator != "undefined" && /Gecko\/\d+/.test(navigator.userAgent);
    var mac = typeof navigator != "undefined" && /Mac/.test(navigator.platform);
    var ie$1 = typeof navigator != "undefined" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
    var brokenModifierNames = chrome$1 && (mac || +chrome$1[1] < 57) || gecko$1 && mac;

    // Fill in the digit keys
    for (var i = 0; i < 10; i++) base[48 + i] = base[96 + i] = String(i);

    // The function keys
    for (var i = 1; i <= 24; i++) base[i + 111] = "F" + i;

    // And the alphabetic keys
    for (var i = 65; i <= 90; i++) {
      base[i] = String.fromCharCode(i + 32);
      shift[i] = String.fromCharCode(i);
    }

    // For each code that doesn't have a shift-equivalent, copy the base name
    for (var code in base) if (!shift.hasOwnProperty(code)) shift[code] = base[code];

    function keyName(event) {
      // Don't trust event.key in Chrome when there are modifiers until
      // they fix https://bugs.chromium.org/p/chromium/issues/detail?id=633838
      var ignoreKey = brokenModifierNames && (event.ctrlKey || event.altKey || event.metaKey) ||
        (safari$1 || ie$1) && event.shiftKey && event.key && event.key.length == 1;
      var name = (!ignoreKey && event.key) ||
        (event.shiftKey ? shift : base)[event.keyCode] ||
        event.key || "Unidentified";
      // Edge sometimes produces wrong names (Issue #3)
      if (name == "Esc") name = "Escape";
      if (name == "Del") name = "Delete";
      // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8860571/
      if (name == "Left") name = "ArrowLeft";
      if (name == "Up") name = "ArrowUp";
      if (name == "Right") name = "ArrowRight";
      if (name == "Down") name = "ArrowDown";
      return name
    }

    function getSelection(root) {
        let target;
        // Browsers differ on whether shadow roots have a getSelection
        // method. If it exists, use that, otherwise, call it on the
        // document.
        if (root.nodeType == 11) { // Shadow root
            target = root.getSelection ? root : root.ownerDocument;
        }
        else {
            target = root;
        }
        return target.getSelection();
    }
    function contains(dom, node) {
        return node ? dom == node || dom.contains(node.nodeType != 1 ? node.parentNode : node) : false;
    }
    function deepActiveElement() {
        let elt = document.activeElement;
        while (elt && elt.shadowRoot)
            elt = elt.shadowRoot.activeElement;
        return elt;
    }
    function hasSelection(dom, selection) {
        if (!selection.anchorNode)
            return false;
        try {
            // Firefox will raise 'permission denied' errors when accessing
            // properties of `sel.anchorNode` when it's in a generated CSS
            // element.
            return contains(dom, selection.anchorNode);
        }
        catch (_) {
            return false;
        }
    }
    function clientRectsFor(dom) {
        if (dom.nodeType == 3)
            return textRange(dom, 0, dom.nodeValue.length).getClientRects();
        else if (dom.nodeType == 1)
            return dom.getClientRects();
        else
            return [];
    }
    // Scans forward and backward through DOM positions equivalent to the
    // given one to see if the two are in the same place (i.e. after a
    // text node vs at the end of that text node)
    function isEquivalentPosition(node, off, targetNode, targetOff) {
        return targetNode ? (scanFor(node, off, targetNode, targetOff, -1) ||
            scanFor(node, off, targetNode, targetOff, 1)) : false;
    }
    function domIndex(node) {
        for (var index = 0;; index++) {
            node = node.previousSibling;
            if (!node)
                return index;
        }
    }
    function scanFor(node, off, targetNode, targetOff, dir) {
        for (;;) {
            if (node == targetNode && off == targetOff)
                return true;
            if (off == (dir < 0 ? 0 : maxOffset(node))) {
                if (node.nodeName == "DIV")
                    return false;
                let parent = node.parentNode;
                if (!parent || parent.nodeType != 1)
                    return false;
                off = domIndex(node) + (dir < 0 ? 0 : 1);
                node = parent;
            }
            else if (node.nodeType == 1) {
                node = node.childNodes[off + (dir < 0 ? -1 : 0)];
                if (node.nodeType == 1 && node.contentEditable == "false")
                    return false;
                off = dir < 0 ? maxOffset(node) : 0;
            }
            else {
                return false;
            }
        }
    }
    function maxOffset(node) {
        return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
    }
    const Rect0 = { left: 0, right: 0, top: 0, bottom: 0 };
    function flattenRect(rect, left) {
        let x = left ? rect.left : rect.right;
        return { left: x, right: x, top: rect.top, bottom: rect.bottom };
    }
    function windowRect(win) {
        return { left: 0, right: win.innerWidth,
            top: 0, bottom: win.innerHeight };
    }
    function scrollRectIntoView(dom, rect, side, x, y, xMargin, yMargin, ltr) {
        let doc = dom.ownerDocument, win = doc.defaultView;
        for (let cur = dom; cur;) {
            if (cur.nodeType == 1) { // Element
                let bounding, top = cur == doc.body;
                if (top) {
                    bounding = windowRect(win);
                }
                else {
                    if (cur.scrollHeight <= cur.clientHeight && cur.scrollWidth <= cur.clientWidth) {
                        cur = cur.parentNode;
                        continue;
                    }
                    let rect = cur.getBoundingClientRect();
                    // Make sure scrollbar width isn't included in the rectangle
                    bounding = { left: rect.left, right: rect.left + cur.clientWidth,
                        top: rect.top, bottom: rect.top + cur.clientHeight };
                }
                let moveX = 0, moveY = 0;
                if (y == "nearest") {
                    if (rect.top < bounding.top) {
                        moveY = -(bounding.top - rect.top + yMargin);
                        if (side > 0 && rect.bottom > bounding.bottom + moveY)
                            moveY = rect.bottom - bounding.bottom + moveY + yMargin;
                    }
                    else if (rect.bottom > bounding.bottom) {
                        moveY = rect.bottom - bounding.bottom + yMargin;
                        if (side < 0 && (rect.top - moveY) < bounding.top)
                            moveY = -(bounding.top + moveY - rect.top + yMargin);
                    }
                }
                else {
                    let rectHeight = rect.bottom - rect.top, boundingHeight = bounding.bottom - bounding.top;
                    let targetTop = y == "center" && rectHeight <= boundingHeight ? rect.top + rectHeight / 2 - boundingHeight / 2 :
                        y == "start" || y == "center" && side < 0 ? rect.top - yMargin :
                            rect.bottom - boundingHeight + yMargin;
                    moveY = targetTop - bounding.top;
                }
                if (x == "nearest") {
                    if (rect.left < bounding.left) {
                        moveX = -(bounding.left - rect.left + xMargin);
                        if (side > 0 && rect.right > bounding.right + moveX)
                            moveX = rect.right - bounding.right + moveX + xMargin;
                    }
                    else if (rect.right > bounding.right) {
                        moveX = rect.right - bounding.right + xMargin;
                        if (side < 0 && rect.left < bounding.left + moveX)
                            moveX = -(bounding.left + moveX - rect.left + xMargin);
                    }
                }
                else {
                    let targetLeft = x == "center" ? rect.left + (rect.right - rect.left) / 2 - (bounding.right - bounding.left) / 2 :
                        (x == "start") == ltr ? rect.left - xMargin :
                            rect.right - (bounding.right - bounding.left) + xMargin;
                    moveX = targetLeft - bounding.left;
                }
                if (moveX || moveY) {
                    if (top) {
                        win.scrollBy(moveX, moveY);
                    }
                    else {
                        if (moveY) {
                            let start = cur.scrollTop;
                            cur.scrollTop += moveY;
                            moveY = cur.scrollTop - start;
                        }
                        if (moveX) {
                            let start = cur.scrollLeft;
                            cur.scrollLeft += moveX;
                            moveX = cur.scrollLeft - start;
                        }
                        rect = { left: rect.left - moveX, top: rect.top - moveY,
                            right: rect.right - moveX, bottom: rect.bottom - moveY };
                    }
                }
                if (top)
                    break;
                cur = cur.assignedSlot || cur.parentNode;
                x = y = "nearest";
            }
            else if (cur.nodeType == 11) { // A shadow root
                cur = cur.host;
            }
            else {
                break;
            }
        }
    }
    class DOMSelectionState {
        constructor() {
            this.anchorNode = null;
            this.anchorOffset = 0;
            this.focusNode = null;
            this.focusOffset = 0;
        }
        eq(domSel) {
            return this.anchorNode == domSel.anchorNode && this.anchorOffset == domSel.anchorOffset &&
                this.focusNode == domSel.focusNode && this.focusOffset == domSel.focusOffset;
        }
        setRange(range) {
            this.set(range.anchorNode, range.anchorOffset, range.focusNode, range.focusOffset);
        }
        set(anchorNode, anchorOffset, focusNode, focusOffset) {
            this.anchorNode = anchorNode;
            this.anchorOffset = anchorOffset;
            this.focusNode = focusNode;
            this.focusOffset = focusOffset;
        }
    }
    let preventScrollSupported = null;
    // Feature-detects support for .focus({preventScroll: true}), and uses
    // a fallback kludge when not supported.
    function focusPreventScroll(dom) {
        if (dom.setActive)
            return dom.setActive(); // in IE
        if (preventScrollSupported)
            return dom.focus(preventScrollSupported);
        let stack = [];
        for (let cur = dom; cur; cur = cur.parentNode) {
            stack.push(cur, cur.scrollTop, cur.scrollLeft);
            if (cur == cur.ownerDocument)
                break;
        }
        dom.focus(preventScrollSupported == null ? {
            get preventScroll() {
                preventScrollSupported = { preventScroll: true };
                return true;
            }
        } : undefined);
        if (!preventScrollSupported) {
            preventScrollSupported = false;
            for (let i = 0; i < stack.length;) {
                let elt = stack[i++], top = stack[i++], left = stack[i++];
                if (elt.scrollTop != top)
                    elt.scrollTop = top;
                if (elt.scrollLeft != left)
                    elt.scrollLeft = left;
            }
        }
    }
    let scratchRange;
    function textRange(node, from, to = from) {
        let range = scratchRange || (scratchRange = document.createRange());
        range.setEnd(node, to);
        range.setStart(node, from);
        return range;
    }
    function dispatchKey(elt, name, code) {
        let options = { key: name, code: name, keyCode: code, which: code, cancelable: true };
        let down = new KeyboardEvent("keydown", options);
        down.synthetic = true;
        elt.dispatchEvent(down);
        let up = new KeyboardEvent("keyup", options);
        up.synthetic = true;
        elt.dispatchEvent(up);
        return down.defaultPrevented || up.defaultPrevented;
    }
    function getRoot(node) {
        while (node) {
            if (node && (node.nodeType == 9 || node.nodeType == 11 && node.host))
                return node;
            node = node.assignedSlot || node.parentNode;
        }
        return null;
    }
    function clearAttributes(node) {
        while (node.attributes.length)
            node.removeAttributeNode(node.attributes[0]);
    }

    class DOMPos {
        constructor(node, offset, precise = true) {
            this.node = node;
            this.offset = offset;
            this.precise = precise;
        }
        static before(dom, precise) { return new DOMPos(dom.parentNode, domIndex(dom), precise); }
        static after(dom, precise) { return new DOMPos(dom.parentNode, domIndex(dom) + 1, precise); }
    }
    const noChildren = [];
    class ContentView {
        constructor() {
            this.parent = null;
            this.dom = null;
            this.dirty = 2 /* Node */;
        }
        get editorView() {
            if (!this.parent)
                throw new Error("Accessing view in orphan content view");
            return this.parent.editorView;
        }
        get overrideDOMText() { return null; }
        get posAtStart() {
            return this.parent ? this.parent.posBefore(this) : 0;
        }
        get posAtEnd() {
            return this.posAtStart + this.length;
        }
        posBefore(view) {
            let pos = this.posAtStart;
            for (let child of this.children) {
                if (child == view)
                    return pos;
                pos += child.length + child.breakAfter;
            }
            throw new RangeError("Invalid child in posBefore");
        }
        posAfter(view) {
            return this.posBefore(view) + view.length;
        }
        // Will return a rectangle directly before (when side < 0), after
        // (side > 0) or directly on (when the browser supports it) the
        // given position.
        coordsAt(_pos, _side) { return null; }
        sync(track) {
            if (this.dirty & 2 /* Node */) {
                let parent = this.dom;
                let pos = parent.firstChild;
                for (let child of this.children) {
                    if (child.dirty) {
                        if (!child.dom && pos) {
                            let contentView = ContentView.get(pos);
                            if (!contentView || !contentView.parent && contentView.constructor == child.constructor)
                                child.reuseDOM(pos);
                        }
                        child.sync(track);
                        child.dirty = 0 /* Not */;
                    }
                    if (track && !track.written && track.node == parent && pos != child.dom)
                        track.written = true;
                    if (child.dom.parentNode == parent) {
                        while (pos && pos != child.dom)
                            pos = rm$1(pos);
                        pos = child.dom.nextSibling;
                    }
                    else {
                        parent.insertBefore(child.dom, pos);
                    }
                }
                if (pos && track && track.node == parent)
                    track.written = true;
                while (pos)
                    pos = rm$1(pos);
            }
            else if (this.dirty & 1 /* Child */) {
                for (let child of this.children)
                    if (child.dirty) {
                        child.sync(track);
                        child.dirty = 0 /* Not */;
                    }
            }
        }
        reuseDOM(_dom) { }
        localPosFromDOM(node, offset) {
            let after;
            if (node == this.dom) {
                after = this.dom.childNodes[offset];
            }
            else {
                let bias = maxOffset(node) == 0 ? 0 : offset == 0 ? -1 : 1;
                for (;;) {
                    let parent = node.parentNode;
                    if (parent == this.dom)
                        break;
                    if (bias == 0 && parent.firstChild != parent.lastChild) {
                        if (node == parent.firstChild)
                            bias = -1;
                        else
                            bias = 1;
                    }
                    node = parent;
                }
                if (bias < 0)
                    after = node;
                else
                    after = node.nextSibling;
            }
            if (after == this.dom.firstChild)
                return 0;
            while (after && !ContentView.get(after))
                after = after.nextSibling;
            if (!after)
                return this.length;
            for (let i = 0, pos = 0;; i++) {
                let child = this.children[i];
                if (child.dom == after)
                    return pos;
                pos += child.length + child.breakAfter;
            }
        }
        domBoundsAround(from, to, offset = 0) {
            let fromI = -1, fromStart = -1, toI = -1, toEnd = -1;
            for (let i = 0, pos = offset, prevEnd = offset; i < this.children.length; i++) {
                let child = this.children[i], end = pos + child.length;
                if (pos < from && end > to)
                    return child.domBoundsAround(from, to, pos);
                if (end >= from && fromI == -1) {
                    fromI = i;
                    fromStart = pos;
                }
                if (pos > to && child.dom.parentNode == this.dom) {
                    toI = i;
                    toEnd = prevEnd;
                    break;
                }
                prevEnd = end;
                pos = end + child.breakAfter;
            }
            return { from: fromStart, to: toEnd < 0 ? offset + this.length : toEnd,
                startDOM: (fromI ? this.children[fromI - 1].dom.nextSibling : null) || this.dom.firstChild,
                endDOM: toI < this.children.length && toI >= 0 ? this.children[toI].dom : null };
        }
        markDirty(andParent = false) {
            this.dirty |= 2 /* Node */;
            this.markParentsDirty(andParent);
        }
        markParentsDirty(childList) {
            for (let parent = this.parent; parent; parent = parent.parent) {
                if (childList)
                    parent.dirty |= 2 /* Node */;
                if (parent.dirty & 1 /* Child */)
                    return;
                parent.dirty |= 1 /* Child */;
                childList = false;
            }
        }
        setParent(parent) {
            if (this.parent != parent) {
                this.parent = parent;
                if (this.dirty)
                    this.markParentsDirty(true);
            }
        }
        setDOM(dom) {
            if (this.dom)
                this.dom.cmView = null;
            this.dom = dom;
            dom.cmView = this;
        }
        get rootView() {
            for (let v = this;;) {
                let parent = v.parent;
                if (!parent)
                    return v;
                v = parent;
            }
        }
        replaceChildren(from, to, children = noChildren) {
            this.markDirty();
            for (let i = from; i < to; i++) {
                let child = this.children[i];
                if (child.parent == this)
                    child.destroy();
            }
            this.children.splice(from, to - from, ...children);
            for (let i = 0; i < children.length; i++)
                children[i].setParent(this);
        }
        ignoreMutation(_rec) { return false; }
        ignoreEvent(_event) { return false; }
        childCursor(pos = this.length) {
            return new ChildCursor(this.children, pos, this.children.length);
        }
        childPos(pos, bias = 1) {
            return this.childCursor().findPos(pos, bias);
        }
        toString() {
            let name = this.constructor.name.replace("View", "");
            return name + (this.children.length ? "(" + this.children.join() + ")" :
                this.length ? "[" + (name == "Text" ? this.text : this.length) + "]" : "") +
                (this.breakAfter ? "#" : "");
        }
        static get(node) { return node.cmView; }
        get isEditable() { return true; }
        merge(from, to, source, hasStart, openStart, openEnd) {
            return false;
        }
        become(other) { return false; }
        // When this is a zero-length view with a side, this should return a
        // number <= 0 to indicate it is before its position, or a
        // number > 0 when after its position.
        getSide() { return 0; }
        destroy() {
            this.parent = null;
        }
    }
    ContentView.prototype.breakAfter = 0;
    // Remove a DOM node and return its next sibling.
    function rm$1(dom) {
        let next = dom.nextSibling;
        dom.parentNode.removeChild(dom);
        return next;
    }
    class ChildCursor {
        constructor(children, pos, i) {
            this.children = children;
            this.pos = pos;
            this.i = i;
            this.off = 0;
        }
        findPos(pos, bias = 1) {
            for (;;) {
                if (pos > this.pos || pos == this.pos &&
                    (bias > 0 || this.i == 0 || this.children[this.i - 1].breakAfter)) {
                    this.off = pos - this.pos;
                    return this;
                }
                let next = this.children[--this.i];
                this.pos -= next.length + next.breakAfter;
            }
        }
    }
    function replaceRange(parent, fromI, fromOff, toI, toOff, insert, breakAtStart, openStart, openEnd) {
        let { children } = parent;
        let before = children.length ? children[fromI] : null;
        let last = insert.length ? insert[insert.length - 1] : null;
        let breakAtEnd = last ? last.breakAfter : breakAtStart;
        // Change within a single child
        if (fromI == toI && before && !breakAtStart && !breakAtEnd && insert.length < 2 &&
            before.merge(fromOff, toOff, insert.length ? last : null, fromOff == 0, openStart, openEnd))
            return;
        if (toI < children.length) {
            let after = children[toI];
            // Make sure the end of the child after the update is preserved in `after`
            if (after && toOff < after.length) {
                // If we're splitting a child, separate part of it to avoid that
                // being mangled when updating the child before the update.
                if (fromI == toI) {
                    after = after.split(toOff);
                    toOff = 0;
                }
                // If the element after the replacement should be merged with
                // the last replacing element, update `content`
                if (!breakAtEnd && last && after.merge(0, toOff, last, true, 0, openEnd)) {
                    insert[insert.length - 1] = after;
                }
                else {
                    // Remove the start of the after element, if necessary, and
                    // add it to `content`.
                    if (toOff)
                        after.merge(0, toOff, null, false, 0, openEnd);
                    insert.push(after);
                }
            }
            else if (after === null || after === void 0 ? void 0 : after.breakAfter) {
                // The element at `toI` is entirely covered by this range.
                // Preserve its line break, if any.
                if (last)
                    last.breakAfter = 1;
                else
                    breakAtStart = 1;
            }
            // Since we've handled the next element from the current elements
            // now, make sure `toI` points after that.
            toI++;
        }
        if (before) {
            before.breakAfter = breakAtStart;
            if (fromOff > 0) {
                if (!breakAtStart && insert.length && before.merge(fromOff, before.length, insert[0], false, openStart, 0)) {
                    before.breakAfter = insert.shift().breakAfter;
                }
                else if (fromOff < before.length || before.children.length && before.children[before.children.length - 1].length == 0) {
                    before.merge(fromOff, before.length, null, false, openStart, 0);
                }
                fromI++;
            }
        }
        // Try to merge widgets on the boundaries of the replacement
        while (fromI < toI && insert.length) {
            if (children[toI - 1].become(insert[insert.length - 1])) {
                toI--;
                insert.pop();
                openEnd = insert.length ? 0 : openStart;
            }
            else if (children[fromI].become(insert[0])) {
                fromI++;
                insert.shift();
                openStart = insert.length ? 0 : openEnd;
            }
            else {
                break;
            }
        }
        if (!insert.length && fromI && toI < children.length && !children[fromI - 1].breakAfter &&
            children[toI].merge(0, 0, children[fromI - 1], false, openStart, openEnd))
            fromI--;
        if (fromI < toI || insert.length)
            parent.replaceChildren(fromI, toI, insert);
    }
    function mergeChildrenInto(parent, from, to, insert, openStart, openEnd) {
        let cur = parent.childCursor();
        let { i: toI, off: toOff } = cur.findPos(to, 1);
        let { i: fromI, off: fromOff } = cur.findPos(from, -1);
        let dLen = from - to;
        for (let view of insert)
            dLen += view.length;
        parent.length += dLen;
        replaceRange(parent, fromI, fromOff, toI, toOff, insert, 0, openStart, openEnd);
    }

    let nav = typeof navigator != "undefined" ? navigator : { userAgent: "", vendor: "", platform: "" };
    let doc = typeof document != "undefined" ? document : { documentElement: { style: {} } };
    const ie_edge = /*@__PURE__*//Edge\/(\d+)/.exec(nav.userAgent);
    const ie_upto10 = /*@__PURE__*//MSIE \d/.test(nav.userAgent);
    const ie_11up = /*@__PURE__*//Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(nav.userAgent);
    const ie = !!(ie_upto10 || ie_11up || ie_edge);
    const gecko = !ie && /*@__PURE__*//gecko\/(\d+)/i.test(nav.userAgent);
    const chrome = !ie && /*@__PURE__*//Chrome\/(\d+)/.exec(nav.userAgent);
    const webkit = "webkitFontSmoothing" in doc.documentElement.style;
    const safari = !ie && /*@__PURE__*//Apple Computer/.test(nav.vendor);
    const ios = safari && (/*@__PURE__*//Mobile\/\w+/.test(nav.userAgent) || nav.maxTouchPoints > 2);
    var browser = {
        mac: ios || /*@__PURE__*//Mac/.test(nav.platform),
        windows: /*@__PURE__*//Win/.test(nav.platform),
        linux: /*@__PURE__*//Linux|X11/.test(nav.platform),
        ie,
        ie_version: ie_upto10 ? doc.documentMode || 6 : ie_11up ? +ie_11up[1] : ie_edge ? +ie_edge[1] : 0,
        gecko,
        gecko_version: gecko ? +(/*@__PURE__*//Firefox\/(\d+)/.exec(nav.userAgent) || [0, 0])[1] : 0,
        chrome: !!chrome,
        chrome_version: chrome ? +chrome[1] : 0,
        ios,
        android: /*@__PURE__*//Android\b/.test(nav.userAgent),
        webkit,
        safari,
        webkit_version: webkit ? +(/*@__PURE__*//\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0,
        tabSize: doc.documentElement.style.tabSize != null ? "tab-size" : "-moz-tab-size"
    };

    const MaxJoinLen = 256;
    class TextView extends ContentView {
        constructor(text) {
            super();
            this.text = text;
        }
        get length() { return this.text.length; }
        createDOM(textDOM) {
            this.setDOM(textDOM || document.createTextNode(this.text));
        }
        sync(track) {
            if (!this.dom)
                this.createDOM();
            if (this.dom.nodeValue != this.text) {
                if (track && track.node == this.dom)
                    track.written = true;
                this.dom.nodeValue = this.text;
            }
        }
        reuseDOM(dom) {
            if (dom.nodeType == 3)
                this.createDOM(dom);
        }
        merge(from, to, source) {
            if (source && (!(source instanceof TextView) || this.length - (to - from) + source.length > MaxJoinLen))
                return false;
            this.text = this.text.slice(0, from) + (source ? source.text : "") + this.text.slice(to);
            this.markDirty();
            return true;
        }
        split(from) {
            let result = new TextView(this.text.slice(from));
            this.text = this.text.slice(0, from);
            this.markDirty();
            return result;
        }
        localPosFromDOM(node, offset) {
            return node == this.dom ? offset : offset ? this.text.length : 0;
        }
        domAtPos(pos) { return new DOMPos(this.dom, pos); }
        domBoundsAround(_from, _to, offset) {
            return { from: offset, to: offset + this.length, startDOM: this.dom, endDOM: this.dom.nextSibling };
        }
        coordsAt(pos, side) {
            return textCoords(this.dom, pos, side);
        }
    }
    class MarkView extends ContentView {
        constructor(mark, children = [], length = 0) {
            super();
            this.mark = mark;
            this.children = children;
            this.length = length;
            for (let ch of children)
                ch.setParent(this);
        }
        setAttrs(dom) {
            clearAttributes(dom);
            if (this.mark.class)
                dom.className = this.mark.class;
            if (this.mark.attrs)
                for (let name in this.mark.attrs)
                    dom.setAttribute(name, this.mark.attrs[name]);
            return dom;
        }
        reuseDOM(node) {
            if (node.nodeName == this.mark.tagName.toUpperCase()) {
                this.setDOM(node);
                this.dirty |= 4 /* Attrs */ | 2 /* Node */;
            }
        }
        sync(track) {
            if (!this.dom)
                this.setDOM(this.setAttrs(document.createElement(this.mark.tagName)));
            else if (this.dirty & 4 /* Attrs */)
                this.setAttrs(this.dom);
            super.sync(track);
        }
        merge(from, to, source, _hasStart, openStart, openEnd) {
            if (source && (!(source instanceof MarkView && source.mark.eq(this.mark)) ||
                (from && openStart <= 0) || (to < this.length && openEnd <= 0)))
                return false;
            mergeChildrenInto(this, from, to, source ? source.children : [], openStart - 1, openEnd - 1);
            this.markDirty();
            return true;
        }
        split(from) {
            let result = [], off = 0, detachFrom = -1, i = 0;
            for (let elt of this.children) {
                let end = off + elt.length;
                if (end > from)
                    result.push(off < from ? elt.split(from - off) : elt);
                if (detachFrom < 0 && off >= from)
                    detachFrom = i;
                off = end;
                i++;
            }
            let length = this.length - from;
            this.length = from;
            if (detachFrom > -1) {
                this.children.length = detachFrom;
                this.markDirty();
            }
            return new MarkView(this.mark, result, length);
        }
        domAtPos(pos) {
            return inlineDOMAtPos(this.dom, this.children, pos);
        }
        coordsAt(pos, side) {
            return coordsInChildren(this, pos, side);
        }
    }
    function textCoords(text, pos, side) {
        let length = text.nodeValue.length;
        if (pos > length)
            pos = length;
        let from = pos, to = pos, flatten = 0;
        if (pos == 0 && side < 0 || pos == length && side >= 0) {
            if (!(browser.chrome || browser.gecko)) { // These browsers reliably return valid rectangles for empty ranges
                if (pos) {
                    from--;
                    flatten = 1;
                } // FIXME this is wrong in RTL text
                else {
                    to++;
                    flatten = -1;
                }
            }
        }
        else {
            if (side < 0)
                from--;
            else
                to++;
        }
        let rects = textRange(text, from, to).getClientRects();
        if (!rects.length)
            return Rect0;
        let rect = rects[(flatten ? flatten < 0 : side >= 0) ? 0 : rects.length - 1];
        if (browser.safari && !flatten && rect.width == 0)
            rect = Array.prototype.find.call(rects, r => r.width) || rect;
        return flatten ? flattenRect(rect, flatten < 0) : rect || null;
    }
    // Also used for collapsed ranges that don't have a placeholder widget!
    class WidgetView extends ContentView {
        constructor(widget, length, side) {
            super();
            this.widget = widget;
            this.length = length;
            this.side = side;
            this.prevWidget = null;
        }
        static create(widget, length, side) {
            return new (widget.customView || WidgetView)(widget, length, side);
        }
        split(from) {
            let result = WidgetView.create(this.widget, this.length - from, this.side);
            this.length -= from;
            return result;
        }
        sync() {
            if (!this.dom || !this.widget.updateDOM(this.dom)) {
                if (this.dom && this.prevWidget)
                    this.prevWidget.destroy(this.dom);
                this.prevWidget = null;
                this.setDOM(this.widget.toDOM(this.editorView));
                this.dom.contentEditable = "false";
            }
        }
        getSide() { return this.side; }
        merge(from, to, source, hasStart, openStart, openEnd) {
            if (source && (!(source instanceof WidgetView) || !this.widget.compare(source.widget) ||
                from > 0 && openStart <= 0 || to < this.length && openEnd <= 0))
                return false;
            this.length = from + (source ? source.length : 0) + (this.length - to);
            return true;
        }
        become(other) {
            if (other.length == this.length && other instanceof WidgetView && other.side == this.side) {
                if (this.widget.constructor == other.widget.constructor) {
                    if (!this.widget.eq(other.widget))
                        this.markDirty(true);
                    if (this.dom && !this.prevWidget)
                        this.prevWidget = this.widget;
                    this.widget = other.widget;
                    return true;
                }
            }
            return false;
        }
        ignoreMutation() { return true; }
        ignoreEvent(event) { return this.widget.ignoreEvent(event); }
        get overrideDOMText() {
            if (this.length == 0)
                return Text.empty;
            let top = this;
            while (top.parent)
                top = top.parent;
            let view = top.editorView, text = view && view.state.doc, start = this.posAtStart;
            return text ? text.slice(start, start + this.length) : Text.empty;
        }
        domAtPos(pos) {
            return pos == 0 ? DOMPos.before(this.dom) : DOMPos.after(this.dom, pos == this.length);
        }
        domBoundsAround() { return null; }
        coordsAt(pos, side) {
            let rects = this.dom.getClientRects(), rect = null;
            if (!rects.length)
                return Rect0;
            for (let i = pos > 0 ? rects.length - 1 : 0;; i += (pos > 0 ? -1 : 1)) {
                rect = rects[i];
                if (pos > 0 ? i == 0 : i == rects.length - 1 || rect.top < rect.bottom)
                    break;
            }
            return (pos == 0 && side > 0 || pos == this.length && side <= 0) ? rect : flattenRect(rect, pos == 0);
        }
        get isEditable() { return false; }
        destroy() {
            super.destroy();
            if (this.dom)
                this.widget.destroy(this.dom);
        }
    }
    class CompositionView extends WidgetView {
        domAtPos(pos) {
            let { topView, text } = this.widget;
            if (!topView)
                return new DOMPos(text, Math.min(pos, text.nodeValue.length));
            return scanCompositionTree(pos, 0, topView, text, (v, p) => v.domAtPos(p), p => new DOMPos(text, Math.min(p, text.nodeValue.length)));
        }
        sync() { this.setDOM(this.widget.toDOM()); }
        localPosFromDOM(node, offset) {
            let { topView, text } = this.widget;
            if (!topView)
                return Math.min(offset, this.length);
            return posFromDOMInCompositionTree(node, offset, topView, text);
        }
        ignoreMutation() { return false; }
        get overrideDOMText() { return null; }
        coordsAt(pos, side) {
            let { topView, text } = this.widget;
            if (!topView)
                return textCoords(text, pos, side);
            return scanCompositionTree(pos, side, topView, text, (v, pos, side) => v.coordsAt(pos, side), (pos, side) => textCoords(text, pos, side));
        }
        destroy() {
            var _a;
            super.destroy();
            (_a = this.widget.topView) === null || _a === void 0 ? void 0 : _a.destroy();
        }
        get isEditable() { return true; }
    }
    // Uses the old structure of a chunk of content view frozen for
    // composition to try and find a reasonable DOM location for the given
    // offset.
    function scanCompositionTree(pos, side, view, text, enterView, fromText) {
        if (view instanceof MarkView) {
            for (let child of view.children) {
                let hasComp = contains(child.dom, text);
                let len = hasComp ? text.nodeValue.length : child.length;
                if (pos < len || pos == len && child.getSide() <= 0)
                    return hasComp ? scanCompositionTree(pos, side, child, text, enterView, fromText) : enterView(child, pos, side);
                pos -= len;
            }
            return enterView(view, view.length, -1);
        }
        else if (view.dom == text) {
            return fromText(pos, side);
        }
        else {
            return enterView(view, pos, side);
        }
    }
    function posFromDOMInCompositionTree(node, offset, view, text) {
        if (view instanceof MarkView) {
            for (let child of view.children) {
                let pos = 0, hasComp = contains(child.dom, text);
                if (contains(child.dom, node))
                    return pos + (hasComp ? posFromDOMInCompositionTree(node, offset, child, text) : child.localPosFromDOM(node, offset));
                pos += hasComp ? text.nodeValue.length : child.length;
            }
        }
        else if (view.dom == text) {
            return Math.min(offset, text.nodeValue.length);
        }
        return view.localPosFromDOM(node, offset);
    }
    // These are drawn around uneditable widgets to avoid a number of
    // browser bugs that show up when the cursor is directly next to
    // uneditable inline content.
    class WidgetBufferView extends ContentView {
        constructor(side) {
            super();
            this.side = side;
        }
        get length() { return 0; }
        merge() { return false; }
        become(other) {
            return other instanceof WidgetBufferView && other.side == this.side;
        }
        split() { return new WidgetBufferView(this.side); }
        sync() {
            if (!this.dom) {
                let dom = document.createElement("img");
                dom.className = "cm-widgetBuffer";
                dom.setAttribute("aria-hidden", "true");
                this.setDOM(dom);
            }
        }
        getSide() { return this.side; }
        domAtPos(pos) { return DOMPos.before(this.dom); }
        localPosFromDOM() { return 0; }
        domBoundsAround() { return null; }
        coordsAt(pos) {
            let imgRect = this.dom.getBoundingClientRect();
            // Since the <img> height doesn't correspond to text height, try
            // to borrow the height from some sibling node.
            let siblingRect = inlineSiblingRect(this, this.side > 0 ? -1 : 1);
            return siblingRect && siblingRect.top < imgRect.bottom && siblingRect.bottom > imgRect.top
                ? { left: imgRect.left, right: imgRect.right, top: siblingRect.top, bottom: siblingRect.bottom } : imgRect;
        }
        get overrideDOMText() {
            return Text.empty;
        }
    }
    TextView.prototype.children = WidgetView.prototype.children = WidgetBufferView.prototype.children = noChildren;
    function inlineSiblingRect(view, side) {
        let parent = view.parent, index = parent ? parent.children.indexOf(view) : -1;
        while (parent && index >= 0) {
            if (side < 0 ? index > 0 : index < parent.children.length) {
                let next = parent.children[index + side];
                if (next instanceof TextView) {
                    let nextRect = next.coordsAt(side < 0 ? next.length : 0, side);
                    if (nextRect)
                        return nextRect;
                }
                index += side;
            }
            else if (parent instanceof MarkView && parent.parent) {
                index = parent.parent.children.indexOf(parent) + (side < 0 ? 0 : 1);
                parent = parent.parent;
            }
            else {
                let last = parent.dom.lastChild;
                if (last && last.nodeName == "BR")
                    return last.getClientRects()[0];
                break;
            }
        }
        return undefined;
    }
    function inlineDOMAtPos(dom, children, pos) {
        let i = 0;
        for (let off = 0; i < children.length; i++) {
            let child = children[i], end = off + child.length;
            if (end == off && child.getSide() <= 0)
                continue;
            if (pos > off && pos < end && child.dom.parentNode == dom)
                return child.domAtPos(pos - off);
            if (pos <= off)
                break;
            off = end;
        }
        for (; i > 0; i--) {
            let before = children[i - 1].dom;
            if (before.parentNode == dom)
                return DOMPos.after(before);
        }
        return new DOMPos(dom, 0);
    }
    // Assumes `view`, if a mark view, has precisely 1 child.
    function joinInlineInto(parent, view, open) {
        let last, { children } = parent;
        if (open > 0 && view instanceof MarkView && children.length &&
            (last = children[children.length - 1]) instanceof MarkView && last.mark.eq(view.mark)) {
            joinInlineInto(last, view.children[0], open - 1);
        }
        else {
            children.push(view);
            view.setParent(parent);
        }
        parent.length += view.length;
    }
    function coordsInChildren(view, pos, side) {
        for (let off = 0, i = 0; i < view.children.length; i++) {
            let child = view.children[i], end = off + child.length, next;
            if ((side <= 0 || end == view.length || child.getSide() > 0 ? end >= pos : end > pos) &&
                (pos < end || i + 1 == view.children.length || (next = view.children[i + 1]).length || next.getSide() > 0)) {
                let flatten = 0;
                if (end == off) {
                    if (child.getSide() <= 0)
                        continue;
                    flatten = side = -child.getSide();
                }
                let rect = child.coordsAt(Math.max(0, pos - off), side);
                return flatten && rect ? flattenRect(rect, side < 0) : rect;
            }
            off = end;
        }
        let last = view.dom.lastChild;
        if (!last)
            return view.dom.getBoundingClientRect();
        let rects = clientRectsFor(last);
        return rects[rects.length - 1] || null;
    }

    function combineAttrs(source, target) {
        for (let name in source) {
            if (name == "class" && target.class)
                target.class += " " + source.class;
            else if (name == "style" && target.style)
                target.style += ";" + source.style;
            else
                target[name] = source[name];
        }
        return target;
    }
    function attrsEq(a, b) {
        if (a == b)
            return true;
        if (!a || !b)
            return false;
        let keysA = Object.keys(a), keysB = Object.keys(b);
        if (keysA.length != keysB.length)
            return false;
        for (let key of keysA) {
            if (keysB.indexOf(key) == -1 || a[key] !== b[key])
                return false;
        }
        return true;
    }
    function updateAttrs(dom, prev, attrs) {
        if (prev)
            for (let name in prev)
                if (!(attrs && name in attrs))
                    dom.removeAttribute(name);
        if (attrs)
            for (let name in attrs)
                if (!(prev && prev[name] == attrs[name]))
                    dom.setAttribute(name, attrs[name]);
    }

    /**
    Widgets added to the content are described by subclasses of this
    class. Using a description object like that makes it possible to
    delay creating of the DOM structure for a widget until it is
    needed, and to avoid redrawing widgets even when the decorations
    that define them are recreated.
    */
    class WidgetType {
        /**
        Compare this instance to another instance of the same type.
        (TypeScript can't express this, but only instances of the same
        specific class will be passed to this method.) This is used to
        avoid redrawing widgets when they are replaced by a new
        decoration of the same type. The default implementation just
        returns `false`, which will cause new instances of the widget to
        always be redrawn.
        */
        eq(_widget) { return false; }
        /**
        Update a DOM element created by a widget of the same type (but
        different, non-`eq` content) to reflect this widget. May return
        true to indicate that it could update, false to indicate it
        couldn't (in which case the widget will be redrawn). The default
        implementation just returns false.
        */
        updateDOM(_dom) { return false; }
        /**
        @internal
        */
        compare(other) {
            return this == other || this.constructor == other.constructor && this.eq(other);
        }
        /**
        The estimated height this widget will have, to be used when
        estimating the height of content that hasn't been drawn. May
        return -1 to indicate you don't know. The default implementation
        returns -1.
        */
        get estimatedHeight() { return -1; }
        /**
        Can be used to configure which kinds of events inside the widget
        should be ignored by the editor. The default is to ignore all
        events.
        */
        ignoreEvent(_event) { return true; }
        /**
        @internal
        */
        get customView() { return null; }
        /**
        This is called when the an instance of the widget is removed
        from the editor view.
        */
        destroy(_dom) { }
    }
    /**
    The different types of blocks that can occur in an editor view.
    */
    var BlockType = /*@__PURE__*/(function (BlockType) {
        /**
        A line of text.
        */
        BlockType[BlockType["Text"] = 0] = "Text";
        /**
        A block widget associated with the position after it.
        */
        BlockType[BlockType["WidgetBefore"] = 1] = "WidgetBefore";
        /**
        A block widget associated with the position before it.
        */
        BlockType[BlockType["WidgetAfter"] = 2] = "WidgetAfter";
        /**
        A block widget [replacing](https://codemirror.net/6/docs/ref/#view.Decoration^replace) a range of content.
        */
        BlockType[BlockType["WidgetRange"] = 3] = "WidgetRange";
    return BlockType})(BlockType || (BlockType = {}));
    /**
    A decoration provides information on how to draw or style a piece
    of content. You'll usually use it wrapped in a
    [`Range`](https://codemirror.net/6/docs/ref/#rangeset.Range), which adds a start and end position.
    */
    class Decoration extends RangeValue {
        /**
        @internal
        */
        constructor(
        /**
        @internal
        */
        startSide, 
        /**
        @internal
        */
        endSide, 
        /**
        @internal
        */
        widget, 
        /**
        The config object used to create this decoration. You can
        include additional properties in there to store metadata about
        your decoration.
        */
        spec) {
            super();
            this.startSide = startSide;
            this.endSide = endSide;
            this.widget = widget;
            this.spec = spec;
        }
        /**
        @internal
        */
        get heightRelevant() { return false; }
        /**
        Create a mark decoration, which influences the styling of the
        content in its range. Nested mark decorations will cause nested
        DOM elements to be created. Nesting order is determined by
        precedence of the [facet](https://codemirror.net/6/docs/ref/#view.EditorView^decorations) or
        (below the facet-provided decorations) [view
        plugin](https://codemirror.net/6/docs/ref/#view.PluginSpec.decorations). Such elements are split
        on line boundaries and on the boundaries of higher-precedence
        decorations.
        */
        static mark(spec) {
            return new MarkDecoration(spec);
        }
        /**
        Create a widget decoration, which adds an element at the given
        position.
        */
        static widget(spec) {
            let side = spec.side || 0, block = !!spec.block;
            side += block ? (side > 0 ? 300000000 /* BlockAfter */ : -400000000 /* BlockBefore */) : (side > 0 ? 100000000 /* InlineAfter */ : -100000000 /* InlineBefore */);
            return new PointDecoration(spec, side, side, block, spec.widget || null, false);
        }
        /**
        Create a replace decoration which replaces the given range with
        a widget, or simply hides it.
        */
        static replace(spec) {
            let block = !!spec.block, startSide, endSide;
            if (spec.isBlockGap) {
                startSide = -500000000 /* GapStart */;
                endSide = 400000000 /* GapEnd */;
            }
            else {
                let { start, end } = getInclusive(spec, block);
                startSide = (start ? (block ? -300000000 /* BlockIncStart */ : -1 /* InlineIncStart */) : 500000000 /* NonIncStart */) - 1;
                endSide = (end ? (block ? 200000000 /* BlockIncEnd */ : 1 /* InlineIncEnd */) : -600000000 /* NonIncEnd */) + 1;
            }
            return new PointDecoration(spec, startSide, endSide, block, spec.widget || null, true);
        }
        /**
        Create a line decoration, which can add DOM attributes to the
        line starting at the given position.
        */
        static line(spec) {
            return new LineDecoration(spec);
        }
        /**
        Build a [`DecorationSet`](https://codemirror.net/6/docs/ref/#view.DecorationSet) from the given
        decorated range or ranges. If the ranges aren't already sorted,
        pass `true` for `sort` to make the library sort them for you.
        */
        static set(of, sort = false) {
            return RangeSet.of(of, sort);
        }
        /**
        @internal
        */
        hasHeight() { return this.widget ? this.widget.estimatedHeight > -1 : false; }
    }
    /**
    The empty set of decorations.
    */
    Decoration.none = RangeSet.empty;
    class MarkDecoration extends Decoration {
        constructor(spec) {
            let { start, end } = getInclusive(spec);
            super(start ? -1 /* InlineIncStart */ : 500000000 /* NonIncStart */, end ? 1 /* InlineIncEnd */ : -600000000 /* NonIncEnd */, null, spec);
            this.tagName = spec.tagName || "span";
            this.class = spec.class || "";
            this.attrs = spec.attributes || null;
        }
        eq(other) {
            return this == other ||
                other instanceof MarkDecoration &&
                    this.tagName == other.tagName &&
                    this.class == other.class &&
                    attrsEq(this.attrs, other.attrs);
        }
        range(from, to = from) {
            if (from >= to)
                throw new RangeError("Mark decorations may not be empty");
            return super.range(from, to);
        }
    }
    MarkDecoration.prototype.point = false;
    class LineDecoration extends Decoration {
        constructor(spec) {
            super(-200000000 /* Line */, -200000000 /* Line */, null, spec);
        }
        eq(other) {
            return other instanceof LineDecoration && attrsEq(this.spec.attributes, other.spec.attributes);
        }
        range(from, to = from) {
            if (to != from)
                throw new RangeError("Line decoration ranges must be zero-length");
            return super.range(from, to);
        }
    }
    LineDecoration.prototype.mapMode = MapMode.TrackBefore;
    LineDecoration.prototype.point = true;
    class PointDecoration extends Decoration {
        constructor(spec, startSide, endSide, block, widget, isReplace) {
            super(startSide, endSide, widget, spec);
            this.block = block;
            this.isReplace = isReplace;
            this.mapMode = !block ? MapMode.TrackDel : startSide <= 0 ? MapMode.TrackBefore : MapMode.TrackAfter;
        }
        // Only relevant when this.block == true
        get type() {
            return this.startSide < this.endSide ? BlockType.WidgetRange
                : this.startSide <= 0 ? BlockType.WidgetBefore : BlockType.WidgetAfter;
        }
        get heightRelevant() { return this.block || !!this.widget && this.widget.estimatedHeight >= 5; }
        eq(other) {
            return other instanceof PointDecoration &&
                widgetsEq(this.widget, other.widget) &&
                this.block == other.block &&
                this.startSide == other.startSide && this.endSide == other.endSide;
        }
        range(from, to = from) {
            if (this.isReplace && (from > to || (from == to && this.startSide > 0 && this.endSide <= 0)))
                throw new RangeError("Invalid range for replacement decoration");
            if (!this.isReplace && to != from)
                throw new RangeError("Widget decorations can only have zero-length ranges");
            return super.range(from, to);
        }
    }
    PointDecoration.prototype.point = true;
    function getInclusive(spec, block = false) {
        let { inclusiveStart: start, inclusiveEnd: end } = spec;
        if (start == null)
            start = spec.inclusive;
        if (end == null)
            end = spec.inclusive;
        return { start: start !== null && start !== void 0 ? start : block, end: end !== null && end !== void 0 ? end : block };
    }
    function widgetsEq(a, b) {
        return a == b || !!(a && b && a.compare(b));
    }
    function addRange(from, to, ranges, margin = 0) {
        let last = ranges.length - 1;
        if (last >= 0 && ranges[last] + margin >= from)
            ranges[last] = Math.max(ranges[last], to);
        else
            ranges.push(from, to);
    }

    class LineView extends ContentView {
        constructor() {
            super(...arguments);
            this.children = [];
            this.length = 0;
            this.prevAttrs = undefined;
            this.attrs = null;
            this.breakAfter = 0;
        }
        // Consumes source
        merge(from, to, source, hasStart, openStart, openEnd) {
            if (source) {
                if (!(source instanceof LineView))
                    return false;
                if (!this.dom)
                    source.transferDOM(this); // Reuse source.dom when appropriate
            }
            if (hasStart)
                this.setDeco(source ? source.attrs : null);
            mergeChildrenInto(this, from, to, source ? source.children : [], openStart, openEnd);
            return true;
        }
        split(at) {
            let end = new LineView;
            end.breakAfter = this.breakAfter;
            if (this.length == 0)
                return end;
            let { i, off } = this.childPos(at);
            if (off) {
                end.append(this.children[i].split(off), 0);
                this.children[i].merge(off, this.children[i].length, null, false, 0, 0);
                i++;
            }
            for (let j = i; j < this.children.length; j++)
                end.append(this.children[j], 0);
            while (i > 0 && this.children[i - 1].length == 0)
                this.children[--i].destroy();
            this.children.length = i;
            this.markDirty();
            this.length = at;
            return end;
        }
        transferDOM(other) {
            if (!this.dom)
                return;
            other.setDOM(this.dom);
            other.prevAttrs = this.prevAttrs === undefined ? this.attrs : this.prevAttrs;
            this.prevAttrs = undefined;
            this.dom = null;
        }
        setDeco(attrs) {
            if (!attrsEq(this.attrs, attrs)) {
                if (this.dom) {
                    this.prevAttrs = this.attrs;
                    this.markDirty();
                }
                this.attrs = attrs;
            }
        }
        append(child, openStart) {
            joinInlineInto(this, child, openStart);
        }
        // Only called when building a line view in ContentBuilder
        addLineDeco(deco) {
            let attrs = deco.spec.attributes, cls = deco.spec.class;
            if (attrs)
                this.attrs = combineAttrs(attrs, this.attrs || {});
            if (cls)
                this.attrs = combineAttrs({ class: cls }, this.attrs || {});
        }
        domAtPos(pos) {
            return inlineDOMAtPos(this.dom, this.children, pos);
        }
        reuseDOM(node) {
            if (node.nodeName == "DIV") {
                this.setDOM(node);
                this.dirty |= 4 /* Attrs */ | 2 /* Node */;
            }
        }
        sync(track) {
            var _a;
            if (!this.dom) {
                this.setDOM(document.createElement("div"));
                this.dom.className = "cm-line";
                this.prevAttrs = this.attrs ? null : undefined;
            }
            else if (this.dirty & 4 /* Attrs */) {
                clearAttributes(this.dom);
                this.dom.className = "cm-line";
                this.prevAttrs = this.attrs ? null : undefined;
            }
            if (this.prevAttrs !== undefined) {
                updateAttrs(this.dom, this.prevAttrs, this.attrs);
                this.dom.classList.add("cm-line");
                this.prevAttrs = undefined;
            }
            super.sync(track);
            let last = this.dom.lastChild;
            while (last && ContentView.get(last) instanceof MarkView)
                last = last.lastChild;
            if (!last || !this.length ||
                last.nodeName != "BR" && ((_a = ContentView.get(last)) === null || _a === void 0 ? void 0 : _a.isEditable) == false &&
                    (!browser.ios || !this.children.some(ch => ch instanceof TextView))) {
                let hack = document.createElement("BR");
                hack.cmIgnore = true;
                this.dom.appendChild(hack);
            }
        }
        measureTextSize() {
            if (this.children.length == 0 || this.length > 20)
                return null;
            let totalWidth = 0;
            for (let child of this.children) {
                if (!(child instanceof TextView))
                    return null;
                let rects = clientRectsFor(child.dom);
                if (rects.length != 1)
                    return null;
                totalWidth += rects[0].width;
            }
            return { lineHeight: this.dom.getBoundingClientRect().height,
                charWidth: totalWidth / this.length };
        }
        coordsAt(pos, side) {
            return coordsInChildren(this, pos, side);
        }
        become(_other) { return false; }
        get type() { return BlockType.Text; }
        static find(docView, pos) {
            for (let i = 0, off = 0; i < docView.children.length; i++) {
                let block = docView.children[i], end = off + block.length;
                if (end >= pos) {
                    if (block instanceof LineView)
                        return block;
                    if (end > pos)
                        break;
                }
                off = end + block.breakAfter;
            }
            return null;
        }
    }
    class BlockWidgetView extends ContentView {
        constructor(widget, length, type) {
            super();
            this.widget = widget;
            this.length = length;
            this.type = type;
            this.breakAfter = 0;
            this.prevWidget = null;
        }
        merge(from, to, source, _takeDeco, openStart, openEnd) {
            if (source && (!(source instanceof BlockWidgetView) || !this.widget.compare(source.widget) ||
                from > 0 && openStart <= 0 || to < this.length && openEnd <= 0))
                return false;
            this.length = from + (source ? source.length : 0) + (this.length - to);
            return true;
        }
        domAtPos(pos) {
            return pos == 0 ? DOMPos.before(this.dom) : DOMPos.after(this.dom, pos == this.length);
        }
        split(at) {
            let len = this.length - at;
            this.length = at;
            let end = new BlockWidgetView(this.widget, len, this.type);
            end.breakAfter = this.breakAfter;
            return end;
        }
        get children() { return noChildren; }
        sync() {
            if (!this.dom || !this.widget.updateDOM(this.dom)) {
                if (this.dom && this.prevWidget)
                    this.prevWidget.destroy(this.dom);
                this.prevWidget = null;
                this.setDOM(this.widget.toDOM(this.editorView));
                this.dom.contentEditable = "false";
            }
        }
        get overrideDOMText() {
            return this.parent ? this.parent.view.state.doc.slice(this.posAtStart, this.posAtEnd) : Text.empty;
        }
        domBoundsAround() { return null; }
        become(other) {
            if (other instanceof BlockWidgetView && other.type == this.type &&
                other.widget.constructor == this.widget.constructor) {
                if (!other.widget.eq(this.widget))
                    this.markDirty(true);
                if (this.dom && !this.prevWidget)
                    this.prevWidget = this.widget;
                this.widget = other.widget;
                this.length = other.length;
                this.breakAfter = other.breakAfter;
                return true;
            }
            return false;
        }
        ignoreMutation() { return true; }
        ignoreEvent(event) { return this.widget.ignoreEvent(event); }
        destroy() {
            super.destroy();
            if (this.dom)
                this.widget.destroy(this.dom);
        }
    }

    class ContentBuilder {
        constructor(doc, pos, end, disallowBlockEffectsBelow) {
            this.doc = doc;
            this.pos = pos;
            this.end = end;
            this.disallowBlockEffectsBelow = disallowBlockEffectsBelow;
            this.content = [];
            this.curLine = null;
            this.breakAtStart = 0;
            this.pendingBuffer = 0 /* No */;
            // Set to false directly after a widget that covers the position after it
            this.atCursorPos = true;
            this.openStart = -1;
            this.openEnd = -1;
            this.text = "";
            this.textOff = 0;
            this.cursor = doc.iter();
            this.skip = pos;
        }
        posCovered() {
            if (this.content.length == 0)
                return !this.breakAtStart && this.doc.lineAt(this.pos).from != this.pos;
            let last = this.content[this.content.length - 1];
            return !last.breakAfter && !(last instanceof BlockWidgetView && last.type == BlockType.WidgetBefore);
        }
        getLine() {
            if (!this.curLine) {
                this.content.push(this.curLine = new LineView);
                this.atCursorPos = true;
            }
            return this.curLine;
        }
        flushBuffer(active) {
            if (this.pendingBuffer) {
                this.curLine.append(wrapMarks(new WidgetBufferView(-1), active), active.length);
                this.pendingBuffer = 0 /* No */;
            }
        }
        addBlockWidget(view) {
            this.flushBuffer([]);
            this.curLine = null;
            this.content.push(view);
        }
        finish(openEnd) {
            if (!openEnd)
                this.flushBuffer([]);
            else
                this.pendingBuffer = 0 /* No */;
            if (!this.posCovered())
                this.getLine();
        }
        buildText(length, active, openStart) {
            while (length > 0) {
                if (this.textOff == this.text.length) {
                    let { value, lineBreak, done } = this.cursor.next(this.skip);
                    this.skip = 0;
                    if (done)
                        throw new Error("Ran out of text content when drawing inline views");
                    if (lineBreak) {
                        if (!this.posCovered())
                            this.getLine();
                        if (this.content.length)
                            this.content[this.content.length - 1].breakAfter = 1;
                        else
                            this.breakAtStart = 1;
                        this.flushBuffer([]);
                        this.curLine = null;
                        length--;
                        continue;
                    }
                    else {
                        this.text = value;
                        this.textOff = 0;
                    }
                }
                let take = Math.min(this.text.length - this.textOff, length, 512 /* Chunk */);
                this.flushBuffer(active.slice(0, openStart));
                this.getLine().append(wrapMarks(new TextView(this.text.slice(this.textOff, this.textOff + take)), active), openStart);
                this.atCursorPos = true;
                this.textOff += take;
                length -= take;
                openStart = 0;
            }
        }
        span(from, to, active, openStart) {
            this.buildText(to - from, active, openStart);
            this.pos = to;
            if (this.openStart < 0)
                this.openStart = openStart;
        }
        point(from, to, deco, active, openStart) {
            let len = to - from;
            if (deco instanceof PointDecoration) {
                if (deco.block) {
                    let { type } = deco;
                    if (type == BlockType.WidgetAfter && !this.posCovered())
                        this.getLine();
                    this.addBlockWidget(new BlockWidgetView(deco.widget || new NullWidget("div"), len, type));
                }
                else {
                    let view = WidgetView.create(deco.widget || new NullWidget("span"), len, deco.startSide);
                    let cursorBefore = this.atCursorPos && !view.isEditable && openStart <= active.length && (from < to || deco.startSide > 0);
                    let cursorAfter = !view.isEditable && (from < to || deco.startSide <= 0);
                    let line = this.getLine();
                    if (this.pendingBuffer == 2 /* IfCursor */ && !cursorBefore)
                        this.pendingBuffer = 0 /* No */;
                    this.flushBuffer(active);
                    if (cursorBefore) {
                        line.append(wrapMarks(new WidgetBufferView(1), active), openStart);
                        openStart = active.length + Math.max(0, openStart - active.length);
                    }
                    line.append(wrapMarks(view, active), openStart);
                    this.atCursorPos = cursorAfter;
                    this.pendingBuffer = !cursorAfter ? 0 /* No */ : from < to ? 1 /* Yes */ : 2 /* IfCursor */;
                }
            }
            else if (this.doc.lineAt(this.pos).from == this.pos) { // Line decoration
                this.getLine().addLineDeco(deco);
            }
            if (len) {
                // Advance the iterator past the replaced content
                if (this.textOff + len <= this.text.length) {
                    this.textOff += len;
                }
                else {
                    this.skip += len - (this.text.length - this.textOff);
                    this.text = "";
                    this.textOff = 0;
                }
                this.pos = to;
            }
            if (this.openStart < 0)
                this.openStart = openStart;
        }
        filterPoint(from, to, value, index) {
            if (index < this.disallowBlockEffectsBelow && value instanceof PointDecoration) {
                if (value.block)
                    throw new RangeError("Block decorations may not be specified via plugins");
                if (to > this.doc.lineAt(this.pos).to)
                    throw new RangeError("Decorations that replace line breaks may not be specified via plugins");
            }
            return true;
        }
        static build(text, from, to, decorations, pluginDecorationLength) {
            let builder = new ContentBuilder(text, from, to, pluginDecorationLength);
            builder.openEnd = RangeSet.spans(decorations, from, to, builder);
            if (builder.openStart < 0)
                builder.openStart = builder.openEnd;
            builder.finish(builder.openEnd);
            return builder;
        }
    }
    function wrapMarks(view, active) {
        for (let mark of active)
            view = new MarkView(mark, [view], view.length);
        return view;
    }
    class NullWidget extends WidgetType {
        constructor(tag) {
            super();
            this.tag = tag;
        }
        eq(other) { return other.tag == this.tag; }
        toDOM() { return document.createElement(this.tag); }
        updateDOM(elt) { return elt.nodeName.toLowerCase() == this.tag; }
    }

    const none = [];
    const clickAddsSelectionRange = /*@__PURE__*/Facet.define();
    const dragMovesSelection$1 = /*@__PURE__*/Facet.define();
    const mouseSelectionStyle = /*@__PURE__*/Facet.define();
    const exceptionSink = /*@__PURE__*/Facet.define();
    const updateListener = /*@__PURE__*/Facet.define();
    const inputHandler = /*@__PURE__*/Facet.define();
    // FIXME remove
    const scrollTo = /*@__PURE__*/StateEffect.define({
        map: (range, changes) => range.map(changes)
    });
    // FIXME remove
    const centerOn = /*@__PURE__*/StateEffect.define({
        map: (range, changes) => range.map(changes)
    });
    class ScrollTarget {
        constructor(range, y = "nearest", x = "nearest", yMargin = 5, xMargin = 5) {
            this.range = range;
            this.y = y;
            this.x = x;
            this.yMargin = yMargin;
            this.xMargin = xMargin;
        }
        map(changes) {
            return changes.empty ? this : new ScrollTarget(this.range.map(changes), this.y, this.x, this.yMargin, this.xMargin);
        }
    }
    const scrollIntoView = /*@__PURE__*/StateEffect.define({ map: (t, ch) => t.map(ch) });
    /**
    Log or report an unhandled exception in client code. Should
    probably only be used by extension code that allows client code to
    provide functions, and calls those functions in a context where an
    exception can't be propagated to calling code in a reasonable way
    (for example when in an event handler).

    Either calls a handler registered with
    [`EditorView.exceptionSink`](https://codemirror.net/6/docs/ref/#view.EditorView^exceptionSink),
    `window.onerror`, if defined, or `console.error` (in which case
    it'll pass `context`, when given, as first argument).
    */
    function logException(state, exception, context) {
        let handler = state.facet(exceptionSink);
        if (handler.length)
            handler[0](exception);
        else if (window.onerror)
            window.onerror(String(exception), context, undefined, undefined, exception);
        else if (context)
            console.error(context + ":", exception);
        else
            console.error(exception);
    }
    const editable = /*@__PURE__*/Facet.define({ combine: values => values.length ? values[0] : true });
    /**
    Used to [declare](https://codemirror.net/6/docs/ref/#view.PluginSpec.provide) which
    [fields](https://codemirror.net/6/docs/ref/#view.PluginValue) a [view plugin](https://codemirror.net/6/docs/ref/#view.ViewPlugin)
    provides.
    */
    class PluginFieldProvider {
        /**
        @internal
        */
        constructor(
        /**
        @internal
        */
        field, 
        /**
        @internal
        */
        get) {
            this.field = field;
            this.get = get;
        }
    }
    /**
    Plugin fields are a mechanism for allowing plugins to provide
    values that can be retrieved through the
    [`pluginField`](https://codemirror.net/6/docs/ref/#view.EditorView.pluginField) view method.
    */
    class PluginField {
        /**
        Create a [provider](https://codemirror.net/6/docs/ref/#view.PluginFieldProvider) for this field,
        to use with a plugin's [provide](https://codemirror.net/6/docs/ref/#view.PluginSpec.provide)
        option.
        */
        from(get) {
            return new PluginFieldProvider(this, get);
        }
        /**
        Define a new plugin field.
        */
        static define() { return new PluginField(); }
    }
    /**
    This field can be used by plugins to provide
    [decorations](https://codemirror.net/6/docs/ref/#view.Decoration).

    **Note**: For reasons of data flow (plugins are only updated
    after the viewport is computed), decorations produced by plugins
    are _not_ taken into account when predicting the vertical layout
    structure of the editor. They **must not** introduce block
    widgets (that will raise an error) or replacing decorations that
    cover line breaks (these will be ignored if they occur). Such
    decorations, or others that cause a large amount of vertical
    size shift compared to the undecorated content, should be
    provided through the state-level [`decorations`
    facet](https://codemirror.net/6/docs/ref/#view.EditorView^decorations) instead.
    */
    PluginField.decorations = /*@__PURE__*/PluginField.define();
    /**
    Used to provide ranges that should be treated as atoms as far as
    cursor motion is concerned. This causes methods like
    [`moveByChar`](https://codemirror.net/6/docs/ref/#view.EditorView.moveByChar) and
    [`moveVertically`](https://codemirror.net/6/docs/ref/#view.EditorView.moveVertically) (and the
    commands built on top of them) to skip across such regions when
    a selection endpoint would enter them. This does _not_ prevent
    direct programmatic [selection
    updates](https://codemirror.net/6/docs/ref/#state.TransactionSpec.selection) from moving into such
    regions.
    */
    PluginField.atomicRanges = /*@__PURE__*/PluginField.define();
    /**
    Plugins can provide additional scroll margins (space around the
    sides of the scrolling element that should be considered
    invisible) through this field. This can be useful when the
    plugin introduces elements that cover part of that element (for
    example a horizontally fixed gutter).
    */
    PluginField.scrollMargins = /*@__PURE__*/PluginField.define();
    let nextPluginID = 0;
    const viewPlugin = /*@__PURE__*/Facet.define();
    /**
    View plugins associate stateful values with a view. They can
    influence the way the content is drawn, and are notified of things
    that happen in the view.
    */
    class ViewPlugin {
        constructor(
        /**
        @internal
        */
        id, 
        /**
        @internal
        */
        create, 
        /**
        @internal
        */
        fields) {
            this.id = id;
            this.create = create;
            this.fields = fields;
            this.extension = viewPlugin.of(this);
        }
        /**
        Define a plugin from a constructor function that creates the
        plugin's value, given an editor view.
        */
        static define(create, spec) {
            let { eventHandlers, provide, decorations } = spec || {};
            let fields = [];
            if (provide)
                for (let provider of Array.isArray(provide) ? provide : [provide])
                    fields.push(provider);
            if (eventHandlers)
                fields.push(domEventHandlers.from((value) => ({ plugin: value, handlers: eventHandlers })));
            if (decorations)
                fields.push(PluginField.decorations.from(decorations));
            return new ViewPlugin(nextPluginID++, create, fields);
        }
        /**
        Create a plugin for a class whose constructor takes a single
        editor view as argument.
        */
        static fromClass(cls, spec) {
            return ViewPlugin.define(view => new cls(view), spec);
        }
    }
    const domEventHandlers = /*@__PURE__*/PluginField.define();
    class PluginInstance {
        constructor(spec) {
            this.spec = spec;
            // When starting an update, all plugins have this field set to the
            // update object, indicating they need to be updated. When finished
            // updating, it is set to `false`. Retrieving a plugin that needs to
            // be updated with `view.plugin` forces an eager update.
            this.mustUpdate = null;
            // This is null when the plugin is initially created, but
            // initialized on the first update.
            this.value = null;
        }
        takeField(type, target) {
            if (this.spec)
                for (let { field, get } of this.spec.fields)
                    if (field == type)
                        target.push(get(this.value));
        }
        update(view) {
            if (!this.value) {
                if (this.spec) {
                    try {
                        this.value = this.spec.create(view);
                    }
                    catch (e) {
                        logException(view.state, e, "CodeMirror plugin crashed");
                        this.deactivate();
                    }
                }
            }
            else if (this.mustUpdate) {
                let update = this.mustUpdate;
                this.mustUpdate = null;
                if (this.value.update) {
                    try {
                        this.value.update(update);
                    }
                    catch (e) {
                        logException(update.state, e, "CodeMirror plugin crashed");
                        if (this.value.destroy)
                            try {
                                this.value.destroy();
                            }
                            catch (_) { }
                        this.deactivate();
                    }
                }
            }
            return this;
        }
        destroy(view) {
            var _a;
            if ((_a = this.value) === null || _a === void 0 ? void 0 : _a.destroy) {
                try {
                    this.value.destroy();
                }
                catch (e) {
                    logException(view.state, e, "CodeMirror plugin crashed");
                }
            }
        }
        deactivate() {
            this.spec = this.value = null;
        }
    }
    const editorAttributes = /*@__PURE__*/Facet.define();
    const contentAttributes = /*@__PURE__*/Facet.define();
    // Provide decorations
    const decorations = /*@__PURE__*/Facet.define();
    const styleModule = /*@__PURE__*/Facet.define();
    class ChangedRange {
        constructor(fromA, toA, fromB, toB) {
            this.fromA = fromA;
            this.toA = toA;
            this.fromB = fromB;
            this.toB = toB;
        }
        join(other) {
            return new ChangedRange(Math.min(this.fromA, other.fromA), Math.max(this.toA, other.toA), Math.min(this.fromB, other.fromB), Math.max(this.toB, other.toB));
        }
        addToSet(set) {
            let i = set.length, me = this;
            for (; i > 0; i--) {
                let range = set[i - 1];
                if (range.fromA > me.toA)
                    continue;
                if (range.toA < me.fromA)
                    break;
                me = me.join(range);
                set.splice(i - 1, 1);
            }
            set.splice(i, 0, me);
            return set;
        }
        static extendWithRanges(diff, ranges) {
            if (ranges.length == 0)
                return diff;
            let result = [];
            for (let dI = 0, rI = 0, posA = 0, posB = 0;; dI++) {
                let next = dI == diff.length ? null : diff[dI], off = posA - posB;
                let end = next ? next.fromB : 1e9;
                while (rI < ranges.length && ranges[rI] < end) {
                    let from = ranges[rI], to = ranges[rI + 1];
                    let fromB = Math.max(posB, from), toB = Math.min(end, to);
                    if (fromB <= toB)
                        new ChangedRange(fromB + off, toB + off, fromB, toB).addToSet(result);
                    if (to > end)
                        break;
                    else
                        rI += 2;
                }
                if (!next)
                    return result;
                new ChangedRange(next.fromA, next.toA, next.fromB, next.toB).addToSet(result);
                posA = next.toA;
                posB = next.toB;
            }
        }
    }
    /**
    View [plugins](https://codemirror.net/6/docs/ref/#view.ViewPlugin) are given instances of this
    class, which describe what happened, whenever the view is updated.
    */
    class ViewUpdate {
        /**
        @internal
        */
        constructor(
        /**
        The editor view that the update is associated with.
        */
        view, 
        /**
        The new editor state.
        */
        state, 
        /**
        The transactions involved in the update. May be empty.
        */
        transactions = none) {
            this.view = view;
            this.state = state;
            this.transactions = transactions;
            /**
            @internal
            */
            this.flags = 0;
            this.startState = view.state;
            this.changes = ChangeSet.empty(this.startState.doc.length);
            for (let tr of transactions)
                this.changes = this.changes.compose(tr.changes);
            let changedRanges = [];
            this.changes.iterChangedRanges((fromA, toA, fromB, toB) => changedRanges.push(new ChangedRange(fromA, toA, fromB, toB)));
            this.changedRanges = changedRanges;
            let focus = view.hasFocus;
            if (focus != view.inputState.notifiedFocused) {
                view.inputState.notifiedFocused = focus;
                this.flags |= 1 /* Focus */;
            }
        }
        /**
        Tells you whether the [viewport](https://codemirror.net/6/docs/ref/#view.EditorView.viewport) or
        [visible ranges](https://codemirror.net/6/docs/ref/#view.EditorView.visibleRanges) changed in this
        update.
        */
        get viewportChanged() {
            return (this.flags & 4 /* Viewport */) > 0;
        }
        /**
        Indicates whether the height of an element in the editor changed
        in this update.
        */
        get heightChanged() {
            return (this.flags & 2 /* Height */) > 0;
        }
        /**
        Returns true when the document was modified or the size of the
        editor, or elements within the editor, changed.
        */
        get geometryChanged() {
            return this.docChanged || (this.flags & (8 /* Geometry */ | 2 /* Height */)) > 0;
        }
        /**
        True when this update indicates a focus change.
        */
        get focusChanged() {
            return (this.flags & 1 /* Focus */) > 0;
        }
        /**
        Whether the document changed in this update.
        */
        get docChanged() {
            return !this.changes.empty;
        }
        /**
        Whether the selection was explicitly set in this update.
        */
        get selectionSet() {
            return this.transactions.some(tr => tr.selection);
        }
        /**
        @internal
        */
        get empty() { return this.flags == 0 && this.transactions.length == 0; }
    }

    /**
    Used to indicate [text direction](https://codemirror.net/6/docs/ref/#view.EditorView.textDirection).
    */
    var Direction = /*@__PURE__*/(function (Direction) {
        // (These are chosen to match the base levels, in bidi algorithm
        // terms, of spans in that direction.)
        /**
        Left-to-right.
        */
        Direction[Direction["LTR"] = 0] = "LTR";
        /**
        Right-to-left.
        */
        Direction[Direction["RTL"] = 1] = "RTL";
    return Direction})(Direction || (Direction = {}));
    const LTR = Direction.LTR, RTL = Direction.RTL;
    // Decode a string with each type encoded as log2(type)
    function dec(str) {
        let result = [];
        for (let i = 0; i < str.length; i++)
            result.push(1 << +str[i]);
        return result;
    }
    // Character types for codepoints 0 to 0xf8
    const LowTypes = /*@__PURE__*/dec("88888888888888888888888888888888888666888888787833333333337888888000000000000000000000000008888880000000000000000000000000088888888888888888888888888888888888887866668888088888663380888308888800000000000000000000000800000000000000000000000000000008");
    // Character types for codepoints 0x600 to 0x6f9
    const ArabicTypes = /*@__PURE__*/dec("4444448826627288999999999992222222222222222222222222222222222222222222222229999999999999999999994444444444644222822222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222999999949999999229989999223333333333");
    const Brackets = /*@__PURE__*/Object.create(null), BracketStack = [];
    // There's a lot more in
    // https://www.unicode.org/Public/UCD/latest/ucd/BidiBrackets.txt,
    // which are left out to keep code size down.
    for (let p of ["()", "[]", "{}"]) {
        let l = /*@__PURE__*/p.charCodeAt(0), r = /*@__PURE__*/p.charCodeAt(1);
        Brackets[l] = r;
        Brackets[r] = -l;
    }
    function charType(ch) {
        return ch <= 0xf7 ? LowTypes[ch] :
            0x590 <= ch && ch <= 0x5f4 ? 2 /* R */ :
                0x600 <= ch && ch <= 0x6f9 ? ArabicTypes[ch - 0x600] :
                    0x6ee <= ch && ch <= 0x8ac ? 4 /* AL */ :
                        0x2000 <= ch && ch <= 0x200b ? 256 /* NI */ :
                            ch == 0x200c ? 256 /* NI */ : 1 /* L */;
    }
    const BidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
    /**
    Represents a contiguous range of text that has a single direction
    (as in left-to-right or right-to-left).
    */
    class BidiSpan {
        /**
        @internal
        */
        constructor(
        /**
        The start of the span (relative to the start of the line).
        */
        from, 
        /**
        The end of the span.
        */
        to, 
        /**
        The ["bidi
        level"](https://unicode.org/reports/tr9/#Basic_Display_Algorithm)
        of the span (in this context, 0 means
        left-to-right, 1 means right-to-left, 2 means left-to-right
        number inside right-to-left text).
        */
        level) {
            this.from = from;
            this.to = to;
            this.level = level;
        }
        /**
        The direction of this span.
        */
        get dir() { return this.level % 2 ? RTL : LTR; }
        /**
        @internal
        */
        side(end, dir) { return (this.dir == dir) == end ? this.to : this.from; }
        /**
        @internal
        */
        static find(order, index, level, assoc) {
            let maybe = -1;
            for (let i = 0; i < order.length; i++) {
                let span = order[i];
                if (span.from <= index && span.to >= index) {
                    if (span.level == level)
                        return i;
                    // When multiple spans match, if assoc != 0, take the one that
                    // covers that side, otherwise take the one with the minimum
                    // level.
                    if (maybe < 0 || (assoc != 0 ? (assoc < 0 ? span.from < index : span.to > index) : order[maybe].level > span.level))
                        maybe = i;
                }
            }
            if (maybe < 0)
                throw new RangeError("Index out of range");
            return maybe;
        }
    }
    // Reused array of character types
    const types = [];
    function computeOrder(line, direction) {
        let len = line.length, outerType = direction == LTR ? 1 /* L */ : 2 /* R */, oppositeType = direction == LTR ? 2 /* R */ : 1 /* L */;
        if (!line || outerType == 1 /* L */ && !BidiRE.test(line))
            return trivialOrder(len);
        // W1. Examine each non-spacing mark (NSM) in the level run, and
        // change the type of the NSM to the type of the previous
        // character. If the NSM is at the start of the level run, it will
        // get the type of sor.
        // W2. Search backwards from each instance of a European number
        // until the first strong type (R, L, AL, or sor) is found. If an
        // AL is found, change the type of the European number to Arabic
        // number.
        // W3. Change all ALs to R.
        // (Left after this: L, R, EN, AN, ET, CS, NI)
        for (let i = 0, prev = outerType, prevStrong = outerType; i < len; i++) {
            let type = charType(line.charCodeAt(i));
            if (type == 512 /* NSM */)
                type = prev;
            else if (type == 8 /* EN */ && prevStrong == 4 /* AL */)
                type = 16 /* AN */;
            types[i] = type == 4 /* AL */ ? 2 /* R */ : type;
            if (type & 7 /* Strong */)
                prevStrong = type;
            prev = type;
        }
        // W5. A sequence of European terminators adjacent to European
        // numbers changes to all European numbers.
        // W6. Otherwise, separators and terminators change to Other
        // Neutral.
        // W7. Search backwards from each instance of a European number
        // until the first strong type (R, L, or sor) is found. If an L is
        // found, then change the type of the European number to L.
        // (Left after this: L, R, EN+AN, NI)
        for (let i = 0, prev = outerType, prevStrong = outerType; i < len; i++) {
            let type = types[i];
            if (type == 128 /* CS */) {
                if (i < len - 1 && prev == types[i + 1] && (prev & 24 /* Num */))
                    type = types[i] = prev;
                else
                    types[i] = 256 /* NI */;
            }
            else if (type == 64 /* ET */) {
                let end = i + 1;
                while (end < len && types[end] == 64 /* ET */)
                    end++;
                let replace = (i && prev == 8 /* EN */) || (end < len && types[end] == 8 /* EN */) ? (prevStrong == 1 /* L */ ? 1 /* L */ : 8 /* EN */) : 256 /* NI */;
                for (let j = i; j < end; j++)
                    types[j] = replace;
                i = end - 1;
            }
            else if (type == 8 /* EN */ && prevStrong == 1 /* L */) {
                types[i] = 1 /* L */;
            }
            prev = type;
            if (type & 7 /* Strong */)
                prevStrong = type;
        }
        // N0. Process bracket pairs in an isolating run sequence
        // sequentially in the logical order of the text positions of the
        // opening paired brackets using the logic given below. Within this
        // scope, bidirectional types EN and AN are treated as R.
        for (let i = 0, sI = 0, context = 0, ch, br, type; i < len; i++) {
            // Keeps [startIndex, type, strongSeen] triples for each open
            // bracket on BracketStack.
            if (br = Brackets[ch = line.charCodeAt(i)]) {
                if (br < 0) { // Closing bracket
                    for (let sJ = sI - 3; sJ >= 0; sJ -= 3) {
                        if (BracketStack[sJ + 1] == -br) {
                            let flags = BracketStack[sJ + 2];
                            let type = (flags & 2 /* EmbedInside */) ? outerType :
                                !(flags & 4 /* OppositeInside */) ? 0 :
                                    (flags & 1 /* OppositeBefore */) ? oppositeType : outerType;
                            if (type)
                                types[i] = types[BracketStack[sJ]] = type;
                            sI = sJ;
                            break;
                        }
                    }
                }
                else if (BracketStack.length == 189 /* MaxDepth */) {
                    break;
                }
                else {
                    BracketStack[sI++] = i;
                    BracketStack[sI++] = ch;
                    BracketStack[sI++] = context;
                }
            }
            else if ((type = types[i]) == 2 /* R */ || type == 1 /* L */) {
                let embed = type == outerType;
                context = embed ? 0 : 1 /* OppositeBefore */;
                for (let sJ = sI - 3; sJ >= 0; sJ -= 3) {
                    let cur = BracketStack[sJ + 2];
                    if (cur & 2 /* EmbedInside */)
                        break;
                    if (embed) {
                        BracketStack[sJ + 2] |= 2 /* EmbedInside */;
                    }
                    else {
                        if (cur & 4 /* OppositeInside */)
                            break;
                        BracketStack[sJ + 2] |= 4 /* OppositeInside */;
                    }
                }
            }
        }
        // N1. A sequence of neutrals takes the direction of the
        // surrounding strong text if the text on both sides has the same
        // direction. European and Arabic numbers act as if they were R in
        // terms of their influence on neutrals. Start-of-level-run (sor)
        // and end-of-level-run (eor) are used at level run boundaries.
        // N2. Any remaining neutrals take the embedding direction.
        // (Left after this: L, R, EN+AN)
        for (let i = 0; i < len; i++) {
            if (types[i] == 256 /* NI */) {
                let end = i + 1;
                while (end < len && types[end] == 256 /* NI */)
                    end++;
                let beforeL = (i ? types[i - 1] : outerType) == 1 /* L */;
                let afterL = (end < len ? types[end] : outerType) == 1 /* L */;
                let replace = beforeL == afterL ? (beforeL ? 1 /* L */ : 2 /* R */) : outerType;
                for (let j = i; j < end; j++)
                    types[j] = replace;
                i = end - 1;
            }
        }
        // Here we depart from the documented algorithm, in order to avoid
        // building up an actual levels array. Since there are only three
        // levels (0, 1, 2) in an implementation that doesn't take
        // explicit embedding into account, we can build up the order on
        // the fly, without following the level-based algorithm.
        let order = [];
        if (outerType == 1 /* L */) {
            for (let i = 0; i < len;) {
                let start = i, rtl = types[i++] != 1 /* L */;
                while (i < len && rtl == (types[i] != 1 /* L */))
                    i++;
                if (rtl) {
                    for (let j = i; j > start;) {
                        let end = j, l = types[--j] != 2 /* R */;
                        while (j > start && l == (types[j - 1] != 2 /* R */))
                            j--;
                        order.push(new BidiSpan(j, end, l ? 2 : 1));
                    }
                }
                else {
                    order.push(new BidiSpan(start, i, 0));
                }
            }
        }
        else {
            for (let i = 0; i < len;) {
                let start = i, rtl = types[i++] == 2 /* R */;
                while (i < len && rtl == (types[i] == 2 /* R */))
                    i++;
                order.push(new BidiSpan(start, i, rtl ? 1 : 2));
            }
        }
        return order;
    }
    function trivialOrder(length) {
        return [new BidiSpan(0, length, 0)];
    }
    let movedOver = "";
    function moveVisually(line, order, dir, start, forward) {
        var _a;
        let startIndex = start.head - line.from, spanI = -1;
        if (startIndex == 0) {
            if (!forward || !line.length)
                return null;
            if (order[0].level != dir) {
                startIndex = order[0].side(false, dir);
                spanI = 0;
            }
        }
        else if (startIndex == line.length) {
            if (forward)
                return null;
            let last = order[order.length - 1];
            if (last.level != dir) {
                startIndex = last.side(true, dir);
                spanI = order.length - 1;
            }
        }
        if (spanI < 0)
            spanI = BidiSpan.find(order, startIndex, (_a = start.bidiLevel) !== null && _a !== void 0 ? _a : -1, start.assoc);
        let span = order[spanI];
        // End of span. (But not end of line--that was checked for above.)
        if (startIndex == span.side(forward, dir)) {
            span = order[spanI += forward ? 1 : -1];
            startIndex = span.side(!forward, dir);
        }
        let indexForward = forward == (span.dir == dir);
        let nextIndex = findClusterBreak(line.text, startIndex, indexForward);
        movedOver = line.text.slice(Math.min(startIndex, nextIndex), Math.max(startIndex, nextIndex));
        if (nextIndex != span.side(forward, dir))
            return EditorSelection.cursor(nextIndex + line.from, indexForward ? -1 : 1, span.level);
        let nextSpan = spanI == (forward ? order.length - 1 : 0) ? null : order[spanI + (forward ? 1 : -1)];
        if (!nextSpan && span.level != dir)
            return EditorSelection.cursor(forward ? line.to : line.from, forward ? -1 : 1, dir);
        if (nextSpan && nextSpan.level < span.level)
            return EditorSelection.cursor(nextSpan.side(!forward, dir) + line.from, forward ? 1 : -1, nextSpan.level);
        return EditorSelection.cursor(nextIndex + line.from, forward ? -1 : 1, span.level);
    }

    const LineBreakPlaceholder = "\uffff";
    class DOMReader {
        constructor(points, state) {
            this.points = points;
            this.text = "";
            this.lineSeparator = state.facet(EditorState.lineSeparator);
        }
        append(text) {
            this.text += text;
        }
        lineBreak() {
            this.text += LineBreakPlaceholder;
        }
        readRange(start, end) {
            if (!start)
                return this;
            let parent = start.parentNode;
            for (let cur = start;;) {
                this.findPointBefore(parent, cur);
                this.readNode(cur);
                let next = cur.nextSibling;
                if (next == end)
                    break;
                let view = ContentView.get(cur), nextView = ContentView.get(next);
                if (view && nextView ? view.breakAfter :
                    (view ? view.breakAfter : isBlockElement(cur)) ||
                        (isBlockElement(next) && (cur.nodeName != "BR" || cur.cmIgnore)))
                    this.lineBreak();
                cur = next;
            }
            this.findPointBefore(parent, end);
            return this;
        }
        readTextNode(node) {
            let text = node.nodeValue;
            for (let point of this.points)
                if (point.node == node)
                    point.pos = this.text.length + Math.min(point.offset, text.length);
            for (let off = 0, re = this.lineSeparator ? null : /\r\n?|\n/g;;) {
                let nextBreak = -1, breakSize = 1, m;
                if (this.lineSeparator) {
                    nextBreak = text.indexOf(this.lineSeparator, off);
                    breakSize = this.lineSeparator.length;
                }
                else if (m = re.exec(text)) {
                    nextBreak = m.index;
                    breakSize = m[0].length;
                }
                this.append(text.slice(off, nextBreak < 0 ? text.length : nextBreak));
                if (nextBreak < 0)
                    break;
                this.lineBreak();
                if (breakSize > 1)
                    for (let point of this.points)
                        if (point.node == node && point.pos > this.text.length)
                            point.pos -= breakSize - 1;
                off = nextBreak + breakSize;
            }
        }
        readNode(node) {
            if (node.cmIgnore)
                return;
            let view = ContentView.get(node);
            let fromView = view && view.overrideDOMText;
            if (fromView != null) {
                this.findPointInside(node, fromView.length);
                for (let i = fromView.iter(); !i.next().done;) {
                    if (i.lineBreak)
                        this.lineBreak();
                    else
                        this.append(i.value);
                }
            }
            else if (node.nodeType == 3) {
                this.readTextNode(node);
            }
            else if (node.nodeName == "BR") {
                if (node.nextSibling)
                    this.lineBreak();
            }
            else if (node.nodeType == 1) {
                this.readRange(node.firstChild, null);
            }
        }
        findPointBefore(node, next) {
            for (let point of this.points)
                if (point.node == node && node.childNodes[point.offset] == next)
                    point.pos = this.text.length;
        }
        findPointInside(node, maxLen) {
            for (let point of this.points)
                if (node.nodeType == 3 ? point.node == node : node.contains(point.node))
                    point.pos = this.text.length + Math.min(maxLen, point.offset);
        }
    }
    function isBlockElement(node) {
        return node.nodeType == 1 && /^(DIV|P|LI|UL|OL|BLOCKQUOTE|DD|DT|H\d|SECTION|PRE)$/.test(node.nodeName);
    }
    class DOMPoint {
        constructor(node, offset) {
            this.node = node;
            this.offset = offset;
            this.pos = -1;
        }
    }

    class DocView extends ContentView {
        constructor(view) {
            super();
            this.view = view;
            this.compositionDeco = Decoration.none;
            this.decorations = [];
            this.pluginDecorationLength = 0;
            // Track a minimum width for the editor. When measuring sizes in
            // measureVisibleLineHeights, this is updated to point at the width
            // of a given element and its extent in the document. When a change
            // happens in that range, these are reset. That way, once we've seen
            // a line/element of a given length, we keep the editor wide enough
            // to fit at least that element, until it is changed, at which point
            // we forget it again.
            this.minWidth = 0;
            this.minWidthFrom = 0;
            this.minWidthTo = 0;
            // Track whether the DOM selection was set in a lossy way, so that
            // we don't mess it up when reading it back it
            this.impreciseAnchor = null;
            this.impreciseHead = null;
            this.forceSelection = false;
            // Used by the resize observer to ignore resizes that we caused
            // ourselves
            this.lastUpdate = Date.now();
            this.setDOM(view.contentDOM);
            this.children = [new LineView];
            this.children[0].setParent(this);
            this.updateDeco();
            this.updateInner([new ChangedRange(0, 0, 0, view.state.doc.length)], 0);
        }
        get root() { return this.view.root; }
        get editorView() { return this.view; }
        get length() { return this.view.state.doc.length; }
        // Update the document view to a given state. scrollIntoView can be
        // used as a hint to compute a new viewport that includes that
        // position, if we know the editor is going to scroll that position
        // into view.
        update(update) {
            let changedRanges = update.changedRanges;
            if (this.minWidth > 0 && changedRanges.length) {
                if (!changedRanges.every(({ fromA, toA }) => toA < this.minWidthFrom || fromA > this.minWidthTo)) {
                    this.minWidth = this.minWidthFrom = this.minWidthTo = 0;
                }
                else {
                    this.minWidthFrom = update.changes.mapPos(this.minWidthFrom, 1);
                    this.minWidthTo = update.changes.mapPos(this.minWidthTo, 1);
                }
            }
            if (this.view.inputState.composing < 0)
                this.compositionDeco = Decoration.none;
            else if (update.transactions.length || this.dirty)
                this.compositionDeco = computeCompositionDeco(this.view, update.changes);
            // When the DOM nodes around the selection are moved to another
            // parent, Chrome sometimes reports a different selection through
            // getSelection than the one that it actually shows to the user.
            // This forces a selection update when lines are joined to work
            // around that. Issue #54
            if ((browser.ie || browser.chrome) && !this.compositionDeco.size && update &&
                update.state.doc.lines != update.startState.doc.lines)
                this.forceSelection = true;
            let prevDeco = this.decorations, deco = this.updateDeco();
            let decoDiff = findChangedDeco(prevDeco, deco, update.changes);
            changedRanges = ChangedRange.extendWithRanges(changedRanges, decoDiff);
            if (this.dirty == 0 /* Not */ && changedRanges.length == 0) {
                return false;
            }
            else {
                this.updateInner(changedRanges, update.startState.doc.length);
                if (update.transactions.length)
                    this.lastUpdate = Date.now();
                return true;
            }
        }
        // Used by update and the constructor do perform the actual DOM
        // update
        updateInner(changes, oldLength) {
            this.view.viewState.mustMeasureContent = true;
            this.updateChildren(changes, oldLength);
            let { observer } = this.view;
            observer.ignore(() => {
                // Lock the height during redrawing, since Chrome sometimes
                // messes with the scroll position during DOM mutation (though
                // no relayout is triggered and I cannot imagine how it can
                // recompute the scroll position without a layout)
                this.dom.style.height = this.view.viewState.contentHeight + "px";
                this.dom.style.minWidth = this.minWidth ? this.minWidth + "px" : "";
                // Chrome will sometimes, when DOM mutations occur directly
                // around the selection, get confused and report a different
                // selection from the one it displays (issue #218). This tries
                // to detect that situation.
                let track = browser.chrome || browser.ios ? { node: observer.selectionRange.focusNode, written: false } : undefined;
                this.sync(track);
                this.dirty = 0 /* Not */;
                if (track && (track.written || observer.selectionRange.focusNode != track.node))
                    this.forceSelection = true;
                this.dom.style.height = "";
            });
            let gaps = [];
            if (this.view.viewport.from || this.view.viewport.to < this.view.state.doc.length)
                for (let child of this.children)
                    if (child instanceof BlockWidgetView && child.widget instanceof BlockGapWidget)
                        gaps.push(child.dom);
            observer.updateGaps(gaps);
        }
        updateChildren(changes, oldLength) {
            let cursor = this.childCursor(oldLength);
            for (let i = changes.length - 1;; i--) {
                let next = i >= 0 ? changes[i] : null;
                if (!next)
                    break;
                let { fromA, toA, fromB, toB } = next;
                let { content, breakAtStart, openStart, openEnd } = ContentBuilder.build(this.view.state.doc, fromB, toB, this.decorations, this.pluginDecorationLength);
                let { i: toI, off: toOff } = cursor.findPos(toA, 1);
                let { i: fromI, off: fromOff } = cursor.findPos(fromA, -1);
                replaceRange(this, fromI, fromOff, toI, toOff, content, breakAtStart, openStart, openEnd);
            }
        }
        // Sync the DOM selection to this.state.selection
        updateSelection(mustRead = false, fromPointer = false) {
            if (mustRead)
                this.view.observer.readSelectionRange();
            if (!(fromPointer || this.mayControlSelection()) ||
                browser.ios && this.view.inputState.rapidCompositionStart)
                return;
            let force = this.forceSelection;
            this.forceSelection = false;
            let main = this.view.state.selection.main;
            // FIXME need to handle the case where the selection falls inside a block range
            let anchor = this.domAtPos(main.anchor);
            let head = main.empty ? anchor : this.domAtPos(main.head);
            // Always reset on Firefox when next to an uneditable node to
            // avoid invisible cursor bugs (#111)
            if (browser.gecko && main.empty && betweenUneditable(anchor)) {
                let dummy = document.createTextNode("");
                this.view.observer.ignore(() => anchor.node.insertBefore(dummy, anchor.node.childNodes[anchor.offset] || null));
                anchor = head = new DOMPos(dummy, 0);
                force = true;
            }
            let domSel = this.view.observer.selectionRange;
            // If the selection is already here, or in an equivalent position, don't touch it
            if (force || !domSel.focusNode ||
                !isEquivalentPosition(anchor.node, anchor.offset, domSel.anchorNode, domSel.anchorOffset) ||
                !isEquivalentPosition(head.node, head.offset, domSel.focusNode, domSel.focusOffset)) {
                this.view.observer.ignore(() => {
                    // Chrome Android will hide the virtual keyboard when tapping
                    // inside an uneditable node, and not bring it back when we
                    // move the cursor to its proper position. This tries to
                    // restore the keyboard by cycling focus.
                    if (browser.android && browser.chrome && this.dom.contains(domSel.focusNode) &&
                        inUneditable(domSel.focusNode, this.dom)) {
                        this.dom.blur();
                        this.dom.focus({ preventScroll: true });
                    }
                    let rawSel = getSelection(this.root);
                    if (main.empty) {
                        // Work around https://bugzilla.mozilla.org/show_bug.cgi?id=1612076
                        if (browser.gecko) {
                            let nextTo = nextToUneditable(anchor.node, anchor.offset);
                            if (nextTo && nextTo != (1 /* Before */ | 2 /* After */)) {
                                let text = nearbyTextNode(anchor.node, anchor.offset, nextTo == 1 /* Before */ ? 1 : -1);
                                if (text)
                                    anchor = new DOMPos(text, nextTo == 1 /* Before */ ? 0 : text.nodeValue.length);
                            }
                        }
                        rawSel.collapse(anchor.node, anchor.offset);
                        if (main.bidiLevel != null && domSel.cursorBidiLevel != null)
                            domSel.cursorBidiLevel = main.bidiLevel;
                    }
                    else if (rawSel.extend) {
                        // Selection.extend can be used to create an 'inverted' selection
                        // (one where the focus is before the anchor), but not all
                        // browsers support it yet.
                        rawSel.collapse(anchor.node, anchor.offset);
                        rawSel.extend(head.node, head.offset);
                    }
                    else {
                        // Primitive (IE) way
                        let range = document.createRange();
                        if (main.anchor > main.head)
                            [anchor, head] = [head, anchor];
                        range.setEnd(head.node, head.offset);
                        range.setStart(anchor.node, anchor.offset);
                        rawSel.removeAllRanges();
                        rawSel.addRange(range);
                    }
                });
                this.view.observer.setSelectionRange(anchor, head);
            }
            this.impreciseAnchor = anchor.precise ? null : new DOMPos(domSel.anchorNode, domSel.anchorOffset);
            this.impreciseHead = head.precise ? null : new DOMPos(domSel.focusNode, domSel.focusOffset);
        }
        enforceCursorAssoc() {
            if (this.compositionDeco.size)
                return;
            let cursor = this.view.state.selection.main;
            let sel = getSelection(this.root);
            if (!cursor.empty || !cursor.assoc || !sel.modify)
                return;
            let line = LineView.find(this, cursor.head);
            if (!line)
                return;
            let lineStart = line.posAtStart;
            if (cursor.head == lineStart || cursor.head == lineStart + line.length)
                return;
            let before = this.coordsAt(cursor.head, -1), after = this.coordsAt(cursor.head, 1);
            if (!before || !after || before.bottom > after.top)
                return;
            let dom = this.domAtPos(cursor.head + cursor.assoc);
            sel.collapse(dom.node, dom.offset);
            sel.modify("move", cursor.assoc < 0 ? "forward" : "backward", "lineboundary");
        }
        mayControlSelection() {
            return this.view.state.facet(editable) ? this.root.activeElement == this.dom
                : hasSelection(this.dom, this.view.observer.selectionRange);
        }
        nearest(dom) {
            for (let cur = dom; cur;) {
                let domView = ContentView.get(cur);
                if (domView && domView.rootView == this)
                    return domView;
                cur = cur.parentNode;
            }
            return null;
        }
        posFromDOM(node, offset) {
            let view = this.nearest(node);
            if (!view)
                throw new RangeError("Trying to find position for a DOM position outside of the document");
            return view.localPosFromDOM(node, offset) + view.posAtStart;
        }
        domAtPos(pos) {
            let { i, off } = this.childCursor().findPos(pos, -1);
            for (; i < this.children.length - 1;) {
                let child = this.children[i];
                if (off < child.length || child instanceof LineView)
                    break;
                i++;
                off = 0;
            }
            return this.children[i].domAtPos(off);
        }
        coordsAt(pos, side) {
            for (let off = this.length, i = this.children.length - 1;; i--) {
                let child = this.children[i], start = off - child.breakAfter - child.length;
                if (pos > start ||
                    (pos == start && child.type != BlockType.WidgetBefore && child.type != BlockType.WidgetAfter &&
                        (!i || side == 2 || this.children[i - 1].breakAfter ||
                            (this.children[i - 1].type == BlockType.WidgetBefore && side > -2))))
                    return child.coordsAt(pos - start, side);
                off = start;
            }
        }
        measureVisibleLineHeights() {
            let result = [], { from, to } = this.view.viewState.viewport;
            let contentWidth = this.view.contentDOM.clientWidth;
            let isWider = contentWidth > Math.max(this.view.scrollDOM.clientWidth, this.minWidth) + 1;
            let widest = -1;
            for (let pos = 0, i = 0; i < this.children.length; i++) {
                let child = this.children[i], end = pos + child.length;
                if (end > to)
                    break;
                if (pos >= from) {
                    let childRect = child.dom.getBoundingClientRect();
                    result.push(childRect.height);
                    if (isWider) {
                        let last = child.dom.lastChild;
                        let rects = last ? clientRectsFor(last) : [];
                        if (rects.length) {
                            let rect = rects[rects.length - 1];
                            let width = this.view.textDirection == Direction.LTR ? rect.right - childRect.left
                                : childRect.right - rect.left;
                            if (width > widest) {
                                widest = width;
                                this.minWidth = contentWidth;
                                this.minWidthFrom = pos;
                                this.minWidthTo = end;
                            }
                        }
                    }
                }
                pos = end + child.breakAfter;
            }
            return result;
        }
        measureTextSize() {
            for (let child of this.children) {
                if (child instanceof LineView) {
                    let measure = child.measureTextSize();
                    if (measure)
                        return measure;
                }
            }
            // If no workable line exists, force a layout of a measurable element
            let dummy = document.createElement("div"), lineHeight, charWidth;
            dummy.className = "cm-line";
            dummy.textContent = "abc def ghi jkl mno pqr stu";
            this.view.observer.ignore(() => {
                this.dom.appendChild(dummy);
                let rect = clientRectsFor(dummy.firstChild)[0];
                lineHeight = dummy.getBoundingClientRect().height;
                charWidth = rect ? rect.width / 27 : 7;
                dummy.remove();
            });
            return { lineHeight, charWidth };
        }
        childCursor(pos = this.length) {
            // Move back to start of last element when possible, so that
            // `ChildCursor.findPos` doesn't have to deal with the edge case
            // of being after the last element.
            let i = this.children.length;
            if (i)
                pos -= this.children[--i].length;
            return new ChildCursor(this.children, pos, i);
        }
        computeBlockGapDeco() {
            let deco = [], vs = this.view.viewState;
            for (let pos = 0, i = 0;; i++) {
                let next = i == vs.viewports.length ? null : vs.viewports[i];
                let end = next ? next.from - 1 : this.length;
                if (end > pos) {
                    let height = vs.lineBlockAt(end).bottom - vs.lineBlockAt(pos).top;
                    deco.push(Decoration.replace({
                        widget: new BlockGapWidget(height),
                        block: true,
                        inclusive: true,
                        isBlockGap: true,
                    }).range(pos, end));
                }
                if (!next)
                    break;
                pos = next.to + 1;
            }
            return Decoration.set(deco);
        }
        updateDeco() {
            let pluginDecorations = this.view.pluginField(PluginField.decorations);
            this.pluginDecorationLength = pluginDecorations.length;
            return this.decorations = [
                ...pluginDecorations,
                ...this.view.state.facet(decorations),
                this.compositionDeco,
                this.computeBlockGapDeco(),
                this.view.viewState.lineGapDeco
            ];
        }
        scrollIntoView(target) {
            let { range } = target;
            let rect = this.coordsAt(range.head, range.empty ? range.assoc : range.head > range.anchor ? -1 : 1), other;
            if (!rect)
                return;
            if (!range.empty && (other = this.coordsAt(range.anchor, range.anchor > range.head ? -1 : 1)))
                rect = { left: Math.min(rect.left, other.left), top: Math.min(rect.top, other.top),
                    right: Math.max(rect.right, other.right), bottom: Math.max(rect.bottom, other.bottom) };
            let mLeft = 0, mRight = 0, mTop = 0, mBottom = 0;
            for (let margins of this.view.pluginField(PluginField.scrollMargins))
                if (margins) {
                    let { left, right, top, bottom } = margins;
                    if (left != null)
                        mLeft = Math.max(mLeft, left);
                    if (right != null)
                        mRight = Math.max(mRight, right);
                    if (top != null)
                        mTop = Math.max(mTop, top);
                    if (bottom != null)
                        mBottom = Math.max(mBottom, bottom);
                }
            let targetRect = {
                left: rect.left - mLeft, top: rect.top - mTop,
                right: rect.right + mRight, bottom: rect.bottom + mBottom
            };
            scrollRectIntoView(this.view.scrollDOM, targetRect, range.head < range.anchor ? -1 : 1, target.x, target.y, target.xMargin, target.yMargin, this.view.textDirection == Direction.LTR);
        }
    }
    function betweenUneditable(pos) {
        return pos.node.nodeType == 1 && pos.node.firstChild &&
            (pos.offset == 0 || pos.node.childNodes[pos.offset - 1].contentEditable == "false") &&
            (pos.offset == pos.node.childNodes.length || pos.node.childNodes[pos.offset].contentEditable == "false");
    }
    class BlockGapWidget extends WidgetType {
        constructor(height) {
            super();
            this.height = height;
        }
        toDOM() {
            let elt = document.createElement("div");
            this.updateDOM(elt);
            return elt;
        }
        eq(other) { return other.height == this.height; }
        updateDOM(elt) {
            elt.style.height = this.height + "px";
            return true;
        }
        get estimatedHeight() { return this.height; }
    }
    function compositionSurroundingNode(view) {
        let sel = view.observer.selectionRange;
        let textNode = sel.focusNode && nearbyTextNode(sel.focusNode, sel.focusOffset, 0);
        if (!textNode)
            return null;
        let cView = view.docView.nearest(textNode);
        if (!cView)
            return null;
        if (cView instanceof LineView) {
            let topNode = textNode;
            while (topNode.parentNode != cView.dom)
                topNode = topNode.parentNode;
            let prev = topNode.previousSibling;
            while (prev && !ContentView.get(prev))
                prev = prev.previousSibling;
            let pos = prev ? ContentView.get(prev).posAtEnd : cView.posAtStart;
            return { from: pos, to: pos, node: topNode, text: textNode };
        }
        else {
            for (;;) {
                let { parent } = cView;
                if (!parent)
                    return null;
                if (parent instanceof LineView)
                    break;
                cView = parent;
            }
            let from = cView.posAtStart;
            return { from, to: from + cView.length, node: cView.dom, text: textNode };
        }
    }
    function computeCompositionDeco(view, changes) {
        let surrounding = compositionSurroundingNode(view);
        if (!surrounding)
            return Decoration.none;
        let { from, to, node, text: textNode } = surrounding;
        let newFrom = changes.mapPos(from, 1), newTo = Math.max(newFrom, changes.mapPos(to, -1));
        let { state } = view, text = node.nodeType == 3 ? node.nodeValue :
            new DOMReader([], state).readRange(node.firstChild, null).text;
        if (newTo - newFrom < text.length) {
            if (state.doc.sliceString(newFrom, Math.min(state.doc.length, newFrom + text.length), LineBreakPlaceholder) == text)
                newTo = newFrom + text.length;
            else if (state.doc.sliceString(Math.max(0, newTo - text.length), newTo, LineBreakPlaceholder) == text)
                newFrom = newTo - text.length;
            else
                return Decoration.none;
        }
        else if (state.doc.sliceString(newFrom, newTo, LineBreakPlaceholder) != text) {
            return Decoration.none;
        }
        let topView = ContentView.get(node);
        if (topView instanceof CompositionView)
            topView = topView.widget.topView;
        else if (topView)
            topView.parent = null;
        return Decoration.set(Decoration.replace({ widget: new CompositionWidget(node, textNode, topView) }).range(newFrom, newTo));
    }
    class CompositionWidget extends WidgetType {
        constructor(top, text, topView) {
            super();
            this.top = top;
            this.text = text;
            this.topView = topView;
        }
        eq(other) { return this.top == other.top && this.text == other.text; }
        toDOM() { return this.top; }
        ignoreEvent() { return false; }
        get customView() { return CompositionView; }
    }
    function nearbyTextNode(node, offset, side) {
        for (;;) {
            if (node.nodeType == 3)
                return node;
            if (node.nodeType == 1 && offset > 0 && side <= 0) {
                node = node.childNodes[offset - 1];
                offset = maxOffset(node);
            }
            else if (node.nodeType == 1 && offset < node.childNodes.length && side >= 0) {
                node = node.childNodes[offset];
                offset = 0;
            }
            else {
                return null;
            }
        }
    }
    function nextToUneditable(node, offset) {
        if (node.nodeType != 1)
            return 0;
        return (offset && node.childNodes[offset - 1].contentEditable == "false" ? 1 /* Before */ : 0) |
            (offset < node.childNodes.length && node.childNodes[offset].contentEditable == "false" ? 2 /* After */ : 0);
    }
    class DecorationComparator$1 {
        constructor() {
            this.changes = [];
        }
        compareRange(from, to) { addRange(from, to, this.changes); }
        comparePoint(from, to) { addRange(from, to, this.changes); }
    }
    function findChangedDeco(a, b, diff) {
        let comp = new DecorationComparator$1;
        RangeSet.compare(a, b, diff, comp);
        return comp.changes;
    }
    function inUneditable(node, inside) {
        for (let cur = node; cur && cur != inside; cur = cur.assignedSlot || cur.parentNode) {
            if (cur.nodeType == 1 && cur.contentEditable == 'false') {
                return true;
            }
        }
        return false;
    }

    function groupAt(state, pos, bias = 1) {
        let categorize = state.charCategorizer(pos);
        let line = state.doc.lineAt(pos), linePos = pos - line.from;
        if (line.length == 0)
            return EditorSelection.cursor(pos);
        if (linePos == 0)
            bias = 1;
        else if (linePos == line.length)
            bias = -1;
        let from = linePos, to = linePos;
        if (bias < 0)
            from = findClusterBreak(line.text, linePos, false);
        else
            to = findClusterBreak(line.text, linePos);
        let cat = categorize(line.text.slice(from, to));
        while (from > 0) {
            let prev = findClusterBreak(line.text, from, false);
            if (categorize(line.text.slice(prev, from)) != cat)
                break;
            from = prev;
        }
        while (to < line.length) {
            let next = findClusterBreak(line.text, to);
            if (categorize(line.text.slice(to, next)) != cat)
                break;
            to = next;
        }
        return EditorSelection.range(from + line.from, to + line.from);
    }
    // Search the DOM for the {node, offset} position closest to the given
    // coordinates. Very inefficient and crude, but can usually be avoided
    // by calling caret(Position|Range)FromPoint instead.
    function getdx(x, rect) {
        return rect.left > x ? rect.left - x : Math.max(0, x - rect.right);
    }
    function getdy(y, rect) {
        return rect.top > y ? rect.top - y : Math.max(0, y - rect.bottom);
    }
    function yOverlap(a, b) {
        return a.top < b.bottom - 1 && a.bottom > b.top + 1;
    }
    function upTop(rect, top) {
        return top < rect.top ? { top, left: rect.left, right: rect.right, bottom: rect.bottom } : rect;
    }
    function upBot(rect, bottom) {
        return bottom > rect.bottom ? { top: rect.top, left: rect.left, right: rect.right, bottom } : rect;
    }
    function domPosAtCoords(parent, x, y) {
        let closest, closestRect, closestX, closestY;
        let above, below, aboveRect, belowRect;
        for (let child = parent.firstChild; child; child = child.nextSibling) {
            let rects = clientRectsFor(child);
            for (let i = 0; i < rects.length; i++) {
                let rect = rects[i];
                if (closestRect && yOverlap(closestRect, rect))
                    rect = upTop(upBot(rect, closestRect.bottom), closestRect.top);
                let dx = getdx(x, rect), dy = getdy(y, rect);
                if (dx == 0 && dy == 0)
                    return child.nodeType == 3 ? domPosInText(child, x, y) : domPosAtCoords(child, x, y);
                if (!closest || closestY > dy || closestY == dy && closestX > dx) {
                    closest = child;
                    closestRect = rect;
                    closestX = dx;
                    closestY = dy;
                }
                if (dx == 0) {
                    if (y > rect.bottom && (!aboveRect || aboveRect.bottom < rect.bottom)) {
                        above = child;
                        aboveRect = rect;
                    }
                    else if (y < rect.top && (!belowRect || belowRect.top > rect.top)) {
                        below = child;
                        belowRect = rect;
                    }
                }
                else if (aboveRect && yOverlap(aboveRect, rect)) {
                    aboveRect = upBot(aboveRect, rect.bottom);
                }
                else if (belowRect && yOverlap(belowRect, rect)) {
                    belowRect = upTop(belowRect, rect.top);
                }
            }
        }
        if (aboveRect && aboveRect.bottom >= y) {
            closest = above;
            closestRect = aboveRect;
        }
        else if (belowRect && belowRect.top <= y) {
            closest = below;
            closestRect = belowRect;
        }
        if (!closest)
            return { node: parent, offset: 0 };
        let clipX = Math.max(closestRect.left, Math.min(closestRect.right, x));
        if (closest.nodeType == 3)
            return domPosInText(closest, clipX, y);
        if (!closestX && closest.contentEditable == "true")
            return domPosAtCoords(closest, clipX, y);
        let offset = Array.prototype.indexOf.call(parent.childNodes, closest) +
            (x >= (closestRect.left + closestRect.right) / 2 ? 1 : 0);
        return { node: parent, offset };
    }
    function domPosInText(node, x, y) {
        let len = node.nodeValue.length;
        let closestOffset = -1, closestDY = 1e9, generalSide = 0;
        for (let i = 0; i < len; i++) {
            let rects = textRange(node, i, i + 1).getClientRects();
            for (let j = 0; j < rects.length; j++) {
                let rect = rects[j];
                if (rect.top == rect.bottom)
                    continue;
                if (!generalSide)
                    generalSide = x - rect.left;
                let dy = (rect.top > y ? rect.top - y : y - rect.bottom) - 1;
                if (rect.left - 1 <= x && rect.right + 1 >= x && dy < closestDY) {
                    let right = x >= (rect.left + rect.right) / 2, after = right;
                    if (browser.chrome || browser.gecko) {
                        // Check for RTL on browsers that support getting client
                        // rects for empty ranges.
                        let rectBefore = textRange(node, i).getBoundingClientRect();
                        if (rectBefore.left == rect.right)
                            after = !right;
                    }
                    if (dy <= 0)
                        return { node, offset: i + (after ? 1 : 0) };
                    closestOffset = i + (after ? 1 : 0);
                    closestDY = dy;
                }
            }
        }
        return { node, offset: closestOffset > -1 ? closestOffset : generalSide > 0 ? node.nodeValue.length : 0 };
    }
    function posAtCoords(view, { x, y }, precise, bias = -1) {
        var _a;
        let content = view.contentDOM.getBoundingClientRect(), docTop = content.top + view.viewState.paddingTop;
        let block, { docHeight } = view.viewState;
        let yOffset = y - docTop;
        if (yOffset < 0)
            return 0;
        if (yOffset > docHeight)
            return view.state.doc.length;
        // Scan for a text block near the queried y position
        for (let halfLine = view.defaultLineHeight / 2, bounced = false;;) {
            block = view.elementAtHeight(yOffset);
            if (block.type == BlockType.Text)
                break;
            for (;;) {
                // Move the y position out of this block
                yOffset = bias > 0 ? block.bottom + halfLine : block.top - halfLine;
                if (yOffset >= 0 && yOffset <= docHeight)
                    break;
                // If the document consists entirely of replaced widgets, we
                // won't find a text block, so return 0
                if (bounced)
                    return precise ? null : 0;
                bounced = true;
                bias = -bias;
            }
        }
        y = docTop + yOffset;
        let lineStart = block.from;
        // If this is outside of the rendered viewport, we can't determine a position
        if (lineStart < view.viewport.from)
            return view.viewport.from == 0 ? 0 : precise ? null : posAtCoordsImprecise(view, content, block, x, y);
        if (lineStart > view.viewport.to)
            return view.viewport.to == view.state.doc.length ? view.state.doc.length :
                precise ? null : posAtCoordsImprecise(view, content, block, x, y);
        // Prefer ShadowRootOrDocument.elementFromPoint if present, fall back to document if not
        let doc = view.dom.ownerDocument;
        let root = view.root.elementFromPoint ? view.root : doc;
        let element = root.elementFromPoint(x, y);
        if (element && !view.contentDOM.contains(element))
            element = null;
        // If the element is unexpected, clip x at the sides of the content area and try again
        if (!element) {
            x = Math.max(content.left + 1, Math.min(content.right - 1, x));
            element = root.elementFromPoint(x, y);
            if (element && !view.contentDOM.contains(element))
                element = null;
        }
        // There's visible editor content under the point, so we can try
        // using caret(Position|Range)FromPoint as a shortcut
        let node, offset = -1;
        if (element && ((_a = view.docView.nearest(element)) === null || _a === void 0 ? void 0 : _a.isEditable) != false) {
            if (doc.caretPositionFromPoint) {
                let pos = doc.caretPositionFromPoint(x, y);
                if (pos)
                    ({ offsetNode: node, offset } = pos);
            }
            else if (doc.caretRangeFromPoint) {
                let range = doc.caretRangeFromPoint(x, y);
                if (range) {
                    ({ startContainer: node, startOffset: offset } = range);
                    if (browser.safari && isSuspiciousCaretResult(node, offset, x))
                        node = undefined;
                }
            }
        }
        // No luck, do our own (potentially expensive) search
        if (!node || !view.docView.dom.contains(node)) {
            let line = LineView.find(view.docView, lineStart);
            if (!line)
                return yOffset > block.top + block.height / 2 ? block.to : block.from;
            ({ node, offset } = domPosAtCoords(line.dom, x, y));
        }
        return view.docView.posFromDOM(node, offset);
    }
    function posAtCoordsImprecise(view, contentRect, block, x, y) {
        let into = Math.round((x - contentRect.left) * view.defaultCharacterWidth);
        if (view.lineWrapping && block.height > view.defaultLineHeight * 1.5) {
            let line = Math.floor((y - block.top) / view.defaultLineHeight);
            into += line * view.viewState.heightOracle.lineLength;
        }
        let content = view.state.sliceDoc(block.from, block.to);
        return block.from + findColumn(content, into, view.state.tabSize);
    }
    // In case of a high line height, Safari's caretRangeFromPoint treats
    // the space between lines as belonging to the last character of the
    // line before. This is used to detect such a result so that it can be
    // ignored (issue #401).
    function isSuspiciousCaretResult(node, offset, x) {
        let len;
        if (node.nodeType != 3 || offset != (len = node.nodeValue.length))
            return false;
        for (let next = node.nextSibling; next; next = next.nextSibling)
            if (next.nodeType != 1 || next.nodeName != "BR")
                return false;
        return textRange(node, len - 1, len).getBoundingClientRect().left > x;
    }
    function moveToLineBoundary(view, start, forward, includeWrap) {
        let line = view.state.doc.lineAt(start.head);
        let coords = !includeWrap || !view.lineWrapping ? null
            : view.coordsAtPos(start.assoc < 0 && start.head > line.from ? start.head - 1 : start.head);
        if (coords) {
            let editorRect = view.dom.getBoundingClientRect();
            let pos = view.posAtCoords({ x: forward == (view.textDirection == Direction.LTR) ? editorRect.right - 1 : editorRect.left + 1,
                y: (coords.top + coords.bottom) / 2 });
            if (pos != null)
                return EditorSelection.cursor(pos, forward ? -1 : 1);
        }
        let lineView = LineView.find(view.docView, start.head);
        let end = lineView ? (forward ? lineView.posAtEnd : lineView.posAtStart) : (forward ? line.to : line.from);
        return EditorSelection.cursor(end, forward ? -1 : 1);
    }
    function moveByChar(view, start, forward, by) {
        let line = view.state.doc.lineAt(start.head), spans = view.bidiSpans(line);
        for (let cur = start, check = null;;) {
            let next = moveVisually(line, spans, view.textDirection, cur, forward), char = movedOver;
            if (!next) {
                if (line.number == (forward ? view.state.doc.lines : 1))
                    return cur;
                char = "\n";
                line = view.state.doc.line(line.number + (forward ? 1 : -1));
                spans = view.bidiSpans(line);
                next = EditorSelection.cursor(forward ? line.from : line.to);
            }
            if (!check) {
                if (!by)
                    return next;
                check = by(char);
            }
            else if (!check(char)) {
                return cur;
            }
            cur = next;
        }
    }
    function byGroup(view, pos, start) {
        let categorize = view.state.charCategorizer(pos);
        let cat = categorize(start);
        return (next) => {
            let nextCat = categorize(next);
            if (cat == CharCategory.Space)
                cat = nextCat;
            return cat == nextCat;
        };
    }
    function moveVertically(view, start, forward, distance) {
        let startPos = start.head, dir = forward ? 1 : -1;
        if (startPos == (forward ? view.state.doc.length : 0))
            return EditorSelection.cursor(startPos, start.assoc);
        let goal = start.goalColumn, startY;
        let rect = view.contentDOM.getBoundingClientRect();
        let startCoords = view.coordsAtPos(startPos), docTop = view.documentTop;
        if (startCoords) {
            if (goal == null)
                goal = startCoords.left - rect.left;
            startY = dir < 0 ? startCoords.top : startCoords.bottom;
        }
        else {
            let line = view.viewState.lineBlockAt(startPos - docTop);
            if (goal == null)
                goal = Math.min(rect.right - rect.left, view.defaultCharacterWidth * (startPos - line.from));
            startY = (dir < 0 ? line.top : line.bottom) + docTop;
        }
        let resolvedGoal = rect.left + goal;
        let dist = distance !== null && distance !== void 0 ? distance : (view.defaultLineHeight >> 1);
        for (let extra = 0;; extra += 10) {
            let curY = startY + (dist + extra) * dir;
            let pos = posAtCoords(view, { x: resolvedGoal, y: curY }, false, dir);
            if (curY < rect.top || curY > rect.bottom || (dir < 0 ? pos < startPos : pos > startPos))
                return EditorSelection.cursor(pos, start.assoc, undefined, goal);
        }
    }
    function skipAtoms(view, oldPos, pos) {
        let atoms = view.pluginField(PluginField.atomicRanges);
        for (;;) {
            let moved = false;
            for (let set of atoms) {
                set.between(pos.from - 1, pos.from + 1, (from, to, value) => {
                    if (pos.from > from && pos.from < to) {
                        pos = oldPos.from > pos.from ? EditorSelection.cursor(from, 1) : EditorSelection.cursor(to, -1);
                        moved = true;
                    }
                });
            }
            if (!moved)
                return pos;
        }
    }

    // This will also be where dragging info and such goes
    class InputState {
        constructor(view) {
            this.lastKeyCode = 0;
            this.lastKeyTime = 0;
            // On iOS, some keys need to have their default behavior happen
            // (after which we retroactively handle them and reset the DOM) to
            // avoid messing up the virtual keyboard state.
            this.pendingIOSKey = undefined;
            this.lastSelectionOrigin = null;
            this.lastSelectionTime = 0;
            this.lastEscPress = 0;
            this.lastContextMenu = 0;
            this.scrollHandlers = [];
            this.registeredEvents = [];
            this.customHandlers = [];
            // -1 means not in a composition. Otherwise, this counts the number
            // of changes made during the composition. The count is used to
            // avoid treating the start state of the composition, before any
            // changes have been made, as part of the composition.
            this.composing = -1;
            // Tracks whether the next change should be marked as starting the
            // composition (null means no composition, true means next is the
            // first, false means first has already been marked for this
            // composition)
            this.compositionFirstChange = null;
            this.compositionEndedAt = 0;
            this.rapidCompositionStart = false;
            this.mouseSelection = null;
            for (let type in handlers) {
                let handler = handlers[type];
                view.contentDOM.addEventListener(type, (event) => {
                    if (type == "keydown" && this.keydown(view, event))
                        return;
                    if (!eventBelongsToEditor(view, event) || this.ignoreDuringComposition(event))
                        return;
                    if (this.mustFlushObserver(event))
                        view.observer.forceFlush();
                    if (this.runCustomHandlers(type, view, event))
                        event.preventDefault();
                    else
                        handler(view, event);
                });
                this.registeredEvents.push(type);
            }
            this.notifiedFocused = view.hasFocus;
            this.ensureHandlers(view);
            // On Safari adding an input event handler somehow prevents an
            // issue where the composition vanishes when you press enter.
            if (browser.safari)
                view.contentDOM.addEventListener("input", () => null);
        }
        setSelectionOrigin(origin) {
            this.lastSelectionOrigin = origin;
            this.lastSelectionTime = Date.now();
        }
        ensureHandlers(view) {
            let handlers = this.customHandlers = view.pluginField(domEventHandlers);
            for (let set of handlers) {
                for (let type in set.handlers)
                    if (this.registeredEvents.indexOf(type) < 0 && type != "scroll") {
                        this.registeredEvents.push(type);
                        view.contentDOM.addEventListener(type, (event) => {
                            if (!eventBelongsToEditor(view, event))
                                return;
                            if (this.runCustomHandlers(type, view, event))
                                event.preventDefault();
                        });
                    }
            }
        }
        runCustomHandlers(type, view, event) {
            for (let set of this.customHandlers) {
                let handler = set.handlers[type];
                if (handler) {
                    try {
                        if (handler.call(set.plugin, event, view) || event.defaultPrevented)
                            return true;
                    }
                    catch (e) {
                        logException(view.state, e);
                    }
                }
            }
            return false;
        }
        runScrollHandlers(view, event) {
            for (let set of this.customHandlers) {
                let handler = set.handlers.scroll;
                if (handler) {
                    try {
                        handler.call(set.plugin, event, view);
                    }
                    catch (e) {
                        logException(view.state, e);
                    }
                }
            }
        }
        keydown(view, event) {
            // Must always run, even if a custom handler handled the event
            this.lastKeyCode = event.keyCode;
            this.lastKeyTime = Date.now();
            if (this.screenKeyEvent(view, event))
                return true;
            // Chrome for Android usually doesn't fire proper key events, but
            // occasionally does, usually surrounded by a bunch of complicated
            // composition changes. When an enter or backspace key event is
            // seen, hold off on handling DOM events for a bit, and then
            // dispatch it.
            if (browser.android && browser.chrome && !event.synthetic &&
                (event.keyCode == 13 || event.keyCode == 8)) {
                view.observer.delayAndroidKey(event.key, event.keyCode);
                return true;
            }
            // Prevent the default behavior of Enter on iOS makes the
            // virtual keyboard get stuck in the wrong (lowercase)
            // state. So we let it go through, and then, in
            // applyDOMChange, notify key handlers of it and reset to
            // the state they produce.
            let pending;
            if (browser.ios && (pending = PendingKeys.find(key => key.keyCode == event.keyCode)) &&
                !(event.ctrlKey || event.altKey || event.metaKey) && !event.synthetic) {
                this.pendingIOSKey = pending;
                setTimeout(() => this.flushIOSKey(view), 250);
                return true;
            }
            return false;
        }
        flushIOSKey(view) {
            let key = this.pendingIOSKey;
            if (!key)
                return false;
            this.pendingIOSKey = undefined;
            return dispatchKey(view.contentDOM, key.key, key.keyCode);
        }
        ignoreDuringComposition(event) {
            if (!/^key/.test(event.type))
                return false;
            if (this.composing > 0)
                return true;
            // See https://www.stum.de/2016/06/24/handling-ime-events-in-javascript/.
            // On some input method editors (IMEs), the Enter key is used to
            // confirm character selection. On Safari, when Enter is pressed,
            // compositionend and keydown events are sometimes emitted in the
            // wrong order. The key event should still be ignored, even when
            // it happens after the compositionend event.
            if (browser.safari && Date.now() - this.compositionEndedAt < 500) {
                this.compositionEndedAt = 0;
                return true;
            }
            return false;
        }
        screenKeyEvent(view, event) {
            let protectedTab = event.keyCode == 9 && Date.now() < this.lastEscPress + 2000;
            if (event.keyCode == 27)
                this.lastEscPress = Date.now();
            else if (modifierCodes.indexOf(event.keyCode) < 0)
                this.lastEscPress = 0;
            return protectedTab;
        }
        mustFlushObserver(event) {
            return (event.type == "keydown" && event.keyCode != 229) ||
                event.type == "compositionend" && !browser.ios;
        }
        startMouseSelection(mouseSelection) {
            if (this.mouseSelection)
                this.mouseSelection.destroy();
            this.mouseSelection = mouseSelection;
        }
        update(update) {
            if (this.mouseSelection)
                this.mouseSelection.update(update);
            if (update.transactions.length)
                this.lastKeyCode = this.lastSelectionTime = 0;
        }
        destroy() {
            if (this.mouseSelection)
                this.mouseSelection.destroy();
        }
    }
    const PendingKeys = [
        { key: "Backspace", keyCode: 8, inputType: "deleteContentBackward" },
        { key: "Enter", keyCode: 13, inputType: "insertParagraph" },
        { key: "Delete", keyCode: 46, inputType: "deleteContentForward" }
    ];
    // Key codes for modifier keys
    const modifierCodes = [16, 17, 18, 20, 91, 92, 224, 225];
    class MouseSelection {
        constructor(view, startEvent, style, mustSelect) {
            this.view = view;
            this.style = style;
            this.mustSelect = mustSelect;
            this.lastEvent = startEvent;
            let doc = view.contentDOM.ownerDocument;
            doc.addEventListener("mousemove", this.move = this.move.bind(this));
            doc.addEventListener("mouseup", this.up = this.up.bind(this));
            this.extend = startEvent.shiftKey;
            this.multiple = view.state.facet(EditorState.allowMultipleSelections) && addsSelectionRange(view, startEvent);
            this.dragMove = dragMovesSelection(view, startEvent);
            this.dragging = isInPrimarySelection(view, startEvent) && getClickType(startEvent) == 1 ? null : false;
            // When clicking outside of the selection, immediately apply the
            // effect of starting the selection
            if (this.dragging === false) {
                startEvent.preventDefault();
                this.select(startEvent);
            }
        }
        move(event) {
            if (event.buttons == 0)
                return this.destroy();
            if (this.dragging !== false)
                return;
            this.select(this.lastEvent = event);
        }
        up(event) {
            if (this.dragging == null)
                this.select(this.lastEvent);
            if (!this.dragging)
                event.preventDefault();
            this.destroy();
        }
        destroy() {
            let doc = this.view.contentDOM.ownerDocument;
            doc.removeEventListener("mousemove", this.move);
            doc.removeEventListener("mouseup", this.up);
            this.view.inputState.mouseSelection = null;
        }
        select(event) {
            let selection = this.style.get(event, this.extend, this.multiple);
            if (this.mustSelect || !selection.eq(this.view.state.selection) ||
                selection.main.assoc != this.view.state.selection.main.assoc)
                this.view.dispatch({
                    selection,
                    userEvent: "select.pointer",
                    scrollIntoView: true
                });
            this.mustSelect = false;
        }
        update(update) {
            if (update.docChanged && this.dragging)
                this.dragging = this.dragging.map(update.changes);
            if (this.style.update(update))
                setTimeout(() => this.select(this.lastEvent), 20);
        }
    }
    function addsSelectionRange(view, event) {
        let facet = view.state.facet(clickAddsSelectionRange);
        return facet.length ? facet[0](event) : browser.mac ? event.metaKey : event.ctrlKey;
    }
    function dragMovesSelection(view, event) {
        let facet = view.state.facet(dragMovesSelection$1);
        return facet.length ? facet[0](event) : browser.mac ? !event.altKey : !event.ctrlKey;
    }
    function isInPrimarySelection(view, event) {
        let { main } = view.state.selection;
        if (main.empty)
            return false;
        // On boundary clicks, check whether the coordinates are inside the
        // selection's client rectangles
        let sel = getSelection(view.root);
        if (sel.rangeCount == 0)
            return true;
        let rects = sel.getRangeAt(0).getClientRects();
        for (let i = 0; i < rects.length; i++) {
            let rect = rects[i];
            if (rect.left <= event.clientX && rect.right >= event.clientX &&
                rect.top <= event.clientY && rect.bottom >= event.clientY)
                return true;
        }
        return false;
    }
    function eventBelongsToEditor(view, event) {
        if (!event.bubbles)
            return true;
        if (event.defaultPrevented)
            return false;
        for (let node = event.target, cView; node != view.contentDOM; node = node.parentNode)
            if (!node || node.nodeType == 11 || ((cView = ContentView.get(node)) && cView.ignoreEvent(event)))
                return false;
        return true;
    }
    const handlers = /*@__PURE__*/Object.create(null);
    // This is very crude, but unfortunately both these browsers _pretend_
    // that they have a clipboard API—all the objects and methods are
    // there, they just don't work, and they are hard to test.
    const brokenClipboardAPI = (browser.ie && browser.ie_version < 15) ||
        (browser.ios && browser.webkit_version < 604);
    function capturePaste(view) {
        let parent = view.dom.parentNode;
        if (!parent)
            return;
        let target = parent.appendChild(document.createElement("textarea"));
        target.style.cssText = "position: fixed; left: -10000px; top: 10px";
        target.focus();
        setTimeout(() => {
            view.focus();
            target.remove();
            doPaste(view, target.value);
        }, 50);
    }
    function doPaste(view, input) {
        let { state } = view, changes, i = 1, text = state.toText(input);
        let byLine = text.lines == state.selection.ranges.length;
        let linewise = lastLinewiseCopy != null && state.selection.ranges.every(r => r.empty) && lastLinewiseCopy == text.toString();
        if (linewise) {
            let lastLine = -1;
            changes = state.changeByRange(range => {
                let line = state.doc.lineAt(range.from);
                if (line.from == lastLine)
                    return { range };
                lastLine = line.from;
                let insert = state.toText((byLine ? text.line(i++).text : input) + state.lineBreak);
                return { changes: { from: line.from, insert },
                    range: EditorSelection.cursor(range.from + insert.length) };
            });
        }
        else if (byLine) {
            changes = state.changeByRange(range => {
                let line = text.line(i++);
                return { changes: { from: range.from, to: range.to, insert: line.text },
                    range: EditorSelection.cursor(range.from + line.length) };
            });
        }
        else {
            changes = state.replaceSelection(text);
        }
        view.dispatch(changes, {
            userEvent: "input.paste",
            scrollIntoView: true
        });
    }
    handlers.keydown = (view, event) => {
        view.inputState.setSelectionOrigin("select");
    };
    let lastTouch = 0;
    handlers.touchstart = (view, e) => {
        lastTouch = Date.now();
        view.inputState.setSelectionOrigin("select.pointer");
    };
    handlers.touchmove = view => {
        view.inputState.setSelectionOrigin("select.pointer");
    };
    handlers.mousedown = (view, event) => {
        view.observer.flush();
        if (lastTouch > Date.now() - 2000 && getClickType(event) == 1)
            return; // Ignore touch interaction
        let style = null;
        for (let makeStyle of view.state.facet(mouseSelectionStyle)) {
            style = makeStyle(view, event);
            if (style)
                break;
        }
        if (!style && event.button == 0)
            style = basicMouseSelection(view, event);
        if (style) {
            let mustFocus = view.root.activeElement != view.contentDOM;
            if (mustFocus)
                view.observer.ignore(() => focusPreventScroll(view.contentDOM));
            view.inputState.startMouseSelection(new MouseSelection(view, event, style, mustFocus));
        }
    };
    function rangeForClick(view, pos, bias, type) {
        if (type == 1) { // Single click
            return EditorSelection.cursor(pos, bias);
        }
        else if (type == 2) { // Double click
            return groupAt(view.state, pos, bias);
        }
        else { // Triple click
            let visual = LineView.find(view.docView, pos), line = view.state.doc.lineAt(visual ? visual.posAtEnd : pos);
            let from = visual ? visual.posAtStart : line.from, to = visual ? visual.posAtEnd : line.to;
            if (to < view.state.doc.length && to == line.to)
                to++;
            return EditorSelection.range(from, to);
        }
    }
    let insideY = (y, rect) => y >= rect.top && y <= rect.bottom;
    let inside = (x, y, rect) => insideY(y, rect) && x >= rect.left && x <= rect.right;
    // Try to determine, for the given coordinates, associated with the
    // given position, whether they are related to the element before or
    // the element after the position.
    function findPositionSide(view, pos, x, y) {
        let line = LineView.find(view.docView, pos);
        if (!line)
            return 1;
        let off = pos - line.posAtStart;
        // Line boundaries point into the line
        if (off == 0)
            return 1;
        if (off == line.length)
            return -1;
        // Positions on top of an element point at that element
        let before = line.coordsAt(off, -1);
        if (before && inside(x, y, before))
            return -1;
        let after = line.coordsAt(off, 1);
        if (after && inside(x, y, after))
            return 1;
        // This is probably a line wrap point. Pick before if the point is
        // beside it.
        return before && insideY(y, before) ? -1 : 1;
    }
    function queryPos(view, event) {
        let pos = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
        return { pos, bias: findPositionSide(view, pos, event.clientX, event.clientY) };
    }
    const BadMouseDetail = browser.ie && browser.ie_version <= 11;
    let lastMouseDown = null, lastMouseDownCount = 0, lastMouseDownTime = 0;
    function getClickType(event) {
        if (!BadMouseDetail)
            return event.detail;
        let last = lastMouseDown, lastTime = lastMouseDownTime;
        lastMouseDown = event;
        lastMouseDownTime = Date.now();
        return lastMouseDownCount = !last || (lastTime > Date.now() - 400 && Math.abs(last.clientX - event.clientX) < 2 &&
            Math.abs(last.clientY - event.clientY) < 2) ? (lastMouseDownCount + 1) % 3 : 1;
    }
    function basicMouseSelection(view, event) {
        let start = queryPos(view, event), type = getClickType(event);
        let startSel = view.state.selection;
        let last = start, lastEvent = event;
        return {
            update(update) {
                if (update.docChanged) {
                    if (start)
                        start.pos = update.changes.mapPos(start.pos);
                    startSel = startSel.map(update.changes);
                    lastEvent = null;
                }
            },
            get(event, extend, multiple) {
                let cur;
                if (lastEvent && event.clientX == lastEvent.clientX && event.clientY == lastEvent.clientY)
                    cur = last;
                else {
                    cur = last = queryPos(view, event);
                    lastEvent = event;
                }
                if (!cur || !start)
                    return startSel;
                let range = rangeForClick(view, cur.pos, cur.bias, type);
                if (start.pos != cur.pos && !extend) {
                    let startRange = rangeForClick(view, start.pos, start.bias, type);
                    let from = Math.min(startRange.from, range.from), to = Math.max(startRange.to, range.to);
                    range = from < range.from ? EditorSelection.range(from, to) : EditorSelection.range(to, from);
                }
                if (extend)
                    return startSel.replaceRange(startSel.main.extend(range.from, range.to));
                else if (multiple)
                    return startSel.addRange(range);
                else
                    return EditorSelection.create([range]);
            }
        };
    }
    handlers.dragstart = (view, event) => {
        let { selection: { main } } = view.state;
        let { mouseSelection } = view.inputState;
        if (mouseSelection)
            mouseSelection.dragging = main;
        if (event.dataTransfer) {
            event.dataTransfer.setData("Text", view.state.sliceDoc(main.from, main.to));
            event.dataTransfer.effectAllowed = "copyMove";
        }
    };
    function dropText(view, event, text, direct) {
        if (!text)
            return;
        let dropPos = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
        event.preventDefault();
        let { mouseSelection } = view.inputState;
        let del = direct && mouseSelection && mouseSelection.dragging && mouseSelection.dragMove ?
            { from: mouseSelection.dragging.from, to: mouseSelection.dragging.to } : null;
        let ins = { from: dropPos, insert: text };
        let changes = view.state.changes(del ? [del, ins] : ins);
        view.focus();
        view.dispatch({
            changes,
            selection: { anchor: changes.mapPos(dropPos, -1), head: changes.mapPos(dropPos, 1) },
            userEvent: del ? "move.drop" : "input.drop"
        });
    }
    handlers.drop = (view, event) => {
        if (!event.dataTransfer)
            return;
        if (view.state.readOnly)
            return event.preventDefault();
        let files = event.dataTransfer.files;
        if (files && files.length) { // For a file drop, read the file's text.
            event.preventDefault();
            let text = Array(files.length), read = 0;
            let finishFile = () => {
                if (++read == files.length)
                    dropText(view, event, text.filter(s => s != null).join(view.state.lineBreak), false);
            };
            for (let i = 0; i < files.length; i++) {
                let reader = new FileReader;
                reader.onerror = finishFile;
                reader.onload = () => {
                    if (!/[\x00-\x08\x0e-\x1f]{2}/.test(reader.result))
                        text[i] = reader.result;
                    finishFile();
                };
                reader.readAsText(files[i]);
            }
        }
        else {
            dropText(view, event, event.dataTransfer.getData("Text"), true);
        }
    };
    handlers.paste = (view, event) => {
        if (view.state.readOnly)
            return event.preventDefault();
        view.observer.flush();
        let data = brokenClipboardAPI ? null : event.clipboardData;
        if (data) {
            doPaste(view, data.getData("text/plain"));
            event.preventDefault();
        }
        else {
            capturePaste(view);
        }
    };
    function captureCopy(view, text) {
        // The extra wrapper is somehow necessary on IE/Edge to prevent the
        // content from being mangled when it is put onto the clipboard
        let parent = view.dom.parentNode;
        if (!parent)
            return;
        let target = parent.appendChild(document.createElement("textarea"));
        target.style.cssText = "position: fixed; left: -10000px; top: 10px";
        target.value = text;
        target.focus();
        target.selectionEnd = text.length;
        target.selectionStart = 0;
        setTimeout(() => {
            target.remove();
            view.focus();
        }, 50);
    }
    function copiedRange(state) {
        let content = [], ranges = [], linewise = false;
        for (let range of state.selection.ranges)
            if (!range.empty) {
                content.push(state.sliceDoc(range.from, range.to));
                ranges.push(range);
            }
        if (!content.length) {
            // Nothing selected, do a line-wise copy
            let upto = -1;
            for (let { from } of state.selection.ranges) {
                let line = state.doc.lineAt(from);
                if (line.number > upto) {
                    content.push(line.text);
                    ranges.push({ from: line.from, to: Math.min(state.doc.length, line.to + 1) });
                }
                upto = line.number;
            }
            linewise = true;
        }
        return { text: content.join(state.lineBreak), ranges, linewise };
    }
    let lastLinewiseCopy = null;
    handlers.copy = handlers.cut = (view, event) => {
        let { text, ranges, linewise } = copiedRange(view.state);
        if (!text && !linewise)
            return;
        lastLinewiseCopy = linewise ? text : null;
        let data = brokenClipboardAPI ? null : event.clipboardData;
        if (data) {
            event.preventDefault();
            data.clearData();
            data.setData("text/plain", text);
        }
        else {
            captureCopy(view, text);
        }
        if (event.type == "cut" && !view.state.readOnly)
            view.dispatch({
                changes: ranges,
                scrollIntoView: true,
                userEvent: "delete.cut"
            });
    };
    handlers.focus = handlers.blur = view => {
        setTimeout(() => {
            if (view.hasFocus != view.inputState.notifiedFocused)
                view.update([]);
        }, 10);
    };
    handlers.beforeprint = view => {
        view.viewState.printing = true;
        view.requestMeasure();
        setTimeout(() => {
            view.viewState.printing = false;
            view.requestMeasure();
        }, 2000);
    };
    function forceClearComposition(view, rapid) {
        if (view.docView.compositionDeco.size) {
            view.inputState.rapidCompositionStart = rapid;
            try {
                view.update([]);
            }
            finally {
                view.inputState.rapidCompositionStart = false;
            }
        }
    }
    handlers.compositionstart = handlers.compositionupdate = view => {
        if (view.inputState.compositionFirstChange == null)
            view.inputState.compositionFirstChange = true;
        if (view.inputState.composing < 0) {
            // FIXME possibly set a timeout to clear it again on Android
            view.inputState.composing = 0;
            if (view.docView.compositionDeco.size) {
                view.observer.flush();
                forceClearComposition(view, true);
            }
        }
    };
    handlers.compositionend = view => {
        view.inputState.composing = -1;
        view.inputState.compositionEndedAt = Date.now();
        view.inputState.compositionFirstChange = null;
        setTimeout(() => {
            if (view.inputState.composing < 0)
                forceClearComposition(view, false);
        }, 50);
    };
    handlers.contextmenu = view => {
        view.inputState.lastContextMenu = Date.now();
    };
    handlers.beforeinput = (view, event) => {
        var _a;
        // Because Chrome Android doesn't fire useful key events, use
        // beforeinput to detect backspace (and possibly enter and delete,
        // but those usually don't even seem to fire beforeinput events at
        // the moment) and fake a key event for it.
        //
        // (preventDefault on beforeinput, though supported in the spec,
        // seems to do nothing at all on Chrome).
        let pending;
        if (browser.chrome && browser.android && (pending = PendingKeys.find(key => key.inputType == event.inputType))) {
            view.observer.delayAndroidKey(pending.key, pending.keyCode);
            if (pending.key == "Backspace" || pending.key == "Delete") {
                let startViewHeight = ((_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.height) || 0;
                setTimeout(() => {
                    var _a;
                    // Backspacing near uneditable nodes on Chrome Android sometimes
                    // closes the virtual keyboard. This tries to crudely detect
                    // that and refocus to get it back.
                    if ((((_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.height) || 0) > startViewHeight + 10 && view.hasFocus) {
                        view.contentDOM.blur();
                        view.focus();
                    }
                }, 100);
            }
        }
    };

    const wrappingWhiteSpace = ["pre-wrap", "normal", "pre-line", "break-spaces"];
    class HeightOracle {
        constructor() {
            this.doc = Text.empty;
            this.lineWrapping = false;
            this.direction = Direction.LTR;
            this.heightSamples = {};
            this.lineHeight = 14;
            this.charWidth = 7;
            this.lineLength = 30;
            // Used to track, during updateHeight, if any actual heights changed
            this.heightChanged = false;
        }
        heightForGap(from, to) {
            let lines = this.doc.lineAt(to).number - this.doc.lineAt(from).number + 1;
            if (this.lineWrapping)
                lines += Math.ceil(((to - from) - (lines * this.lineLength * 0.5)) / this.lineLength);
            return this.lineHeight * lines;
        }
        heightForLine(length) {
            if (!this.lineWrapping)
                return this.lineHeight;
            let lines = 1 + Math.max(0, Math.ceil((length - this.lineLength) / (this.lineLength - 5)));
            return lines * this.lineHeight;
        }
        setDoc(doc) { this.doc = doc; return this; }
        mustRefreshForStyle(whiteSpace, direction) {
            return (wrappingWhiteSpace.indexOf(whiteSpace) > -1) != this.lineWrapping || this.direction != direction;
        }
        mustRefreshForHeights(lineHeights) {
            let newHeight = false;
            for (let i = 0; i < lineHeights.length; i++) {
                let h = lineHeights[i];
                if (h < 0) {
                    i++;
                }
                else if (!this.heightSamples[Math.floor(h * 10)]) { // Round to .1 pixels
                    newHeight = true;
                    this.heightSamples[Math.floor(h * 10)] = true;
                }
            }
            return newHeight;
        }
        refresh(whiteSpace, direction, lineHeight, charWidth, lineLength, knownHeights) {
            let lineWrapping = wrappingWhiteSpace.indexOf(whiteSpace) > -1;
            let changed = Math.round(lineHeight) != Math.round(this.lineHeight) ||
                this.lineWrapping != lineWrapping ||
                this.direction != direction;
            this.lineWrapping = lineWrapping;
            this.direction = direction;
            this.lineHeight = lineHeight;
            this.charWidth = charWidth;
            this.lineLength = lineLength;
            if (changed) {
                this.heightSamples = {};
                for (let i = 0; i < knownHeights.length; i++) {
                    let h = knownHeights[i];
                    if (h < 0)
                        i++;
                    else
                        this.heightSamples[Math.floor(h * 10)] = true;
                }
            }
            return changed;
        }
    }
    // This object is used by `updateHeight` to make DOM measurements
    // arrive at the right nides. The `heights` array is a sequence of
    // block heights, starting from position `from`.
    class MeasuredHeights {
        constructor(from, heights) {
            this.from = from;
            this.heights = heights;
            this.index = 0;
        }
        get more() { return this.index < this.heights.length; }
    }
    /**
    Record used to represent information about a block-level element
    in the editor view.
    */
    class BlockInfo {
        /**
        @internal
        */
        constructor(
        /**
        The start of the element in the document.
        */
        from, 
        /**
        The length of the element.
        */
        length, 
        /**
        The top position of the element (relative to the top of the
        document).
        */
        top, 
        /**
        Its height.
        */
        height, 
        /**
        The type of element this is. When querying lines, this may be
        an array of all the blocks that make up the line.
        */
        type) {
            this.from = from;
            this.length = length;
            this.top = top;
            this.height = height;
            this.type = type;
        }
        /**
        The end of the element as a document position.
        */
        get to() { return this.from + this.length; }
        /**
        The bottom position of the element.
        */
        get bottom() { return this.top + this.height; }
        /**
        @internal
        */
        join(other) {
            let detail = (Array.isArray(this.type) ? this.type : [this])
                .concat(Array.isArray(other.type) ? other.type : [other]);
            return new BlockInfo(this.from, this.length + other.length, this.top, this.height + other.height, detail);
        }
        /**
        FIXME remove on next breaking release @internal
        */
        moveY(offset) {
            return !offset ? this : new BlockInfo(this.from, this.length, this.top + offset, this.height, Array.isArray(this.type) ? this.type.map(b => b.moveY(offset)) : this.type);
        }
    }
    var QueryType$1 = /*@__PURE__*/(function (QueryType) {
        QueryType[QueryType["ByPos"] = 0] = "ByPos";
        QueryType[QueryType["ByHeight"] = 1] = "ByHeight";
        QueryType[QueryType["ByPosNoHeight"] = 2] = "ByPosNoHeight";
    return QueryType})(QueryType$1 || (QueryType$1 = {}));
    const Epsilon = 1e-3;
    class HeightMap {
        constructor(length, // The number of characters covered
        height, // Height of this part of the document
        flags = 2 /* Outdated */) {
            this.length = length;
            this.height = height;
            this.flags = flags;
        }
        get outdated() { return (this.flags & 2 /* Outdated */) > 0; }
        set outdated(value) { this.flags = (value ? 2 /* Outdated */ : 0) | (this.flags & ~2 /* Outdated */); }
        setHeight(oracle, height) {
            if (this.height != height) {
                if (Math.abs(this.height - height) > Epsilon)
                    oracle.heightChanged = true;
                this.height = height;
            }
        }
        // Base case is to replace a leaf node, which simply builds a tree
        // from the new nodes and returns that (HeightMapBranch and
        // HeightMapGap override this to actually use from/to)
        replace(_from, _to, nodes) {
            return HeightMap.of(nodes);
        }
        // Again, these are base cases, and are overridden for branch and gap nodes.
        decomposeLeft(_to, result) { result.push(this); }
        decomposeRight(_from, result) { result.push(this); }
        applyChanges(decorations, oldDoc, oracle, changes) {
            let me = this;
            for (let i = changes.length - 1; i >= 0; i--) {
                let { fromA, toA, fromB, toB } = changes[i];
                let start = me.lineAt(fromA, QueryType$1.ByPosNoHeight, oldDoc, 0, 0);
                let end = start.to >= toA ? start : me.lineAt(toA, QueryType$1.ByPosNoHeight, oldDoc, 0, 0);
                toB += end.to - toA;
                toA = end.to;
                while (i > 0 && start.from <= changes[i - 1].toA) {
                    fromA = changes[i - 1].fromA;
                    fromB = changes[i - 1].fromB;
                    i--;
                    if (fromA < start.from)
                        start = me.lineAt(fromA, QueryType$1.ByPosNoHeight, oldDoc, 0, 0);
                }
                fromB += start.from - fromA;
                fromA = start.from;
                let nodes = NodeBuilder.build(oracle, decorations, fromB, toB);
                me = me.replace(fromA, toA, nodes);
            }
            return me.updateHeight(oracle, 0);
        }
        static empty() { return new HeightMapText(0, 0); }
        // nodes uses null values to indicate the position of line breaks.
        // There are never line breaks at the start or end of the array, or
        // two line breaks next to each other, and the array isn't allowed
        // to be empty (same restrictions as return value from the builder).
        static of(nodes) {
            if (nodes.length == 1)
                return nodes[0];
            let i = 0, j = nodes.length, before = 0, after = 0;
            for (;;) {
                if (i == j) {
                    if (before > after * 2) {
                        let split = nodes[i - 1];
                        if (split.break)
                            nodes.splice(--i, 1, split.left, null, split.right);
                        else
                            nodes.splice(--i, 1, split.left, split.right);
                        j += 1 + split.break;
                        before -= split.size;
                    }
                    else if (after > before * 2) {
                        let split = nodes[j];
                        if (split.break)
                            nodes.splice(j, 1, split.left, null, split.right);
                        else
                            nodes.splice(j, 1, split.left, split.right);
                        j += 2 + split.break;
                        after -= split.size;
                    }
                    else {
                        break;
                    }
                }
                else if (before < after) {
                    let next = nodes[i++];
                    if (next)
                        before += next.size;
                }
                else {
                    let next = nodes[--j];
                    if (next)
                        after += next.size;
                }
            }
            let brk = 0;
            if (nodes[i - 1] == null) {
                brk = 1;
                i--;
            }
            else if (nodes[i] == null) {
                brk = 1;
                j++;
            }
            return new HeightMapBranch(HeightMap.of(nodes.slice(0, i)), brk, HeightMap.of(nodes.slice(j)));
        }
    }
    HeightMap.prototype.size = 1;
    class HeightMapBlock extends HeightMap {
        constructor(length, height, type) {
            super(length, height);
            this.type = type;
        }
        blockAt(_height, _doc, top, offset) {
            return new BlockInfo(offset, this.length, top, this.height, this.type);
        }
        lineAt(_value, _type, doc, top, offset) {
            return this.blockAt(0, doc, top, offset);
        }
        forEachLine(_from, _to, doc, top, offset, f) {
            f(this.blockAt(0, doc, top, offset));
        }
        updateHeight(oracle, offset = 0, _force = false, measured) {
            if (measured && measured.from <= offset && measured.more)
                this.setHeight(oracle, measured.heights[measured.index++]);
            this.outdated = false;
            return this;
        }
        toString() { return `block(${this.length})`; }
    }
    class HeightMapText extends HeightMapBlock {
        constructor(length, height) {
            super(length, height, BlockType.Text);
            this.collapsed = 0; // Amount of collapsed content in the line
            this.widgetHeight = 0; // Maximum inline widget height
        }
        replace(_from, _to, nodes) {
            let node = nodes[0];
            if (nodes.length == 1 && (node instanceof HeightMapText || node instanceof HeightMapGap && (node.flags & 4 /* SingleLine */)) &&
                Math.abs(this.length - node.length) < 10) {
                if (node instanceof HeightMapGap)
                    node = new HeightMapText(node.length, this.height);
                else
                    node.height = this.height;
                if (!this.outdated)
                    node.outdated = false;
                return node;
            }
            else {
                return HeightMap.of(nodes);
            }
        }
        updateHeight(oracle, offset = 0, force = false, measured) {
            if (measured && measured.from <= offset && measured.more)
                this.setHeight(oracle, measured.heights[measured.index++]);
            else if (force || this.outdated)
                this.setHeight(oracle, Math.max(this.widgetHeight, oracle.heightForLine(this.length - this.collapsed)));
            this.outdated = false;
            return this;
        }
        toString() {
            return `line(${this.length}${this.collapsed ? -this.collapsed : ""}${this.widgetHeight ? ":" + this.widgetHeight : ""})`;
        }
    }
    class HeightMapGap extends HeightMap {
        constructor(length) { super(length, 0); }
        lines(doc, offset) {
            let firstLine = doc.lineAt(offset).number, lastLine = doc.lineAt(offset + this.length).number;
            return { firstLine, lastLine, lineHeight: this.height / (lastLine - firstLine + 1) };
        }
        blockAt(height, doc, top, offset) {
            let { firstLine, lastLine, lineHeight } = this.lines(doc, offset);
            let line = Math.max(0, Math.min(lastLine - firstLine, Math.floor((height - top) / lineHeight)));
            let { from, length } = doc.line(firstLine + line);
            return new BlockInfo(from, length, top + lineHeight * line, lineHeight, BlockType.Text);
        }
        lineAt(value, type, doc, top, offset) {
            if (type == QueryType$1.ByHeight)
                return this.blockAt(value, doc, top, offset);
            if (type == QueryType$1.ByPosNoHeight) {
                let { from, to } = doc.lineAt(value);
                return new BlockInfo(from, to - from, 0, 0, BlockType.Text);
            }
            let { firstLine, lineHeight } = this.lines(doc, offset);
            let { from, length, number } = doc.lineAt(value);
            return new BlockInfo(from, length, top + lineHeight * (number - firstLine), lineHeight, BlockType.Text);
        }
        forEachLine(from, to, doc, top, offset, f) {
            let { firstLine, lineHeight } = this.lines(doc, offset);
            for (let pos = Math.max(from, offset), end = Math.min(offset + this.length, to); pos <= end;) {
                let line = doc.lineAt(pos);
                if (pos == from)
                    top += lineHeight * (line.number - firstLine);
                f(new BlockInfo(line.from, line.length, top, lineHeight, BlockType.Text));
                top += lineHeight;
                pos = line.to + 1;
            }
        }
        replace(from, to, nodes) {
            let after = this.length - to;
            if (after > 0) {
                let last = nodes[nodes.length - 1];
                if (last instanceof HeightMapGap)
                    nodes[nodes.length - 1] = new HeightMapGap(last.length + after);
                else
                    nodes.push(null, new HeightMapGap(after - 1));
            }
            if (from > 0) {
                let first = nodes[0];
                if (first instanceof HeightMapGap)
                    nodes[0] = new HeightMapGap(from + first.length);
                else
                    nodes.unshift(new HeightMapGap(from - 1), null);
            }
            return HeightMap.of(nodes);
        }
        decomposeLeft(to, result) {
            result.push(new HeightMapGap(to - 1), null);
        }
        decomposeRight(from, result) {
            result.push(null, new HeightMapGap(this.length - from - 1));
        }
        updateHeight(oracle, offset = 0, force = false, measured) {
            let end = offset + this.length;
            if (measured && measured.from <= offset + this.length && measured.more) {
                // Fill in part of this gap with measured lines. We know there
                // can't be widgets or collapsed ranges in those lines, because
                // they would already have been added to the heightmap (gaps
                // only contain plain text).
                let nodes = [], pos = Math.max(offset, measured.from), singleHeight = -1;
                let wasChanged = oracle.heightChanged;
                if (measured.from > offset)
                    nodes.push(new HeightMapGap(measured.from - offset - 1).updateHeight(oracle, offset));
                while (pos <= end && measured.more) {
                    let len = oracle.doc.lineAt(pos).length;
                    if (nodes.length)
                        nodes.push(null);
                    let height = measured.heights[measured.index++];
                    if (singleHeight == -1)
                        singleHeight = height;
                    else if (Math.abs(height - singleHeight) >= Epsilon)
                        singleHeight = -2;
                    let line = new HeightMapText(len, height);
                    line.outdated = false;
                    nodes.push(line);
                    pos += len + 1;
                }
                if (pos <= end)
                    nodes.push(null, new HeightMapGap(end - pos).updateHeight(oracle, pos));
                let result = HeightMap.of(nodes);
                oracle.heightChanged = wasChanged || singleHeight < 0 || Math.abs(result.height - this.height) >= Epsilon ||
                    Math.abs(singleHeight - this.lines(oracle.doc, offset).lineHeight) >= Epsilon;
                return result;
            }
            else if (force || this.outdated) {
                this.setHeight(oracle, oracle.heightForGap(offset, offset + this.length));
                this.outdated = false;
            }
            return this;
        }
        toString() { return `gap(${this.length})`; }
    }
    class HeightMapBranch extends HeightMap {
        constructor(left, brk, right) {
            super(left.length + brk + right.length, left.height + right.height, brk | (left.outdated || right.outdated ? 2 /* Outdated */ : 0));
            this.left = left;
            this.right = right;
            this.size = left.size + right.size;
        }
        get break() { return this.flags & 1 /* Break */; }
        blockAt(height, doc, top, offset) {
            let mid = top + this.left.height;
            return height < mid ? this.left.blockAt(height, doc, top, offset)
                : this.right.blockAt(height, doc, mid, offset + this.left.length + this.break);
        }
        lineAt(value, type, doc, top, offset) {
            let rightTop = top + this.left.height, rightOffset = offset + this.left.length + this.break;
            let left = type == QueryType$1.ByHeight ? value < rightTop : value < rightOffset;
            let base = left ? this.left.lineAt(value, type, doc, top, offset)
                : this.right.lineAt(value, type, doc, rightTop, rightOffset);
            if (this.break || (left ? base.to < rightOffset : base.from > rightOffset))
                return base;
            let subQuery = type == QueryType$1.ByPosNoHeight ? QueryType$1.ByPosNoHeight : QueryType$1.ByPos;
            if (left)
                return base.join(this.right.lineAt(rightOffset, subQuery, doc, rightTop, rightOffset));
            else
                return this.left.lineAt(rightOffset, subQuery, doc, top, offset).join(base);
        }
        forEachLine(from, to, doc, top, offset, f) {
            let rightTop = top + this.left.height, rightOffset = offset + this.left.length + this.break;
            if (this.break) {
                if (from < rightOffset)
                    this.left.forEachLine(from, to, doc, top, offset, f);
                if (to >= rightOffset)
                    this.right.forEachLine(from, to, doc, rightTop, rightOffset, f);
            }
            else {
                let mid = this.lineAt(rightOffset, QueryType$1.ByPos, doc, top, offset);
                if (from < mid.from)
                    this.left.forEachLine(from, mid.from - 1, doc, top, offset, f);
                if (mid.to >= from && mid.from <= to)
                    f(mid);
                if (to > mid.to)
                    this.right.forEachLine(mid.to + 1, to, doc, rightTop, rightOffset, f);
            }
        }
        replace(from, to, nodes) {
            let rightStart = this.left.length + this.break;
            if (to < rightStart)
                return this.balanced(this.left.replace(from, to, nodes), this.right);
            if (from > this.left.length)
                return this.balanced(this.left, this.right.replace(from - rightStart, to - rightStart, nodes));
            let result = [];
            if (from > 0)
                this.decomposeLeft(from, result);
            let left = result.length;
            for (let node of nodes)
                result.push(node);
            if (from > 0)
                mergeGaps(result, left - 1);
            if (to < this.length) {
                let right = result.length;
                this.decomposeRight(to, result);
                mergeGaps(result, right);
            }
            return HeightMap.of(result);
        }
        decomposeLeft(to, result) {
            let left = this.left.length;
            if (to <= left)
                return this.left.decomposeLeft(to, result);
            result.push(this.left);
            if (this.break) {
                left++;
                if (to >= left)
                    result.push(null);
            }
            if (to > left)
                this.right.decomposeLeft(to - left, result);
        }
        decomposeRight(from, result) {
            let left = this.left.length, right = left + this.break;
            if (from >= right)
                return this.right.decomposeRight(from - right, result);
            if (from < left)
                this.left.decomposeRight(from, result);
            if (this.break && from < right)
                result.push(null);
            result.push(this.right);
        }
        balanced(left, right) {
            if (left.size > 2 * right.size || right.size > 2 * left.size)
                return HeightMap.of(this.break ? [left, null, right] : [left, right]);
            this.left = left;
            this.right = right;
            this.height = left.height + right.height;
            this.outdated = left.outdated || right.outdated;
            this.size = left.size + right.size;
            this.length = left.length + this.break + right.length;
            return this;
        }
        updateHeight(oracle, offset = 0, force = false, measured) {
            let { left, right } = this, rightStart = offset + left.length + this.break, rebalance = null;
            if (measured && measured.from <= offset + left.length && measured.more)
                rebalance = left = left.updateHeight(oracle, offset, force, measured);
            else
                left.updateHeight(oracle, offset, force);
            if (measured && measured.from <= rightStart + right.length && measured.more)
                rebalance = right = right.updateHeight(oracle, rightStart, force, measured);
            else
                right.updateHeight(oracle, rightStart, force);
            if (rebalance)
                return this.balanced(left, right);
            this.height = this.left.height + this.right.height;
            this.outdated = false;
            return this;
        }
        toString() { return this.left + (this.break ? " " : "-") + this.right; }
    }
    function mergeGaps(nodes, around) {
        let before, after;
        if (nodes[around] == null &&
            (before = nodes[around - 1]) instanceof HeightMapGap &&
            (after = nodes[around + 1]) instanceof HeightMapGap)
            nodes.splice(around - 1, 3, new HeightMapGap(before.length + 1 + after.length));
    }
    const relevantWidgetHeight = 5;
    class NodeBuilder {
        constructor(pos, oracle) {
            this.pos = pos;
            this.oracle = oracle;
            this.nodes = [];
            this.lineStart = -1;
            this.lineEnd = -1;
            this.covering = null;
            this.writtenTo = pos;
        }
        get isCovered() {
            return this.covering && this.nodes[this.nodes.length - 1] == this.covering;
        }
        span(_from, to) {
            if (this.lineStart > -1) {
                let end = Math.min(to, this.lineEnd), last = this.nodes[this.nodes.length - 1];
                if (last instanceof HeightMapText)
                    last.length += end - this.pos;
                else if (end > this.pos || !this.isCovered)
                    this.nodes.push(new HeightMapText(end - this.pos, -1));
                this.writtenTo = end;
                if (to > end) {
                    this.nodes.push(null);
                    this.writtenTo++;
                    this.lineStart = -1;
                }
            }
            this.pos = to;
        }
        point(from, to, deco) {
            if (from < to || deco.heightRelevant) {
                let height = deco.widget ? deco.widget.estimatedHeight : 0;
                if (height < 0)
                    height = this.oracle.lineHeight;
                let len = to - from;
                if (deco.block) {
                    this.addBlock(new HeightMapBlock(len, height, deco.type));
                }
                else if (len || height >= relevantWidgetHeight) {
                    this.addLineDeco(height, len);
                }
            }
            else if (to > from) {
                this.span(from, to);
            }
            if (this.lineEnd > -1 && this.lineEnd < this.pos)
                this.lineEnd = this.oracle.doc.lineAt(this.pos).to;
        }
        enterLine() {
            if (this.lineStart > -1)
                return;
            let { from, to } = this.oracle.doc.lineAt(this.pos);
            this.lineStart = from;
            this.lineEnd = to;
            if (this.writtenTo < from) {
                if (this.writtenTo < from - 1 || this.nodes[this.nodes.length - 1] == null)
                    this.nodes.push(this.blankContent(this.writtenTo, from - 1));
                this.nodes.push(null);
            }
            if (this.pos > from)
                this.nodes.push(new HeightMapText(this.pos - from, -1));
            this.writtenTo = this.pos;
        }
        blankContent(from, to) {
            let gap = new HeightMapGap(to - from);
            if (this.oracle.doc.lineAt(from).to == to)
                gap.flags |= 4 /* SingleLine */;
            return gap;
        }
        ensureLine() {
            this.enterLine();
            let last = this.nodes.length ? this.nodes[this.nodes.length - 1] : null;
            if (last instanceof HeightMapText)
                return last;
            let line = new HeightMapText(0, -1);
            this.nodes.push(line);
            return line;
        }
        addBlock(block) {
            this.enterLine();
            if (block.type == BlockType.WidgetAfter && !this.isCovered)
                this.ensureLine();
            this.nodes.push(block);
            this.writtenTo = this.pos = this.pos + block.length;
            if (block.type != BlockType.WidgetBefore)
                this.covering = block;
        }
        addLineDeco(height, length) {
            let line = this.ensureLine();
            line.length += length;
            line.collapsed += length;
            line.widgetHeight = Math.max(line.widgetHeight, height);
            this.writtenTo = this.pos = this.pos + length;
        }
        finish(from) {
            let last = this.nodes.length == 0 ? null : this.nodes[this.nodes.length - 1];
            if (this.lineStart > -1 && !(last instanceof HeightMapText) && !this.isCovered)
                this.nodes.push(new HeightMapText(0, -1));
            else if (this.writtenTo < this.pos || last == null)
                this.nodes.push(this.blankContent(this.writtenTo, this.pos));
            let pos = from;
            for (let node of this.nodes) {
                if (node instanceof HeightMapText)
                    node.updateHeight(this.oracle, pos);
                pos += node ? node.length : 1;
            }
            return this.nodes;
        }
        // Always called with a region that on both sides either stretches
        // to a line break or the end of the document.
        // The returned array uses null to indicate line breaks, but never
        // starts or ends in a line break, or has multiple line breaks next
        // to each other.
        static build(oracle, decorations, from, to) {
            let builder = new NodeBuilder(from, oracle);
            RangeSet.spans(decorations, from, to, builder, 0);
            return builder.finish(from);
        }
    }
    function heightRelevantDecoChanges(a, b, diff) {
        let comp = new DecorationComparator;
        RangeSet.compare(a, b, diff, comp, 0);
        return comp.changes;
    }
    class DecorationComparator {
        constructor() {
            this.changes = [];
        }
        compareRange() { }
        comparePoint(from, to, a, b) {
            if (from < to || a && a.heightRelevant || b && b.heightRelevant)
                addRange(from, to, this.changes, 5);
        }
    }

    function visiblePixelRange(dom, paddingTop) {
        let rect = dom.getBoundingClientRect();
        let left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.right);
        let top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom);
        let body = dom.ownerDocument.body;
        for (let parent = dom.parentNode; parent && parent != body;) {
            if (parent.nodeType == 1) {
                let elt = parent;
                let style = window.getComputedStyle(elt);
                if ((elt.scrollHeight > elt.clientHeight || elt.scrollWidth > elt.clientWidth) &&
                    style.overflow != "visible") {
                    let parentRect = elt.getBoundingClientRect();
                    left = Math.max(left, parentRect.left);
                    right = Math.min(right, parentRect.right);
                    top = Math.max(top, parentRect.top);
                    bottom = Math.min(bottom, parentRect.bottom);
                }
                parent = style.position == "absolute" || style.position == "fixed" ? elt.offsetParent : elt.parentNode;
            }
            else if (parent.nodeType == 11) { // Shadow root
                parent = parent.host;
            }
            else {
                break;
            }
        }
        return { left: left - rect.left, right: Math.max(left, right) - rect.left,
            top: top - (rect.top + paddingTop), bottom: Math.max(top, bottom) - (rect.top + paddingTop) };
    }
    // Line gaps are placeholder widgets used to hide pieces of overlong
    // lines within the viewport, as a kludge to keep the editor
    // responsive when a ridiculously long line is loaded into it.
    class LineGap {
        constructor(from, to, size) {
            this.from = from;
            this.to = to;
            this.size = size;
        }
        static same(a, b) {
            if (a.length != b.length)
                return false;
            for (let i = 0; i < a.length; i++) {
                let gA = a[i], gB = b[i];
                if (gA.from != gB.from || gA.to != gB.to || gA.size != gB.size)
                    return false;
            }
            return true;
        }
        draw(wrapping) {
            return Decoration.replace({ widget: new LineGapWidget(this.size, wrapping) }).range(this.from, this.to);
        }
    }
    class LineGapWidget extends WidgetType {
        constructor(size, vertical) {
            super();
            this.size = size;
            this.vertical = vertical;
        }
        eq(other) { return other.size == this.size && other.vertical == this.vertical; }
        toDOM() {
            let elt = document.createElement("div");
            if (this.vertical) {
                elt.style.height = this.size + "px";
            }
            else {
                elt.style.width = this.size + "px";
                elt.style.height = "2px";
                elt.style.display = "inline-block";
            }
            return elt;
        }
        get estimatedHeight() { return this.vertical ? this.size : -1; }
    }
    class ViewState {
        constructor(state) {
            this.state = state;
            // These are contentDOM-local coordinates
            this.pixelViewport = { left: 0, right: window.innerWidth, top: 0, bottom: 0 };
            this.inView = true;
            this.paddingTop = 0;
            this.paddingBottom = 0;
            this.contentDOMWidth = 0;
            this.contentDOMHeight = 0;
            this.editorHeight = 0;
            this.editorWidth = 0;
            this.heightOracle = new HeightOracle;
            // See VP.MaxDOMHeight
            this.scaler = IdScaler;
            this.scrollTarget = null;
            // Briefly set to true when printing, to disable viewport limiting
            this.printing = false;
            // Flag set when editor content was redrawn, so that the next
            // measure stage knows it must read DOM layout
            this.mustMeasureContent = true;
            this.visibleRanges = [];
            // Cursor 'assoc' is only significant when the cursor is on a line
            // wrap point, where it must stick to the character that it is
            // associated with. Since browsers don't provide a reasonable
            // interface to set or query this, when a selection is set that
            // might cause this to be significant, this flag is set. The next
            // measure phase will check whether the cursor is on a line-wrapping
            // boundary and, if so, reset it to make sure it is positioned in
            // the right place.
            this.mustEnforceCursorAssoc = false;
            this.heightMap = HeightMap.empty().applyChanges(state.facet(decorations), Text.empty, this.heightOracle.setDoc(state.doc), [new ChangedRange(0, 0, 0, state.doc.length)]);
            this.viewport = this.getViewport(0, null);
            this.updateViewportLines();
            this.updateForViewport();
            this.lineGaps = this.ensureLineGaps([]);
            this.lineGapDeco = Decoration.set(this.lineGaps.map(gap => gap.draw(false)));
            this.computeVisibleRanges();
        }
        updateForViewport() {
            let viewports = [this.viewport], { main } = this.state.selection;
            for (let i = 0; i <= 1; i++) {
                let pos = i ? main.head : main.anchor;
                if (!viewports.some(({ from, to }) => pos >= from && pos <= to)) {
                    let { from, to } = this.lineBlockAt(pos);
                    viewports.push(new Viewport(from, to));
                }
            }
            this.viewports = viewports.sort((a, b) => a.from - b.from);
            this.scaler = this.heightMap.height <= 7000000 /* MaxDOMHeight */ ? IdScaler :
                new BigScaler(this.heightOracle.doc, this.heightMap, this.viewports);
        }
        updateViewportLines() {
            this.viewportLines = [];
            this.heightMap.forEachLine(this.viewport.from, this.viewport.to, this.state.doc, 0, 0, block => {
                this.viewportLines.push(this.scaler.scale == 1 ? block : scaleBlock(block, this.scaler));
            });
        }
        update(update, scrollTarget = null) {
            let prev = this.state;
            this.state = update.state;
            let newDeco = this.state.facet(decorations);
            let contentChanges = update.changedRanges;
            let heightChanges = ChangedRange.extendWithRanges(contentChanges, heightRelevantDecoChanges(update.startState.facet(decorations), newDeco, update ? update.changes : ChangeSet.empty(this.state.doc.length)));
            let prevHeight = this.heightMap.height;
            this.heightMap = this.heightMap.applyChanges(newDeco, prev.doc, this.heightOracle.setDoc(this.state.doc), heightChanges);
            if (this.heightMap.height != prevHeight)
                update.flags |= 2 /* Height */;
            let viewport = heightChanges.length ? this.mapViewport(this.viewport, update.changes) : this.viewport;
            if (scrollTarget && (scrollTarget.range.head < viewport.from || scrollTarget.range.head > viewport.to) ||
                !this.viewportIsAppropriate(viewport))
                viewport = this.getViewport(0, scrollTarget);
            let updateLines = !update.changes.empty || (update.flags & 2 /* Height */) ||
                viewport.from != this.viewport.from || viewport.to != this.viewport.to;
            this.viewport = viewport;
            this.updateForViewport();
            if (updateLines)
                this.updateViewportLines();
            if (this.lineGaps.length || this.viewport.to - this.viewport.from > 4000 /* DoubleMargin */)
                this.updateLineGaps(this.ensureLineGaps(this.mapLineGaps(this.lineGaps, update.changes)));
            update.flags |= this.computeVisibleRanges();
            if (scrollTarget)
                this.scrollTarget = scrollTarget;
            if (!this.mustEnforceCursorAssoc && update.selectionSet && update.view.lineWrapping &&
                update.state.selection.main.empty && update.state.selection.main.assoc)
                this.mustEnforceCursorAssoc = true;
        }
        measure(view) {
            let dom = view.contentDOM, style = window.getComputedStyle(dom);
            let oracle = this.heightOracle;
            let whiteSpace = style.whiteSpace, direction = style.direction == "rtl" ? Direction.RTL : Direction.LTR;
            let refresh = this.heightOracle.mustRefreshForStyle(whiteSpace, direction);
            let measureContent = refresh || this.mustMeasureContent || this.contentDOMHeight != dom.clientHeight;
            let result = 0, bias = 0;
            if (this.editorWidth != view.scrollDOM.clientWidth) {
                if (oracle.lineWrapping)
                    measureContent = true;
                this.editorWidth = view.scrollDOM.clientWidth;
                result |= 8 /* Geometry */;
            }
            if (measureContent) {
                this.mustMeasureContent = false;
                this.contentDOMHeight = dom.clientHeight;
                // Vertical padding
                let paddingTop = parseInt(style.paddingTop) || 0, paddingBottom = parseInt(style.paddingBottom) || 0;
                if (this.paddingTop != paddingTop || this.paddingBottom != paddingBottom) {
                    result |= 8 /* Geometry */;
                    this.paddingTop = paddingTop;
                    this.paddingBottom = paddingBottom;
                }
            }
            // Pixel viewport
            let pixelViewport = this.printing ? { top: -1e8, bottom: 1e8, left: -1e8, right: 1e8 }
                : visiblePixelRange(dom, this.paddingTop);
            let dTop = pixelViewport.top - this.pixelViewport.top, dBottom = pixelViewport.bottom - this.pixelViewport.bottom;
            this.pixelViewport = pixelViewport;
            let inView = this.pixelViewport.bottom > this.pixelViewport.top && this.pixelViewport.right > this.pixelViewport.left;
            if (inView != this.inView) {
                this.inView = inView;
                if (inView)
                    measureContent = true;
            }
            if (!this.inView)
                return 0;
            let contentWidth = dom.clientWidth;
            if (this.contentDOMWidth != contentWidth || this.editorHeight != view.scrollDOM.clientHeight) {
                this.contentDOMWidth = contentWidth;
                this.editorHeight = view.scrollDOM.clientHeight;
                result |= 8 /* Geometry */;
            }
            if (measureContent) {
                let lineHeights = view.docView.measureVisibleLineHeights();
                if (oracle.mustRefreshForHeights(lineHeights))
                    refresh = true;
                if (refresh || oracle.lineWrapping && Math.abs(contentWidth - this.contentDOMWidth) > oracle.charWidth) {
                    let { lineHeight, charWidth } = view.docView.measureTextSize();
                    refresh = oracle.refresh(whiteSpace, direction, lineHeight, charWidth, contentWidth / charWidth, lineHeights);
                    if (refresh) {
                        view.docView.minWidth = 0;
                        result |= 8 /* Geometry */;
                    }
                }
                if (dTop > 0 && dBottom > 0)
                    bias = Math.max(dTop, dBottom);
                else if (dTop < 0 && dBottom < 0)
                    bias = Math.min(dTop, dBottom);
                oracle.heightChanged = false;
                this.heightMap = this.heightMap.updateHeight(oracle, 0, refresh, new MeasuredHeights(this.viewport.from, lineHeights));
                if (oracle.heightChanged)
                    result |= 2 /* Height */;
            }
            let viewportChange = !this.viewportIsAppropriate(this.viewport, bias) ||
                this.scrollTarget && (this.scrollTarget.range.head < this.viewport.from || this.scrollTarget.range.head > this.viewport.to);
            if (viewportChange)
                this.viewport = this.getViewport(bias, this.scrollTarget);
            this.updateForViewport();
            if ((result & 2 /* Height */) || viewportChange)
                this.updateViewportLines();
            if (this.lineGaps.length || this.viewport.to - this.viewport.from > 4000 /* DoubleMargin */)
                this.updateLineGaps(this.ensureLineGaps(refresh ? [] : this.lineGaps));
            result |= this.computeVisibleRanges();
            if (this.mustEnforceCursorAssoc) {
                this.mustEnforceCursorAssoc = false;
                // This is done in the read stage, because moving the selection
                // to a line end is going to trigger a layout anyway, so it
                // can't be a pure write. It should be rare that it does any
                // writing.
                view.docView.enforceCursorAssoc();
            }
            return result;
        }
        get visibleTop() { return this.scaler.fromDOM(this.pixelViewport.top); }
        get visibleBottom() { return this.scaler.fromDOM(this.pixelViewport.bottom); }
        getViewport(bias, scrollTarget) {
            // This will divide VP.Margin between the top and the
            // bottom, depending on the bias (the change in viewport position
            // since the last update). It'll hold a number between 0 and 1
            let marginTop = 0.5 - Math.max(-0.5, Math.min(0.5, bias / 1000 /* Margin */ / 2));
            let map = this.heightMap, doc = this.state.doc, { visibleTop, visibleBottom } = this;
            let viewport = new Viewport(map.lineAt(visibleTop - marginTop * 1000 /* Margin */, QueryType$1.ByHeight, doc, 0, 0).from, map.lineAt(visibleBottom + (1 - marginTop) * 1000 /* Margin */, QueryType$1.ByHeight, doc, 0, 0).to);
            // If scrollTarget is given, make sure the viewport includes that position
            if (scrollTarget) {
                let { head } = scrollTarget.range;
                if (head < viewport.from || head > viewport.to) {
                    let viewHeight = Math.min(this.editorHeight, this.pixelViewport.bottom - this.pixelViewport.top);
                    let block = map.lineAt(head, QueryType$1.ByPos, doc, 0, 0), topPos;
                    if (scrollTarget.y == "center")
                        topPos = (block.top + block.bottom) / 2 - viewHeight / 2;
                    else if (scrollTarget.y == "start" || scrollTarget.y == "nearest" && head < viewport.from)
                        topPos = block.top;
                    else
                        topPos = block.bottom - viewHeight;
                    viewport = new Viewport(map.lineAt(topPos - 1000 /* Margin */ / 2, QueryType$1.ByHeight, doc, 0, 0).from, map.lineAt(topPos + viewHeight + 1000 /* Margin */ / 2, QueryType$1.ByHeight, doc, 0, 0).to);
                }
            }
            return viewport;
        }
        mapViewport(viewport, changes) {
            let from = changes.mapPos(viewport.from, -1), to = changes.mapPos(viewport.to, 1);
            return new Viewport(this.heightMap.lineAt(from, QueryType$1.ByPos, this.state.doc, 0, 0).from, this.heightMap.lineAt(to, QueryType$1.ByPos, this.state.doc, 0, 0).to);
        }
        // Checks if a given viewport covers the visible part of the
        // document and not too much beyond that.
        viewportIsAppropriate({ from, to }, bias = 0) {
            if (!this.inView)
                return true;
            let { top } = this.heightMap.lineAt(from, QueryType$1.ByPos, this.state.doc, 0, 0);
            let { bottom } = this.heightMap.lineAt(to, QueryType$1.ByPos, this.state.doc, 0, 0);
            let { visibleTop, visibleBottom } = this;
            return (from == 0 || top <= visibleTop - Math.max(10 /* MinCoverMargin */, Math.min(-bias, 250 /* MaxCoverMargin */))) &&
                (to == this.state.doc.length ||
                    bottom >= visibleBottom + Math.max(10 /* MinCoverMargin */, Math.min(bias, 250 /* MaxCoverMargin */))) &&
                (top > visibleTop - 2 * 1000 /* Margin */ && bottom < visibleBottom + 2 * 1000 /* Margin */);
        }
        mapLineGaps(gaps, changes) {
            if (!gaps.length || changes.empty)
                return gaps;
            let mapped = [];
            for (let gap of gaps)
                if (!changes.touchesRange(gap.from, gap.to))
                    mapped.push(new LineGap(changes.mapPos(gap.from), changes.mapPos(gap.to), gap.size));
            return mapped;
        }
        // Computes positions in the viewport where the start or end of a
        // line should be hidden, trying to reuse existing line gaps when
        // appropriate to avoid unneccesary redraws.
        // Uses crude character-counting for the positioning and sizing,
        // since actual DOM coordinates aren't always available and
        // predictable. Relies on generous margins (see LG.Margin) to hide
        // the artifacts this might produce from the user.
        ensureLineGaps(current) {
            let gaps = [];
            // This won't work at all in predominantly right-to-left text.
            if (this.heightOracle.direction != Direction.LTR)
                return gaps;
            for (let line of this.viewportLines) {
                if (line.length < 4000 /* DoubleMargin */)
                    continue;
                let structure = lineStructure(line.from, line.to, this.state);
                if (structure.total < 4000 /* DoubleMargin */)
                    continue;
                let viewFrom, viewTo;
                if (this.heightOracle.lineWrapping) {
                    let marginHeight = (2000 /* Margin */ / this.heightOracle.lineLength) * this.heightOracle.lineHeight;
                    viewFrom = findPosition(structure, (this.visibleTop - line.top - marginHeight) / line.height);
                    viewTo = findPosition(structure, (this.visibleBottom - line.top + marginHeight) / line.height);
                }
                else {
                    let totalWidth = structure.total * this.heightOracle.charWidth;
                    let marginWidth = 2000 /* Margin */ * this.heightOracle.charWidth;
                    viewFrom = findPosition(structure, (this.pixelViewport.left - marginWidth) / totalWidth);
                    viewTo = findPosition(structure, (this.pixelViewport.right + marginWidth) / totalWidth);
                }
                let outside = [];
                if (viewFrom > line.from)
                    outside.push({ from: line.from, to: viewFrom });
                if (viewTo < line.to)
                    outside.push({ from: viewTo, to: line.to });
                let sel = this.state.selection.main;
                // Make sure the gaps don't cover a selection end
                if (sel.from >= line.from && sel.from <= line.to)
                    cutRange(outside, sel.from - 10 /* SelectionMargin */, sel.from + 10 /* SelectionMargin */);
                if (!sel.empty && sel.to >= line.from && sel.to <= line.to)
                    cutRange(outside, sel.to - 10 /* SelectionMargin */, sel.to + 10 /* SelectionMargin */);
                for (let { from, to } of outside)
                    if (to - from > 1000 /* HalfMargin */) {
                        gaps.push(find(current, gap => gap.from >= line.from && gap.to <= line.to &&
                            Math.abs(gap.from - from) < 1000 /* HalfMargin */ && Math.abs(gap.to - to) < 1000 /* HalfMargin */) ||
                            new LineGap(from, to, this.gapSize(line, from, to, structure)));
                    }
            }
            return gaps;
        }
        gapSize(line, from, to, structure) {
            let fraction = findFraction(structure, to) - findFraction(structure, from);
            if (this.heightOracle.lineWrapping) {
                return line.height * fraction;
            }
            else {
                return structure.total * this.heightOracle.charWidth * fraction;
            }
        }
        updateLineGaps(gaps) {
            if (!LineGap.same(gaps, this.lineGaps)) {
                this.lineGaps = gaps;
                this.lineGapDeco = Decoration.set(gaps.map(gap => gap.draw(this.heightOracle.lineWrapping)));
            }
        }
        computeVisibleRanges() {
            let deco = this.state.facet(decorations);
            if (this.lineGaps.length)
                deco = deco.concat(this.lineGapDeco);
            let ranges = [];
            RangeSet.spans(deco, this.viewport.from, this.viewport.to, {
                span(from, to) { ranges.push({ from, to }); },
                point() { }
            }, 20);
            let changed = ranges.length != this.visibleRanges.length ||
                this.visibleRanges.some((r, i) => r.from != ranges[i].from || r.to != ranges[i].to);
            this.visibleRanges = ranges;
            return changed ? 4 /* Viewport */ : 0;
        }
        lineBlockAt(pos) {
            return (pos >= this.viewport.from && pos <= this.viewport.to && this.viewportLines.find(b => b.from <= pos && b.to >= pos)) ||
                scaleBlock(this.heightMap.lineAt(pos, QueryType$1.ByPos, this.state.doc, 0, 0), this.scaler);
        }
        lineBlockAtHeight(height) {
            return scaleBlock(this.heightMap.lineAt(this.scaler.fromDOM(height), QueryType$1.ByHeight, this.state.doc, 0, 0), this.scaler);
        }
        elementAtHeight(height) {
            return scaleBlock(this.heightMap.blockAt(this.scaler.fromDOM(height), this.state.doc, 0, 0), this.scaler);
        }
        get docHeight() {
            return this.scaler.toDOM(this.heightMap.height);
        }
        get contentHeight() {
            return this.docHeight + this.paddingTop + this.paddingBottom;
        }
    }
    class Viewport {
        constructor(from, to) {
            this.from = from;
            this.to = to;
        }
    }
    function lineStructure(from, to, state) {
        let ranges = [], pos = from, total = 0;
        RangeSet.spans(state.facet(decorations), from, to, {
            span() { },
            point(from, to) {
                if (from > pos) {
                    ranges.push({ from: pos, to: from });
                    total += from - pos;
                }
                pos = to;
            }
        }, 20); // We're only interested in collapsed ranges of a significant size
        if (pos < to) {
            ranges.push({ from: pos, to });
            total += to - pos;
        }
        return { total, ranges };
    }
    function findPosition({ total, ranges }, ratio) {
        if (ratio <= 0)
            return ranges[0].from;
        if (ratio >= 1)
            return ranges[ranges.length - 1].to;
        let dist = Math.floor(total * ratio);
        for (let i = 0;; i++) {
            let { from, to } = ranges[i], size = to - from;
            if (dist <= size)
                return from + dist;
            dist -= size;
        }
    }
    function findFraction(structure, pos) {
        let counted = 0;
        for (let { from, to } of structure.ranges) {
            if (pos <= to) {
                counted += pos - from;
                break;
            }
            counted += to - from;
        }
        return counted / structure.total;
    }
    function cutRange(ranges, from, to) {
        for (let i = 0; i < ranges.length; i++) {
            let r = ranges[i];
            if (r.from < to && r.to > from) {
                let pieces = [];
                if (r.from < from)
                    pieces.push({ from: r.from, to: from });
                if (r.to > to)
                    pieces.push({ from: to, to: r.to });
                ranges.splice(i, 1, ...pieces);
                i += pieces.length - 1;
            }
        }
    }
    function find(array, f) {
        for (let val of array)
            if (f(val))
                return val;
        return undefined;
    }
    // Don't scale when the document height is within the range of what
    // the DOM can handle.
    const IdScaler = {
        toDOM(n) { return n; },
        fromDOM(n) { return n; },
        scale: 1
    };
    // When the height is too big (> VP.MaxDOMHeight), scale down the
    // regions outside the viewports so that the total height is
    // VP.MaxDOMHeight.
    class BigScaler {
        constructor(doc, heightMap, viewports) {
            let vpHeight = 0, base = 0, domBase = 0;
            this.viewports = viewports.map(({ from, to }) => {
                let top = heightMap.lineAt(from, QueryType$1.ByPos, doc, 0, 0).top;
                let bottom = heightMap.lineAt(to, QueryType$1.ByPos, doc, 0, 0).bottom;
                vpHeight += bottom - top;
                return { from, to, top, bottom, domTop: 0, domBottom: 0 };
            });
            this.scale = (7000000 /* MaxDOMHeight */ - vpHeight) / (heightMap.height - vpHeight);
            for (let obj of this.viewports) {
                obj.domTop = domBase + (obj.top - base) * this.scale;
                domBase = obj.domBottom = obj.domTop + (obj.bottom - obj.top);
                base = obj.bottom;
            }
        }
        toDOM(n) {
            for (let i = 0, base = 0, domBase = 0;; i++) {
                let vp = i < this.viewports.length ? this.viewports[i] : null;
                if (!vp || n < vp.top)
                    return domBase + (n - base) * this.scale;
                if (n <= vp.bottom)
                    return vp.domTop + (n - vp.top);
                base = vp.bottom;
                domBase = vp.domBottom;
            }
        }
        fromDOM(n) {
            for (let i = 0, base = 0, domBase = 0;; i++) {
                let vp = i < this.viewports.length ? this.viewports[i] : null;
                if (!vp || n < vp.domTop)
                    return base + (n - domBase) / this.scale;
                if (n <= vp.domBottom)
                    return vp.top + (n - vp.domTop);
                base = vp.bottom;
                domBase = vp.domBottom;
            }
        }
    }
    function scaleBlock(block, scaler) {
        if (scaler.scale == 1)
            return block;
        let bTop = scaler.toDOM(block.top), bBottom = scaler.toDOM(block.bottom);
        return new BlockInfo(block.from, block.length, bTop, bBottom - bTop, Array.isArray(block.type) ? block.type.map(b => scaleBlock(b, scaler)) : block.type);
    }

    const theme = /*@__PURE__*/Facet.define({ combine: strs => strs.join(" ") });
    const darkTheme = /*@__PURE__*/Facet.define({ combine: values => values.indexOf(true) > -1 });
    const baseThemeID = /*@__PURE__*/StyleModule.newName(), baseLightID = /*@__PURE__*/StyleModule.newName(), baseDarkID = /*@__PURE__*/StyleModule.newName();
    const lightDarkIDs = { "&light": "." + baseLightID, "&dark": "." + baseDarkID };
    function buildTheme(main, spec, scopes) {
        return new StyleModule(spec, {
            finish(sel) {
                return /&/.test(sel) ? sel.replace(/&\w*/, m => {
                    if (m == "&")
                        return main;
                    if (!scopes || !scopes[m])
                        throw new RangeError(`Unsupported selector: ${m}`);
                    return scopes[m];
                }) : main + " " + sel;
            }
        });
    }
    const baseTheme$2 = /*@__PURE__*/buildTheme("." + baseThemeID, {
        "&.cm-editor": {
            position: "relative !important",
            boxSizing: "border-box",
            "&.cm-focused": {
                // Provide a simple default outline to make sure a focused
                // editor is visually distinct. Can't leave the default behavior
                // because that will apply to the content element, which is
                // inside the scrollable container and doesn't include the
                // gutters. We also can't use an 'auto' outline, since those
                // are, for some reason, drawn behind the element content, which
                // will cause things like the active line background to cover
                // the outline (#297).
                outline: "1px dotted #212121"
            },
            display: "flex !important",
            flexDirection: "column"
        },
        ".cm-scroller": {
            display: "flex !important",
            alignItems: "flex-start !important",
            fontFamily: "monospace",
            lineHeight: 1.4,
            height: "100%",
            overflowX: "auto",
            position: "relative",
            zIndex: 0
        },
        ".cm-content": {
            margin: 0,
            flexGrow: 2,
            minHeight: "100%",
            display: "block",
            whiteSpace: "pre",
            wordWrap: "normal",
            boxSizing: "border-box",
            padding: "4px 0",
            outline: "none",
            "&[contenteditable=true]": {
                WebkitUserModify: "read-write-plaintext-only",
            }
        },
        ".cm-lineWrapping": {
            whiteSpace_fallback: "pre-wrap",
            whiteSpace: "break-spaces",
            wordBreak: "break-word",
            overflowWrap: "anywhere"
        },
        "&light .cm-content": { caretColor: "black" },
        "&dark .cm-content": { caretColor: "white" },
        ".cm-line": {
            display: "block",
            padding: "0 2px 0 4px"
        },
        ".cm-selectionLayer": {
            zIndex: -1,
            contain: "size style"
        },
        ".cm-selectionBackground": {
            position: "absolute",
        },
        "&light .cm-selectionBackground": {
            background: "#d9d9d9"
        },
        "&dark .cm-selectionBackground": {
            background: "#222"
        },
        "&light.cm-focused .cm-selectionBackground": {
            background: "#d7d4f0"
        },
        "&dark.cm-focused .cm-selectionBackground": {
            background: "#233"
        },
        ".cm-cursorLayer": {
            zIndex: 100,
            contain: "size style",
            pointerEvents: "none"
        },
        "&.cm-focused .cm-cursorLayer": {
            animation: "steps(1) cm-blink 1.2s infinite"
        },
        // Two animations defined so that we can switch between them to
        // restart the animation without forcing another style
        // recomputation.
        "@keyframes cm-blink": { "0%": {}, "50%": { visibility: "hidden" }, "100%": {} },
        "@keyframes cm-blink2": { "0%": {}, "50%": { visibility: "hidden" }, "100%": {} },
        ".cm-cursor, .cm-dropCursor": {
            position: "absolute",
            borderLeft: "1.2px solid black",
            marginLeft: "-0.6px",
            pointerEvents: "none",
        },
        ".cm-cursor": {
            display: "none"
        },
        "&dark .cm-cursor": {
            borderLeftColor: "#444"
        },
        "&.cm-focused .cm-cursor": {
            display: "block"
        },
        "&light .cm-activeLine": { backgroundColor: "#f3f9ff" },
        "&dark .cm-activeLine": { backgroundColor: "#223039" },
        "&light .cm-specialChar": { color: "red" },
        "&dark .cm-specialChar": { color: "#f78" },
        ".cm-tab": {
            display: "inline-block",
            overflow: "hidden",
            verticalAlign: "bottom"
        },
        ".cm-widgetBuffer": {
            verticalAlign: "text-top",
            height: "1em",
            display: "inline"
        },
        ".cm-placeholder": {
            color: "#888",
            display: "inline-block",
            verticalAlign: "top",
        },
        ".cm-button": {
            verticalAlign: "middle",
            color: "inherit",
            fontSize: "70%",
            padding: ".2em 1em",
            borderRadius: "1px"
        },
        "&light .cm-button": {
            backgroundImage: "linear-gradient(#eff1f5, #d9d9df)",
            border: "1px solid #888",
            "&:active": {
                backgroundImage: "linear-gradient(#b4b4b4, #d0d3d6)"
            }
        },
        "&dark .cm-button": {
            backgroundImage: "linear-gradient(#393939, #111)",
            border: "1px solid #888",
            "&:active": {
                backgroundImage: "linear-gradient(#111, #333)"
            }
        },
        ".cm-textfield": {
            verticalAlign: "middle",
            color: "inherit",
            fontSize: "70%",
            border: "1px solid silver",
            padding: ".2em .5em"
        },
        "&light .cm-textfield": {
            backgroundColor: "white"
        },
        "&dark .cm-textfield": {
            border: "1px solid #555",
            backgroundColor: "inherit"
        }
    }, lightDarkIDs);

    const observeOptions = {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        characterDataOldValue: true
    };
    // IE11 has very broken mutation observers, so we also listen to
    // DOMCharacterDataModified there
    const useCharData = browser.ie && browser.ie_version <= 11;
    class DOMObserver {
        constructor(view, onChange, onScrollChanged) {
            this.view = view;
            this.onChange = onChange;
            this.onScrollChanged = onScrollChanged;
            this.active = false;
            // The known selection. Kept in our own object, as opposed to just
            // directly accessing the selection because:
            //  - Safari doesn't report the right selection in shadow DOM
            //  - Reading from the selection forces a DOM layout
            //  - This way, we can ignore selectionchange events if we have
            //    already seen the 'new' selection
            this.selectionRange = new DOMSelectionState;
            // Set when a selection change is detected, cleared on flush
            this.selectionChanged = false;
            this.delayedFlush = -1;
            this.resizeTimeout = -1;
            this.queue = [];
            this.delayedAndroidKey = null;
            this.scrollTargets = [];
            this.intersection = null;
            this.resize = null;
            this.intersecting = false;
            this.gapIntersection = null;
            this.gaps = [];
            // Timeout for scheduling check of the parents that need scroll handlers
            this.parentCheck = -1;
            this.dom = view.contentDOM;
            this.observer = new MutationObserver(mutations => {
                for (let mut of mutations)
                    this.queue.push(mut);
                // IE11 will sometimes (on typing over a selection or
                // backspacing out a single character text node) call the
                // observer callback before actually updating the DOM.
                //
                // Unrelatedly, iOS Safari will, when ending a composition,
                // sometimes first clear it, deliver the mutations, and then
                // reinsert the finished text. CodeMirror's handling of the
                // deletion will prevent the reinsertion from happening,
                // breaking composition.
                if ((browser.ie && browser.ie_version <= 11 || browser.ios && view.composing) &&
                    mutations.some(m => m.type == "childList" && m.removedNodes.length ||
                        m.type == "characterData" && m.oldValue.length > m.target.nodeValue.length))
                    this.flushSoon();
                else
                    this.flush();
            });
            if (useCharData)
                this.onCharData = (event) => {
                    this.queue.push({ target: event.target,
                        type: "characterData",
                        oldValue: event.prevValue });
                    this.flushSoon();
                };
            this.onSelectionChange = this.onSelectionChange.bind(this);
            window.addEventListener("resize", this.onResize = this.onResize.bind(this));
            if (typeof ResizeObserver == "function") {
                this.resize = new ResizeObserver(() => {
                    if (this.view.docView.lastUpdate < Date.now() - 75)
                        this.onResize();
                });
                this.resize.observe(view.scrollDOM);
            }
            this.start();
            window.addEventListener("scroll", this.onScroll = this.onScroll.bind(this));
            if (typeof IntersectionObserver == "function") {
                this.intersection = new IntersectionObserver(entries => {
                    if (this.parentCheck < 0)
                        this.parentCheck = setTimeout(this.listenForScroll.bind(this), 1000);
                    if (entries.length > 0 && (entries[entries.length - 1].intersectionRatio > 0) != this.intersecting) {
                        this.intersecting = !this.intersecting;
                        if (this.intersecting != this.view.inView)
                            this.onScrollChanged(document.createEvent("Event"));
                    }
                }, {});
                this.intersection.observe(this.dom);
                this.gapIntersection = new IntersectionObserver(entries => {
                    if (entries.length > 0 && entries[entries.length - 1].intersectionRatio > 0)
                        this.onScrollChanged(document.createEvent("Event"));
                }, {});
            }
            this.listenForScroll();
            this.readSelectionRange();
            this.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
        }
        onScroll(e) {
            if (this.intersecting)
                this.flush(false);
            this.onScrollChanged(e);
        }
        onResize() {
            if (this.resizeTimeout < 0)
                this.resizeTimeout = setTimeout(() => {
                    this.resizeTimeout = -1;
                    this.view.requestMeasure();
                }, 50);
        }
        updateGaps(gaps) {
            if (this.gapIntersection && (gaps.length != this.gaps.length || this.gaps.some((g, i) => g != gaps[i]))) {
                this.gapIntersection.disconnect();
                for (let gap of gaps)
                    this.gapIntersection.observe(gap);
                this.gaps = gaps;
            }
        }
        onSelectionChange(event) {
            if (!this.readSelectionRange() || this.delayedAndroidKey)
                return;
            let { view } = this, sel = this.selectionRange;
            if (view.state.facet(editable) ? view.root.activeElement != this.dom : !hasSelection(view.dom, sel))
                return;
            let context = sel.anchorNode && view.docView.nearest(sel.anchorNode);
            if (context && context.ignoreEvent(event))
                return;
            // Deletions on IE11 fire their events in the wrong order, giving
            // us a selection change event before the DOM changes are
            // reported.
            // Chrome Android has a similar issue when backspacing out a
            // selection (#645).
            if ((browser.ie && browser.ie_version <= 11 || browser.android && browser.chrome) && !view.state.selection.main.empty &&
                // (Selection.isCollapsed isn't reliable on IE)
                sel.focusNode && isEquivalentPosition(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset))
                this.flushSoon();
            else
                this.flush(false);
        }
        readSelectionRange() {
            let { root } = this.view, domSel = getSelection(root);
            // The Selection object is broken in shadow roots in Safari. See
            // https://github.com/codemirror/codemirror.next/issues/414
            let range = browser.safari && root.nodeType == 11 && deepActiveElement() == this.view.contentDOM &&
                safariSelectionRangeHack(this.view) || domSel;
            if (this.selectionRange.eq(range))
                return false;
            this.selectionRange.setRange(range);
            return this.selectionChanged = true;
        }
        setSelectionRange(anchor, head) {
            this.selectionRange.set(anchor.node, anchor.offset, head.node, head.offset);
            this.selectionChanged = false;
        }
        listenForScroll() {
            this.parentCheck = -1;
            let i = 0, changed = null;
            for (let dom = this.dom; dom;) {
                if (dom.nodeType == 1) {
                    if (!changed && i < this.scrollTargets.length && this.scrollTargets[i] == dom)
                        i++;
                    else if (!changed)
                        changed = this.scrollTargets.slice(0, i);
                    if (changed)
                        changed.push(dom);
                    dom = dom.assignedSlot || dom.parentNode;
                }
                else if (dom.nodeType == 11) { // Shadow root
                    dom = dom.host;
                }
                else {
                    break;
                }
            }
            if (i < this.scrollTargets.length && !changed)
                changed = this.scrollTargets.slice(0, i);
            if (changed) {
                for (let dom of this.scrollTargets)
                    dom.removeEventListener("scroll", this.onScroll);
                for (let dom of this.scrollTargets = changed)
                    dom.addEventListener("scroll", this.onScroll);
            }
        }
        ignore(f) {
            if (!this.active)
                return f();
            try {
                this.stop();
                return f();
            }
            finally {
                this.start();
                this.clear();
            }
        }
        start() {
            if (this.active)
                return;
            this.observer.observe(this.dom, observeOptions);
            if (useCharData)
                this.dom.addEventListener("DOMCharacterDataModified", this.onCharData);
            this.active = true;
        }
        stop() {
            if (!this.active)
                return;
            this.active = false;
            this.observer.disconnect();
            if (useCharData)
                this.dom.removeEventListener("DOMCharacterDataModified", this.onCharData);
        }
        // Throw away any pending changes
        clear() {
            this.processRecords();
            this.queue.length = 0;
            this.selectionChanged = false;
        }
        // Chrome Android, especially in combination with GBoard, not only
        // doesn't reliably fire regular key events, but also often
        // surrounds the effect of enter or backspace with a bunch of
        // composition events that, when interrupted, cause text duplication
        // or other kinds of corruption. This hack makes the editor back off
        // from handling DOM changes for a moment when such a key is
        // detected (via beforeinput or keydown), and then dispatches the
        // key event, throwing away the DOM changes if it gets handled.
        delayAndroidKey(key, keyCode) {
            if (!this.delayedAndroidKey)
                requestAnimationFrame(() => {
                    let key = this.delayedAndroidKey;
                    this.delayedAndroidKey = null;
                    let startState = this.view.state;
                    if (dispatchKey(this.view.contentDOM, key.key, key.keyCode))
                        this.processRecords();
                    else
                        this.flush();
                    if (this.view.state == startState)
                        this.view.update([]);
                });
            // Since backspace beforeinput is sometimes signalled spuriously,
            // Enter always takes precedence.
            if (!this.delayedAndroidKey || key == "Enter")
                this.delayedAndroidKey = { key, keyCode };
        }
        flushSoon() {
            if (this.delayedFlush < 0)
                this.delayedFlush = window.setTimeout(() => { this.delayedFlush = -1; this.flush(); }, 20);
        }
        forceFlush() {
            if (this.delayedFlush >= 0) {
                window.clearTimeout(this.delayedFlush);
                this.delayedFlush = -1;
                this.flush();
            }
        }
        processRecords() {
            let records = this.queue;
            for (let mut of this.observer.takeRecords())
                records.push(mut);
            if (records.length)
                this.queue = [];
            let from = -1, to = -1, typeOver = false;
            for (let record of records) {
                let range = this.readMutation(record);
                if (!range)
                    continue;
                if (range.typeOver)
                    typeOver = true;
                if (from == -1) {
                    ({ from, to } = range);
                }
                else {
                    from = Math.min(range.from, from);
                    to = Math.max(range.to, to);
                }
            }
            return { from, to, typeOver };
        }
        // Apply pending changes, if any
        flush(readSelection = true) {
            // Completely hold off flushing when pending keys are set—the code
            // managing those will make sure processRecords is called and the
            // view is resynchronized after
            if (this.delayedFlush >= 0 || this.delayedAndroidKey)
                return;
            if (readSelection)
                this.readSelectionRange();
            let { from, to, typeOver } = this.processRecords();
            let newSel = this.selectionChanged && hasSelection(this.dom, this.selectionRange);
            if (from < 0 && !newSel)
                return;
            this.selectionChanged = false;
            let startState = this.view.state;
            this.onChange(from, to, typeOver);
            // The view wasn't updated
            if (this.view.state == startState)
                this.view.update([]);
        }
        readMutation(rec) {
            let cView = this.view.docView.nearest(rec.target);
            if (!cView || cView.ignoreMutation(rec))
                return null;
            cView.markDirty(rec.type == "attributes");
            if (rec.type == "attributes")
                cView.dirty |= 4 /* Attrs */;
            if (rec.type == "childList") {
                let childBefore = findChild(cView, rec.previousSibling || rec.target.previousSibling, -1);
                let childAfter = findChild(cView, rec.nextSibling || rec.target.nextSibling, 1);
                return { from: childBefore ? cView.posAfter(childBefore) : cView.posAtStart,
                    to: childAfter ? cView.posBefore(childAfter) : cView.posAtEnd, typeOver: false };
            }
            else if (rec.type == "characterData") {
                return { from: cView.posAtStart, to: cView.posAtEnd, typeOver: rec.target.nodeValue == rec.oldValue };
            }
            else {
                return null;
            }
        }
        destroy() {
            var _a, _b, _c;
            this.stop();
            (_a = this.intersection) === null || _a === void 0 ? void 0 : _a.disconnect();
            (_b = this.gapIntersection) === null || _b === void 0 ? void 0 : _b.disconnect();
            (_c = this.resize) === null || _c === void 0 ? void 0 : _c.disconnect();
            for (let dom of this.scrollTargets)
                dom.removeEventListener("scroll", this.onScroll);
            window.removeEventListener("scroll", this.onScroll);
            window.removeEventListener("resize", this.onResize);
            this.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
            clearTimeout(this.parentCheck);
            clearTimeout(this.resizeTimeout);
        }
    }
    function findChild(cView, dom, dir) {
        while (dom) {
            let curView = ContentView.get(dom);
            if (curView && curView.parent == cView)
                return curView;
            let parent = dom.parentNode;
            dom = parent != cView.dom ? parent : dir > 0 ? dom.nextSibling : dom.previousSibling;
        }
        return null;
    }
    // Used to work around a Safari Selection/shadow DOM bug (#414)
    function safariSelectionRangeHack(view) {
        let found = null;
        // Because Safari (at least in 2018-2021) doesn't provide regular
        // access to the selection inside a shadowroot, we have to perform a
        // ridiculous hack to get at it—using `execCommand` to trigger a
        // `beforeInput` event so that we can read the target range from the
        // event.
        function read(event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            found = event.getTargetRanges()[0];
        }
        view.contentDOM.addEventListener("beforeinput", read, true);
        document.execCommand("indent");
        view.contentDOM.removeEventListener("beforeinput", read, true);
        if (!found)
            return null;
        let anchorNode = found.startContainer, anchorOffset = found.startOffset;
        let focusNode = found.endContainer, focusOffset = found.endOffset;
        let curAnchor = view.docView.domAtPos(view.state.selection.main.anchor);
        // Since such a range doesn't distinguish between anchor and head,
        // use a heuristic that flips it around if its end matches the
        // current anchor.
        if (isEquivalentPosition(curAnchor.node, curAnchor.offset, focusNode, focusOffset))
            [anchorNode, anchorOffset, focusNode, focusOffset] = [focusNode, focusOffset, anchorNode, anchorOffset];
        return { anchorNode, anchorOffset, focusNode, focusOffset };
    }

    function applyDOMChange(view, start, end, typeOver) {
        let change, newSel;
        let sel = view.state.selection.main;
        if (start > -1) {
            let bounds = view.docView.domBoundsAround(start, end, 0);
            if (!bounds || view.state.readOnly)
                return;
            let { from, to } = bounds;
            let selPoints = view.docView.impreciseHead || view.docView.impreciseAnchor ? [] : selectionPoints(view);
            let reader = new DOMReader(selPoints, view.state);
            reader.readRange(bounds.startDOM, bounds.endDOM);
            let preferredPos = sel.from, preferredSide = null;
            // Prefer anchoring to end when Backspace is pressed (or, on
            // Android, when something was deleted)
            if (view.inputState.lastKeyCode === 8 && view.inputState.lastKeyTime > Date.now() - 100 ||
                browser.android && reader.text.length < to - from) {
                preferredPos = sel.to;
                preferredSide = "end";
            }
            let diff = findDiff(view.state.doc.sliceString(from, to, LineBreakPlaceholder), reader.text, preferredPos - from, preferredSide);
            if (diff) {
                // Chrome inserts two newlines when pressing shift-enter at the
                // end of a line. This drops one of those.
                if (browser.chrome && view.inputState.lastKeyCode == 13 &&
                    diff.toB == diff.from + 2 && reader.text.slice(diff.from, diff.toB) == LineBreakPlaceholder + LineBreakPlaceholder)
                    diff.toB--;
                change = { from: from + diff.from, to: from + diff.toA,
                    insert: Text.of(reader.text.slice(diff.from, diff.toB).split(LineBreakPlaceholder)) };
            }
            newSel = selectionFromPoints(selPoints, from);
        }
        else if (view.hasFocus || !view.state.facet(editable)) {
            let domSel = view.observer.selectionRange;
            let { impreciseHead: iHead, impreciseAnchor: iAnchor } = view.docView;
            let head = iHead && iHead.node == domSel.focusNode && iHead.offset == domSel.focusOffset ||
                !contains(view.contentDOM, domSel.focusNode)
                ? view.state.selection.main.head
                : view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset);
            let anchor = iAnchor && iAnchor.node == domSel.anchorNode && iAnchor.offset == domSel.anchorOffset ||
                !contains(view.contentDOM, domSel.anchorNode)
                ? view.state.selection.main.anchor
                : view.docView.posFromDOM(domSel.anchorNode, domSel.anchorOffset);
            if (head != sel.head || anchor != sel.anchor)
                newSel = EditorSelection.single(anchor, head);
        }
        if (!change && !newSel)
            return;
        // Heuristic to notice typing over a selected character
        if (!change && typeOver && !sel.empty && newSel && newSel.main.empty)
            change = { from: sel.from, to: sel.to, insert: view.state.doc.slice(sel.from, sel.to) };
        // If the change is inside the selection and covers most of it,
        // assume it is a selection replace (with identical characters at
        // the start/end not included in the diff)
        else if (change && change.from >= sel.from && change.to <= sel.to &&
            (change.from != sel.from || change.to != sel.to) &&
            (sel.to - sel.from) - (change.to - change.from) <= 4)
            change = {
                from: sel.from, to: sel.to,
                insert: view.state.doc.slice(sel.from, change.from).append(change.insert).append(view.state.doc.slice(change.to, sel.to))
            };
        if (change) {
            let startState = view.state;
            if (browser.ios && view.inputState.flushIOSKey(view))
                return;
            // Android browsers don't fire reasonable key events for enter,
            // backspace, or delete. So this detects changes that look like
            // they're caused by those keys, and reinterprets them as key
            // events. (Some of these keys are also handled by beforeinput
            // events and the pendingAndroidKey mechanism, but that's not
            // reliable in all situations.)
            if (browser.android &&
                ((change.from == sel.from && change.to == sel.to &&
                    change.insert.length == 1 && change.insert.lines == 2 &&
                    dispatchKey(view.contentDOM, "Enter", 13)) ||
                    (change.from == sel.from - 1 && change.to == sel.to && change.insert.length == 0 &&
                        dispatchKey(view.contentDOM, "Backspace", 8)) ||
                    (change.from == sel.from && change.to == sel.to + 1 && change.insert.length == 0 &&
                        dispatchKey(view.contentDOM, "Delete", 46))))
                return;
            let text = change.insert.toString();
            if (view.state.facet(inputHandler).some(h => h(view, change.from, change.to, text)))
                return;
            if (view.inputState.composing >= 0)
                view.inputState.composing++;
            let tr;
            if (change.from >= sel.from && change.to <= sel.to && change.to - change.from >= (sel.to - sel.from) / 3 &&
                (!newSel || newSel.main.empty && newSel.main.from == change.from + change.insert.length) &&
                view.inputState.composing < 0) {
                let before = sel.from < change.from ? startState.sliceDoc(sel.from, change.from) : "";
                let after = sel.to > change.to ? startState.sliceDoc(change.to, sel.to) : "";
                tr = startState.replaceSelection(view.state.toText(before + change.insert.sliceString(0, undefined, view.state.lineBreak) + after));
            }
            else {
                let changes = startState.changes(change);
                let mainSel = newSel && !startState.selection.main.eq(newSel.main) && newSel.main.to <= changes.newLength
                    ? newSel.main : undefined;
                // Try to apply a composition change to all cursors
                if (startState.selection.ranges.length > 1 && view.inputState.composing >= 0 &&
                    change.to <= sel.to && change.to >= sel.to - 10) {
                    let replaced = view.state.sliceDoc(change.from, change.to);
                    let compositionRange = compositionSurroundingNode(view) || view.state.doc.lineAt(sel.head);
                    let offset = sel.to - change.to, size = sel.to - sel.from;
                    tr = startState.changeByRange(range => {
                        if (range.from == sel.from && range.to == sel.to)
                            return { changes, range: mainSel || range.map(changes) };
                        let to = range.to - offset, from = to - replaced.length;
                        if (range.to - range.from != size || view.state.sliceDoc(from, to) != replaced ||
                            // Unfortunately, there's no way to make multiple
                            // changes in the same node work without aborting
                            // composition, so cursors in the composition range are
                            // ignored.
                            compositionRange && range.to >= compositionRange.from && range.from <= compositionRange.to)
                            return { range };
                        let rangeChanges = startState.changes({ from, to, insert: change.insert }), selOff = range.to - sel.to;
                        return {
                            changes: rangeChanges,
                            range: !mainSel ? range.map(rangeChanges) :
                                EditorSelection.range(Math.max(0, mainSel.anchor + selOff), Math.max(0, mainSel.head + selOff))
                        };
                    });
                }
                else {
                    tr = {
                        changes,
                        selection: mainSel && startState.selection.replaceRange(mainSel)
                    };
                }
            }
            let userEvent = "input.type";
            if (view.composing) {
                userEvent += ".compose";
                if (view.inputState.compositionFirstChange) {
                    userEvent += ".start";
                    view.inputState.compositionFirstChange = false;
                }
            }
            view.dispatch(tr, { scrollIntoView: true, userEvent });
        }
        else if (newSel && !newSel.main.eq(sel)) {
            let scrollIntoView = false, userEvent = "select";
            if (view.inputState.lastSelectionTime > Date.now() - 50) {
                if (view.inputState.lastSelectionOrigin == "select")
                    scrollIntoView = true;
                userEvent = view.inputState.lastSelectionOrigin;
            }
            view.dispatch({ selection: newSel, scrollIntoView, userEvent });
        }
    }
    function findDiff(a, b, preferredPos, preferredSide) {
        let minLen = Math.min(a.length, b.length);
        let from = 0;
        while (from < minLen && a.charCodeAt(from) == b.charCodeAt(from))
            from++;
        if (from == minLen && a.length == b.length)
            return null;
        let toA = a.length, toB = b.length;
        while (toA > 0 && toB > 0 && a.charCodeAt(toA - 1) == b.charCodeAt(toB - 1)) {
            toA--;
            toB--;
        }
        if (preferredSide == "end") {
            let adjust = Math.max(0, from - Math.min(toA, toB));
            preferredPos -= toA + adjust - from;
        }
        if (toA < from && a.length < b.length) {
            let move = preferredPos <= from && preferredPos >= toA ? from - preferredPos : 0;
            from -= move;
            toB = from + (toB - toA);
            toA = from;
        }
        else if (toB < from) {
            let move = preferredPos <= from && preferredPos >= toB ? from - preferredPos : 0;
            from -= move;
            toA = from + (toA - toB);
            toB = from;
        }
        return { from, toA, toB };
    }
    function selectionPoints(view) {
        let result = [];
        if (view.root.activeElement != view.contentDOM)
            return result;
        let { anchorNode, anchorOffset, focusNode, focusOffset } = view.observer.selectionRange;
        if (anchorNode) {
            result.push(new DOMPoint(anchorNode, anchorOffset));
            if (focusNode != anchorNode || focusOffset != anchorOffset)
                result.push(new DOMPoint(focusNode, focusOffset));
        }
        return result;
    }
    function selectionFromPoints(points, base) {
        if (points.length == 0)
            return null;
        let anchor = points[0].pos, head = points.length == 2 ? points[1].pos : anchor;
        return anchor > -1 && head > -1 ? EditorSelection.single(anchor + base, head + base) : null;
    }

    // The editor's update state machine looks something like this:
    //
    //     Idle → Updating ⇆ Idle (unchecked) → Measuring → Idle
    //                                         ↑      ↓
    //                                         Updating (measure)
    //
    // The difference between 'Idle' and 'Idle (unchecked)' lies in
    // whether a layout check has been scheduled. A regular update through
    // the `update` method updates the DOM in a write-only fashion, and
    // relies on a check (scheduled with `requestAnimationFrame`) to make
    // sure everything is where it should be and the viewport covers the
    // visible code. That check continues to measure and then optionally
    // update until it reaches a coherent state.
    /**
    An editor view represents the editor's user interface. It holds
    the editable DOM surface, and possibly other elements such as the
    line number gutter. It handles events and dispatches state
    transactions for editing actions.
    */
    class EditorView {
        /**
        Construct a new view. You'll usually want to put `view.dom` into
        your document after creating a view, so that the user can see
        it.
        */
        constructor(
        /**
        Initialization options.
        */
        config = {}) {
            this.plugins = [];
            this.pluginMap = new Map;
            this.editorAttrs = {};
            this.contentAttrs = {};
            this.bidiCache = [];
            this.destroyed = false;
            /**
            @internal
            */
            this.updateState = 2 /* Updating */;
            /**
            @internal
            */
            this.measureScheduled = -1;
            /**
            @internal
            */
            this.measureRequests = [];
            this.contentDOM = document.createElement("div");
            this.scrollDOM = document.createElement("div");
            this.scrollDOM.tabIndex = -1;
            this.scrollDOM.className = "cm-scroller";
            this.scrollDOM.appendChild(this.contentDOM);
            this.announceDOM = document.createElement("div");
            this.announceDOM.style.cssText = "position: absolute; top: -10000px";
            this.announceDOM.setAttribute("aria-live", "polite");
            this.dom = document.createElement("div");
            this.dom.appendChild(this.announceDOM);
            this.dom.appendChild(this.scrollDOM);
            this._dispatch = config.dispatch || ((tr) => this.update([tr]));
            this.dispatch = this.dispatch.bind(this);
            this.root = (config.root || getRoot(config.parent) || document);
            this.viewState = new ViewState(config.state || EditorState.create());
            this.plugins = this.state.facet(viewPlugin).map(spec => new PluginInstance(spec));
            for (let plugin of this.plugins)
                plugin.update(this);
            this.observer = new DOMObserver(this, (from, to, typeOver) => {
                applyDOMChange(this, from, to, typeOver);
            }, event => {
                this.inputState.runScrollHandlers(this, event);
                if (this.observer.intersecting)
                    this.measure();
            });
            this.inputState = new InputState(this);
            this.docView = new DocView(this);
            this.mountStyles();
            this.updateAttrs();
            this.updateState = 0 /* Idle */;
            this.requestMeasure();
            if (config.parent)
                config.parent.appendChild(this.dom);
        }
        /**
        The current editor state.
        */
        get state() { return this.viewState.state; }
        /**
        To be able to display large documents without consuming too much
        memory or overloading the browser, CodeMirror only draws the
        code that is visible (plus a margin around it) to the DOM. This
        property tells you the extent of the current drawn viewport, in
        document positions.
        */
        get viewport() { return this.viewState.viewport; }
        /**
        When there are, for example, large collapsed ranges in the
        viewport, its size can be a lot bigger than the actual visible
        content. Thus, if you are doing something like styling the
        content in the viewport, it is preferable to only do so for
        these ranges, which are the subset of the viewport that is
        actually drawn.
        */
        get visibleRanges() { return this.viewState.visibleRanges; }
        /**
        Returns false when the editor is entirely scrolled out of view
        or otherwise hidden.
        */
        get inView() { return this.viewState.inView; }
        /**
        Indicates whether the user is currently composing text via
        [IME](https://en.wikipedia.org/wiki/Input_method), and at least
        one change has been made in the current composition.
        */
        get composing() { return this.inputState.composing > 0; }
        /**
        Indicates whether the user is currently in composing state. Note
        that on some platforms, like Android, this will be the case a
        lot, since just putting the cursor on a word starts a
        composition there.
        */
        get compositionStarted() { return this.inputState.composing >= 0; }
        dispatch(...input) {
            this._dispatch(input.length == 1 && input[0] instanceof Transaction ? input[0]
                : this.state.update(...input));
        }
        /**
        Update the view for the given array of transactions. This will
        update the visible document and selection to match the state
        produced by the transactions, and notify view plugins of the
        change. You should usually call
        [`dispatch`](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch) instead, which uses this
        as a primitive.
        */
        update(transactions) {
            if (this.updateState != 0 /* Idle */)
                throw new Error("Calls to EditorView.update are not allowed while an update is in progress");
            let redrawn = false, update;
            let state = this.state;
            for (let tr of transactions) {
                if (tr.startState != state)
                    throw new RangeError("Trying to update state with a transaction that doesn't start from the previous state.");
                state = tr.state;
            }
            if (this.destroyed) {
                this.viewState.state = state;
                return;
            }
            // When the phrases change, redraw the editor
            if (state.facet(EditorState.phrases) != this.state.facet(EditorState.phrases))
                return this.setState(state);
            update = new ViewUpdate(this, state, transactions);
            let scrollTarget = this.viewState.scrollTarget;
            try {
                this.updateState = 2 /* Updating */;
                for (let tr of transactions) {
                    if (scrollTarget)
                        scrollTarget = scrollTarget.map(tr.changes);
                    if (tr.scrollIntoView) {
                        let { main } = tr.state.selection;
                        scrollTarget = new ScrollTarget(main.empty ? main : EditorSelection.cursor(main.head, main.head > main.anchor ? -1 : 1));
                    }
                    for (let e of tr.effects) {
                        if (e.is(scrollTo))
                            scrollTarget = new ScrollTarget(e.value);
                        else if (e.is(centerOn))
                            scrollTarget = new ScrollTarget(e.value, "center");
                        else if (e.is(scrollIntoView))
                            scrollTarget = e.value;
                    }
                }
                this.viewState.update(update, scrollTarget);
                this.bidiCache = CachedOrder.update(this.bidiCache, update.changes);
                if (!update.empty) {
                    this.updatePlugins(update);
                    this.inputState.update(update);
                }
                redrawn = this.docView.update(update);
                if (this.state.facet(styleModule) != this.styleModules)
                    this.mountStyles();
                this.updateAttrs();
                this.showAnnouncements(transactions);
                this.docView.updateSelection(redrawn, transactions.some(tr => tr.isUserEvent("select.pointer")));
            }
            finally {
                this.updateState = 0 /* Idle */;
            }
            if (update.startState.facet(theme) != update.state.facet(theme))
                this.viewState.mustMeasureContent = true;
            if (redrawn || scrollTarget || this.viewState.mustEnforceCursorAssoc || this.viewState.mustMeasureContent)
                this.requestMeasure();
            if (!update.empty)
                for (let listener of this.state.facet(updateListener))
                    listener(update);
        }
        /**
        Reset the view to the given state. (This will cause the entire
        document to be redrawn and all view plugins to be reinitialized,
        so you should probably only use it when the new state isn't
        derived from the old state. Otherwise, use
        [`dispatch`](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch) instead.)
        */
        setState(newState) {
            if (this.updateState != 0 /* Idle */)
                throw new Error("Calls to EditorView.setState are not allowed while an update is in progress");
            if (this.destroyed) {
                this.viewState.state = newState;
                return;
            }
            this.updateState = 2 /* Updating */;
            let hadFocus = this.hasFocus;
            try {
                for (let plugin of this.plugins)
                    plugin.destroy(this);
                this.viewState = new ViewState(newState);
                this.plugins = newState.facet(viewPlugin).map(spec => new PluginInstance(spec));
                this.pluginMap.clear();
                for (let plugin of this.plugins)
                    plugin.update(this);
                this.docView = new DocView(this);
                this.inputState.ensureHandlers(this);
                this.mountStyles();
                this.updateAttrs();
                this.bidiCache = [];
            }
            finally {
                this.updateState = 0 /* Idle */;
            }
            if (hadFocus)
                this.focus();
            this.requestMeasure();
        }
        updatePlugins(update) {
            let prevSpecs = update.startState.facet(viewPlugin), specs = update.state.facet(viewPlugin);
            if (prevSpecs != specs) {
                let newPlugins = [];
                for (let spec of specs) {
                    let found = prevSpecs.indexOf(spec);
                    if (found < 0) {
                        newPlugins.push(new PluginInstance(spec));
                    }
                    else {
                        let plugin = this.plugins[found];
                        plugin.mustUpdate = update;
                        newPlugins.push(plugin);
                    }
                }
                for (let plugin of this.plugins)
                    if (plugin.mustUpdate != update)
                        plugin.destroy(this);
                this.plugins = newPlugins;
                this.pluginMap.clear();
                this.inputState.ensureHandlers(this);
            }
            else {
                for (let p of this.plugins)
                    p.mustUpdate = update;
            }
            for (let i = 0; i < this.plugins.length; i++)
                this.plugins[i].update(this);
        }
        /**
        @internal
        */
        measure(flush = true) {
            if (this.destroyed)
                return;
            if (this.measureScheduled > -1)
                cancelAnimationFrame(this.measureScheduled);
            this.measureScheduled = 0; // Prevent requestMeasure calls from scheduling another animation frame
            if (flush)
                this.observer.flush();
            let updated = null;
            try {
                for (let i = 0;; i++) {
                    this.updateState = 1 /* Measuring */;
                    let oldViewport = this.viewport;
                    let changed = this.viewState.measure(this);
                    if (!changed && !this.measureRequests.length && this.viewState.scrollTarget == null)
                        break;
                    if (i > 5) {
                        console.warn(this.measureRequests.length
                            ? "Measure loop restarted more than 5 times"
                            : "Viewport failed to stabilize");
                        break;
                    }
                    let measuring = [];
                    // Only run measure requests in this cycle when the viewport didn't change
                    if (!(changed & 4 /* Viewport */))
                        [this.measureRequests, measuring] = [measuring, this.measureRequests];
                    let measured = measuring.map(m => {
                        try {
                            return m.read(this);
                        }
                        catch (e) {
                            logException(this.state, e);
                            return BadMeasure;
                        }
                    });
                    let update = new ViewUpdate(this, this.state), redrawn = false, scrolled = false;
                    update.flags |= changed;
                    if (!updated)
                        updated = update;
                    else
                        updated.flags |= changed;
                    this.updateState = 2 /* Updating */;
                    if (!update.empty) {
                        this.updatePlugins(update);
                        this.inputState.update(update);
                        this.updateAttrs();
                        redrawn = this.docView.update(update);
                    }
                    for (let i = 0; i < measuring.length; i++)
                        if (measured[i] != BadMeasure) {
                            try {
                                let m = measuring[i];
                                if (m.write)
                                    m.write(measured[i], this);
                            }
                            catch (e) {
                                logException(this.state, e);
                            }
                        }
                    if (this.viewState.scrollTarget) {
                        this.docView.scrollIntoView(this.viewState.scrollTarget);
                        this.viewState.scrollTarget = null;
                        scrolled = true;
                    }
                    if (redrawn)
                        this.docView.updateSelection(true);
                    if (this.viewport.from == oldViewport.from && this.viewport.to == oldViewport.to &&
                        !scrolled && this.measureRequests.length == 0)
                        break;
                }
            }
            finally {
                this.updateState = 0 /* Idle */;
                this.measureScheduled = -1;
            }
            if (updated && !updated.empty)
                for (let listener of this.state.facet(updateListener))
                    listener(updated);
        }
        /**
        Get the CSS classes for the currently active editor themes.
        */
        get themeClasses() {
            return baseThemeID + " " +
                (this.state.facet(darkTheme) ? baseDarkID : baseLightID) + " " +
                this.state.facet(theme);
        }
        updateAttrs() {
            let editorAttrs = attrsFromFacet(this, editorAttributes, {
                class: "cm-editor" + (this.hasFocus ? " cm-focused " : " ") + this.themeClasses
            });
            let contentAttrs = {
                spellcheck: "false",
                autocorrect: "off",
                autocapitalize: "off",
                translate: "no",
                contenteditable: !this.state.facet(editable) ? "false" : "true",
                class: "cm-content",
                style: `${browser.tabSize}: ${this.state.tabSize}`,
                role: "textbox",
                "aria-multiline": "true"
            };
            if (this.state.readOnly)
                contentAttrs["aria-readonly"] = "true";
            attrsFromFacet(this, contentAttributes, contentAttrs);
            this.observer.ignore(() => {
                updateAttrs(this.contentDOM, this.contentAttrs, contentAttrs);
                updateAttrs(this.dom, this.editorAttrs, editorAttrs);
            });
            this.editorAttrs = editorAttrs;
            this.contentAttrs = contentAttrs;
        }
        showAnnouncements(trs) {
            let first = true;
            for (let tr of trs)
                for (let effect of tr.effects)
                    if (effect.is(EditorView.announce)) {
                        if (first)
                            this.announceDOM.textContent = "";
                        first = false;
                        let div = this.announceDOM.appendChild(document.createElement("div"));
                        div.textContent = effect.value;
                    }
        }
        mountStyles() {
            this.styleModules = this.state.facet(styleModule);
            StyleModule.mount(this.root, this.styleModules.concat(baseTheme$2).reverse());
        }
        readMeasured() {
            if (this.updateState == 2 /* Updating */)
                throw new Error("Reading the editor layout isn't allowed during an update");
            if (this.updateState == 0 /* Idle */ && this.measureScheduled > -1)
                this.measure(false);
        }
        /**
        Schedule a layout measurement, optionally providing callbacks to
        do custom DOM measuring followed by a DOM write phase. Using
        this is preferable reading DOM layout directly from, for
        example, an event handler, because it'll make sure measuring and
        drawing done by other components is synchronized, avoiding
        unnecessary DOM layout computations.
        */
        requestMeasure(request) {
            if (this.measureScheduled < 0)
                this.measureScheduled = requestAnimationFrame(() => this.measure());
            if (request) {
                if (request.key != null)
                    for (let i = 0; i < this.measureRequests.length; i++) {
                        if (this.measureRequests[i].key === request.key) {
                            this.measureRequests[i] = request;
                            return;
                        }
                    }
                this.measureRequests.push(request);
            }
        }
        /**
        Collect all values provided by the active plugins for a given
        field.
        */
        pluginField(field) {
            let result = [];
            for (let plugin of this.plugins)
                plugin.update(this).takeField(field, result);
            return result;
        }
        /**
        Get the value of a specific plugin, if present. Note that
        plugins that crash can be dropped from a view, so even when you
        know you registered a given plugin, it is recommended to check
        the return value of this method.
        */
        plugin(plugin) {
            let known = this.pluginMap.get(plugin);
            if (known === undefined || known && known.spec != plugin)
                this.pluginMap.set(plugin, known = this.plugins.find(p => p.spec == plugin) || null);
            return known && known.update(this).value;
        }
        /**
        The top position of the document, in screen coordinates. This
        may be negative when the editor is scrolled down. Points
        directly to the top of the first line, not above the padding.
        */
        get documentTop() {
            return this.contentDOM.getBoundingClientRect().top + this.viewState.paddingTop;
        }
        /**
        Reports the padding above and below the document.
        */
        get documentPadding() {
            return { top: this.viewState.paddingTop, bottom: this.viewState.paddingBottom };
        }
        /**
        Find the line or block widget at the given vertical position.
        
        By default, this position is interpreted as a screen position,
        meaning `docTop` is set to the DOM top position of the editor
        content (forcing a layout). You can pass a different `docTop`
        value—for example 0 to interpret `height` as a document-relative
        position, or a precomputed document top
        (`view.contentDOM.getBoundingClientRect().top`) to limit layout
        queries.
        
        *Deprecated: use `elementAtHeight` instead.*
        */
        blockAtHeight(height, docTop) {
            let top = ensureTop(docTop, this);
            return this.elementAtHeight(height - top).moveY(top);
        }
        /**
        Find the text line or block widget at the given vertical
        position (which is interpreted as relative to the [top of the
        document](https://codemirror.net/6/docs/ref/#view.EditorView.documentTop)
        */
        elementAtHeight(height) {
            this.readMeasured();
            return this.viewState.elementAtHeight(height);
        }
        /**
        Find information for the visual line (see
        [`visualLineAt`](https://codemirror.net/6/docs/ref/#view.EditorView.visualLineAt)) at the given
        vertical position. The resulting block info might hold another
        array of block info structs in its `type` field if this line
        consists of more than one block.
        
        Defaults to treating `height` as a screen position. See
        [`blockAtHeight`](https://codemirror.net/6/docs/ref/#view.EditorView.blockAtHeight) for the
        interpretation of the `docTop` parameter.
        
        *Deprecated: use `lineBlockAtHeight` instead.*
        */
        visualLineAtHeight(height, docTop) {
            let top = ensureTop(docTop, this);
            return this.lineBlockAtHeight(height - top).moveY(top);
        }
        /**
        Find the line block (see
        [`lineBlockAt`](https://codemirror.net/6/docs/ref/#view.EditorView.lineBlockAt) at the given
        height.
        */
        lineBlockAtHeight(height) {
            this.readMeasured();
            return this.viewState.lineBlockAtHeight(height);
        }
        /**
        Iterate over the height information of the visual lines in the
        viewport. The heights of lines are reported relative to the
        given document top, which defaults to the screen position of the
        document (forcing a layout).
        
        *Deprecated: use `viewportLineBlocks` instead.*
        */
        viewportLines(f, docTop) {
            let top = ensureTop(docTop, this);
            for (let line of this.viewportLineBlocks)
                f(line.moveY(top));
        }
        /**
        Get the extent and vertical position of all [line
        blocks](https://codemirror.net/6/docs/ref/#view.EditorView.lineBlockAt) in the viewport. Positions
        are relative to the [top of the
        document](https://codemirror.net/6/docs/ref/#view.EditorView.documentTop);
        */
        get viewportLineBlocks() {
            return this.viewState.viewportLines;
        }
        /**
        Find the extent and height of the visual line (a range delimited
        on both sides by either non-[hidden](https://codemirror.net/6/docs/ref/#view.Decoration^range)
        line breaks, or the start/end of the document) at the given position.
        
        Vertical positions are computed relative to the `docTop`
        argument, which defaults to 0 for this method. You can pass
        `view.contentDOM.getBoundingClientRect().top` here to get screen
        coordinates.
        
        *Deprecated: use `lineBlockAt` instead.*
        */
        visualLineAt(pos, docTop = 0) {
            return this.lineBlockAt(pos).moveY(docTop + this.viewState.paddingTop);
        }
        /**
        Find the line block around the given document position. A line
        block is a range delimited on both sides by either a
        non-[hidden](https://codemirror.net/6/docs/ref/#view.Decoration^range) line breaks, or the
        start/end of the document. It will usually just hold a line of
        text, but may be broken into multiple textblocks by block
        widgets.
        */
        lineBlockAt(pos) {
            return this.viewState.lineBlockAt(pos);
        }
        /**
        The editor's total content height.
        */
        get contentHeight() {
            return this.viewState.contentHeight;
        }
        /**
        Move a cursor position by [grapheme
        cluster](https://codemirror.net/6/docs/ref/#text.findClusterBreak). `forward` determines whether
        the motion is away from the line start, or towards it. Motion in
        bidirectional text is in visual order, in the editor's [text
        direction](https://codemirror.net/6/docs/ref/#view.EditorView.textDirection). When the start
        position was the last one on the line, the returned position
        will be across the line break. If there is no further line, the
        original position is returned.
        
        By default, this method moves over a single cluster. The
        optional `by` argument can be used to move across more. It will
        be called with the first cluster as argument, and should return
        a predicate that determines, for each subsequent cluster,
        whether it should also be moved over.
        */
        moveByChar(start, forward, by) {
            return skipAtoms(this, start, moveByChar(this, start, forward, by));
        }
        /**
        Move a cursor position across the next group of either
        [letters](https://codemirror.net/6/docs/ref/#state.EditorState.charCategorizer) or non-letter
        non-whitespace characters.
        */
        moveByGroup(start, forward) {
            return skipAtoms(this, start, moveByChar(this, start, forward, initial => byGroup(this, start.head, initial)));
        }
        /**
        Move to the next line boundary in the given direction. If
        `includeWrap` is true, line wrapping is on, and there is a
        further wrap point on the current line, the wrap point will be
        returned. Otherwise this function will return the start or end
        of the line.
        */
        moveToLineBoundary(start, forward, includeWrap = true) {
            return moveToLineBoundary(this, start, forward, includeWrap);
        }
        /**
        Move a cursor position vertically. When `distance` isn't given,
        it defaults to moving to the next line (including wrapped
        lines). Otherwise, `distance` should provide a positive distance
        in pixels.
        
        When `start` has a
        [`goalColumn`](https://codemirror.net/6/docs/ref/#state.SelectionRange.goalColumn), the vertical
        motion will use that as a target horizontal position. Otherwise,
        the cursor's own horizontal position is used. The returned
        cursor will have its goal column set to whichever column was
        used.
        */
        moveVertically(start, forward, distance) {
            return skipAtoms(this, start, moveVertically(this, start, forward, distance));
        }
        // FIXME remove on next major version
        scrollPosIntoView(pos) {
            this.dispatch({ effects: scrollTo.of(EditorSelection.cursor(pos)) });
        }
        /**
        Find the DOM parent node and offset (child offset if `node` is
        an element, character offset when it is a text node) at the
        given document position.
        
        Note that for positions that aren't currently in
        `visibleRanges`, the resulting DOM position isn't necessarily
        meaningful (it may just point before or after a placeholder
        element).
        */
        domAtPos(pos) {
            return this.docView.domAtPos(pos);
        }
        /**
        Find the document position at the given DOM node. Can be useful
        for associating positions with DOM events. Will raise an error
        when `node` isn't part of the editor content.
        */
        posAtDOM(node, offset = 0) {
            return this.docView.posFromDOM(node, offset);
        }
        posAtCoords(coords, precise = true) {
            this.readMeasured();
            return posAtCoords(this, coords, precise);
        }
        /**
        Get the screen coordinates at the given document position.
        `side` determines whether the coordinates are based on the
        element before (-1) or after (1) the position (if no element is
        available on the given side, the method will transparently use
        another strategy to get reasonable coordinates).
        */
        coordsAtPos(pos, side = 1) {
            this.readMeasured();
            let rect = this.docView.coordsAt(pos, side);
            if (!rect || rect.left == rect.right)
                return rect;
            let line = this.state.doc.lineAt(pos), order = this.bidiSpans(line);
            let span = order[BidiSpan.find(order, pos - line.from, -1, side)];
            return flattenRect(rect, (span.dir == Direction.LTR) == (side > 0));
        }
        /**
        The default width of a character in the editor. May not
        accurately reflect the width of all characters (given variable
        width fonts or styling of invididual ranges).
        */
        get defaultCharacterWidth() { return this.viewState.heightOracle.charWidth; }
        /**
        The default height of a line in the editor. May not be accurate
        for all lines.
        */
        get defaultLineHeight() { return this.viewState.heightOracle.lineHeight; }
        /**
        The text direction
        ([`direction`](https://developer.mozilla.org/en-US/docs/Web/CSS/direction)
        CSS property) of the editor.
        */
        get textDirection() { return this.viewState.heightOracle.direction; }
        /**
        Whether this editor [wraps lines](https://codemirror.net/6/docs/ref/#view.EditorView.lineWrapping)
        (as determined by the
        [`white-space`](https://developer.mozilla.org/en-US/docs/Web/CSS/white-space)
        CSS property of its content element).
        */
        get lineWrapping() { return this.viewState.heightOracle.lineWrapping; }
        /**
        Returns the bidirectional text structure of the given line
        (which should be in the current document) as an array of span
        objects. The order of these spans matches the [text
        direction](https://codemirror.net/6/docs/ref/#view.EditorView.textDirection)—if that is
        left-to-right, the leftmost spans come first, otherwise the
        rightmost spans come first.
        */
        bidiSpans(line) {
            if (line.length > MaxBidiLine)
                return trivialOrder(line.length);
            let dir = this.textDirection;
            for (let entry of this.bidiCache)
                if (entry.from == line.from && entry.dir == dir)
                    return entry.order;
            let order = computeOrder(line.text, this.textDirection);
            this.bidiCache.push(new CachedOrder(line.from, line.to, dir, order));
            return order;
        }
        /**
        Check whether the editor has focus.
        */
        get hasFocus() {
            var _a;
            // Safari return false for hasFocus when the context menu is open
            // or closing, which leads us to ignore selection changes from the
            // context menu because it looks like the editor isn't focused.
            // This kludges around that.
            return (document.hasFocus() || browser.safari && ((_a = this.inputState) === null || _a === void 0 ? void 0 : _a.lastContextMenu) > Date.now() - 3e4) &&
                this.root.activeElement == this.contentDOM;
        }
        /**
        Put focus on the editor.
        */
        focus() {
            this.observer.ignore(() => {
                focusPreventScroll(this.contentDOM);
                this.docView.updateSelection();
            });
        }
        /**
        Clean up this editor view, removing its element from the
        document, unregistering event handlers, and notifying
        plugins. The view instance can no longer be used after
        calling this.
        */
        destroy() {
            for (let plugin of this.plugins)
                plugin.destroy(this);
            this.plugins = [];
            this.inputState.destroy();
            this.dom.remove();
            this.observer.destroy();
            if (this.measureScheduled > -1)
                cancelAnimationFrame(this.measureScheduled);
            this.destroyed = true;
        }
        /**
        Returns an effect that can be
        [added](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects) to a transaction to
        cause it to scroll the given position or range into view.
        */
        static scrollIntoView(pos, options = {}) {
            return scrollIntoView.of(new ScrollTarget(typeof pos == "number" ? EditorSelection.cursor(pos) : pos, options.y, options.x, options.yMargin, options.xMargin));
        }
        /**
        Facet that can be used to add DOM event handlers. The value
        should be an object mapping event names to handler functions. The
        first such function to return true will be assumed to have handled
        that event, and no other handlers or built-in behavior will be
        activated for it.
        These are registered on the [content
        element](https://codemirror.net/6/docs/ref/#view.EditorView.contentDOM), except for `scroll`
        handlers, which will be called any time the editor's [scroll
        element](https://codemirror.net/6/docs/ref/#view.EditorView.scrollDOM) or one of its parent nodes
        is scrolled.
        */
        static domEventHandlers(handlers) {
            return ViewPlugin.define(() => ({}), { eventHandlers: handlers });
        }
        /**
        Create a theme extension. The first argument can be a
        [`style-mod`](https://github.com/marijnh/style-mod#documentation)
        style spec providing the styles for the theme. These will be
        prefixed with a generated class for the style.
        
        Because the selectors will be prefixed with a scope class, rule
        that directly match the editor's [wrapper
        element](https://codemirror.net/6/docs/ref/#view.EditorView.dom)—to which the scope class will be
        added—need to be explicitly differentiated by adding an `&` to
        the selector for that element—for example
        `&.cm-focused`.
        
        When `dark` is set to true, the theme will be marked as dark,
        which will cause the `&dark` rules from [base
        themes](https://codemirror.net/6/docs/ref/#view.EditorView^baseTheme) to be used (as opposed to
        `&light` when a light theme is active).
        */
        static theme(spec, options) {
            let prefix = StyleModule.newName();
            let result = [theme.of(prefix), styleModule.of(buildTheme(`.${prefix}`, spec))];
            if (options && options.dark)
                result.push(darkTheme.of(true));
            return result;
        }
        /**
        Create an extension that adds styles to the base theme. Like
        with [`theme`](https://codemirror.net/6/docs/ref/#view.EditorView^theme), use `&` to indicate the
        place of the editor wrapper element when directly targeting
        that. You can also use `&dark` or `&light` instead to only
        target editors with a dark or light theme.
        */
        static baseTheme(spec) {
            return Prec.lowest(styleModule.of(buildTheme("." + baseThemeID, spec, lightDarkIDs)));
        }
    }
    /**
    Effect that can be [added](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects) to a
    transaction to make it scroll the given range into view.

    *Deprecated*. Use [`scrollIntoView`](https://codemirror.net/6/docs/ref/#view.EditorView^scrollIntoView) instead.
    */
    EditorView.scrollTo = scrollTo;
    /**
    Effect that makes the editor scroll the given range to the
    center of the visible view.

    *Deprecated*. Use [`scrollIntoView`](https://codemirror.net/6/docs/ref/#view.EditorView^scrollIntoView) instead.
    */
    EditorView.centerOn = centerOn;
    /**
    Facet to add a [style
    module](https://github.com/marijnh/style-mod#documentation) to
    an editor view. The view will ensure that the module is
    mounted in its [document
    root](https://codemirror.net/6/docs/ref/#view.EditorView.constructor^config.root).
    */
    EditorView.styleModule = styleModule;
    /**
    An input handler can override the way changes to the editable
    DOM content are handled. Handlers are passed the document
    positions between which the change was found, and the new
    content. When one returns true, no further input handlers are
    called and the default behavior is prevented.
    */
    EditorView.inputHandler = inputHandler;
    /**
    Allows you to provide a function that should be called when the
    library catches an exception from an extension (mostly from view
    plugins, but may be used by other extensions to route exceptions
    from user-code-provided callbacks). This is mostly useful for
    debugging and logging. See [`logException`](https://codemirror.net/6/docs/ref/#view.logException).
    */
    EditorView.exceptionSink = exceptionSink;
    /**
    A facet that can be used to register a function to be called
    every time the view updates.
    */
    EditorView.updateListener = updateListener;
    /**
    Facet that controls whether the editor content DOM is editable.
    When its highest-precedence value is `false`, the element will
    not longer have its `contenteditable` attribute set. (Note that
    this doesn't affect API calls that change the editor content,
    even when those are bound to keys or buttons. See the
    [`readOnly`](https://codemirror.net/6/docs/ref/#state.EditorState.readOnly) facet for that.)
    */
    EditorView.editable = editable;
    /**
    Allows you to influence the way mouse selection happens. The
    functions in this facet will be called for a `mousedown` event
    on the editor, and can return an object that overrides the way a
    selection is computed from that mouse click or drag.
    */
    EditorView.mouseSelectionStyle = mouseSelectionStyle;
    /**
    Facet used to configure whether a given selection drag event
    should move or copy the selection. The given predicate will be
    called with the `mousedown` event, and can return `true` when
    the drag should move the content.
    */
    EditorView.dragMovesSelection = dragMovesSelection$1;
    /**
    Facet used to configure whether a given selecting click adds
    a new range to the existing selection or replaces it entirely.
    */
    EditorView.clickAddsSelectionRange = clickAddsSelectionRange;
    /**
    A facet that determines which [decorations](https://codemirror.net/6/docs/ref/#view.Decoration)
    are shown in the view. See also [view
    plugins](https://codemirror.net/6/docs/ref/#view.EditorView^decorations), which have a separate
    mechanism for providing decorations.
    */
    EditorView.decorations = decorations;
    /**
    This facet records whether a dark theme is active. The extension
    returned by [`theme`](https://codemirror.net/6/docs/ref/#view.EditorView^theme) automatically
    includes an instance of this when the `dark` option is set to
    true.
    */
    EditorView.darkTheme = darkTheme;
    /**
    Facet that provides additional DOM attributes for the editor's
    editable DOM element.
    */
    EditorView.contentAttributes = contentAttributes;
    /**
    Facet that provides DOM attributes for the editor's outer
    element.
    */
    EditorView.editorAttributes = editorAttributes;
    /**
    An extension that enables line wrapping in the editor (by
    setting CSS `white-space` to `pre-wrap` in the content).
    */
    EditorView.lineWrapping = /*@__PURE__*/EditorView.contentAttributes.of({ "class": "cm-lineWrapping" });
    /**
    State effect used to include screen reader announcements in a
    transaction. These will be added to the DOM in a visually hidden
    element with `aria-live="polite"` set, and should be used to
    describe effects that are visually obvious but may not be
    noticed by screen reader users (such as moving to the next
    search match).
    */
    EditorView.announce = /*@__PURE__*/StateEffect.define();
    // Maximum line length for which we compute accurate bidi info
    const MaxBidiLine = 4096;
    // FIXME remove this and its callers on next breaking release
    function ensureTop(given, view) {
        return (given == null ? view.contentDOM.getBoundingClientRect().top : given) + view.viewState.paddingTop;
    }
    const BadMeasure = {};
    class CachedOrder {
        constructor(from, to, dir, order) {
            this.from = from;
            this.to = to;
            this.dir = dir;
            this.order = order;
        }
        static update(cache, changes) {
            if (changes.empty)
                return cache;
            let result = [], lastDir = cache.length ? cache[cache.length - 1].dir : Direction.LTR;
            for (let i = Math.max(0, cache.length - 10); i < cache.length; i++) {
                let entry = cache[i];
                if (entry.dir == lastDir && !changes.touchesRange(entry.from, entry.to))
                    result.push(new CachedOrder(changes.mapPos(entry.from, 1), changes.mapPos(entry.to, -1), entry.dir, entry.order));
            }
            return result;
        }
    }
    function attrsFromFacet(view, facet, base) {
        for (let sources = view.state.facet(facet), i = sources.length - 1; i >= 0; i--) {
            let source = sources[i], value = typeof source == "function" ? source(view) : source;
            if (value)
                combineAttrs(value, base);
        }
        return base;
    }

    const currentPlatform = browser.mac ? "mac" : browser.windows ? "win" : browser.linux ? "linux" : "key";
    function normalizeKeyName(name, platform) {
        const parts = name.split(/-(?!$)/);
        let result = parts[parts.length - 1];
        if (result == "Space")
            result = " ";
        let alt, ctrl, shift, meta;
        for (let i = 0; i < parts.length - 1; ++i) {
            const mod = parts[i];
            if (/^(cmd|meta|m)$/i.test(mod))
                meta = true;
            else if (/^a(lt)?$/i.test(mod))
                alt = true;
            else if (/^(c|ctrl|control)$/i.test(mod))
                ctrl = true;
            else if (/^s(hift)?$/i.test(mod))
                shift = true;
            else if (/^mod$/i.test(mod)) {
                if (platform == "mac")
                    meta = true;
                else
                    ctrl = true;
            }
            else
                throw new Error("Unrecognized modifier name: " + mod);
        }
        if (alt)
            result = "Alt-" + result;
        if (ctrl)
            result = "Ctrl-" + result;
        if (meta)
            result = "Meta-" + result;
        if (shift)
            result = "Shift-" + result;
        return result;
    }
    function modifiers(name, event, shift) {
        if (event.altKey)
            name = "Alt-" + name;
        if (event.ctrlKey)
            name = "Ctrl-" + name;
        if (event.metaKey)
            name = "Meta-" + name;
        if (shift !== false && event.shiftKey)
            name = "Shift-" + name;
        return name;
    }
    const handleKeyEvents = /*@__PURE__*/EditorView.domEventHandlers({
        keydown(event, view) {
            return runHandlers(getKeymap(view.state), event, view, "editor");
        }
    });
    /**
    Facet used for registering keymaps.

    You can add multiple keymaps to an editor. Their priorities
    determine their precedence (the ones specified early or with high
    priority get checked first). When a handler has returned `true`
    for a given key, no further handlers are called.
    */
    const keymap = /*@__PURE__*/Facet.define({ enables: handleKeyEvents });
    const Keymaps = /*@__PURE__*/new WeakMap();
    // This is hidden behind an indirection, rather than directly computed
    // by the facet, to keep internal types out of the facet's type.
    function getKeymap(state) {
        let bindings = state.facet(keymap);
        let map = Keymaps.get(bindings);
        if (!map)
            Keymaps.set(bindings, map = buildKeymap(bindings.reduce((a, b) => a.concat(b), [])));
        return map;
    }
    /**
    Run the key handlers registered for a given scope. The event
    object should be `"keydown"` event. Returns true if any of the
    handlers handled it.
    */
    function runScopeHandlers(view, event, scope) {
        return runHandlers(getKeymap(view.state), event, view, scope);
    }
    let storedPrefix = null;
    const PrefixTimeout = 4000;
    function buildKeymap(bindings, platform = currentPlatform) {
        let bound = Object.create(null);
        let isPrefix = Object.create(null);
        let checkPrefix = (name, is) => {
            let current = isPrefix[name];
            if (current == null)
                isPrefix[name] = is;
            else if (current != is)
                throw new Error("Key binding " + name + " is used both as a regular binding and as a multi-stroke prefix");
        };
        let add = (scope, key, command, preventDefault) => {
            let scopeObj = bound[scope] || (bound[scope] = Object.create(null));
            let parts = key.split(/ (?!$)/).map(k => normalizeKeyName(k, platform));
            for (let i = 1; i < parts.length; i++) {
                let prefix = parts.slice(0, i).join(" ");
                checkPrefix(prefix, true);
                if (!scopeObj[prefix])
                    scopeObj[prefix] = {
                        preventDefault: true,
                        commands: [(view) => {
                                let ourObj = storedPrefix = { view, prefix, scope };
                                setTimeout(() => { if (storedPrefix == ourObj)
                                    storedPrefix = null; }, PrefixTimeout);
                                return true;
                            }]
                    };
            }
            let full = parts.join(" ");
            checkPrefix(full, false);
            let binding = scopeObj[full] || (scopeObj[full] = { preventDefault: false, commands: [] });
            binding.commands.push(command);
            if (preventDefault)
                binding.preventDefault = true;
        };
        for (let b of bindings) {
            let name = b[platform] || b.key;
            if (!name)
                continue;
            for (let scope of b.scope ? b.scope.split(" ") : ["editor"]) {
                add(scope, name, b.run, b.preventDefault);
                if (b.shift)
                    add(scope, "Shift-" + name, b.shift, b.preventDefault);
            }
        }
        return bound;
    }
    function runHandlers(map, event, view, scope) {
        let name = keyName(event), isChar = name.length == 1 && name != " ";
        let prefix = "", fallthrough = false;
        if (storedPrefix && storedPrefix.view == view && storedPrefix.scope == scope) {
            prefix = storedPrefix.prefix + " ";
            if (fallthrough = modifierCodes.indexOf(event.keyCode) < 0)
                storedPrefix = null;
        }
        let runFor = (binding) => {
            if (binding) {
                for (let cmd of binding.commands)
                    if (cmd(view))
                        return true;
                if (binding.preventDefault)
                    fallthrough = true;
            }
            return false;
        };
        let scopeObj = map[scope], baseName;
        if (scopeObj) {
            if (runFor(scopeObj[prefix + modifiers(name, event, !isChar)]))
                return true;
            if (isChar && (event.shiftKey || event.altKey || event.metaKey) &&
                (baseName = base[event.keyCode]) && baseName != name) {
                if (runFor(scopeObj[prefix + modifiers(baseName, event, true)]))
                    return true;
            }
            else if (isChar && event.shiftKey) {
                if (runFor(scopeObj[prefix + modifiers(name, event, true)]))
                    return true;
            }
        }
        return fallthrough;
    }

    const CanHidePrimary = !browser.ios; // FIXME test IE
    const themeSpec = {
        ".cm-line": {
            "& ::selection": { backgroundColor: "transparent !important" },
            "&::selection": { backgroundColor: "transparent !important" }
        }
    };
    if (CanHidePrimary)
        themeSpec[".cm-line"].caretColor = "transparent !important";

    const panelConfig = /*@__PURE__*/Facet.define({
        combine(configs) {
            let topContainer, bottomContainer;
            for (let c of configs) {
                topContainer = topContainer || c.topContainer;
                bottomContainer = bottomContainer || c.bottomContainer;
            }
            return { topContainer, bottomContainer };
        }
    });
    /**
    Get the active panel created by the given constructor, if any.
    This can be useful when you need access to your panels' DOM
    structure.
    */
    function getPanel(view, panel) {
        let plugin = view.plugin(panelPlugin);
        let index = plugin ? plugin.specs.indexOf(panel) : -1;
        return index > -1 ? plugin.panels[index] : null;
    }
    const panelPlugin = /*@__PURE__*/ViewPlugin.fromClass(class {
        constructor(view) {
            this.input = view.state.facet(showPanel);
            this.specs = this.input.filter(s => s);
            this.panels = this.specs.map(spec => spec(view));
            let conf = view.state.facet(panelConfig);
            this.top = new PanelGroup(view, true, conf.topContainer);
            this.bottom = new PanelGroup(view, false, conf.bottomContainer);
            this.top.sync(this.panels.filter(p => p.top));
            this.bottom.sync(this.panels.filter(p => !p.top));
            for (let p of this.panels) {
                p.dom.classList.add("cm-panel");
                if (p.mount)
                    p.mount();
            }
        }
        update(update) {
            let conf = update.state.facet(panelConfig);
            if (this.top.container != conf.topContainer) {
                this.top.sync([]);
                this.top = new PanelGroup(update.view, true, conf.topContainer);
            }
            if (this.bottom.container != conf.bottomContainer) {
                this.bottom.sync([]);
                this.bottom = new PanelGroup(update.view, false, conf.bottomContainer);
            }
            this.top.syncClasses();
            this.bottom.syncClasses();
            let input = update.state.facet(showPanel);
            if (input != this.input) {
                let specs = input.filter(x => x);
                let panels = [], top = [], bottom = [], mount = [];
                for (let spec of specs) {
                    let known = this.specs.indexOf(spec), panel;
                    if (known < 0) {
                        panel = spec(update.view);
                        mount.push(panel);
                    }
                    else {
                        panel = this.panels[known];
                        if (panel.update)
                            panel.update(update);
                    }
                    panels.push(panel);
                    (panel.top ? top : bottom).push(panel);
                }
                this.specs = specs;
                this.panels = panels;
                this.top.sync(top);
                this.bottom.sync(bottom);
                for (let p of mount) {
                    p.dom.classList.add("cm-panel");
                    if (p.mount)
                        p.mount();
                }
            }
            else {
                for (let p of this.panels)
                    if (p.update)
                        p.update(update);
            }
        }
        destroy() {
            this.top.sync([]);
            this.bottom.sync([]);
        }
    }, {
        provide: /*@__PURE__*/PluginField.scrollMargins.from(value => ({ top: value.top.scrollMargin(), bottom: value.bottom.scrollMargin() }))
    });
    class PanelGroup {
        constructor(view, top, container) {
            this.view = view;
            this.top = top;
            this.container = container;
            this.dom = undefined;
            this.classes = "";
            this.panels = [];
            this.syncClasses();
        }
        sync(panels) {
            for (let p of this.panels)
                if (p.destroy && panels.indexOf(p) < 0)
                    p.destroy();
            this.panels = panels;
            this.syncDOM();
        }
        syncDOM() {
            if (this.panels.length == 0) {
                if (this.dom) {
                    this.dom.remove();
                    this.dom = undefined;
                }
                return;
            }
            if (!this.dom) {
                this.dom = document.createElement("div");
                this.dom.className = this.top ? "cm-panels cm-panels-top" : "cm-panels cm-panels-bottom";
                this.dom.style[this.top ? "top" : "bottom"] = "0";
                let parent = this.container || this.view.dom;
                parent.insertBefore(this.dom, this.top ? parent.firstChild : null);
            }
            let curDOM = this.dom.firstChild;
            for (let panel of this.panels) {
                if (panel.dom.parentNode == this.dom) {
                    while (curDOM != panel.dom)
                        curDOM = rm(curDOM);
                    curDOM = curDOM.nextSibling;
                }
                else {
                    this.dom.insertBefore(panel.dom, curDOM);
                }
            }
            while (curDOM)
                curDOM = rm(curDOM);
        }
        scrollMargin() {
            return !this.dom || this.container ? 0
                : Math.max(0, this.top ?
                    this.dom.getBoundingClientRect().bottom - Math.max(0, this.view.scrollDOM.getBoundingClientRect().top) :
                    Math.min(innerHeight, this.view.scrollDOM.getBoundingClientRect().bottom) - this.dom.getBoundingClientRect().top);
        }
        syncClasses() {
            if (!this.container || this.classes == this.view.themeClasses)
                return;
            for (let cls of this.classes.split(" "))
                if (cls)
                    this.container.classList.remove(cls);
            for (let cls of (this.classes = this.view.themeClasses).split(" "))
                if (cls)
                    this.container.classList.add(cls);
        }
    }
    function rm(node) {
        let next = node.nextSibling;
        node.remove();
        return next;
    }
    const baseTheme$1 = /*@__PURE__*/EditorView.baseTheme({
        ".cm-panels": {
            boxSizing: "border-box",
            position: "sticky",
            left: 0,
            right: 0
        },
        "&light .cm-panels": {
            backgroundColor: "#f5f5f5",
            color: "black"
        },
        "&light .cm-panels-top": {
            borderBottom: "1px solid #ddd"
        },
        "&light .cm-panels-bottom": {
            borderTop: "1px solid #ddd"
        },
        "&dark .cm-panels": {
            backgroundColor: "#333338",
            color: "white"
        }
    });
    /**
    Opening a panel is done by providing a constructor function for
    the panel through this facet. (The panel is closed again when its
    constructor is no longer provided.) Values of `null` are ignored.
    */
    const showPanel = /*@__PURE__*/Facet.define({
        enables: [panelPlugin, baseTheme$1]
    });

    function crelt() {
      var elt = arguments[0];
      if (typeof elt == "string") elt = document.createElement(elt);
      var i = 1, next = arguments[1];
      if (next && typeof next == "object" && next.nodeType == null && !Array.isArray(next)) {
        for (var name in next) if (Object.prototype.hasOwnProperty.call(next, name)) {
          var value = next[name];
          if (typeof value == "string") elt.setAttribute(name, value);
          else if (value != null) elt[name] = value;
        }
        i++;
      }
      for (; i < arguments.length; i++) add(elt, arguments[i]);
      return elt
    }

    function add(elt, child) {
      if (typeof child == "string") {
        elt.appendChild(document.createTextNode(child));
      } else if (child == null) ; else if (child.nodeType != null) {
        elt.appendChild(child);
      } else if (Array.isArray(child)) {
        for (var i = 0; i < child.length; i++) add(elt, child[i]);
      } else {
        throw new RangeError("Unsupported child node: " + child)
      }
    }

    const basicNormalize = typeof String.prototype.normalize == "function"
        ? x => x.normalize("NFKD") : x => x;
    /**
    A search cursor provides an iterator over text matches in a
    document.
    */
    class SearchCursor {
        /**
        Create a text cursor. The query is the search string, `from` to
        `to` provides the region to search.
        
        When `normalize` is given, it will be called, on both the query
        string and the content it is matched against, before comparing.
        You can, for example, create a case-insensitive search by
        passing `s => s.toLowerCase()`.
        
        Text is always normalized with
        [`.normalize("NFKD")`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
        (when supported).
        */
        constructor(text, query, from = 0, to = text.length, normalize) {
            /**
            The current match (only holds a meaningful value after
            [`next`](https://codemirror.net/6/docs/ref/#search.SearchCursor.next) has been called and when
            `done` is false).
            */
            this.value = { from: 0, to: 0 };
            /**
            Whether the end of the iterated region has been reached.
            */
            this.done = false;
            this.matches = [];
            this.buffer = "";
            this.bufferPos = 0;
            this.iter = text.iterRange(from, to);
            this.bufferStart = from;
            this.normalize = normalize ? x => normalize(basicNormalize(x)) : basicNormalize;
            this.query = this.normalize(query);
        }
        peek() {
            if (this.bufferPos == this.buffer.length) {
                this.bufferStart += this.buffer.length;
                this.iter.next();
                if (this.iter.done)
                    return -1;
                this.bufferPos = 0;
                this.buffer = this.iter.value;
            }
            return codePointAt(this.buffer, this.bufferPos);
        }
        /**
        Look for the next match. Updates the iterator's
        [`value`](https://codemirror.net/6/docs/ref/#search.SearchCursor.value) and
        [`done`](https://codemirror.net/6/docs/ref/#search.SearchCursor.done) properties. Should be called
        at least once before using the cursor.
        */
        next() {
            while (this.matches.length)
                this.matches.pop();
            return this.nextOverlapping();
        }
        /**
        The `next` method will ignore matches that partially overlap a
        previous match. This method behaves like `next`, but includes
        such matches.
        */
        nextOverlapping() {
            for (;;) {
                let next = this.peek();
                if (next < 0) {
                    this.done = true;
                    return this;
                }
                let str = fromCodePoint(next), start = this.bufferStart + this.bufferPos;
                this.bufferPos += codePointSize(next);
                let norm = this.normalize(str);
                for (let i = 0, pos = start;; i++) {
                    let code = norm.charCodeAt(i);
                    let match = this.match(code, pos);
                    if (match) {
                        this.value = match;
                        return this;
                    }
                    if (i == norm.length - 1)
                        break;
                    if (pos == start && i < str.length && str.charCodeAt(i) == code)
                        pos++;
                }
            }
        }
        match(code, pos) {
            let match = null;
            for (let i = 0; i < this.matches.length; i += 2) {
                let index = this.matches[i], keep = false;
                if (this.query.charCodeAt(index) == code) {
                    if (index == this.query.length - 1) {
                        match = { from: this.matches[i + 1], to: pos + 1 };
                    }
                    else {
                        this.matches[i]++;
                        keep = true;
                    }
                }
                if (!keep) {
                    this.matches.splice(i, 2);
                    i -= 2;
                }
            }
            if (this.query.charCodeAt(0) == code) {
                if (this.query.length == 1)
                    match = { from: pos, to: pos + 1 };
                else
                    this.matches.push(1, pos);
            }
            return match;
        }
    }
    if (typeof Symbol != "undefined")
        SearchCursor.prototype[Symbol.iterator] = function () { return this; };

    const empty = { from: -1, to: -1, match: /*@__PURE__*//.*/.exec("") };
    const baseFlags = "gm" + (/x/.unicode == null ? "" : "u");
    /**
    This class is similar to [`SearchCursor`](https://codemirror.net/6/docs/ref/#search.SearchCursor)
    but searches for a regular expression pattern instead of a plain
    string.
    */
    class RegExpCursor {
        /**
        Create a cursor that will search the given range in the given
        document. `query` should be the raw pattern (as you'd pass it to
        `new RegExp`).
        */
        constructor(text, query, options, from = 0, to = text.length) {
            this.to = to;
            this.curLine = "";
            /**
            Set to `true` when the cursor has reached the end of the search
            range.
            */
            this.done = false;
            /**
            Will contain an object with the extent of the match and the
            match object when [`next`](https://codemirror.net/6/docs/ref/#search.RegExpCursor.next)
            sucessfully finds a match.
            */
            this.value = empty;
            if (/\\[sWDnr]|\n|\r|\[\^/.test(query))
                return new MultilineRegExpCursor(text, query, options, from, to);
            this.re = new RegExp(query, baseFlags + ((options === null || options === void 0 ? void 0 : options.ignoreCase) ? "i" : ""));
            this.iter = text.iter();
            let startLine = text.lineAt(from);
            this.curLineStart = startLine.from;
            this.matchPos = from;
            this.getLine(this.curLineStart);
        }
        getLine(skip) {
            this.iter.next(skip);
            if (this.iter.lineBreak) {
                this.curLine = "";
            }
            else {
                this.curLine = this.iter.value;
                if (this.curLineStart + this.curLine.length > this.to)
                    this.curLine = this.curLine.slice(0, this.to - this.curLineStart);
                this.iter.next();
            }
        }
        nextLine() {
            this.curLineStart = this.curLineStart + this.curLine.length + 1;
            if (this.curLineStart > this.to)
                this.curLine = "";
            else
                this.getLine(0);
        }
        /**
        Move to the next match, if there is one.
        */
        next() {
            for (let off = this.matchPos - this.curLineStart;;) {
                this.re.lastIndex = off;
                let match = this.matchPos <= this.to && this.re.exec(this.curLine);
                if (match) {
                    let from = this.curLineStart + match.index, to = from + match[0].length;
                    this.matchPos = to + (from == to ? 1 : 0);
                    if (from == this.curLine.length)
                        this.nextLine();
                    if (from < to || from > this.value.to) {
                        this.value = { from, to, match };
                        return this;
                    }
                    off = this.matchPos - this.curLineStart;
                }
                else if (this.curLineStart + this.curLine.length < this.to) {
                    this.nextLine();
                    off = 0;
                }
                else {
                    this.done = true;
                    return this;
                }
            }
        }
    }
    const flattened = /*@__PURE__*/new WeakMap();
    // Reusable (partially) flattened document strings
    class FlattenedDoc {
        constructor(from, text) {
            this.from = from;
            this.text = text;
        }
        get to() { return this.from + this.text.length; }
        static get(doc, from, to) {
            let cached = flattened.get(doc);
            if (!cached || cached.from >= to || cached.to <= from) {
                let flat = new FlattenedDoc(from, doc.sliceString(from, to));
                flattened.set(doc, flat);
                return flat;
            }
            if (cached.from == from && cached.to == to)
                return cached;
            let { text, from: cachedFrom } = cached;
            if (cachedFrom > from) {
                text = doc.sliceString(from, cachedFrom) + text;
                cachedFrom = from;
            }
            if (cached.to < to)
                text += doc.sliceString(cached.to, to);
            flattened.set(doc, new FlattenedDoc(cachedFrom, text));
            return new FlattenedDoc(from, text.slice(from - cachedFrom, to - cachedFrom));
        }
    }
    class MultilineRegExpCursor {
        constructor(text, query, options, from, to) {
            this.text = text;
            this.to = to;
            this.done = false;
            this.value = empty;
            this.matchPos = from;
            this.re = new RegExp(query, baseFlags + ((options === null || options === void 0 ? void 0 : options.ignoreCase) ? "i" : ""));
            this.flat = FlattenedDoc.get(text, from, this.chunkEnd(from + 5000 /* Base */));
        }
        chunkEnd(pos) {
            return pos >= this.to ? this.to : this.text.lineAt(pos).to;
        }
        next() {
            for (;;) {
                let off = this.re.lastIndex = this.matchPos - this.flat.from;
                let match = this.re.exec(this.flat.text);
                // Skip empty matches directly after the last match
                if (match && !match[0] && match.index == off) {
                    this.re.lastIndex = off + 1;
                    match = this.re.exec(this.flat.text);
                }
                // If a match goes almost to the end of a noncomplete chunk, try
                // again, since it'll likely be able to match more
                if (match && this.flat.to < this.to && match.index + match[0].length > this.flat.text.length - 10)
                    match = null;
                if (match) {
                    let from = this.flat.from + match.index, to = from + match[0].length;
                    this.value = { from, to, match };
                    this.matchPos = to + (from == to ? 1 : 0);
                    return this;
                }
                else {
                    if (this.flat.to == this.to) {
                        this.done = true;
                        return this;
                    }
                    // Grow the flattened doc
                    this.flat = FlattenedDoc.get(this.text, this.flat.from, this.chunkEnd(this.flat.from + this.flat.text.length * 2));
                }
            }
        }
    }
    if (typeof Symbol != "undefined") {
        RegExpCursor.prototype[Symbol.iterator] = MultilineRegExpCursor.prototype[Symbol.iterator] =
            function () { return this; };
    }
    function validRegExp(source) {
        try {
            new RegExp(source, baseFlags);
            return true;
        }
        catch (_a) {
            return false;
        }
    }

    var __awaiter$1 = function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    let kleenExpCache = {};
    const debounce = (callback, wait) => {
        let id = 0;
        return (...args) => {
            id++;
            let my_id = id;
            return new Promise((resolve, reject) => {
                window.setTimeout(() => {
                    if (id == my_id) {
                        callback(...args)
                            .then(resolve);
                    }
                    else {
                        resolve(null);
                    }
                }, wait);
            });
        };
    };
    const compileKleenexp = (ke) => __awaiter$1(void 0, void 0, void 0, function* () {
        if (!ke.match(/[\[\]]/)) {
            return ke;
        }
        if (ke in kleenExpCache) {
            let result = kleenExpCache[ke];
            console.log(`/${ke}/ >> /${result}/`);
            return result;
        }
        console.log(`no /${ke}/ in cache`);
        return compileKleenexpAsync(ke);
    });
    const doCompileKleenexpRemotely = (ke) => __awaiter$1(void 0, void 0, void 0, function* () {
        try {
            let response = yield fetch('kleenexp/?' + new URLSearchParams({ kleenexp: ke }));
            if (!response.ok) {
                return Error(response.statusText);
            }
            let j = yield response.json();
            let re = j['regex'];
            if (re != undefined) {
                kleenExpCache[ke] = re;
                console.log(`${ke} => ${re}`);
                return re;
            }
            let e = new Error(j['error']);
            kleenExpCache[ke] = e;
            console.log(`/${ke}/: /${e}/`);
            return e;
        }
        catch (e) {
            // don't cache, might not be an issue with the kleenexp
            return Error(e.message);
        }
    });
    const compileKleenexpAsync = /*@__PURE__*/debounce(doCompileKleenexpRemotely, 100);

    var __awaiter = function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const searchConfigFacet = /*@__PURE__*/Facet.define({
        combine(configs) {
            var _a;
            return {
                top: configs.reduce((val, conf) => val !== null && val !== void 0 ? val : conf.top, undefined) || false,
                caseSensitive: configs.reduce((val, conf) => val !== null && val !== void 0 ? val : (conf.caseSensitive || conf.matchCase), undefined) || false,
                regexp: configs.reduce((val, conf) => val !== null && val !== void 0 ? val : conf.regexp, undefined) || false,
                kleenexp: configs.reduce((val, conf) => val !== null && val !== void 0 ? val : conf.kleenexp, undefined) || false,
                createPanel: ((_a = configs.find(c => c.createPanel)) === null || _a === void 0 ? void 0 : _a.createPanel) || (view => new SearchPanel(view))
            };
        }
    });
    /**
    Add search state to the editor configuration, and optionally
    configure the search extension.
    ([`openSearchPanel`](https://codemirror.net/6/docs/ref/#search.openSearchPanel) when automatically
    enable this if it isn't already on.)
    */
    function search(config) {
        return config ? [searchConfigFacet.of(config), searchExtensions] : searchExtensions;
    }
    /**
    A search query. Part of the editor's search state.
    */
    class SearchQuery {
        /**
        Create a query object.
        */
        constructor(config) {
            this.search = config.search;
            this.caseSensitive = !!config.caseSensitive;
            this.regexp = !!config.regexp || !!config.kleenexp;
            this.kleenexp = !!config.kleenexp;
            this.replace = config.replace || "";
            this.numMatches = config.numMatches;
            this.valid = !!this.search && (!this.regexp || validRegExp(this.search));
            this.unquoted = this.search.replace(/\\([nrt\\])/g, (_, ch) => ch == "n" ? "\n" : ch == "r" ? "\r" : ch == "t" ? "\t" : "\\");
        }
        /**
        Compare this query to another query.
        */
        eq(other) {
            return this.search == other.search && this.replace == other.replace &&
                this.caseSensitive == other.caseSensitive && this.regexp == other.regexp &&
                this.kleenexp == other.kleenexp && this.numMatches == other.numMatches;
        }
        addNumMatches(numMatches) {
            return new SearchQuery({
                search: this.search,
                caseSensitive: this.caseSensitive,
                regexp: this.regexp,
                kleenexp: this.kleenexp,
                replace: this.replace,
                numMatches
            });
        }
        /**
        @internal
        */
        create() {
            return this.regexp ? new RegExpQuery(this) : new StringQuery(this);
        }
        getCursor(doc, from = 0, to = doc.length) {
            return this.regexp ? regexpCursor(this, doc, from, to) : stringCursor(this, doc, from, to);
        }
    }
    class QueryType {
        constructor(spec) {
            this.spec = spec;
        }
    }
    function stringCursor(spec, doc, from, to) {
        return new SearchCursor(doc, spec.unquoted, from, to, spec.caseSensitive ? undefined : x => x.toLowerCase());
    }
    class StringQuery extends QueryType {
        constructor(spec) {
            super(spec);
        }
        nextMatch(doc, curFrom, curTo) {
            let cursor = stringCursor(this.spec, doc, curTo, doc.length).nextOverlapping();
            if (cursor.done)
                cursor = stringCursor(this.spec, doc, 0, curFrom).nextOverlapping();
            return cursor.done ? null : cursor.value;
        }
        // Searching in reverse is, rather than implementing inverted search
        // cursor, done by scanning chunk after chunk forward.
        prevMatchInRange(doc, from, to) {
            for (let pos = to;;) {
                let start = Math.max(from, pos - 10000 /* ChunkSize */ - this.spec.unquoted.length);
                let cursor = stringCursor(this.spec, doc, start, pos), range = null;
                while (!cursor.nextOverlapping().done)
                    range = cursor.value;
                if (range)
                    return range;
                if (start == from)
                    return null;
                pos -= 10000 /* ChunkSize */;
            }
        }
        prevMatch(doc, curFrom, curTo) {
            return this.prevMatchInRange(doc, 0, curFrom) ||
                this.prevMatchInRange(doc, curTo, doc.length);
        }
        getReplacement(_result) { return this.spec.replace; }
        matchAll(doc, limit) {
            let cursor = stringCursor(this.spec, doc, 0, doc.length), ranges = [];
            while (!cursor.next().done) {
                if (ranges.length >= limit)
                    return null;
                ranges.push(cursor.value);
            }
            return ranges;
        }
        highlight(doc, from, to, add) {
            let cursor = stringCursor(this.spec, doc, Math.max(0, from - this.spec.unquoted.length), Math.min(to + this.spec.unquoted.length, doc.length));
            while (!cursor.next().done)
                add(cursor.value.from, cursor.value.to);
        }
    }
    function regexpCursor(spec, doc, from, to) {
        return new RegExpCursor(doc, spec.search, spec.caseSensitive ? undefined : { ignoreCase: true }, from, to);
    }
    class RegExpQuery extends QueryType {
        nextMatch(doc, curFrom, curTo) {
            let cursor = regexpCursor(this.spec, doc, curTo, doc.length).next();
            if (cursor.done)
                cursor = regexpCursor(this.spec, doc, 0, curFrom).next();
            return cursor.done ? null : cursor.value;
        }
        prevMatchInRange(doc, from, to) {
            for (let size = 1;; size++) {
                let start = Math.max(from, to - size * 10000 /* ChunkSize */);
                let cursor = regexpCursor(this.spec, doc, start, to), range = null;
                while (!cursor.next().done)
                    range = cursor.value;
                if (range && (start == from || range.from > start + 10))
                    return range;
                if (start == from)
                    return null;
            }
        }
        prevMatch(doc, curFrom, curTo) {
            return this.prevMatchInRange(doc, 0, curFrom) ||
                this.prevMatchInRange(doc, curTo, doc.length);
        }
        getReplacement(result) {
            return this.spec.replace.replace(/\$([$&\d+])/g, (m, i) => i == "$" ? "$"
                : i == "&" ? result.match[0]
                    : i != "0" && +i < result.match.length ? result.match[i]
                        : m);
        }
        matchAll(doc, limit) {
            let cursor = regexpCursor(this.spec, doc, 0, doc.length), ranges = [];
            while (!cursor.next().done) {
                if (ranges.length >= limit)
                    return null;
                ranges.push(cursor.value);
            }
            return ranges;
        }
        highlight(doc, from, to, add) {
            let cursor = regexpCursor(this.spec, doc, Math.max(0, from - 250 /* HighlightMargin */), Math.min(to + 250 /* HighlightMargin */, doc.length));
            while (!cursor.next().done)
                add(cursor.value.from, cursor.value.to);
        }
    }
    /**
    A state effect that updates the current search query. Note that
    this only has an effect if the search state has been initialized
    (by including [`search`](https://codemirror.net/6/docs/ref/#search.search) in your configuration or
    by running [`openSearchPanel`](https://codemirror.net/6/docs/ref/#search.openSearchPanel) at least
    once).
    */
    const setSearchQuery = /*@__PURE__*/StateEffect.define();
    const togglePanel = /*@__PURE__*/StateEffect.define();
    const searchState = /*@__PURE__*/StateField.define({
        create(state) {
            return new SearchState(defaultQuery(state).create(), null);
        },
        update(value, tr) {
            for (let effect of tr.effects) {
                if (effect.is(setSearchQuery))
                    value = new SearchState(effect.value.create(), value.panel);
                else if (effect.is(togglePanel))
                    value = new SearchState(value.query, effect.value ? createSearchPanel : null);
            }
            return value;
        },
        provide: f => showPanel.from(f, val => val.panel)
    });
    class SearchState {
        constructor(query, panel) {
            this.query = query;
            this.panel = panel;
        }
    }
    const matchMark = /*@__PURE__*/Decoration.mark({ class: "cm-searchMatch" }), selectedMatchMark = /*@__PURE__*/Decoration.mark({ class: "cm-searchMatch cm-searchMatch-selected" });
    const searchHighlighter = /*@__PURE__*/ViewPlugin.fromClass(class {
        constructor(view) {
            this.view = view;
            this.decorations = this.highlight(view.state.field(searchState));
        }
        update(update) {
            let state = update.state.field(searchState);
            if (state != update.startState.field(searchState) || update.docChanged || update.selectionSet)
                this.decorations = this.highlight(state);
        }
        highlight({ query, panel }) {
            if (!panel || !query.spec.valid)
                return Decoration.none;
            let { view } = this;
            let builder = new RangeSetBuilder();
            for (let i = 0, ranges = view.visibleRanges, l = ranges.length; i < l; i++) {
                let { from, to } = ranges[i];
                while (i < l - 1 && to > ranges[i + 1].from - 2 * 250 /* HighlightMargin */)
                    to = ranges[++i].to;
                query.highlight(view.state.doc, from, to, (from, to) => {
                    let selected = view.state.selection.ranges.some(r => r.from == from && r.to == to);
                    builder.add(from, to, selected ? selectedMatchMark : matchMark);
                });
            }
            return builder.finish();
        }
    }, {
        decorations: v => v.decorations
    });
    function searchCommand(f) {
        return view => {
            let state = view.state.field(searchState, false);
            return state && state.query.spec.valid ? f(view, state) : openSearchPanel(view);
        };
    }
    /**
    Open the search panel if it isn't already open, and move the
    selection to the first match after the current main selection.
    Will wrap around to the start of the document when it reaches the
    end.
    */
    const findNext = /*@__PURE__*/searchCommand((view, { query }) => {
        let { from, to } = view.state.selection.main;
        let next = query.nextMatch(view.state.doc, from, to);
        if (!next || next.from == from && next.to == to)
            return false;
        view.dispatch({
            selection: { anchor: next.from, head: next.to },
            scrollIntoView: true,
            effects: announceMatch(view, next),
            userEvent: "select.search"
        });
        return true;
    });
    /**
    Move the selection to the previous instance of the search query,
    before the current main selection. Will wrap past the start
    of the document to start searching at the end again.
    */
    const findPrevious = /*@__PURE__*/searchCommand((view, { query }) => {
        let { state } = view, { from, to } = state.selection.main;
        let range = query.prevMatch(state.doc, from, to);
        if (!range)
            return false;
        view.dispatch({
            selection: { anchor: range.from, head: range.to },
            scrollIntoView: true,
            effects: announceMatch(view, range),
            userEvent: "select.search"
        });
        return true;
    });
    /**
    Select all instances of the search query.
    */
    const selectMatches = /*@__PURE__*/searchCommand((view, { query }) => {
        let ranges = query.matchAll(view.state.doc, 1000);
        if (!ranges || !ranges.length)
            return false;
        let querySpec = view.state.field(searchState).query.spec;
        view.dispatch({
            selection: EditorSelection.create(ranges.map(r => EditorSelection.range(r.from, r.to))),
            userEvent: "select.search.matches",
            effects: setSearchQuery.of(querySpec.addNumMatches(ranges.length))
        });
        return true;
    });
    /**
    Replace the current match of the search query.
    */
    const replaceNext = /*@__PURE__*/searchCommand((view, { query }) => {
        let { state } = view, { from, to } = state.selection.main;
        if (state.readOnly)
            return false;
        let next = query.nextMatch(state.doc, from, from);
        if (!next)
            return false;
        let changes = [], selection, replacement;
        if (next.from == from && next.to == to) {
            replacement = state.toText(query.getReplacement(next));
            changes.push({ from: next.from, to: next.to, insert: replacement });
            next = query.nextMatch(state.doc, next.from, next.to);
        }
        if (next) {
            let off = changes.length == 0 || changes[0].from >= next.to ? 0 : next.to - next.from - replacement.length;
            selection = { anchor: next.from - off, head: next.to - off };
        }
        view.dispatch({
            changes, selection,
            scrollIntoView: !!selection,
            effects: next ? announceMatch(view, next) : undefined,
            userEvent: "input.replace"
        });
        return true;
    });
    /**
    Replace all instances of the search query with the given
    replacement.
    */
    const replaceAll = /*@__PURE__*/searchCommand((view, { query }) => {
        if (view.state.readOnly)
            return false;
        let changes = query.matchAll(view.state.doc, 1e9).map(match => {
            let { from, to } = match;
            return { from, to, insert: query.getReplacement(match) };
        });
        if (!changes.length)
            return false;
        view.dispatch({
            changes,
            userEvent: "input.replace.all"
        });
        return true;
    });
    function createSearchPanel(view) {
        return view.state.facet(searchConfigFacet).createPanel(view);
    }
    function defaultQuery(state, fallback) {
        var _a, _b, _c;
        let sel = state.selection.main;
        let selText = sel.empty || sel.to > sel.from + 100 ? "" : state.sliceDoc(sel.from, sel.to);
        let caseSensitive = (_a = fallback === null || fallback === void 0 ? void 0 : fallback.caseSensitive) !== null && _a !== void 0 ? _a : state.facet(searchConfigFacet).caseSensitive;
        let regexp = (_b = fallback === null || fallback === void 0 ? void 0 : fallback.regexp) !== null && _b !== void 0 ? _b : state.facet(searchConfigFacet).regexp;
        let kleenexp = (_c = fallback === null || fallback === void 0 ? void 0 : fallback.kleenexp) !== null && _c !== void 0 ? _c : state.facet(searchConfigFacet).kleenexp;
        return fallback && !selText ? fallback : new SearchQuery({ search: selText.replace(/\n/g, "\\n"), caseSensitive, regexp, kleenexp });
    }
    /**
    Make sure the search panel is open and focused.
    */
    const openSearchPanel = view => {
        let state = view.state.field(searchState, false);
        if (state && state.panel) {
            let panel = getPanel(view, createSearchPanel);
            if (!panel)
                return false;
            let searchInput = panel.dom.querySelector("[name=search]");
            if (searchInput != view.root.activeElement) {
                let query = defaultQuery(view.state, state.query.spec);
                if (query.valid)
                    view.dispatch({ effects: setSearchQuery.of(query) });
                searchInput.focus();
                searchInput.select();
            }
        }
        else {
            view.dispatch({ effects: [
                    togglePanel.of(true),
                    state ? setSearchQuery.of(defaultQuery(view.state, state.query.spec)) : StateEffect.appendConfig.of(searchExtensions)
                ] });
        }
        return true;
    };
    /**
    Close the search panel.
    */
    const closeSearchPanel = view => {
        let state = view.state.field(searchState, false);
        if (!state || !state.panel)
            return false;
        let panel = getPanel(view, createSearchPanel);
        if (panel && panel.dom.contains(view.root.activeElement))
            view.focus();
        view.dispatch({ effects: togglePanel.of(false) });
        return true;
    };
    class SearchPanel {
        constructor(view) {
            this.view = view;
            let query = this.query = view.state.field(searchState).query.spec;
            this.commit = this.commit.bind(this);
            this.searchField = crelt("input", {
                value: query.search,
                placeholder: phrase(view, "Find"),
                "aria-label": phrase(view, "Find"),
                class: "cm-textfield",
                name: "search",
                onchange: this.commit,
                onkeyup: this.commit
            });
            this.replaceField = crelt("input", {
                value: query.replace,
                placeholder: phrase(view, "Replace"),
                "aria-label": phrase(view, "Replace"),
                class: "cm-textfield",
                name: "replace",
                onchange: this.commit,
                onkeyup: this.commit
            });
            this.caseField = crelt("input", {
                type: "checkbox",
                name: "case",
                checked: query.caseSensitive,
                onchange: this.commit
            });
            this.reField = crelt("input", {
                type: "checkbox",
                name: "re",
                checked: query.regexp,
                onchange: this.commit
            });
            this.keField = crelt("input", {
                type: "checkbox",
                name: "kleenexp",
                checked: query.kleenexp,
                onchange: this.commit
            });
            this.errorField = crelt("label", {
                class: "cm-error"
            });
            this.matchesField = crelt("label", {
                class: "cm-num-matches"
            });
            function button(name, onclick, content) {
                return crelt("button", { class: "cm-button", name, onclick, type: "button" }, content);
            }
            this.dom = crelt("div", { onkeydown: (e) => this.keydown(e), class: "cm-search" }, [
                this.searchField,
                button("next", () => findNext(view), [phrase(view, "next")]),
                button("prev", () => findPrevious(view), [phrase(view, "previous")]),
                button("select", () => selectMatches(view), [phrase(view, "all")]),
                crelt("label", null, [this.caseField, phrase(view, "match case")]),
                //elt("label", null, [this.reField, phrase(view, "regexp")]),
                crelt("label", null, [this.keField, phrase(view, "kleenexp")]),
                this.errorField,
                this.matchesField,
                ...view.state.readOnly ? [] : [
                    crelt("br"),
                    this.replaceField,
                    button("replace", () => replaceNext(view), [phrase(view, "replace")]),
                    button("replaceAll", () => replaceAll(view), [phrase(view, "replace all")]),
                    crelt("button", {
                        name: "close",
                        onclick: () => closeSearchPanel(view),
                        "aria-label": phrase(view, "close"),
                        type: "button"
                    }, ["×"])
                ]
            ]);
        }
        getSearch(raw, kleenexp) {
            return __awaiter(this, void 0, void 0, function* () {
                return kleenexp ? compileKleenexp(raw) : raw;
            });
        }
        setSearch(query) {
            if (query.numMatches == undefined) {
                this.searchField.value = query.search;
                this.replaceField.value = query.replace;
                this.caseField.checked = query.caseSensitive;
                this.reField.checked = query.regexp;
                this.keField.checked = query.kleenexp;
                this.matchesField.textContent = "";
                this.commit();
            }
            else {
                this.matchesField.textContent = query.numMatches ? `${query.numMatches} matches.` : "";
            }
        }
        commit() {
            return __awaiter(this, void 0, void 0, function* () {
                const kleenexp = this.keField.checked;
                this.dom.toggleAttribute("compiled", false);
                let search = yield this.getSearch(this.searchField.value, kleenexp);
                if (typeof search == "string") {
                    let query = new SearchQuery({
                        search: search,
                        caseSensitive: this.caseField.checked,
                        regexp: this.reField.checked,
                        kleenexp: kleenexp,
                        replace: this.replaceField.value,
                    });
                    if (!query.eq(this.query)) {
                        this.query = query;
                        this.view.dispatch({ effects: setSearchQuery.of(query) });
                    }
                }
                console.log("refresh", this.query);
                this.dom.toggleAttribute("compiled", kleenexp && typeof search == "string");
                this.dom.toggleAttribute("error", search instanceof Error);
                this.errorField.textContent = search instanceof Error ? search.message : "";
            });
        }
        keydown(e) {
            if (runScopeHandlers(this.view, e, "search-panel")) {
                e.preventDefault();
            }
            else if (e.keyCode == 13 && e.target == this.searchField) {
                e.preventDefault();
                (e.shiftKey ? findPrevious : findNext)(this.view);
            }
            else if (e.keyCode == 13 && e.target == this.replaceField) {
                e.preventDefault();
                replaceNext(this.view);
            }
        }
        update(update) {
            for (let tr of update.transactions)
                for (let effect of tr.effects) {
                    if (effect.is(setSearchQuery) && !effect.value.eq(this.query))
                        this.setSearch(effect.value);
                }
        }
        mount() {
            this.searchField.select();
        }
        get pos() { return 80; }
        get top() { return this.view.state.facet(searchConfigFacet).top; }
    }
    function phrase(view, phrase) { return view.state.phrase(phrase); }
    const AnnounceMargin = 30;
    const Break = /[\s\.,:;?!]/;
    function announceMatch(view, { from, to }) {
        let lineStart = view.state.doc.lineAt(from).from, lineEnd = view.state.doc.lineAt(to).to;
        let start = Math.max(lineStart, from - AnnounceMargin), end = Math.min(lineEnd, to + AnnounceMargin);
        let text = view.state.sliceDoc(start, end);
        if (start != lineStart) {
            for (let i = 0; i < AnnounceMargin; i++)
                if (!Break.test(text[i + 1]) && Break.test(text[i])) {
                    text = text.slice(i);
                    break;
                }
        }
        if (end != lineEnd) {
            for (let i = text.length - 1; i > text.length - AnnounceMargin; i--)
                if (!Break.test(text[i - 1]) && Break.test(text[i])) {
                    text = text.slice(0, i);
                    break;
                }
        }
        return EditorView.announce.of(`${view.state.phrase("current match")}. ${text} ${view.state.phrase("on line")} ${view.state.doc.lineAt(from).number}`);
    }
    const baseTheme = /*@__PURE__*/EditorView.baseTheme({
        ".cm-panels": {
            zIndex: 1,
        },
        ".cm-panel.cm-search": {
            padding: "2px 6px 4px",
            position: "relative",
            "& [name=close]": {
                display: "none",
                position: "absolute",
                top: "0",
                right: "4px",
                backgroundColor: "inherit",
                border: "none",
                font: "inherit",
                padding: 0,
                margin: 0
            },
            "& input[name=search]": {
                fontFamily: "monospace"
            },
            "&[compiled] input[name=search]": {
                background: "#8f8"
            },
            "&[error] input[name=search]": {
                background: "#f88"
            },
            "& input, & button, & label": {
                margin: ".2em .6em .2em 0"
            },
            "& input[type=checkbox]": {
                marginRight: ".2em"
            },
            "& label": {
                fontSize: "80%",
                whiteSpace: "pre"
            },
            "& label.cm-error": {
                color: "red"
            }
        },
        "&light .cm-searchMatch": { backgroundColor: "#ffff0054" },
        "&dark .cm-searchMatch": { backgroundColor: "#00ffff8a" },
        "&light .cm-searchMatch-selected": { backgroundColor: "#ff6a0054" },
        "&dark .cm-searchMatch-selected": { backgroundColor: "#ff00ff8a" }
    });
    const searchExtensions = [
        searchState,
        /*@__PURE__*/Prec.lowest(searchHighlighter),
        baseTheme
    ];

    var alice = "            Alice's Adventures in Wonderland\n\n            ALICE'S ADVENTURES IN WONDERLAND\n\n                      Lewis Carroll\n\n           THE MILLENNIUM FULCRUM EDITION 3.0\n\n\n\n\n                        CHAPTER I\n\n                  Down the Rabbit-Hole\n\n\nAlice was beginning to get very tired of sitting by her sister\non the bank, and of having nothing to do:  once or twice she had\npeeped into the book her sister was reading, but it had no\npictures or conversations in it, `and what is the use of a book,'\nthought Alice `without pictures or conversation?'\n\nSo she was considering in her own mind (as well as she could,\nfor the hot day made her feel very sleepy and stupid), whether\nthe pleasure of making a daisy-chain would be worth the trouble\nof getting up and picking the daisies, when suddenly a White\nRabbit with pink eyes ran close by her.\n\nThere was nothing so VERY remarkable in that; nor did Alice\nthink it so VERY much out of the way to hear the Rabbit say to\nitself, `Oh dear!  Oh dear!  I shall be late!'  (when she thought\nit over afterwards, it occurred to her that she ought to have\nwondered at this, but at the time it all seemed quite natural);\nbut when the Rabbit actually TOOK A WATCH OUT OF ITS WAISTCOAT-\nPOCKET, and looked at it, and then hurried on, Alice started to\nher feet, for it flashed across her mind that she had never\nbefore seen a rabbit with either a waistcoat-pocket, or a watch to\ntake out of it, and burning with curiosity, she ran across the\nfield after it, and fortunately was just in time to see it pop\ndown a large rabbit-hole under the hedge.\n\nIn another moment down went Alice after it, never once\nconsidering how in the world she was to get out again.\n\nThe rabbit-hole went straight on like a tunnel for some way,\nand then dipped suddenly down, so suddenly that Alice had not a\nmoment to think about stopping herself before she found herself\nfalling down a very deep well.\n\nEither the well was very deep, or she fell very slowly, for she\nhad plenty of time as she went down to look about her and to\nwonder what was going to happen next.  First, she tried to look\ndown and make out what she was coming to, but it was too dark to\nsee anything; then she looked at the sides of the well, and\nnoticed that they were filled with cupboards and book-shelves;\nhere and there she saw maps and pictures hung upon pegs.  She\ntook down a jar from one of the shelves as she passed; it was\nlabelled `ORANGE MARMALADE', but to her great disappointment it\nwas empty:  she did not like to drop the jar for fear of killing\nsomebody, so managed to put it into one of the cupboards as she\nfell past it.\n\n`Well!' thought Alice to herself, `after such a fall as this, I\nshall think nothing of tumbling down stairs!  How brave they'll\nall think me at home!  Why, I wouldn't say anything about it,\neven if I fell off the top of the house!' (Which was very likely\ntrue.)\n\nDown, down, down.  Would the fall NEVER come to an end!  `I\nwonder how many miles I've fallen by this time?' she said aloud.\n`I must be getting somewhere near the centre of the earth.  Let\nme see:  that would be four thousand miles down, I think--' (for,\nyou see, Alice had learnt several things of this sort in her\nlessons in the schoolroom, and though this was not a VERY good\nopportunity for showing off her knowledge, as there was no one to\nlisten to her, still it was good practice to say it over) `--yes,\nthat's about the right distance--but then I wonder what Latitude\nor Longitude I've got to?'  (Alice had no idea what Latitude was,\nor Longitude either, but thought they were nice grand words to\nsay.)\n\nPresently she began again.  `I wonder if I shall fall right\nTHROUGH the earth!  How funny it'll seem to come out among the\npeople that walk with their heads downward!  The Antipathies, I\nthink--' (she was rather glad there WAS no one listening, this\ntime, as it didn't sound at all the right word) `--but I shall\nhave to ask them what the name of the country is, you know.\nPlease, Ma'am, is this New Zealand or Australia?' (and she tried\nto curtsey as she spoke--fancy CURTSEYING as you're falling\nthrough the air!  Do you think you could manage it?)  `And what\nan ignorant little girl she'll think me for asking!  No, it'll\nnever do to ask:  perhaps I shall see it written up somewhere.'\n\nDown, down, down.  There was nothing else to do, so Alice soon\nbegan talking again.  `Dinah'll miss me very much to-night, I\nshould think!'  (Dinah was the cat.)  `I hope they'll remember\nher saucer of milk at tea-time.  Dinah my dear!  I wish you were\ndown here with me!  There are no mice in the air, I'm afraid, but\nyou might catch a bat, and that's very like a mouse, you know.\nBut do cats eat bats, I wonder?'  And here Alice began to get\nrather sleepy, and went on saying to herself, in a dreamy sort of\nway, `Do cats eat bats?  Do cats eat bats?' and sometimes, `Do\nbats eat cats?' for, you see, as she couldn't answer either\nquestion, it didn't much matter which way she put it.  She felt\nthat she was dozing off, and had just begun to dream that she\nwas walking hand in hand with Dinah, and saying to her very\nearnestly, `Now, Dinah, tell me the truth:  did you ever eat a\nbat?' when suddenly, thump! thump! down she came upon a heap of\nsticks and dry leaves, and the fall was over.\n\nAlice was not a bit hurt, and she jumped up on to her feet in a\nmoment:  she looked up, but it was all dark overhead; before her\nwas another long passage, and the White Rabbit was still in\nsight, hurrying down it.  There was not a moment to be lost:\naway went Alice like the wind, and was just in time to hear it\nsay, as it turned a corner, `Oh my ears and whiskers, how late\nit's getting!'  She was close behind it when she turned the\ncorner, but the Rabbit was no longer to be seen:  she found\nherself in a long, low hall, which was lit up by a row of lamps\nhanging from the roof.\n\nThere were doors all round the hall, but they were all locked;\nand when Alice had been all the way down one side and up the\nother, trying every door, she walked sadly down the middle,\nwondering how she was ever to get out again.\n\nSuddenly she came upon a little three-legged table, all made of\nsolid glass; there was nothing on it except a tiny golden key,\nand Alice's first thought was that it might belong to one of the\ndoors of the hall; but, alas! either the locks were too large, or\nthe key was too small, but at any rate it would not open any of\nthem.  However, on the second time round, she came upon a low\ncurtain she had not noticed before, and behind it was a little\ndoor about fifteen inches high:  she tried the little golden key\nin the lock, and to her great delight it fitted!\n\nAlice opened the door and found that it led into a small\npassage, not much larger than a rat-hole:  she knelt down and\nlooked along the passage into the loveliest garden you ever saw.\nHow she longed to get out of that dark hall, and wander about\namong those beds of bright flowers and those cool fountains, but\nshe could not even get her head through the doorway; `and even if\nmy head would go through,' thought poor Alice, `it would be of\nvery little use without my shoulders.  Oh, how I wish\nI could shut up like a telescope!  I think I could, if I only\nknow how to begin.'  For, you see, so many out-of-the-way things\nhad happened lately, that Alice had begun to think that very few\nthings indeed were really impossible.\n\nThere seemed to be no use in waiting by the little door, so she\nwent back to the table, half hoping she might find another key on\nit, or at any rate a book of rules for shutting people up like\ntelescopes:  this time she found a little bottle on it, (`which\ncertainly was not here before,' said Alice,) and round the neck\nof the bottle was a paper label, with the words `DRINK ME'\nbeautifully printed on it in large letters.\n\nIt was all very well to say `Drink me,' but the wise little\nAlice was not going to do THAT in a hurry.  `No, I'll look\nfirst,' she said, `and see whether it's marked \"poison\" or not';\nfor she had read several nice little histories about children who\nhad got burnt, and eaten up by wild beasts and other unpleasant\nthings, all because they WOULD not remember the simple rules\ntheir friends had taught them:  such as, that a red-hot poker\nwill burn you if you hold it too long; and that if you cut your\nfinger VERY deeply with a knife, it usually bleeds; and she had\nnever forgotten that, if you drink much from a bottle marked\n`poison,' it is almost certain to disagree with you, sooner or\nlater.\n\nHowever, this bottle was NOT marked `poison,' so Alice ventured\nto taste it, and finding it very nice, (it had, in fact, a sort\nof mixed flavour of cherry-tart, custard, pine-apple, roast\nturkey, toffee, and hot buttered toast,) she very soon finished\nit off.\n\n *       *       *       *       *       *       *\n\n     *       *       *       *       *       *\n\n *       *       *       *       *       *       *\n\n`What a curious feeling!' said Alice; `I must be shutting up\nlike a telescope.'\n\nAnd so it was indeed:  she was now only ten inches high, and\nher face brightened up at the thought that she was now the right\nsize for going through the little door into that lovely garden.\nFirst, however, she waited for a few minutes to see if she was\ngoing to shrink any further:  she felt a little nervous about\nthis; `for it might end, you know,' said Alice to herself, `in my\ngoing out altogether, like a candle.  I wonder what I should be\nlike then?'  And she tried to fancy what the flame of a candle is\nlike after the candle is blown out, for she could not remember\never having seen such a thing.\n\nAfter a while, finding that nothing more happened, she decided\non going into the garden at once; but, alas for poor Alice!\nwhen she got to the door, she found she had forgotten the\nlittle golden key, and when she went back to the table for it,\nshe found she could not possibly reach it:  she could see it\nquite plainly through the glass, and she tried her best to climb\nup one of the legs of the table, but it was too slippery;\nand when she had tired herself out with trying,\nthe poor little thing sat down and cried.\n\n`Come, there's no use in crying like that!' said Alice to\nherself, rather sharply; `I advise you to leave off this minute!'\nShe generally gave herself very good advice, (though she very\nseldom followed it), and sometimes she scolded herself so\nseverely as to bring tears into her eyes; and once she remembered\ntrying to box her own ears for having cheated herself in a game\nof croquet she was playing against herself, for this curious\nchild was very fond of pretending to be two people.  `But it's no\nuse now,' thought poor Alice, `to pretend to be two people!  Why,\nthere's hardly enough of me left to make ONE respectable\nperson!'\n\nSoon her eye fell on a little glass box that was lying under\nthe table:  she opened it, and found in it a very small cake, on\nwhich the words `EAT ME' were beautifully marked in currants.\n`Well, I'll eat it,' said Alice, `and if it makes me grow larger,\nI can reach the key; and if it makes me grow smaller, I can creep\nunder the door; so either way I'll get into the garden, and I\ndon't care which happens!'\n\nShe ate a little bit, and said anxiously to herself, `Which\nway?  Which way?', holding her hand on the top of her head to\nfeel which way it was growing, and she was quite surprised to\nfind that she remained the same size:  to be sure, this generally\nhappens when one eats cake, but Alice had got so much into the\nway of expecting nothing but out-of-the-way things to happen,\nthat it seemed quite dull and stupid for life to go on in the\ncommon way.\n\nSo she set to work, and very soon finished off the cake.\n\n *       *       *       *       *       *       *\n\n     *       *       *       *       *       *\n\n *       *       *       *       *       *       *\n\n\n\n\n                       CHAPTER II\n\n                    The Pool of Tears\n\n\n`Curiouser and curiouser!' cried Alice (she was so much\nsurprised, that for the moment she quite forgot how to speak good\nEnglish); `now I'm opening out like the largest telescope that\never was!  Good-bye, feet!' (for when she looked down at her\nfeet, they seemed to be almost out of sight, they were getting so\nfar off).  `Oh, my poor little feet, I wonder who will put on\nyour shoes and stockings for you now, dears?  I'm sure _I_ shan't\nbe able!  I shall be a great deal too far off to trouble myself\nabout you:  you must manage the best way you can; --but I must be\nkind to them,' thought Alice, `or perhaps they won't walk the\nway I want to go!  Let me see:  I'll give them a new pair of\nboots every Christmas.'\n\nAnd she went on planning to herself how she would manage it.\n`They must go by the carrier,' she thought; `and how funny it'll\nseem, sending presents to one's own feet!  And how odd the\ndirections will look!\n\n        ALICE'S RIGHT FOOT, ESQ.\n            HEARTHRUG,\n                NEAR THE FENDER,\n                    (WITH ALICE'S LOVE).\n\nOh dear, what nonsense I'm talking!'\n\nJust then her head struck against the roof of the hall:  in\nfact she was now more than nine feet high, and she at once took\nup the little golden key and hurried off to the garden door.\n\nPoor Alice!  It was as much as she could do, lying down on one\nside, to look through into the garden with one eye; but to get\nthrough was more hopeless than ever:  she sat down and began to\ncry again.\n\n`You ought to be ashamed of yourself,' said Alice, `a great\ngirl like you,' (she might well say this), `to go on crying in\nthis way!  Stop this moment, I tell you!'  But she went on all\nthe same, shedding gallons of tears, until there was a large pool\nall round her, about four inches deep and reaching half down the\nhall.\n\nAfter a time she heard a little pattering of feet in the\ndistance, and she hastily dried her eyes to see what was coming.\nIt was the White Rabbit returning, splendidly dressed, with a\npair of white kid gloves in one hand and a large fan in the\nother:  he came trotting along in a great hurry, muttering to\nhimself as he came, `Oh! the Duchess, the Duchess! Oh! won't she\nbe savage if I've kept her waiting!'  Alice felt so desperate\nthat she was ready to ask help of any one; so, when the Rabbit\ncame near her, she began, in a low, timid voice, `If you please,\nsir--'  The Rabbit started violently, dropped the white kid\ngloves and the fan, and skurried away into the darkness as hard\nas he could go.\n\nAlice took up the fan and gloves, and, as the hall was very\nhot, she kept fanning herself all the time she went on talking:\n`Dear, dear!  How queer everything is to-day!  And yesterday\nthings went on just as usual.  I wonder if I've been changed in\nthe night?  Let me think:  was I the same when I got up this\nmorning?  I almost think I can remember feeling a little\ndifferent.  But if I'm not the same, the next question is, Who in\nthe world am I?  Ah, THAT'S the great puzzle!'  And she began\nthinking over all the children she knew that were of the same age\nas herself, to see if she could have been changed for any of\nthem.\n\n`I'm sure I'm not Ada,' she said, `for her hair goes in such\nlong ringlets, and mine doesn't go in ringlets at all; and I'm\nsure I can't be Mabel, for I know all sorts of things, and she,\noh! she knows such a very little!  Besides, SHE'S she, and I'm I,\nand--oh dear, how puzzling it all is!  I'll try if I know all the\nthings I used to know.  Let me see:  four times five is twelve,\nand four times six is thirteen, and four times seven is--oh dear!\nI shall never get to twenty at that rate!  However, the\nMultiplication Table doesn't signify:  let's try Geography.\nLondon is the capital of Paris, and Paris is the capital of Rome,\nand Rome--no, THAT'S all wrong, I'm certain!  I must have been\nchanged for Mabel!  I'll try and say \"How doth the little--\"'\nand she crossed her hands on her lap as if she were saying lessons,\nand began to repeat it, but her voice sounded hoarse and\nstrange, and the words did not come the same as they used to do:--\n\n        `How doth the little crocodile\n          Improve his shining tail,\n        And pour the waters of the Nile\n          On every golden scale!\n\n        `How cheerfully he seems to grin,\n          How neatly spread his claws,\n        And welcome little fishes in\n          With gently smiling jaws!'\n\n`I'm sure those are not the right words,' said poor Alice, and\nher eyes filled with tears again as she went on, `I must be Mabel\nafter all, and I shall have to go and live in that poky little\nhouse, and have next to no toys to play with, and oh! ever so\nmany lessons to learn!  No, I've made up my mind about it; if I'm\nMabel, I'll stay down here!  It'll be no use their putting their\nheads down and saying \"Come up again, dear!\"  I shall only look\nup and say \"Who am I then?  Tell me that first, and then, if I\nlike being that person, I'll come up:  if not, I'll stay down\nhere till I'm somebody else\"--but, oh dear!' cried Alice, with a\nsudden burst of tears, `I do wish they WOULD put their heads\ndown!  I am so VERY tired of being all alone here!'\n\nAs she said this she looked down at her hands, and was\nsurprised to see that she had put on one of the Rabbit's little\nwhite kid gloves while she was talking.  `How CAN I have done\nthat?' she thought.  `I must be growing small again.'  She got up\nand went to the table to measure herself by it, and found that,\nas nearly as she could guess, she was now about two feet high,\nand was going on shrinking rapidly:  she soon found out that the\ncause of this was the fan she was holding, and she dropped it\nhastily, just in time to avoid shrinking away altogether.\n\n`That WAS a narrow escape!' said Alice, a good deal frightened at\nthe sudden change, but very glad to find herself still in\nexistence; `and now for the garden!' and she ran with all speed\nback to the little door:  but, alas! the little door was shut\nagain, and the little golden key was lying on the glass table as\nbefore, `and things are worse than ever,' thought the poor child,\n`for I never was so small as this before, never!  And I declare\nit's too bad, that it is!'\n\nAs she said these words her foot slipped, and in another\nmoment, splash! she was up to her chin in salt water.  Her first\nidea was that she had somehow fallen into the sea, `and in that\ncase I can go back by railway,' she said to herself.  (Alice had\nbeen to the seaside once in her life, and had come to the general\nconclusion, that wherever you go to on the English coast you find\na number of bathing machines in the sea, some children digging in\nthe sand with wooden spades, then a row of lodging houses, and\nbehind them a railway station.)  However, she soon made out that\nshe was in the pool of tears which she had wept when she was nine\nfeet high.\n\n`I wish I hadn't cried so much!' said Alice, as she swam about,\ntrying to find her way out.  `I shall be punished for it now, I\nsuppose, by being drowned in my own tears!  That WILL be a queer\nthing, to be sure!  However, everything is queer to-day.'\n\nJust then she heard something splashing about in the pool a\nlittle way off, and she swam nearer to make out what it was:  at\nfirst she thought it must be a walrus or hippopotamus, but then\nshe remembered how small she was now, and she soon made out that\nit was only a mouse that had slipped in like herself.\n\n`Would it be of any use, now,' thought Alice, `to speak to this\nmouse?  Everything is so out-of-the-way down here, that I should\nthink very likely it can talk:  at any rate, there's no harm in\ntrying.'  So she began:  `O Mouse, do you know the way out of\nthis pool?  I am very tired of swimming about here, O Mouse!'\n(Alice thought this must be the right way of speaking to a mouse:\nshe had never done such a thing before, but she remembered having\nseen in her brother's Latin Grammar, `A mouse--of a mouse--to a\nmouse--a mouse--O mouse!')  The Mouse looked at her rather\ninquisitively, and seemed to her to wink with one of its little\neyes, but it said nothing.\n\n`Perhaps it doesn't understand English,' thought Alice; `I\ndaresay it's a French mouse, come over with William the\nConqueror.'  (For, with all her knowledge of history, Alice had\nno very clear notion how long ago anything had happened.)  So she\nbegan again:  `Ou est ma chatte?' which was the first sentence in\nher French lesson-book.  The Mouse gave a sudden leap out of the\nwater, and seemed to quiver all over with fright.  `Oh, I beg\nyour pardon!' cried Alice hastily, afraid that she had hurt the\npoor animal's feelings.  `I quite forgot you didn't like cats.'\n\n`Not like cats!' cried the Mouse, in a shrill, passionate\nvoice.  `Would YOU like cats if you were me?'\n\n`Well, perhaps not,' said Alice in a soothing tone:  `don't be\nangry about it.  And yet I wish I could show you our cat Dinah:\nI think you'd take a fancy to cats if you could only see her.\nShe is such a dear quiet thing,' Alice went on, half to herself,\nas she swam lazily about in the pool, `and she sits purring so\nnicely by the fire, licking her paws and washing her face--and\nshe is such a nice soft thing to nurse--and she's such a capital\none for catching mice--oh, I beg your pardon!' cried Alice again,\nfor this time the Mouse was bristling all over, and she felt\ncertain it must be really offended.  `We won't talk about her any\nmore if you'd rather not.'\n\n`We indeed!' cried the Mouse, who was trembling down to the end\nof his tail.  `As if I would talk on such a subject!  Our family\nalways HATED cats:  nasty, low, vulgar things!  Don't let me hear\nthe name again!'\n\n`I won't indeed!' said Alice, in a great hurry to change the\nsubject of conversation.  `Are you--are you fond--of--of dogs?'\nThe Mouse did not answer, so Alice went on eagerly:  `There is\nsuch a nice little dog near our house I should like to show you!\nA little bright-eyed terrier, you know, with oh, such long curly\nbrown hair!  And it'll fetch things when you throw them, and\nit'll sit up and beg for its dinner, and all sorts of things--I\ncan't remember half of them--and it belongs to a farmer, you\nknow, and he says it's so useful, it's worth a hundred pounds!\nHe says it kills all the rats and--oh dear!' cried Alice in a\nsorrowful tone, `I'm afraid I've offended it again!'  For the\nMouse was swimming away from her as hard as it could go, and\nmaking quite a commotion in the pool as it went.\n\nSo she called softly after it, `Mouse dear!  Do come back\nagain, and we won't talk about cats or dogs either, if you don't\nlike them!'  When the Mouse heard this, it turned round and swam\nslowly back to her:  its face was quite pale (with passion, Alice\nthought), and it said in a low trembling voice, `Let us get to\nthe shore, and then I'll tell you my history, and you'll\nunderstand why it is I hate cats and dogs.'\n\nIt was high time to go, for the pool was getting quite crowded\nwith the birds and animals that had fallen into it:  there were a\nDuck and a Dodo, a Lory and an Eaglet, and several other curious\ncreatures.  Alice led the way, and the whole party swam to the\nshore.\n\n\n\n                       CHAPTER III\n\n              A Caucus-Race and a Long Tale\n\n\nThey were indeed a queer-looking party that assembled on the\nbank--the birds with draggled feathers, the animals with their\nfur clinging close to them, and all dripping wet, cross, and\nuncomfortable.\n\nThe first question of course was, how to get dry again:  they\nhad a consultation about this, and after a few minutes it seemed\nquite natural to Alice to find herself talking familiarly with\nthem, as if she had known them all her life.  Indeed, she had\nquite a long argument with the Lory, who at last turned sulky,\nand would only say, `I am older than you, and must know better';\nand this Alice would not allow without knowing how old it was,\nand, as the Lory positively refused to tell its age, there was no\nmore to be said.\n\nAt last the Mouse, who seemed to be a person of authority among\nthem, called out, `Sit down, all of you, and listen to me!  I'LL\nsoon make you dry enough!'  They all sat down at once, in a large\nring, with the Mouse in the middle.  Alice kept her eyes\nanxiously fixed on it, for she felt sure she would catch a bad\ncold if she did not get dry very soon.\n\n`Ahem!' said the Mouse with an important air, `are you all ready?\nThis is the driest thing I know.  Silence all round, if you please!\n\"William the Conqueror, whose cause was favoured by the pope, was\nsoon submitted to by the English, who wanted leaders, and had been\nof late much accustomed to usurpation and conquest.  Edwin and\nMorcar, the earls of Mercia and Northumbria--\"'\n\n`Ugh!' said the Lory, with a shiver.\n\n`I beg your pardon!' said the Mouse, frowning, but very\npolitely:  `Did you speak?'\n\n`Not I!' said the Lory hastily.\n\n`I thought you did,' said the Mouse.  `--I proceed.  \"Edwin and\nMorcar, the earls of Mercia and Northumbria, declared for him:\nand even Stigand, the patriotic archbishop of Canterbury, found\nit advisable--\"'\n\n`Found WHAT?' said the Duck.\n\n`Found IT,' the Mouse replied rather crossly:  `of course you\nknow what \"it\" means.'\n\n`I know what \"it\" means well enough, when I find a thing,' said\nthe Duck:  `it's generally a frog or a worm.  The question is,\nwhat did the archbishop find?'\n\nThe Mouse did not notice this question, but hurriedly went on,\n`\"--found it advisable to go with Edgar Atheling to meet William\nand offer him the crown.  William's conduct at first was\nmoderate.  But the insolence of his Normans--\"  How are you\ngetting on now, my dear?' it continued, turning to Alice as it\nspoke.\n\n`As wet as ever,' said Alice in a melancholy tone:  `it doesn't\nseem to dry me at all.'\n\n`In that case,' said the Dodo solemnly, rising to its feet, `I\nmove that the meeting adjourn, for the immediate adoption of more\nenergetic remedies--'\n\n`Speak English!' said the Eaglet.  `I don't know the meaning of\nhalf those long words, and, what's more, I don't believe you do\neither!'  And the Eaglet bent down its head to hide a smile:\nsome of the other birds tittered audibly.\n\n`What I was going to say,' said the Dodo in an offended tone,\n`was, that the best thing to get us dry would be a Caucus-race.'\n\n`What IS a Caucus-race?' said Alice; not that she wanted much\nto know, but the Dodo had paused as if it thought that SOMEBODY\nought to speak, and no one else seemed inclined to say anything.\n\n`Why,' said the Dodo, `the best way to explain it is to do it.'\n(And, as you might like to try the thing yourself, some winter\nday, I will tell you how the Dodo managed it.)\n\nFirst it marked out a race-course, in a sort of circle, (`the\nexact shape doesn't matter,' it said,) and then all the party\nwere placed along the course, here and there.  There was no `One,\ntwo, three, and away,' but they began running when they liked,\nand left off when they liked, so that it was not easy to know\nwhen the race was over.  However, when they had been running half\nan hour or so, and were quite dry again, the Dodo suddenly called\nout `The race is over!' and they all crowded round it, panting,\nand asking, `But who has won?'\n\nThis question the Dodo could not answer without a great deal of\nthought, and it sat for a long time with one finger pressed upon\nits forehead (the position in which you usually see Shakespeare,\nin the pictures of him), while the rest waited in silence.  At\nlast the Dodo said, `EVERYBODY has won, and all must have\nprizes.'\n\n`But who is to give the prizes?' quite a chorus of voices\nasked.\n\n`Why, SHE, of course,' said the Dodo, pointing to Alice with\none finger; and the whole party at once crowded round her,\ncalling out in a confused way, `Prizes! Prizes!'\n\nAlice had no idea what to do, and in despair she put her hand\nin her pocket, and pulled out a box of comfits, (luckily the salt\nwater had not got into it), and handed them round as prizes.\nThere was exactly one a-piece all round.\n\n`But she must have a prize herself, you know,' said the Mouse.\n\n`Of course,' the Dodo replied very gravely.  `What else have\nyou got in your pocket?' he went on, turning to Alice.\n\n`Only a thimble,' said Alice sadly.\n\n`Hand it over here,' said the Dodo.\n\nThen they all crowded round her once more, while the Dodo\nsolemnly presented the thimble, saying `We beg your acceptance of\nthis elegant thimble'; and, when it had finished this short\nspeech, they all cheered.\n\nAlice thought the whole thing very absurd, but they all looked\nso grave that she did not dare to laugh; and, as she could not\nthink of anything to say, she simply bowed, and took the thimble,\nlooking as solemn as she could.\n\nThe next thing was to eat the comfits:  this caused some noise\nand confusion, as the large birds complained that they could not\ntaste theirs, and the small ones choked and had to be patted on\nthe back.  However, it was over at last, and they sat down again\nin a ring, and begged the Mouse to tell them something more.\n\n`You promised to tell me your history, you know,' said Alice,\n`and why it is you hate--C and D,' she added in a whisper, half\nafraid that it would be offended again.\n\n`Mine is a long and a sad tale!' said the Mouse, turning to\nAlice, and sighing.\n\n`It IS a long tail, certainly,' said Alice, looking down with\nwonder at the Mouse's tail; `but why do you call it sad?'  And\nshe kept on puzzling about it while the Mouse was speaking, so\nthat her idea of the tale was something like this:--\n\n                `Fury said to a\n               mouse, That he\n             met in the\n           house,\n        \"Let us\n          both go to\n            law:  I will\n              prosecute\n                YOU.  --Come,\n                   I'll take no\n                    denial; We\n                 must have a\n             trial:  For\n          really this\n       morning I've\n      nothing\n     to do.\"\n       Said the\n         mouse to the\n           cur, \"Such\n             a trial,\n               dear Sir,\n                     With\n                 no jury\n              or judge,\n            would be\n          wasting\n         our\n          breath.\"\n           \"I'll be\n             judge, I'll\n               be jury,\"\n                     Said\n                cunning\n                  old Fury:\n                 \"I'll\n                  try the\n                     whole\n                      cause,\n                         and\n                    condemn\n                   you\n                  to\n                   death.\"'\n\n\n`You are not attending!' said the Mouse to Alice severely.\n`What are you thinking of?'\n\n`I beg your pardon,' said Alice very humbly:  `you had got to\nthe fifth bend, I think?'\n\n`I had NOT!' cried the Mouse, sharply and very angrily.\n\n`A knot!' said Alice, always ready to make herself useful, and\nlooking anxiously about her.  `Oh, do let me help to undo it!'\n\n`I shall do nothing of the sort,' said the Mouse, getting up\nand walking away.  `You insult me by talking such nonsense!'\n\n`I didn't mean it!' pleaded poor Alice.  `But you're so easily\noffended, you know!'\n\nThe Mouse only growled in reply.\n\n`Please come back and finish your story!' Alice called after\nit; and the others all joined in chorus, `Yes, please do!' but\nthe Mouse only shook its head impatiently, and walked a little\nquicker.\n\n`What a pity it wouldn't stay!' sighed the Lory, as soon as it\nwas quite out of sight; and an old Crab took the opportunity of\nsaying to her daughter `Ah, my dear!  Let this be a lesson to you\nnever to lose YOUR temper!'  `Hold your tongue, Ma!' said the\nyoung Crab, a little snappishly.  `You're enough to try the\npatience of an oyster!'\n\n`I wish I had our Dinah here, I know I do!' said Alice aloud,\naddressing nobody in particular.  `She'd soon fetch it back!'\n\n`And who is Dinah, if I might venture to ask the question?'\nsaid the Lory.\n\nAlice replied eagerly, for she was always ready to talk about\nher pet:  `Dinah's our cat.  And she's such a capital one for\ncatching mice you can't think!  And oh, I wish you could see her\nafter the birds!  Why, she'll eat a little bird as soon as look\nat it!'\n\nThis speech caused a remarkable sensation among the party.\nSome of the birds hurried off at once:  one old Magpie began\nwrapping itself up very carefully, remarking, `I really must be\ngetting home; the night-air doesn't suit my throat!' and a Canary\ncalled out in a trembling voice to its children, `Come away, my\ndears!  It's high time you were all in bed!'  On various pretexts\nthey all moved off, and Alice was soon left alone.\n\n`I wish I hadn't mentioned Dinah!' she said to herself in a\nmelancholy tone.  `Nobody seems to like her, down here, and I'm\nsure she's the best cat in the world!  Oh, my dear Dinah!  I\nwonder if I shall ever see you any more!'  And here poor Alice\nbegan to cry again, for she felt very lonely and low-spirited.\nIn a little while, however, she again heard a little pattering of\nfootsteps in the distance, and she looked up eagerly, half hoping\nthat the Mouse had changed his mind, and was coming back to\nfinish his story.\n\n\n\n                       CHAPTER IV\n\n            The Rabbit Sends in a Little Bill\n\n\nIt was the White Rabbit, trotting slowly back again, and\nlooking anxiously about as it went, as if it had lost something;\nand she heard it muttering to itself `The Duchess!  The Duchess!\nOh my dear paws!  Oh my fur and whiskers!  She'll get me\nexecuted, as sure as ferrets are ferrets!  Where CAN I have\ndropped them, I wonder?'  Alice guessed in a moment that it was\nlooking for the fan and the pair of white kid gloves, and she\nvery good-naturedly began hunting about for them, but they were\nnowhere to be seen--everything seemed to have changed since her\nswim in the pool, and the great hall, with the glass table and\nthe little door, had vanished completely.\n\nVery soon the Rabbit noticed Alice, as she went hunting about,\nand called out to her in an angry tone, `Why, Mary Ann, what ARE\nyou doing out here?  Run home this moment, and fetch me a pair of\ngloves and a fan!  Quick, now!'  And Alice was so much frightened\nthat she ran off at once in the direction it pointed to, without\ntrying to explain the mistake it had made.\n\n`He took me for his housemaid,' she said to herself as she ran.\n`How surprised he'll be when he finds out who I am!  But I'd\nbetter take him his fan and gloves--that is, if I can find them.'\nAs she said this, she came upon a neat little house, on the door\nof which was a bright brass plate with the name `W. RABBIT'\nengraved upon it.  She went in without knocking, and hurried\nupstairs, in great fear lest she should meet the real Mary Ann,\nand be turned out of the house before she had found the fan and\ngloves.\n\n`How queer it seems,' Alice said to herself, `to be going\nmessages for a rabbit!  I suppose Dinah'll be sending me on\nmessages next!'  And she began fancying the sort of thing that\nwould happen:  `\"Miss Alice!  Come here directly, and get ready\nfor your walk!\" \"Coming in a minute, nurse!  But I've got to see\nthat the mouse doesn't get out.\"  Only I don't think,' Alice went\non, `that they'd let Dinah stop in the house if it began ordering\npeople about like that!'\n\nBy this time she had found her way into a tidy little room with\na table in the window, and on it (as she had hoped) a fan and two\nor three pairs of tiny white kid gloves:  she took up the fan and\na pair of the gloves, and was just going to leave the room, when\nher eye fell upon a little bottle that stood near the looking-\nglass.  There was no label this time with the words `DRINK ME,'\nbut nevertheless she uncorked it and put it to her lips.  `I know\nSOMETHING interesting is sure to happen,' she said to herself,\n`whenever I eat or drink anything; so I'll just see what this\nbottle does.  I do hope it'll make me grow large again, for\nreally I'm quite tired of being such a tiny little thing!'\n\nIt did so indeed, and much sooner than she had expected:\nbefore she had drunk half the bottle, she found her head pressing\nagainst the ceiling, and had to stoop to save her neck from being\nbroken.  She hastily put down the bottle, saying to herself\n`That's quite enough--I hope I shan't grow any more--As it is, I\ncan't get out at the door--I do wish I hadn't drunk quite so\nmuch!'\n\nAlas! it was too late to wish that!  She went on growing, and\ngrowing, and very soon had to kneel down on the floor:  in\nanother minute there was not even room for this, and she tried\nthe effect of lying down with one elbow against the door, and the\nother arm curled round her head.  Still she went on growing, and,\nas a last resource, she put one arm out of the window, and one\nfoot up the chimney, and said to herself `Now I can do no more,\nwhatever happens.  What WILL become of me?'\n\nLuckily for Alice, the little magic bottle had now had its full\neffect, and she grew no larger:  still it was very uncomfortable,\nand, as there seemed to be no sort of chance of her ever getting\nout of the room again, no wonder she felt unhappy.\n\n`It was much pleasanter at home,' thought poor Alice, `when one\nwasn't always growing larger and smaller, and being ordered about\nby mice and rabbits.  I almost wish I hadn't gone down that\nrabbit-hole--and yet--and yet--it's rather curious, you know,\nthis sort of life!  I do wonder what CAN have happened to me!\nWhen I used to read fairy-tales, I fancied that kind of thing\nnever happened, and now here I am in the middle of one!  There\nought to be a book written about me, that there ought!  And when\nI grow up, I'll write one--but I'm grown up now,' she added in a\nsorrowful tone; `at least there's no room to grow up any more\nHERE.'\n\n`But then,' thought Alice, `shall I NEVER get any older than I\nam now?  That'll be a comfort, one way--never to be an old woman--\nbut then--always to have lessons to learn!  Oh, I shouldn't like THAT!'\n\n`Oh, you foolish Alice!' she answered herself.  `How can you\nlearn lessons in here?  Why, there's hardly room for YOU, and no\nroom at all for any lesson-books!'\n\nAnd so she went on, taking first one side and then the other,\nand making quite a conversation of it altogether; but after a few\nminutes she heard a voice outside, and stopped to listen.\n\n`Mary Ann!  Mary Ann!' said the voice.  `Fetch me my gloves\nthis moment!'  Then came a little pattering of feet on the\nstairs.  Alice knew it was the Rabbit coming to look for her, and\nshe trembled till she shook the house, quite forgetting that she\nwas now about a thousand times as large as the Rabbit, and had no\nreason to be afraid of it.\n\nPresently the Rabbit came up to the door, and tried to open it;\nbut, as the door opened inwards, and Alice's elbow was pressed\nhard against it, that attempt proved a failure.  Alice heard it\nsay to itself `Then I'll go round and get in at the window.'\n\n`THAT you won't' thought Alice, and, after waiting till she\nfancied she heard the Rabbit just under the window, she suddenly\nspread out her hand, and made a snatch in the air.  She did not\nget hold of anything, but she heard a little shriek and a fall,\nand a crash of broken glass, from which she concluded that it was\njust possible it had fallen into a cucumber-frame, or something\nof the sort.\n\nNext came an angry voice--the Rabbit's--`Pat! Pat!  Where are\nyou?'  And then a voice she had never heard before, `Sure then\nI'm here!  Digging for apples, yer honour!'\n\n`Digging for apples, indeed!' said the Rabbit angrily.  `Here!\nCome and help me out of THIS!'  (Sounds of more broken glass.)\n\n`Now tell me, Pat, what's that in the window?'\n\n`Sure, it's an arm, yer honour!'  (He pronounced it `arrum.')\n\n`An arm, you goose!   Who ever saw one that size?  Why, it\nfills the whole window!'\n\n`Sure, it does, yer honour:  but it's an arm for all that.'\n\n`Well, it's got no business there, at any rate:  go and take it\naway!'\n\nThere was a long silence after this, and Alice could only hear\nwhispers now and then; such as, `Sure, I don't like it, yer\nhonour, at all, at all!'  `Do as I tell you, you coward!' and at\nlast she spread out her hand again, and made another snatch in\nthe air.  This time there were TWO little shrieks, and more\nsounds of broken glass.  `What a number of cucumber-frames there\nmust be!' thought Alice.  `I wonder what they'll do next!  As for\npulling me out of the window, I only wish they COULD!  I'm sure I\ndon't want to stay in here any longer!'\n\nShe waited for some time without hearing anything more:  at\nlast came a rumbling of little cartwheels, and the sound of a\ngood many voices all talking together:  she made out the words:\n`Where's the other ladder?--Why, I hadn't to bring but one;\nBill's got the other--Bill! fetch it here, lad!--Here, put 'em up\nat this corner--No, tie 'em together first--they don't reach half\nhigh enough yet--Oh! they'll do well enough; don't be particular--\nHere, Bill! catch hold of this rope--Will the roof bear?--Mind\nthat loose slate--Oh, it's coming down!  Heads below!' (a loud\ncrash)--`Now, who did that?--It was Bill, I fancy--Who's to go\ndown the chimney?--Nay, I shan't! YOU do it!--That I won't,\nthen!--Bill's to go down--Here, Bill! the master says you're to\ngo down the chimney!'\n\n`Oh! So Bill's got to come down the chimney, has he?' said\nAlice to herself.  `Shy, they seem to put everything upon Bill!\nI wouldn't be in Bill's place for a good deal:  this fireplace is\nnarrow, to be sure; but I THINK I can kick a little!'\n\nShe drew her foot as far down the chimney as she could, and\nwaited till she heard a little animal (she couldn't guess of what\nsort it was) scratching and scrambling about in the chimney close\nabove her:  then, saying to herself `This is Bill,' she gave one\nsharp kick, and waited to see what would happen next.\n\nThe first thing she heard was a general chorus of `There goes\nBill!' then the Rabbit's voice along--`Catch him, you by the\nhedge!' then silence, and then another confusion of voices--`Hold\nup his head--Brandy now--Don't choke him--How was it, old fellow?\nWhat happened to you?  Tell us all about it!'\n\nLast came a little feeble, squeaking voice, (`That's Bill,'\nthought Alice,) `Well, I hardly know--No more, thank ye; I'm\nbetter now--but I'm a deal too flustered to tell you--all I know\nis, something comes at me like a Jack-in-the-box, and up I goes\nlike a sky-rocket!'\n\n`So you did, old fellow!' said the others.\n\n`We must burn the house down!' said the Rabbit's voice; and\nAlice called out as loud as she could, `If you do.  I'll set\nDinah at you!'\n\nThere was a dead silence instantly, and Alice thought to\nherself, `I wonder what they WILL do next!  If they had any\nsense, they'd take the roof off.'  After a minute or two, they\nbegan moving about again, and Alice heard the Rabbit say, `A\nbarrowful will do, to begin with.'\n\n`A barrowful of WHAT?' thought Alice; but she had not long to\ndoubt, for the next moment a shower of little pebbles came\nrattling in at the window, and some of them hit her in the face.\n`I'll put a stop to this,' she said to herself, and shouted out,\n`You'd better not do that again!' which produced another dead\nsilence.\n\nAlice noticed with some surprise that the pebbles were all\nturning into little cakes as they lay on the floor, and a bright\nidea came into her head.  `If I eat one of these cakes,' she\nthought, `it's sure to make SOME change in my size; and as it\ncan't possibly make me larger, it must make me smaller, I\nsuppose.'\n\nSo she swallowed one of the cakes, and was delighted to find\nthat she began shrinking directly.  As soon as she was small\nenough to get through the door, she ran out of the house, and\nfound quite a crowd of little animals and birds waiting outside.\nThe poor little Lizard, Bill, was in the middle, being held up by\ntwo guinea-pigs, who were giving it something out of a bottle.\nThey all made a rush at Alice the moment she appeared; but she\nran off as hard as she could, and soon found herself safe in a\nthick wood.\n\n`The first thing I've got to do,' said Alice to herself, as she\nwandered about in the wood, `is to grow to my right size again;\nand the second thing is to find my way into that lovely garden.\nI think that will be the best plan.'\n\nIt sounded an excellent plan, no doubt, and very neatly and\nsimply arranged; the only difficulty was, that she had not the\nsmallest idea how to set about it; and while she was peering\nabout anxiously among the trees, a little sharp bark just over\nher head made her look up in a great hurry.\n\nAn enormous puppy was looking down at her with large round\neyes, and feebly stretching out one paw, trying to touch her.\n`Poor little thing!' said Alice, in a coaxing tone, and she tried\nhard to whistle to it; but she was terribly frightened all the\ntime at the thought that it might be hungry, in which case it\nwould be very likely to eat her up in spite of all her coaxing.\n\nHardly knowing what she did, she picked up a little bit of\nstick, and held it out to the puppy; whereupon the puppy jumped\ninto the air off all its feet at once, with a yelp of delight,\nand rushed at the stick, and made believe to worry it; then Alice\ndodged behind a great thistle, to keep herself from being run\nover; and the moment she appeared on the other side, the puppy\nmade another rush at the stick, and tumbled head over heels in\nits hurry to get hold of it; then Alice, thinking it was very\nlike having a game of play with a cart-horse, and expecting every\nmoment to be trampled under its feet, ran round the thistle\nagain; then the puppy began a series of short charges at the\nstick, running a very little way forwards each time and a long\nway back, and barking hoarsely all the while, till at last it sat\ndown a good way off, panting, with its tongue hanging out of its\nmouth, and its great eyes half shut.\n\nThis seemed to Alice a good opportunity for making her escape;\nso she set off at once, and ran till she was quite tired and out\nof breath, and till the puppy's bark sounded quite faint in the\ndistance.\n\n`And yet what a dear little puppy it was!' said Alice, as she\nleant against a buttercup to rest herself, and fanned herself\nwith one of the leaves:  `I should have liked teaching it tricks\nvery much, if--if I'd only been the right size to do it!  Oh\ndear!  I'd nearly forgotten that I've got to grow up again!  Let\nme see--how IS it to be managed?  I suppose I ought to eat or\ndrink something or other; but the great question is, what?'\n\nThe great question certainly was, what?  Alice looked all round\nher at the flowers and the blades of grass, but she did not see\nanything that looked like the right thing to eat or drink under\nthe circumstances.  There was a large mushroom growing near her,\nabout the same height as herself; and when she had looked under\nit, and on both sides of it, and behind it, it occurred to her\nthat she might as well look and see what was on the top of it.\n\nShe stretched herself up on tiptoe, and peeped over the edge of\nthe mushroom, and her eyes immediately met those of a large\ncaterpillar, that was sitting on the top with its arms folded,\nquietly smoking a long hookah, and taking not the smallest notice\nof her or of anything else.\n\n\n\n                        CHAPTER V\n\n                Advice from a Caterpillar\n\n\nThe Caterpillar and Alice looked at each other for some time in\nsilence:  at last the Caterpillar took the hookah out of its\nmouth, and addressed her in a languid, sleepy voice.\n\n`Who are YOU?' said the Caterpillar.\n\nThis was not an encouraging opening for a conversation.  Alice\nreplied, rather shyly, `I--I hardly know, sir, just at present--\nat least I know who I WAS when I got up this morning, but I think\nI must have been changed several times since then.'\n\n`What do you mean by that?' said the Caterpillar sternly.\n`Explain yourself!'\n\n`I can't explain MYSELF, I'm afraid, sir' said Alice, `because\nI'm not myself, you see.'\n\n`I don't see,' said the Caterpillar.\n\n`I'm afraid I can't put it more clearly,' Alice replied very\npolitely, `for I can't understand it myself to begin with; and\nbeing so many different sizes in a day is very confusing.'\n\n`It isn't,' said the Caterpillar.\n\n`Well, perhaps you haven't found it so yet,' said Alice; `but\nwhen you have to turn into a chrysalis--you will some day, you\nknow--and then after that into a butterfly, I should think you'll\nfeel it a little queer, won't you?'\n\n`Not a bit,' said the Caterpillar.\n\n`Well, perhaps your feelings may be different,' said Alice;\n`all I know is, it would feel very queer to ME.'\n\n`You!' said the Caterpillar contemptuously.  `Who are YOU?'\n\nWhich brought them back again to the beginning of the\nconversation.  Alice felt a little irritated at the Caterpillar's\nmaking such VERY short remarks, and she drew herself up and said,\nvery gravely, `I think, you ought to tell me who YOU are, first.'\n\n`Why?' said the Caterpillar.\n\nHere was another puzzling question; and as Alice could not\nthink of any good reason, and as the Caterpillar seemed to be in\na VERY unpleasant state of mind, she turned away.\n\n`Come back!' the Caterpillar called after her.  `I've something\nimportant to say!'\n\nThis sounded promising, certainly:  Alice turned and came back\nagain.\n\n`Keep your temper,' said the Caterpillar.\n\n`Is that all?' said Alice, swallowing down her anger as well as\nshe could.\n\n`No,' said the Caterpillar.\n\nAlice thought she might as well wait, as she had nothing else\nto do, and perhaps after all it might tell her something worth\nhearing.  For some minutes it puffed away without speaking, but\nat last it unfolded its arms, took the hookah out of its mouth\nagain, and said, `So you think you're changed, do you?'\n\n`I'm afraid I am, sir,' said Alice; `I can't remember things as\nI used--and I don't keep the same size for ten minutes together!'\n\n`Can't remember WHAT things?' said the Caterpillar.\n\n`Well, I've tried to say \"HOW DOTH THE LITTLE BUSY BEE,\" but it\nall came different!' Alice replied in a very melancholy voice.\n\n`Repeat, \"YOU ARE OLD, FATHER WILLIAM,\"' said the Caterpillar.\n\nAlice folded her hands, and began:--\n\n`You are old, Father William,' the young man said,\n  `And your hair has become very white;\nAnd yet you incessantly stand on your head--\n  Do you think, at your age, it is right?'\n\n`In my youth,' Father William replied to his son,\n  `I feared it might injure the brain;\nBut, now that I'm perfectly sure I have none,\n  Why, I do it again and again.'\n\n`You are old,' said the youth, `as I mentioned before,\n  And have grown most uncommonly fat;\nYet you turned a back-somersault in at the door--\n  Pray, what is the reason of that?'\n\n`In my youth,' said the sage, as he shook his grey locks,\n  `I kept all my limbs very supple\nBy the use of this ointment--one shilling the box--\n  Allow me to sell you a couple?'\n\n`You are old,' said the youth, `and your jaws are too weak\n  For anything tougher than suet;\nYet you finished the goose, with the bones and the beak--\n  Pray how did you manage to do it?'\n\n`In my youth,' said his father, `I took to the law,\n  And argued each case with my wife;\nAnd the muscular strength, which it gave to my jaw,\n  Has lasted the rest of my life.'\n\n`You are old,' said the youth, `one would hardly suppose\n  That your eye was as steady as ever;\nYet you balanced an eel on the end of your nose--\n  What made you so awfully clever?'\n\n`I have answered three questions, and that is enough,'\n  Said his father; `don't give yourself airs!\nDo you think I can listen all day to such stuff?\n  Be off, or I'll kick you down stairs!'\n\n\n`That is not said right,' said the Caterpillar.\n\n`Not QUITE right, I'm afraid,' said Alice, timidly; `some of the\nwords have got altered.'\n\n`It is wrong from beginning to end,' said the Caterpillar\ndecidedly, and there was silence for some minutes.\n\nThe Caterpillar was the first to speak.\n\n`What size do you want to be?' it asked.\n\n`Oh, I'm not particular as to size,' Alice hastily replied;\n`only one doesn't like changing so often, you know.'\n\n`I DON'T know,' said the Caterpillar.\n\nAlice said nothing:  she had never been so much contradicted in\nher life before, and she felt that she was losing her temper.\n\n`Are you content now?' said the Caterpillar.\n\n`Well, I should like to be a LITTLE larger, sir, if you\nwouldn't mind,' said Alice:  `three inches is such a wretched\nheight to be.'\n\n`It is a very good height indeed!' said the Caterpillar\nangrily, rearing itself upright as it spoke (it was exactly three\ninches high).\n\n`But I'm not used to it!' pleaded poor Alice in a piteous tone.\nAnd she thought of herself, `I wish the creatures wouldn't be so\neasily offended!'\n\n`You'll get used to it in time,' said the Caterpillar; and it\nput the hookah into its mouth and began smoking again.\n\nThis time Alice waited patiently until it chose to speak again.\nIn a minute or two the Caterpillar took the hookah out of its\nmouth and yawned once or twice, and shook itself.  Then it got\ndown off the mushroom, and crawled away in the grass, merely\nremarking as it went, `One side will make you grow taller, and\nthe other side will make you grow shorter.'\n\n`One side of WHAT?  The other side of WHAT?' thought Alice to\nherself.\n\n`Of the mushroom,' said the Caterpillar, just as if she had\nasked it aloud; and in another moment it was out of sight.\n\nAlice remained looking thoughtfully at the mushroom for a\nminute, trying to make out which were the two sides of it; and as\nit was perfectly round, she found this a very difficult question.\nHowever, at last she stretched her arms round it as far as they\nwould go, and broke off a bit of the edge with each hand.\n\n`And now which is which?' she said to herself, and nibbled a\nlittle of the right-hand bit to try the effect:  the next moment\nshe felt a violent blow underneath her chin:  it had struck her\nfoot!\n\nShe was a good deal frightened by this very sudden change, but\nshe felt that there was no time to be lost, as she was shrinking\nrapidly; so she set to work at once to eat some of the other bit.\nHer chin was pressed so closely against her foot, that there was\nhardly room to open her mouth; but she did it at last, and\nmanaged to swallow a morsel of the lefthand bit.\n\n\n *       *       *       *       *       *       *\n\n     *       *       *       *       *       *\n\n *       *       *       *       *       *       *\n\n`Come, my head's free at last!' said Alice in a tone of\ndelight, which changed into alarm in another moment, when she\nfound that her shoulders were nowhere to be found:  all she could\nsee, when she looked down, was an immense length of neck, which\nseemed to rise like a stalk out of a sea of green leaves that lay\nfar below her.\n\n`What CAN all that green stuff be?' said Alice.  `And where\nHAVE my shoulders got to?  And oh, my poor hands, how is it I\ncan't see you?'  She was moving them about as she spoke, but no\nresult seemed to follow, except a little shaking among the\ndistant green leaves.\n\nAs there seemed to be no chance of getting her hands up to her\nhead, she tried to get her head down to them, and was delighted\nto find that her neck would bend about easily in any direction,\nlike a serpent.  She had just succeeded in curving it down into a\ngraceful zigzag, and was going to dive in among the leaves, which\nshe found to be nothing but the tops of the trees under which she\nhad been wandering, when a sharp hiss made her draw back in a\nhurry:  a large pigeon had flown into her face, and was beating\nher violently with its wings.\n\n`Serpent!' screamed the Pigeon.\n\n`I'm NOT a serpent!' said Alice indignantly.  `Let me alone!'\n\n`Serpent, I say again!' repeated the Pigeon, but in a more\nsubdued tone, and added with a kind of sob, `I've tried every\nway, and nothing seems to suit them!'\n\n`I haven't the least idea what you're talking about,' said\nAlice.\n\n`I've tried the roots of trees, and I've tried banks, and I've\ntried hedges,' the Pigeon went on, without attending to her; `but\nthose serpents!  There's no pleasing them!'\n\nAlice was more and more puzzled, but she thought there was no\nuse in saying anything more till the Pigeon had finished.\n\n`As if it wasn't trouble enough hatching the eggs,' said the\nPigeon; `but I must be on the look-out for serpents night and\nday!  Why, I haven't had a wink of sleep these three weeks!'\n\n`I'm very sorry you've been annoyed,' said Alice, who was\nbeginning to see its meaning.\n\n`And just as I'd taken the highest tree in the wood,' continued\nthe Pigeon, raising its voice to a shriek, `and just as I was\nthinking I should be free of them at last, they must needs come\nwriggling down from the sky!  Ugh, Serpent!'\n\n`But I'm NOT a serpent, I tell you!' said Alice.  `I'm a--I'm\na--'\n\n`Well!  WHAT are you?' said the Pigeon.  `I can see you're\ntrying to invent something!'\n\n`I--I'm a little girl,' said Alice, rather doubtfully, as she\nremembered the number of changes she had gone through that day.\n\n`A likely story indeed!' said the Pigeon in a tone of the\ndeepest contempt.  `I've seen a good many little girls in my\ntime, but never ONE with such a neck as that!  No, no!  You're a\nserpent; and there's no use denying it.  I suppose you'll be\ntelling me next that you never tasted an egg!'\n\n`I HAVE tasted eggs, certainly,' said Alice, who was a very\ntruthful child; `but little girls eat eggs quite as much as\nserpents do, you know.'\n\n`I don't believe it,' said the Pigeon; `but if they do, why\nthen they're a kind of serpent, that's all I can say.'\n\nThis was such a new idea to Alice, that she was quite silent\nfor a minute or two, which gave the Pigeon the opportunity of\nadding, `You're looking for eggs, I know THAT well enough; and\nwhat does it matter to me whether you're a little girl or a\nserpent?'\n\n`It matters a good deal to ME,' said Alice hastily; `but I'm\nnot looking for eggs, as it happens; and if I was, I shouldn't\nwant YOURS:  I don't like them raw.'\n\n`Well, be off, then!' said the Pigeon in a sulky tone, as it\nsettled down again into its nest.  Alice crouched down among the\ntrees as well as she could, for her neck kept getting entangled\namong the branches, and every now and then she had to stop and\nuntwist it.  After a while she remembered that she still held the\npieces of mushroom in her hands, and she set to work very\ncarefully, nibbling first at one and then at the other, and\ngrowing sometimes taller and sometimes shorter, until she had\nsucceeded in bringing herself down to her usual height.\n\nIt was so long since she had been anything near the right size,\nthat it felt quite strange at first; but she got used to it in a\nfew minutes, and began talking to herself, as usual.  `Come,\nthere's half my plan done now!  How puzzling all these changes\nare!  I'm never sure what I'm going to be, from one minute to\nanother!  However, I've got back to my right size:  the next\nthing is, to get into that beautiful garden--how IS that to be\ndone, I wonder?'  As she said this, she came suddenly upon an\nopen place, with a little house in it about four feet high.\n`Whoever lives there,' thought Alice, `it'll never do to come\nupon them THIS size:  why, I should frighten them out of their\nwits!'  So she began nibbling at the righthand bit again, and did\nnot venture to go near the house till she had brought herself\ndown to nine inches high.\n\n\n\n                       CHAPTER VI\n\n                     Pig and Pepper\n\n\nFor a minute or two she stood looking at the house, and\nwondering what to do next, when suddenly a footman in livery came\nrunning out of the wood--(she considered him to be a footman\nbecause he was in livery:  otherwise, judging by his face only,\nshe would have called him a fish)--and rapped loudly at the door\nwith his knuckles.  It was opened by another footman in livery,\nwith a round face, and large eyes like a frog; and both footmen,\nAlice noticed, had powdered hair that curled all over their\nheads.  She felt very curious to know what it was all about, and\ncrept a little way out of the wood to listen.\n\nThe Fish-Footman began by producing from under his arm a great\nletter, nearly as large as himself, and this he handed over to\nthe other, saying, in a solemn tone, `For the Duchess.  An\ninvitation from the Queen to play croquet.'  The Frog-Footman\nrepeated, in the same solemn tone, only changing the order of the\nwords a little, `From the Queen.  An invitation for the Duchess\nto play croquet.'\n\nThen they both bowed low, and their curls got entangled\ntogether.\n\nAlice laughed so much at this, that she had to run back into\nthe wood for fear of their hearing her; and when she next peeped\nout the Fish-Footman was gone, and the other was sitting on the\nground near the door, staring stupidly up into the sky.\n\nAlice went timidly up to the door, and knocked.\n\n`There's no sort of use in knocking,' said the Footman, `and\nthat for two reasons.  First, because I'm on the same side of the\ndoor as you are; secondly, because they're making such a noise\ninside, no one could possibly hear you.'  And certainly there was\na most extraordinary noise going on within--a constant howling\nand sneezing, and every now and then a great crash, as if a dish\nor kettle had been broken to pieces.\n\n`Please, then,' said Alice, `how am I to get in?'\n\n`There might be some sense in your knocking,' the Footman went\non without attending to her, `if we had the door between us.  For\ninstance, if you were INSIDE, you might knock, and I could let\nyou out, you know.'  He was looking up into the sky all the time\nhe was speaking, and this Alice thought decidedly uncivil.  `But\nperhaps he can't help it,' she said to herself; `his eyes are so\nVERY nearly at the top of his head.  But at any rate he might\nanswer questions.--How am I to get in?' she repeated, aloud.\n\n`I shall sit here,' the Footman remarked, `till tomorrow--'\n\nAt this moment the door of the house opened, and a large plate\ncame skimming out, straight at the Footman's head:  it just\ngrazed his nose, and broke to pieces against one of the trees\nbehind him.\n\n`--or next day, maybe,' the Footman continued in the same tone,\nexactly as if nothing had happened.\n\n`How am I to get in?' asked Alice again, in a louder tone.\n\n`ARE you to get in at all?' said the Footman.  `That's the\nfirst question, you know.'\n\nIt was, no doubt:  only Alice did not like to be told so.\n`It's really dreadful,' she muttered to herself, `the way all the\ncreatures argue.  It's enough to drive one crazy!'\n\nThe Footman seemed to think this a good opportunity for\nrepeating his remark, with variations.  `I shall sit here,' he\nsaid, `on and off, for days and days.'\n\n`But what am I to do?' said Alice.\n\n`Anything you like,' said the Footman, and began whistling.\n\n`Oh, there's no use in talking to him,' said Alice desperately:\n`he's perfectly idiotic!'  And she opened the door and went in.\n\nThe door led right into a large kitchen, which was full of\nsmoke from one end to the other:  the Duchess was sitting on a\nthree-legged stool in the middle, nursing a baby; the cook was\nleaning over the fire, stirring a large cauldron which seemed to\nbe full of soup.\n\n`There's certainly too much pepper in that soup!' Alice said to\nherself, as well as she could for sneezing.\n\nThere was certainly too much of it in the air.  Even the\nDuchess sneezed occasionally; and as for the baby, it was\nsneezing and howling alternately without a moment's pause.  The\nonly things in the kitchen that did not sneeze, were the cook,\nand a large cat which was sitting on the hearth and grinning from\near to ear.\n\n`Please would you tell me,' said Alice, a little timidly, for\nshe was not quite sure whether it was good manners for her to\nspeak first, `why your cat grins like that?'\n\n`It's a Cheshire cat,' said the Duchess, `and that's why.  Pig!'\n\nShe said the last word with such sudden violence that Alice\nquite jumped; but she saw in another moment that it was addressed\nto the baby, and not to her, so she took courage, and went on\nagain:--\n\n`I didn't know that Cheshire cats always grinned; in fact, I\ndidn't know that cats COULD grin.'\n\n`They all can,' said the Duchess; `and most of 'em do.'\n\n`I don't know of any that do,' Alice said very politely,\nfeeling quite pleased to have got into a conversation.\n\n`You don't know much,' said the Duchess; `and that's a fact.'\n\nAlice did not at all like the tone of this remark, and thought\nit would be as well to introduce some other subject of\nconversation.  While she was trying to fix on one, the cook took\nthe cauldron of soup off the fire, and at once set to work\nthrowing everything within her reach at the Duchess and the baby\n--the fire-irons came first; then followed a shower of saucepans,\nplates, and dishes.  The Duchess took no notice of them even when\nthey hit her; and the baby was howling so much already, that it\nwas quite impossible to say whether the blows hurt it or not.\n\n`Oh, PLEASE mind what you're doing!' cried Alice, jumping up\nand down in an agony of terror.  `Oh, there goes his PRECIOUS\nnose'; as an unusually large saucepan flew close by it, and very\nnearly carried it off.\n\n`If everybody minded their own business,' the Duchess said in a\nhoarse growl, `the world would go round a deal faster than it\ndoes.'\n\n`Which would NOT be an advantage,' said Alice, who felt very\nglad to get an opportunity of showing off a little of her\nknowledge.  `Just think of what work it would make with the day\nand night!  You see the earth takes twenty-four hours to turn\nround on its axis--'\n\n`Talking of axes,' said the Duchess, `chop off her head!'\n\nAlice glanced rather anxiously at the cook, to see if she meant\nto take the hint; but the cook was busily stirring the soup, and\nseemed not to be listening, so she went on again:  `Twenty-four\nhours, I THINK; or is it twelve?  I--'\n\n`Oh, don't bother ME,' said the Duchess; `I never could abide\nfigures!'  And with that she began nursing her child again,\nsinging a sort of lullaby to it as she did so, and giving it a\nviolent shake at the end of every line:\n\n    `Speak roughly to your little boy,\n      And beat him when he sneezes:\n    He only does it to annoy,\n      Because he knows it teases.'\n\n                CHORUS.\n\n(In which the cook and the baby joined):--\n\n            `Wow! wow! wow!'\n\nWhile the Duchess sang the second verse of the song, she kept\ntossing the baby violently up and down, and the poor little thing\nhowled so, that Alice could hardly hear the words:--\n\n    `I speak severely to my boy,\n      I beat him when he sneezes;\n    For he can thoroughly enjoy\n      The pepper when he pleases!'\n\n                CHORUS.\n\n            `Wow! wow! wow!'\n\n`Here! you may nurse it a bit, if you like!' the Duchess said\nto Alice, flinging the baby at her as she spoke.  `I must go and\nget ready to play croquet with the Queen,' and she hurried out of\nthe room.  The cook threw a frying-pan after her as she went out,\nbut it just missed her.\n\nAlice caught the baby with some difficulty, as it was a queer-\nshaped little creature, and held out its arms and legs in all\ndirections, `just like a star-fish,' thought Alice.  The poor\nlittle thing was snorting like a steam-engine when she caught it,\nand kept doubling itself up and straightening itself out again,\nso that altogether, for the first minute or two, it was as much\nas she could do to hold it.\n\nAs soon as she had made out the proper way of nursing it,\n(which was to twist it up into a sort of knot, and then keep\ntight hold of its right ear and left foot, so as to prevent its\nundoing itself,) she carried it out into the open air.  `IF I\ndon't take this child away with me,' thought Alice, `they're sure\nto kill it in a day or two:  wouldn't it be murder to leave it\nbehind?'  She said the last words out loud, and the little thing\ngrunted in reply (it had left off sneezing by this time).  `Don't\ngrunt,' said Alice; `that's not at all a proper way of expressing\nyourself.'\n\nThe baby grunted again, and Alice looked very anxiously into\nits face to see what was the matter with it.  There could be no\ndoubt that it had a VERY turn-up nose, much more like a snout\nthan a real nose; also its eyes were getting extremely small for\na baby:  altogether Alice did not like the look of the thing at\nall.  `But perhaps it was only sobbing,' she thought, and looked\ninto its eyes again, to see if there were any tears.\n\nNo, there were no tears.  `If you're going to turn into a pig,\nmy dear,' said Alice, seriously, `I'll have nothing more to do\nwith you.  Mind now!'  The poor little thing sobbed again (or\ngrunted, it was impossible to say which), and they went on for\nsome while in silence.\n\nAlice was just beginning to think to herself, `Now, what am I\nto do with this creature when I get it home?' when it grunted\nagain, so violently, that she looked down into its face in some\nalarm.  This time there could be NO mistake about it:  it was\nneither more nor less than a pig, and she felt that it would be\nquite absurd for her to carry it further.\n\nSo she set the little creature down, and felt quite relieved to\nsee it trot away quietly into the wood.  `If it had grown up,'\nshe said to herself, `it would have made a dreadfully ugly child:\nbut it makes rather a handsome pig, I think.'  And she began\nthinking over other children she knew, who might do very well as\npigs, and was just saying to herself, `if one only knew the right\nway to change them--' when she was a little startled by seeing\nthe Cheshire Cat sitting on a bough of a tree a few yards off.\n\nThe Cat only grinned when it saw Alice.  It looked good-\nnatured, she thought:  still it had VERY long claws and a great\nmany teeth, so she felt that it ought to be treated with respect.\n\n`Cheshire Puss,' she began, rather timidly, as she did not at\nall know whether it would like the name:  however, it only\ngrinned a little wider.  `Come, it's pleased so far,' thought\nAlice, and she went on.  `Would you tell me, please, which way I\nought to go from here?'\n\n`That depends a good deal on where you want to get to,' said\nthe Cat.\n\n`I don't much care where--' said Alice.\n\n`Then it doesn't matter which way you go,' said the Cat.\n\n`--so long as I get SOMEWHERE,' Alice added as an explanation.\n\n`Oh, you're sure to do that,' said the Cat, `if you only walk\nlong enough.'\n\nAlice felt that this could not be denied, so she tried another\nquestion.  `What sort of people live about here?'\n\n`In THAT direction,' the Cat said, waving its right paw round,\n`lives a Hatter:  and in THAT direction,' waving the other paw,\n`lives a March Hare.  Visit either you like:  they're both mad.'\n\n`But I don't want to go among mad people,' Alice remarked.\n\n`Oh, you can't help that,' said the Cat:  `we're all mad here.\nI'm mad.  You're mad.'\n\n`How do you know I'm mad?' said Alice.\n\n`You must be,' said the Cat, `or you wouldn't have come here.'\n\nAlice didn't think that proved it at all; however, she went on\n`And how do you know that you're mad?'\n\n`To begin with,' said the Cat, `a dog's not mad.  You grant\nthat?'\n\n`I suppose so,' said Alice.\n\n`Well, then,' the Cat went on, `you see, a dog growls when it's\nangry, and wags its tail when it's pleased.  Now I growl when I'm\npleased, and wag my tail when I'm angry.  Therefore I'm mad.'\n\n`I call it purring, not growling,' said Alice.\n\n`Call it what you like,' said the Cat.  `Do you play croquet\nwith the Queen to-day?'\n\n`I should like it very much,' said Alice, `but I haven't been\ninvited yet.'\n\n`You'll see me there,' said the Cat, and vanished.\n\nAlice was not much surprised at this, she was getting so used\nto queer things happening.  While she was looking at the place\nwhere it had been, it suddenly appeared again.\n\n`By-the-bye, what became of the baby?' said the Cat.  `I'd\nnearly forgotten to ask.'\n\n`It turned into a pig,' Alice quietly said, just as if it had\ncome back in a natural way.\n\n`I thought it would,' said the Cat, and vanished again.\n\nAlice waited a little, half expecting to see it again, but it\ndid not appear, and after a minute or two she walked on in the\ndirection in which the March Hare was said to live.  `I've seen\nhatters before,' she said to herself; `the March Hare will be\nmuch the most interesting, and perhaps as this is May it won't be\nraving mad--at least not so mad as it was in March.'  As she said\nthis, she looked up, and there was the Cat again, sitting on a\nbranch of a tree.\n\n`Did you say pig, or fig?' said the Cat.\n\n`I said pig,' replied Alice; `and I wish you wouldn't keep\nappearing and vanishing so suddenly:  you make one quite giddy.'\n\n`All right,' said the Cat; and this time it vanished quite slowly,\nbeginning with the end of the tail, and ending with the grin,\nwhich remained some time after the rest of it had gone.\n\n`Well!  I've often seen a cat without a grin,' thought Alice;\n`but a grin without a cat!  It's the most curious thing I ever\nsaw in my life!'\n\nShe had not gone much farther before she came in sight of the\nhouse of the March Hare:  she thought it must be the right house,\nbecause the chimneys were shaped like ears and the roof was\nthatched with fur.  It was so large a house, that she did not\nlike to go nearer till she had nibbled some more of the lefthand\nbit of mushroom, and raised herself to about two feet high:  even\nthen she walked up towards it rather timidly, saying to herself\n`Suppose it should be raving mad after all!  I almost wish I'd\ngone to see the Hatter instead!'\n\n\n\n                       CHAPTER VII\n\n                     A Mad Tea-Party\n\n\nThere was a table set out under a tree in front of the house,\nand the March Hare and the Hatter were having tea at it:  a\nDormouse was sitting between them, fast asleep, and the other two\nwere using it as a cushion, resting their elbows on it, and talking\nover its head.  `Very uncomfortable for the Dormouse,' thought Alice;\n`only, as it's asleep, I suppose it doesn't mind.'\n\nThe table was a large one, but the three were all crowded\ntogether at one corner of it:  `No room!  No room!' they cried\nout when they saw Alice coming.  `There's PLENTY of room!' said\nAlice indignantly, and she sat down in a large arm-chair at one\nend of the table.\n\n`Have some wine,' the March Hare said in an encouraging tone.\n\nAlice looked all round the table, but there was nothing on it\nbut tea.  `I don't see any wine,' she remarked.\n\n`There isn't any,' said the March Hare.\n\n`Then it wasn't very civil of you to offer it,' said Alice\nangrily.\n\n`It wasn't very civil of you to sit down without being\ninvited,' said the March Hare.\n\n`I didn't know it was YOUR table,' said Alice; `it's laid for a\ngreat many more than three.'\n\n`Your hair wants cutting,' said the Hatter.  He had been\nlooking at Alice for some time with great curiosity, and this was\nhis first speech.\n\n`You should learn not to make personal remarks,' Alice said\nwith some severity; `it's very rude.'\n\nThe Hatter opened his eyes very wide on hearing this; but all\nhe SAID was, `Why is a raven like a writing-desk?'\n\n`Come, we shall have some fun now!' thought Alice.  `I'm glad\nthey've begun asking riddles.--I believe I can guess that,' she\nadded aloud.\n\n`Do you mean that you think you can find out the answer to it?'\nsaid the March Hare.\n\n`Exactly so,' said Alice.\n\n`Then you should say what you mean,' the March Hare went on.\n\n`I do,' Alice hastily replied; `at least--at least I mean what\nI say--that's the same thing, you know.'\n\n`Not the same thing a bit!' said the Hatter.  `You might just\nas well say that \"I see what I eat\" is the same thing as \"I eat\nwhat I see\"!'\n\n`You might just as well say,' added the March Hare, `that \"I\nlike what I get\" is the same thing as \"I get what I like\"!'\n\n`You might just as well say,' added the Dormouse, who seemed to\nbe talking in his sleep, `that \"I breathe when I sleep\" is the\nsame thing as \"I sleep when I breathe\"!'\n\n`It IS the same thing with you,' said the Hatter, and here the\nconversation dropped, and the party sat silent for a minute,\nwhile Alice thought over all she could remember about ravens and\nwriting-desks, which wasn't much.\n\nThe Hatter was the first to break the silence.  `What day of\nthe month is it?' he said, turning to Alice:  he had taken his\nwatch out of his pocket, and was looking at it uneasily, shaking\nit every now and then, and holding it to his ear.\n\nAlice considered a little, and then said `The fourth.'\n\n`Two days wrong!' sighed the Hatter.  `I told you butter\nwouldn't suit the works!' he added looking angrily at the March\nHare.\n\n`It was the BEST butter,' the March Hare meekly replied.\n\n`Yes, but some crumbs must have got in as well,' the Hatter\ngrumbled:  `you shouldn't have put it in with the bread-knife.'\n\nThe March Hare took the watch and looked at it gloomily:  then\nhe dipped it into his cup of tea, and looked at it again:  but he\ncould think of nothing better to say than his first remark, `It\nwas the BEST butter, you know.'\n\nAlice had been looking over his shoulder with some curiosity.\n`What a funny watch!' she remarked.  `It tells the day of the\nmonth, and doesn't tell what o'clock it is!'\n\n`Why should it?' muttered the Hatter.  `Does YOUR watch tell\nyou what year it is?'\n\n`Of course not,' Alice replied very readily:  `but that's\nbecause it stays the same year for such a long time together.'\n\n`Which is just the case with MINE,' said the Hatter.\n\nAlice felt dreadfully puzzled.  The Hatter's remark seemed to\nhave no sort of meaning in it, and yet it was certainly English.\n`I don't quite understand you,' she said, as politely as she\ncould.\n\n`The Dormouse is asleep again,' said the Hatter, and he poured\na little hot tea upon its nose.\n\nThe Dormouse shook its head impatiently, and said, without\nopening its eyes, `Of course, of course; just what I was going to\nremark myself.'\n\n`Have you guessed the riddle yet?' the Hatter said, turning to\nAlice again.\n\n`No, I give it up,' Alice replied:  `what's the answer?'\n\n`I haven't the slightest idea,' said the Hatter.\n\n`Nor I,' said the March Hare.\n\nAlice sighed wearily.  `I think you might do something better\nwith the time,' she said, `than waste it in asking riddles that\nhave no answers.'\n\n`If you knew Time as well as I do,' said the Hatter, `you\nwouldn't talk about wasting IT.  It's HIM.'\n\n`I don't know what you mean,' said Alice.\n\n`Of course you don't!' the Hatter said, tossing his head\ncontemptuously.  `I dare say you never even spoke to Time!'\n\n`Perhaps not,' Alice cautiously replied:  `but I know I have to\nbeat time when I learn music.'\n\n`Ah! that accounts for it,' said the Hatter.  `He won't stand\nbeating.  Now, if you only kept on good terms with him, he'd do\nalmost anything you liked with the clock.  For instance, suppose\nit were nine o'clock in the morning, just time to begin lessons:\nyou'd only have to whisper a hint to Time, and round goes the\nclock in a twinkling!  Half-past one, time for dinner!'\n\n(`I only wish it was,' the March Hare said to itself in a\nwhisper.)\n\n`That would be grand, certainly,' said Alice thoughtfully:\n`but then--I shouldn't be hungry for it, you know.'\n\n`Not at first, perhaps,' said the Hatter:  `but you could keep\nit to half-past one as long as you liked.'\n\n`Is that the way YOU manage?' Alice asked.\n\nThe Hatter shook his head mournfully.  `Not I!' he replied.\n`We quarrelled last March--just before HE went mad, you know--'\n(pointing with his tea spoon at the March Hare,) `--it was at the\ngreat concert given by the Queen of Hearts, and I had to sing\n\n        \"Twinkle, twinkle, little bat!\n        How I wonder what you're at!\"\n\nYou know the song, perhaps?'\n\n`I've heard something like it,' said Alice.\n\n`It goes on, you know,' the Hatter continued, `in this way:--\n\n        \"Up above the world you fly,\n        Like a tea-tray in the sky.\n                Twinkle, twinkle--\"'\n\nHere the Dormouse shook itself, and began singing in its sleep\n`Twinkle, twinkle, twinkle, twinkle--' and went on so long that\nthey had to pinch it to make it stop.\n\n`Well, I'd hardly finished the first verse,' said the Hatter,\n`when the Queen jumped up and bawled out, \"He's murdering the\ntime!  Off with his head!\"'\n\n`How dreadfully savage!' exclaimed Alice.\n\n`And ever since that,' the Hatter went on in a mournful tone,\n`he won't do a thing I ask!  It's always six o'clock now.'\n\nA bright idea came into Alice's head.  `Is that the reason so\nmany tea-things are put out here?' she asked.\n\n`Yes, that's it,' said the Hatter with a sigh:  `it's always\ntea-time, and we've no time to wash the things between whiles.'\n\n`Then you keep moving round, I suppose?' said Alice.\n\n`Exactly so,' said the Hatter:  `as the things get used up.'\n\n`But what happens when you come to the beginning again?' Alice\nventured to ask.\n\n`Suppose we change the subject,' the March Hare interrupted,\nyawning.  `I'm getting tired of this.  I vote the young lady\ntells us a story.'\n\n`I'm afraid I don't know one,' said Alice, rather alarmed at\nthe proposal.\n\n`Then the Dormouse shall!' they both cried.  `Wake up,\nDormouse!'  And they pinched it on both sides at once.\n\nThe Dormouse slowly opened his eyes.  `I wasn't asleep,' he\nsaid in a hoarse, feeble voice:  `I heard every word you fellows\nwere saying.'\n\n`Tell us a story!' said the March Hare.\n\n`Yes, please do!' pleaded Alice.\n\n`And be quick about it,' added the Hatter, `or you'll be asleep\nagain before it's done.'\n\n`Once upon a time there were three little sisters,' the\nDormouse began in a great hurry; `and their names were Elsie,\nLacie, and Tillie; and they lived at the bottom of a well--'\n\n`What did they live on?' said Alice, who always took a great\ninterest in questions of eating and drinking.\n\n`They lived on treacle,' said the Dormouse, after thinking a\nminute or two.\n\n`They couldn't have done that, you know,' Alice gently\nremarked; `they'd have been ill.'\n\n`So they were,' said the Dormouse; `VERY ill.'\n\nAlice tried to fancy to herself what such an extraordinary ways\nof living would be like, but it puzzled her too much, so she went\non:  `But why did they live at the bottom of a well?'\n\n`Take some more tea,' the March Hare said to Alice, very\nearnestly.\n\n`I've had nothing yet,' Alice replied in an offended tone, `so\nI can't take more.'\n\n`You mean you can't take LESS,' said the Hatter:  `it's very\neasy to take MORE than nothing.'\n\n`Nobody asked YOUR opinion,' said Alice.\n\n`Who's making personal remarks now?' the Hatter asked\ntriumphantly.\n\nAlice did not quite know what to say to this:  so she helped\nherself to some tea and bread-and-butter, and then turned to the\nDormouse, and repeated her question.  `Why did they live at the\nbottom of a well?'\n\nThe Dormouse again took a minute or two to think about it, and\nthen said, `It was a treacle-well.'\n\n`There's no such thing!'  Alice was beginning very angrily, but\nthe Hatter and the March Hare went `Sh! sh!' and the Dormouse\nsulkily remarked, `If you can't be civil, you'd better finish the\nstory for yourself.'\n\n`No, please go on!' Alice said very humbly; `I won't interrupt\nagain.  I dare say there may be ONE.'\n\n`One, indeed!' said the Dormouse indignantly.  However, he\nconsented to go on.  `And so these three little sisters--they\nwere learning to draw, you know--'\n\n`What did they draw?' said Alice, quite forgetting her promise.\n\n`Treacle,' said the Dormouse, without considering at all this\ntime.\n\n`I want a clean cup,' interrupted the Hatter:  `let's all move\none place on.'\n\nHe moved on as he spoke, and the Dormouse followed him:  the\nMarch Hare moved into the Dormouse's place, and Alice rather\nunwillingly took the place of the March Hare.  The Hatter was the\nonly one who got any advantage from the change:  and Alice was a\ngood deal worse off than before, as the March Hare had just upset\nthe milk-jug into his plate.\n\nAlice did not wish to offend the Dormouse again, so she began\nvery cautiously:  `But I don't understand.  Where did they draw\nthe treacle from?'\n\n`You can draw water out of a water-well,' said the Hatter; `so\nI should think you could draw treacle out of a treacle-well--eh,\nstupid?'\n\n`But they were IN the well,' Alice said to the Dormouse, not\nchoosing to notice this last remark.\n\n`Of course they were', said the Dormouse; `--well in.'\n\nThis answer so confused poor Alice, that she let the Dormouse\ngo on for some time without interrupting it.\n\n`They were learning to draw,' the Dormouse went on, yawning and\nrubbing its eyes, for it was getting very sleepy; `and they drew\nall manner of things--everything that begins with an M--'\n\n`Why with an M?' said Alice.\n\n`Why not?' said the March Hare.\n\nAlice was silent.\n\nThe Dormouse had closed its eyes by this time, and was going\noff into a doze; but, on being pinched by the Hatter, it woke up\nagain with a little shriek, and went on:  `--that begins with an\nM, such as mouse-traps, and the moon, and memory, and muchness--\nyou know you say things are \"much of a muchness\"--did you ever\nsee such a thing as a drawing of a muchness?'\n\n`Really, now you ask me,' said Alice, very much confused, `I\ndon't think--'\n\n`Then you shouldn't talk,' said the Hatter.\n\nThis piece of rudeness was more than Alice could bear:  she got\nup in great disgust, and walked off; the Dormouse fell asleep\ninstantly, and neither of the others took the least notice of her\ngoing, though she looked back once or twice, half hoping that\nthey would call after her:  the last time she saw them, they were\ntrying to put the Dormouse into the teapot.\n\n`At any rate I'll never go THERE again!' said Alice as she\npicked her way through the wood.  `It's the stupidest tea-party I\never was at in all my life!'\n\nJust as she said this, she noticed that one of the trees had a\ndoor leading right into it.  `That's very curious!' she thought.\n`But everything's curious today.  I think I may as well go in at once.'\nAnd in she went.\n\nOnce more she found herself in the long hall, and close to the\nlittle glass table.  `Now, I'll manage better this time,'\nshe said to herself, and began by taking the little golden key,\nand unlocking the door that led into the garden.  Then she went\nto work nibbling at the mushroom (she had kept a piece of it\nin her pocket) till she was about a foot high:  then she walked down\nthe little passage:  and THEN--she found herself at last in the\nbeautiful garden, among the bright flower-beds and the cool fountains.\n\n\n\n                      CHAPTER VIII\n\n               The Queen's Croquet-Ground\n\n\nA large rose-tree stood near the entrance of the garden:  the\nroses growing on it were white, but there were three gardeners at\nit, busily painting them red.  Alice thought this a very curious\nthing, and she went nearer to watch them, and just as she came up\nto them she heard one of them say, `Look out now, Five!  Don't go\nsplashing paint over me like that!'\n\n`I couldn't help it,' said Five, in a sulky tone; `Seven jogged\nmy elbow.'\n\nOn which Seven looked up and said, `That's right, Five!  Always\nlay the blame on others!'\n\n`YOU'D better not talk!' said Five.  `I heard the Queen say only\nyesterday you deserved to be beheaded!'\n\n`What for?' said the one who had spoken first.\n\n`That's none of YOUR business, Two!' said Seven.\n\n`Yes, it IS his business!' said Five, `and I'll tell him--it\nwas for bringing the cook tulip-roots instead of onions.'\n\nSeven flung down his brush, and had just begun `Well, of all\nthe unjust things--' when his eye chanced to fall upon Alice, as\nshe stood watching them, and he checked himself suddenly:  the\nothers looked round also, and all of them bowed low.\n\n`Would you tell me,' said Alice, a little timidly, `why you are\npainting those roses?'\n\nFive and Seven said nothing, but looked at Two.  Two began in a\nlow voice, `Why the fact is, you see, Miss, this here ought to\nhave been a RED rose-tree, and we put a white one in by mistake;\nand if the Queen was to find it out, we should all have our heads\ncut off, you know.  So you see, Miss, we're doing our best, afore\nshe comes, to--'  At this moment Five, who had been anxiously\nlooking across the garden, called out `The Queen!  The Queen!'\nand the three gardeners instantly threw themselves flat upon\ntheir faces.  There was a sound of many footsteps, and Alice\nlooked round, eager to see the Queen.\n\nFirst came ten soldiers carrying clubs; these were all shaped\nlike the three gardeners, oblong and flat, with their hands and\nfeet at the corners:  next the ten courtiers; these were\nornamented all over with diamonds, and walked two and two, as the\nsoldiers did.  After these came the royal children; there were\nten of them, and the little dears came jumping merrily along hand\nin hand, in couples:  they were all ornamented with hearts.  Next\ncame the guests, mostly Kings and Queens, and among them Alice\nrecognised the White Rabbit:  it was talking in a hurried nervous\nmanner, smiling at everything that was said, and went by without\nnoticing her.  Then followed the Knave of Hearts, carrying the\nKing's crown on a crimson velvet cushion; and, last of all this\ngrand procession, came THE KING AND QUEEN OF HEARTS.\n\nAlice was rather doubtful whether she ought not to lie down on\nher face like the three gardeners, but she could not remember\never having heard of such a rule at processions; `and besides,\nwhat would be the use of a procession,' thought she, `if people\nhad all to lie down upon their faces, so that they couldn't see it?'\nSo she stood still where she was, and waited.\n\nWhen the procession came opposite to Alice, they all stopped\nand looked at her, and the Queen said severely `Who is this?'\nShe said it to the Knave of Hearts, who only bowed and smiled in reply.\n\n`Idiot!' said the Queen, tossing her head impatiently; and,\nturning to Alice, she went on, `What's your name, child?'\n\n`My name is Alice, so please your Majesty,' said Alice very\npolitely; but she added, to herself, `Why, they're only a pack of\ncards, after all.  I needn't be afraid of them!'\n\n`And who are THESE?' said the Queen, pointing to the three\ngardeners who were lying round the rosetree; for, you see, as\nthey were lying on their faces, and the pattern on their backs\nwas the same as the rest of the pack, she could not tell whether\nthey were gardeners, or soldiers, or courtiers, or three of her\nown children.\n\n`How should I know?' said Alice, surprised at her own courage.\n`It's no business of MINE.'\n\nThe Queen turned crimson with fury, and, after glaring at her\nfor a moment like a wild beast, screamed `Off with her head!\nOff--'\n\n`Nonsense!' said Alice, very loudly and decidedly, and the\nQueen was silent.\n\nThe King laid his hand upon her arm, and timidly said\n`Consider, my dear:  she is only a child!'\n\nThe Queen turned angrily away from him, and said to the Knave\n`Turn them over!'\n\nThe Knave did so, very carefully, with one foot.\n\n`Get up!' said the Queen, in a shrill, loud voice, and the\nthree gardeners instantly jumped up, and began bowing to the\nKing, the Queen, the royal children, and everybody else.\n\n`Leave off that!' screamed the Queen.  `You make me giddy.'\nAnd then, turning to the rose-tree, she went on, `What HAVE you\nbeen doing here?'\n\n`May it please your Majesty,' said Two, in a very humble tone,\ngoing down on one knee as he spoke, `we were trying--'\n\n`I see!' said the Queen, who had meanwhile been examining the\nroses.  `Off with their heads!' and the procession moved on,\nthree of the soldiers remaining behind to execute the unfortunate\ngardeners, who ran to Alice for protection.\n\n`You shan't be beheaded!' said Alice, and she put them into a\nlarge flower-pot that stood near.  The three soldiers wandered\nabout for a minute or two, looking for them, and then quietly\nmarched off after the others.\n\n`Are their heads off?' shouted the Queen.\n\n`Their heads are gone, if it please your Majesty!' the soldiers\nshouted in reply.\n\n`That's right!' shouted the Queen.  `Can you play croquet?'\n\nThe soldiers were silent, and looked at Alice, as the question\nwas evidently meant for her.\n\n`Yes!' shouted Alice.\n\n`Come on, then!' roared the Queen, and Alice joined the\nprocession, wondering very much what would happen next.\n\n`It's--it's a very fine day!' said a timid voice at her side.\nShe was walking by the White Rabbit, who was peeping anxiously\ninto her face.\n\n`Very,' said Alice:  `--where's the Duchess?'\n\n`Hush!  Hush!' said the Rabbit in a low, hurried tone.  He\nlooked anxiously over his shoulder as he spoke, and then raised\nhimself upon tiptoe, put his mouth close to her ear, and\nwhispered `She's under sentence of execution.'\n\n`What for?' said Alice.\n\n`Did you say \"What a pity!\"?' the Rabbit asked.\n\n`No, I didn't,' said Alice:  `I don't think it's at all a pity.\nI said \"What for?\"'\n\n`She boxed the Queen's ears--' the Rabbit began.  Alice gave a\nlittle scream of laughter.  `Oh, hush!' the Rabbit whispered in a\nfrightened tone.  `The Queen will hear you!  You see, she came\nrather late, and the Queen said--'\n\n`Get to your places!' shouted the Queen in a voice of thunder,\nand people began running about in all directions, tumbling up\nagainst each other; however, they got settled down in a minute or\ntwo, and the game began.  Alice thought she had never seen such a\ncurious croquet-ground in her life; it was all ridges and\nfurrows; the balls were live hedgehogs, the mallets live\nflamingoes, and the soldiers had to double themselves up and to\nstand on their hands and feet, to make the arches.\n\nThe chief difficulty Alice found at first was in managing her\nflamingo:  she succeeded in getting its body tucked away,\ncomfortably enough, under her arm, with its legs hanging down,\nbut generally, just as she had got its neck nicely straightened\nout, and was going to give the hedgehog a blow with its head, it\nWOULD twist itself round and look up in her face, with such a\npuzzled expression that she could not help bursting out laughing:\nand when she had got its head down, and was going to begin again,\nit was very provoking to find that the hedgehog had unrolled\nitself, and was in the act of crawling away:  besides all this,\nthere was generally a ridge or furrow in the way wherever she\nwanted to send the hedgehog to, and, as the doubled-up soldiers\nwere always getting up and walking off to other parts of the\nground, Alice soon came to the conclusion that it was a very\ndifficult game indeed.\n\nThe players all played at once without waiting for turns,\nquarrelling all the while, and fighting for the hedgehogs; and in\na very short time the Queen was in a furious passion, and went\nstamping about, and shouting `Off with his head!' or `Off with\nher head!' about once in a minute.\n\nAlice began to feel very uneasy:  to be sure, she had not as\nyet had any dispute with the Queen, but she knew that it might\nhappen any minute, `and then,' thought she, `what would become of\nme?  They're dreadfully fond of beheading people here; the great\nwonder is, that there's any one left alive!'\n\nShe was looking about for some way of escape, and wondering\nwhether she could get away without being seen, when she noticed a\ncurious appearance in the air:  it puzzled her very much at\nfirst, but, after watching it a minute or two, she made it out to\nbe a grin, and she said to herself `It's the Cheshire Cat:  now I\nshall have somebody to talk to.'\n\n`How are you getting on?' said the Cat, as soon as there was\nmouth enough for it to speak with.\n\nAlice waited till the eyes appeared, and then nodded.  `It's no\nuse speaking to it,' she thought, `till its ears have come, or at\nleast one of them.'  In another minute the whole head appeared,\nand then Alice put down her flamingo, and began an account of the\ngame, feeling very glad she had someone to listen to her.  The\nCat seemed to think that there was enough of it now in sight, and\nno more of it appeared.\n\n`I don't think they play at all fairly,' Alice began, in rather\na complaining tone, `and they all quarrel so dreadfully one can't\nhear oneself speak--and they don't seem to have any rules in\nparticular; at least, if there are, nobody attends to them--and\nyou've no idea how confusing it is all the things being alive;\nfor instance, there's the arch I've got to go through next\nwalking about at the other end of the ground--and I should have\ncroqueted the Queen's hedgehog just now, only it ran away when it\nsaw mine coming!'\n\n`How do you like the Queen?' said the Cat in a low voice.\n\n`Not at all,' said Alice:  `she's so extremely--'  Just then\nshe noticed that the Queen was close behind her, listening:  so\nshe went on, `--likely to win, that it's hardly worth while\nfinishing the game.'\n\nThe Queen smiled and passed on.\n\n`Who ARE you talking to?' said the King, going up to Alice, and\nlooking at the Cat's head with great curiosity.\n\n`It's a friend of mine--a Cheshire Cat,' said Alice:  `allow me\nto introduce it.'\n\n`I don't like the look of it at all,' said the King:\n`however, it may kiss my hand if it likes.'\n\n`I'd rather not,' the Cat remarked.\n\n`Don't be impertinent,' said the King, `and don't look at me\nlike that!'  He got behind Alice as he spoke.\n\n`A cat may look at a king,' said Alice.  `I've read that in\nsome book, but I don't remember where.'\n\n`Well, it must be removed,' said the King very decidedly, and\nhe called the Queen, who was passing at the moment, `My dear!  I\nwish you would have this cat removed!'\n\nThe Queen had only one way of settling all difficulties, great\nor small.  `Off with his head!' she said, without even looking\nround.\n\n`I'll fetch the executioner myself,' said the King eagerly, and\nhe hurried off.\n\nAlice thought she might as well go back, and see how the game\nwas going on, as she heard the Queen's voice in the distance,\nscreaming with passion.  She had already heard her sentence three\nof the players to be executed for having missed their turns, and\nshe did not like the look of things at all, as the game was in\nsuch confusion that she never knew whether it was her turn or\nnot.  So she went in search of her hedgehog.\n\nThe hedgehog was engaged in a fight with another hedgehog,\nwhich seemed to Alice an excellent opportunity for croqueting one\nof them with the other:  the only difficulty was, that her\nflamingo was gone across to the other side of the garden, where\nAlice could see it trying in a helpless sort of way to fly up\ninto a tree.\n\nBy the time she had caught the flamingo and brought it back,\nthe fight was over, and both the hedgehogs were out of sight:\n`but it doesn't matter much,' thought Alice, `as all the arches\nare gone from this side of the ground.'  So she tucked it away\nunder her arm, that it might not escape again, and went back for\na little more conversation with her friend.\n\nWhen she got back to the Cheshire Cat, she was surprised to\nfind quite a large crowd collected round it:  there was a dispute\ngoing on between the executioner, the King, and the Queen, who\nwere all talking at once, while all the rest were quite silent,\nand looked very uncomfortable.\n\nThe moment Alice appeared, she was appealed to by all three to\nsettle the question, and they repeated their arguments to her,\nthough, as they all spoke at once, she found it very hard indeed\nto make out exactly what they said.\n\nThe executioner's argument was, that you couldn't cut off a\nhead unless there was a body to cut it off from:  that he had\nnever had to do such a thing before, and he wasn't going to begin\nat HIS time of life.\n\nThe King's argument was, that anything that had a head could be\nbeheaded, and that you weren't to talk nonsense.\n\nThe Queen's argument was, that if something wasn't done about\nit in less than no time she'd have everybody executed, all round.\n(It was this last remark that had made the whole party look so\ngrave and anxious.)\n\nAlice could think of nothing else to say but `It belongs to the\nDuchess:  you'd better ask HER about it.'\n\n`She's in prison,' the Queen said to the executioner:  `fetch\nher here.'  And the executioner went off like an arrow.\n\nThe Cat's head began fading away the moment he was gone, and,\nby the time he had come back with the Duchess, it had entirely\ndisappeared; so the King and the executioner ran wildly up and down\nlooking for it, while the rest of the party went back to the game.\n\n\n\n                       CHAPTER IX\n\n                 The Mock Turtle's Story\n\n\n`You can't think how glad I am to see you again, you dear old\nthing!' said the Duchess, as she tucked her arm affectionately\ninto Alice's, and they walked off together.\n\nAlice was very glad to find her in such a pleasant temper, and\nthought to herself that perhaps it was only the pepper that had\nmade her so savage when they met in the kitchen.\n\n`When I'M a Duchess,' she said to herself, (not in a very\nhopeful tone though), `I won't have any pepper in my kitchen AT\nALL.  Soup does very well without--Maybe it's always pepper that\nmakes people hot-tempered,' she went on, very much pleased at\nhaving found out a new kind of rule, `and vinegar that makes them\nsour--and camomile that makes them bitter--and--and barley-sugar\nand such things that make children sweet-tempered.  I only wish\npeople knew that:  then they wouldn't be so stingy about it, you\nknow--'\n\nShe had quite forgotten the Duchess by this time, and was a\nlittle startled when she heard her voice close to her ear.\n`You're thinking about something, my dear, and that makes you\nforget to talk.  I can't tell you just now what the moral of that\nis, but I shall remember it in a bit.'\n\n`Perhaps it hasn't one,' Alice ventured to remark.\n\n`Tut, tut, child!' said the Duchess.  `Everything's got a\nmoral, if only you can find it.'  And she squeezed herself up\ncloser to Alice's side as she spoke.\n\nAlice did not much like keeping so close to her:  first,\nbecause the Duchess was VERY ugly; and secondly, because she was\nexactly the right height to rest her chin upon Alice's shoulder,\nand it was an uncomfortably sharp chin.  However, she did not\nlike to be rude, so she bore it as well as she could.\n\n`The game's going on rather better now,' she said, by way of\nkeeping up the conversation a little.\n\n`'Tis so,' said the Duchess:  `and the moral of that is--\"Oh,\n'tis love, 'tis love, that makes the world go round!\"'\n\n`Somebody said,' Alice whispered, `that it's done by everybody\nminding their own business!'\n\n`Ah, well!  It means much the same thing,' said the Duchess,\ndigging her sharp little chin into Alice's shoulder as she added,\n`and the moral of THAT is--\"Take care of the sense, and the\nsounds will take care of themselves.\"'\n\n`How fond she is of finding morals in things!' Alice thought to\nherself.\n\n`I dare say you're wondering why I don't put my arm round your\nwaist,' the Duchess said after a pause:  `the reason is, that I'm\ndoubtful about the temper of your flamingo.  Shall I try the\nexperiment?'\n\n`HE might bite,' Alice cautiously replied, not feeling at all\nanxious to have the experiment tried.\n\n`Very true,' said the Duchess:  `flamingoes and mustard both\nbite.  And the moral of that is--\"Birds of a feather flock\ntogether.\"'\n\n`Only mustard isn't a bird,' Alice remarked.\n\n`Right, as usual,' said the Duchess:  `what a clear way you\nhave of putting things!'\n\n`It's a mineral, I THINK,' said Alice.\n\n`Of course it is,' said the Duchess, who seemed ready to agree\nto everything that Alice said; `there's a large mustard-mine near\nhere.  And the moral of that is--\"The more there is of mine, the\nless there is of yours.\"'\n\n`Oh, I know!' exclaimed Alice, who had not attended to this\nlast remark, `it's a vegetable.  It doesn't look like one, but it\nis.'\n\n`I quite agree with you,' said the Duchess; `and the moral of\nthat is--\"Be what you would seem to be\"--or if you'd like it put\nmore simply--\"Never imagine yourself not to be otherwise than\nwhat it might appear to others that what you were or might have\nbeen was not otherwise than what you had been would have appeared\nto them to be otherwise.\"'\n\n`I think I should understand that better,' Alice said very\npolitely, `if I had it written down:  but I can't quite follow it\nas you say it.'\n\n`That's nothing to what I could say if I chose,' the Duchess\nreplied, in a pleased tone.\n\n`Pray don't trouble yourself to say it any longer than that,'\nsaid Alice.\n\n`Oh, don't talk about trouble!' said the Duchess.  `I make you\na present of everything I've said as yet.'\n\n`A cheap sort of present!' thought Alice.  `I'm glad they don't\ngive birthday presents like that!'  But she did not venture to\nsay it out loud.\n\n`Thinking again?' the Duchess asked, with another dig of her\nsharp little chin.\n\n`I've a right to think,' said Alice sharply, for she was\nbeginning to feel a little worried.\n\n`Just about as much right,' said the Duchess, `as pigs have to fly;\nand the m--'\n\nBut here, to Alice's great surprise, the Duchess's voice died\naway, even in the middle of her favourite word `moral,' and the\narm that was linked into hers began to tremble.  Alice looked up,\nand there stood the Queen in front of them, with her arms folded,\nfrowning like a thunderstorm.\n\n`A fine day, your Majesty!' the Duchess began in a low, weak\nvoice.\n\n`Now, I give you fair warning,' shouted the Queen, stamping on\nthe ground as she spoke; `either you or your head must be off,\nand that in about half no time!  Take your choice!'\n\nThe Duchess took her choice, and was gone in a moment.\n\n`Let's go on with the game,' the Queen said to Alice; and Alice\nwas too much frightened to say a word, but slowly followed her\nback to the croquet-ground.\n\nThe other guests had taken advantage of the Queen's absence,\nand were resting in the shade:  however, the moment they saw her,\nthey hurried back to the game, the Queen merely remarking that a\nmoment's delay would cost them their lives.\n\nAll the time they were playing the Queen never left off\nquarrelling with the other players, and shouting `Off with his\nhead!' or `Off with her head!'  Those whom she sentenced were\ntaken into custody by the soldiers, who of course had to leave\noff being arches to do this, so that by the end of half an hour\nor so there were no arches left, and all the players, except the\nKing, the Queen, and Alice, were in custody and under sentence of\nexecution.\n\nThen the Queen left off, quite out of breath, and said to\nAlice, `Have you seen the Mock Turtle yet?'\n\n`No,' said Alice.  `I don't even know what a Mock Turtle is.'\n\n`It's the thing Mock Turtle Soup is made from,' said the Queen.\n\n`I never saw one, or heard of one,' said Alice.\n\n`Come on, then,' said the Queen, `and he shall tell you his\nhistory,'\n\nAs they walked off together, Alice heard the King say in a low\nvoice, to the company generally, `You are all pardoned.'  `Come,\nTHAT'S a good thing!' she said to herself, for she had felt quite\nunhappy at the number of executions the Queen had ordered.\n\nThey very soon came upon a Gryphon, lying fast asleep in the\nsun.  (IF you don't know what a Gryphon is, look at the picture.)\n`Up, lazy thing!' said the Queen, `and take this young lady to\nsee the Mock Turtle, and to hear his history.  I must go back and\nsee after some executions I have ordered'; and she walked off,\nleaving Alice alone with the Gryphon.  Alice did not quite like\nthe look of the creature, but on the whole she thought it would\nbe quite as safe to stay with it as to go after that savage\nQueen:  so she waited.\n\nThe Gryphon sat up and rubbed its eyes:  then it watched the\nQueen till she was out of sight:  then it chuckled.  `What fun!'\nsaid the Gryphon, half to itself, half to Alice.\n\n`What IS the fun?' said Alice.\n\n`Why, SHE,' said the Gryphon.  `It's all her fancy, that:  they\nnever executes nobody, you know.  Come on!'\n\n`Everybody says \"come on!\" here,' thought Alice, as she went\nslowly after it:  `I never was so ordered about in all my life,\nnever!'\n\nThey had not gone far before they saw the Mock Turtle in the\ndistance, sitting sad and lonely on a little ledge of rock, and,\nas they came nearer, Alice could hear him sighing as if his heart\nwould break.  She pitied him deeply.  `What is his sorrow?' she\nasked the Gryphon, and the Gryphon answered, very nearly in the\nsame words as before, `It's all his fancy, that:  he hasn't got\nno sorrow, you know.  Come on!'\n\nSo they went up to the Mock Turtle, who looked at them with\nlarge eyes full of tears, but said nothing.\n\n`This here young lady,' said the Gryphon, `she wants for to\nknow your history, she do.'\n\n`I'll tell it her,' said the Mock Turtle in a deep, hollow\ntone:  `sit down, both of you, and don't speak a word till I've\nfinished.'\n\nSo they sat down, and nobody spoke for some minutes.  Alice\nthought to herself, `I don't see how he can EVEN finish, if he\ndoesn't begin.'  But she waited patiently.\n\n`Once,' said the Mock Turtle at last, with a deep sigh, `I was\na real Turtle.'\n\nThese words were followed by a very long silence, broken only\nby an occasional exclamation of `Hjckrrh!' from the Gryphon, and\nthe constant heavy sobbing of the Mock Turtle.  Alice was very\nnearly getting up and saying, `Thank you, sir, for your\ninteresting story,' but she could not help thinking there MUST be\nmore to come, so she sat still and said nothing.\n\n`When we were little,' the Mock Turtle went on at last, more\ncalmly, though still sobbing a little now and then, `we went to\nschool in the sea.  The master was an old Turtle--we used to call\nhim Tortoise--'\n\n`Why did you call him Tortoise, if he wasn't one?' Alice asked.\n\n`We called him Tortoise because he taught us,' said the Mock\nTurtle angrily:  `really you are very dull!'\n\n`You ought to be ashamed of yourself for asking such a simple\nquestion,' added the Gryphon; and then they both sat silent and\nlooked at poor Alice, who felt ready to sink into the earth.  At\nlast the Gryphon said to the Mock Turtle, `Drive on, old fellow!\nDon't be all day about it!' and he went on in these words:\n\n`Yes, we went to school in the sea, though you mayn't believe\nit--'\n\n`I never said I didn't!' interrupted Alice.\n\n`You did,' said the Mock Turtle.\n\n`Hold your tongue!' added the Gryphon, before Alice could speak\nagain.  The Mock Turtle went on.\n\n`We had the best of educations--in fact, we went to school\nevery day--'\n\n`I'VE been to a day-school, too,' said Alice; `you needn't be\nso proud as all that.'\n\n`With extras?' asked the Mock Turtle a little anxiously.\n\n`Yes,' said Alice, `we learned French and music.'\n\n`And washing?' said the Mock Turtle.\n\n`Certainly not!' said Alice indignantly.\n\n`Ah! then yours wasn't a really good school,' said the Mock\nTurtle in a tone of great relief.  `Now at OURS they had at the\nend of the bill, \"French, music, AND WASHING--extra.\"'\n\n`You couldn't have wanted it much,' said Alice; `living at the\nbottom of the sea.'\n\n`I couldn't afford to learn it.' said the Mock Turtle with a\nsigh.  `I only took the regular course.'\n\n`What was that?' inquired Alice.\n\n`Reeling and Writhing, of course, to begin with,' the Mock\nTurtle replied; `and then the different branches of Arithmetic--\nAmbition, Distraction, Uglification, and Derision.'\n\n`I never heard of \"Uglification,\"' Alice ventured to say.  `What is it?'\n\nThe Gryphon lifted up both its paws in surprise.  `What!  Never\nheard of uglifying!' it exclaimed.  `You know what to beautify is,\nI suppose?'\n\n`Yes,' said Alice doubtfully:  `it means--to--make--anything--prettier.'\n\n`Well, then,' the Gryphon went on, `if you don't know what to\nuglify is, you ARE a simpleton.'\n\nAlice did not feel encouraged to ask any more questions about\nit, so she turned to the Mock Turtle, and said `What else had you\nto learn?'\n\n`Well, there was Mystery,' the Mock Turtle replied, counting\noff the subjects on his flappers, `--Mystery, ancient and modern,\nwith Seaography:  then Drawling--the Drawling-master was an old\nconger-eel, that used to come once a week:  HE taught us\nDrawling, Stretching, and Fainting in Coils.'\n\n`What was THAT like?' said Alice.\n\n`Well, I can't show it you myself,' the Mock Turtle said:  `I'm\ntoo stiff.  And the Gryphon never learnt it.'\n\n`Hadn't time,' said the Gryphon:  `I went to the Classics\nmaster, though.  He was an old crab, HE was.'\n\n`I never went to him,' the Mock Turtle said with a sigh:  `he\ntaught Laughing and Grief, they used to say.'\n\n`So he did, so he did,' said the Gryphon, sighing in his turn;\nand both creatures hid their faces in their paws.\n\n`And how many hours a day did you do lessons?' said Alice, in a\nhurry to change the subject.\n\n`Ten hours the first day,' said the Mock Turtle: `nine the\nnext, and so on.'\n\n`What a curious plan!' exclaimed Alice.\n\n`That's the reason they're called lessons,' the Gryphon\nremarked:  `because they lessen from day to day.'\n\nThis was quite a new idea to Alice, and she thought it over a\nlittle before she made her next remark.  `Then the eleventh day\nmust have been a holiday?'\n\n`Of course it was,' said the Mock Turtle.\n\n`And how did you manage on the twelfth?' Alice went on eagerly.\n\n`That's enough about lessons,' the Gryphon interrupted in a\nvery decided tone:  `tell her something about the games now.'\n\n\n\n                        CHAPTER X\n\n                  The Lobster Quadrille\n\n\nThe Mock Turtle sighed deeply, and drew the back of one flapper\nacross his eyes.  He looked at Alice, and tried to speak, but for\na minute or two sobs choked his voice.  `Same as if he had a bone\nin his throat,' said the Gryphon:  and it set to work shaking him\nand punching him in the back.  At last the Mock Turtle recovered\nhis voice, and, with tears running down his cheeks, he went on\nagain:--\n\n`You may not have lived much under the sea--' (`I haven't,' said Alice)--\n`and perhaps you were never even introduced to a lobster--'\n(Alice began to say `I once tasted--' but checked herself hastily,\nand said `No, never') `--so you can have no idea what a delightful\nthing a Lobster Quadrille is!'\n\n`No, indeed,' said Alice.  `What sort of a dance is it?'\n\n`Why,' said the Gryphon, `you first form into a line along the sea-shore--'\n\n`Two lines!' cried the Mock Turtle.  `Seals, turtles, salmon, and so on;\nthen, when you've cleared all the jelly-fish out of the way--'\n\n`THAT generally takes some time,' interrupted the Gryphon.\n\n`--you advance twice--'\n\n`Each with a lobster as a partner!' cried the Gryphon.\n\n`Of course,' the Mock Turtle said:  `advance twice, set to\npartners--'\n\n`--change lobsters, and retire in same order,' continued the\nGryphon.\n\n`Then, you know,' the Mock Turtle went on, `you throw the--'\n\n`The lobsters!' shouted the Gryphon, with a bound into the air.\n\n`--as far out to sea as you can--'\n\n`Swim after them!' screamed the Gryphon.\n\n`Turn a somersault in the sea!' cried the Mock Turtle,\ncapering wildly about.\n\n`Change lobsters again!' yelled the Gryphon at the top of its voice.\n\n`Back to land again, and that's all the first figure,' said the\nMock Turtle, suddenly dropping his voice; and the two creatures,\nwho had been jumping about like mad things all this time, sat\ndown again very sadly and quietly, and looked at Alice.\n\n`It must be a very pretty dance,' said Alice timidly.\n\n`Would you like to see a little of it?' said the Mock Turtle.\n\n`Very much indeed,' said Alice.\n\n`Come, let's try the first figure!' said the Mock Turtle to the\nGryphon.  `We can do without lobsters, you know.  Which shall\nsing?'\n\n`Oh, YOU sing,' said the Gryphon.  `I've forgotten the words.'\n\nSo they began solemnly dancing round and round Alice, every now\nand then treading on her toes when they passed too close, and\nwaving their forepaws to mark the time, while the Mock Turtle\nsang this, very slowly and sadly:--\n\n\n`\"Will you walk a little faster?\" said a whiting to a snail.\n\"There's a porpoise close behind us, and he's treading on my\ntail.\nSee how eagerly the lobsters and the turtles all advance!\nThey are waiting on the shingle--will you come and join the\ndance?\n\nWill you, won't you, will you, won't you, will you join the\ndance?\nWill you, won't you, will you, won't you, won't you join the\ndance?\n\n\n\"You can really have no notion how delightful it will be\nWhen they take us up and throw us, with the lobsters, out to\n                                                  sea!\"\nBut the snail replied \"Too far, too far!\" and gave a look\n                                                   askance--\nSaid he thanked the whiting kindly, but he would not join the\ndance.\nWould not, could not, would not, could not, would not join\n    the dance.\nWould not, could not, would not, could not, could not join\n    the dance.\n\n`\"What matters it how far we go?\" his scaly friend replied.\n\"There is another shore, you know, upon the other side.\nThe further off from England the nearer is to France--\nThen turn not pale, beloved snail, but come and join the dance.\n\nWill you, won't you, will you, won't you, will you join the\n     dance?\nWill you, won't you, will you, won't you, won't you join the\n     dance?\"'\n\n\n\n`Thank you, it's a very interesting dance to watch,' said\nAlice, feeling very glad that it was over at last:  `and I do so\nlike that curious song about the whiting!'\n\n`Oh, as to the whiting,' said the Mock Turtle, `they--you've\nseen them, of course?'\n\n`Yes,' said Alice, `I've often seen them at dinn--' she\nchecked herself hastily.\n\n`I don't know where Dinn may be,' said the Mock Turtle, `but\nif you've seen them so often, of course you know what they're\nlike.'\n\n`I believe so,' Alice replied thoughtfully.  `They have their\ntails in their mouths--and they're all over crumbs.'\n\n`You're wrong about the crumbs,' said the Mock Turtle:\n`crumbs would all wash off in the sea.  But they HAVE their tails\nin their mouths; and the reason is--' here the Mock Turtle\nyawned and shut his eyes.--`Tell her about the reason and all\nthat,' he said to the Gryphon.\n\n`The reason is,' said the Gryphon, `that they WOULD go with\nthe lobsters to the dance.  So they got thrown out to sea.  So\nthey had to fall a long way.  So they got their tails fast in\ntheir mouths.  So they couldn't get them out again.  That's all.'\n\n`Thank you,' said Alice, `it's very interesting.  I never knew\nso much about a whiting before.'\n\n`I can tell you more than that, if you like,' said the\nGryphon.  `Do you know why it's called a whiting?'\n\n`I never thought about it,' said Alice.  `Why?'\n\n`IT DOES THE BOOTS AND SHOES.' the Gryphon replied very\nsolemnly.\n\nAlice was thoroughly puzzled.  `Does the boots and shoes!' she\nrepeated in a wondering tone.\n\n`Why, what are YOUR shoes done with?' said the Gryphon.  `I\nmean, what makes them so shiny?'\n\nAlice looked down at them, and considered a little before she\ngave her answer.  `They're done with blacking, I believe.'\n\n`Boots and shoes under the sea,' the Gryphon went on in a deep\nvoice, `are done with a whiting.  Now you know.'\n\n`And what are they made of?' Alice asked in a tone of great\ncuriosity.\n\n`Soles and eels, of course,' the Gryphon replied rather\nimpatiently:  `any shrimp could have told you that.'\n\n`If I'd been the whiting,' said Alice, whose thoughts were\nstill running on the song, `I'd have said to the porpoise, \"Keep\nback, please:  we don't want YOU with us!\"'\n\n`They were obliged to have him with them,' the Mock Turtle\nsaid:  `no wise fish would go anywhere without a porpoise.'\n\n`Wouldn't it really?' said Alice in a tone of great surprise.\n\n`Of course not,' said the Mock Turtle:  `why, if a fish came\nto ME, and told me he was going a journey, I should say \"With\nwhat porpoise?\"'\n\n`Don't you mean \"purpose\"?' said Alice.\n\n`I mean what I say,' the Mock Turtle replied in an offended\ntone.  And the Gryphon added `Come, let's hear some of YOUR\nadventures.'\n\n`I could tell you my adventures--beginning from this morning,'\nsaid Alice a little timidly:  `but it's no use going back to\nyesterday, because I was a different person then.'\n\n`Explain all that,' said the Mock Turtle.\n\n`No, no!  The adventures first,' said the Gryphon in an\nimpatient tone:  `explanations take such a dreadful time.'\n\nSo Alice began telling them her adventures from the time when\nshe first saw the White Rabbit.  She was a little nervous about\nit just at first, the two creatures got so close to her, one on\neach side, and opened their eyes and mouths so VERY wide, but she\ngained courage as she went on.  Her listeners were perfectly\nquiet till she got to the part about her repeating `YOU ARE OLD,\nFATHER WILLIAM,' to the Caterpillar, and the words all coming\ndifferent, and then the Mock Turtle drew a long breath, and said\n`That's very curious.'\n\n`It's all about as curious as it can be,' said the Gryphon.\n\n`It all came different!' the Mock Turtle repeated\nthoughtfully.  `I should like to hear her try and repeat\nsomething now.  Tell her to begin.'  He looked at the Gryphon as\nif he thought it had some kind of authority over Alice.\n\n`Stand up and repeat \"'TIS THE VOICE OF THE SLUGGARD,\"' said\nthe Gryphon.\n\n`How the creatures order one about, and make one repeat\nlessons!' thought Alice; `I might as well be at school at once.'\nHowever, she got up, and began to repeat it, but her head was so\nfull of the Lobster Quadrille, that she hardly knew what she was\nsaying, and the words came very queer indeed:--\n\n`'Tis the voice of the Lobster; I heard him declare,\n\"You have baked me too brown, I must sugar my hair.\"\nAs a duck with its eyelids, so he with his nose\nTrims his belt and his buttons, and turns out his toes.'\n\n          [later editions continued as follows\nWhen the sands are all dry, he is gay as a lark,\nAnd will talk in contemptuous tones of the Shark,\nBut, when the tide rises and sharks are around,\nHis voice has a timid and tremulous sound.]\n\n`That's different from what I used to say when I was a child,'\nsaid the Gryphon.\n\n`Well, I never heard it before,' said the Mock Turtle; `but it\nsounds uncommon nonsense.'\n\nAlice said nothing; she had sat down with her face in her\nhands, wondering if anything would EVER happen in a natural way\nagain.\n\n`I should like to have it explained,' said the Mock Turtle.\n\n`She can't explain it,' said the Gryphon hastily.  `Go on with\nthe next verse.'\n\n`But about his toes?' the Mock Turtle persisted.  `How COULD\nhe turn them out with his nose, you know?'\n\n`It's the first position in dancing.' Alice said; but was\ndreadfully puzzled by the whole thing, and longed to change the\nsubject.\n\n`Go on with the next verse,' the Gryphon repeated impatiently:\n`it begins \"I passed by his garden.\"'\n\nAlice did not dare to disobey, though she felt sure it would\nall come wrong, and she went on in a trembling voice:--\n\n`I passed by his garden, and marked, with one eye,\nHow the Owl and the Panther were sharing a pie--'\n\n    [later editions continued as follows\nThe Panther took pie-crust, and gravy, and meat,\nWhile the Owl had the dish as its share of the treat.\nWhen the pie was all finished, the Owl, as a boon,\nWas kindly permitted to pocket the spoon:\nWhile the Panther received knife and fork with a growl,\nAnd concluded the banquet--]\n\n`What IS the use of repeating all that stuff,' the Mock Turtle\ninterrupted, `if you don't explain it as you go on?  It's by far\nthe most confusing thing I ever heard!'\n\n`Yes, I think you'd better leave off,' said the Gryphon:  and\nAlice was only too glad to do so.\n\n`Shall we try another figure of the Lobster Quadrille?' the\nGryphon went on.  `Or would you like the Mock Turtle to sing you\na song?'\n\n`Oh, a song, please, if the Mock Turtle would be so kind,'\nAlice replied, so eagerly that the Gryphon said, in a rather\noffended tone, `Hm!  No accounting for tastes!  Sing her\n\"Turtle Soup,\" will you, old fellow?'\n\nThe Mock Turtle sighed deeply, and began, in a voice sometimes\nchoked with sobs, to sing this:--\n\n\n`Beautiful Soup, so rich and green,\nWaiting in a hot tureen!\nWho for such dainties would not stoop?\nSoup of the evening, beautiful Soup!\nSoup of the evening, beautiful Soup!\n    Beau--ootiful Soo--oop!\n    Beau--ootiful Soo--oop!\nSoo--oop of the e--e--evening,\n    Beautiful, beautiful Soup!\n\n`Beautiful Soup!  Who cares for fish,\nGame, or any other dish?\nWho would not give all else for two\nPennyworth only of beautiful Soup?\nPennyworth only of beautiful Soup?\n    Beau--ootiful Soo--oop!\n    Beau--ootiful Soo--oop!\nSoo--oop of the e--e--evening,\n    Beautiful, beauti--FUL SOUP!'\n\n`Chorus again!' cried the Gryphon, and the Mock Turtle had\njust begun to repeat it, when a cry of `The trial's beginning!'\nwas heard in the distance.\n\n`Come on!' cried the Gryphon, and, taking Alice by the hand,\nit hurried off, without waiting for the end of the song.\n\n`What trial is it?' Alice panted as she ran; but the Gryphon\nonly answered `Come on!' and ran the faster, while more and more\nfaintly came, carried on the breeze that followed them, the\nmelancholy words:--\n\n`Soo--oop of the e--e--evening,\n    Beautiful, beautiful Soup!'\n\n\n\n                       CHAPTER XI\n\n                  Who Stole the Tarts?\n\n\nThe King and Queen of Hearts were seated on their throne when\nthey arrived, with a great crowd assembled about them--all sorts\nof little birds and beasts, as well as the whole pack of cards:\nthe Knave was standing before them, in chains, with a soldier on\neach side to guard him; and near the King was the White Rabbit,\nwith a trumpet in one hand, and a scroll of parchment in the\nother.  In the very middle of the court was a table, with a large\ndish of tarts upon it:  they looked so good, that it made Alice\nquite hungry to look at them--`I wish they'd get the trial done,'\nshe thought, `and hand round the refreshments!'  But there seemed\nto be no chance of this, so she began looking at everything about\nher, to pass away the time.\n\nAlice had never been in a court of justice before, but she had\nread about them in books, and she was quite pleased to find that\nshe knew the name of nearly everything there.  `That's the\njudge,' she said to herself, `because of his great wig.'\n\nThe judge, by the way, was the King; and as he wore his crown\nover the wig, (look at the frontispiece if you want to see how he\ndid it,) he did not look at all comfortable, and it was certainly\nnot becoming.\n\n`And that's the jury-box,' thought Alice, `and those twelve\ncreatures,' (she was obliged to say `creatures,' you see, because\nsome of them were animals, and some were birds,) `I suppose they\nare the jurors.'  She said this last word two or three times over\nto herself, being rather proud of it:  for she thought, and\nrightly too, that very few little girls of her age knew the\nmeaning of it at all.  However, `jury-men' would have done just\nas well.\n\nThe twelve jurors were all writing very busily on slates.\n`What are they doing?'  Alice whispered to the Gryphon.  `They\ncan't have anything to put down yet, before the trial's begun.'\n\n`They're putting down their names,' the Gryphon whispered in\nreply, `for fear they should forget them before the end of the\ntrial.'\n\n`Stupid things!' Alice began in a loud, indignant voice, but\nshe stopped hastily, for the White Rabbit cried out, `Silence in\nthe court!' and the King put on his spectacles and looked\nanxiously round, to make out who was talking.\n\nAlice could see, as well as if she were looking over their\nshoulders, that all the jurors were writing down `stupid things!'\non their slates, and she could even make out that one of them\ndidn't know how to spell `stupid,' and that he had to ask his\nneighbour to tell him.  `A nice muddle their slates'll be in\nbefore the trial's over!' thought Alice.\n\nOne of the jurors had a pencil that squeaked.  This of course,\nAlice could not stand, and she went round the court and got\nbehind him, and very soon found an opportunity of taking it\naway.  She did it so quickly that the poor little juror (it was\nBill, the Lizard) could not make out at all what had become of\nit; so, after hunting all about for it, he was obliged to write\nwith one finger for the rest of the day; and this was of very\nlittle use, as it left no mark on the slate.\n\n`Herald, read the accusation!' said the King.\n\nOn this the White Rabbit blew three blasts on the trumpet, and\nthen unrolled the parchment scroll, and read as follows:--\n\n`The Queen of Hearts, she made some tarts,\n      All on a summer day:\n  The Knave of Hearts, he stole those tarts,\n      And took them quite away!'\n\n`Consider your verdict,' the King said to the jury.\n\n`Not yet, not yet!' the Rabbit hastily interrupted.  `There's\na great deal to come before that!'\n\n`Call the first witness,' said the King; and the White Rabbit\nblew three blasts on the trumpet, and called out, `First\nwitness!'\n\nThe first witness was the Hatter.  He came in with a teacup in\none hand and a piece of bread-and-butter in the other.  `I beg\npardon, your Majesty,' he began, `for bringing these in:  but I\nhadn't quite finished my tea when I was sent for.'\n\n`You ought to have finished,' said the King.  `When did you\nbegin?'\n\nThe Hatter looked at the March Hare, who had followed him into\nthe court, arm-in-arm with the Dormouse.  `Fourteenth of March, I\nthink it was,' he said.\n\n`Fifteenth,' said the March Hare.\n\n`Sixteenth,' added the Dormouse.\n\n`Write that down,' the King said to the jury, and the jury\neagerly wrote down all three dates on their slates, and then\nadded them up, and reduced the answer to shillings and pence.\n\n`Take off your hat,' the King said to the Hatter.\n\n`It isn't mine,' said the Hatter.\n\n`Stolen!' the King exclaimed, turning to the jury, who\ninstantly made a memorandum of the fact.\n\n`I keep them to sell,' the Hatter added as an explanation;\n`I've none of my own.  I'm a hatter.'\n\nHere the Queen put on her spectacles, and began staring at the\nHatter, who turned pale and fidgeted.\n\n`Give your evidence,' said the King; `and don't be nervous, or\nI'll have you executed on the spot.'\n\nThis did not seem to encourage the witness at all:  he kept\nshifting from one foot to the other, looking uneasily at the\nQueen, and in his confusion he bit a large piece out of his\nteacup instead of the bread-and-butter.\n\nJust at this moment Alice felt a very curious sensation, which\npuzzled her a good deal until she made out what it was:  she was\nbeginning to grow larger again, and she thought at first she\nwould get up and leave the court; but on second thoughts she\ndecided to remain where she was as long as there was room for\nher.\n\n`I wish you wouldn't squeeze so.' said the Dormouse, who was\nsitting next to her.  `I can hardly breathe.'\n\n`I can't help it,' said Alice very meekly:  `I'm growing.'\n\n`You've no right to grow here,' said the Dormouse.\n\n`Don't talk nonsense,' said Alice more boldly:  `you know\nyou're growing too.'\n\n`Yes, but I grow at a reasonable pace,' said the Dormouse:\n`not in that ridiculous fashion.'  And he got up very sulkily\nand crossed over to the other side of the court.\n\nAll this time the Queen had never left off staring at the\nHatter, and, just as the Dormouse crossed the court, she said to\none of the officers of the court, `Bring me the list of the\nsingers in the last concert!' on which the wretched Hatter\ntrembled so, that he shook both his shoes off.\n\n`Give your evidence,' the King repeated angrily, `or I'll have\nyou executed, whether you're nervous or not.'\n\n`I'm a poor man, your Majesty,' the Hatter began, in a\ntrembling voice, `--and I hadn't begun my tea--not above a week\nor so--and what with the bread-and-butter getting so thin--and\nthe twinkling of the tea--'\n\n`The twinkling of the what?' said the King.\n\n`It began with the tea,' the Hatter replied.\n\n`Of course twinkling begins with a T!' said the King sharply.\n`Do you take me for a dunce?  Go on!'\n\n`I'm a poor man,' the Hatter went on, `and most things\ntwinkled after that--only the March Hare said--'\n\n`I didn't!' the March Hare interrupted in a great hurry.\n\n`You did!' said the Hatter.\n\n`I deny it!' said the March Hare.\n\n`He denies it,' said the King:  `leave out that part.'\n\n`Well, at any rate, the Dormouse said--' the Hatter went on,\nlooking anxiously round to see if he would deny it too:  but the\nDormouse denied nothing, being fast asleep.\n\n`After that,' continued the Hatter, `I cut some more bread-\nand-butter--'\n\n`But what did the Dormouse say?' one of the jury asked.\n\n`That I can't remember,' said the Hatter.\n\n`You MUST remember,' remarked the King, `or I'll have you\nexecuted.'\n\nThe miserable Hatter dropped his teacup and bread-and-butter,\nand went down on one knee.  `I'm a poor man, your Majesty,' he\nbegan.\n\n`You're a very poor speaker,' said the King.\n\nHere one of the guinea-pigs cheered, and was immediately\nsuppressed by the officers of the court.  (As that is rather a\nhard word, I will just explain to you how it was done.  They had\na large canvas bag, which tied up at the mouth with strings:\ninto this they slipped the guinea-pig, head first, and then sat\nupon it.)\n\n`I'm glad I've seen that done,' thought Alice.  `I've so often\nread in the newspapers, at the end of trials, \"There was some\nattempts at applause, which was immediately suppressed by the\nofficers of the court,\" and I never understood what it meant\ntill now.'\n\n`If that's all you know about it, you may stand down,'\ncontinued the King.\n\n`I can't go no lower,' said the Hatter:  `I'm on the floor, as\nit is.'\n\n`Then you may SIT down,' the King replied.\n\nHere the other guinea-pig cheered, and was suppressed.\n\n`Come, that finished the guinea-pigs!' thought Alice.  `Now we\nshall get on better.'\n\n`I'd rather finish my tea,' said the Hatter, with an anxious\nlook at the Queen, who was reading the list of singers.\n\n`You may go,' said the King, and the Hatter hurriedly left the\ncourt, without even waiting to put his shoes on.\n\n`--and just take his head off outside,' the Queen added to one\nof the officers:  but the Hatter was out of sight before the\nofficer could get to the door.\n\n`Call the next witness!' said the King.\n\nThe next witness was the Duchess's cook.  She carried the\npepper-box in her hand, and Alice guessed who it was, even before\nshe got into the court, by the way the people near the door began\nsneezing all at once.\n\n`Give your evidence,' said the King.\n\n`Shan't,' said the cook.\n\nThe King looked anxiously at the White Rabbit, who said in a\nlow voice, `Your Majesty must cross-examine THIS witness.'\n\n`Well, if I must, I must,' the King said, with a melancholy\nair, and, after folding his arms and frowning at the cook till\nhis eyes were nearly out of sight, he said in a deep voice, `What\nare tarts made of?'\n\n`Pepper, mostly,' said the cook.\n\n`Treacle,' said a sleepy voice behind her.\n\n`Collar that Dormouse,' the Queen shrieked out.  `Behead that\nDormouse!  Turn that Dormouse out of court!  Suppress him!  Pinch\nhim!  Off with his whiskers!'\n\nFor some minutes the whole court was in confusion, getting the\nDormouse turned out, and, by the time they had settled down\nagain, the cook had disappeared.\n\n`Never mind!' said the King, with an air of great relief.\n`Call the next witness.'  And he added in an undertone to the\nQueen, `Really, my dear, YOU must cross-examine the next witness.\nIt quite makes my forehead ache!'\n\nAlice watched the White Rabbit as he fumbled over the list,\nfeeling very curious to see what the next witness would be like,\n`--for they haven't got much evidence YET,' she said to herself.\nImagine her surprise, when the White Rabbit read out, at the top\nof his shrill little voice, the name `Alice!'\n\n\n\n                       CHAPTER XII\n\n                    Alice's Evidence\n\n\n`Here!' cried Alice, quite forgetting in the flurry of the\nmoment how large she had grown in the last few minutes, and she\njumped up in such a hurry that she tipped over the jury-box with\nthe edge of her skirt, upsetting all the jurymen on to the heads\nof the crowd below, and there they lay sprawling about, reminding\nher very much of a globe of goldfish she had accidentally upset\nthe week before.\n\n`Oh, I BEG your pardon!' she exclaimed in a tone of great\ndismay, and began picking them up again as quickly as she could,\nfor the accident of the goldfish kept running in her head, and\nshe had a vague sort of idea that they must be collected at once\nand put back into the jury-box, or they would die.\n\n`The trial cannot proceed,' said the King in a very grave\nvoice, `until all the jurymen are back in their proper places--\nALL,' he repeated with great emphasis, looking hard at Alice as\nhe said do.\n\nAlice looked at the jury-box, and saw that, in her haste, she\nhad put the Lizard in head downwards, and the poor little thing\nwas waving its tail about in a melancholy way, being quite unable\nto move.  She soon got it out again, and put it right; `not that\nit signifies much,' she said to herself; `I should think it\nwould be QUITE as much use in the trial one way up as the other.'\n\nAs soon as the jury had a little recovered from the shock of\nbeing upset, and their slates and pencils had been found and\nhanded back to them, they set to work very diligently to write\nout a history of the accident, all except the Lizard, who seemed\ntoo much overcome to do anything but sit with its mouth open,\ngazing up into the roof of the court.\n\n`What do you know about this business?' the King said to\nAlice.\n\n`Nothing,' said Alice.\n\n`Nothing WHATEVER?' persisted the King.\n\n`Nothing whatever,' said Alice.\n\n`That's very important,' the King said, turning to the jury.\nThey were just beginning to write this down on their slates, when\nthe White Rabbit interrupted:  `UNimportant, your Majesty means,\nof course,' he said in a very respectful tone, but frowning and\nmaking faces at him as he spoke.\n\n`UNimportant, of course, I meant,' the King hastily said, and\nwent on to himself in an undertone, `important--unimportant--\nunimportant--important--' as if he were trying which word\nsounded best.\n\nSome of the jury wrote it down `important,' and some\n`unimportant.'  Alice could see this, as she was near enough to\nlook over their slates; `but it doesn't matter a bit,' she\nthought to herself.\n\nAt this moment the King, who had been for some time busily\nwriting in his note-book, cackled out `Silence!' and read out\nfrom his book, `Rule Forty-two.  ALL PERSONS MORE THAN A MILE\nHIGH TO LEAVE THE COURT.'\n\nEverybody looked at Alice.\n\n`I'M not a mile high,' said Alice.\n\n`You are,' said the King.\n\n`Nearly two miles high,' added the Queen.\n\n`Well, I shan't go, at any rate,' said Alice:  `besides,\nthat's not a regular rule:  you invented it just now.'\n\n`It's the oldest rule in the book,' said the King.\n\n`Then it ought to be Number One,' said Alice.\n\nThe King turned pale, and shut his note-book hastily.\n`Consider your verdict,' he said to the jury, in a low, trembling\nvoice.\n\n`There's more evidence to come yet, please your Majesty,' said\nthe White Rabbit, jumping up in a great hurry; `this paper has\njust been picked up.'\n\n`What's in it?' said the Queen.\n\n`I haven't opened it yet,' said the White Rabbit, `but it seems\nto be a letter, written by the prisoner to--to somebody.'\n\n`It must have been that,' said the King, `unless it was\nwritten to nobody, which isn't usual, you know.'\n\n`Who is it directed to?' said one of the jurymen.\n\n`It isn't directed at all,' said the White Rabbit; `in fact,\nthere's nothing written on the OUTSIDE.'  He unfolded the paper\nas he spoke, and added `It isn't a letter, after all:  it's a set\nof verses.'\n\n`Are they in the prisoner's handwriting?' asked another of\nthe jurymen.\n\n`No, they're not,' said the White Rabbit, `and that's the\nqueerest thing about it.'  (The jury all looked puzzled.)\n\n`He must have imitated somebody else's hand,' said the King.\n(The jury all brightened up again.)\n\n`Please your Majesty,' said the Knave, `I didn't write it, and\nthey can't prove I did:  there's no name signed at the end.'\n\n`If you didn't sign it,' said the King, `that only makes the\nmatter worse.  You MUST have meant some mischief, or else you'd\nhave signed your name like an honest man.'\n\nThere was a general clapping of hands at this:  it was the\nfirst really clever thing the King had said that day.\n\n`That PROVES his guilt,' said the Queen.\n\n`It proves nothing of the sort!' said Alice.  `Why, you don't\neven know what they're about!'\n\n`Read them,' said the King.\n\nThe White Rabbit put on his spectacles.  `Where shall I begin,\nplease your Majesty?' he asked.\n\n`Begin at the beginning,' the King said gravely, `and go on\ntill you come to the end:  then stop.'\n\nThese were the verses the White Rabbit read:--\n\n    `They told me you had been to her,\n      And mentioned me to him:\n    She gave me a good character,\n      But said I could not swim.\n\n    He sent them word I had not gone\n      (We know it to be true):\n    If she should push the matter on,\n      What would become of you?\n\n    I gave her one, they gave him two,\n      You gave us three or more;\n    They all returned from him to you,\n      Though they were mine before.\n\n    If I or she should chance to be\n      Involved in this affair,\n    He trusts to you to set them free,\n      Exactly as we were.\n\n    My notion was that you had been\n      (Before she had this fit)\n    An obstacle that came between\n      Him, and ourselves, and it.\n\n    Don't let him know she liked them best,\n      For this must ever be\n    A secret, kept from all the rest,\n      Between yourself and me.'\n\n`That's the most important piece of evidence we've heard yet,'\nsaid the King, rubbing his hands; `so now let the jury--'\n\n`If any one of them can explain it,' said Alice, (she had\ngrown so large in the last few minutes that she wasn't a bit\nafraid of interrupting him,) `I'll give him sixpence.  _I_ don't\nbelieve there's an atom of meaning in it.'\n\nThe jury all wrote down on their slates, `SHE doesn't believe\nthere's an atom of meaning in it,' but none of them attempted to\nexplain the paper.\n\n`If there's no meaning in it,' said the King, `that saves a\nworld of trouble, you know, as we needn't try to find any.  And\nyet I don't know,' he went on, spreading out the verses on his\nknee, and looking at them with one eye; `I seem to see some\nmeaning in them, after all.  \"--SAID I COULD NOT SWIM--\" you\ncan't swim, can you?' he added, turning to the Knave.\n\nThe Knave shook his head sadly.  `Do I look like it?' he said.\n(Which he certainly did NOT, being made entirely of cardboard.)\n\n`All right, so far,' said the King, and he went on muttering\nover the verses to himself:  `\"WE KNOW IT TO BE TRUE--\" that's\nthe jury, of course-- \"I GAVE HER ONE, THEY GAVE HIM TWO--\" why,\nthat must be what he did with the tarts, you know--'\n\n`But, it goes on \"THEY ALL RETURNED FROM HIM TO YOU,\"' said\nAlice.\n\n`Why, there they are!' said the King triumphantly, pointing to\nthe tarts on the table.  `Nothing can be clearer than THAT.\nThen again--\"BEFORE SHE HAD THIS FIT--\"  you never had fits, my\ndear, I think?' he said to the Queen.\n\n`Never!' said the Queen furiously, throwing an inkstand at the\nLizard as she spoke.  (The unfortunate little Bill had left off\nwriting on his slate with one finger, as he found it made no\nmark; but he now hastily began again, using the ink, that was\ntrickling down his face, as long as it lasted.)\n\n`Then the words don't FIT you,' said the King, looking round\nthe court with a smile.  There was a dead silence.\n\n`It's a pun!' the King added in an offended tone, and\neverybody laughed, `Let the jury consider their verdict,' the\nKing said, for about the twentieth time that day.\n\n`No, no!' said the Queen.  `Sentence first--verdict afterwards.'\n\n`Stuff and nonsense!' said Alice loudly.  `The idea of having\nthe sentence first!'\n\n`Hold your tongue!' said the Queen, turning purple.\n\n`I won't!' said Alice.\n\n`Off with her head!' the Queen shouted at the top of her voice.\nNobody moved.\n\n`Who cares for you?' said Alice, (she had grown to her full\nsize by this time.)  `You're nothing but a pack of cards!'\n\nAt this the whole pack rose up into the air, and came flying\ndown upon her:  she gave a little scream, half of fright and half\nof anger, and tried to beat them off, and found herself lying on\nthe bank, with her head in the lap of her sister, who was gently\nbrushing away some dead leaves that had fluttered down from the\ntrees upon her face.\n\n`Wake up, Alice dear!' said her sister; `Why, what a long\nsleep you've had!'\n\n`Oh, I've had such a curious dream!' said Alice, and she told\nher sister, as well as she could remember them, all these strange\nAdventures of hers that you have just been reading about; and\nwhen she had finished, her sister kissed her, and said, `It WAS a\ncurious dream, dear, certainly:  but now run in to your tea; it's\ngetting late.'  So Alice got up and ran off, thinking while she\nran, as well she might, what a wonderful dream it had been.\n\nBut her sister sat still just as she left her, leaning her\nhead on her hand, watching the setting sun, and thinking of\nlittle Alice and all her wonderful Adventures, till she too began\ndreaming after a fashion, and this was her dream:--\n\nFirst, she dreamed of little Alice herself, and once again the\ntiny hands were clasped upon her knee, and the bright eager eyes\nwere looking up into hers--she could hear the very tones of her\nvoice, and see that queer little toss of her head to keep back\nthe wandering hair that WOULD always get into her eyes--and\nstill as she listened, or seemed to listen, the whole place\naround her became alive the strange creatures of her little\nsister's dream.\n\nThe long grass rustled at her feet as the White Rabbit hurried\nby--the frightened Mouse splashed his way through the\nneighbouring pool--she could hear the rattle of the teacups as\nthe March Hare and his friends shared their never-ending meal,\nand the shrill voice of the Queen ordering off her unfortunate\nguests to execution--once more the pig-baby was sneezing on the\nDuchess's knee, while plates and dishes crashed around it--once\nmore the shriek of the Gryphon, the squeaking of the Lizard's\nslate-pencil, and the choking of the suppressed guinea-pigs,\nfilled the air, mixed up with the distant sobs of the miserable\nMock Turtle.\n\nSo she sat on, with closed eyes, and half believed herself in\nWonderland, though she knew she had but to open them again, and\nall would change to dull reality--the grass would be only\nrustling in the wind, and the pool rippling to the waving of the\nreeds--the rattling teacups would change to tinkling sheep-\nbells, and the Queen's shrill cries to the voice of the shepherd\nboy--and the sneeze of the baby, the shriek of the Gryphon, and\nall the other queer noises, would change (she knew) to the\nconfused clamour of the busy farm-yard--while the lowing of the\ncattle in the distance would take the place of the Mock Turtle's\nheavy sobs.\n\nLastly, she pictured to herself how this same little sister of\nhers would, in the after-time, be herself a grown woman; and how\nshe would keep, through all her riper years, the simple and\nloving heart of her childhood:  and how she would gather about\nher other little children, and make THEIR eyes bright and eager\nwith many a strange tale, perhaps even with the dream of\nWonderland of long ago:  and how she would feel with all their\nsimple sorrows, and find a pleasure in all their simple joys,\nremembering her own child-life, and the happy summer days.\n\n                         THE END\n";

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

})();
