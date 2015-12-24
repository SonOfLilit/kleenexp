import re

from re2.parser import Concat, Either, Def, Operator, Macro, Literal, Nothing
from re2 import asm

builtin_macros = {
    '#digit': asm.DIGIT
}

builtin_operators = {
    'capture': lambda s: asm.Capture(None, s)
}

converters = {
    Concat: lambda c, macros: asm.Concat([compile(sub, macros) for sub in c.items]),
    Either: lambda e, macros: asm.Either([compile(sub, macros) for sub in e.items]),
    Def: lambda d, macros: compile_def(d, macros),
    Operator: lambda o, macros: compile_operator(o, macros),
    Macro: lambda m, macros: macros[m.name],
    Literal: lambda l, _: asm.Literal(l.string),
    Nothing: lambda _n, _: asm.Literal('')
}
def compile(ast, macros=None):
    if macros is None:
        macros = dict(builtin_macros)
    return converters[type(ast)](ast, macros)

def compile_def(d, macros):
    if d.name in macros:
        raise KeyError('Macro %s already defined' % d.name)
    macros[d.name] = compile(d.subregex, macros)

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
        raise KeyError('Operator %s does not exist' % o.name)
    return builtin_operators[o.name](sub)
