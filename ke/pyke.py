import sys
from typing import Optional, Union

from parsimonious.exceptions import ParseError as ParsimoniousParseError

from ke.parser import Parser
from ke import compiler
from ke import asm
from ke.types import Flavor
from ke._errors import *


ke_parser = Parser()


def re(pattern: str, flavor: Optional[Flavor] = None) -> str:
    if flavor is None:
        flavor = Flavor.PYTHON
    try:
        ast = ke_parser.parse(pattern)
    except ParsimoniousParseError:
        # we want to raise the nice parsimonious ParseError with all the explanation,
        # but we also want to raise something that isinstance(x, re.error)...
        # so we defined a doubly-inheriting class ParseError and we convert the exception
        # to that, taking care to keep the traceback (as described in
        # http://www.ianbicking.org/blog/2007/09/re-raising-exceptions.html)
        _exc_class, exc, tb = sys.exc_info()
        assert isinstance(exc, ParsimoniousParseError)
        exc = ParseError(exc.text, exc.pos, exc.expr)
        raise exc.with_traceback(tb)
    compiled = compiler.compile(ast)
    regex = asm.assemble(compiled, flavor=flavor)
    return regex
