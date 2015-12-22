from parsimonious.grammar import Grammar
from parsimonious.nodes import NodeVisitor
from collections import namedtuple

grammar = Grammar(r'''
regex           = outer*
outer           = outer_literal / braces
outer_literal   = ~r'[^\[\]]+'
braces          = '[' inner ']'
inner           = inner_literal*
inner_literal   = '\'' until_quote '\''
until_quote     = ~r'[^\']*'
''')

Concat = namedtuple('Concat', ['items'])
Either = namedtuple('Either', ['items'])
Operator = namedtuple('Operator', ['name', 'subregex'])
Macro = namedtuple('Macro', ['name'])
Literal = namedtuple('Literal', ['string'])
class Visitor(NodeVisitor):
    grammar = grammar

    def generic_visit(self, node, visited_children):
        return visited_children

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

    def visit_braces(self, braces, (_l, inner, _r)):
        return Concat(inner)

    def visit_inner(self, inner, children):
        return children

    def visit_inner_literal(self, _literal, (_1, literal, _2)):
        return literal

    def visit_until_quote(self, literal, _):
        return Literal(literal.text)

def test():
    C, E, O, M, L = Concat, Either, Operator, Macro, Literal
    assert Visitor().parse('') == C([])
    assert Visitor().parse('literal') == C([L('literal')])
    assert Visitor().parse('[]') == C([])
    assert Visitor().parse('a[]b') == C([L('a'), L('b')])
    assert Visitor().parse("['literal']") == C([L('literal')])
    assert Visitor().parse("['']") == C([L('')])
