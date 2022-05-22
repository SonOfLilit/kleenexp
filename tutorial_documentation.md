
# Tutorial and Documentation

- [Tutorial](#tutorial)
- [Basic Macros](#basic-macros)
- [Cheatsheet](#cheatsheet)
- [Detailed Table of Macros by Category](#detailed-table-of-macros-by-category)

# Tutorial
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

If you want one of a few options, use `|`:

```
This is a ['Happy' | 'Short' | 'readable'] regex :-)
```

Capture with `[capture <kleenexp>]` (short: `[c <kleenexp>]`):

```
This is a [capture 1+ [#letter | ' ' | ',']] regex :-)
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

Add comments with the `comment` operator (see above.)


# Basic Macros

`#any, #letter, #lowercase, #uppercase, #digit, #newline, #space, #not_newline, #not_space, #integer, #token_character (digit or letter or underscore), #letters (one or more letters), #a..f (or with other letters), #1..5 (or with other numbers), #word_boundry, #start_line, #start_string`

[Detailed Table of Macros](#detailed-table-of-macros)

# Cheatsheet
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




# Detailed Table of Macros by Category

\* Definitions `/wrapped in slashes/` are in old regex syntax 

### Basic

| Long Name                                    | Short Name | Definition\*                                                                                                                             | Notes                                                                                                                                                                                                                         |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #any                                         | #a         | `/./`                                                                                                                                    | May or may not match newlines depending on your engine and whether the kleenexp is compiled in multiline mode, see your regex engine's documentation                                                                          |
| #any_at_all                                  | #aaa       | `[#any \| #newline]`                                                                                                                     |                                                                                                                                                                                                                               |
| #digit                                       | #d         | `/\d/`                                                                                                                                   |                                                                                                                                                                                                                               |
| #not_digit                                   | #nd        | `[not #d]`                                                                                                                               |                                                                                                                                                                                                                               |
| #letter                                      | #l         | `/[A-Za-z]/`                                                                                                                             | When in unicode mode, this will be translated as `\p{L}` in languages that support it (and throw an error elsewhere)                                                                                                          |
| #not_letter                                  | #nl        | `[not #l]`                                                                                                                               |                                                                                                                                                                                                                               |
| #lowercase                                   | #lc        | `/[a-z]/`                                                                                                                                | Unicode: `\p{Ll}`                                                                                                                                                                                                             |
| #not_lowercase                               | #nlc       | `[not #lc]`                                                                                                                              |                                                                                                                                                                                                                               |
| #uppercase                                   | #uc        | `/[A-Z]/`                                                                                                                                | Unicode: `\p{Lu}`                                                                                                                                                                                                             |
| #not_uppercase                               | #nuc       | `[not #uc]`                                                                                                                              |                                                                                                                                                                                                                               |
| #newline                                     | #n         | `[#newline_character \| #crlf]`                                                                                                          | Note that this may match 1 or 2 characters!                                                                                                                                                                                   |
| #space                                       | #s         | `/\s/`                                                                                                                                   |                                                                                                                                                                                                                               |
| #not_space                                   | #ns        | `[not #space]`                                                                                                                           |                                                                                                                                                                                                                               |
| #token_character                             | #tc        | `[#letter \| #digit \| '_']`                                                                                                             |                                                                                                                                                                                                                               |
| #not_token_character                         | #ntc       | `[not #tc]`                                                                                                                              |                                                                                                                                                                                                                               |
| #token                                       |            | `[#letter \| '_'][0+ #token_character]`                                                                                                  |                                                                                                                                                                                                                               |
| #\<char1\>..\<char2\>, e.g. `#a..f`, `#1..9` |            | `[<char1>-<char2>]`                                                                                                                      | `char1` and `char2` must be of the same class (lowercase english, uppercase english, numbers) and `char1` must be strictly below `char2`, otherwise it's an error (e.g. these are errors: `#a..a`, `#e..a`, `#0..f`, `#!..@`) |
| #letters                                     |            | `[1+ #letter]`                                                                                                                           |                                                                                                                                                                                                                               |
| #token                                       |            | `[#letter \| '_'][0+ #token_character]`                                                                                                  |                                                                                                                                                                                                                               |


### Whitespace

| Long Name                                    | Short Name | Definition\*                                                                                                                             | Notes                                                                                                                                                                                                                         |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #newline_character                           | #nc        | `/[\r\n\u2028\u2029]/`                                                                                                                   | Any of `#cr`, `#lf`, and in unicode a couple more ([explanation](https://stackoverflow.com/questions/1279779/what-is-the-difference-between-r-and-n)]                                                                         |
| #newline                                     | #n         | `[#newline_character \| #crlf]`                                                                                                          | Note that this may match 1 or 2 characters!                                                                                                                                                                                   |
| #not_newline                                 | #nn        | `[not #newline_character]`                                                                                                               | Note that this may only match 1 character, and is _not_ the negation of `#n` but of `#nc`!                                                                                                                                    |
| #linefeed                                    | #lf        | `/\n/`                                                                                                                                   | See also `#n` ([explanation](https://stackoverflow.com/questions/1279779/what-is-the-difference-between-r-and-n)]                                                                                                             |
| #carriage_return                             | #cr        | `/\r/`                                                                                                                                   | See also `#n` ([explanation](https://stackoverflow.com/questions/1279779/what-is-the-difference-between-r-and-n)]                                                                                                             |
| #windows_newline                             | #crlf      | `/\r\n/`                                                                                                                                 | Windows newline ([explanation](https://stackoverflow.com/questions/1279779/what-is-the-difference-between-r-and-n)]                                                                                                           |
| #tab                                         | #t         | `/\t/`                                                                                                                                   |                                                                                                                                                                                                                               |
| #not_tab                                     | #nt        | `[not #tab]`                                                                                                                             |                                                                                                                                                                                                                               |
| #vertical_tab                                |            | `/\v/`                                                                                                                                   |                                                                                                                                                                                                                               |

### Boundries

| Long Name                                    | Short Name | Definition\*                                                                                                                             | Notes                                                                                                                                                                                                                         |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #word_boundary                               | #wb        | `/\b/`                                                                                                                                   |                                                                                                                                                                                                                               |
| #not_word_boundary                           | #nwb       | `[not #wb]`                                                                                                                              |                                                                                                                                                                                                                               |
| #start_string                                | #ss        | `/\A/` (this is the same as `#sl` unless the engine is in multiline mode)                                                                |                                                                                                                                                                                                                               |
| #end_string                                  | #es        | `/\Z/` (this is the same as `#el` unless the engine is in multiline mode)                                                                |                                                                                                                                                                                                                               |
| #start_line                                  | #sl        | `/^/` (this is the same as `#ss` unless the engine is in multiline mode)                                                                 |                                                                                                                                                                                                                               |
| #end_line                                    | #el        | `/$/` (this is the same as `#es` unless the engine is in multiline mode)                                                                 |                                                                                                                                                                                                                               |


### Special charaters

| Long Name                                    | Short Name | Definition\*                                                                                                                             | Notes                                                                                                                                                                                                                         |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #quote                                       | #q         | `'`                                                                                                                                      |                                                                                                                                                                                                                               |
| #double_quote                                | #dq        | `"`                                                                                                                                      |                                                                                                                                                                                                                               |
| #left_brace                                  | #lb        | `[ '[' ]`                                                                                                                                |                                                                                                                                                                                                                               |
| #right_brace                                 | #rb        | `[ ']' ]`                                                                                                                                |                                                                                                                                                                                                                               |


### Numbers

| Long Name                                    | Short Name | Definition\*                                                                                                                             | Notes                                                                                                                                                                                                                         |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #integer                                     | #int       | `[[0-1 '-'] [1+ #digit]]`                                                                                                                |                                                                                                                                                                                                                               |
| #unsigned_integer                            | #uint      | `[1+ #digit]`                                                                                                                            |                                                                                                                                                                                                                               |
| #real                                        |            | `[#int [0-1 '.' #uint]`                                                                                                                  |                                                                                                                                                                                                                               |
| #float                                       |            | `[[0-1 '-'] [[#uint '.' [0-1 #uint] \| '.' #uint] [0-1 #exponent] \| #int #exponent] #exponent=[['e' \| 'E'] [0-1 ['+' \| '-']] #uint]]` |                                                                                                                                                                                                                               |
| #hex_digit                                   | #hexd      | `[#digit \| #a..f \| #A..F]`                                                                                                                 |                                                                                                                                                                                                                               |
| #hex_number                                  | #hexn      | `[1+ #hex_digit]`                                                                                                                        |                                                                                                                                                                                                                               |




### Very rare characters

| Long Name                                    | Short Name | Definition\*                                                                                                                             | Notes                                                                                                                                                                                                                         |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #bell                                        |            | `/\a/`                                                                                                                                   |                                                                                                                                                                                                                               |
| #backspace                                   |            | `/[\b]/`                                                                                                                                 |                                                                                                                                                                                                                               |
| #formfeed                                    |            | `/\f/`                                                                                                                                   |                                                                                                                                                                                                                               |

### Capture shortcuts
| Long Name                                    | Short Name | Definition\*                                                                                                                             | Notes                                                                                                                                                                                                                         |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #capture_0+\_any                             | #c0        | `[capture 0+ #any]`                                                                                                                      |                                                                                                                                                                                                                               |
| #capture_1+\_any                             | #c1        | `[capture 1+ #any]`                                                                                                                      |                                                                                                                                                                                                                               |




\* Definitions `/wrapped in slashes/` are in old regex syntax (because the macro isn't simply a short way to express something you could express otherwise)

```
"[not ['a' | 'b']]" => /[^ab]/
"[#digit | [#a..f]]" => /[0-9a-f]/
```

Trying to compile the empty string raises an error (because this is more often a mistake than not). In the rare case you need it, use `[]`.

### Coming soon:

- `#integer`, `#ip`, ..., `#a..f`
- `numbers: #number_scientific`, `#decimal` (instead of `#real`)
- improve readability insice brackets scope with `#dot`, `#hash`, `#tilde`...
- `abc[ignore_case 'de' #lowercase]` (which translates to `abc[['D' | 'd'] ['E'|'e'] [[A-Z] | [a-z]]`, today you just wouldn't try)
- `[#0..255]` (which translates to `['25' #0..5 | '2' #0..4 #d | '1' #d #d | #1..9 #d | #d]`
- `[capture:name ...]`, `[1+:fewest ...]` (for non-greedy repeat)
- unicode support. Full PCRE feature support (lookahead/lookback, some other stuff)
- Option to add your macros permanently. `ke.add_macro("#camelcase=[1+ [#uppercase [0+ lowercase]]], path_optional)`, `[add_macro #month=['january', 'January', 'Jan', ....]]`
  - `ke.import_macros("./apache_logs_macros.ke")`, `ke.export_macros("./my_macros.ke")`, and maybe arrange built-in ke macros in packages 
- `#month`, `#word`, `#year_month_day` or `#yyyy-mm-dd` 
- See TODO.txt.


