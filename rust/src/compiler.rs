use std::collections::HashMap;

use lazy_static::lazy_static;
use nom::error::VerboseError;

use crate::parse::{self, Ast};

#[derive(Debug)]
pub enum Error {
    ParseError(String),
    CompileError(String),
}

#[derive(Copy, Clone, PartialEq, Eq)]
pub enum RegexFlavor {
    Python,
    Javascript,
    Rust,
    RustFancy,
}

#[derive(Clone, Debug)]
enum Regexable {
    Literal(String),
    Multiple {
        min: u32,
        max: Option<u32>,
        is_greedy: bool,
        sub: Box<Regexable>,
    },
    Either(Vec<Regexable>),
    Concat(Vec<Regexable>),
    CharacterClass {
        characters: Vec<CharacterClassComponent>,
        inverted: bool,
    },
    Boundary(String, Option<String>),
    Capture(String, Box<Regexable>),
    ParensOperator(ParensOperator, Box<Regexable>),
}

#[derive(Clone, Debug)]
enum CharacterClassComponent {
    Special(String),
    Single(char),
    Range(char, char),
}

#[derive(Clone, Debug)]
enum ParensOperator {
    Lookahead,
    Lookbehind,
    NegativeLookahead,
    NegativeLookbehind,
}

impl Regexable {
    fn to_regex(self, flavor: RegexFlavor, wrap: bool) -> Result<String, String> {
        match self {
            Regexable::Literal(s) => Ok(wrap_if(wrap && s.len() != 1, &escape(&s))),
            Regexable::Multiple {
                min,
                max,
                is_greedy,
                sub,
            } => {
                let op: String = match (min, max) {
                    (0, None) => "*".to_string(),
                    (1, None) => "+".to_string(),
                    (0, Some(1)) => "?".to_string(),
                    (a, None) => format!("{{{},}}", a),
                    (a, Some(b)) => format!(
                        "{{{}}}",
                        if a == b {
                            a.to_string()
                        } else {
                            format!("{},{}", a, b)
                        }
                    ),
                } + if is_greedy { "?" } else { "" };
                Ok(wrap_if(
                    wrap,
                    (sub.to_regex(flavor, true)?.to_string() + &op).as_str(),
                ))
            }
            Regexable::Either(items) => Ok(wrap_if(
                wrap,
                &items
                    .into_iter()
                    .map(|r| r.to_regex(flavor, false))
                    .collect::<Result<Vec<_>, _>>()?
                    .join("|"),
            )),
            Regexable::Concat(items) => Ok(wrap_if(
                wrap,
                &items
                    .into_iter()
                    .map(|r| {
                        let wrap = match &r {
                            Regexable::Either(subs) => subs.len() > 1,
                            _ => false,
                        };
                        r.to_regex(flavor, wrap)
                    })
                    .collect::<Result<Vec<_>, _>>()?
                    .join(""),
            )),
            Regexable::CharacterClass {
                characters,
                inverted,
            } => Ok(match characters.len() {
                0 => {
                    if inverted {
                        ".".to_string()
                    } else {
                        // Empty class (how did we get one?!) => need an expression that never matches.
                        // http://stackoverflow.com/a/942122/239657: a lookahead of empty string
                        // always matches, negative lookahead never does.
                        // The dot afterward is to express an exactly-one-char pattern,
                        // though it won't matter.
                        "(?!).".to_string()
                    }
                }
                1 => {
                    let c = &characters[0];
                    match c {
                        CharacterClassComponent::Single(ch) => {
                            if !inverted {
                                // TODO: isn't it automatically escaped by Literal::to_regex?
                                /*
                                if is_char_escape(ch) {
                                    char_escapes[ch]
                                } else {
                                    Regexable::Literal(ch.as_str()).to_regex(flavor, false)?
                                }*/
                                Regexable::Literal(ch.to_string()).to_regex(flavor, false)?
                            } else {
                                render_character_class(&characters, inverted)?
                            }
                        }
                        CharacterClassComponent::Special(s)
                            if s == r"\d" || s == r"\s" || s == r"\w" =>
                        {
                            if inverted {
                                s.to_uppercase()
                            } else {
                                s.to_string()
                            }
                        }
                        _ => render_character_class(&characters, inverted)?,
                    }
                }
                _ => render_character_class(&characters, inverted)?,
            }),
            Regexable::Boundary(character, _reverse) => Ok(character.to_string()),
            Regexable::Capture(name, subexp) => {
                let regex_name = if name.len() > 0 {
                    format!(
                        "?{}<{name}>",
                        if flavor == RegexFlavor::Javascript {
                            ""
                        } else {
                            "P"
                        }
                    )
                } else {
                    "".to_string()
                };
                Ok(format!(
                    "({}{})",
                    regex_name,
                    subexp.to_regex(flavor, false)?
                ))
            }
            Regexable::ParensOperator(operator, subexp) => {
                let header = match operator {
                    ParensOperator::Lookahead => "?=",
                    ParensOperator::Lookbehind => "?<=",
                    ParensOperator::NegativeLookahead => "?!",
                    ParensOperator::NegativeLookbehind => "?<!",
                };
                Ok(format!("({header}{})", subexp.to_regex(flavor, false)?))
            }
        }
    }
}

