import re

from ke.parser import (
    Parser,
    Concat,
    Either,
    Def,
    Operator,
    Macro,
    Range,
    Literal,
    Nothing,
)
from ke import asm
from ke.errors import CompileError

parser = Parser()

EMPTY = asm.Literal("")
EMPTY_CONCAT = asm.Concat([])

builtin_macros = {
    "#any": asm.ANY,
    "#newline_character": asm.NEWLINE,
    "#newline": asm.Either([asm.NEWLINE, asm.Literal("\r\n")]),
    "#not_newline": asm.NEWLINE.invert(),
    "#any_at_all": asm.Either([asm.ANY, asm.NEWLINE]),
    "#linefeed": asm.LINEFEED,
    "#carriage_return": asm.CARRIAGE_RETURN,
    "#windows_newline": asm.Literal("\r\n"),
    "#tab": asm.TAB,
    "#digit": asm.DIGIT,
    "#letter": asm.LETTER,
    "#lowercase": asm.LOWERCASE,
    "#uppercase": asm.UPPERCASE,
    "#space": asm.SPACE,
    "#token_character": asm.TOKEN_CHARACTER,
    "#start_string": asm.START_STRING,
    "#end_string": asm.END_STRING,
    "#start_line": asm.START_LINE,
    "#end_line": asm.END_LINE,
    "#word_boundary": asm.WORD_BOUNDARY,
    "#quote": asm.Literal("'"),
    "#double_quote": asm.Literal('"'),
    "#left_brace": asm.Literal("["),
    "#right_brace": asm.Literal("]"),
    "#vertical_tab": asm.Literal("\v"),
    "#formfeed": asm.Literal("\f"),
    "#bell": asm.Literal("\a"),
    "#backspace": asm.Literal("\b"),
}
for (
    name
) in "linefeed carriage_return tab digit letter lowercase uppercase space token_character word_boundary".split():
    macro = builtin_macros["#" + name]
    builtin_macros["#not_" + name] = macro.invert()
for names in """\
linefeed lf
carriage_return cr
tab t
digit d
letter l
lowercase lc
uppercase uc
space s
token_character tc
word_boundary wb""".splitlines():
    long, short = names.split()
    builtin_macros["#" + short] = builtin_macros["#" + long]
    builtin_macros["#n" + short] = builtin_macros["#not_" + long]
for names in """\
any a
any_at_all aaa
newline n
newline_character nc
not_newline nn
windows_newline crlf
start_string ss
end_string es
start_line sl
end_line el
quote q
double_quote dq
left_brace lb
right_brace rb""".splitlines():
    long, short = names.split()
    builtin_macros["#" + short] = builtin_macros["#" + long]


def invert_operator(n, expr):
    if n is not None:
        raise CompileError("Invert operator does not accept name")
    if isinstance(expr, asm.Literal) and len(expr.string) == 1:
        return asm.CharacterClass([expr.string], True)

    try:
        return expr.invert()
    except AttributeError:
        raise CompileError(
            "Expression %s cannot be inverted (maybe try [not lookahead <expression>]?)"
            % expr.to_regex(
                syntax="python"
            )  # TODO: maybe pass syntax here for better message?
        )


builtin_operators = {"capture": lambda n, s: asm.Capture(n, s), "not": invert_operator}
for names in """\
capture c
not n""".splitlines():
    long, short = names.split()
    builtin_operators[short] = builtin_operators[long]


def compile(ast):
    macros = dict(builtin_macros)
    return asm.Setting("", compile_ast(ast, macros))


def compile_ast(ast, macros):
    return converters[type(ast)](ast, macros)


def compile_concat(concat, macros):
    defs = [x for x in concat.items if isinstance(x, Def)]
    regexes = [x for x in concat.items if not isinstance(x, Def)]

    for d in defs:
        if d.name in macros:
            raise KeyError("Macro %s already defined" % d.name)
        macros[d.name] = compile_ast(d.subregex, macros)
    compiled = [compile_ast(s, macros) for s in regexes]
    compiled = [x for x in compiled if is_not_empty(x)]
    for d in defs:
        del macros[d.name]

    if not compiled:
        return EMPTY
    if len(compiled) == 1:
        compiled, = compiled
        return compiled
    return asm.Concat(compiled)


def is_not_empty(node):
    return node != EMPTY and node != EMPTY_CONCAT


