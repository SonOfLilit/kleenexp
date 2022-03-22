import pytest
from ke.parser import Concat, Either, Def, Operator, Macro, Range, Literal, Nothing
from ke import asm
from ke.compiler import compile as _compile, CompileError


def compile(ast):
    result = _compile(ast)
    assert result.setting == ""
    return result.sub


def test_literal():
    assert compile(Literal("abc")) == asm.Literal("abc")


def test_concat():
    assert compile(Concat(list(map(Literal, "abc")))) == asm.Concat(
        [asm.Literal("a"), asm.Literal("b"), asm.Literal("c")]
    )


def test_either():
    assert compile(Either([Literal("abc"), Literal("def")])) == asm.Either(
        [asm.Literal("abc"), asm.Literal("def")]
    )


def test_macro():
    assert compile(Macro("#digit")) == asm.DIGIT


def test_nothing():
    assert compile(Nothing()) == asm.Literal("")
    assert compile(Concat([Nothing(), Nothing()])) == asm.Literal("")


def test_op():
    assert compile(Operator("capture", None, Literal("Yo"))) == asm.Capture(
        None, asm.Literal("Yo")
    )
    assert compile(Operator("capture", "name", Literal("Yo"))) == asm.Capture(
        "name", asm.Literal("Yo")
    )
    assert compile(Operator("0-1", None, Literal("Yo"))) == asm.Multiple(
        0, 1, True, asm.Literal("Yo")
    )
    assert compile(Operator("1+", None, Literal("Yo"))) == asm.Multiple(
        1, None, True, asm.Literal("Yo")
    )


def test_def():
    assert compile(Concat([Def("#x", Literal("x")), Macro("#x")])) == asm.Literal("x")
    assert compile(Concat([Macro("#x"), Def("#x", Literal("x"))])) == asm.Literal("x")


def test_def_scoping():
    assert compile(
        Concat([Concat([Macro("#x")]), Def("#x", Literal("x"))])
    ) == asm.Literal("x")
    with pytest.raises(CompileError):
        compile(Concat([Concat([Def("#x", Literal("x"))]), Macro("#x")]))


def test_builtin_macros():
    assert compile(Macro("#any")) == asm.ANY
    not_linefeed = asm.CharacterClass([r"\n"], inverted=True)
    assert compile(Macro("#not_linefeed")) == not_linefeed
    assert compile(Macro("#windows_newline")) == asm.Literal("\r\n")
    assert compile(Concat([Macro("#sl"), Literal("yo"), Macro("#el")])) == asm.Concat(
        [asm.Boundary("^", None), asm.Literal("yo"), asm.Boundary("$", None)]
    )
    assert compile(Macro("#quote")) == asm.Literal("'")
    assert compile(Macro("#double_quote")) == asm.Literal('"')
    assert compile(Macro("#left_brace")) == asm.Literal("[")
    assert compile(Macro("#right_brace")) == asm.Literal("]")


def test_short_names():
    macro_names = [
        ("linefeed", "lf"),
        ("not_linefeed", "nlf"),
        ("carriage_return", "cr"),
        ("not_carriage_return", "ncr"),
        ("tab", "t"),
        ("not_tab", "nt"),
        ("digit", "d"),
        ("not_digit", "nd"),
        ("letter", "l"),
        ("not_letter", "nl"),
        ("lowercase", "lc"),
        ("not_lowercase", "nlc"),
        ("uppercase", "uc"),
        ("not_uppercase", "nuc"),
        ("space", "s"),
        ("not_space", "ns"),
        ("token_character", "tc"),
        ("not_token_character", "ntc"),
        ("word_boundary", "wb"),
        ("not_word_boundary", "nwb"),
        ("any", "a"),
        ("windows_newline", "crlf"),
        ("start_string", "ss"),
        ("end_string", "es"),
        ("start_line", "sl"),
        ("end_line", "el"),
        ("quote", "q"),
        ("double_quote", "dq"),
        ("left_brace", "lb"),
        ("right_brace", "rb"),
        ("integer", "int"),
        ("unsigned_integer", "uint"),
        ("hex_digit", "hexd"),
        ("hex_number", "hexn"),
    ]
    for long, short in macro_names:
        assert compile(Macro("#" + long)) == compile(Macro("#" + short))


def test_range_macros():
    assert compile(Range("a", "f")) == asm.CharacterClass([("a", "f")], False)
    assert compile(Range("B", "Z")) == asm.CharacterClass([("B", "Z")], False)
    assert compile(Range("2", "6")) == asm.CharacterClass([("2", "6")], False)
    assert compile(Either([Range("a", "f"), Macro("#digit")])) == asm.CharacterClass(
        [("a", "f"), r"\d"], False
    )
    with pytest.raises(CompileError):
        compile(Range("a", "5"))
    with pytest.raises(CompileError):
        compile(Range("a", "F"))
    with pytest.raises(CompileError):
        compile(Range("c", "a"))
    with pytest.raises(CompileError):
        compile(Range("a", "a"))
    with pytest.raises(AssertionError):
        compile(Range("!", ","))


def test_character_class():
    assert compile(Either([])) == asm.CharacterClass([], inverted=False)
    assert compile(Either([Literal("a"), Literal("b")])) == asm.CharacterClass(
        ["a", "b"], inverted=False
    )
    assert compile(
        Operator("not", None, Either([Literal("a"), Literal("b")]))
    ) == asm.CharacterClass(["a", "b"], inverted=True)
    with pytest.raises(CompileError):
        compile(Operator("not", None, Either([Literal("a"), Literal("bc")])))
    assert compile(
        Either([Literal("a"), Literal("b"), Literal("0")])
    ) == asm.CharacterClass(["a", "b", "0"], inverted=False)
    assert compile(Either([Literal("a"), Macro("#d")])) == asm.CharacterClass(
        ["a", r"\d"], inverted=False
    )
    assert compile(Either([Literal("["), Literal("]")])) == asm.CharacterClass(
        ["[", "]"], inverted=False
    )
    assert compile(
        Concat([Either([Literal("["), Literal("]")])])
    ) == asm.CharacterClass(["[", "]"], inverted=False)


def test_invert():
    assert compile(Operator("not", None, Either([]))) == asm.CharacterClass(
        [], inverted=True
    )
    assert compile(Operator("not", None, Literal("a"))) == asm.CharacterClass(
        ["a"], inverted=True
    )
    assert compile(
        Operator("not", None, Either([Literal("a"), Literal("b")]))
    ) == asm.CharacterClass(["a", "b"], inverted=True)
    assert compile(
        Operator("not", None, Either([Literal("a"), Macro("#d")]))
    ) == asm.CharacterClass(["a", r"\d"], inverted=True)
    assert compile(
        Operator("not", None, Either([Literal("a"), Macro("#l")]))
    ) == asm.CharacterClass(["a", ["a", "z"], ["A", "Z"]], inverted=True)


def test_comment():
    assert compile(Operator("comment", None, Either([]))) == asm.Literal("")
    assert compile(Operator("comment", None, Literal("a"))) == asm.Literal("")
    assert compile(
        Operator("comment", None, Either([Literal("a"), Literal("b")]))
    ) == asm.Literal("")
    assert compile(
        Concat([Macro("#sl"), Operator("comment", None, Literal("yo")), Macro("#el")])
    ) == asm.Concat([asm.Boundary("^", None), asm.Boundary("$", None)])
