import re
from collections import namedtuple

PYTHON_IDENTIFIER = re.compile('^[a-z_][a-z0-9_]*$', re.I)

class Asm(object):
    def to_regex(self, wrap=False):
        raise NotImplementedError()

    def maybe_wrap(self, should_wrap, regex):
        if not should_wrap:
            return regex
        return '(?:%s)' % regex

class Literal(namedtuple('Literal', ['string']), Asm):
    def to_regex(self, wrap=False):
        return self.maybe_wrap(wrap and len(self.string) != 1, re.escape(self.string))

class Multiple(namedtuple('Multiple', ['min', 'max', 'is_greedy', 'sub']), Asm):
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

class Either(namedtuple('Either', ['subs']), Asm):
    def to_regex(self, wrap=False):
        return self.maybe_wrap(wrap, '|'.join(s.to_regex(wrap=False) for s in self.subs))

class Concat(namedtuple('Concat', ['subs']), Asm):
    def to_regex(self, wrap=False):
        return self.maybe_wrap(wrap, ''.join(s.to_regex(wrap=False) for s in self.subs))

class CharacterClass(namedtuple('CharacterClass', ['characters', 'invert']), Asm):
    def to_regex(self, wrap=False):
        if not self.invert and len(self.characters) == 1:
            return self.characters[0]
        return '[%s%s]' % ('^' if self.invert else '', ''.join(self.characters))
ANY = CharacterClass([], True)
LINEFEED = CharacterClass([r'\n'], False)
CARRIAGE_RETURN = CharacterClass([r'\r'], False)
TAB = CharacterClass([r'\t'], False)
DIGIT = CharacterClass([r'\d'], False)

class Capture(namedtuple('Capture', ['name', 'sub']), Asm):
    def to_regex(self, wrap=False):
        return '(%s%s)' % (self.name_regex(), self.sub.to_regex())

    def name_regex(self):
        if self.name is None:
            return ''
        if not self.name:
            raise ValueError('Capture name cannot be empty')
        if not PYTHON_IDENTIFIER.match(self.name):
            raise ValueError('invalid capture group name: %s' % self.name)
        return '?P<%s>' % self.name

class Setting(namedtuple('Setting', ['setting', 'sub']), Asm):
    def to_regex(self, wrap=False):
        # no need to wrap because settings have global effect and match 0 characters,
        # so e.g. /(?m)ab|c/ == /(?:(?m)ab)|c/, however, child may need to wrap
        # or we risk accidental /(?m)ab?/ instead of /(?m)(ab)?/
        return '(?%s)%s' % (self.setting, self.sub.to_regex(wrap))

def assemble(asm):
    return asm.to_regex()
