import pytest
import ke
import re


def assert_pattern(pattern, matches, not_matches=()):
    if isinstance(pattern, str):
        pattern = ke.compile(pattern)
    for m in matches:
        assert pattern.match(m), (pattern, m)
    for m in not_matches:
        assert not pattern.match(m), (pattern, m)


def test_assumptions():
    assert_pattern(re.compile(r".*a.c"), ["abc", "ab abc"], ["", "ac", "\nabc"])
    assert_pattern(re.compile(r"(?:.|[\r\n])*a.c"), ["\nabc", "\n\n\nabc"], ["ab"])


def test_re():
    assert ke.re('["a"]') == "a"
    assert ke.re("a") == "a"
    assert ke.compile("\t\r\n").match("\t\r\n")
    assert ke.re("\t\r\n") == r"\t\r\n"
    assert ke.re("[0+ #any]") == ".*"
    assert ke.re("Number [capture 1+ #digit]") == r"Number\ (\d+)"
    assert ke.re("") == ""
    with pytest.raises(re.error):
        ke.re("[")


def test_compile():
    assert ke.compile('["a"]').search("bab")
    assert not ke.compile('["c"]').search("bab")
    assert ke.compile('["a"]').search("bab")


def test_match():
    assert ke.match('["a"]', "abc")
    assert not ke.match('["a"]', "bc")


def test_multiple():
    assert ke.match('[1+ "a"]', "a")
    assert ke.match('[1+ "a"]', "aa")
    assert not ke.match('[1+ "a"]', "")
    assert ke.match('[2-3 "a"][#end_line]', "aa")
    assert ke.match('[2-3 "a"][#end_line]', "aaa")
    assert not ke.match('[2-3 "a"][#end_line]', "a")
    assert not ke.match('[2-3 "a"][#end_line]', "aaaa")
    assert ke.match('[0-1 "a"][#end_line]', "")
    assert ke.match('[0-1 "a"][#end_line]', "a")
    assert not ke.match('[0-1 "a"][#end_line]', "aa")
    assert ke.match('[2 "a"][#end_line]', "aa")
    assert not ke.match('[2 "a"][#end_line]', "a")
    assert not ke.match('[2 "a"][#end_line]', "aaa")
    assert ke.match('[2-3 ["hi" | "bye"]][#end_line]', "byebye")
    assert ke.match('[2-3 ["hi" | "bye"]][#end_line]', "hibye")
    assert ke.match('[2-3 ["hi" | "bye"]][#end_line]', "hihibye")
    assert not ke.match('[2-3 ["hi" | "bye"]][#end_line]', "hihihihi")
    assert not ke.match('[2-3 ["hi" | "bye"]][#end_line]', "hi")


def test_capture():
    assert ke.compile('[capture 3-5 "a"]').match("aaa").group(1) == "aaa"
    assert ke.compile('[capture 3-5 "a"]').match("aaaaaaaaa").group(1) == "aaaaa"
    assert not ke.compile('[capture 3-5 "a"]').match("aa")
    assert not ke.compile('[capture 3-5 "a"][#end_line]').match("aaaaaa")
    assert not ke.compile('[[capture 3-5 "a"] #end_line]').match("aaaaaa")
    assert ke.match('[capture 3-5 "a"]', "aaaaaaaaa").group(1) == "aaaaa"

    with pytest.raises(re.error):
        ke.re("[capture 3-5]")
    with pytest.raises(re.error):
        ke.re("[capture 3-5 []]")
    with pytest.raises(re.error):
        ke.re('[capture 0 "a"]')


@pytest.mark.skip
def test_named_capture():
    assert ke.compile('[capture:a 3-5 "a"]').match("aaa").group("a") == "aaa"


def test_comments():
    assert ke.re("[comment]") == ke.re("[]")
    assert ke.re('[comment "a"]') == ke.re("[]")
    assert ke.re("[comment #token]") == ke.re("[]")
    assert ke.re("[comment not #token]") == ke.re("[]")
    with pytest.raises(re.error):
        ke.re("[0-1 comment #token]")
    assert ke.re('["a" [comment "a"] "b"]') == ke.re("ab")
    assert ke.re('[comment [["a"]]]') == ke.re("[]")


