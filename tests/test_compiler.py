import pytest
from re2.parser import Concat, Either, Def, Operator, Macro, Literal, Nothing
from re2 import asm
from re2.compiler import compile as _compile, CompileError

def compile(ast):
    result = _compile(ast)
    assert result.setting == 'ms'
    return result.sub

def test_literal():
    assert compile(Literal('abc')) == asm.Literal('abc')

def test_concat():
    assert compile(Concat(map(Literal, 'abc'))) == asm.Concat([asm.Literal('a'), asm.Literal('b'), asm.Literal('c')])

def test_either():
    assert compile(Either([Literal('abc'), Literal('def')])) == asm.Either([asm.Literal('abc'), asm.Literal('def')])

def test_macro():
    assert compile(Macro('#digit')) == asm.DIGIT

def test_nothing():
    assert compile(Nothing()) == asm.Literal('')
    assert compile(Concat([Nothing(), Nothing()])) == asm.Literal('')

def test_op():
    assert compile(Operator('capture', Literal('Yo'))) == asm.Capture(None, asm.Literal('Yo'))
    assert compile(Operator('0-1', Literal('Yo'))) == asm.Multiple(0, 1, True, asm.Literal('Yo'))
    assert compile(Operator('1+', Literal('Yo'))) == asm.Multiple(1, None, True, asm.Literal('Yo'))

def test_def():
    assert compile(Concat([Def('#x', Literal('x')), Macro('#x')])) == asm.Literal('x')
    assert compile(Concat([Macro('#x'), Def('#x', Literal('x'))])) == asm.Literal('x')
def test_def_scoping():
    assert compile(Concat([Concat([Macro('#x')]), Def('#x', Literal('x'))])) == asm.Literal('x')
    with pytest.raises(CompileError): compile(Concat([Concat([Def('#x', Literal('x'))]), Macro('#x')]))

def test_builtin_macros():
    assert compile(Macro('#any')) == asm.ANY
    not_linefeed = asm.CharacterClass([r'\n'], inverted=True)
    assert compile(Macro('#not_linefeed')) == not_linefeed
    assert compile(Macro('#not_linefeed')) == not_linefeed
    assert compile(Macro('#windows_newline')) == asm.Literal('\r\n')
    assert compile(Concat([Macro('#sl'), Literal('yo'), Macro('#el')])) == asm.Concat([asm.Boundary('^', None), asm.Literal('yo'), asm.Boundary('$', None)])
    assert compile(Macro('#quote')) == asm.Literal("'")
    assert compile(Macro('#double_quote')) == asm.Literal('"')
    assert compile(Macro('#left_brace')) == asm.Literal("[")
    assert compile(Macro('#right_brace')) == asm.Literal(']')

def test_short_names():
    macro_names = [
        ('linefeed', 'lf'),
        ('carriage_return', 'cr'),
        ('tab', 't'),
        ('digit', 'd'),
        ('letter', 'l'),
        ('lowercase', 'lc'),
        ('uppercase', 'uc'),
        ('space', 's'),
        ('token_character', 'wc'),
        ('word_boundary', 'wb'),
        ('any', 'a'),
        ('windows_newline', 'crlf'),
        ('start_string', 'ss'),
        ('end_string', 'es'),
        ('start_line', 'sl'),
        ('end_line', 'el'),
        ('quote', 'q'),
        ('double_quote', 'dq'),
        ('left_brace', 'lb'),
        ('right_brace', 'rb'),
    ]
    for long, short in macro_names:
        assert compile(Macro('#' + long)) == compile(Macro('#' + short))

def test_character_class():
    assert compile(Either([])) == asm.CharacterClass([], inverted=False)
    assert compile(Either([Literal('a'), Literal('b')])) == asm.CharacterClass(['a', 'b'], inverted=False)
    assert compile(Operator('not', Either([Literal('a'), Literal('b')]))) == asm.CharacterClass(['a', 'b'], inverted=True)
    with pytest.raises(CompileError): compile(Operator('not', Either([Literal('a'), Literal('bc')])))
    assert compile(Either([Literal('a'), Literal('b'), Literal('0')])) == asm.CharacterClass(['a', 'b', '0'], inverted=False)
    assert compile(Either([Literal('a'), Macro('#d')])) == asm.CharacterClass(['a', r'\d'], inverted=False)

def test_invert():
    assert compile(Operator('not', Either([]))) == asm.CharacterClass([], inverted=True)
    assert compile(Operator('not', Literal('a'))) == asm.CharacterClass(['a'], inverted=True)
    assert compile(Operator('not', Either([Literal('a'), Literal('b')]))) == asm.CharacterClass(['a', 'b'], inverted=True)
    assert compile(Operator('not', Either([Literal('a'), Macro('#d')]))) == asm.CharacterClass(['a', r'\d'], inverted=True)
    assert compile(Operator('not', Either([Literal('a'), Macro('#l')]))) == asm.CharacterClass(['a', ['a', 'z'], ['A', 'Z']], inverted=True)
