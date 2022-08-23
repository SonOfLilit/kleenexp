import functools
from typing import AnyStr, Callable
import argparse
import re as _original_re
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
import os
import sys
import traceback

if os.environ.get("KLEENEXP_RUST") is not None:
    try:
        from _ke import re, error, ParseError, CompileError
    except ImportError:
        from ke.pyke import re, error, ParseError, CompileError
else:
    from ke.pyke import re, error, ParseError, CompileError

VERBOSE = X = 0


def _wrap(name) -> Callable[[str, int, AnyStr, str], _original_re.Pattern]:
    func = getattr(_original_re, name)

    @functools.wraps(func)
    def wrapper(pattern, string, flags=0, syntax="python"):
        return func(re(pattern, syntax=syntax), string, flags=flags)

    return wrapper


def _wrap_sub(name) -> Callable[[str, str, int, int, str], _original_re.Pattern]:
    func = getattr(_original_re, name)

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
    return _original_re.compile(re(pattern, syntax=syntax), flags=flags)


search = _wrap("search")
match = _wrap("match")
fullmatch = _wrap("fullmatch")


def split(pattern, string, maxsplit=0, flags=0, syntax="python"):
    return _original_re.split(
        re(pattern, syntax=syntax), string=string, maxsplit=maxsplit, flags=flags
    )


findall = _wrap("findall")
finditer = _wrap("finditer")
sub = _wrap_sub("sub")
subn = _wrap_sub("subn")

# TODO: bring it back when the rust implementation is good enough
# ESCAPE_RE = compile("['[' | ']']")
ESCAPE_RE = original_re.compile(r"[\[\]]")


def escape(pattern):
    return ESCAPE_RE.sub(r"['\0']", pattern)


# TODO: when we get a cache of our own, clear it too
purge = _original_re.purge

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