fn invert(regexable: Regexable) -> Result<Regexable, String> {
    match regexable {
        Regexable::Literal(s) if s.len() == 1 => Ok(Regexable::CharacterClass {
            characters: vec![CharacterClassComponent::Single(s.chars().next().unwrap())],
            inverted: true,
        }),
        Regexable::CharacterClass {
            characters,
            inverted,
        } => Ok(Regexable::CharacterClass {
            characters: characters,
            inverted: !inverted,
        }),
        Regexable::Boundary(a, Some(b)) => Ok(Regexable::Boundary(b, Some(a))),
        Regexable::ParensOperator(operator, subexpr) => {
            let inverted = match operator {
                ParensOperator::Lookahead => ParensOperator::NegativeLookahead,
                ParensOperator::Lookbehind => ParensOperator::NegativeLookbehind,
                ParensOperator::NegativeLookahead => ParensOperator::Lookahead,
                ParensOperator::NegativeLookbehind => ParensOperator::Lookbehind,
            };
            Ok(Regexable::ParensOperator(inverted, subexpr.clone()))
        }
        Regexable::Capture(_, _) => todo!(),
        _ => Err(format!(
            "Expression {:?} cannot be inverted (maybe try [not lookahead <expression>]?)",
            regexable
        )),
    }
}

macro_rules! escape_chars {
    ( $map:ident, $( $x:expr ),* ) => {
        {
            $(
                $map.insert($x, concat!("\\", $x));
            )*
        }
    };
}

lazy_static! {
    static ref ESCAPES: HashMap<char, &'static str> = {
        let mut map = HashMap::new();
        escape_chars![map, '(', ')', '[', ']', '{', '}', '?', '*', '+', '|', '^', '$', '\\', '.'];
        map.insert('\t', "\\t");
        map.insert('\n', "\\n");
        map.insert('\r', "\\r");
        map.insert('\x0b', "\\v");
        map.insert('\x0c', "\\f");
        map
    };
    static ref CHARACTER_CLASS_ESCAPES: HashMap<char, &'static str> = {
        let mut map = HashMap::new();
        escape_chars![map, '^', '-', '[', ']', '\\'];
        map.insert('\t', "\\t");
        map.insert('\n', "\\n");
        map.insert('\r', "\\r");
        map.insert('\x0b', "\\v");
        map.insert('\x0c', "\\f");
        map
    };
}

fn escape(string: &str) -> String {
    string
        .chars()
        .map(|c| match ESCAPES.get(&c) {
            Some(s) => s.to_string(),
            _ => c.to_string(),
        })
        .collect::<Vec<_>>()
        .join("")
}

fn render_character_class(
    characters: &Vec<CharacterClassComponent>,
    inverted: bool,
) -> Result<String, String> {
    let mut ranges = characters
        .iter()
        .map(render_character_range)
        .collect::<Result<Vec<_>, _>>()?;
    ranges.sort();
    Ok(format!(
        "[{}{}]",
        if inverted { "^" } else { "" },
        ranges.join("")
    ))
}

fn render_character_range(component: &CharacterClassComponent) -> Result<String, String> {
    match component {
        CharacterClassComponent::Special(s) => Ok(s.to_string()),
        CharacterClassComponent::Single(c) => Ok(character_class_escape(*c)),
        CharacterClassComponent::Range(a, b) if a == b => Ok(character_class_escape(*a)),
        CharacterClassComponent::Range(a, b) if a < b => Ok(format!(
            "{}-{}",
            character_class_escape(*a),
            character_class_escape(*b)
        )),
        CharacterClassComponent::Range(a, b) => {
            Err(format!("'#{}-{}' is not a legal character range", a, b))
        }
    }
}