def def_error(d, macros):
    # TODO: AST transformation that takes Defs out of Either, etc' so we can define them anywhere with sane semantics
    raise ValueError(
        "temporarily, macro definition is only allowed directly under Concat([])"
    )


def compile_either(e, macros):
    compiled = [compile_ast(s, macros) for s in e.items]
    if all(is_single_char(c) for c in compiled):
        characters = []
        for c in compiled:
            if isinstance(c, asm.Literal) and len(c.string) == 1:
                characters.append(c.string)
            elif isinstance(c, asm.CharacterClass):
                characters += c.characters
        return asm.CharacterClass(characters, False)
    return asm.Either(compiled)


def is_single_char(c):
    return (isinstance(c, asm.Literal) and len(c.string) == 1) or isinstance(
        c, asm.CharacterClass
    )


REPEAT_OPERATOR = re.compile(r"(?:(\d+)-(\d+)|(\d+)\+|(\d+))$")


def compile_operator(o, macros):
    if o.op_name == "comment":
        return EMPTY
    sub = compile_ast(o.subregex, macros)
    if not is_not_empty(sub):
        raise CompileError("Operator %s not allowed to have empty body" % o.op_name)
    m = REPEAT_OPERATOR.match(o.op_name)
    if m:
        min, max, min2, exact = m.groups()
        if min2:
            min = int(min2)
            max = None
        elif exact:
            min = max = int(exact)
        else:
            min = int(min)
            max = int(max)
        if min == max == 0:
            return EMPTY
        return asm.Multiple(min, max, True, sub)
    if o.op_name not in builtin_operators:
        raise CompileError("Operator %s does not exist" % o.op_name)
    return builtin_operators[o.op_name](o.name, sub)


def compile_macro(macro, macros):
    if macro.name not in macros:
        raise CompileError(
            "Macro %s does not exist, perhaps you defined it in the wrong scope?"
            % macro.name
        )
    return macros[macro.name]


def compile_range(range, _):
    if character_category(range.start) != character_category(range.end):
        raise CompileError(
            "Range start and end not of the same category: '%s' is a %s but '%s' is a %s"
            % (
                range.start,
                character_category(range.start),
                range.end,
                character_category(range.end),
            )
        )
    if range.start >= range.end:
        raise CompileError(
            "Range start not before range end: '%s' >= '%s'" % (range.start, range.end)
        )
    return asm.CharacterClass([(range.start, range.end)], False)


def character_category(char):
    if char.islower():
        return "LOWERCASE"
    if char.isupper():
        return "UPPERCASE"
    if char.isdigit():
        return "DIGIT"
    assert False, "Unknown character class: %s" % char


converters = {
    Concat: compile_concat,
    Either: compile_either,
    Def: def_error,
    Operator: compile_operator,
    Macro: compile_macro,
    Range: compile_range,
    Literal: lambda l, _: asm.Literal(l.string),
    Nothing: lambda _n, _: EMPTY,
}


def add_builtin_macro(long, short, definition):
    ast = compile_ast(parser.parse(definition), builtin_macros)
    builtin_macros[long] = ast
    if short:
        builtin_macros[short] = ast


add_builtin_macro("#integer", "#int", "[[0-1 '-'] [1+ #digit]]")
add_builtin_macro("#unsigned_integer", "#uint", "[1+ #digit]")
add_builtin_macro("#real", None, "[#int [0-1 '.' #uint]]")
add_builtin_macro(
    "#float",
    None,
    "[[0-1 '-'] [[#uint '.' [0-1 #uint] | '.' #uint] [0-1 #exponent] | #int #exponent] #exponent=[['e' | 'E'] [0-1 ['+' | '-']] #uint]]",
)
add_builtin_macro("#hex_digit", "#hexd", "[#digit | #a..f | #A..F]")
add_builtin_macro("#hex_number", "#hexn", "[1+ #hex_digit]")
# this is not called #word because in legacy regex \w (prounounced "word character") is #token_character and I fear confusion
add_builtin_macro("#letters", None, "[1+ #letter]")
add_builtin_macro("#token", None, "[#letter | '_'][0+ #token_character]")
add_builtin_macro("#capture_0+_any", "#c0", "[capture 0+ #any]")
add_builtin_macro("#capture_1+_any", "#c1", "[capture 1+ #any]")
