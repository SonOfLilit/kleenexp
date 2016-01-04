import pytest
from re2 import re, compile

def test_re():
    assert re('["a"]') == '(?ms)a'
    assert re('Number [capture 1+ #digit]') == r'(?ms)Number\ (\d+)'

def test_compile():
    assert compile('["a"]').search('bab')
    assert not compile('["c"]').search('bab')

def test_def():
    assert re('''[#recursive_dawg][
    #yo=["Yo dawg, I heard you like "] #so_i_put=[", so I put some "] #in_your=[" in your "] #so_you_can=[" so you can "] #while_you=[" while you "]
    #dawg=[#yo "this" #so_i_put "of this" #in_your "regex" #so_you_can "recurse" #while_you "recurse"]
    #recursive_dawg=[#yo #dawg #so_i_put #dawg #in_your #dawg #so_you_can "recurse" #while_you "recurse"] ]'''
    ) == ('(?ms)Yo dawg, I heard you like Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse, so I put some Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse in your Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse so you can recurse while you recurse'
        .replace(' ', '\\ ').replace(',', '\\,'))
