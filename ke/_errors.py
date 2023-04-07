from re import error
import parsimonious


class KleenexpError(error):
    pass


# we want to raise the nice parsimonious ParseError with all the explanation,
# but we also want to raise something that isinstance(x, re.error)...
class ParseError(parsimonious.ParseError, KleenexpError):
    pass


class CompileError(KleenexpError):
    pass
