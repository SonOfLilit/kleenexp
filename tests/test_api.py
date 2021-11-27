import pytest
from ke import re, compile
from re import error, escape

def test_re():
    assert re('["a"]') == '(?ms)a'
    assert re('[0+ #any]') == '(?ms).*'
    assert re('Number [capture 1+ #digit]') == r'(?ms)Number\ (\d+)'
    with pytest.raises(error): re('')
    with pytest.raises(error): re('[')

def test_compile():
    assert compile('["a"]').search('bab')
    assert not compile('["c"]').search('bab')

def test_comments():
    assert re('[comment]') == re('[]')
    assert re('[comment "a"]') == re('[]')
    assert re('[comment #token]') == re('[]')
    assert re('[comment not #token]') == re('[]')
    assert re('[0-1 comment #token]') == re('[0-1]')
    assert re('["a" [comment "a"] "b"]') == re('ab')
    assert re('[comment [["a"]]]') == re('[]')

def test_range_macros():
    assert re('[#a..z]') == '(?ms)[a-z]'
    assert re('[#a..c | "g" | #q..t]') == '(?ms)[a-cgq-t]'
    assert re('[#a..c | "-"]') == '(?ms)[-a-c]'
    with pytest.raises(error): re('[#..]')
    with pytest.raises(error): re('[#a..]')
    with pytest.raises(error): re('[#a..a]')
    with pytest.raises(error): re('[#a..em..z]')
    with pytest.raises(error): re('[#!../ #:..@ #....]')

def test_not():
    assert compile('[not "a"]').match('b')
    assert compile('[not "a"]').match('A')
    assert not compile('[not "a"]').match('a')

    assert not compile('[not not "a"]').match('b')
    assert not compile('[not not "a"]').match('A')
    assert compile('[not not "a"]').match('a')

    assert compile('[not ["a" | "b"]]').match('c')
    assert not compile('[not ["a" | "b"]]').match('a')
    assert not compile('[not ["a" | "b"]]').match('b')

    assert compile('[not "a"]').match('0')
    assert compile('[not ["a" | #d]]').match('b')
    assert not compile('[not ["a" | #d]]').match('0')
    assert not compile('[not ["a" | #d]]').match('a')
    assert not compile('[not ["a" | #d]]').match('9')

    assert compile('[not #a..f]').match('g')
    assert compile('[not #a..f]').match('A')
    assert not compile('[not #a..f]').match('a')
    assert not compile('[not #a..f]').match('c')
    assert not compile('[not #a..f]').match('f')

    with pytest.raises(error): compile('[not "ab"]')

def test_real():
    print(re('[#ss #real #es]'))
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
    print(re('[#ss #float #es]'))
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

def test_token():
    h = compile('[#ss #token #es]')
    assert h.match('a')
    assert h.match('abc')
    assert h.match('a1')
    assert h.match('A')
    assert h.match('AbC19')
    assert h.match('_')
    assert h.match('_a')
    assert h.match('_1')
    assert h.match('a_b_c')
    assert not h.match('1')
    assert not h.match('1_')
    assert not h.match('9_')
    assert not h.match('1234')
    assert not h.match('!')
    assert not h.match('a!')
    assert not h.match('#x')
    assert not h.match('x ')
    assert not h.match('x y')

def test_c0_c1():
    assert compile('a[#c0]z').match('a16z').groups()[0] == '16'
    assert compile('a[#c0]z').search('http://abc.xyz/').groups()[0] == 'bc.xy'
    assert compile('a[#c0]z').search('azure').groups()[0] == ''

    assert compile('a[#c1]z').match('a16z').groups()[0] == '16'
    assert compile('a[#c1]z').search('http://abc.xyz/').groups()[0] == 'bc.xy'
    assert not compile('a[#c1]z').search('azure')

def test_escapes():
    assert compile('[#dq #q #t #lb #rb #vertical_tab #formfeed #bell #backspace #el]').match('''"'\t[]\v\f\a\b''')

def test_define_macros():
    expected = ('(?ms)Yo dawg, I heard you like Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse, so I put some Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse in your Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse so you can recurse while you recurse'
        .replace(' ', '\\ ')
        .replace(',', escape(',')) # `,` in CPython, `\,` in PyPy
    )
    assert re('''[#recursive_dawg][
        #yo=["Yo dawg, I heard you like "]
        #so_i_put=[", so I put some "]
        #in_your=[" in your "]
        #so_you_can=[" so you can "]
        #while_you=[" while you "]
        #dawg=[#yo "this" #so_i_put "of this" #in_your "regex" #so_you_can "recurse" #while_you "recurse"]
        #recursive_dawg=[#yo #dawg #so_i_put #dawg #in_your #dawg #so_you_can "recurse" #while_you "recurse"]
    ]''') == expected
