import pytest
from re2.asm import assemble, Literal, Multiple

def test_literal():
    assert assemble(Literal('abc')) == 'abc'
    assert assemble(Literal('^[a](b)$')) == r'\^\[a\]\(b\)\$'

def test_multiple():
    assert assemble(Multiple(0, 1, False, Literal('a'))) == 'a?'
    assert assemble(Multiple(0, None, False, Literal('a'))) == 'a*'
    assert assemble(Multiple(1, None, False, Literal('a'))) == 'a+'
    assert assemble(Multiple(2, 2, False, Literal('a'))) == 'a{2}'
    assert assemble(Multiple(None, 2, False, Literal('a'))) == 'a{,2}'
    assert assemble(Multiple(2, None, False, Literal('a'))) == 'a{2,}'
    assert assemble(Multiple(2, 5, False, Literal('a'))) == 'a{2,5}'

def test_multiple_subexpression():
    assert assemble(Multiple(0, 1, False, Literal('abc'))) == '(?:abc)?'
    assert assemble(Multiple(0, None, False, Literal('abc'))) == '(?:abc)*'
    assert assemble(Multiple(1, None, False, Literal('abc'))) == '(?:abc)+'
    assert assemble(Multiple(0, 1, False, Multiple(2, 3, False, Literal('a')))) == 'a{2,3}?'
