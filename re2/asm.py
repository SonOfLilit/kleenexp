import re

class Asm(object):
    def to_regex(self):
        raise NotImplementedError()

class Literal(Asm):
    def __init__(self, string):
        self.string = string

    def to_regex(self):
        return re.escape(self.string)

class Multiple(Asm):
    def __init__(self, min, max, is_greedy, sub):
        self.min = min
        self.max = max
        self.is_greedy = is_greedy
        self.sub = sub

    def to_regex(self):
        if self.min == 0 and self.max is None:
            op = '*'
        elif self.min == 1 and self.max is None:
            op = '+'
        elif self.min == 0 and self.max == 1:
            op = '?'
        elif self.min == self.max:
            op = '{%d}' % self.min
        else:
            op = '{%s,%s}' % (self.min or '', self.max or '')
        return self.sub.to_regex() + op

def assemble(asm):
    return asm.to_regex()