fn character_class_escape(c: char) -> String {
    match CHARACTER_CLASS_ESCAPES.get(&c) {
        Some(s) => s.to_string(),
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

impl<'s> Ast<'s> {
    fn compile(self, macros: &'s Macros) -> Result<Regexable, String> {
        match self {
            Ast::Concat(items) => Ok(Regexable::Concat({
                let (matches, defs): (Vec<_>, Vec<_>) =
                    items.into_iter().partition(|ast| match ast {
                        Ast::DefMacro(_, _) => false,
                        _ => true,
                    });
                let mut macro_map = HashMap::new();
                defs.into_iter()
                    .map(|def| match def {
                        Ast::DefMacro(name, body) => {
                            if macro_map.contains_key(name) {
                                Err(format!("Macro #{} already defined", name))?
                            }
                            println!("inserting {}", name);
                            macro_map.insert(name, body.compile(&macros.push(&macro_map))?);
                            Ok::<_, String>(())
                        }
                        _ => unreachable!(),
                    })
                    .collect::<Result<_, _>>()?;
                matches
                    .into_iter()
                    .map(|ast| ast.compile(&macros.push(&macro_map)))
                    .collect::<Result<Vec<_>, String>>()?
            })),
            Ast::Either(items) => {
                let compiled = items
                    .into_iter()
                    .map(|ast| ast.compile(macros))
                    .collect::<Result<Vec<_>, String>>()?;
                let all_single_char = compiled.iter().all(|c| match c {
                    Regexable::Literal(s) if s.len() == 1 => true,
                    Regexable::CharacterClass {
                        characters: _,
                        inverted,
                    } if !inverted => true,
                    _ => false,
                });
                if all_single_char {
                    Ok(Regexable::CharacterClass {
                        characters: compiled
                            .iter()
                            .map(|item| match item {
                                Regexable::Literal(s) if s.len() == 1 => {
                                    vec![CharacterClassComponent::Single(s.chars().next().unwrap())]
                                }
                                Regexable::CharacterClass {
                                    characters,
                                    inverted,
                                } if !inverted => characters.to_vec(),
                                _ => unreachable!(),
                            })
                            .flatten()
                            .map(|c| c.clone())
                            .collect(),
                        inverted: false,
                    })
                } else {
                    Ok(Regexable::Either(compiled))
                }
            }
            Ast::Multiple { from, to, subexpr } => {
                let body = subexpr.compile(macros)?;
                check_not_empty(&body, || {
                    format!(
                        "Range {}-{}",
                        from,
                        to.map_or("".to_string(), |n| n.to_string())
                    )
                })?;
                if from == 0 && to == Some(0) {
                    return Ok(Regexable::Literal("".to_string()));
                }
                Ok(Regexable::Multiple {
                    min: from,
                    max: to.clone(),
                    is_greedy: false,
                    sub: Box::new(body),
                })
            }
            Ast::Operator { op, name, subexpr } => Ok({
                if op == "comment" {
                    return Ok(Regexable::Literal("".to_string()));
                }
                let body = subexpr.compile(macros)?;
                check_not_empty(&body, || format!("Operator {}", op))?;
                match op {
                    "capture" | "c" => Regexable::Capture(name.to_string(), Box::new(body)),
                    "not" | "n" => {
                        if name.len() > 0 {
                            Err("Invert operator does not accept name")?;
                        }
                        invert(body)?
                    }
                    "lookahead" | "la" => {
                        Regexable::ParensOperator(ParensOperator::Lookahead, Box::new(body))
                    }
                    "lookbehind" | "lb" => {
                        Regexable::ParensOperator(ParensOperator::Lookbehind, Box::new(body))
                    }
                    _ => Err(format!("Operator {} does not exist", op))?,
                }
            }),
            Ast::Macro(name) => macros.get_macro(name),
            Ast::Range { start, end }
                if start <= end
                    && start.is_alphanumeric()
                    && end.is_alphanumeric()
                    && start.is_alphabetic() == end.is_alphabetic() =>
            {
                Ok(Regexable::CharacterClass {
                    characters: vec![CharacterClassComponent::Range(start, end)],
                    inverted: false,
                })
            }
            Ast::Range { start, end } => {
                Err(format!("Invalid character range: {}..{}", start, end))
            }
            Ast::Literal(s) => Ok(Regexable::Literal(s.to_string())),
            Ast::DefMacro(name, body) => unreachable!(),
        }
    }
}

fn check_not_empty<F: FnOnce() -> String>(expr: &Regexable, name_thunk: F) -> Result<(), String> {
    let is_empty = match expr {
        Regexable::Concat(ref v) => v.len() == 0,
        Regexable::Literal(ref s) => s.len() == 0,
        _ => false,
    };
    if is_empty {
        Err(format!("{} not allowed to have empty body", name_thunk()))?;
    };
    Ok(())
}

fn parse_and_compile(kleenexp: &str, macros: &Macros) -> Result<Regexable, Error> {
    let ast = parse::parse::<VerboseError<_>>(kleenexp)
        .map_err(|e| Error::ParseError(format!("{}", e)))?
        .1;
    Ok(ast
        .compile(macros)
        .map_err(|e| Error::CompileError(format!("{}", e)))?)
}

pub fn transpile(pattern: &str, flavor: RegexFlavor) -> Result<String, Error> {
    return parse_and_compile(pattern, &MACROS)?
        .to_regex(flavor, false)
        .map_err(Error::CompileError);
}

type Macros<'a> = OwnOrRef<'a, MacrosNode<'a>>;

struct MacrosNode<'a> {
    scope: OwnOrRef<'a, HashMap<&'a str, Regexable>>,
    parent: Option<&'a MacrosNode<'a>>,
}

impl MacrosNode<'_> {
    fn find_macro(&self, name: &str) -> Option<Regexable> {
        self.scope
            .reference()
            .get(name)
            .map(|x| x.clone())
            .or_else(|| self.parent.as_ref()?.find_macro(name))
    }
}

