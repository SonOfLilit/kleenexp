from parsimonious.grammar import Grammar
from parsimonious.nodes import NodeVisitor
from parsimonious.exceptions import IncompleteParseError
from collections import namedtuple

grammar = Grammar(r'''
regex           = outer*
outer           = outer_literal / braces
outer_literal   = ~r'[^\[\]]+'
braces          = '[' whitespace? inners? whitespace? ']'
whitespace      = ~r'[\s\n]+'
inners          = inner (whitespace inner)*
inner           = inner_literal / macro
macro           = '#' ~r'[a-z0-9_]'i+
inner_literal   = ( '\'' until_quote '\'' ) / ( '"' until_doublequote '"' )
until_quote     = ~r"[^']*"
until_doublequote = ~r'[^"]*'
''')

Concat = namedtuple('Concat', ['items'])
Either = namedtuple('Either', ['items'])
Operator = namedtuple('Operator', ['name', 'subregex'])
Macro = namedtuple('Macro', ['name'])
Literal = namedtuple('Literal', ['string'])
class Visitor(NodeVisitor):
    grammar = grammar

    def generic_visit(self, node, visited_children):
        return visited_children or node

    def visit_regex(self, regex, nodes):
        flattened = []
        for node in nodes:
            if isinstance(node, Concat):
                flattened += node.items
            else:
                flattened.append(node)
        return Concat(flattened)

    visit_outer = NodeVisitor.lift_child

    def visit_outer_literal(self, literal, _):
        return Literal(literal.text)

    def visit_braces(self, braces, (_l, _lw, inner, _rw, _r)):
        inner = list(inner)
        if inner:
            inner, = inner
            inner = list(inner)
        assert all([type(c) in [Concat, Literal, Macro] for c in inner]), inner
        return Concat(inner)

    def visit_inners(self, inners, (inner, more_inners)):
        result = [inner]
        for _w, inner in more_inners:
            result.append(inner)
        return result

    visit_inner = NodeVisitor.lift_child

    def visit_macro(self, macro, _):
        return Macro(macro.text)

    def visit_inner_literal(self, _literal, ((_1, literal, _2),)):
        return Literal(literal.text)

def test():
    import pytest
    C, E, O, M, L = Concat, Either, Operator, Macro, Literal
    v = Visitor()
    assert v.parse('') == C([])
    assert v.parse('literal') == C([L('literal')])
    assert v.parse('[]') == C([])
    assert v.parse('a[]b') == C([L('a'), L('b')])
    assert v.parse("['literal']") == C([L('literal')])
    assert v.parse("['']") == C([L('')])
    assert v.parse('''['"']''') == C([L('"')])
    assert v.parse('''["'"]''') == C([L("'")])
    assert v.parse("['11' '2']") == C([L('11'), L('2')])
    assert v.parse("[   '11' \t\n\r\n '2' ]") == C([L('11'), L('2')])
    assert v.parse("['1' '2' '3']") == C([L('1'), L('2'), L('3')])
    assert v.parse('''["1" '2' '3']''') == C([L('1'), L('2'), L('3')])
    assert v.parse('''["1' '2' '3"]''') == C([L("1' '2' '3")])
    assert v.parse('[#a]') == C([M('#a')])
    assert v.parse('[#aloHa19]') == C([M('#aloHa19')])
    assert v.parse('[#a #b]') == C([M('#a'), M('#b')])
    assert v.parse('[ #a ]') == C([M('#a')])
    with pytest.raises(IncompleteParseError): v.parse('[#a-]')
    with pytest.raises(IncompleteParseError): v.parse('[#a!]')
    with pytest.raises(IncompleteParseError): v.parse('[#a-#b]')
