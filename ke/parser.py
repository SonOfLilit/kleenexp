from parsimonious.grammar import Grammar
from parsimonious.nodes import NodeVisitor
from collections import namedtuple

grammar = Grammar(
    r"""
regex           = ( outer_literal / braces )*
braces          = '[' whitespace? ( ops_matches / either / matches )? whitespace? ']'
ops_matches     = op ( whitespace op )* whitespace? matches
op              = op_token (':' op_token)?
either          = matches? ( whitespace? '|' whitespace? matches? )+
matches         = match ( whitespace? match )*
match           = inner_literal / def / macro / braces
macro           = '#' ( range_macro / macro_token )
range_macro     = range_endpoint '..' range_endpoint
def             = macro '=' braces

outer_literal   = ~r'[^\[\]]+'
inner_literal   = ( '\'' until_quote '\'' ) / ( '"' until_doublequote '"' )
until_quote     = ~r"[^']*"
until_doublequote = ~r'[^"]*'

whitespace      = ~r'[ \t\r\n]+'
# '=' and ':' have syntactic meaning
op_token           = ~r'[A-Za-z0-9!$%&()*+,./;<>?@\\^_`{}~-]+'
macro_token           = ~r'[A-Za-z0-9:!$%&()*+,./;<>?@\\^_`{}~-]+'
range_endpoint  = ~r'[A-Za-z0-9]'
"""
)

Concat = namedtuple("Concat", ["items"])
Either = namedtuple("Either", ["items"])
Def = namedtuple("Def", ["name", "subregex"])
Operator = namedtuple("Operator", ["op_name", "name", "subregex"])
Macro = namedtuple("Macro", ["name"])
Range = namedtuple("Range", ["start", "end"])
Literal = namedtuple("Literal", ["string"])


class Nothing(object):
    def __eq__(self, other):
        return type(other) == type(self)


class Parser(NodeVisitor):
    grammar = grammar

    def generic_visit(self, node, visited_children):
        return visited_children or node

    def visit_regex(self, regex, nodes):
        # if we don't flatten the top level, this will fail: [#m][#m=[]]
        flattened = []
        for (node,) in nodes:
            if isinstance(node, Concat):
                flattened += node.items
            elif not isinstance(node, Nothing):
                flattened.append(node)
        return Concat(flattened)

    def visit_braces(self, braces, data):
        (_l, _lw, in_braces, _rw, _r) = data
        in_braces = list(in_braces)
        if in_braces:
            ((in_braces,),) = in_braces
        else:
            in_braces = Nothing()
        assert type(in_braces) in [
            Concat,
            Either,
            Def,
            Operator,
            Literal,
            Macro,
            Range,
        ] or isinstance(in_braces, Nothing), in_braces
        return in_braces

    def visit_in_braces(self, in_braces, data):
        (ast,) = data
        return ast

    def visit_ops_matches(self, ops_matches, data):
        (op, more_ops, _w, matches) = data
        ops = [op]
        for _w, op in more_ops:
            ops.append(op)

        result = matches
        while ops:
            op_name, name = ops.pop()
            name = list(name)
            if name:
                ((_colon, name),) = name
            else:
                name = None
            result = Operator(op_name, name, result)
        return result

    def visit_either(self, matches, data):
        (match, more_matches) = data
        more_matches = list(more_matches)
        assert more_matches
        if not isinstance(match, list):
            assert match.text == ""
            result = [Literal("")]
        else:
            result = match
        for _w1, _pipe, _w2, match in more_matches:
            if not isinstance(match, list):
                assert match.text == ""
                result.append(Literal(""))
            else:
                result += match
        if len(result) == 1:
            return result[0]
        return Either(result)

    def visit_matches(self, or_body, data):
        (match, more_matches) = data
        more_matches = list(more_matches)
        if not more_matches:
            return match
        result = [match]
        for _w, match in more_matches:
            result.append(match)
        return Concat(result)

    visit_match = NodeVisitor.lift_child

    def visit_macro(self, macro, data):
        (_hashtag, (parsed,)) = data
        if isinstance(parsed, Range):
            return parsed
        return Macro(macro.text)

    def visit_range_macro(self, range_macro, data):
        (start, _dotdot, end) = data
        return Range(start.text, end.text)

    def visit_def(self, _literal, data):
        (macro, _eq, braces) = data
        return Def(macro.name, braces)

    def visit_outer_literal(self, literal, _):
        return Literal(literal.text)

    def visit_inner_literal(self, _literal, data):
        ((_1, literal, _2),) = data
        return Literal(literal.text)

    def visit_op_token(self, token, _):
        return token.text

    def visit_macro_token(self, token, _):
        return token.text