def test_range_macros():
    assert ke.re("[#a..z]") == "[a-z]"
    assert ke.re('[#a..c | "g" | #q..t]') == "[a-cgq-t]"
    assert ke.re('[#a..c | "-"]') == "[-a-c]"
    with pytest.raises(re.error):
        ke.re("[#..]")
    with pytest.raises(re.error):
        ke.re("[#a..]")
    with pytest.raises(re.error):
        ke.re("[#a..a]")
    with pytest.raises(re.error):
        ke.re("[#a..em..z]")
    with pytest.raises(re.error):
        ke.re("[#!../ #:..@ #....]")


def test_not():
    assert ke.compile('[not "a"]').match("b")
    assert ke.compile('[not "a"]').match("A")
    assert not ke.compile('[not "a"]').match("a")

    assert not ke.compile('[not not "a"]').match("b")
    assert not ke.compile('[not not "a"]').match("A")
    assert ke.compile('[not not "a"]').match("a")

    assert ke.compile('[not ["a" | "b"]]').match("c")
    assert not ke.compile('[not ["a" | "b"]]').match("a")
    assert not ke.compile('[not ["a" | "b"]]').match("b")

    assert ke.compile('[not "a"]').match("0")
    assert ke.compile('[not ["a" | #d]]').match("b")
    assert not ke.compile('[not ["a" | #d]]').match("0")
    assert not ke.compile('[not ["a" | #d]]').match("a")
    assert not ke.compile('[not ["a" | #d]]').match("9")

    assert ke.compile("[not #a..f]").match("g")
    assert ke.compile("[not #a..f]").match("A")
    assert not ke.compile("[not #a..f]").match("a")
    assert not ke.compile("[not #a..f]").match("c")
    assert not ke.compile("[not #a..f]").match("f")

    with pytest.raises(re.error):
        ke.compile('[not "ab"]')
    with pytest.raises(re.error):
        ke.compile("[not]")


def test_real():
    print(ke.re("[#ss #real #es]"))
    r = ke.compile("[#ss #real #es]")
    assert r.match("0")
    assert r.match("0.0")
    assert r.match("-0.0")
    assert r.match("1234.56")
    assert r.match("-0.0")
    assert not r.match("0.")
    assert not r.match(".0")
    assert not r.match("-0.")
    assert not r.match("-.0")


def test_float():
    print(ke.re("[#ss #float #es]"))
    f = ke.compile("[#ss #float #es]")
    assert f.match("0.0")
    assert f.match("-0.0")
    assert f.match("0.0e1")
    assert f.match("-0.0e1")
    assert f.match("0.0e-1")
    assert f.match("0.0E1")
    assert f.match("0.")
    assert f.match("0.e1")
    assert f.match(".0")
    assert f.match(".0e1")
    assert f.match("0e1")
    assert not f.match("0")
    assert not f.match(".")
    assert not f.match(".e1")
    assert not f.match("0.0e")
    assert f.match("1024.12e3")
    assert f.match("-1024.12e-3")
    assert f.match("-.12e3")
    assert f.match("-1024.12E-3")


def test_hex():
    h = ke.compile("[#ss #hexn #es]")
    assert h.match("0")
    assert h.match("9")
    assert h.match("a")
    assert h.match("f")
    assert h.match("A")
    assert h.match("1234567890abcdef")
    assert h.match("09af09AF")
    assert not h.match("-1")
    assert not h.match("g")


def test_token():
    h = ke.compile("[#ss #token #es]")
    assert h.match("a")
    assert h.match("abc")
    assert h.match("a1")
    assert h.match("A")
    assert h.match("AbC19")
    assert h.match("_")
    assert h.match("_a")
    assert h.match("_1")
    assert h.match("a_b_c")
    assert not h.match("1")
    assert not h.match("1_")
    assert not h.match("9_")
    assert not h.match("1234")
    assert not h.match("!")
    assert not h.match("a!")
    assert not h.match("#x")
    assert not h.match("x ")
    assert not h.match("x y")


