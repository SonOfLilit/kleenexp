import re as original_re
import sys

from re2.parser import Parser
from re2 import compiler
from re2 import asm

parser = Parser()

def re(re2):
    return asm.assemble(compiler.compile(parser.parse(re2)))

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