impl Macros<'_> {
    fn new<'a>(map: HashMap<&'a str, Regexable>) -> Macros<'a> {
        OwnOrRef::Own(MacrosNode {
            scope: OwnOrRef::Own(map),
            parent: None,
        })
    }

    fn newref<'a>(map: &'a HashMap<&'a str, Regexable>) -> Macros<'a> {
        OwnOrRef::Own(MacrosNode {
            scope: OwnOrRef::Ref(map),
            parent: None,
        })
    }

    fn push<'a>(&'a self, map: &'a HashMap<&'a str, Regexable>) -> Macros<'a> {
        if map.len() == 0 {
            OwnOrRef::Ref(self.reference())
        } else {
            OwnOrRef::Own(MacrosNode {
                scope: OwnOrRef::Ref(map),
                parent: Some(self.reference()),
            })
        }
    }

    fn get_macro(&self, name: &str) -> Result<Regexable, String> {
        self.reference().find_macro(name).map_or(
            Err(format!(
                "Macro not defined: {}, defined: {:?}",
                name,
                self.reference().scope.reference().keys()
            )),
            |x| Ok(x),
        )
    }
}

enum OwnOrRef<'a, T> {
    Own(T),
    Ref(&'a T),
}

impl<T> OwnOrRef<'_, T> {
    fn reference(&self) -> &T {
        match self {
            OwnOrRef::Own(o) => &o,
            OwnOrRef::Ref(r) => r,
        }
    }
}

