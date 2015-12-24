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
    assert compile(Either(map(Literal, 'abc'))) == asm.Either([asm.Literal('a'), asm.Literal('b'), asm.Literal('c')])

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
