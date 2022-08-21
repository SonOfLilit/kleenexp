use compiler::compile;

extern crate pest;
#[macro_use]
extern crate pest_derive;

mod compiler;
mod parse;

#[derive(Debug)]
pub enum Error {
    ParseError(String),
}
pub fn transpile(pattern: &str) -> Result<String, Error> {
    let ast = parse::parse(pattern);
    let regex = compile(ast.map_err(|e| Error::ParseError(format!("{}", e)))?);
    Ok(regex)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn no_braces() {
        assert_eq!(transpile("abc def!").unwrap(), "abc def!");
    }

    #[test]
    fn empty_braces() {
        assert_eq!(transpile("[]").unwrap(), "");
    }

    #[test]
    fn macros() {
        assert_eq!(transpile("[#letter]").unwrap(), "[A-Za-z]");
    }
}
