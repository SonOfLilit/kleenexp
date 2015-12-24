import pytest
from re2.parser import Concat, Either, Def, Operator, Macro, Literal, Nothing
from re2 import asm
from re2.compiler import compile as _compile, CompileError

def compile(ast):
    result = _compile(ast)
    assert result.setting == 'm'
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
    assert compile(Macro('#nlf')) == not_linefeed
    assert compile(Macro('#crlf')) == asm.Literal('\r\n')
    assert compile(Concat([Macro('#sl'), Literal('yo'), Macro('#el')])) == asm.Concat([asm.Boundary('^', None), asm.Literal('yo'), asm.Boundary('$', None)])

def test_character_class():
    assert compile(Either([Literal('a'), Literal('b')])) == asm.CharacterClass(['a', 'b'], False)
    assert compile(Operator('not', Either([Literal('a'), Literal('b')]))) == asm.CharacterClass(['a', 'b'], inverted=True)
    with pytest.raises(CompileError): compile(Operator('not', Either([Literal('a'), Literal('bc')])))
    assert compile(Either([Literal('a'), Literal('b'), Literal('0')])) == asm.CharacterClass(['a', 'b', '0'], False)
    assert compile(Either([Literal('a'), Macro('#d')])) == asm.CharacterClass(['a', r'\d'], False)
