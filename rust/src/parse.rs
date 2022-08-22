use nom::{
    branch::alt,
    bytes::complete::take_till1,
    character::complete::{alphanumeric1, char, multispace0, one_of},
    combinator::{all_consuming, map, recognize, success},
    error::{context, ContextError, ParseError},
    multi::{many0, many1, many1_count, separated_list1},
    sequence::{delimited, pair, preceded, terminated},
    AsChar, Finish, IResult, InputTakeAtPosition, Parser,
};

pub use nom::error::VerboseError;

#[derive(Debug, Eq, PartialEq, Clone)]
pub enum Ast<'a> {
    Concat(Vec<Ast<'a>>),
    Either(Vec<Ast<'a>>),
    Operator {
        op: &'a str,
        name: &'a str,
        subexpr: Box<Ast<'a>>,
    },
    Macro(&'a str),
    Range {
        start: &'a str,
        end: &'a str,
    },
    Literal(&'a str),
}

pub fn parse<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    pattern: &'a str,
) -> Result<(&'a str, Ast<'a>), E> {
    let outer_literal = map(take_till1(|c| c == '[' || c == ']'), Ast::Literal);
    let outer = alt((outer_literal, braces));
    let mut top_level = all_consuming(map(many0(outer), concat_if_needed));
    top_level(pattern).finish()
}

fn concat_if_needed<'a>(mut items: Vec<Ast<'a>>) -> Ast<'a> {
    wrapper_if_needed(Ast::Concat, items)
}

fn either_if_needed<'a>(mut items: Vec<Ast<'a>>) -> Ast<'a> {
    wrapper_if_needed(Ast::Either, items)
}

fn wrapper_if_needed<'a>(wrapper: fn(Vec<Ast<'a>>) -> Ast<'a>, mut items: Vec<Ast<'a>>) -> Ast<'a> {
    if items.len() == 1 {
        return items.remove(0);
    }
    return wrapper(items);
}

fn braces<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, Ast<'a>, E> {
    let contents = alt((either, ops_then_matches, success(Ast::Concat(vec![]))));
    context(
        "braces",
        preceded(
            char('['),
            terminated(ws(contents), pair(multispace0, char(']'))),
        ),
    )(i)
}

fn ops_then_matches<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, Ast<'a>, E> {
    context(
        "ops_then_matches",
        map(pair(ops, matches), |(ops, ms)| {
            ops.iter().rfold(ms, |ast, op| Ast::Operator {
                op: op.op,
                name: op.name,
                subexpr: Box::new(ast),
            })
        }),
    )(i)
}

fn ops<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, Vec<Op>, E> {
    context("ops", many1(ws(op)))(i)
}

#[derive(Debug, PartialEq, Eq)]
struct Op<'a> {
    op: &'a str,
    name: &'a str,
}

fn op<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, Op<'a>, E> {
    let maybe_name = alt((preceded(char(':'), token), success("")));
    context(
        "op",
        map(pair(token, maybe_name), |(op, name)| Op {
            op: op,
            name: name,
        }),
    )(i)
}

fn either<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, Ast<'a>, E> {
    context(
        "either",
        map(separated_list1(ws(char('|')), matches), either_if_needed),
    )(i)
}

fn matches<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, Ast<'a>, E> {
    context("matches", map(many1(match_), concat_if_needed))(i)
}

pub fn ws<I, O, E: ParseError<I> + ContextError<I>, F>(
    inner: F,
) -> impl FnMut(I) -> IResult<I, O, E>
where
    F: Parser<I, O, E>,
    I: InputTakeAtPosition + Clone,
    <I as InputTakeAtPosition>::Item: AsChar + Clone,
{
    let mut w = context("ws", delimited(multispace0::<I, E>, inner, multispace0));
    move |input: I| w.parse(input)
}

fn match_<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, Ast<'a>, E> {
    ws(alt((literal, macro_, ws(braces))))(i)
}

fn literal<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, Ast<'a>, E> {
    let quoted = delimited(char('"'), take_till1(|c| c == '"'), char('"'));
    let double_quoted = delimited(char('\''), take_till1(|c| c == '\''), char('\''));
    map(alt((quoted, double_quoted)), Ast::Literal)(i)
}

fn token<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, &'a str, E> {
    context(
        "token",
        recognize(many1_count(alt((
            alphanumeric1,
            map(one_of("!$%&()*+,./;<>?@\\^_`{}~-"), |_| ""),
        )))),
    )(i)
}

