import re
from collections import namedtuple
from ke import numrange

from ke.types import Flavor
from ke._errors import CompileError

PYTHON_IDENTIFIER = re.compile(r"^[a-z_]\w*$", re.I)


class Asm(object):
    def to_regex(self, flavor, capture_names, wrap=False):
        raise NotImplementedError()

    def maybe_wrap(self, should_wrap, regex):
        if not should_wrap:
            return regex
        return "(?:%s)" % regex

    def is_empty(self):
        raise NotImplementedError()


# python's standard re.escape() with our adjustments
_special_chars_map = {i: "\\" + chr(i) for i in b"()[]{}?*+|^$\\.\t\n\r\v\f"}

_kleen_special_chars_map = {
    ord("\t"): "t",
    ord("\n"): "n",
    ord("\r"): "r",
    ord("\v"): "v",
    ord("\f"): "f",
}

_char_escapes = {chr(k): "\\" + v for k, v in _kleen_special_chars_map.items()}


class Literal(namedtuple("Literal", ["string"]), Asm):
    def to_regex(self, flavor, capture_names, wrap=False):
        escaped = (
            self.escape(self.string)
            .translate(_kleen_special_chars_map)
            .replace("\\ ", " ")
        )
        return self.maybe_wrap(wrap and len(self.string) != 1, escaped)

    def escape(self, pattern):
        """
        Escape special characters in a string.
        """
        if isinstance(pattern, str):
            return pattern.translate(_special_chars_map)
        else:
            pattern = str(pattern, "latin1")
            return pattern.translate(_special_chars_map).encode("latin1")

    def is_empty(self):
        return not self.string


class Multiple(namedtuple("Multiple", ["min", "max", "is_greedy", "sub"]), Asm):
    def to_regex(self, flavor, capture_names, wrap=False):
        if self.min == 0 and self.max is None:
            op = "*"
        elif self.min == 1 and self.max is None:
            op = "+"
        elif self.min == 0 and self.max == 1:
            op = "?"
        elif self.min == 0 and self.max == 0:
            return ""
        elif self.min == self.max:
            if self.min != 1 and self.max != 1:
                op = "{%d}" % self.min
            else:
                op = ""
        else:
            op = "{%s,%s}" % (self.min or "", self.max or "")
        if not self.is_greedy:
            op += "?"
        return self.maybe_wrap(
            wrap, self.sub.to_regex(flavor, capture_names, wrap=True) + op
        )

    def is_empty(self):
        return self.sub.is_empty()


class Either(namedtuple("Either", ["subs"]), Asm):
    def to_regex(self, flavor, capture_names, wrap=False):
        return self.maybe_wrap(
            wrap,
            "|".join(s.to_regex(flavor, capture_names, wrap=False) for s in self.subs),
        )

    def is_empty(self):
        return all(s.is_empty() for s in self.subs)


class Concat(namedtuple("Concat", ["subs"]), Asm):
    def to_regex(self, flavor, capture_names, wrap=False):
        return self.maybe_wrap(
            wrap,
            "".join(
                s.to_regex(flavor, capture_names, wrap=self.should_wrap(s))
                for s in self.subs
            ),
        )

    def should_wrap(self, s):
        return isinstance(s, Either) and len(self.subs) > 1

    def is_empty(self):
        return all(s.is_empty() for s in self.subs)


class CharacterClass(namedtuple("CharacterClass", ["characters", "inverted"]), Asm):
    def is_empty(self):
        return False

    def to_regex(self, capture_names, flavor, wrap=False):
        if len(self.characters) == 0:
            if self.inverted:
                return "."  # Requires DOTALL flag.
            else:
                # Empty class (how did we get one?!) => need an expression that never matches.
                # http://stackoverflow.com/a/942122/239657: a lookahead of empty string
                # always matches, negative lookahead never does.
                # The dot afterward is to express an exactly-one-char pattern,
                # though it won't matter.
                return "(?!)."
        if len(self.characters) == 1:
            c = self.characters[0]
            if isinstance(c, str):
                if not self.inverted:
                    if len(c) == 1:
                        if c in _char_escapes:
                            return _char_escapes[c]
                        return Literal(c).to_regex(flavor, capture_names)
                    return c
                elif c.startswith("\\") and c[1:] in ("d", "s", "w"):
                    return c.upper()
        return "[%s%s]" % ("^" if self.inverted else "", self.join_characters())

    NEED_ESCAPING = "^-[]\\"

    def escape_char(self, c):
        return _char_escapes.get(c, "\\" + c if c in self.NEED_ESCAPING else c)

    def join_characters(self):
        return "".join(
            sorted(
                self.escape_char(c)
                if isinstance(c, str)
                else "-".join(map(self.escape_char, c))
                for c in self.characters
            )
        )

    def invert(self):
        return CharacterClass(self.characters, not self.inverted)


