import { describe, it, test, expect } from "@jest/globals";
import { completed, many0, many1, pair, PResult, regex, tag, uint } from ".";
import { Result } from "./result";

describe("PResult", () => {
    test("map works", () => {
        const result: PResult<string> = Result.ok(["300", 4]);
        expect(PResult.map(result, (s) => parseInt(s))).toEqual(Result.ok([300, 4]));
    });

    test("expected works", () => {
        expect(PResult.expected("string")).toEqual(PResult.expected("string"));
    });

    test("require Ok", () => {
        expect(PResult.require(Result.ok([0, 0]), "")).toEqual(Result.ok([0, 0]));
    });

    test("require Err(Ok)", () => {
        expect(PResult.require(PResult.expected("a"), "next")).toEqual(
            Result.err(Result.err([new Set(["a"]), "next"])),
        );
    });

    test("require Err(Err)", () => {
        const result = PResult.require(PResult.expected("a"), "first");
        expect(PResult.require(result, "second")).toEqual(
            Result.err(Result.err([new Set(["a"]), "first"])),
        );
    });
});

describe("tag", () => {
    const parser = tag("abc");
    it("matches tag value", () => {
        expect(parser("abcde")).toEqual(Result.ok(["abc", 3]));
    });

    it("doesn't match mid-string", () => {
        expect(parser("deabc")).toEqual(PResult.expected("abc"));
    });
});

describe("uint", () => {
    it("matches positive", () => {
        expect(uint("3420abc")).toEqual(Result.ok([3420, 4]));
    });

    it("doesn't include e", () => {
        expect(uint("321e10")).toEqual(Result.ok([321, 3]));
    });

    it("doesn't include .", () => {
        expect(uint("321.10")).toEqual(Result.ok([321, 3]));
    });

    it("doesn't match negative", () => {
        expect(uint("-5")).toEqual(PResult.expected("nonnegative integer"));
    });

    it("doesn't match zero prefix", () => {
        expect(uint("0123")).toEqual(PResult.expected("nonnegative integer"));
    });

    it("doesn't match whitespace", () => {
        expect(uint(" 123")).toEqual(PResult.expected("nonnegative integer"));
    });
});

describe("many0", () => {
    const parser = many0(tag("a"));
    it("matches zero", () => {
        expect(parser("not a")).toEqual(Result.ok([[], 0]));
    });

    it("matches one", () => {
        expect(parser("abc")).toEqual(Result.ok([["a"], 1]));
    });

    it("matches three", () => {
        expect(parser("aaab")).toEqual(Result.ok([["a", "a", "a"], 3]));
    });

    it("doesn't match break", () => {
        expect(parser("aaba")).toEqual(Result.ok([["a", "a"], 2]));
    });
});

describe("many1", () => {
    const parser = many1(tag("a"));
    it("doesn't match zero", () => {
        expect(parser("not a")).toEqual(PResult.expected("a"));
    });

    it("matches one", () => {
        expect(parser("abc")).toEqual(Result.ok([["a"], 1]));
    });

    it("matches three", () => {
        expect(parser("aaab")).toEqual(Result.ok([["a", "a", "a"], 3]));
    });

    it("doesn't match break", () => {
        expect(parser("aaba")).toEqual(Result.ok([["a", "a"], 2]));
    });
});

describe("pair", () => {
    const parser = pair(tag("abc"), uint);
    it("matches pair", () => {
        expect(parser("abc123nnn")).toEqual(Result.ok([["abc", 123], 6]));
    });

    it("doesn't match just first", () => {
        expect(parser("abcnnn")).toEqual(
            PResult.require(PResult.expected("nonnegative integer"), "nnn"),
        );
    });

    it("doesn't match just second", () => {
        expect(parser("123nnn")).toEqual(PResult.expected("abc"));
    });
});

describe("completed", () => {
    const parser = completed(pair(tag("a"), tag("bc")));
    it("parses entire string", () => {
        expect(parser("abc")).toEqual(Result.ok(["a", "bc"]));
    });

    it("fails on parser fail", () => {
        expect(parser("not abc")).toEqual(Result.err([new Set(["a"]), "not abc"]));
    });

    it("fails on incomplete parse", () => {
        expect(parser("abcn")).toEqual(Result.err([new Set(["EOF"]), "n"]));
    });

    it("fails on required", () => {
        expect(parser("ab")).toEqual(Result.err([new Set(["bc"]), "b"]));
    });
});

describe("regex", () => {
    const parser = regex(/ab+c?/);
    it("matches regex", () => {
        expect(parser("abbcd")).toEqual(Result.ok(["abbc", 4]));
    });

    it("only matches at beginning", () => {
        expect(parser(" ab")).toEqual(PResult.expected("/ab+c?/"));
    });
});
