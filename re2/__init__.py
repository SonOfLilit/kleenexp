import re as original_re

from re2.parser import Parser
from re2 import compiler
from re2 import asm

parser = Parser()

def re(re2):
    return asm.assemble(compiler.compile(parser.parse(re2)))

def compile(re2):
    return original_re.compile(re(re2))