ANY = CharacterClass([], inverted=True)
NEWLINE = CharacterClass([r"\r", r"\n", r"\u2028", r"\u2029"], False)
LINEFEED = CharacterClass([r"\n"], False)
CARRIAGE_RETURN = CharacterClass([r"\r"], False)
TAB = CharacterClass([r"\t"], False)
DIGIT = CharacterClass([r"\d"], False)
LETTER = CharacterClass([["a", "z"], ["A", "Z"]], False)
LOWERCASE = CharacterClass([["a", "z"]], False)
UPPERCASE = CharacterClass([["A", "Z"]], False)
SPACE = CharacterClass([r"\s"], False)
TOKEN_CHARACTER = CharacterClass([r"\w"], False)


class Boundary(namedtuple("Boundary", ["character", "reverse"]), Asm):
    def to_regex(self, flavor, capture_names, wrap=False):
        return self.character

    def is_empty(self):
        return False

    def invert(self):
        if self.reverse is None:
            raise CompileError("Cannot invert %s" % (self,))
        return Boundary(self.reverse, self.character)


class NumberRange(namedtuple("NumberRange", ["start", "end"]), Asm):
    def to_regex(self, flavor, capture_names, wrap=False):
        regex = numrange.number_range_to_regex(self.start, self.end)
        return self.maybe_wrap("|" in regex or wrap, regex)

    def is_empty(self):
        return False


START_LINE = Boundary(r"^", None)
END_LINE = Boundary(r"$", None)
START_STRING = Boundary(r"\A", None)
# TODO: \z matches purely at string end; \Z also matches before \n\z.
# Should we expose \z or the pragmatic \Z you usually want?  Or both?
END_STRING = Boundary(r"\Z", None)
WORD_BOUNDARY = Boundary(r"\b", r"\B")


class Repeat(namedtuple("Repeat", ["name"]), Asm):
    def to_regex(self, flavor, capture_names, wrap=False):
        if self.name in capture_names:
            try:
                # we must add 1 as regex starts repeat count from 1 and our list indexes from 0
                index = capture_names.index(self.name) + 1
            except ValueError:
                raise CompileError(
                    f"No captured index for {self.name} that can be repeated, perhaps capture name is wrong?"
                )
        else:
            try:
                index = int(self.name)
                if index > len(capture_names):
                    raise CompileError("Index exceeded bounds for repeat.")
            except ValueError:
                raise CompileError(
                    f"No capture found to repeat for index or name: {self.name}"
                )
        return self.maybe_wrap(wrap, rf"\{index}")


class Capture(namedtuple("Capture", ["name", "sub"]), Asm):
    def to_regex(self, flavor, capture_names, wrap=False):
        if self.name is not None and self.name in capture_names:
            raise CompileError("Capture name must be unique")
        capture_name = self.name_regex(flavor)
        # the reason we call self.name_regex before and not self.name directly is for validation
        capture_names.append(self.name)
        return "(%s%s)" % (
            capture_name,
            self.sub.to_regex(flavor, capture_names, wrap=False),
        )

    def is_empty(self):
        return self.sub.is_empty()

    def name_regex(self, flavor):
        if self.name is None:
            return ""
        if not self.name:
            raise CompileError("Capture name cannot be empty")
        if not PYTHON_IDENTIFIER.match(self.name):
            raise CompileError("invalid capture group name: %s" % self.name)
        if flavor == Flavor.JAVASCRIPT:
            return "?<%s>" % self.name
        return "?P<%s>" % self.name


