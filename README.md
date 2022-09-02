[![Build Status](https://app.travis-ci.com/SonOfLilit/kleenexp.svg?branch=master)](https://app.travis-ci.com/github/SonOfLilit/kleenexp)

# KleenExp, regex for humans

[Try it online](https://kleenexp.herokuapp.com/alice/) _Available for `vscode`, Python, Javascript, Typescript, Rust_

![Demo](/vscode/kleenexp/kleenexp.gif)

Regular Expressions are one of the best ideas in the field of software. However, they are stuck with a _$#%!_ accidental syntax from 1968. Kleene Expressions (after mathematician Stephen Kleene who discovered regex) are a drop-in replacement syntax that compiles to languages' native regex libraries, promising full bug-for-bug API compatibility.

Now 100% less painful to migrate! (you heard that right: migration is not painful _at all_)

- [Try it](#try-it)
- [Installation and usage](#installation-and-usage)
- [A Taste of the Syntax](#a-taste-of-the-syntax)
- [How We're Going To Take Over The World](#how-were-going-to-take-over-the-world)
  - [Roadmap](#roadmap)
- [Name](#name)
- [Real World Examples](#real-world-examples)
- [Tutorial](#tutorial)
- [Design criteria](#design-criteria)
  - [Migration](#migration)
  - [Syntax](#syntax)
- [Syntax Cheat Sheet](#syntax-cheat-sheet)
- [Grammar](#grammar)
- [Contributing](#contributing)
- [Similar works](#similar-works)
- [License](#license)

# Try it

- Try KleenExp [online](https://kleenexp.herokuapp.com/alice/)
- Install the Kleenexp extension in [`Visual Studio Code`](https://marketplace.visualstudio.com/items?itemName=sonoflilit.kleenexp) (or [github.dev](https://github.dev/SonOfLilit/kleenexp/)) as a drop-in replacement for Search/Replace (worth it just to keep "regex search" always enabled without needing to backslash-escape all your `.`s and `()`s)

# Installation and usage

```bash
pip install kleenexp
```

Now just write `ke` wherever you used to write `re`:

```python
import ke

username = input('Choose a username:')
# if not re.match(r'[A-Za-z][A-Za-z\d]*$', password):
if not ke.match('[#letter [0+ [#letter | #digit]] #end_string]', username):
    print("Invalid username")
else:
    password = input('Enter a new password:')
    # if re.match(r'\A(?=[^a-z]*[a-z])(?=[^A-Z]*[A-Z])(?=\D*(\d))(?!.*(?:123|pass|Pass))\w{6,}\Z', password):
    if not ke.match('''[
      #has_lower=[lookahead [0+ not #lowercase] #lowercase]
      #has_upper=[lookahead [0+ not #uppercase] #uppercase]
      #has_digit=[lookahead [0+ not #digit] [capture #digit]]
      #no_common_sequences=[not lookahead [0+ #any] ["123" | "pass" | "Pass"]]

      #start_string #has_lower #has_upper #has_digit #no_common_sequences [6+ #token_character] #end_string
    ]''', password):
        print("Password should contain at least one uppercase letter, one lowercase letter, and one digit, and nothing obvious like '123'")
    else:
        ...
```

Be sure to read the tutorial below!

# A Taste of the Syntax

```
Hello. My name is Inigo Montoya. You killed my Father. Prepare to die.
    # vs. regex:
Hello\. My name is Inigo Montoya\. You killed my Father\. Prepare to die\.
```

```
[1-3 'What is your ' ['name' | 'quest' | 'favourite colour'] '?' [0-1 #space]]
    # vs. regex:
(?:What is your (?:name|quest|favourite colour)\?)\s?){1,3}
```

```
Hello. My name is [capture:name #tmp ' ' #tmp #tmp=[#uppercase [1+ #lowercase]]]. You killed my ['Father' | 'Mother' | 'Son' | 'Daughter' | 'Dog' | 'Hamster']. Prepare to die.
    # vs. regex:
Hello\. My name is (?<name>[A-Z][a-z]+ [A-Z][a-z]+)\. You killed my (?:Father|Mother|Son|Daughter|Dog|Hamster)\. Prepare to die\.`
```

Or, if you're in a hurry you can use the shortened form:

```
Hello. My name is [c:name#uc[1+#lc]' '#uc[1+#lc]]. You killed my ['Father'|'Mother'|'Son'|'Daughter'|'Dog'|'Hamster']. Prepare to die.
```

(and when you're done you can use our automatic tool [TODO] to convert it to the more readable version and commit that instead.)

[![Cheat Sheet](/docs/cheatsheet.png)](https://raw.githubusercontent.com/SonOfLilit/kleenexp/master/docs/kleenexp_cheatsheet_web.pdf)
[Print Cheat Sheet](https://raw.githubusercontent.com/SonOfLilit/kleenexp/master/docs/kleenexp_cheatsheet_print.pdf)

More on the syntax, additional examples, and the design criteria that led to its design, below.

# How We're Going To Take Over The World

This is not a toy project meant to prove a technological point. This is a serious attempt to fix something that is broken in the software ecosystem and has been broken since before we were born. We have experience running R&D departments, we understand how technology decisions are made, and we realise success here hinges more on "growth hacking" and on having a painless and risk-free migration story than it does on technical excellence.

**Step 1** would be to introduce KleenExp to the early adopter developer segment by releasing great plugins for popular text editors like Visual Studio Code, with better UX (syntax highlighting, autocompletion, good error messages, ...) and a great tutorial. Adopting a new regex syntax for your text editor is low risk and requires no coordination between stakeholders.

**Step 2** would be to aim at hobbyist software projects by making our Javascript adoption story as painless and risk-free as possible (since Javascript has the most early-adopting and fast-moving culture). In addition to a runtime drop-in syntax adapter, we will write a `babel` plugin that translates KleenExp syntax into legacy regex syntax at compile time, to enable zero-overhead usage.

**Step 3** would be to aim at startups by optimizing and testing the implementations until they're ready for deployment in big-league production scenarios.

**Step 4** would be to make it possible for large legacy codebases to switch by releasing tools that automatically convert a codebase from legacy syntax to KleenExp (like python's `2to3` or AirBnB's `ts-migrate`)

## Roadmap

- 0.0.1 `pip install`-able, usable in Python projects with `import ke as re` and in `grep` with `` grep -P `ke "pattern"`  ``
- 0.0.2 Usable in Visual Studio Code with an extension (requires manually installing the python library)
- 0.0.x Bugfixes and improvements based on community feedback, support 100% of Python and Javascript regex features
- 0.1.0 **We are here** Usable in Javascript projects, Visual Studio Code extension uses Rust implementation through WASM and does not require any manual installation or configuration
- 0.2.0 Better UX for Visual Studio Code extension through WebView, extensions available for Brainjet IDEs
- 0.3.0 `Babel` plugin enables Javascript projects to use the new syntax with 0 runtime overhead
- 0.9.0 Both implementations are fast, stable and battle tested
- 1.0.0 `2to3`-based tool to automatically migrate Python projects to use new syntax, similar tool for Javascript
- 2.0.0 Implementations for all major languages (Javascript, Python, Java, C#, Go, Kotlin, Scala). Integration into libpcre (or, if we can't get our patches in, stable libpcre fork that keeps in sync with upstream) enables language, editor, database and other tool implementations to effortlessly support KleenExp

# Name

Kleene Expression syntax is named after mathematician Stephen Kleene who invented regular expressions.

Wikipedia says:

> Although his last name is commonly pronounced /ˈkliːni/ KLEE-nee or /kliːn/ KLEEN, Kleene himself pronounced it /ˈkleɪni/ KLAY-nee. His son, Ken Kleene, wrote: "As far as I am aware this pronunciation is incorrect in all known languages. I believe that this novel pronunciation was invented by my father."

However, with apologies to the late Mr. Kleen, "Kleene expressions" is pronounced "Clean expressions" and not "Klein expression".

# Real World Examples

```
import ke

def remove_parentheses(line):
    if ke.search("[#open=['('] #close=[')'] #open [0+ not #close] #close]", line):
        raise ValueError()
    return ke.sub("[ '(' [0+ not ')'] ')' ]", '', line)
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

```
import ke
from django.urls import path, re_path

from . import views

urlpatterns = [
    path('articles/2003/', views.special_case_2003),
    re_path(ke.re('[#start_line]articles/[capture:year 4 #digit]/[#end_line]'), views.year_archive),
    re_path(ke.re('[#start_line]articles/[capture:year 4 #digit]/[capture:month 2 #digit]/[#end_line]'), views.month_archive),
    re_path(ke.re('[#start_line]articles/[capture:year 4 #digit]/[capture:month 2 #digit]/[capture:slug 1+ [#letter | #digit | '_' | '-']]/[#end_line]'), views.article_detail),
]
```

(the original is taken from Django documentation and looks like this:)

```
from django.urls import path, re_path

from . import views

urlpatterns = [
    path('articles/2003/', views.special_case_2003),
    re_path(r'^articles/(?P<year>[0-9]{4})/$', views.year_archive),
    re_path(r'^articles/(?P<year>[0-9]{4})/(?P<month>[0-9]{2})/$', views.month_archive),
    re_path(r'^articles/(?P<year>[0-9]{4})/(?P<month>[0-9]{2})/(?P<slug>[\w-]+)/$', views.article_detail),
]
```

# Tutorial

[[Download] Cheat Sheet](https://raw.githubusercontent.com/SonOfLilit/kleenexp/master/docs/kleenexp_cheatsheet_web.pdf) [[Print] Cheat Sheet](https://raw.githubusercontent.com/SonOfLilit/kleenexp/master/docs/kleenexp_cheatsheet_print.pdf)

This is still in Beta, we'd love to get your feedback on the syntax.

Anything outside of brackets is a literal:

```
This is a (short) literal :-)
```

You can use macros like `#digit` (short: `#d`) or `#any` (`#a`):

```
This is a [#lowercase #lc #lc #lc] regex :-)
```

You can repeat with `n`, `n+` or `n-m`:

```
This is a [1+ #lc] regex :-)
```

If you want either of several options, use `|`:

```
This is a ['Happy' | 'Short' | 'readable'] regex :-)
```

Capture with `[capture <kleenexp>]` (short: `[c <kleenexp>]`, named: `[c:name <kleenexp>]`):

```
This is a [capture:adjective 1+ [#letter | ' ' | ',']] regex :-)
```

Reverse a pattern that matches a single character with `not`:

```
[#start_line [0+ #space] [not ['-' | #digit | #space]] [0+ not #space]]
```

Define your own macros with `#name=[<regex>]`:

```
This is a [#trochee #trochee #trochee] regex :-)[
    [comment 'see xkcd 856']
    #trochee=['Robot' | 'Ninja' | 'Pirate' | 'Doctor' | 'Laser' | 'Monkey']
]
```

Lookeahead and lookbehind:

```
[#start_string
  [lookahead [0+ #any] #lowercase]
  [lookahead [0+ #any] #uppercase]
  [lookahead [0+ #any] #digit]
  [not lookahead [0+ #any] ["123" | "pass" | "Pass"]]
  [6+ #token]
  #end_string
]
```

```
[")" [not lookbehind "()"]]
```

Add comments with the `comment` operator:

```
[[comment "Custom macros can help document intent"]
  #has_lower=[lookahead [0+ not #lowercase] #lowercase]
  #has_upper=[lookahead [0+ not #uppercase] #uppercase]
  #has_digit=[lookahead [0+ not #digit] [capture #digit]]
  #no_common_sequences=[not lookahead [0+ #any] ["123" | "pass" | "Pass"]]

  #start_string #has_lower #has_upper #has_digit #no_common_sequences [6+ #token_character] #end_string
]
```

[[Download] Cheat Sheet](https://raw.githubusercontent.com/SonOfLilit/kleenexp/master/docs/kleenexp_cheatsheet_web.pdf) [[Print] Cheat Sheet](https://raw.githubusercontent.com/SonOfLilit/kleenexp/master/docs/kleenexp_cheatsheet_print.pdf)

Some macros you can use:

| Long Name                                    | Short Name | Definition\*                                                                                                                                     | Notes                                                                                                                                                                                                                         |
| -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #any                                         | #a         | `/./`                                                                                                                                            | May or may not match newlines depending on your engine and whether the kleenexp is compiled in multiline mode, see your regex engine's documentation                                                                          |
| #any_at_all                                  | #aaa       | `[#any \| #newline]`                                                                                                                             |                                                                                                                                                                                                                               |
| #newline_character                           | #nc        | `/[\r\n\u2028\u2029]/`                                                                                                                           | Any of `#cr`, `#lf`, and in unicode a couple more ([explanation](https://stackoverflow.com/questions/1279779/what-is-the-difference-between-r-and-n))                                                                         |
| #newline                                     | #n         | `[#newline_character \| #crlf]`                                                                                                                  | Note that this may match 1 or 2 characters!                                                                                                                                                                                   |
| #not_newline                                 | #nn        | `[not #newline_character]`                                                                                                                       | Note that this may only match 1 character, and is _not_ the negation of `#n` but of `#nc`!                                                                                                                                    |
| #linefeed                                    | #lf        | `/\n/`                                                                                                                                           | See also `#n` ([explanation](https://stackoverflow.com/questions/1279779/what-is-the-difference-between-r-and-n))                                                                                                             |
| #carriage_return                             | #cr        | `/\r/`                                                                                                                                           | See also `#n` ([explanation](https://stackoverflow.com/questions/1279779/what-is-the-difference-between-r-and-n))                                                                                                             |
| #windows_newline                             | #crlf      | `/\r\n/`                                                                                                                                         | Windows newline ([explanation](https://stackoverflow.com/questions/1279779/what-is-the-difference-between-r-and-n))                                                                                                           |
| #tab                                         | #t         | `/\t/`                                                                                                                                           |                                                                                                                                                                                                                               |
| #not_tab                                     | #nt        | `[not #tab]`                                                                                                                                     |                                                                                                                                                                                                                               |
| #digit                                       | #d         | `/\d/`                                                                                                                                           |                                                                                                                                                                                                                               |
| #not_digit                                   | #nd        | `[not #d]`                                                                                                                                       |                                                                                                                                                                                                                               |
| #letter                                      | #l         | `/[A-Za-z]/`                                                                                                                                     | When in unicode mode, this will be translated as `\p{L}` in languages that support it (and throw an error elsewhere)                                                                                                          |
| #not_letter                                  | #nl        | `[not #l]`                                                                                                                                       |                                                                                                                                                                                                                               |
| #lowercase                                   | #lc        | `/[a-z]/`                                                                                                                                        | Unicode: `\p{Ll}`                                                                                                                                                                                                             |
| #not_lowercase                               | #nlc       | `[not #lc]`                                                                                                                                      |                                                                                                                                                                                                                               |
| #uppercase                                   | #uc        | `/[A-Z]/`                                                                                                                                        | Unicode: `\p{Lu}`                                                                                                                                                                                                             |
| #not_uppercase                               | #nuc       | `[not #uc]`                                                                                                                                      |                                                                                                                                                                                                                               |
| #space                                       | #s         | `/\s/`                                                                                                                                           |                                                                                                                                                                                                                               |
| #not_space                                   | #ns        | `[not #space]`                                                                                                                                   |                                                                                                                                                                                                                               |
| #token_character                             | #tc        | `[#letter \| #digit \| '_']`                                                                                                                     |                                                                                                                                                                                                                               |
| #not_token_character                         | #ntc       | `[not #tc]`                                                                                                                                      |                                                                                                                                                                                                                               |
| #token                                       |            | `[#letter \| '_'][0+ #token_character]`                                                                                                          |                                                                                                                                                                                                                               |
| #word_boundary                               | #wb        | `/\b/`                                                                                                                                           |                                                                                                                                                                                                                               |
| #not_word_boundary                           | #nwb       | `[not #wb]`                                                                                                                                      |                                                                                                                                                                                                                               |
| #quote                                       | #q         | `'`                                                                                                                                              |                                                                                                                                                                                                                               |
| #double_quote                                | #dq        | `"`                                                                                                                                              |                                                                                                                                                                                                                               |
| #left_brace                                  | #lb        | `[ '[' ]`                                                                                                                                        |                                                                                                                                                                                                                               |
| #right_brace                                 | #rb        | `[ ']' ]`                                                                                                                                        |                                                                                                                                                                                                                               |
| #start_string                                | #ss        | `/\A/` (this is the same as `#sl` unless the engine is in multiline mode)                                                                        |                                                                                                                                                                                                                               |
| #end_string                                  | #es        | `/\Z/` (this is the same as `#el` unless the engine is in multiline mode)                                                                        |                                                                                                                                                                                                                               |
| #start_line                                  | #sl        | `/^/` (this is the same as `#ss` unless the engine is in multiline mode)                                                                         |                                                                                                                                                                                                                               |
| #end_line                                    | #el        | `/$/` (this is the same as `#es` unless the engine is in multiline mode)                                                                         |                                                                                                                                                                                                                               |
| #\<char1\>..\<char2\>, e.g. `#a..f`, `#1..9` |            | `[<char1>-<char2>]`                                                                                                                              | `char1` and `char2` must be of the same class (lowercase english, uppercase english, numbers) and `char1` must be strictly below `char2`, otherwise it's an error (e.g. these are errors: `#a..a`, `#e..a`, `#0..f`, `#!..@`) |
| #integer                                     | #int       | `[[0-1 '-'] [1+ #digit]]`                                                                                                                        |                                                                                                                                                                                                                               |
| #digits                                      | #ds        | `[1+ #digit]`                                                                                                                                    |                                                                                                                                                                                                                               |
| #decimal                                     |            | `[#int [0-1 '.' #digits]`                                                                                                                        |                                                                                                                                                                                                                               |
| #float                                       |            | `[[0-1 '-'] [[#digits '.' [0-1 #digits] \| '.' #digits] [0-1 #exponent] \| #int #exponent] #exponent=[['e' \| 'E'] [0-1 ['+' \| '-']] #digits]]` |                                                                                                                                                                                                                               |
| #hex_digit                                   | #hexd      | `[#digit \| #a..f \| #A..F]`                                                                                                                     |                                                                                                                                                                                                                               |
| #hex_number                                  | #hexn      | `[1+ #hex_digit]`                                                                                                                                |                                                                                                                                                                                                                               |
| #letters                                     |            | `[1+ #letter]`                                                                                                                                   |                                                                                                                                                                                                                               |
| #capture_0+\_any                             | #c0        | `[capture 0+ #any]`                                                                                                                              |                                                                                                                                                                                                                               |
| #capture_1+\_any                             | #c1        | `[capture 1+ #any]`                                                                                                                              |                                                                                                                                                                                                                               |
| #vertical_tab                                |            | `/\v/`                                                                                                                                           |                                                                                                                                                                                                                               |
| #bell                                        |            | `/\a/`                                                                                                                                           |                                                                                                                                                                                                                               |
| #backspace                                   |            | `/[\b]/`                                                                                                                                         |                                                                                                                                                                                                                               |
| #formfeed                                    |            | `/\f/`                                                                                                                                           |                                                                                                                                                                                                                               |

\* Definitions `/wrapped in slashes/` are in old regex syntax (because the macro isn't simply a short way to express something you could express otherwise)

```
"[not ['a' | 'b']]" => /[^ab]/
"[#digit | [#a..f]]" => /[0-9a-f]/
```

Coming soon:

- Convenient macros: `#ip`, `#email`, `#us_phone`, `#intl_phone`, `#link`, `#url`, `#timestamp`, `#mmddyy`...
- `[#0..255]` (which translates to `['25' #0..5 | '2' #0..4 #d | '1' #d #d | #1..9 #d | #d]`
- improve readability insice brackets scope with `#dot`, `#hash`, `#tilde`...
- `abc[ignore_case 'de' #lowercase]` (which translates to `abc[['D' | 'd'] ['E'|'e'] [[A-Z] | [a-z]]`, today you just wouldn't try)
- `[1+:fewest ...]` (for non-greedy repeat)
- unicode support. Full PCRE feature support (some esoteric things are not yet supported)
- Option to add your macros permanently. `ke.add_macro("#camelcase=[1+ [#uppercase [0+ lowercase]]], path_optional)`, `[add_macro #month=['january', 'January', 'Jan', ....]]`
  - `ke.import_macros("./apache_logs_macros.ke")`, `ke.export_macros("./my_macros.ke")`, and maybe arrange built-in ke macros in packages
- `#month`, `#word`, `#year_month_day` or `#yyyy-mm-dd`
- See TODO.txt.

# Design criteria

## Migration

Ease of migration trumps any other design consideration. Without a clear, painless migration path, there will be no adoption.

- Capabilities should be exactly equivalent to those of legacy regex syntax
- Provide a tool to translate between legacy and kleenexp syntax to aid in learning and porting existing code
- Provide a tool to translate between short and long macro names (because typing `kgrep [#start_line [1+ #letter] #end_line]` instead of `^[a-zA-Z]+$` is not fun when exploring, but keeping `[#sl#ls#el]` in your codebase for posterity is not a huge improvement in readability)
- Provide plugins for popular IDEs (vscode, IntelliJ, ...) that wrap existing find/replace functionality with kleenexp support, with good syntax highlighting and macro name autocomplete
- Provide libraries for every common language with a function to convert kleenexp syntax to the language's legacy native syntax, and a factory that constructs compiled regex objects (since it returns a native regex engine object, no code changes will ever be required except for translating the patterns)
- Provide a command line tool, e.g. `` $ grep "`ke "[1+ #d] Reasons"`" ``

## Syntax

- Should be easy to read
- Should be easy to teach
- Should be quick to type (e.g. "between 3 and 5 times" is not a very good syntax)
- Should minimize comic book cursing like ^[^#]\*$
- Should make simple expressions literals (i.e. /Yo, dawg!/ matches "Yo, dawg!" and no other string)
- Should only have 1-2 "special characters" that make an expression be more than a simple literal
- Should not rely on characters that need to be escaped in many use cases, e.g. `"` and `\` in most languages' string literals, `` ` `` `$` in bash (`'` is OK because every language that allows `'` strings also allows `"` strings. Except for SQL. Sorry, SQL.)
- Different things should look different, beware of Lisp-like parentheses forests
- Macros (e.g. a way to write the [IP address regex](https://regex101.com/r/oE7iZ2/1) as something like `/\bX.X.X.X\b where X is (?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)/`
- Should have time-saver killer features like a way to write `0..255` and get `(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)`

# Syntax Cheat Sheet

```
This is a literal. Anything outside of brackets is a literal (even text in parentethes and 'quoted' text)
Brackets may contain whitespace-separated #macros: [#macro #macro #macro]
Brackets may contain literals: ['I am a literal' "I am also a literal"]
Brackets may contain pipes to mean "one of these": [#letter | '_'][#digit | #letter | '_'][#digit | #letter | '_']
If they don't, they may begin with an operator: [0-1 #digit][not 'X'][capture #digit #digit #digit]
This is not a legal kleenexp: [#digit capture #digit] because the operator is not at the beginning
This is not a legal kleenexp: [capture #digit | #letter] because it has both an operator and a pipe
Brackets may contain brackets: [[#letter | '_'] [1+ [#digit | #letter | '_']]]
This is a special macro that matches either "c", "d", "e", or "f": [#c..f]
You can define your own macros (note the next '#' is a litral #): ['#' [[6 #hex] | [3 #hex]] #hex=[#digit | #a..f]]
There is a "comment" operator: ['(' [3 #d] ')' [0-1 #s] [3 #d] '.' [4 #d] [comment "ignore extensions for now" [0-1 '#' [1-4 #d]]]]
```

# Grammar

In [parsimonious](https://github.com/erikrose/parsimonious) syntax):

```
regex           = ( outer_literal / braces )*
braces          = '[' whitespace? ( ops_matches / either / matches )? whitespace? ']'
ops_matches     = op ( whitespace op )* whitespace? matches
op              = token (':' token)?
either          = matches ( whitespace? '|' whitespace? matches )+
matches         = match ( whitespace? match )*
match           = inner_literal / def / macro / braces
macro           = '#' ( range_macro / token )
range_macro     = range_endpoint '..' range_endpoint
def             = macro '=' braces

outer_literal   = ~r'[^\[\]]+'
inner_literal   = ( '\'' until_quote '\'' ) / ( '"' until_doublequote '"' )
until_quote     = ~r"[^']*"
until_doublequote = ~r'[^"]*'

whitespace      = ~r'[ \t\r\n]+'
# '=' and ':' have syntactic meaning
token           = ~r'[A-Za-z0-9!$%&()*+,./;<>?@\\^_`{}~-]+'
range_endpoint  = ~r'[A-Za-z0-9]'
```

# Contributing

PRs welcome, if it's a major change maybe open a "feature suggestion" issue first suggesting the feature, get a blessing, and agree on a design.

## Architecture

```
.                   configuration and build system
├── ke/                 Python package, includes transpiler and `import re` drop-in replacement API
│   ├── __init__.py        Python API, chooses between Python and Rust transpilers
│   ├── pyke.py            Python transpiler top-level
│   ├── parser.py          Grammar and visitor-pattern transformation of parse tree to Abstract Syntax Tree (AST)
│   ├── compiler.py        Translation from AST to Asm tree (regex-like Intermediate Representation), builtin macro definitions
│   └── asm.py             Translation from Asm tree to regex syntax string
├── tests               Test suite written in Python that can run against both implementations
├── vscode              vscode extension that invokes Kleenexp transpiler before search and replace tools, uses kleenexp-wasm
├── rust                Rust crate, includes transpiler and API
│   ├── lib.py              Rust crate, includes transpiler and `regex` crate drop-in replacement API
│   ├── parse.py            Parser that outputs AST
│   └── compiler.py         Translation from AST to Asm tree (regex-like Intermediate Representation), builtin macro definitions,
│                           translation from Asm tree to regex syntax string, transpiler top level
├── src                 Python extension that exposes Rust transpiler to Python package
└── kleenexp-wasm       npm package that exposes Rust transpiler to Javascript ecosystem
```

## PR Flow

Before making commits make sure to run these commands:

```
pip install pre-commit
pre-commit install
```

This will run autoformatting tools like `black` on all files you changed whenever you try to commit. If they make changes, you will need to `git add` the changes before you can commit.

Before every commit, make sure the tests pass:

```
pytest
maturin develop pytest &&  && KLEENEXP_RUST=1 pytest   # optional
```

Before opening a PR, please review your own diff and make sure everything is well tested and has clear descriptive names and documentation wherever names are not enough (e.g. to explain why a complex approach was taken).

# Similar works

- Regular Expressions - very popular, occasionally reads like line noise, backslash for escape

  ```
  (?:What is your (?:name|quest|favourite colour)\?\s?){1,3}
  ```

- kleenexp (this right here) - Terse, readable, almost never needs escaping. Python compiler, almost ready VSCode extension, online playground.

  ```
  [1-3 'What is your ' ['name' | 'quest' | 'favourite colour'] '?' [0-1 #space]]
  ```

- [Melody](https://github.com/yoav-lavi/melody) - More verbose, supports macros, backslash escapes only for quotes. Rust compiler, babel plugin. Improves with time, getting quite impressive.

  ```
  1 to 3 of match {
    "What is your ";
    either {
      "name";
      "quest";
      "favorite color";
    }
    "?";
    0 to 1 of " ";
  }
  ```

- [Pomsky](https://pomsky-lang.org/) - Very similar to legacy regex syntax, supports macros and number ranges, supports unicode, _amazing_ error messages help convert legacy to new syntax, backslash escapes only for quotes. Rust compiler, as of today no built in way to use outside rust (but they seem to be planning it).

  ```
  ('What is your ' ('name'|'quest'|'favorite colour')'?' [s]){1,3}
  ```

- [Eggex](https://www.oilshell.org/release/latest/doc/eggex.html) Part of a new Unix shell's syntax. Big on composition (macros in kleenexp). Uses backslash for character classes. Production-ready within the shell, not supported elsewhere yet.

  ```
  / ('What is your ' ('name' | 'quest' | 'favorite color') '?' ' '?){1,3} /
  ```

- [Raku regexes](https://docs.raku.org/language/regexes) Similar to Eggex, part of Raku (the artist formerly known as Perl 6)

- [Verbal expressions](http://verbalexpressions.github.io/) - Embedded DSL, supports 14(!) languages (to some extent? I didn't verify), but isn't actively maintained

  ```
  const tester = VerEx()
      .multiple(
        VerEx()
          .then('What is your ')
          .then(
            VerEx().then('name').or('quest').or('favorite color')
          )
          .then('?')
          .maybe(' '),
        1,
        3,
      )
  ```

- There are many more eDSLs, but I will not list them as they are less relevant in my opinion

# License

(c) 2015-2022 Aur Saraf. `kleenexp` is distrubuted under the MIT license.
