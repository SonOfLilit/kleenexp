use pest::error::Error;
use pest::iterators::Pair;
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
    match rule {
        Some(r) => Ok(parse_rule(r)),
        None => Ok(Ast::Concat(vec![])),
    }
}

fn parse_rule(pair: Pair<Rule>) -> Ast {
    match pair.as_rule() {
        Rule::braces => {
            let mut pair = pair.into_inner();
            match pair.next() {
                Some(pair) => parse_rule(pair),
                None => Ast::Concat(vec![]),
            }
        }
        Rule::ops_matches => {
            let mut pair = pair.into_inner();
            let mut op = pair.next().unwrap().into_inner();
            let operator = op.next().unwrap().as_str();
            let name: &str = op.next().map(|p| p.as_str()).unwrap_or("");
            Ast::Operator {
                op: operator,
                name: name,
                subexpr: Box::new(parse_rule(pair.next().unwrap())),
            }
        }
        Rule::op => todo!(),
        Rule::either => todo!(),
        Rule::matches => concat_if_needed(pair.into_inner().map(parse_rule).collect()),
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
        | Rule::match_ => {
            unreachable!()
        }
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

    fn parse(pattern: &str) -> Result<(), Error<Rule>> {
        KleenexpParser::parse(Rule::kleenexp, pattern)?
            .next()
            .unwrap();
        Ok(())
    }

    #[test]
    fn parser() {
        parse("").unwrap();
        parse("hello").unwrap();
        parse("Hi!@#$%^&'' \" \\ \n stuff").unwrap();
        parse("[ ]").unwrap();
        parse("[]").unwrap();
        parse("[][]").unwrap();
        assert_eq!(Ok(Ast::Macro("hello")), super::parse("[#hello]"));
    }
}
