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

#[derive(Clone)]
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
            } => {
                let ranges = characters
                    .iter()
                    .map(render_character_range)
                    .collect::<Result<Vec<_>, _>>()?
                    .join("");
                Ok(format!("[{}{}]", if *inverted { "^" } else { "" }, ranges))
            }
            Regexable::Boundary(character, reverse) => Ok(character.to_string()),
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

    /*
    fn invert<'a>(&self) -> Result<Regexable<'a>, String> {
        match self {
            Regexable::Literal(_) => todo!(),
            Regexable::Multiple {
                min,
                max,
                is_greedy,
                sub,
            } => todo!(),
            Regexable::Either(_) => todo!(),
            Regexable::Concat(_) => todo!(),
            Regexable::CharacterClass {
                characters,
                inverted,
            } => Ok(Regexable::CharacterClass {
                characters: characters.clone(),
                inverted: !inverted,
            }),
            Regexable::Boundary(a, Some(b)) => Ok(Regexable::Boundary(b, Some(a))),
            Regexable::Boundary(_, _) => todo!(),
            Regexable::Capture(_, _) => todo!(),
        }
    }
    */
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
            Err(format!("'#{}-{}' is not a legal character class", a, b))
        }
    }
}

fn character_class_escape(c: &str) -> String {
    match c {
        "^" | "-" | "]" | "\\" => {
            format!("\\{}", c)
        }
        "\t" => "\\t".to_owned(),
        "\n" => "\\n".to_owned(),
        "\r" => "\\r".to_owned(),
        "\x0b" => "\\v".to_owned(),
        "\x0c" => "\\f".to_owned(),
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

pub fn compile(ast: Ast) -> Result<String, String> {
    ast.compile()?.to_regex(RegexFlavor::Python, false)
}

impl Ast<'_> {
    fn compile(&self) -> Result<Regexable, String> {
        match self {
            Ast::Concat(items) => Ok(Regexable::Concat(
                items
                    .iter()
                    .map(|ast| ast.compile())
                    .collect::<Result<Vec<_>, String>>()?,
            )),
            Ast::Either(items) => Ok(Regexable::Either(
                items
                    .iter()
                    .map(|ast| ast.compile())
                    .collect::<Result<Vec<_>, String>>()?,
            )),
            /*Ast::Operator { op, name, Ast::Concat(x) } if x.len() == 0 => {
                Err(format!("Operator {} not allowed to have empty body", name))
            }*/
            Ast::Multiple { from, to, subexpr } => Ok(Regexable::Multiple {
                min: *from,
                max: to.clone(),
                is_greedy: false,
                sub: Box::new(subexpr.compile()?),
            }),
            Ast::Operator { op, name, subexpr } => Ok({
                let body = Box::new(subexpr.compile()?);
                match *op {
                    "comment" => Regexable::Literal(""),
                    "capture" | "c" => Regexable::Capture(name, body),
                    "not" | "n" => todo!(),
                    "lookahead" | "la" => todo!(),
                    "lookbehind" | "lb" => todo!(),
                    _ => todo!(),
                }
            }),
            Ast::Macro(name) => MACROS
                .get(name)
                .map_or(Err(format!("Macro not defined: {}", name)), |x| {
                    Ok(x.clone())
                }),
            Ast::Range { start, end } => Ok(Regexable::CharacterClass {
                characters: vec![CharacterClassComponent::Range(
                    start.to_string(),
                    end.to_string(),
                )],
                inverted: false,
            }),
            Ast::Literal(s) => Ok(Regexable::Literal(s)),
            Ast::DefMacro(_, _) => todo!(),
        }
    }
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

lazy_static! {
    static ref MACROS: HashMap<&'static str, Regexable<'static>> = {
        let mut map = HashMap::new();
        {
            let any = Regexable::CharacterClass {
                characters: vec![],
                inverted: true,
            };
            map.insert("any", any.clone());
            let newline = Regexable::Either(vec![
                Regexable::CharacterClass {
                    characters: vec![
                        CharacterClassComponent::Single(r"\r".to_string()),
                        CharacterClassComponent::Single(r"\n".to_string()),
                        CharacterClassComponent::Single(r"\u2028".to_string()),
                        CharacterClassComponent::Single(r"\u2029".to_string()),
                    ],
                    inverted: false,
                },
                Regexable::Literal(r"\r\n"),
            ]);
            map.insert("newline", newline.clone());
            // TODO: let not_newline = newline.clone().invert().unwrap();
            //map.insert("not_newline", not_newline);
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
            insert_character_class(
                "newline_character",
                vec![
                    CharacterClassComponent::Single(r"\r".to_string()),
                    CharacterClassComponent::Single(r"\n".to_string()),
                    CharacterClassComponent::Single(r"\u2028".to_string()),
                    CharacterClassComponent::Single(r"\u2029".to_string()),
                ],
            );
        }
        {
            let mut insert_boundary =
                |name, code, reverse| map.insert(name, Regexable::Boundary(code, reverse));
            insert_boundary("start_string", "^", None);
            insert_boundary("end_string", "$", None);
            insert_boundary("start_line", r"\A", None);
            // TODO: \z matches purely at string end; \Z also matches before \n\z.
            // Should we expose \z or the pragmatic \Z you usually want?  Or both?
            insert_boundary("end_line", r"\Z", None);
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
        for (name, short) in [("linefeed", "lf"),
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
        /* TODO: builtins
        {
            insert_builtin("#integer", "#int", "[[0-1 '-'] [1+ #digit]]")
            insert_builtin("#unsigned_integer", "#uint", "[1+ #digit]")
            insert_builtin("#real", None, "[#int [0-1 '.' #uint]]")
            insert_builtin(
                "#float",
                None,
                "[[0-1 '-'] [[#uint '.' [0-1 #uint] | '.' #uint] [0-1 #exponent] | #int #exponent] #exponent=[['e' | 'E'] [0-1 ['+' | '-']] #uint]]",
            )
            insert_builtin("#hex_digit", "#hexd", "[#digit | #a..f | #A..F]")
            insert_builtin("#hex_number", "#hexn", "[1+ #hex_digit]")
            # this is not called #word because in legacy regex \w (prounounced "word character") is #token_character and I fear confusion
            insert_builtin("#letters", None, "[1+ #letter]")
            insert_builtin("#token", None, "[#letter | '_'][0+ #token_character]")
            insert_builtin("#capture_0+_any", "#c0", "[capture 0+ #any]")
            insert_builtin("#capture_1+_any", "#c1", "[capture 1+ #any]")

        }
        */
        map
    };
}
