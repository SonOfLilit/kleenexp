import sys

from parsimonious.exceptions import ParseError as ParsimoniousParseError

from ke.parser import Parser
from ke import compiler
from ke import asm
from ke.errors import ParseError


ke_parser = Parser()


def _is_bytes_like(obj):
    return not hasattr(obj, "encode")


def re(pattern, syntax="python"):
    # TODO: LRU cache
    if _is_bytes_like(pattern):
        return re(pattern.decode("ascii")).encode("ascii")
    if syntax is None:
        syntax = "python"
    try:
        ast = ke_parser.parse(pattern)
    except ParsimoniousParseError:
        # we want to raise the nice parsimonious ParseError with all the explanation,
        # but we also want to raise something that isinstance(x, re.error)...
        # so we defined a doubly-inheriting class ParseError and we convert the exception
        # to that, taking care to keep the traceback (as described in
        # http://www.ianbicking.org/blog/2007/09/re-raising-exceptions.html)
        _exc_class, exc, tb = sys.exc_info()
        exc = ParseError(exc.text, exc.pos, exc.expr)
        raise exc.with_traceback(tb)
    compiled = compiler.compile(ast)
    regex = asm.assemble(compiled, syntax=syntax)
    return regex
