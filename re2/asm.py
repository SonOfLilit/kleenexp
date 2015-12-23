import re

class Asm(object):
    def to_regex(self):
        raise NotImplementedError()

class Literal(Asm):
    def __init__(self, string):
        self.string = string

    def to_regex(self):
        return re.escape(self.string)

def assemble(asm):
    return asm.to_regex()
