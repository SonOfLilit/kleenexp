use lazy_static::lazy_static;
use std::collections::HashMap;

use crate::parse::Ast;

#[derive(Copy, Clone)]
enum RegexFlavor {
    Python,
    // Javascript,
    // Rust,
    // RustFancy,
}

#[derive(Clone)]
enum Regexable<'a> {
    Concat(Vec<Regexable<'a>>),
    Literal(&'a str),
    Multiple {
        min: u32,
        max: u32,
        is_greedy: bool,
        sub: Box<Regexable<'a>>,
    },
    CharacterClass {
        characters: Vec<CharacterClassComponent>,
        inverted: bool,
    },
}

#[derive(Clone)]
enum CharacterClassComponent {
    Single(char),
    Range(char, char),
}

impl Regexable<'_> {
    fn to_regex(&self, flavor: RegexFlavor, wrap: bool) -> String {
        match self {
            Regexable::Literal(s) => wrap_if(wrap && s.len() != 1, &escape(s)),
            Regexable::Concat(items) => wrap_if(
                wrap,
                &items
                    .iter()
                    .map(|r| {
                        r.to_regex(
                            flavor,
                            match r {
                                //Regexable::Either(subs) => subs.len() > 1,
                                _ => false,
                            },
                        )
                    })
                    .collect::<Vec<_>>()
                    .join(""),
            ),
            Regexable::Multiple {
                min,
                max,
                is_greedy,
                sub,
            } => todo!(),
            Regexable::CharacterClass {
                characters,
                inverted,
            } => {
                let ranges = characters
                    .iter()
                    .map(render_character_range)
                    .collect::<Vec<_>>()
                    .join("");
                format!("[{}{}]", if *inverted { "^" } else { "" }, ranges)
            }
        }
    }
}

fn escape(string: &str) -> String {
    string
        .chars()
        .map(|c| match c {
            '(' | ')' | '[' | ']' | '{' | '}' | '?' | '*' | '+' | '|' | '^' | '$' | '\\' => {
                format!("\\{}", c)
            }
            '\t' => "\\t".to_owned(),
            '\n' => "\\n".to_owned(),
            '\r' => "\\r".to_owned(),
            '\x0b' => "\\v".to_owned(),
            '\x0c' => "\\f".to_owned(),
            _ => c.to_string(),
        })
        .collect::<Vec<_>>()
        .join("")
}

fn render_character_range(component: &CharacterClassComponent) -> String {
    match component {
        CharacterClassComponent::Single(c) => character_class_escape(c),
        CharacterClassComponent::Range(a, b) => format!(
            "{}-{}",
            character_class_escape(a),
            character_class_escape(b)
        ),
    }
}

fn character_class_escape(c: &char) -> String {
    match c {
        '^' | '-' | ']' | '\\' => {
            format!("\\{}", c)
        }
        '\t' => "\\t".to_owned(),
        '\n' => "\\n".to_owned(),
        '\r' => "\\r".to_owned(),
        '\x0b' => "\\v".to_owned(),
        '\x0c' => "\\f".to_owned(),
        _ => c.to_string(),
    }
}

fn wrap_if(condition: bool, string: &str) -> String {
    if condition {
        format!("(?:{})", string)
    } else {
        string.to_string()
    }
}

pub fn compile(ast: Ast) -> String {
    ast.compile().to_regex(RegexFlavor::Python, false)
}

impl Ast<'_> {
    fn compile(&self) -> Regexable {
        match self {
            Ast::Concat(items) => {
                Regexable::Concat(items.iter().map(|ast| ast.compile()).collect())
            }
            Ast::Either(items) => todo!(),
            Ast::Operator { op, name, subexpr } => todo!(),
            Ast::Macro(name) => MACROS
                .get(name)
                .unwrap_or_else(|| panic!("{}", name))
                .clone(),
            Ast::Range { start, end } => todo!(),
            Ast::Literal(s) => Regexable::Literal(s),
        }
    }
}

lazy_static! {
    static ref MACROS: HashMap<&'static str, Regexable<'static>> = {
        let mut map = HashMap::new();
        map.insert(
            "letter",
            Regexable::CharacterClass {
                characters: vec![
                    CharacterClassComponent::Range('A', 'Z'),
                    CharacterClassComponent::Range('a', 'z'),
                ],
                inverted: false,
            },
        );
        map
    };
}
