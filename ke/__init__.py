from typing import Any, AnyStr, Callable, Iterator, List, Optional, Tuple, Union
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
    RegexFlag,
)

from ke import asm

try:
    # added in Python 3.11
    from re import NOFLAG  # type: ignore
except ImportError:
    NOFLAG = 0

import os
import sys
import traceback

_backend = "python"
if os.environ.get("KLEENEXP_RUST") != "0":
    try:
        from _ke import re as _re, error, ParseError, CompileError

        _backend = "rust"
    except ImportError:
        import warnings

        warnings.warn(
            "kleenexp: cannot import _ke, resorting to native python implementation"
        )
        from ke.pyke import re as _re, error, ParseError, CompileError
else:
    from ke.pyke import re as _re, error, ParseError, CompileError

from ke.types import Flavor

VERBOSE = X = 0


def re(pattern: AnyStr, flavor: Optional[Flavor] = None) -> AnyStr:
    # TODO: LRU cache
    if _is_bytes_like(pattern):
        asm.InlineFlag.PATTERN_IS_BYTES_LIKE = True
        return _re(pattern.decode("ascii"), flavor).encode("ascii")  # type: ignore
    asm.InlineFlag.PATTERN_IS_BYTES_LIKE = False
    assert isinstance(pattern, str)
    return _re(pattern, flavor)


def _is_bytes_like(obj):
    return not hasattr(obj, "encode")


def compile(
    pattern: AnyStr, flags: Union[int, RegexFlag] = 0, flavor=Flavor.PYTHON
) -> Pattern:
    return _original_re.compile(re(pattern, flavor=flavor), flags=flags)


def search(
    pattern: AnyStr, string: AnyStr, flags=0, flavor=Flavor.PYTHON
) -> Optional[Match]:
    return _original_re.search(
        re(pattern, flavor=flavor), string, flags=flags
    )  # type: ignore


def match(
    pattern: AnyStr, string: AnyStr, flags=0, flavor=Flavor.PYTHON
) -> Optional[Match]:
    return _original_re.match(
        re(pattern, flavor=flavor), string, flags=flags
    )  # type: ignore


def fullmatch(
    pattern: AnyStr, string: AnyStr, flags=0, flavor=Flavor.PYTHON
) -> Optional[Match]:
    return _original_re.fullmatch(
        re(pattern, flavor=flavor), string, flags=flags
    )  # type: ignore


def split(
    pattern: AnyStr, string: AnyStr, maxsplit: int = 0, flags=0, flavor=Flavor.PYTHON
) -> List[Union[str, Any]]:
    return _original_re.split(
        re(pattern, flavor=flavor),
        string,
        maxsplit=maxsplit,
        flags=flags,  # type: ignore
    )


def findall(
    pattern: AnyStr, string: AnyStr, flags=0, flavor=Flavor.PYTHON
) -> List[Any]:
    return _original_re.findall(
        re(pattern, flavor=flavor), string, flags=flags
    )  # type: ignore


def finditer(
    pattern: AnyStr, string: AnyStr, flags=0, flavor=Flavor.PYTHON
) -> Iterator[Match]:
    return _original_re.finditer(
        re(pattern, flavor=flavor), string, flags=flags
    )  # type: ignore


def sub(
    pattern: AnyStr,
    repl: Union[AnyStr, Callable[[Match], AnyStr]],
    string: AnyStr,
    count: int = 0,
    flags: Union[int, RegexFlag] = 0,
    flavor=Flavor.PYTHON,
) -> AnyStr:
    return _original_re.sub(
        re(pattern, flavor=flavor),  # type: ignore
        repl=repl,  # type: ignore
        string=string,  # type: ignore
        count=count,
        flags=flags,
    )


def subn(
    pattern: AnyStr,
    repl: Union[AnyStr, Callable[[Match], AnyStr]],
    string: AnyStr,
    count: int = 0,
    flags: Union[int, RegexFlag] = 0,
    flavor=Flavor.PYTHON,
) -> Tuple[str, int]:
    return _original_re.subn(
        re(pattern, flavor=flavor),  # type: ignore
        repl=repl,  # type: ignore
        string=string,  # type: ignore
        count=count,
        flags=flags,
    )


ESCAPE_RE = compile("['[' | ']']")


def escape(pattern: str) -> str:
    return ESCAPE_RE.sub(r"['\0']", pattern)


# TODO: when we get a cache of our own, clear it too
purge = _original_re.purge

# according to this, this function doesn't work: https://stackoverflow.com/questions/7677889/what-does-the-python-re-template-function-do
# def template(...): ...

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
    dest="flavor",
    action="store_const",
    const="javascript",
    default="python",
    help="output javascript regex flavor",
)


def main():
    args = parser.parse_args()
    try:
        print(re(args.pattern, flavor=args.flavor), end="")
        return 0
    except error:
        t, v, _tb = sys.exc_info()
        print("".join(traceback.format_exception_only(t, v)).strip(), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