fn macro_<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, Ast<'a>, E> {
    context(
        "macro",
        map(
            preceded(char('#'), recognize(many1_count(alt((token,))))),
            Ast::Macro,
        ),
    )(i)
}

#[cfg(test)]
mod tests {
    use nom::{combinator::all_consuming, error::ContextError};

    use super::*;

    fn parse(pattern: &str) -> Ast {
        match super::parse::<DebugError>(pattern) {
            Ok((_, ast)) => ast,
            Err(x) => panic!("{:#?}", x),
        }
    }

    #[test]
    fn parser() {
        parse("");
        parse("hello");
        parse("Hi!@#$%^&'' \" \\ \n stuff");
        parse("[ ]");
        parse("[]");
        parse("[][]");
        parse("[[][]][[[][[[][]]]][][]]");
        parse("[[][]]#a[[[#a][[[][]]#a#a]#a][][#a#a#a]]");
        parse("[#hello  #world]");
        parse("[1+ #hello]");
        parse("[  1+  #hello  ]");
        parse("[1+#hello]");
        parse("[c:hi 1+#hello]");
        parse("[#hello | #world]");
        parse("[[] | []]");
        parse("[#hello #world | [2+ #hi]]");
        parse("[  #hello  #world  |  [  2+  #hi  ]  ]");
        parse("[#hello#world|[2+#hi]]");
        parse("['hello world']");
        parse("['hello' \"world\"]");
        parse("[#hello 'world' | [2+ '#hi']]");
    }

    #[test]
    fn braces_must_be_balanced() {
        assert_eq!(super::parse::<DebugError>("[").ok(), None);
    }

    #[test]
    #[should_panic]
    fn either_and_ops_dont_mix() {
        parse("[2+ #a | #b]");
    }

    #[test]
    fn parser_result() {
        assert_eq!(Ast::Macro("hello"), parse("[#hello]"));
        assert_eq!(
            Ast::Concat(vec![Ast::Macro("hello"), Ast::Macro("hi")]),
            parse("[#hello #hi]")
        );
        assert_eq!(
            Ast::Concat(vec![Ast::Macro("hello"), Ast::Macro("hi")]),
            parse("[#hello#hi]")
        );
    }

    #[test]
    fn parser_result_literals() {
        assert_eq!(Ast::Literal("hi"), parse("['hi']"));
        assert_eq!(
            Ast::Concat(vec![Ast::Literal("hi"), Ast::Macro("hi")]),
            parse("[\"hi\" #hi]")
        );
        assert_eq!(
            Ast::Concat(vec![
                Ast::Literal("hi [man]"),
                Ast::Concat(vec![Ast::Literal("hoho"), Ast::Literal("heehee")])
            ]),
            parse("['hi [man]' ['hoho' 'heehee']]")
        );
    }

    #[test]
    fn parser_result_operator() {
        assert_eq!(
            Ast::Operator {
                op: "2+",
                name: "",
                subexpr: Box::new(Ast::Macro("hello"))
            },
            parse("[2+ #hello]")
        );
        assert_eq!(
            Ast::Operator {
                op: "capture",
                name: "hi",
                subexpr: Box::new(Ast::Macro("hello"))
            },
            parse("[capture:hi #hello]")
        );
    }

    #[test]
    fn parser_result_operators() {
        assert_eq!(
            Ast::Operator {
                op: "capture",
                name: "hi",
                subexpr: Box::new(Ast::Operator {
                    op: "2+",
                    name: "",
                    subexpr: Box::new(Ast::Macro("hello"))
                })
            },
            parse("[capture:hi 2+ #hello]")
        );
        assert_eq!(
            Ast::Operator {
                op: "capture",
                name: "hi",
                subexpr: Box::new(Ast::Operator {
                    op: "2+",
                    name: "",
                    subexpr: Box::new(Ast::Operator {
                        op: "op1",
                        name: "",
                        subexpr: Box::new(Ast::Operator {
                            op: "op2",
                            name: "",
                            subexpr: Box::new(Ast::Operator {
                                op: "op3",
                                name: "yo",
                                subexpr: Box::new(Ast::Concat(vec![
                                    Ast::Macro("hello"),
                                    Ast::Macro("world")
                                ]))
                            })
                        })
                    })
                })
            },
            parse("[capture:hi 2+ op1 op2 op3:yo #hello #world]")
        );
    }

