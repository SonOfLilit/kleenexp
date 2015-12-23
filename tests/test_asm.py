import pytest
from re2.asm import assemble, Literal, Multiple, Either

def test_literal():
    assert assemble(Literal('abc')) == 'abc'
    assert assemble(Literal('^[a](b)$')) == r'\^\[a\]\(b\)\$'

def test_multiple():
    assert assemble(Multiple(0, 1, True, Literal('a'))) == 'a?'
    assert assemble(Multiple(0, None, True, Literal('a'))) == 'a*'
    assert assemble(Multiple(1, None, True, Literal('a'))) == 'a+'
    assert assemble(Multiple(2, 2, True, Literal('a'))) == 'a{2}'
    assert assemble(Multiple(None, 2, True, Literal('a'))) == 'a{,2}'
    assert assemble(Multiple(2, None, True, Literal('a'))) == 'a{2,}'
    assert assemble(Multiple(2, 5, True, Literal('a'))) == 'a{2,5}'

def test_multiple_subexpression():
    assert assemble(Multiple(0, 1, True, Literal('abc'))) == '(?:abc)?'
    assert assemble(Multiple(0, None, True, Literal('abc'))) == '(?:abc)*'
    assert assemble(Multiple(1, None, True, Literal('abc'))) == '(?:abc)+'
    assert assemble(Multiple(0, 1, True, Multiple(2, 3, True, Literal('a')))) == '(?:a{2,3})?'

def test_multiple_nongreedy():
    assert assemble(Multiple(0, 1, False, Literal('a'))) == 'a??'
    assert assemble(Multiple(0, None, False, Literal('a'))) == 'a*?'
    assert assemble(Multiple(1, None, False, Literal('a'))) == 'a+?'
    assert assemble(Multiple(2, 2, False, Literal('a'))) == 'a{2}?'

def test_either():
    assert assemble(Either(map(Literal, 'abc'))) == 'a|b|c'
    assert assemble(Either(map(Literal, ['123', '45', '']))) == '123|45|'
