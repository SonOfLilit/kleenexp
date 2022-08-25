#![warn(clippy::pedantic)]
pub use compiler::{transpile, Error, RegexFlavor};

mod compiler;
mod parse;

#[cfg(test)]
mod tests {
    use super::*;

    fn transpile(pattern: &str) -> Result<String, Error> {
        super::transpile(pattern, RegexFlavor::Python)
    }

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

    #[test]
    fn def_macro() {
        assert_eq!(
            transpile("[#x=[#0..9] #x #x #x]").unwrap(),
            r"[0-9][0-9][0-9]"
        );
    }

    #[test]
    fn recursive_dog_macro() {
        let expected = "Yo dawg, I heard you like Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse, so I put some Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse in your Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse so you can recurse while you recurse";
        assert_eq! (
            transpile(
                r#"[#recursive_dawg][
                #yo=["Yo dawg, I heard you like "]
                #so_i_put=[", so I put some "]
                #in_your=[" in your "]
                #so_you_can=[" so you can "]
                #while_you=[" while you "]
                #dawg=[#yo "this" #so_i_put "of this" #in_your "regex" #so_you_can "recurse" #while_you "recurse"]
                #recursive_dawg=[#yo #dawg #so_i_put #dawg #in_your #dawg #so_you_can "recurse" #while_you "recurse"]
            ]"#).unwrap(),
            expected
        );
    }

    #[test]
    fn lookahead() {
        assert_eq!(transpile("[lookahead 'a']a").unwrap(), "(?=a)a");
    }
}
