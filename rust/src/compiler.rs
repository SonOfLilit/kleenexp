use crate::parse::Ast;

#[derive(Copy, Clone)]
enum RegexFlavor {
    Python,
    // Javascript,
    // Rust,
    // RustFancy,
}

enum Regexable<'a> {
    Concat(Vec<Regexable<'a>>),
    Literal(&'a str),
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
            Ast::Macro(_) => todo!(),
            Ast::Range { start, end } => todo!(),
            Ast::Literal(s) => Regexable::Literal(s),
        }
    }
}
