from parsimonious.grammar import Grammar
from parsimonious.nodes import NodeVisitor
from parsimonious.exceptions import IncompleteParseError
from collections import namedtuple

grammar = Grammar(r'''
regex           = outer*
outer           = outer_literal / braces
outer_literal   = ~r'[^\[\]]+'
braces          = '[' whitespace? ops_inners? whitespace? ']'
whitespace      = ~r'[\s\n]+'
ops_inners      = with_ops / inners
with_ops        = ops (whitespace inners)?
ops             = op (whitespace op)*
op              = ~r'[-+_a-z0-9]'i+
inners          = or_body (whitespace? '|' whitespace? or_body)*
or_body         = inner (whitespace inner)*
inner           = inner_literal / def / macro / braces
macro           = '#' ~r'[a-z0-9_]'i+
inner_literal   = ( '\'' until_quote '\'' ) / ( '"' until_doublequote '"' )
until_quote     = ~r"[^']*"
until_doublequote = ~r'[^"]*'
def             = macro '=' braces
''')

Concat = namedtuple('Concat', ['items'])
Either = namedtuple('Either', ['items'])
Def = namedtuple('Def', ['name', 'subregex'])
Operator = namedtuple('Operator', ['name', 'subregex'])
Macro = namedtuple('Macro', ['name'])
Literal = namedtuple('Literal', ['string'])
class Nothing(object): pass
class EmptyEitherError(Exception): pass
class Visitor(NodeVisitor):
    grammar = grammar

    def generic_visit(self, node, visited_children):
        return visited_children or node

    def visit_regex(self, regex, nodes):
        flattened = []
        for node in nodes:
            if isinstance(node, Concat):
                flattened += node.items
            elif node != Nothing:
                flattened.append(node)
        return Concat(flattened)

    visit_outer = NodeVisitor.lift_child

    def visit_outer_literal(self, literal, _):
        return Literal(literal.text)

    def visit_braces(self, braces, (_l, _lw, ops_inners, _rw, _r)):
        ops_inners = list(ops_inners)
        if ops_inners:
            ops_inners, = ops_inners
        else:
            ops_inners = Nothing
        assert type(ops_inners) in [Concat, Either, Def, Operator, Literal, Macro] or ops_inners == Nothing, ops_inners
        return ops_inners

    def visit_ops_inners(self, ops_inners, (ast,)):
        return ast

    def visit_with_ops(self, with_ops, (ops, maybe_inners)):
        maybe_inners = list(maybe_inners)
        if maybe_inners:
            (_w, result), = maybe_inners
        else:
            result = Nothing
        while ops:
            result = Operator(ops[-1], result)
            ops = ops[:-1]
        return result

    def visit_ops(self, ops, (op, more_ops)):
        result = [op]
        for _w, op in more_ops:
            result.append(op)
        return result

    def visit_op(self, op, _):
        return op.text

    def visit_inners(self, inners, (inner, more_inners)):
        more_inners = list(more_inners)
        if not more_inners:
            return inner
        result = [inner]
        for _w1, _pipe, _w2, inner in more_inners:
            result.append(inner)
        return Either(result)

    def visit_or_body(self, or_body, (inner, more_inners)):
        more_inners = list(more_inners)
        if not more_inners:
            return inner
        result = [inner]
        for _w, inner in more_inners:
            result.append(inner)
        return Concat(result)

    visit_inner = NodeVisitor.lift_child

    def visit_macro(self, macro, _):
        return Macro(macro.text)

    def visit_inner_literal(self, _literal, ((_1, literal, _2),)):
        return Literal(literal.text)

    def visit_def(self, _literal, (macro, _eq, braces)):
        return Def(macro.name, braces)