class ParensSyntax(namedtuple("ParensSyntax", ["name", "sub"]), Asm):
    INVERTED = None

    def to_regex(self, flavor, capture_names, wrap=False):
        if self.name is not None:
            self.error("doesn't support naming")
        return f"({self.HEADER}{self.sub.to_regex(flavor,capture_names, wrap=False)})"

    def invert(self):
        if self.INVERTED is None:
            self.error("doesn't support inverting")
        return self.INVERTED(None, self.sub)

    def error(self, message):
        raise CompileError(f"{self.__class__.__name__} {message}")

    def is_empty(self):
        return self.sub.is_empty()


class Lookahead(ParensSyntax):
    HEADER = "?="


class NegativeLookahead(ParensSyntax):
    HEADER = "?!"
    INVERTED = Lookahead


Lookahead.INVERTED = NegativeLookahead


class Lookbehind(ParensSyntax):
    HEADER = "?<="


class NegativeLookbehind(ParensSyntax):
    HEADER = "?<!"
    INVERTED = Lookbehind


Lookbehind.INVERTED = NegativeLookbehind


class InlineFlag(namedtuple("InlineFlag", ["flag_character", "name", "sub"]), Asm):
    A = "a"
    L = "L"
    U = "u"
    I = "i"
    M = "m"
    S = "s"
    regex_to_kleenexp = {
        A: "ascii_only",
        L: "locale_dependent",
        U: "unicode",
        I: "ignore_case",
        M: "multiline",
        S: "any_matches_all",
    }
    UNSET = "unset"
    UNSETTABLE = set([I, M, S])

    def to_regex(self, flavor, capture_names, wrap=False):
        # Here we break the tree structure, using this specialized
        # function to create a flagging expression for the rest of
        # the subtree. The only flag in a flagging sequence that
        # reaches the to_regex() method is the first one in the
        # sequence (there may be other sequences). This is necessary
        # because the parenthesis wrapping and regex legality are
        # dependent on the whole flagging expression.
        return self.flag_sub_expression(flavor, capture_names, wrap)

    def flag_sub_expression(self, flavor, capture_names, wrap):
        # true_flags is a dictionary instead of a list to allow
        # overriding previous flag declarations - for example:
        # 'ignore_case ignore_case:unset' should give '(?-i:)'
        # rather than '(?i-i:)' (this behaviour might be replaced
        # with an error in the future).
        true_flags = {self.flag_character: self}
        curr = self.sub
        while isinstance(curr, InlineFlag):
            true_flags[curr.flag_character] = curr
            curr = curr.sub
        setting = []
        unsetting = []
        flags = list(true_flags.values())
        for flag in flags:
            if flag.name == InlineFlag.UNSET:
                if flag.name in InlineFlag.UNSETTABLE:
                    unsetting.append(flag)
                else:
                    raise CompileError(
                        f"Unsetting not supported for this flag: "
                        f"{InlineFlag.regex_to_kleenexp[self.flag_character]}"
                    )
            else:
                setting.append(flag)

        setting_str = "".join([flag.flag_character for flag in setting])
        unsetting_str = (
            "-" + "".join([flag.flag_character for flag in unsetting])
            if len(unsetting) > 0
            else ""
        )
        return f"(?{setting_str}{unsetting_str}:{curr.to_regex(flavor, capture_names, wrap)})"

    def is_empty(self):
        return self.sub.is_empty()


class Setting(namedtuple("Setting", ["setting", "sub"]), Asm):
    def to_regex(self, flavor, capture_names, wrap=False):
        if not self.setting:
            return self.sub.to_regex(flavor, capture_names, wrap=False)
        # no need to wrap because settings have global effect and match 0 characters,
        # so e.g. /(?m)ab|c/ == /(?:(?m)ab)|c/, however, child may need to wrap
        # or we risk accidental /(?m)ab?/ instead of /(?m)(ab)?/
        return "(?%s)%s" % (
            self.setting,
            self.sub.to_regex(flavor, capture_names, wrap=wrap),
        )

    def is_empty(self):
        return self.sub.is_empty()


def assemble(asm, flavor=Flavor.PYTHON):
    capture_names = []
    return asm.to_regex(flavor, capture_names, wrap=False)
