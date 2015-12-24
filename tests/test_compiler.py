import pytest
from re2.parser import Concat, Either, Def, Operator, Macro, Literal, Nothing
from re2 import asm
from re2.compiler import compile

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
    assert compile(Concat([Nothing(), Nothing()])) == asm.Concat([asm.Literal(''), asm.Literal('')])

def test_op():
    assert compile(Operator('capture', Literal('Yo'))) == asm.Capture(None, asm.Literal('Yo'))
    assert compile(Operator('0-1', Literal('Yo'))) == asm.Multiple(0, 1, True, asm.Literal('Yo'))
    assert compile(Operator('1+', Literal('Yo'))) == asm.Multiple(1, None, True, asm.Literal('Yo'))
