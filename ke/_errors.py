import re as _original_re
import parsimonious


class KleenexpError(_original_re.error):
    pass


error = KleenexpError
# we want to raise the nice parsimonious ParseError with all the explanation,
# but we also want to raise something that isinstance(x, re.error)...
class ParseError(parsimonious.ParseError, KleenexpError):
    pass


class CompileError(KleenexpError):
    pass
