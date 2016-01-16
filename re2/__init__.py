from parsimonious.exceptions import ParseError as ParsimoniousParseError
import re as original_re
import sys

from re2.parser import Parser
from re2 import compiler
from re2 import asm
from re2.errors import Re2Error, error, ParseError

parser = Parser()

def re(re2):
    try:
        ast = parser.parse(re2)
    except ParsimoniousParseError:
        # we want to raise the nice parsimonious ParseError with all the explanation,
        # but we also want to raise something that isinstance(x, re.error)...
        # so we defined a doubly-inheriting class ParseError and we convert the exception
        # to that, taking care to keep the traceback (as described in
        # http://www.ianbicking.org/blog/2007/09/re-raising-exceptions.html)
        exc_class, exc, tb = sys.exc_info()
        exc = ParseError(exc.text, exc.pos, exc.expr)
        raise exc.__class__, exc, tb
    compiled = compiler.compile(ast)
    return asm.assemble(compiled)

def compile(re2):
    return original_re.compile(re(re2))

def main():
    if len(sys.argv) != 2:
        print '''usage: echo "Trololo lolo" | grep -P `re2 "[#sl]Tro[0+ #space | 'lo']lo[#el]"`'''
        return -1
    _, regex = sys.argv
    print re(regex)
    return 0

if __name__ == '__main__':
    sys.exit(main())
