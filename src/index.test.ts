import { describe, it, test, expect } from "@jest/globals";
import { completed, expected, PResult } from "../dist/index.js";
import { Result } from "../dist/result.js";
import { ParseError } from "../dist/error.js";
import { tag } from "../dist/text.js";
import { pair } from "../dist/multi.js";

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
            Result.err(Result.err(new ParseError(new Set(["a"]), "next"))),
        );
    });

    test("require Err(Err)", () => {
        const result = PResult.require(PResult.expected("a"), "first");
        expect(PResult.require(result, "second")).toEqual(
            Result.err(Result.err(new ParseError(new Set(["a"]), "first"))),
        );
    });
});

describe("makeParser", () => {
    const parser = tag("123");
    test("map works", () => {
        const mapped = parser.map(parseInt);
        expect(mapped("123")).toEqual(Result.ok([123, 3]));
        expect(mapped("124")).toEqual(PResult.expected("123"));
    });

    test("expect works", () => {
        const expected = parser.expect("not 123");
        expect(expected("abc")).toEqual(PResult.expected("not 123"));
    });

    test("require works", () => {
        const required = parser.require();
        expect(required("abc")).toEqual(PResult.require(PResult.expected("123"), "abc"));
    });
});

describe("completed", () => {
    const parser = completed(pair(tag("a"), tag("bc")));
    it("parses entire string", () => {
        expect(parser("abc")).toEqual(Result.ok(["a", "bc"]));
    });

    it("fails on parser fail", () => {
        expect(parser("not abc")).toEqual(
            Result.err(new ParseError(new Set(["a"]), "not abc")),
        );
    });

    it("fails on incomplete parse", () => {
        expect(parser("abcn")).toEqual(Result.err(new ParseError(new Set(["EOF"]), "n")));
    });

    it("fails on required", () => {
        expect(parser("ab")).toEqual(Result.err(new ParseError(new Set(["bc"]), "b")));
    });
});

describe("expected", () => {
    it("works", () => {
        const parser = expected(tag("abc"), "not abc");
        expect(parser("a")).toEqual(PResult.expected("not abc"));
    });
});
