use std::collections::HashMap;

use lazy_static::lazy_static;
use nom::error::VerboseError;

use crate::parse::{self, Ast};

#[derive(Debug)]
pub enum Error {
    ParseError(String),
    CompileError(String),
}

#[derive(Copy, Clone)]
enum RegexFlavor {
    Python,
    // Javascript,
    // Rust,
    // RustFancy,
}

#[derive(Clone, Debug)]
enum Regexable<'a> {
    Literal(&'a str),
    Multiple {
        min: u32,
        max: Option<u32>,
        is_greedy: bool,
        sub: Box<Regexable<'a>>,
    },
    Either(Vec<Regexable<'a>>),
    Concat(Vec<Regexable<'a>>),
    CharacterClass {
        characters: Vec<CharacterClassComponent>,
        inverted: bool,
    },
    Boundary(&'a str, Option<&'a str>),
    Capture(&'a str, Box<Regexable<'a>>),
}

#[derive(Clone, Debug)]
enum CharacterClassComponent {
    Single(String),
    Range(String, String),
}

impl Regexable<'_> {
    fn to_regex(&self, flavor: RegexFlavor, wrap: bool) -> Result<String, String> {
        match self {
            Regexable::Literal(s) => Ok(wrap_if(wrap && s.len() != 1, &escape(s))),
            Regexable::Multiple {
                min,
                max,
                is_greedy,
                sub,
            } => {
                let op: String = match (*min, *max) {
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
                } + if *is_greedy { "?" } else { "" };
                Ok(wrap_if(
                    wrap,
                    (sub.to_regex(flavor, true)?.to_string() + &op).as_str(),
                ))
            }
            Regexable::Either(items) => Ok(wrap_if(
                wrap,
                &items
                    .iter()
                    .map(|r| r.to_regex(flavor, false))
                    .collect::<Result<Vec<_>, _>>()?
                    .join("|"),
            )),
            Regexable::Concat(items) => Ok(wrap_if(
                wrap,
                &items
                    .iter()
                    .map(|r| {
                        r.to_regex(
                            flavor,
                            match r {
                                Regexable::Either(subs) => subs.len() > 1,
                                _ => false,
                            },
                        )
                    })
                    .collect::<Result<Vec<_>, _>>()?
                    .join(""),
            )),
            Regexable::CharacterClass {
                characters,
                inverted,
            } => Ok(match characters.len() {
                0 => {
                    if *inverted {
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
                                if ch.len() == 1 {
                                    // TODO: isn't it automatically escaped by Literal::to_regex?
                                    /*
                                    if is_char_escape(ch) {
                                        char_escapes[ch]
                                    } else {
                                        Regexable::Literal(ch.as_str()).to_regex(flavor, false)?
                                    }*/
                                    Regexable::Literal(ch.as_str()).to_regex(flavor, false)?
                                } else {
                                    ch.to_string() // it's \d or something
                                }
                            } else if ch == r"\d" || ch == r"\s" || ch == r"\w" {
                                ch.to_uppercase()
                            } else {
                                render_character_class(characters, inverted)?
                            }
                        }
                        _ => render_character_class(characters, inverted)?,
                    }
                }
                _ => render_character_class(characters, inverted)?,
            }),
            Regexable::Boundary(character, _reverse) => Ok(character.to_string()),
            Regexable::Capture(name, subexp) => {
                let regex_name = if name.len() > 0 {
                    format!("?P<{}>", name)
                } else {
                    "".to_string()
                };
                Ok(format!(
                    "({}{})",
                    regex_name,
                    subexp.to_regex(flavor, false)?
                ))
            }
        }
    }
}

