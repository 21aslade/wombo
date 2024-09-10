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
import { tag, uint } from "../dist/text";
import { Result } from "../dist/result.js";
import { Option } from "../dist/option.js";
import { Parser, PResult } from "../dist/index.js";

describe("opt", () => {
    const parser = opt(pair(tag("a"), tag("b")));

    it("matches", () => {
        expect(parser("abn")).toEqual(Result.ok([Option.some(["a", "b"]), 2]));
    });

    it("matches not", () => {
        expect(parser("n")).toEqual(Result.ok([Option.none(), 0]));
    });

    it("fails partial match", () => {
        expect(parser("a")).toEqual(PResult.require(PResult.expected("b"), ""));
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

describe("separated pair", () => {
    const parser = separatedPair(tag("a"), tag("b"), tag("c"));

    it("matches all", () => {
        expect(parser("abcn")).toEqual(Result.ok([["a", "c"], 3]));
    });

    it("doesn't match unrelated", () => {
        expect(parser("noco")).toEqual(PResult.expected("a"));
    });

    it("fails partial", () => {
        expect(parser("a")).toEqual(PResult.require(PResult.expected("b"), ""));
        expect(parser("abn")).toEqual(PResult.require(PResult.expected("c"), "n"));
    });
});

describe("terminated", () => {
    const parser = terminated(tag("a"), tag("b"));

    it("matches and ignores second parser", () => {
        expect(parser("abn")).toEqual(Result.ok(["a", 2]));
    });

    it("doesn't match unrelated", () => {
        expect(parser("noco")).toEqual(PResult.expected("a"));
    });

    it("fails partial", () => {
        expect(parser("a")).toEqual(PResult.require(PResult.expected("b"), ""));
    });
});

describe("preceded", () => {
    const parser = preceded(tag("a"), tag("b"));

    it("matches and ignores first parser", () => {
        expect(parser("abn")).toEqual(Result.ok(["b", 2]));
    });

    it("doesn't match unrelated", () => {
        expect(parser("noco")).toEqual(PResult.expected("a"));
    });

    it("fails partial", () => {
        expect(parser("a")).toEqual(PResult.require(PResult.expected("b"), ""));
    });
});

describe("delimited", () => {
    const parser = delimited(tag("a"), tag("b"), tag("c"));

    it("matches and returns the middle parser", () => {
        expect(parser("abcn")).toEqual(Result.ok(["b", 3]));
    });

    it("doesn't match unrelated", () => {
        expect(parser("noco")).toEqual(PResult.expected("a"));
    });

    it("fails partial", () => {
        expect(parser("a")).toEqual(PResult.require(PResult.expected("b"), ""));
        expect(parser("abn")).toEqual(PResult.require(PResult.expected("c"), "n"));
    });
});

describe("alt", () => {
    const parser = alt(
        pair(tag("a"), tag("b")),
        pair(tag("b"), tag("c")),
        pair(tag("c"), tag("d")),
    );

    it("matches any", () => {
        expect(parser("ab")).toEqual(Result.ok([["a", "b"], 2]));
        expect(parser("bc")).toEqual(Result.ok([["b", "c"], 2]));
        expect(parser("cd")).toEqual(Result.ok([["c", "d"], 2]));
    });

    it("doesn't match something else", () => {
        expect(parser("no")).toEqual(Result.err(Result.ok(new Set(["a", "b", "c"]))));
    });

    it("doesn't continue required", () => {
        expect(parser("ac")).toEqual(PResult.require(PResult.expected("b"), "c"));
    });
});
