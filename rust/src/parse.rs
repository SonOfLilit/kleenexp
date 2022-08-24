use nom::{
    branch::alt,
    bytes::complete::{tag, take_till1},
    character::complete::{alphanumeric1, char, digit1, multispace0, one_of, satisfy},
    combinator::{all_consuming, map, recognize, success},
    error::{context, ContextError, ParseError},
    multi::{many0, many1, many1_count, separated_list1},
    sequence::{delimited, pair, preceded, separated_pair, terminated},
    AsChar, Finish, IResult, InputTakeAtPosition, Parser,
};

pub use nom::error::VerboseError;

#[derive(Debug, Eq, PartialEq, Clone)]
pub enum Ast<'s> {
    Concat(Vec<Ast<'s>>),
    Either(Vec<Ast<'s>>),
    Operator {
        op: &'s str,
        name: &'s str,
        subexpr: Box<Ast<'s>>,
    },
    Multiple {
        from: u32,
        to: Option<u32>,
        subexpr: Box<Ast<'s>>,
    },
    Macro(&'s str),
    DefMacro(&'s str, Box<Ast<'s>>),
    Range {
        start: char,
        end: char,
    },
    Literal(&'s str),
}

pub fn parse<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    pattern: &'s str,
) -> Result<(&'s str, Ast<'s>), E> {
    let outer_literal = map(take_till1(|c| c == '[' || c == ']'), Ast::Literal);
    let outer = alt((outer_literal, braces));
    let mut top_level = all_consuming(map(many0(outer), concat_if_needed));
    top_level(pattern).finish()
}

fn concat_if_needed<'s>(items: Vec<Ast<'s>>) -> Ast<'s> {
    wrapper_if_needed(Ast::Concat, items)
}

fn either_if_needed<'s>(items: Vec<Ast<'s>>) -> Ast<'s> {
    wrapper_if_needed(Ast::Either, items)
}

fn wrapper_if_needed<'s>(wrapper: fn(Vec<Ast<'s>>) -> Ast<'s>, mut items: Vec<Ast<'s>>) -> Ast<'s> {
    if items.len() == 1 {
        return items.remove(0);
    }
    return wrapper(items);
}

fn braces<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, Ast<'s>, E> {
    let contents = alt((either, ops_then_matches, success(Ast::Concat(vec![]))));
    context(
        "braces",
        preceded(
            char('['),
            terminated(ws(contents), pair(multispace0, char(']'))),
        ),
    )(i)
}

fn ops_then_matches<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, Ast<'s>, E> {
    context(
        "ops_then_matches",
        map(pair(ops, matches), |(ops, ms)| {
            ops.iter().rfold(ms, |ast, op| match op {
                Op::Op { op, name } => Ast::Operator {
                    op: *op,
                    name: *name,
                    subexpr: Box::new(ast),
                },
                Op::Multiple { from, to } => Ast::Multiple {
                    from: *from,
                    to: *to,
                    subexpr: Box::new(ast),
                },
            })
        }),
    )(i)
}

fn ops<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, Vec<Op>, E> {
    context("ops", many1(ws(alt((multiple, op)))))(i)
}

#[derive(Debug, PartialEq, Eq)]
enum Op<'s> {
    Op { op: &'s str, name: &'s str },
    Multiple { from: u32, to: Option<u32> },
}

fn multiple<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, Op<'s>, E> {
    context(
        "multiple",
        alt((
            map(
                separated_pair(digit1, tag("-"), digit1),
                |params: (&str, &str)| Op::Multiple {
                    from: params.0.parse().unwrap(),
                    to: Some(params.1.parse().unwrap()),
                },
            ),
            map(terminated(digit1, tag("+")), |a: &str| Op::Multiple {
                from: a.parse().unwrap(),
                to: None,
            }),
            map(digit1, |b: &str| {
                let n = b.parse().unwrap();
                Op::Multiple {
                    from: n,
                    to: Some(n),
                }
            }),
        )),
    )(i)
}

fn op<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, Op<'s>, E> {
    let maybe_name = alt((preceded(char(':'), token), success("")));
    context(
        "op",
        map(pair(token, maybe_name), |(op, name)| Op::Op {
            op: op,
            name: name,
        }),
    )(i)
}

fn either<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, Ast<'s>, E> {
    context(
        "either",
        map(separated_list1(ws(char('|')), matches), either_if_needed),
    )(i)
}

fn matches<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, Ast<'s>, E> {
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

fn match_<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, Ast<'s>, E> {
    ws(alt((literal, def_macro, macro_, braces)))(i)
}

fn literal<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, Ast<'s>, E> {
    let quoted = delimited(char('"'), take_till1(|c| c == '"'), char('"'));
    let double_quoted = delimited(char('\''), take_till1(|c| c == '\''), char('\''));
    map(alt((quoted, double_quoted)), Ast::Literal)(i)
}

fn token<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, &'s str, E> {
    context(
        "token",
        recognize(many1_count(alt((
            alphanumeric1,
            map(one_of("!$%&()*+,./;<>?@\\^_`{}~-"), |_| ""),
        )))),
    )(i)
}

