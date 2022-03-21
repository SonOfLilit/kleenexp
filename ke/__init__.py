import functools
from typing import AnyStr, Callable
from parsimonious.exceptions import ParseError as ParsimoniousParseError
import argparse
import re as original_re
from re import (
    ASCII,
    A,
    IGNORECASE,
    I,
    LOCALE,
    L,
    UNICODE,
    U,
    MULTILINE,
    M,
    DOTALL,
    S,
    DEBUG,
    Match,
    Pattern,
)
import sys
import traceback

from ke.parser import Parser
from ke import compiler
from ke import asm
from ke.errors import KleenexpError, error, ParseError

VERBOSE = X = 0


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


def _wrap(name) -> Callable[[str, int, AnyStr, str], original_re.Pattern]:
    func = getattr(original_re, name)

    @functools.wraps(func)
    def wrapper(pattern, string, flags=0, syntax="python"):
        return func(re(pattern, syntax=syntax), string, flags=flags)

    return wrapper


def _wrap_sub(name) -> Callable[[str, str, int, int, str], original_re.Pattern]:
    func = getattr(original_re, name)

    @functools.wraps(func)
    def wrapper(pattern, repl, string, count=0, flags=0, syntax="python"):
        return func(
            re(pattern, syntax=syntax),
            repl=repl,
            string=string,
            count=count,
            flags=flags,
        )

    return wrapper


def compile(pattern, flags=0, syntax="python"):
    return original_re.compile(re(pattern, syntax=syntax), flags=flags)


search = _wrap("search")
match = _wrap("match")
fullmatch = _wrap("fullmatch")


def split(pattern, string, maxsplit=0, flags=0, syntax="python"):
    return original_re.split(
        re(pattern, syntax=syntax), string=string, maxsplit=maxsplit, flags=flags
    )


findall = _wrap("findall")
finditer = _wrap("finditer")
sub = _wrap_sub("sub")
subn = _wrap_sub("subn")

ESCAPE_RE = compile("['[' | ']']")


def escape(pattern):
    return ESCAPE_RE.sub(r"['\0']", pattern)


# TODO: when we get a cache of our own, clear it too
purge = original_re.purge

parser = argparse.ArgumentParser(
    description="Convert legacy regexp to kleenexp.",
    epilog="""usage: echo "Trololo lolo" | grep -P `ke "[#sl]Tro[0+ #space | 'lo']lo[#el]"`""",
)
parser.add_argument(
    "pattern",
    type=str,
    default="",
    help="a legacy regular expression (remember to escape it correctly)",
)
parser.add_argument(
    "--js",
    dest="syntax",
    action="store_const",
    const="javascript",
    default="python",
    help="output javascript regex syntax",
)


def main():
    args = parser.parse_args()
    try:
        print(re(args.pattern, syntax=args.syntax), end="")
        return 0
    except error:
        t, v, _tb = sys.exc_info()
        print("".join(traceback.format_exception_only(t, v)).strip(), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
