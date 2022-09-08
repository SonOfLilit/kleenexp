"""
Compiles ranges of integers into a regular expression that matches only them:

>>> numrange_to_regex(0, 5)
r"[0-5]"
>>> numrange_to_regex(0, 255)
r"\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]"

The regex will be composed of "single ranges" separated by the "|" operator
"""


def replace_with(a, i, digit):
    s = str(a)
    above = s[: -i - 1]
    below = s[-i:] if i > 0 else ""
    return int(above + str(digit) + below)


assert replace_with(0, 0, 9) == 9
assert replace_with(10, 0, 9) == 19
assert replace_with(10, 1, 9) == 90
assert replace_with(8000, 0, 9) == 8009
assert replace_with(8000, 2, 9) == 8900
assert replace_with(8000, 3, 9) == 9000
assert replace_with(8999, 3, 9) == 9999
assert replace_with(8999, 4, 9) == 98999
assert replace_with(3, 0, 5) == 5
assert replace_with(8999, 4, 5) == 58999


def digit_at(x, i):
    return int(str(x)[-i - 1])


assert digit_at(0, 0) == 0
assert digit_at(9, 0) == 9
assert digit_at(10, 0) == 0
assert digit_at(10, 1) == 1


def try_to_replace_lowest_nonzero_digit(a, b, index):
    # otherwise when a > 0 and b == 0, _try_replace will return falsy 0 to mean "use this" :(
    assert a <= b
    digit = min(9, digit_at(b, 0)) if index == 0 else max(1, digit_at(b, index) - 1)
    return _try_replace(a, b, index, 9) or _try_replace(a, b, index, digit) or a


def _try_replace(a, b, index, digit):
    replaced = replace_with(a, index, digit)
    if replaced <= b:
        return replaced
    return None


assert try_to_replace_lowest_nonzero_digit(0, 0, 0) == 0
assert try_to_replace_lowest_nonzero_digit(0, 5, 0) == 5
assert try_to_replace_lowest_nonzero_digit(0, 9, 0) == 9
assert try_to_replace_lowest_nonzero_digit(0, 100, 0) == 9
assert try_to_replace_lowest_nonzero_digit(1, 1, 0) == 1
assert try_to_replace_lowest_nonzero_digit(1, 5, 0) == 5
assert try_to_replace_lowest_nonzero_digit(1, 9, 0) == 9
assert try_to_replace_lowest_nonzero_digit(1, 100, 0) == 9
assert try_to_replace_lowest_nonzero_digit(11, 9999, 0) == 19
assert try_to_replace_lowest_nonzero_digit(11, 19, 0) == 19
assert try_to_replace_lowest_nonzero_digit(11, 15, 0) == 15
assert try_to_replace_lowest_nonzero_digit(199, 199, 2) == 199
assert try_to_replace_lowest_nonzero_digit(199, 299, 2) == 199
assert try_to_replace_lowest_nonzero_digit(199, 399, 2) == 299
assert try_to_replace_lowest_nonzero_digit(119, 999, 1) == 199
assert try_to_replace_lowest_nonzero_digit(109, 109, 1) == 109


def sequence_of_nines_instead_of_zeros(a):
    replaced = a
    nine = 9
    while a % 10 == 0:
        replaced += nine
        yield replaced
        a //= 10
        nine *= 10


assert list(sequence_of_nines_instead_of_zeros(1000)) == [1009, 1099, 1999]
assert list(sequence_of_nines_instead_of_zeros(1)) == []
assert list(sequence_of_nines_instead_of_zeros(200100)) == [200109, 200199]
assert list(sequence_of_nines_instead_of_zeros(100100000)) == [
    100100009,
    100100099,
    100100999,
    100109999,
    100199999,
]


def replace_all_zero_digits_staying_smaller_than_b(a, b):
    if a == 0:
        return 0, a

    i = 0
    for replaced in sequence_of_nines_instead_of_zeros(a):
        if replaced <= b:
            a = replaced
            i += 1
        else:
            break
    return i, a


assert replace_all_zero_digits_staying_smaller_than_b(100, 999) == (2, 199)
assert replace_all_zero_digits_staying_smaller_than_b(100, 108) == (0, 100)
assert replace_all_zero_digits_staying_smaller_than_b(100, 109) == (1, 109)
assert replace_all_zero_digits_staying_smaller_than_b(0, 999) == (0, 0)
assert replace_all_zero_digits_staying_smaller_than_b(9, 999) == (0, 9)
assert replace_all_zero_digits_staying_smaller_than_b(10, 999) == (1, 19)
assert replace_all_zero_digits_staying_smaller_than_b(11, 999) == (0, 11)


