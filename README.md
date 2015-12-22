# re2, a modern regular expression syntax

Now 100% less painful to migrate! (yup: migration is not painful *at all*)

## Should I Make The Switch?

If you're new to regular expressions, you should go ahead and learn the new version. It's easier to learn, easier to read and can be used in every existing tool that supports regular expressions (no need to install a new version, just pass it through the online translator).

If you use regular expressions in code, (e.g. to specify HTTP routes, input validation, or string search patterns), `re2` will make your codebase much more readable while keeping 100% backwards compatibility, requiring minimal effort to switch. Definitely switch.

If you heavily use regular expressions in a text editor, before you make the switch make sure your editor has a plugin or external utility to enable `re2` support, since using the online translator would become tiresome if done a lot. Plugins currently exist for `vim`, `emacs`, and `Sublime Text 2`.

## Syntax

The traditional regex

```(\d+) Reasons To Switch To re2, The (\d+)th Made Me ((?i)Laugh|Cry)```

May be written in `re2` as:

```[#save_num] Reasons To Switch To re2, The [#save_num]th Made Me [case_insensitive 'Laugh' | 'Cry'][#save_num=[capture 1+ #digit]]```

Or, if you're in a hurry:

```[c 1+ #d] Reasons To Switch To re2, The [c 1+ #d]th Made Me [ci 'Laugh' | 'Cry']```

(and when you're done you can use our automatic tool to convert it to the more readable version and commit that instead.)

### Design criteria

#### Migration

Ease of migration trumps any other design consideration. Without a clear, painless migration path, there would be no adoption.

- Capabilities should be exactly equivalent to those of legacy regex syntax
- Provide a tool to translate between legacy and re2 syntax to aid in learning and porting existing code
- Provide a tool to translate between short and long macro names (because typing `[#start_line [1+ #letter]] #end_line]` instead of `^[a-zA-Z]$`
- Provide libraries for every common language with a function to convert re2 syntax to the language's legacy native syntax, and a factory that constructs compiled regex objects (since it returns a native regex engine object, no code changes will ever be required except for translating the patterns)
- Provide a command line tool, e.g. ```$ grep `re2 "\d+ Reasons"` ```

#### Syntax

- Should be easy to read
- Should be easy to teach
- Should be easy to type (e.g. "between 3 and 5 times" is not a very good syntax)
- Should minimize comic book cursing like /^[^#]*$/
- Should make simple expressions literals (i.e. /Yo, dawg!/ matches "Yo, dawg!" and no other string)
- Should only have 1-2 "special characters" that make an expression be more than a simple literal
- Should not rely on characters that need to be escaped in many use cases, e.g. `"` and `\` in most languages' string literals, `` ` `` `$` in bash (`'` is OK because every language that allows `'` strings also allows `"` strings. Except for SQL. Sorry, SQL.)
- Different things should look different, beware of LISP-like parentheses forests
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
