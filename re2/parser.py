from parsimonious.grammar import Grammar
from parsimonious.nodes import NodeVisitor
from collections import namedtuple

grammar = Grammar(r'''
regex           = outer+
outer           = outer_literal / braces
outer_literal   = ~r'[^\[\]]+'
braces          = '[' whitespace? in_braces? whitespace? ']'
whitespace      = ~r'[ \t\r\n]+'
in_braces       = with_ops / or_expr / inners
with_ops        = ops (whitespace inners)?
ops             = op (whitespace op)*
op              = token
token           = ~r'[a-z0-9A-Z!$-&(-/:-<>-@\\^-`{}~]+'
or_expr         = inners (whitespace? '|' whitespace? inners)+
inners          = inner (whitespace inner)*
inner           = inner_literal / def / macro / braces
macro           = '#' token
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
class Nothing(object):
    def __eq__(self, other):
        return type(other) == type(self)

class Parser(NodeVisitor):
    grammar = grammar

    def generic_visit(self, node, visited_children):
        return visited_children or node

    def visit_regex(self, regex, nodes):
        flattened = []
        for node in nodes:
            if isinstance(node, Concat):
                flattened += node.items
            elif not isinstance(node, Nothing):
                flattened.append(node)
        return Concat(flattened)

    visit_outer = NodeVisitor.lift_child

    def visit_outer_literal(self, literal, _):
        return Literal(literal.text)

    def visit_braces(self, braces, (_l, _lw, in_braces, _rw, _r)):
        in_braces = list(in_braces)
        if in_braces:
            in_braces, = in_braces
        else:
            in_braces = Nothing()
        assert type(in_braces) in [Concat, Either, Def, Operator, Literal, Macro] or isinstance(in_braces, Nothing), in_braces
        return in_braces

    def visit_in_braces(self, in_braces, (ast,)):
        return ast

    def visit_with_ops(self, with_ops, (ops, maybe_inners)):
        maybe_inners = list(maybe_inners)
        if maybe_inners:
            (_w, result), = maybe_inners
        else:
            result = Nothing()
        while ops:
            result = Operator(ops[-1], result)
            ops = ops[:-1]
        return result

    def visit_ops(self, ops, (op, more_ops)):
        result = [op]
        for _w, op in more_ops:
            result.append(op)
        return result

    def visit_token(self, token, _):
        return token.text

    def visit_or_expr(self, inners, (inner, more_inners)):
        more_inners = list(more_inners)
        assert more_inners
        result = [inner]
        for _w1, _pipe, _w2, inner in more_inners:
            result.append(inner)
        return Either(result)

    def visit_inners(self, or_body, (inner, more_inners)):
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