def test_c0_c1():
    assert ke.compile("a[#c0]z").match("a16z").groups()[0] == "16"
    assert ke.compile("a[#c0]z").search("http://abc.xyz/").groups()[0] == "bc.xy"
    assert ke.compile("a[#c0]z").search("azure").groups()[0] == ""

    assert ke.compile("a[#c1]z").match("a16z").groups()[0] == "16"
    assert ke.compile("a[#c1]z").search("http://abc.xyz/").groups()[0] == "bc.xy"
    assert not ke.compile("a[#c1]z").search("azure")


def test_escapes():
    assert ke.compile(
        "[#dq #q #t #lb #rb #vertical_tab #formfeed #bell #backspace #el]"
    ).match(""""'\t[]\v\f\a\b""")


def test_define_macros():
    expected = "Yo dawg, I heard you like Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse, so I put some Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse in your Yo dawg, I heard you like this, so I put some of this in your regex so you can recurse while you recurse so you can recurse while you recurse".replace(
        " ", "\\ "
    ).replace(
        ",", re.escape(",")
    )  # `,` in CPython, `\,` in PyPy
    assert (
        ke.re(
            """[#recursive_dawg][
        #yo=["Yo dawg, I heard you like "]
        #so_i_put=[", so I put some "]
        #in_your=[" in your "]
        #so_you_can=[" so you can "]
        #while_you=[" while you "]
        #dawg=[#yo "this" #so_i_put "of this" #in_your "regex" #so_you_can "recurse" #while_you "recurse"]
        #recursive_dawg=[#yo #dawg #so_i_put #dawg #in_your #dawg #so_you_can "recurse" #while_you "recurse"]
    ]"""
        )
        == expected
    )


def test_newlines():
    assert_pattern(
        "[#sl]a[0+ #any]x[0+ #any]b[#el]", ["axb", "azzzxzzzb"], ["a\nx\nb", "\naxb"]
    )
    assert_pattern(
        ke.compile("[#sl]a[0+ #any]x[0+ #any]b[#el]", ke.DOTALL), ["a\nx\nb"], ["\naxb"]
    )
    assert_pattern(
        ke.compile("[#sl]a[0+ #aaa]x[0+ #aaa]b[#el]"), ["a\nx\nb"], ["\naxb"]
    )
    assert_pattern(
        ke.compile(
            "[0+ #any][#sl]a[0+ #any]x[0+ #any]b[#el]", ke.DOTALL | ke.MULTILINE
        ),
        ["\naxb", "ax\naxb", "\naxb\n", "ax\nazzzxzzzb"],
    )
    assert_pattern(
        ke.compile("[0+ #any][#sl]a[0+ #any]x[0+ #any]b[#el]", ke.MULTILINE),
        [],
        ["\naxb", "ax\naxb", "\naxb\n", "ax\nazzzxzzzb"],
    )
    assert_pattern(
        ke.compile("[0+ #aaa][#sl]a[0+ #aaa]x[0+ #aaa]b[#el]", ke.MULTILINE),
        ["\naxb", "ax\naxb", "\naxb\n", "ax\nazzzxzzzb"],
    )

    assert (
        ke.re("[#start_string][#newline][#end_string]")
        == r"\A(?:[\n\r\u2028\u2029]|\r\n)\Z"
    )
    assert_pattern(
        ke.compile("[#start_string][#newline][#end_string]"),
        ["\r", "\n", "\u2028", "\u2029", "\r\n"],
        ["\n\n", "\n\r", "\r\r"],
    )
    assert_pattern(
        ke.compile("[#start_string][#newline_character][#end_string]"),
        ["\r", "\n", "\u2028", "\u2029"],
        ["\r\n", "\n\n", "\n\r", "\r\r"],
    )
    assert_pattern(ke.compile("a[#not_newline]c"), ["abc"], ["a\rc", "a\nc", "abbc"])


def test_js():
    assert ke.re("[capture:hi 'hi']") == "(?P<hi>hi)"
    assert ke.re("[capture:hi 'hi']", syntax="javascript") == "(?<hi>hi)"
