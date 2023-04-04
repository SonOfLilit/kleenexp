import pytest
from ke.asm import (
    assemble,
    Literal,
    Multiple,
    Either,
    Concat,
    CharacterClass,
    DIGIT,
    Capture,
    Setting,
    Boundary,
    START_LINE,
    START_STRING,
    WORD_BOUNDARY,
    InlineFlag,
)
from ke._errors import CompileError


def test_literal():
    assert assemble(Literal("abc")) == "abc"
    assert assemble(Literal("^[a](b)$")) == r"\^\[a\]\(b\)\$"


def test_multiple():
    assert assemble(Multiple(0, 1, True, Literal("a"))) == "a?"
    assert assemble(Multiple(0, None, True, Literal("a"))) == "a*"
    assert assemble(Multiple(1, None, True, Literal("a"))) == "a+"
    assert assemble(Multiple(2, 2, True, Literal("a"))) == "a{2}"
    assert assemble(Multiple(None, 2, True, Literal("a"))) == "a{,2}"
    assert assemble(Multiple(2, None, True, Literal("a"))) == "a{2,}"
    assert assemble(Multiple(2, 5, True, Literal("a"))) == "a{2,5}"


def test_multiple_subexpression():
    assert assemble(Multiple(0, 1, True, Literal("abc"))) == "(?:abc)?"
    assert assemble(Multiple(0, None, True, Literal("abc"))) == "(?:abc)*"
    assert assemble(Multiple(1, None, True, Literal("abc"))) == "(?:abc)+"
    assert (
        assemble(Multiple(0, 1, True, Multiple(2, 3, True, Literal("a"))))
        == "(?:a{2,3})?"
    )


def test_multiple_nongreedy():
    assert assemble(Multiple(0, 1, False, Literal("a"))) == "a??"
    assert assemble(Multiple(0, None, False, Literal("a"))) == "a*?"
    assert assemble(Multiple(1, None, False, Literal("a"))) == "a+?"
    assert assemble(Multiple(2, 2, False, Literal("a"))) == "a{2}?"


def test_either():
    assert assemble(Either(list(map(Literal, "abc")))) == "a|b|c"
    assert assemble(Either(list(map(Literal, ["123", "45", ""])))) == "123|45|"
    assert (
        assemble(Multiple(1, None, True, Either(list(map(Literal, ["123", "45", ""])))))
        == "(?:123|45|)+"
    )
    assert (
        assemble(Concat([Literal("a"), Either([Literal("b"), Literal("c")])]))
        == "a(?:b|c)"
    )
    assert assemble(Concat([Either([Literal("b"), Literal("c")])])) == "b|c"


def test_concat():
    assert assemble(Concat(list(map(Literal, "abc")))) == "abc"
    assert assemble(Concat(list(map(Literal, ["123", "45", ""])))) == "12345"
    assert (
        assemble(Concat([Literal("123"), Multiple(0, 1, True, Literal("abc"))]))
        == "123(?:abc)?"
    )


def test_character_class():
    assert assemble(DIGIT) == r"\d"
    assert assemble(Concat([DIGIT, DIGIT])) == r"\d\d"
    assert assemble(Concat([DIGIT, Multiple(0, None, True, DIGIT)])) == r"\d\d*"
    assert assemble(CharacterClass(["a"], False)) == r"a"
    assert assemble(CharacterClass(["\n"], False)) == r"\n"
    assert assemble(CharacterClass(["["], False)) == r"\["
    assert assemble(CharacterClass(["{"], False)) == r"\{"
    assert assemble(CharacterClass(["}"], False)) == r"\}"
    assert assemble(CharacterClass(["?"], False)) == r"\?"
    assert assemble(CharacterClass(["a", "b"], False)) == r"[ab]"
    assert assemble(CharacterClass(["b", "a"], False)) == r"[ab]"
    assert (
        assemble(CharacterClass(["^", "\n", "\t", "-", "[", "]", "\\"], False))
        == r"[\-\[\\\]\^\n\t]"
    )
    assert assemble(CharacterClass(["a"], inverted=True)) == r"[^a]"
    assert assemble(CharacterClass(["a", "b"], inverted=True)) == r"[^ab]"
    assert assemble(CharacterClass([["a", "z"]], False)) == r"[a-z]"
    assert assemble(CharacterClass([["a", "z"], ["0", "5"]], False)) == r"[0-5a-z]"
    assert (
        assemble(CharacterClass([["a", "z"], ["0", "5"], "X"], False)) == r"[0-5Xa-z]"
    )
    assert assemble(CharacterClass([["a", "z"]], inverted=True)) == r"[^a-z]"
    assert (
        assemble(CharacterClass([["a", "z"], ["0", "5"]], inverted=True))
        == r"[^0-5a-z]"
    )


