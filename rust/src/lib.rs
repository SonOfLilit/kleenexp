pub use compiler::{transpile, Error};

mod compiler;
mod parse;

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
        assert_eq!(transpile("[#integer]").unwrap(), "-?\\d+");
    }

    #[test]
    fn escapes() {
        assert_eq!(transpile("\n").unwrap(), "\\n");
        assert_eq!(transpile("[#crlf]").unwrap(), "\\r\\n");
        assert_eq!(transpile("\r\n").unwrap(), "\\r\\n");
        assert_eq!(transpile("['\r\n']").unwrap(), "\\r\\n");
        assert_eq!(
            transpile("[#start_string][#newline][#end_string]").unwrap(),
            "\\A(?:[\\n\\r\\u2028\\u2029]|\\r\\n)\\Z"
        );
    }

    #[test]
    fn empty_op() {
        assert_eq!(transpile("[capture 3-5 []]").ok(), None);
    }

    #[test]
    fn code_comment() {
        assert_eq!(transpile("[comment 'hi']").unwrap(), "");
    }
}
