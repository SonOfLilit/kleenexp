import pytest
from re2 import re, compile
from re import error

def test_re():
    assert re('["a"]') == '(?ms)a'
    assert re('[0+ #any]') == '(?ms).*'
    assert re('Number [capture 1+ #digit]') == r'(?ms)Number\ (\d+)'
    with pytest.raises(error): re('')
    with pytest.raises(error): re('[')

def test_compile():
    assert compile('["a"]').search('bab')
    assert not compile('["c"]').search('bab')

def test_range_macros():
    assert re('[#a..z]') == '(?ms)[a-z]'
    assert re('[#a..c | "g" | #q..t]') == '(?ms)[a-cgq-t]'
    assert re('[#a..c | "-"]') == '(?ms)[-a-c]'
    with pytest.raises(error): re('[#..]')
    with pytest.raises(error): re('[#a..]')
    with pytest.raises(error): re('[#a..a]')
    with pytest.raises(error): re('[#a..em..z]')
    with pytest.raises(error): re('[#!../ #:..@ #....]')

def test_real():
    print re('[#ss #real #es]')
    r = compile('[#ss #real #es]')
    assert r.match('0')
    assert r.match('0.0')
    assert r.match('-0.0')
    assert r.match('1234.56')
    assert r.match('-0.0')
    assert not r.match('0.')
    assert not r.match('.0')
    assert not r.match('-0.')
    assert not r.match('-.0')

def test_float():
    print re('[#ss #float #es]')
    f = compile('[#ss #float #es]')
    assert f.match('0.0')
    assert f.match('-0.0')
    assert f.match('0.0e1')
    assert f.match('-0.0e1')
    assert f.match('0.0e-1')
    assert f.match('0.0E1')
    assert f.match('0.')
    assert f.match('0.e1')
    assert f.match('.0')
    assert f.match('.0e1')
    assert f.match('0e1')
    assert not f.match('0')
    assert not f.match('.')
    assert not f.match('.e1')
    assert not f.match('0.0e')
    assert f.match('1024.12e3')
    assert f.match('-1024.12e-3')
    assert f.match('-.12e3')
    assert f.match('-1024.12E-3')

def test_hex():
    h = compile('[#ss #hexn #es]')
    assert h.match('0')
    assert h.match('9')
    assert h.match('a')
    assert h.match('f')
    assert h.match('A')
    assert h.match('1234567890abcdef')
    assert h.match('09af09AF')
    assert not h.match('-1')
    assert not h.match('g')

def test_define_macros():
    assert re('''[#recursive_dawg][
    #yo=["Yo dawg, I heard you like "] #so_i_put=[", so I put some "] #in_your=[" in your "] #so_you_can=[" so you can "] #while_you=[" while you "]
    #dawg=[#yo "this" #so_i_put "of this" #in_your "regex" #so_you_can "recurse" #while_you "recurse"]
    #recursive_dawg=[#yo #dawg #so_i_put #dawg #in_your #dawg #so_you_can "recurse" #while_you "recurse"] ]'''
    ) == ('(?ms)Yo dawg, I heard you like Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse, so I put some Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse in your Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse so you can recurse while you recurse'
        .replace(' ', '\\ ').replace(',', '\\,'))