fn macro_<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, Ast<'s>, E> {
    let alphanumeric_char1 = satisfy(|c| c.is_alphanum());
    let alphanumeric_char2 = satisfy(|c| c.is_alphanum());
    context(
        "macro",
        preceded(
            char('#'),
            alt((
                map(
                    separated_pair(alphanumeric_char1, tag(".."), alphanumeric_char2),
                    |(s, e)| Ast::Range { start: s, end: e },
                ),
                map(token, Ast::Macro),
            )),
        ),
    )(i)
}

fn def_macro<'s, E: ParseError<&'s str> + ContextError<&'s str>>(
    i: &'s str,
) -> IResult<&'s str, Ast<'s>, E> {
    context(
        "macro_def",
        map(separated_pair(macro_, char('='), braces), |x| match x {
            (Ast::Macro(name), ast) => Ast::DefMacro(name, Box::new(ast)),
            _ => panic!(),
        }),
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
        parse("a[]b[]c");
        parse("[[][]][[[][[[][]]]][][]]");
        parse("[[][]]#a[[[#a][[[][]]#a#a]#a][][#a#a#a]]");
        parse("[#hello  #world]");
        parse("[#hi!$%#whatsup]");
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
        parse("[#1..9 'world' | [2+ '#hi']]");
    }

    #[test]
    fn braces_must_be_balanced() {
        assert_eq!(super::parse::<DebugError>("[").ok(), None);
        assert_eq!(super::parse::<DebugError>("]").ok(), None);
        assert_eq!(super::parse::<DebugError>("[][[]").ok(), None);
    }

    #[test]
    #[should_panic]
    fn either_and_ops_dont_mix() {
        parse("[2+ #a | #b]");
    }

    #[test]
    fn parser_result_macro() {
        assert_eq!(Ast::Macro("hello"), parse("[#hello]"));
        assert_eq!(
            Ast::Concat(vec![Ast::Macro("hello"), Ast::Macro("hi")]),
            parse("[#hello #hi]")
        );
        assert_eq!(
            Ast::Concat(vec![Ast::Macro("hello"), Ast::Macro("hi")]),
            parse("[#hello#hi]")
        );
        assert_eq!(
            Ast::Concat(vec![Ast::Macro("hi!@$"), Ast::Macro("hi")]),
            parse("[#hi!@$#hi]")
        );
    }

    #[test]
    fn parser_result_range() {
        assert_eq!(
            Ast::Range {
                start: 'a',
                end: 'f'
            },
            parse("[#a..f]")
        );
        assert_eq!(
            Ast::Range {
                start: '0',
                end: '9'
            },
            parse("[#0..9]")
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
        assert_eq!(
            Ast::Concat(vec![
                Ast::Literal("hi "),
                Ast::Literal("["),
                Ast::Literal(" man "),
                Ast::Literal("]"),
            ]),
            parse("hi ['['] man [']']")
        );
    }

    #[test]
    fn parser_result_operator() {
        assert_eq!(
            Ast::Multiple {
                from: 2,
                to: None,
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
                subexpr: Box::new(Ast::Multiple {
                    from: 2,
                    to: None,
                    subexpr: Box::new(Ast::Macro("hello"))
                })
            },
            parse("[capture:hi 2+ #hello]")
        );
        assert_eq!(
            Ast::Operator {
                op: "capture",
                name: "hi",
                subexpr: Box::new(Ast::Multiple {
                    from: 2,
                    to: None,
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
    fn parser_result_def() {
        assert_eq!(
            Ast::DefMacro("m", Box::new(Ast::Macro("l"))),
            parse("[#m=[#l]]")
        );
        assert_eq!(
            Ast::Concat(vec![
                Ast::Macro("l"),
                Ast::DefMacro("m", Box::new(Ast::Macro("lll"))),
                Ast::DefMacro(
                    "n",
                    Box::new(Ast::Multiple {
                        from: 1,
                        to: Some(3),
                        subexpr: Box::new(Ast::Literal("hi"))
                    })
                )
            ],),
            parse("[#l #m=[#lll] #n=[1-3 'hi']]")
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
            vec![Op::Op {
                op: "capture",
                name: ""
            }],
            super::ops::<DebugError>("capture").unwrap().1
        );
        assert_eq!(
            vec![Op::Op {
                op: "capture",
                name: "hi"
            }],
            super::ops::<DebugError>("capture:hi").unwrap().1
        );
        assert_eq!(
            vec![Op::Multiple {
                from: 1,
                to: Some(3)
            }],
            super::ops::<DebugError>("1-3").unwrap().1
        );
        assert_eq!(
            vec![Op::Multiple {
                from: 3,
                to: Some(3)
            }],
            super::ops::<DebugError>("3").unwrap().1
        );
        assert_eq!(
            vec![Op::Multiple { from: 3, to: None }],
            super::ops::<DebugError>("3+").unwrap().1
        );
        assert_eq!(None, super::ops::<DebugError>("#hello").ok());
        assert_eq!(None, super::ops::<DebugError>(":hello").ok());
    }

    #[test]
    fn ops_then_matches() {
        assert_eq!(None, super::ops_then_matches::<DebugError>("#hello").ok());
        assert_eq!(
            Ast::Multiple {
                from: 1,
                to: None,
                subexpr: Box::new(Ast::Macro("hello"))
            },
            super::ops_then_matches::<DebugError>("1+ #hello")
                .unwrap()
                .1
        );
        assert_eq!(
            Ast::Multiple {
                from: 1,
                to: None,
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
