import re

class Asm(object):
    def to_regex(self, wrap=False):
        raise NotImplementedError()

    def maybe_wrap(self, should_wrap, regex):
        if not should_wrap:
            return regex
        return '(?:%s)' % regex

class Literal(Asm):
    def __init__(self, string):
        self.string = string

    def to_regex(self, wrap=False):
        return self.maybe_wrap(wrap and len(self.string) != 1, re.escape(self.string))

class Multiple(Asm):
    def __init__(self, min, max, is_greedy, sub):
        self.min = min
        self.max = max
        self.is_greedy = is_greedy
        self.sub = sub

    def to_regex(self, wrap=False):
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
        if not self.is_greedy:
            op += '?'
        return self.maybe_wrap(wrap, self.sub.to_regex(wrap=True) + op)

class Either(Asm):
    def __init__(self, subs):
        self.subs = subs

    def to_regex(self, wrap=False):
        return self.maybe_wrap(wrap, '|'.join(s.to_regex(wrap=False) for s in self.subs))

class Concat(Asm):
    def __init__(self, subs):
        self.subs = subs

    def to_regex(self, wrap=False):
        return self.maybe_wrap(wrap, ''.join(s.to_regex(wrap=False) for s in self.subs))

def assemble(asm):
    return asm.to_regex()
