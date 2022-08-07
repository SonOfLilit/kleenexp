use pest::error::Error;
use pest::iterators::Pair;
use pest::Parser;

#[derive(Parser)]
#[grammar = "kleenexp.pest"]
pub struct KleenexpParser;

pub enum Ast<'a> {
    Concat(Vec<Ast<'a>>),
    Either(Vec<Ast<'a>>),
    Operator {
        op: &'a str,
        name: &'a str,
        subexpr: &'a Ast<'a>,
    },
    Macro(&'a str),
    Range {
        start: &'a str,
        end: &'a str,
    },
    Literal(&'a str),
}

pub fn parse(pattern: &str) -> Result<Ast, Error<Rule>> {
    let rule = KleenexpParser::parse(Rule::kleenexp, pattern)?
        .next()
        .unwrap();
    Ok(parse_rule(rule))
}

fn parse_rule(pair: Pair<Rule>) -> Ast {
    match pair.as_rule() {
        Rule::kleenexp => concat_if_needed(pair.into_inner().map(parse_rule).collect()),
        Rule::outer_literal => Ast::Literal(pair.as_str()),
        Rule::braces => Ast::Concat(Vec::new()),
        Rule::EOI => Ast::Literal(""),
    }
}

fn concat_if_needed(mut nodes: Vec<Ast>) -> Ast {
    if nodes.len() == 1 {
        return nodes.swap_remove(0);
    }
    Ast::Concat(nodes)
}
