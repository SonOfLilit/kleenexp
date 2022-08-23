use compiler::compile;

mod compiler;
mod parse;

#[derive(Debug)]
pub enum Error {
    ParseError(String),
    CompileError(String),
}
pub fn transpile(pattern: &str) -> Result<String, Error> {
    let ast = parse::parse::<parse::VerboseError<_>>(pattern);
    let regex = compile(ast.map_err(|e| Error::ParseError(format!("{}", e)))?.1);
    regex.map_err(Error::CompileError)
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
