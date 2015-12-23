import pytest
from parsimonious.exceptions import IncompleteParseError
from re2.parser import Parser, Concat, Either, Def, Operator, Macro, Literal, Nothing

C, E, D, O, M, L, N = Concat, Either, Def, Operator, Macro, Literal, Nothing
v = Parser()

def test_outer_literal():
    assert v.parse('') == C([])
    assert v.parse('literal') == C([L('literal')])

def test_braces():
    assert v.parse('[]') == C([])
    assert v.parse('a[]b') == C([L('a'), L('b')])

def test_inner_literal():
    assert v.parse("['literal']") == C([L('literal')])
    assert v.parse("['']") == C([L('')])
    assert v.parse('''['"']''') == C([L('"')])
    assert v.parse('''["'"]''') == C([L("'")])

def test_multiple_inner_literals():
    assert v.parse("['11' '2']") == C([L('11'), L('2')])
    assert v.parse("[   '11' \t\n\r\n '2' ]") == C([L('11'), L('2')])
    assert v.parse("['1' '2' '3']") == C([L('1'), L('2'), L('3')])
    assert v.parse('''["1" '2' '3']''') == C([L('1'), L('2'), L('3')])
    assert v.parse('''["1' '2' '3"]''') == C([L("1' '2' '3")])

def test_token():
    assert v.parse('[#a]') == C([M('#a')])
    assert v.parse('[#aloHa19]') == C([M('#aloHa19')])
    assert v.parse('[#a #b]') == C([M('#a'), M('#b')])
    assert v.parse('[ #a ]') == C([M('#a')])
    with pytest.raises(IncompleteParseError): v.parse('[#a-]')
    with pytest.raises(IncompleteParseError): v.parse('[#a!]')
    with pytest.raises(IncompleteParseError): v.parse('[#a-#b]')

def test_op():
    assert v.parse('[op #a]') == C([O('op', M('#a'))])
    assert v.parse('[op]') == C([O('op', N())])
    assert v.parse('[o p #a]') == C([O('o', O('p', M('#a')))])
    with pytest.raises(IncompleteParseError): v.parse('[#a op]')
    with pytest.raises(IncompleteParseError): v.parse('[op #a op]')

def test_recursive_braces():
    assert v.parse('[[]]') == C([])
    assert v.parse('[a #d [b #e]]') == C([O('a', C([M('#d'), O('b', M('#e'))]))])
    assert v.parse('[a #d [b #e] [c #f]]') == C([O('a', C([M('#d'), O('b', M('#e')), O('c', M('#f'))]))])
    with pytest.raises(IncompleteParseError): v.parse('[op [] op]')

def test_either():
    assert v.parse('[#a | #b]') == C([E([M('#a'), M('#b')])])
    assert v.parse('[#a | #b | #c]') == C([E([M('#a'), M('#b'), M('#c')])])
    assert v.parse('[op #a | #b]') == C([O('op', E([M('#a'), M('#b')]))])
    assert v.parse('[op #a #b | #c]') == C([
        O('op', E([
            C([M('#a'), M('#b')]),
            M('#c')
        ]))
    ])
    assert v.parse('[a #d [b #e] [c #f]]') == C([O('a', C([M('#d'), O('b', M('#e')), O('c', M('#f'))]))])
    with pytest.raises(IncompleteParseError): v.parse('[#a|]')
    with pytest.raises(IncompleteParseError): v.parse('[op #a|]')
    with pytest.raises(IncompleteParseError): v.parse('[op | #a]')

def test_def():
    assert v.parse('[#a=[#x]]') == C([D('#a', M('#x'))])
    assert v.parse('[#a #a=[#x #y]]') == C([M('#a'), D('#a', C([M('#x'), M('#y')]))])

def test_real():
    assert v.parse("[#save_num] Reasons To Switch To re2, The [#save_num]th Made Me [case_insensitive 'Laugh' | 'Cry'][#save_num=[capture 1+ #digit]]") == C([
        M('#save_num'),
        L(' Reasons To Switch To re2, The '),
        M('#save_num'),
        L('th Made Me '),
        O('case_insensitive', E([L('Laugh'), L('Cry')])),
        D('#save_num', O('capture', O('1+', M('#digit'))))
    ])
    assert v.parse("""[
        [capture 0-1 #proto] [capture #domain] '.' [capture #tld] [capture #path]
            #proto=['http' [0-1 's'] '://']
            #domain=[1+ #digit | #lowercase | '.' | '-']
            #tld=[2-6 #lowercase | '.']
            #path=['/' [0+ '/' | #alphanum | '.' | '-']]
    ]""") == C([
        O('capture', O('0-1', M('#proto'))),
        O('capture', M('#domain')),
        L('.'),
        O('capture', M('#tld')),
        O('capture', M('#path')),
        D('#proto', C([L('http'), O('0-1', L('s')), L('://')])),
        D('#domain', O('1+', E([M('#digit'), M('#lowercase'), L('.'), L('-')]))),
        D('#tld', O('2-6', E([M('#lowercase'), L('.')]))),
        D('#path', C([L('/'), O('0+', E([L('/'), M('#alphanum'), L('.'), L('-')]))]))
    ])
