use pest::error::Error;
use pest::iterators::Pair;
use pest::iterators::Pairs;
use pest::Parser;

#[derive(Parser)]
#[grammar = "kleenexp.pest"]
pub struct KleenexpParser;

#[derive(Debug, Eq, PartialEq)]
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

pub fn parse(pattern: &str) -> Result<Ast, Error<Rule>> {
    let rule = KleenexpParser::parse(Rule::kleenexp, pattern)?.next();
    Ok(parse_rule(rule))
}

fn parse_rule(pair: Option<Pair<Rule>>) -> Ast {
    match pair {
        None => Ast::Concat(vec![]),
        Some(pair) => match pair.as_rule() {
            Rule::braces => {
                let mut pair = pair.into_inner();
                parse_rule(pair.next())
            }
            Rule::ops_matches => {
                let mut pairs = pair.into_inner();
                let ops: Vec<(&str, &str)> = pairs
                    .next()
                    .unwrap()
                    .into_inner()
                    .map(|p| {
                        println!("{}", p.as_str());
                        let mut op = p.into_inner();
                        let operator = op.next().unwrap().as_str();
                        let name = match op.next() {
                            Some(p) => p.as_str(),
                            None => "",
                        };
                        (operator, name)
                    })
                    .collect();
                let matches = concat_if_needed(
                    pairs
                        .next()
                        .unwrap()
                        .into_inner()
                        .map(|p| parse_rule(Some(p)))
                        .collect(),
                );
                ops.iter().rfold(matches, |ast, (op, name)| Ast::Operator {
                    op: op,
                    name: name,
                    subexpr: Box::new(ast),
                })
            }
            Rule::either => Ast::Either(pair.into_inner().map(Some).map(parse_rule).collect()),
            Rule::matches => {
                concat_if_needed(pair.into_inner().map(Some).map(parse_rule).collect())
            }
            Rule::macro_ => {
                let mut p = pair.into_inner();
                let name = p.next().unwrap().as_str();
                Ast::Macro(name)
            }
            Rule::outer_literal => Ast::Literal(pair.as_str()),
            Rule::inner_literal => todo!(),
            Rule::until_quote => todo!(),
            Rule::until_doublequote => todo!(),
            Rule::token => Ast::Literal(pair.as_str()),
            Rule::WHITESPACE
            | Rule::EOI
            | Rule::whitespace_characters
            | Rule::kleenexp
            | Rule::ops
            | Rule::op
            | Rule::match_ => {
                unreachable!()
            }
        },
    }
}

fn concat_if_needed(mut nodes: Vec<Ast>) -> Ast {
    if nodes.len() == 1 {
        return nodes.swap_remove(0);
    }
    Ast::Concat(nodes)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(pattern: &str) {
        KleenexpParser::parse(Rule::kleenexp, pattern)
            .unwrap()
            .next()
            .unwrap();
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
        parse("[#hello #world | [2+ #hi]]");
    }

    #[test]
    #[should_panic]
    fn braces_must_be_balanced() {
        parse("[");
    }

    #[test]
    #[should_panic]
    fn either_and_ops_dont_mix() {
        parse("[2+ #a | #b]");
    }

    #[test]
    fn parser_result() {
        assert_eq!(Ok(Ast::Macro("hello")), super::parse("[#hello]"));
        assert_eq!(
            Ok(Ast::Concat(vec![Ast::Macro("hello"), Ast::Macro("hi")])),
            super::parse("[#hello #hi]")
        );
        assert_eq!(
            Ok(Ast::Concat(vec![Ast::Macro("hello"), Ast::Macro("hi")])),
            super::parse("[#hello#hi]")
        );
    }
    #[test]
    fn parser_result_operator() {
        assert_eq!(
            Ok(Ast::Operator {
                op: "2+",
                name: "",
                subexpr: Box::new(Ast::Macro("hello"))
            }),
            super::parse("[2+ #hello]")
        );
        assert_eq!(
            Ok(Ast::Operator {
                op: "capture",
                name: "hi",
                subexpr: Box::new(Ast::Macro("hello"))
            }),
            super::parse("[capture:hi #hello]")
        );
    }

    #[test]
    fn parser_result_operators() {
        assert_eq!(
            Ok(Ast::Operator {
                op: "capture",
                name: "hi",
                subexpr: Box::new(Ast::Operator {
                    op: "2+",
                    name: "",
                    subexpr: Box::new(Ast::Macro("hello"))
                })
            }),
            super::parse("[capture:hi 2+ #hello]")
        );
        assert_eq!(
            Ok(Ast::Operator {
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
            }),
            super::parse("[capture:hi 2+ op1 op2 op3:yo #hello #world]")
        );
    }

    #[test]
    fn parser_result_either() {
        assert_eq!(
            Ok(Ast::Either(vec![Ast::Macro("hello"), Ast::Macro("world")])),
            super::parse("[#hello | #world]")
        );
        assert_eq!(
            Ok(Ast::Either(vec![
                Ast::Concat(vec![Ast::Macro("hello"), Ast::Macro("world")]),
                Ast::Operator {
                    op: "2+",
                    name: "",
                    subexpr: Box::new(Ast::Macro("hi"))
                }
            ])),
            super::parse("[#hello #world | [2+ #hi]]")
        );
    }
}
