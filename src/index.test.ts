import { describe, it, test, expect } from "@jest/globals";
import { completed, expected } from "../dist/index.js";
import { Result } from "../dist/result.js";
import { ParseError, ParseResult } from "../dist/parseResult.js";
import { tag } from "../dist/text.js";
import { pair } from "../dist/multi.js";

describe("makeParser", () => {
    const parser = tag("123");
    test("map works", () => {
        const mapped = parser.map(parseInt);
        expect(mapped("123")).toEqual(ParseResult.ok(123, 3));
        expect(mapped("124")).toEqual(ParseResult.expected("123"));
    });

    test("expect works", () => {
        const expected = parser.expect("not 123");
        expect(expected("abc")).toEqual(ParseResult.expected("not 123"));
    });
});

describe("completed", () => {
    const parser = completed(pair(tag("a"), tag("bc")));
    it("parses entire string", () => {
        expect(parser("abc")).toEqual(Result.ok(["a", "bc"]));
    });

    it("fails on parser fail", () => {
        expect(parser("not abc")).toEqual(Result.err(new ParseError(new Set(["a"]), 0)));
    });

    it("fails on incomplete parse", () => {
        expect(parser("abcn")).toEqual(Result.err(new ParseError(new Set(["EOF"]), 3)));
    });

    it("fails on required", () => {
        expect(parser("ab")).toEqual(Result.err(new ParseError(new Set(["bc"]), 1)));
    });
});

describe("expected", () => {
    it("works", () => {
        const parser = expected(tag("abc"), "not abc");
        expect(parser("a")).toEqual(ParseResult.expected("not abc"));
    });
});
