import { describe, it, expect } from "@jest/globals";
import {
    opt,
    alt,
    many0,
    many1,
    pair,
    separatedPair,
    terminated,
    delimited,
    preceded,
} from "../dist/multi.js";
import { eof, tag, uint } from "../dist/text";
import { Option } from "../dist/option.js";
import { ParseResult } from "../dist/parseResult.js";

describe("opt", () => {
    const parser = opt(pair(tag("a"), tag("b")));

    it("matches", () => {
        expect(parser("abn")).toEqual(ParseResult.ok(Option.some(["a", "b"]), 2));
    });

    it("matches not", () => {
        expect(parser("n")).toEqual(
            ParseResult.okExpecting(Option.none(), 0, new Set(["a"])),
        );
    });

    it("fails partial match", () => {
        expect(parser("a")).toEqual(ParseResult.fatal(1, "b"));
    });
});

describe("many0", () => {
    const parser = many0(tag("a"));
    it("matches zero", () => {
        expect(parser("not a")).toEqual(ParseResult.okExpecting([], 0, new Set(["a"])));
    });

    it("matches one", () => {
        expect(parser("abc")).toEqual(ParseResult.okExpecting(["a"], 1, new Set(["a"])));
    });

    it("matches three", () => {
        expect(parser("aaab")).toEqual(
            ParseResult.okExpecting(["a", "a", "a"], 3, new Set(["a"])),
        );
    });

    it("doesn't match break", () => {
        expect(parser("aaba")).toEqual(
            ParseResult.okExpecting(["a", "a"], 2, new Set(["a"])),
        );
    });

    it("fails zero-size parser", () => {
        expect(() => many0(eof)("")).toThrow();
    });
});

describe("many1", () => {
    const parser = many1(tag("a"));
    it("doesn't match zero", () => {
        expect(parser("not a")).toEqual(ParseResult.expected("a"));
    });

    it("matches one", () => {
        expect(parser("abc")).toEqual(ParseResult.okExpecting(["a"], 1, new Set(["a"])));
    });

    it("matches three", () => {
        expect(parser("aaab")).toEqual(
            ParseResult.okExpecting(["a", "a", "a"], 3, new Set(["a"])),
        );
    });

    it("doesn't match break", () => {
        expect(parser("aaba")).toEqual(
            ParseResult.okExpecting(["a", "a"], 2, new Set(["a"])),
        );
    });

    it("fails zero-size parser", () => {
        expect(() => many1(eof)("")).toThrow();
    });
});

describe("pair", () => {
    const parser = pair(many1(tag("abc")), uint);
    it("matches pair", () => {
        expect(parser("abc123nnn")).toEqual(ParseResult.ok([["abc"], 123], 6));
    });

    it("doesn't match just first", () => {
        expect(parser("abcnnn")).toEqual(
            ParseResult.fatal(3, "nonnegative integer", "abc"),
        );
    });

    it("doesn't match just second", () => {
        expect(parser("123nnn")).toEqual(ParseResult.expected("abc"));
    });

    it("retains expected on zero-size match", () => {
        expect(pair(many1(tag("abc")), many0(uint))("abc")).toEqual(
            ParseResult.okExpecting(
                [["abc"], []],
                3,
                new Set(["abc", "nonnegative integer"]),
            ),
        );
    });
});

describe("separated pair", () => {
    const parser = separatedPair(many1(tag("a")), many1(tag("b")), tag("c"));

    it("matches all", () => {
        expect(parser("abcn")).toEqual(ParseResult.ok([["a"], "c"], 3));
    });

    it("doesn't match unrelated", () => {
        expect(parser("noco")).toEqual(ParseResult.expected("a"));
    });

    it("fails partial", () => {
        expect(parser("a")).toEqual(ParseResult.fatal(1, "b", "a"));
        expect(parser("abn")).toEqual(ParseResult.fatal(2, "c", "b"));
    });
});

describe("terminated", () => {
    const parser = terminated(many1(tag("a")), tag("b"));

    it("matches and ignores second parser", () => {
        expect(parser("abn")).toEqual(ParseResult.ok(["a"], 2));
    });

    it("doesn't match unrelated", () => {
        expect(parser("noco")).toEqual(ParseResult.expected("a"));
    });

    it("fails partial", () => {
        expect(parser("a")).toEqual(ParseResult.fatal(1, "b", "a"));
    });
});

describe("preceded", () => {
    const parser = preceded(many1(tag("a")), tag("b"));

    it("matches and ignores first parser", () => {
        expect(parser("abn")).toEqual(ParseResult.ok("b", 2));
    });

    it("doesn't match unrelated", () => {
        expect(parser("noco")).toEqual(ParseResult.expected("a"));
    });

    it("fails partial", () => {
        expect(parser("a")).toEqual(ParseResult.fatal(1, "b", "a"));
    });
});

describe("delimited", () => {
    const parser = delimited(many1(tag("a")), many1(tag("b")), tag("c"));

    it("matches and returns the middle parser", () => {
        expect(parser("abcn")).toEqual(ParseResult.ok(["b"], 3));
    });

    it("doesn't match unrelated", () => {
        expect(parser("noco")).toEqual(ParseResult.expected("a"));
    });

    it("fails partial", () => {
        expect(parser("a")).toEqual(ParseResult.fatal(1, "b", "a"));
        expect(parser("abn")).toEqual(ParseResult.fatal(2, "c", "b"));
    });
});

describe("alt", () => {
    const parser = alt<[string, string]>(
        pair(tag("a"), tag("b")),
        pair(tag("b"), tag("c")),
        pair(tag("c"), tag("d")),
    );

    it("matches any", () => {
        expect(parser("ab")).toEqual(ParseResult.ok(["a", "b"], 2));
        expect(parser("bc")).toEqual(ParseResult.ok(["b", "c"], 2));
        expect(parser("cd")).toEqual(ParseResult.ok(["c", "d"], 2));
    });

    it("doesn't match something else", () => {
        expect(parser("no")).toEqual(ParseResult.expected("a", "b", "c"));
    });

    it("doesn't continue required", () => {
        expect(parser("ac")).toEqual(ParseResult.fatal(1, "b"));
    });
});
