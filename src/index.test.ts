import { describe, it, test, expect } from "@jest/globals";
import { many0, many1, pair, PResult, tag, uint } from ".";
import { Result } from "./result";

describe("PResult", () => {
    test("map works", () => {
        const result: PResult<string> = Result.ok(["300", 4]);
        expect(PResult.map(result, (s) => parseInt(s))).toEqual(Result.ok([300, 4]));
    })

    test("expected works", () => {
        expect(PResult.expected("string")).toEqual(PResult.expected("string"));
    })

    test("require Ok", () => {
        expect(PResult.require(Result.ok([0, 0]), "")).toEqual(Result.ok([0, 0]));
    })

    test("require Err(Ok)", () => {
        expect(PResult.require(PResult.expected("a"), "next")).toEqual(Result.err(Result.err([new Set(["a"]), "next"])));
    })

    test("require Err(Err)", () => {
        const result = PResult.require(PResult.expected("a"), "first");
        expect(PResult.require(result, "second")).toEqual(Result.err(Result.err([new Set(["a"]), "first"])));
    })
})

describe("tag", () => {
    it("matches tag value", () => {
        const parser = tag("abc");
        expect(parser("abcde")).toEqual(Result.ok(["abc", 3]));
    });

    it("doesn't match mid-string", () => {
        const parser = tag("bcd");
        expect(parser("abcde")).toEqual(PResult.expected("bcd"));
    })
})

describe("uint", () => {
    it("matches positive", () => {
        expect(uint("3420abc")).toEqual(Result.ok([3420, 4]));
    })

    it("doesn't include e", () => {
        expect(uint("321e10")).toEqual(Result.ok([321, 3]));
    })

    it("doesn't include .", () => {
        expect(uint("321.10")).toEqual(Result.ok([321, 3]));
    })

    it("doesn't match negative", () => {
        expect(uint("-5")).toEqual(PResult.expected("nonnegative integer"));
    })

    it("doesn't match zero prefix", () => {
        expect(uint("0123")).toEqual(PResult.expected("nonnegative integer"));
    })

    it("doesn't match whitespace", () => {
        expect(uint(" 123")).toEqual(PResult.expected("nonnegative integer"));
    })
})

describe("many0", () => {
    it("matches zero", () => {
        const parser = many0(tag("a"));
        expect(parser("not a")).toEqual(Result.ok([[], 0]));
    })

    it("matches one", () => {
        const parser = many0(tag("a"));
        expect(parser("abc")).toEqual(Result.ok([["a"], 1]));
    })

    it("matches three", () => {
        const parser = many0(tag("a"));
        expect(parser("aaab")).toEqual(Result.ok([["a", "a", "a"], 3]));
    })

    it("doesn't match break", () => {
        const parser = many0(tag("a"));
        expect(parser("aaba")).toEqual(Result.ok([["a", "a"], 2]));
    })
})

describe("many1", () => {
    it("doesn't match zero", () => {
        const parser = many1(tag("a"));
        expect(parser("not a")).toEqual(PResult.expected("a"));
    })

    it("matches one", () => {
        const parser = many1(tag("a"));
        expect(parser("abc")).toEqual(Result.ok([["a"], 1]));
    })

    it("matches three", () => {
        const parser = many1(tag("a"));
        expect(parser("aaab")).toEqual(Result.ok([["a", "a", "a"], 3]));
    })

    it("doesn't match break", () => {
        const parser = many1(tag("a"));
        expect(parser("aaba")).toEqual(Result.ok([["a", "a"], 2]));
    })
})

describe("pair", () => {
    it("matches pair", () => {
        const parser = pair(tag("abc"), uint);
        expect(parser("abc123nnn")).toEqual(Result.ok([["abc", 123], 6]));
    })

    it("doesn't match just first", () => {
        const parser = pair(tag("abc"), uint);
        expect(parser("abcnnn")).toEqual(PResult.require(PResult.expected("nonnegative integer"), "nnn"));
    })

    it("doesn't match just second", () => {
        const parser = pair(tag("abc"), uint);
        expect(parser("123nnn")).toEqual(PResult.expected("abc"));
    })
})