def max_single_range_below(a, b):
    assert a <= b
    index, a = replace_all_zero_digits_staying_smaller_than_b(a, b)
    return try_to_replace_lowest_nonzero_digit(a, b, index)


assert max_single_range_below(0, 0) == 0
assert max_single_range_below(0, 5) == 5
assert max_single_range_below(0, 9) == 9
assert max_single_range_below(0, 10) == 9
assert max_single_range_below(0, 99) == 9
assert max_single_range_below(0, 39) == 9
assert max_single_range_below(1, 39) == 9
assert max_single_range_below(1, 5) == 5
assert max_single_range_below(10, 99) == 99
assert max_single_range_below(11, 99) == 19
assert max_single_range_below(100, 999) == 999
assert max_single_range_below(109, 999) == 109
assert max_single_range_below(100, 200) == 199
assert max_single_range_below(100, 210) == 199
assert max_single_range_below(100, 199) == 199
assert max_single_range_below(100, 198) == 189
assert max_single_range_below(110, 999) == 199
assert max_single_range_below(100, 109) == 109
assert max_single_range_below(101010000, 999999999999) == 101099999
assert max_single_range_below(101010020, 999999999999) == 101010099
assert max_single_range_below(101010020, 101010025) == 101010025
assert max_single_range_below(101010020, 101010315) == 101010099


def single_range_to_regex(a, b):
    if a == b:
        return str(a)

    below = ""
    while a // 10 != b // 10:
        a //= 10
        b //= 10
        below += r"\d"

    digit_a = a % 10
    digit_b = b % 10
    if digit_a == digit_b:
        character_class = digit_a
    elif digit_a == 0 and digit_b == 9:
        character_class = r"\d"
    else:
        character_class = f"[{digit_a}-{digit_b}]"

    if a // 10:
        above = str(a // 10)
    else:
        above = ""

    return f"{above}{character_class}{below}"


assert single_range_to_regex(5, 5) == "5"
assert single_range_to_regex(3, 4) == "[3-4]"
assert single_range_to_regex(5, 8) == "[5-8]"
assert single_range_to_regex(9, 9) == "9"
assert single_range_to_regex(0, 9) == r"\d"
assert single_range_to_regex(2, 9) == "[2-9]"
assert single_range_to_regex(21, 29) == "2[1-9]"
assert single_range_to_regex(21, 27) == "2[1-7]"
assert single_range_to_regex(20, 99) == r"[2-9]\d"
assert single_range_to_regex(100, 999) == r"[1-9]\d\d"
assert single_range_to_regex(200, 999) == r"[2-9]\d\d"
assert single_range_to_regex(988, 989) == r"98[8-9]"
assert single_range_to_regex(998, 999) == "99[8-9]"
assert single_range_to_regex(12000, 12599) == r"12[0-5]\d\d"


def number_range_to_regex(a, b):
    assert a <= b
    assert a >= 0 and b >= 0

    if a == b:
        return str(a)
    max_a = max_single_range_below(a, b)
    if max_a == b:
        return single_range_to_regex(a, b)
    return "|".join(
        [
            single_range_to_regex(a, max_a),
            number_range_to_regex(max_a + 1, b),
        ]
    )

assert number_range_to_regex(3, 3) == "3"
assert number_range_to_regex(3, 4) == "[3-4]"
assert number_range_to_regex(0, 9) == r"\d"
assert number_range_to_regex(13, 14) == "1[3-4]"
assert number_range_to_regex(993, 998) == "99[3-8]"
assert number_range_to_regex(988, 993) == "98[8-9]|99[0-3]"
assert number_range_to_regex(0, 14) == r"\d|1[0-4]"
assert number_range_to_regex(0, 100) == r"\d|[1-9]\d|100"
assert number_range_to_regex(0, 10000) == r"\d|[1-9]\d|[1-9]\d\d|[1-9]\d\d\d|10000"
assert number_range_to_regex(100, 123) == r"1[0-1]\d|12[0-3]"
assert number_range_to_regex(23, 367) == r"2[3-9]|[3-9]\d|[1-2]\d\d|3[0-5]\d|36[0-7]"
assert number_range_to_regex(0, 255) == r"\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]"
