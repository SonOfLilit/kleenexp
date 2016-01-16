import re
import parsimonious

class Re2Error(re.error): pass
error = Re2Error
# we want to raise the nice parsimonious ParseError with all the explanation,
# but we also want to raise something that isinstance(x, re.error)...
class ParseError(parsimonious.ParseError, Re2Error): pass
class CompileError(Re2Error): pass
