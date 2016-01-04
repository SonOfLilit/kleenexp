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

class CharacterClass(namedtuple('CharacterClass', ['characters', 'inverted']), Asm):
    def to_regex(self, wrap=False):
        if len(self.characters) == 0:
            if self.inverted:
                return '.'  # Requires DOTALL flag.
            else:
                # Empty class (how did we get one?!) => need an expression that never matches.
                # http://stackoverflow.com/a/942122/239657: a lookahead of empty string
                # always matches, negative lookahead never does.
                # The dot afterward is to express an exactly-one-char pattern,
                # though it won't matter.
                return '(?!).'
        if len(self.characters) == 1:
            c = self.characters[0]
            if isinstance(c, str):
                if not self.inverted:
                    return c
                elif c.startswith('\\') and c[1:] in ('d', 's', 'w'):
                    return c.upper()
        return '[%s%s]' % ('^' if self.inverted else '', self.join_characters())

    def join_characters(self):
        return ''.join(sorted(c if isinstance(c, str) else '-'.join(c) for c in self.characters))

    def invert(self):
        return CharacterClass(self.characters, not self.inverted)

ANY = CharacterClass([], inverted=True)
LINEFEED = CharacterClass([r'\n'], False)
CARRIAGE_RETURN = CharacterClass([r'\r'], False)
TAB = CharacterClass([r'\t'], False)
DIGIT = CharacterClass([r'\d'], False)
LETTER = CharacterClass([['a', 'z'], ['A', 'Z']], False)
LOWERCASE = CharacterClass([['a', 'z']], False)
UPPERCASE = CharacterClass([['A', 'Z']], False)
SPACE = CharacterClass([r'\s'], False)
WORD_CHARACTER = CharacterClass([r'\w'], False)

class Boundary(namedtuple('Boundary', ['character', 'reverse']), Asm):
    def to_regex(self, wrap=False):
        return self.character

    def invert(self):
        if self.reverse is None:
            raise ValueError('Cannot invert %s' % (self,))
        return Boundary(self.reverse, self.character)

START_LINE = Boundary(r'^', None)
END_LINE = Boundary(r'$', None)
START_STRING = Boundary(r'\A', None)
# TODO: \z matches purely at string end; \Z also matches before \n\z.
# Should we expose \z or the pragmatic \Z you usually want?  Or both?
END_STRING = Boundary(r'\Z', None)
WORD_BOUNDARY = Boundary(r'\b', r'\B')

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
