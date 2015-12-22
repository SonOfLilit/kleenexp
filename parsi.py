from parsimonious.grammar import Grammar
from parsimonious.nodes import NodeVisitor
from collections import namedtuple

grammar = Grammar(r'''
regex           = outer*
outer           = outer_literal / braces
outer_literal   = ~r'[^\[\]]+'
braces          = '[' inner (whitespace inner)* ']'
whitespace      = ~r'[\s\n]+'
inner           = inner_literal*
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

    def visit_braces(self, braces, (_l, inner, maybe_more, _r)):
        maybe_more = list(maybe_more)
        if maybe_more:
            more = [m[1][0] for m in maybe_more]
            inner = list(inner)
            inner += more
        return Concat(inner)

    def visit_inner(self, inner, children):
        return children

    def visit_inner_literal(self, _literal, ((_1, literal, _2),)):
        return Literal(literal.text)

def test():
    C, E, O, M, L = Concat, Either, Operator, Macro, Literal
    assert Visitor().parse('') == C([])
    assert Visitor().parse('literal') == C([L('literal')])
    assert Visitor().parse('[]') == C([])
    assert Visitor().parse('a[]b') == C([L('a'), L('b')])
    assert Visitor().parse("['literal']") == C([L('literal')])
    assert Visitor().parse("['']") == C([L('')])
    assert Visitor().parse('''['"']''') == C([L('"')])
    assert Visitor().parse('''["'"]''') == C([L("'")])
    assert Visitor().parse("['11' '2']") == C([L('11'), L('2')])
    assert Visitor().parse("['11' \t\n\r\n '2']") == C([L('11'), L('2')])
    assert Visitor().parse("['1' '2' '3']") == C([L('1'), L('2'), L('3')])
    assert Visitor().parse('''["1" '2' '3']''') == C([L('1'), L('2'), L('3')])
