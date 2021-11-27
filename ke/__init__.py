from parsimonious.exceptions import ParseError as ParsimoniousParseError
import re as original_re
import sys

from ke.parser import Parser
from ke import compiler
from ke import asm
from ke.errors import KleenexpError, error, ParseError

parser = Parser()

def re(kleenexp):
    try:
        ast = parser.parse(kleenexp)
    except ParsimoniousParseError:
        # we want to raise the nice parsimonious ParseError with all the explanation,
        # but we also want to raise something that isinstance(x, re.error)...
        # so we defined a doubly-inheriting class ParseError and we convert the exception
        # to that, taking care to keep the traceback (as described in
        # http://www.ianbicking.org/blog/2007/09/re-raising-exceptions.html)
        exc_class, exc, tb = sys.exc_info()
        exc = ParseError(exc.text, exc.pos, exc.expr)
        raise exc.with_traceback(tb)
    compiled = compiler.compile(ast)
    return asm.assemble(compiled)

def compile(kleenexp):
    return original_re.compile(re(kleenexp))

def main():
    if len(sys.argv) != 2:
        print('''usage: echo "Trololo lolo" | grep -P `ke "[#sl]Tro[0+ #space | 'lo']lo[#el]"`''')
        return -1
    _, regex = sys.argv
    print((re(regex)))
    return 0

if __name__ == '__main__':
    sys.exit(main())
