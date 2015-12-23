import pytest
from re2.asm import assemble, Literal

def test_literal():
    assert assemble(Literal('abc')) == 'abc'
    assert assemble(Literal('^[a](b)$')) == r'\^\[a\]\(b\)\$'
