[![Build Status](https://travis-ci.org/SonOfLilit/re2.svg?branch=master)](https://travis-ci.org/SonOfLilit/re2)

## Beta

The rest of the readme will describe the final version, which is about two weeks from completion. Skip to the end for instructions on how to try it right now.

# re2, a modern regular expression syntax

Regular Expressions are one of the best ideas in the programming world. However, Regular Expression _syntax_ is a _^#.*!_ accident from the 70s. Lets fix it.

Now 100% less painful to migrate! (you heard that right: migration is not painful *at all*)

## Should I Make The Switch?

If you're new to regular expressions, you should go ahead and learn the new version. It's easier to learn, easier to read and can be used in every existing tool that supports regular expressions (no need to install a new version, just pass it through the online translator).

If you use regular expressions in code, (e.g. to specify HTTP routes, input validation, or string search patterns), `re2` will make your codebase much more readable while keeping 100% backwards compatibility, requiring minimal effort to switch. Definitely switch.

If you heavily use regular expressions in a text editor, before you make the switch make sure your editor has a plugin or external utility to enable `re2` support, since using the online translator would become tiresome if done a lot. Plugins currently exist for `vim` and `emacs`.

## Syntax

The traditional regex:

```(\d+) Reasons To Switch To re2, The (\d+)th Made Me ([Ll][Aa][Uu][Gg][Hh]|[Cc][Rr][Yy])```

May be written in `re2` as:

```[#save_num] Reasons To Switch To re2, The [#save_num]th Made Me [case_insensitive ['Laugh' | 'Cry']][#save_num=[capture 1+ #digit]]```

Or, if you're in a hurry:

```[c 1+ #d] Reasons To Switch To re2, The [c 1+ #d]th Made Me [ci ['Laugh' | 'Cry']]```

(and when you're done you can use our automatic tool to convert it to the more readable version and commit that instead.)

### Design criteria

#### Migration

Ease of migration trumps any other design consideration. Without a clear, painless migration path, there would be no adoption.

- Capabilities should be exactly equivalent to those of legacy regex syntax
- Provide a tool to translate between legacy and re2 syntax to aid in learning and porting existing code
- Provide a tool to translate between short and long macro names (because typing `[#start_line [1+ #letter] #end_line]` instead of `^[a-zA-Z]+$`
- Provide libraries for every common language with a function to convert re2 syntax to the language's legacy native syntax, and a factory that constructs compiled regex objects (since it returns a native regex engine object, no code changes will ever be required except for translating the patterns)
- Provide a command line tool, e.g. ```$ grep "`re2 "\d+ Reasons"`"```

#### Syntax

- Should be easy to read
- Should be easy to teach
- Should be easy to type (e.g. "between 3 and 5 times" is not a very good syntax)
- Should minimize comic book cursing like ^[^#]*$
- Should make simple expressions literals (i.e. /Yo, dawg!/ matches "Yo, dawg!" and no other string)
- Should only have 1-2 "special characters" that make an expression be more than a simple literal
- Should not rely on characters that need to be escaped in many use cases, e.g. `"` and `\` in most languages' string literals, `` ` `` `$` in bash (`'` is OK because every language that allows `'` strings also allows `"` strings. Except for SQL. Sorry, SQL.)
- Different things should look different, beware of Lisp-like parentheses forests
- Macros (e.g. a way to write the [IP address regex](https://regex101.com/r/oE7iZ2/1) as something like `/\bX.X.X.X\b where X is (?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)/`

## Possible Names

- re2 (regular expressions 2)
- coffeex (coffee expressions)

## Rejected Names

- matchers
- humexp (human expressions)
- readex (readable expressions)
- renex (renovated expressions)
- modex (modern expressions)

## Beta Installation

You can try it today with Python and/or `grep`, e.g.

```
$ pip install -e git+git@github.com:SonOfLilit/re2.git#egg=re2
$ echo "Trololo lolo" | grep -P "`re2 "[#sl]Tro[0+ [#space | 'lo']]lo[#el]"`"
```

```
import re2

INVALID = re2.compile("([0+ not ')'](")
STUFF_IN_PARENS = re2.compile("([0+ not ')'])")
def remove_parentheses(line):
    if INVALID.search(line):
        raise ValueError()
    return STUFF_IN_PARENS.sub('', line)
assert remove_parentheses('a(b)c(d)e') == 'ace'
```

(the original is from a hackathon project I participated in and looks like this:)

```
import re

def remove_parentheses(line):
    if re.search(r'\([^)]*\(', line):
        raise ValueError()
    return re.sub(r'\([^)]*\)', '', line)
assert remove_parentheses('a(b)c(d)e') == 'ace'
```

## Tutorial

This is still in Beta, we'd love to get your feedback on the syntax.

Anything outside of brackets is a literal:

```This is a (short) literal :-)```

You can use macros like `#digit` (short: `#d`) or `#not_linefeed` (`#nlf`):

```This is a [#lowercase #lc #lc #lc] regex :-)```

You can repeat with `n+` or `n-m`:

```This is a [1+ #lc] regex :-)```

If you want one of a few options, use `|`:

```This is a ['Happy' | 'Short' | 'readable'] regex :-)```

Capture with `[capture <regex>]`:

```This is a [capture 1+ [#letter | ' ' | ',']] regex :-)```

Reverse a pattern that matches a single character with `not`:

```[#start_line [0+ #space] [not ['-' | #digit | #space]] [0+ not #space]]```

Define your own macros with `#name=[<regex>]`:

```
This is a [#trochee #trochee #trochee] regex :-)[
    [comment 'see xkcd 856']
    #trochee=['Robot' | 'Ninja' | 'Pirate' | 'Doctor' | 'Laser' | 'Monkey']
]
```

Add comments with the `comment` operator (see above.)

Some macros you can use:

Long Name   |Short Name |Definition*|Notes
------------|-----------|-----------|-----
#any        |#a         |`/./ms`    |Usually you want `#nlf`, see below
#linefeed   |#lf        |`/\n/`     |See also `#crlf`, `#cr` ([explanation](https://stackoverflow.com/questions/1279779/what-is-the-difference-between-r-and-n)]
#not_linefeed|#nlf      |`/./`      |Anything but a newline
#windows_newline|#crlf  |`/\r\n/`   |Windows newline ([explanation](https://stackoverflow.com/questions/1279779/what-is-the-difference-between-r-and-n)]
#carriage_return|#cr    |`/\r/`     |See also `#lf`, `#crlf` ([explanation](https://stackoverflow.com/questions/1279779/what-is-the-difference-between-r-and-n)]
#not_carriage_return|#ncr|`[not #cr]`
#tab        |#t         |`/\t/`
#not_tab    |#nt        |`[not #tab]`
#digit      |#d         |`/\d/`
#not_digit  |#nd        |`[not #d]`
#letter     |#l         |`/[A-Za-z]/`|When in unicode mode, this will be translated as `\p{L}` in languages that support it (and throw an error elsewhere)
#not_letter |#nl        |`[not #l]`
#lowercase  |#lc        |`/[a-z]/`  |Unicode: `\p{Ll}`
#not_lowercase|#nlc     |`[not #lc]`
#uppercase  |#uc        |`/[A-Z]/`  |Unicode: `\p{Lu}`
#not_uppercase|#nuc     |`[not #uc]`
#space      |#s         |`/\s/`
#not_space  |#ns        |`[not #space]`
#token_character|#tc    |`[#letter | #digit | '_']`
#not_token_character|#ntc|`[not #tc]`
#token      |-          |`[#letter | '_'][0+ #token_character]`
#word_boundary|#wb      |`/\b/`
#not_word_boundary|#nwb |`[not #wb]`
#quote      |#q         |`'`
#double_quote|#dq       |`"`
#left_brace |#lb        |`[ '[' ]`
#right_brace|#rb        |`[ ']' ]`
#start_string|#ss       |`/\A/`
#end_string |#es        |`/\Z/`
#start_line |#sl        |`/^/`
#end_line   |#el        |`/$/`
#<char1>..<char2>, e.g. `#a..f`, `#1..9`||`[<char1>-<char2>]`|`char1` and `char2` must be of the same class (lowercase english, uppercase english, numbers) and `char1` must be strictly below `char2`, otherwise it's an error (e.g. these are errors: `#a..a`, `#e..a`, `#0..f`, `#!..@`)
#integer    |#int       |`[[0-1 '-'] [1+ #digit]]`
#unsigned_integer|#uint |`[1+ #digit]`
#real       |           |`[#int [0-1 '.' #uint]`
#float      |           |`[[0-1 '-'] [[#uint '.' [0-1 #uint] | '.' #uint] [0-1 #exponent] | #int #exponent] #exponent=[['e' | 'E'] [0-1 ['+' | '-']] #uint]]`
#hex_digit  |#hexd      |`[#int [0-1 '.' #uint]]`
#hex_number |#hexn      |`[1+ #hex_digit]`
#letters    |           |`[1+ #letter]`
#token      |           |`[#letter | '_'][0+ #token_character]`
#capture_0+_any|#c0     |`[capture 0+ #any]`
#capture_1+_any|#c1     |`[capture 1+ #any]`
#vertical_tab|          |`/\v/`
#bell       |           |`/\a/`
#backspace  |           |`/[\b]/`
#formfeed   |           |`/\f/`

* Definitions `/wrapped in slashes/` are in old regex syntax (because the macro isn't simply a short way to express something you could express otherwise)

```
"[not ['a' | 'b']]" => /[^ab]/
"[#digit | [a..f]]" => /[0-9a-f]/
```

Trying to compile the empty string raises an error (because this is more often a mistake than not). In the rare case you need it, use `[]`.

Coming soon: `#integer`, `#ip`, ..., `[a..f]`, `abc[ignore_case 'de' #lowercase]` (which translates to `abc[['D' | 'd'] ['E'|'e'] [[A-Z] | [a-z]]`, today you just wouldn't try), `[0..255]` (which translates to `['25' [0..5] | '2' [0..4] #d | '1' #d #d | [1..9] #d | #d]`, `[capture:name ...]`, `[1+:fewest ...]` (for non-greedy repeat), unicode support. Full PCRE feature support (lookahead/lookback, some other stuff). See TODO.txt.

## Syntax Cheat Sheet

```
This is a literal. Anything outside of brackets is a literal (even text in parentethes and 'quoted' text)
Brackets may contain whitespace-separated #macros: [#macro #macro #macro]
Brackets may contain literals: ['I am a literal' "I am also a literal"]
Brackets may contain pipes to mean "one of these": [#letter | '_'][#digit | #letter | '_'][#digit | #letter | '_']
If they don't, they may begin with an operator: [0-1 #digit][not 'X'][capture #digit #digit #digit]
This is not a legal regex: [#digit capture #digit] because the operator is not at the beginning
This is not a legal regex: [capture #digit | #letter] because it has both an operator and a pipe
Brackets may contain brackets: [[#letter | '_'] [1+ [#digit | #letter | '_']]]
This is a special macro that matches either "c", "d", "e", or "f": [#c..f]
You can define your own macros: ['#' [[6 #h] | [3 #h]] #h=[#digit | #a..f]]
There is a "comment" operator: ['(' [3 #d] ')' [0-1 #s] [3 #d] '.' [4 #d] [comment "ignore extensions for now" [0-1 '#' [1-4 #d]]]]
```

## Grammar (in [parsimonious]() syntax):

```
regex           = (outer_literal / braces)+
braces          = '[' whitespace? (ops_matches / either / matches)? whitespace? ']'
ops_matches     = op (whitespace op)* (whitespace matches)?
op              = token
either          = matches (whitespace? '|' whitespace? matches)+
matches         = match (whitespace match)*
match           = inner_literal / def / macro / braces
macro           = '#' (range_endpoint '..' range_endpoint / token)
def             = macro '=' braces

outer_literal   = ~r'[^\[\]]+'
inner_literal   = ( '\'' until_quote '\'' ) / ( '"' until_doublequote '"' )
until_quote     = ~r"[^']*"
until_doublequote = ~r'[^"]*'

whitespace      = ~r'[ \t\r\n]+'
token           = ~r'[A-Za-z0-9!$-&(-/:-<>-@\\^-`{}~]+'
range_endpoint  = ~r'[A-Za-z0-9]'
```

# License

`re2` is distrubuted under the MIT license:

```
Copyright (c) 2015, Aur Saraf
All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