lazy_static! {
    static ref MACROS: Macros<'static> = {
        let mut map = HashMap::new();
        {
            let any = Regexable::CharacterClass {
                characters: vec![],
                inverted: true,
            };
            map.insert("any", any.clone());
            let newline_characters = vec![
                CharacterClassComponent::Single('\r'),
                CharacterClassComponent::Single('\n'),
                CharacterClassComponent::Special("\\u2028".to_string()),
                CharacterClassComponent::Special("\\u2029".to_string()),
            ];

            let newline = Regexable::Either(vec![
                Regexable::CharacterClass {
                    characters: newline_characters.clone(),
                    inverted: false,
                },
                Regexable::Literal("\r\n".to_string()),
            ]);
            map.insert("newline", newline.clone());
            // this is the inversion of #newline_character, not of #newline, for practical reasons
            map.insert("not_newline", Regexable::CharacterClass {
                    characters: newline_characters.clone(),
                    inverted: true,
                });
            map.insert("any_at_all", Regexable::Either(vec![any.clone(), newline.clone()]));

            let mut insert_character_class = |name, components: Vec<CharacterClassComponent>| {
                map.insert(
                    name,
                    Regexable::CharacterClass {
                        characters: components,
                        inverted: false,
                    },
                )
            };
            insert_character_class("newline_character", newline_characters.clone());
            insert_character_class(
                "linefeed",
                vec![CharacterClassComponent::Single('\n')],
            );
            insert_character_class(
                "carriage_return",
                vec![CharacterClassComponent::Single('\r')],
            );
            insert_character_class(
                "tab",
                vec![CharacterClassComponent::Single('\t')],
            );
            insert_character_class(
                "digit",
                vec![CharacterClassComponent::Special(r"\d".to_string())],
            );
            insert_character_class(
                "letter",
                vec![
                    CharacterClassComponent::Range('A', 'Z'),
                    CharacterClassComponent::Range('a', 'z'),
                ],
            );
            insert_character_class(
                "lowercase",
                vec![CharacterClassComponent::Range(
                    'a',
                    'z',
                )],
            );
            insert_character_class(
                "uppercase",
                vec![CharacterClassComponent::Range(
                    'A',
                    'Z',
                )],
            );
            insert_character_class(
                "space",
                vec![CharacterClassComponent::Special(r"\s".to_string())],
            );
            insert_character_class(
                "token_character",
                vec![CharacterClassComponent::Special(r"\w".to_string())],
            );
        }
        {
            let mut insert_boundary =
                |name, code: &str, reverse| map.insert(name, Regexable::Boundary(code.to_string(), reverse));
            insert_boundary("start_line", "^", None);
            insert_boundary("end_line", "$", None);
            insert_boundary("start_string", r"\A", None);
            // TODO: \z matches purely at string end; \Z also matches before \n\z.
            // Should we expose \z or the pragmatic \Z you usually want?  Or both?
            insert_boundary("end_string", r"\Z", None);
            insert_boundary("word_boundary", r"\b", Some(r"\B".to_string()));
        }
        {
            let mut insert_literal =
                |name, s: &'static str| map.insert(name, Regexable::Literal(s.to_string()));
            insert_literal("windows_newline", "\r\n");
            insert_literal("quote", "'");
            insert_literal("double_quote", "\"");
            insert_literal("left_brace", "[");
            insert_literal("right_brace", "]");
            insert_literal("vertical_tab", "\x0b");
            insert_literal("formfeed", "\x0c");
            insert_literal("bell", "\x07");
            insert_literal("backspace", "\x08");
        }
        for (name, short) in [
            ("linefeed", "lf"),
            ("carriage_return", "cr"),
            ("tab", "t"),
            ("digit", "d"),
            ("letter", "l"),
            ("lowercase", "lc"),
            ("uppercase", "uc"),
            ("space", "s"),
            ("token_character", "tc"),
            ("word_boundary", "wb"),] {
            map.insert(short, map.get(name).unwrap().clone());
        }
        for (name, short) in [
            ("any", "a"),
            ("any_at_all", "aaa"),
            ("newline", "n"),
            ("newline_character", "nc"),
            //("not_newline", "nn"),
            ("windows_newline", "crlf"),
            ("start_string", "ss"),
            ("end_string", "es"),
            ("start_line", "sl"),
            ("end_line", "el"),
            ("quote", "q"),
            ("double_quote", "dq"),
            ("left_brace", "lb"),
            ("right_brace", "rb"),
        ] {
            map.insert(short, map.get(name).unwrap().clone());
        }
        {
            let mut insert_builtin =
                |name: &'static str, short: Option<&'static str>, kleenexp: &'static str| {
                    let macros = Macros::newref(&map);
                    let result = parse_and_compile(kleenexp, &macros);
                    match result {
                        Ok(regexable) => {
                            short.map(|s| map.insert(s, regexable.clone()));
                            map.insert(name, regexable);
                        }
                        Err(error) => {
                            panic!("error defining builtin macro {}: {:?}", name, error);
                        }
                    }
                };
            insert_builtin("integer", Some("int"), "[[0-1 '-'] [1+ #digit]]");
            insert_builtin("unsigned_integer", Some("uint"), "[1+ #digit]");
            insert_builtin("real", None, "[#int [0-1 '.' #uint]]");
            insert_builtin(
                "float",
                None,
                "[[0-1 '-'] [[#uint '.' [0-1 #uint] | '.' #uint] [0-1 #exponent] | #int #exponent] #exponent=[['e' | 'E'] [0-1 ['+' | '-']] #uint]]",
            );
            insert_builtin("hex_digit", Some("hexd"), "[#digit | #a..f | #A..F]");
            insert_builtin("hex_number", Some("hexn"), "[1+ #hex_digit]");
            // this is not called #word because in legacy regex \w (prounounced "word character") is #token_character and I fear confusion
            insert_builtin("letters", None, "[1+ #letter]");
            insert_builtin("token", None, "[#letter | '_'][0+ #token_character]");
            insert_builtin("capture_0+_any", Some("c0"), "[capture 0+ #any]");
            insert_builtin("capture_1+_any", Some("c1"), "[capture 1+ #any]");
        }
        Macros::new(map)
    };
}
