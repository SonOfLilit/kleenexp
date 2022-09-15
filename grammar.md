# Grammar

[![Railroad Diagrams](/docs/grammar.png)](https://htmlpreview.github.io/?https://raw.githubusercontent.com/SonOfLilit/kleenexp/master/docs/railroad_diagrams.xhtml)

Click image to view full railroad diagram document.

In [parsimonious](https://github.com/erikrose/parsimonious) syntax:

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