fn invert<'a>(regexable: Regexable<'a>) -> Result<Regexable<'a>, String> {
    match regexable {
        Regexable::Literal(s) if s.len() == 1 => Ok(Regexable::CharacterClass {
            characters: vec![CharacterClassComponent::Single(s.to_string())],
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
        escape_chars![map, '(', ')', '[', ']', '{', '}', '?', '*', '+', '|', '^', '$', '\\'];
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
    inverted: &bool,
) -> Result<String, String> {
    let mut ranges = characters
        .iter()
        .map(render_character_range)
        .collect::<Result<Vec<_>, _>>()?;
    ranges.sort();
    Ok(format!(
        "[{}{}]",
        if *inverted { "^" } else { "" },
        ranges.join("")
    ))
}

fn render_character_range(component: &CharacterClassComponent) -> Result<String, String> {
    match component {
        CharacterClassComponent::Single(c) => Ok(character_class_escape(c)),
        CharacterClassComponent::Range(a, b) if a == b => Ok(character_class_escape(a)),
        CharacterClassComponent::Range(a, b) if a < b => Ok(format!(
            "{}-{}",
            character_class_escape(a),
            character_class_escape(b)
        )),
        CharacterClassComponent::Range(a, b) => {
            Err(format!("'#{}-{}' is not a legal character range", a, b))
        }
    }
}

fn character_class_escape(c: &str) -> String {
    if c.len() == 1 {
        match CHARACTER_CLASS_ESCAPES.get(&c.chars().nth(0).unwrap()) {
            Some(s) => s.to_string(),
            _ => c.to_string(),
        }
    } else {
        c.to_string()
    }
}

fn wrap_if(condition: bool, string: &str) -> String {
    if condition {
        format!("(?:{})", string)
    } else {
        string.to_string()
    }
}

pub fn compile(ast: Ast) -> Result<String, String> {
    ast.compile(&MACROS)?.to_regex(RegexFlavor::Python, false)
}

impl<'s> Ast<'s> {
    fn compile(&self, macros: &'_ Macros) -> Result<Regexable<'s>, String> {
        match self {
            Ast::Concat(items) => Ok(Regexable::Concat(
                items
                    .iter()
                    .map(|ast| ast.compile(macros))
                    .collect::<Result<Vec<_>, String>>()?,
            )),
            Ast::Either(items) => {
                let compiled = items
                    .iter()
                    .map(|ast| ast.compile(macros))
                    .collect::<Result<Vec<_>, String>>()?;
                let all_single_char = compiled.iter().all(|c| match c {
                    Regexable::Literal(s) if s.len() == 1 => true,
                    Regexable::CharacterClass {
                        characters: _,
                        inverted,
                    } if !*inverted => true,
                    _ => false,
                });
                if all_single_char {
                    Ok(Regexable::CharacterClass {
                        characters: compiled
                            .iter()
                            .map(|item| match item {
                                Regexable::Literal(s) if s.len() == 1 => {
                                    vec![CharacterClassComponent::Single(s.to_string())]
                                }
                                Regexable::CharacterClass {
                                    characters,
                                    inverted,
                                } if !*inverted => characters.to_vec(),
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
                if *from == 0 && *to == Some(0) {
                    return Ok(Regexable::Literal(""));
                }
                Ok(Regexable::Multiple {
                    min: *from,
                    max: to.clone(),
                    is_greedy: false,
                    sub: Box::new(body),
                })
            }
            Ast::Operator { op, name, subexpr } => {
                if *op == "comment" {
                    return Ok(Regexable::Literal(""));
                }
                let body = subexpr.compile(macros)?;
                check_not_empty(&body, || format!("Operator {}", op))?;
                match *op {
                    "capture" | "c" => Ok(Regexable::Capture(name, Box::new(body))),
                    "not" | "n" => {
                        if name.len() > 0 {
                            Err("Invert operator does not accept name")?;
                        }
                        invert(body)
                    }
                    "lookahead" | "la" => todo!(),
                    "lookbehind" | "lb" => todo!(),
                    _ => Err(format!("Operator {} does not exist", op))?,
                }
            }
            Ast::Macro(name) => get_macro(&macros, name),
            Ast::Range { start, end }
                if start <= end && start.is_alphabetic() == end.is_alphabetic() =>
            {
                Ok(Regexable::CharacterClass {
                    characters: vec![CharacterClassComponent::Range(
                        start.to_string(),
                        end.to_string(),
                    )],
                    inverted: false,
                })
            }
            Ast::Range { start, end } => {
                Err(format!("Invalid character range: {}..{}", start, end))
            }
            Ast::Literal(s) => Ok(Regexable::Literal(s)),
            Ast::DefMacro(_, _) => todo!(),
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

fn parse_and_compile<'a>(kleenexp: &'a str, macros: &'_ Macros) -> Result<Regexable<'a>, Error> {
    let ast = parse::parse::<VerboseError<_>>(kleenexp)
        .map_err(|e| Error::ParseError(format!("{}", e)))?
        .1;
    Ok(ast
        .compile(macros)
        .map_err(|e| Error::CompileError(format!("{}", e)))?)
}

fn get_macro<'a>(macros: &'_ Macros, name: &str) -> Result<Regexable<'a>, String> {
    macros
        .get(name)
        .map_or(Err(format!("Macro not defined: {}", name)), |x| {
            Ok(x.clone())
        })
}

fn clone_regexable(r: &Regexable<'static>) -> Regexable<'static> {
    match r {
        Regexable::Literal(s) => Regexable::Literal(s),
        Regexable::Multiple {
            min,
            max,
            is_greedy,
            sub,
        } => todo!(),
        Regexable::Either(rs) => Regexable::Either(rs.iter().map(clone_regexable).collect()),
        Regexable::Concat(_) => todo!(),
        Regexable::CharacterClass {
            characters,
            inverted,
        } => Regexable::CharacterClass {
            characters: characters.clone(),
            inverted: *inverted,
        },
        Regexable::Boundary(character, inverted) => Regexable::Boundary(character, *inverted),
        Regexable::Capture(_, _) => todo!(),
    }
}

pub fn transpile(pattern: &str) -> Result<String, Error> {
    return parse_and_compile(pattern, &MACROS.clone())?
        .to_regex(RegexFlavor::Python, false)
        .map_err(Error::CompileError);
}

type Macros = HashMap<&'static str, Regexable<'static>>;

lazy_static! {
    static ref MACROS: Macros = {
        let mut map = HashMap::new();
        {
            let any = Regexable::CharacterClass {
                characters: vec![],
                inverted: true,
            };
            map.insert("any", any.clone());
            let newline_characters = vec![
                CharacterClassComponent::Single(r"\r".to_string()),
                CharacterClassComponent::Single(r"\n".to_string()),
                CharacterClassComponent::Single(r"\u2028".to_string()),
                CharacterClassComponent::Single(r"\u2029".to_string()),
            ];

            let newline = Regexable::Either(vec![
                Regexable::CharacterClass {
                    characters: newline_characters.clone(),
                    inverted: false,
                },
                Regexable::Literal(r"\r\n"),
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
                vec![CharacterClassComponent::Single(r"\n".to_string())],
            );
            insert_character_class(
                "carriage_return",
                vec![CharacterClassComponent::Single(r"\r".to_string())],
            );
            insert_character_class(
                "tab",
                vec![CharacterClassComponent::Single(r"\t".to_string())],
            );
            insert_character_class(
                "digit",
                vec![CharacterClassComponent::Single(r"\d".to_string())],
            );
            insert_character_class(
                "letter",
                vec![
                    CharacterClassComponent::Range("A".to_string(), "Z".to_string()),
                    CharacterClassComponent::Range("a".to_string(), "z".to_string()),
                ],
            );
            insert_character_class(
                "lowercase",
                vec![CharacterClassComponent::Range(
                    "a".to_string(),
                    "z".to_string(),
                )],
            );
            insert_character_class(
                "uppercase",
                vec![CharacterClassComponent::Range(
                    "A".to_string(),
                    "Z".to_string(),
                )],
            );
            insert_character_class(
                "space",
                vec![CharacterClassComponent::Single(r"\s".to_string())],
            );
            insert_character_class(
                "token_character",
                vec![CharacterClassComponent::Single(r"\w".to_string())],
            );
        }
        {
            let mut insert_boundary =
                |name, code, reverse| map.insert(name, Regexable::Boundary(code, reverse));
            insert_boundary("start_line", "^", None);
            insert_boundary("end_line", "$", None);
            insert_boundary("start_string", r"\A", None);
            // TODO: \z matches purely at string end; \Z also matches before \n\z.
            // Should we expose \z or the pragmatic \Z you usually want?  Or both?
            insert_boundary("end_string", r"\Z", None);
            insert_boundary("word_boundary", r"\b", Some(r"\B"));
        }
        {
            let mut insert_literal =
                |name, s: &'static str| map.insert(name, Regexable::Literal(s));
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
            map.insert(short, clone_regexable(map.get(name).unwrap()));
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
            map.insert(short, clone_regexable(map.get(name).unwrap()));
        }
        {
            let mut insert_builtin =
                |name: &'static str, short: Option<&'static str>, kleenexp: &'static str| {
                    let result = parse_and_compile(kleenexp, &map);
                    match result {
                        Ok(regexable) => {
                            map.insert(name, regexable);
                            short.map(|s| map.insert(s, parse_and_compile(kleenexp, &map).unwrap()));
                        }
                        Err(error) => {
                            panic!("error defining builtin macro {}: {:?}", name, error);
                        }
                    }
                };
            insert_builtin("integer", Some("int"), "[[0-1 '-'] [1+ #digit]]");
            insert_builtin("unsigned_integer", Some("uint"), "[1+ #digit]");
            insert_builtin("real", None, "[#int [0-1 '.' #uint]]");
            /*
            insert_builtin(
                "float",
                None,
                "[[0-1 '-'] [[#uint '.' [0-1 #uint] | '.' #uint] [0-1 #exponent] | #int #exponent] #exponent=[['e' | 'E'] [0-1 ['+' | '-']] #uint]]",
            );
            */
            insert_builtin("hex_digit", Some("hexd"), "[#digit | #a..f | #A..F]");
            insert_builtin("hex_number", Some("hexn"), "[1+ #hex_digit]");
            // this is not called #word because in legacy regex \w (prounounced "word character") is #token_character and I fear confusion
            insert_builtin("letters", None, "[1+ #letter]");
            insert_builtin("token", None, "[#letter | '_'][0+ #token_character]");
            insert_builtin("capture_0+_any", Some("c0"), "[capture 0+ #any]");
            insert_builtin("capture_1+_any", Some("c1"), "[capture 1+ #any]");
        }
        map
    };
}