def test_capture():
    assert assemble(Capture(None, DIGIT)) == r"(\d)"
    assert (
        assemble(
            Concat([Literal("No. "), Capture("number", Multiple(1, None, True, DIGIT))])
        )
        == r"No\. (?P<number>\d+)"
    )


def test_setting():
    assert assemble(Setting("m", Literal("a"))) == "(?m)a"
    assert assemble(Multiple(0, 1, True, Setting("m", Literal("ab")))) == "(?m)(?:ab)?"


def test_boundary():
    assert assemble(Boundary(r"\b", r"\B")) == r"\b"
    assert Boundary(r"\b", r"\B").invert() == Boundary(r"\B", r"\b")
    with pytest.raises(CompileError):
        Boundary(r"\A", None).invert()
    assert assemble(START_LINE) == r"^"
    assert assemble(START_STRING) == r"\A"
    assert assemble(WORD_BOUNDARY) == r"\b"


def test_inline_flags():
    assert assemble(InlineFlag("a", None, Literal("test"))) == r"(?a:test)"
    assert assemble(InlineFlag("L", None, Literal("test"))) == r"(?L:test)"
    assert assemble(InlineFlag("u", None, Literal("test"))) == r"(?u:test)"
    assert assemble(InlineFlag("i", None, Literal("test"))) == r"(?i:test)"
    assert assemble(InlineFlag("m", None, Literal("test"))) == r"(?m:test)"
    assert assemble(InlineFlag("s", None, Literal("test"))) == r"(?s:test)"
    assert assemble(InlineFlag("i", "unset", Literal("test"))) == r"(?-i:test)"
    assert assemble(InlineFlag("m", "unset", Literal("test"))) == r"(?-m:test)"
    assert assemble(InlineFlag("s", "unset", Literal("test"))) == r"(?-s:test)"
    assert (
        assemble(InlineFlag("s", None, InlineFlag("s", None, Literal("test"))))
        == r"(?s:test)"
    )
    assert (
        assemble(InlineFlag("s", "unset", InlineFlag("s", "unset", Literal("test"))))
        == r"(?-s:test)"
    )
    with pytest.raises(CompileError):
        assemble(InlineFlag("a", "unset", Literal("test")))
    with pytest.raises(CompileError):
        assemble(InlineFlag("L", "unset", Literal("test")))
    with pytest.raises(CompileError):
        assemble(InlineFlag("u", "unset", Literal("test")))

    assert (
        assemble(
            InlineFlag(
                "a",
                None,
                InlineFlag(
                    "L",
                    None,
                    InlineFlag(
                        "u",
                        None,
                        InlineFlag(
                            "i",
                            None,
                            InlineFlag(
                                "m",
                                None,
                                InlineFlag(
                                    "s",
                                    None,
                                    InlineFlag(
                                        "i",
                                        "unset",
                                        InlineFlag(
                                            "m",
                                            "unset",
                                            InlineFlag("s", "unset", Literal("test")),
                                        ),
                                    ),
                                ),
                            ),
                        ),
                    ),
                ),
            )
        )
        == r"(?aLu-ims:test)"
    )

    assert (
        assemble(
            InlineFlag(
                "i",
                "unset",
                InlineFlag(
                    "a",
                    None,
                    InlineFlag(
                        "L",
                        None,
                        InlineFlag(
                            "u",
                            None,
                            InlineFlag(
                                "m",
                                "unset",
                                InlineFlag(
                                    "m",
                                    None,
                                    InlineFlag(
                                        "i",
                                        None,
                                        InlineFlag(
                                            "s",
                                            None,
                                            InlineFlag("s", "unset", Literal("test")),
                                        ),
                                    ),
                                ),
                            ),
                        ),
                    ),
                ),
            )
        )
        == r"(?iaLum-s:test)"
    )