    #[test]
    fn parser_result_either() {
        assert_eq!(
            Ast::Either(vec![Ast::Macro("hello"), Ast::Macro("world")]),
            parse("[#hello | #world]")
        );
        assert_eq!(
            Ast::Either(vec![
                Ast::Concat(vec![Ast::Macro("hello"), Ast::Macro("world")]),
                Ast::Macro("hi")
            ]),
            parse("[#hello #world | [#hi]]")
        );
    }

    #[test]
    fn either() {
        assert_eq!(
            Ast::Either(vec![Ast::Macro("hello"), Ast::Macro("world")]),
            super::either::<DebugError>("#hello|#world").unwrap().1
        );
        assert_eq!(
            Ast::Either(vec![Ast::Macro("hello"), Ast::Macro("world")]),
            super::either::<DebugError>("#hello | #world").unwrap().1
        );
    }

    #[test]
    fn matches() {
        assert_eq!(
            Ast::Concat(vec![]),
            super::matches::<DebugError>("[]").unwrap().1
        );
        assert_eq!(
            Ast::Concat(vec![Ast::Macro("hello"), Ast::Macro("world")]),
            super::matches::<DebugError>("[#hello #world]").unwrap().1
        );
        println!("######");
        assert_eq!(
            Ast::Either(vec![Ast::Macro("hello"), Ast::Macro("world")]),
            all_consuming(super::matches::<DebugError>)("[#hello|#world]")
                .unwrap()
                .1
        );
    }

    #[test]
    fn ops() {
        assert_eq!(
            vec![Op {
                op: "capture",
                name: ""
            }],
            super::ops::<DebugError>("capture").unwrap().1
        );
        assert_eq!(
            vec![Op {
                op: "capture",
                name: "hi"
            }],
            super::ops::<DebugError>("capture:hi").unwrap().1
        );
        assert_eq!(None, super::ops::<DebugError>("#hello").ok());
        assert_eq!(None, super::ops::<DebugError>(":hello").ok());
    }

    #[test]
    fn ops_then_matches() {
        assert_eq!(None, super::ops_then_matches::<DebugError>("#hello").ok());
        assert_eq!(
            Ast::Operator {
                op: "1+",
                name: "",
                subexpr: Box::new(Ast::Macro("hello"))
            },
            super::ops_then_matches::<DebugError>("1+ #hello")
                .unwrap()
                .1
        );
        assert_eq!(
            Ast::Operator {
                op: "1+",
                name: "",
                subexpr: Box::new(Ast::Macro("hello"))
            },
            super::ops_then_matches::<DebugError>("1+ #hello")
                .unwrap()
                .1
        );
        assert_eq!(
            Ast::Operator {
                op: "capture",
                name: "hi",
                subexpr: Box::new(Ast::Either(vec![Ast::Macro("hello"), Ast::Macro("world")]))
            },
            super::ops_then_matches::<DebugError>("capture:hi [#hello|#world]")
                .unwrap()
                .1
        );
    }

    #[test]
    fn token() {
        assert_eq!("hello", super::token::<DebugError>("hello").unwrap().1);
        assert_eq!("1+", super::token::<DebugError>("1+").unwrap().1);
        assert_eq!(None, super::token::<DebugError>("#").ok());
    }

    #[derive(Debug)]
    struct DebugError {
        message: String,
    }

    impl ParseError<&str> for DebugError {
        // on one line, we show the error code and the input that caused it
        fn from_error_kind(input: &str, kind: nom::error::ErrorKind) -> Self {
            let message = format!("{:?}:\t{:?}\n", kind, input);
            println!("{}", message);
            DebugError { message }
        }

        // if combining multiple errors, we show them one after the other
        fn append(input: &str, kind: nom::error::ErrorKind, other: Self) -> Self {
            let message = format!("{}{:?}:\t{:?}\n", other.message, kind, input);
            println!("{}", message);
            DebugError { message }
        }

        fn from_char(input: &str, c: char) -> Self {
            let message = format!("'{}':\t{:?}\n", c, input);
            println!("{}", message);
            DebugError { message }
        }

        fn or(self, other: Self) -> Self {
            let message = format!("{}\tOR\n{}\n", self.message, other.message);
            println!("{}", message);
            DebugError { message }
        }
    }

    impl ContextError<&str> for DebugError {
        fn add_context(input: &str, ctx: &'static str, other: Self) -> Self {
            let message = format!("{}\"{}\":\t{:?}\n", other.message, ctx, input);
            println!("{}", message);
            DebugError { message }
        }
    }
}
