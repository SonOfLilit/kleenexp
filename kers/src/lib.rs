pub fn transpile(text: &str) -> String {
    return text.to_string();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn no_braces() {
        assert_eq!(transpile("abc def!"), "abc def!");
    }
}
