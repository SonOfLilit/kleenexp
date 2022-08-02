import pytest
import midas
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


def test_api_equivalence():
    ke_dir = set(x for x in dir(ke) if not x.startswith("_"))
    re_dir = set(re.__all__)
    re_dir.difference_update(["template"])  # experimental, not documented
    assert re_dir
    assert re_dir - ke_dir == set()


@midas.test(format="lines")
def test_compile_gold(ke_pattern):
    return ke.re(ke_pattern)


JABBERWOCKY = """\
'Twas brillig, and the slithy toves
Did gyre and gimble in the wabe:
All mimsy were the borogoves,
And the mome raths outgrabe.

"Beware the Jabberwock, my son!
The jaws that bite, the claws that catch!
Beware the Jubjub bird, and shun
The frumious Bandersnatch!"

He took his vorpal sword in hand:
Long time the manxome foe he sought,
So rested he by the Tumtum tree,
And stood a while in thought.

And, as in uffish thought he stood,
The Jabberwock, with eyes of flame,
Came whiffling through the tulgey wood,
And burbled as it came!

One two! One two! And through and through
The vorpal blade went snicker-snack!
He left it dead, and with its head
He went galumphing back.

"And hast thou slain the Jabberwock?
Come to my arms, my beamish boy!
Oh frabjous day! Callooh! Callay!"
He chortled in his joy.

'Twas brillig, and the slithy toves
Did gyre and gimble in the wabe:
All mimsy were the borogoves,
And the mome raths outgrabe.
"""


@midas.test(format="lines")
def test_jabberwocky(ke_pattern):
    return ke.findall(ke_pattern, JABBERWOCKY, ke.MULTILINE | ke.DOTALL | ke.IGNORECASE)


def test_re():
    assert ke.compile("\t\r\n").match("\t\r\n")


def test_redundant_backslash_escape():
    assert ke.re("-") == "-"
    assert ke.re("#") == "#"


def test_compile():
    assert ke.compile('["a"]').search("bab")
    assert not ke.compile('["c"]').search("bab")
    assert ke.compile('["a"]').search("bab")


def test_compile_bytes():
    assert ke.compile(b'["a"]').search(b"bab")
    assert not ke.compile(b'["c"]').search(b"bab")


def test_flags():
    assert ke.compile("a", ke.I).match("A")
    assert ke.compile("a[#el]", ke.M).search("a\nb")
    assert not ke.compile("a[#el]").search("a\nb")

    for flag in "AIUMS":
        k = getattr(ke, flag)
        r = getattr(re, flag)
        if r != re.ASCII:
            r |= re.UNICODE
        assert ke.compile("a", k).flags == r
    assert ke.compile(b"a", ke.LOCALE).flags == re.LOCALE
    assert ke.compile("a", ke.DEBUG).flags == re.DEBUG | re.UNICODE

    # X should have no effect
    assert ke.compile("a", ke.X).flags == re.UNICODE
    assert ke.re("[c #wb [1-3 #d] #wb]", ke.X) == ke.re("[c #wb [1-3 #d] #wb]")


def test_search():
    assert ke.search('["a"]', "xabc")
    assert not ke.search('["a"]', "Abc")
    assert ke.search('["a"]', "xabc", flags=ke.I)


def test_match():
    assert ke.match('["a"]', "abc")
    assert not ke.match('["a"]', "bac")
    assert ke.match('[capture "a"][capture:g "b"]', "abc").group(1) == "a"
    assert ke.match('[capture "a"][capture:g "b"]', "abc").group("g") == "b"
    assert not ke.match("a", "Ac")
    assert ke.match("a", "Ac", ke.I)


def test_fullmatch():
    assert ke.fullmatch('["a"]', "a")
    assert not ke.fullmatch('["a"]', "abc")


def test_split():
    assert ke.split("[#d]", "a1a2a3a4a5", maxsplit=3) == ["a", "a", "a", "a4a5"]


def test_findall():
    assert ke.findall("a", "xabca") == re.findall("a", "xabca")
    assert ke.findall("aaa", "aaaabaaab") == re.findall("aaa", "aaaabaaab")
    assert ke.findall("aaa", "aaAabaaab", ke.I) == re.findall("aaa", "aaAabaaab", re.I)


def test_finditer():
    assert [m.groups() for m in ke.finditer("[c #letter]", "xa.ca")] == [
        m.groups() for m in re.finditer(r"(\w)", "xa.ca")
    ]


def test_sub():
    assert (
        ke.sub(
            "Hi [capture 1+ #letter], what's up?",
            r"\1! \1!",
            "Hi Bobby, what's up? Hi Martin, what's up?",
        )
        == "Bobby! Bobby! Martin! Martin!"
    )
    assert ke.sub("[1+ #d]", "###", "123-45-6789", count=2) == "###-###-6789"
    assert (
        ke.sub("[c 1+ #d]", lambda m: m.group(1)[::-1], "123-45-6789") == "321-54-9876"
    )
    with pytest.raises(IndexError):
        ke.sub("[1+ #d]", lambda m: m.group(1)[::-1], "123-45-6789")


def test_subn():
    assert ke.subn("[1+ #d]", "###", "123-45-6789", count=2) == ("###-###-6789", 2)


@midas.test(format="lines")
def test_escape(line):
    k = ke.escape(line)
    assert ke.match(k, line)
    assert ke.re(k) == re.escape(line)
    return k


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
    assert ke.re('[#a..c | "-"]') == r"[\-a-c]"
    assert ke.match('[#a..c | "-"]', "a")
    assert ke.match('[#a..c | "-"]', "b")
    assert ke.match('[#a..c | "-"]', "c")
    assert ke.match('[#a..c | "-"]', "-")
    assert not ke.match('[#a..c | "-"]', "d")
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
