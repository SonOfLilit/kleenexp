import re

from re2.parser import Concat, Either, Def, Operator, Macro, Literal, Nothing
from re2 import asm

EMPTY = asm.Literal('')
EMPTY_CONCAT = asm.Concat([])

class CompileError(Exception): pass

builtin_macros = {
    '#digit': asm.DIGIT
}

builtin_operators = {
    'capture': lambda s: asm.Capture(None, s)
}

def compile(ast, macros=None):
    if macros is None:
        macros = dict(builtin_macros)
    return converters[type(ast)](ast, macros)

def compile_concat(concat, macros):
    defs = filter(lambda x: isinstance(x, Def), concat.items)
    regexes = filter(lambda x: not isinstance(x, Def), concat.items)

    for d in defs:
        if d.name in macros:
            raise KeyError('Macro %s already defined' % d.name)
        macros[d.name] = compile(d.subregex, macros)
    compiled = [compile(s, macros) for s in regexes]
    compiled = filter(is_not_empty, compiled)
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
    raise ValueError('temporarily, macro definition is only allowed directly under Concat([])')

REPEAT_OPERATOR = re.compile('(\d+)-(\d+)|(\d+)+')
def compile_operator(o, macros):
    sub = compile(o.subregex, macros)
    m = REPEAT_OPERATOR.match(o.name)
    if m:
        min, max, min2 = m.groups()
        if min2:
            min = int(min2)
            max = None
        else:
            min = int(min)
            max = int(max)
        return asm.Multiple(min, max, True, sub)
    if o.name not in builtin_operators:
        raise CompileError('Operator %s does not exist' % o.name)
    return builtin_operators[o.name](sub)

def compile_macro(macro, macros):
    if macro.name not in macros:
        raise CompileError('Macro %s does not exist, perhaps you defined it in the wrong scope?' % macro.name)
    return macros[macro.name]

converters = {
    Concat: compile_concat,
    Either: lambda e, macros: asm.Either([compile(sub, macros) for sub in e.items]),
    Def: def_error,
    Operator: compile_operator,
    Macro: compile_macro,
    Literal: lambda l, _: asm.Literal(l.string),
    Nothing: lambda _n, _: EMPTY
}
