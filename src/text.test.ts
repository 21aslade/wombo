import { describe, it, expect } from "@jest/globals";
import { tag, regex, uint, int, hex, signedHex } from "../dist/text.js";
import { Result } from "../dist/result";
import { PResult } from "../dist/index.js";

describe("tag", () => {
    const parser = tag("abc");
    it("matches tag value", () => {
        expect(parser("abcde")).toEqual(Result.ok(["abc", 3]));
    });

    it("doesn't match mid-string", () => {
        expect(parser("deabc")).toEqual(PResult.expected("abc"));
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

    it("matches zero", () => {
        expect(uint("0")).toEqual(Result.ok([0, 1]));
    });

    it("doesn't match whitespace", () => {
        expect(uint(" 123")).toEqual(PResult.expected("nonnegative integer"));
    });
});

describe("int", () => {
    it("matches positive", () => {
        expect(int("3420abc")).toEqual(Result.ok([3420, 4]));
    });

    it("doesn't include e", () => {
        expect(int("321e10")).toEqual(Result.ok([321, 3]));
    });

    it("doesn't include .", () => {
        expect(int("321.10")).toEqual(Result.ok([321, 3]));
    });

    it("matches negative", () => {
        expect(int("-5")).toEqual(Result.ok([-5, 2]));
    });

    it("doesn't match zero prefix", () => {
        expect(int("0123")).toEqual(PResult.expected("integer"));
    });

    it("matches zero", () => {
        expect(int("0")).toEqual(Result.ok([0, 1]));
    });

    it("doesn't match whitespace", () => {
        expect(int(" 123")).toEqual(PResult.expected("integer"));
    });
});

describe("uhex", () => {
    it("matches positive", () => {
        expect(hex("3420abcdefn")).toEqual(Result.ok([0x3420abcdef, 10]));
    });

    it("doesn't include .", () => {
        expect(hex("321.10")).toEqual(Result.ok([0x321, 3]));
    });

    it("doesn't match negative", () => {
        expect(hex("-5")).toEqual(PResult.expected("nonnegative hexadecimal"));
    });

    it("doesn't match zero prefix", () => {
        expect(hex("0123")).toEqual(PResult.expected("nonnegative hexadecimal"));
    });

    it("matches zero", () => {
        expect(hex("0")).toEqual(Result.ok([0, 1]));
    });

    it("doesn't match whitespace", () => {
        expect(hex(" 123")).toEqual(PResult.expected("nonnegative hexadecimal"));
    });
});

describe("hex", () => {
    it("matches positive", () => {
        expect(signedHex("3420abcdefn")).toEqual(Result.ok([0x3420abcdef, 10]));
    });

    it("doesn't include .", () => {
        expect(signedHex("321.10")).toEqual(Result.ok([0x321, 3]));
    });

    it("matches negative", () => {
        expect(signedHex("-5")).toEqual(Result.ok([-0x5, 2]));
    });

    it("doesn't match zero prefix", () => {
        expect(signedHex("0123")).toEqual(PResult.expected("hexadecimal"));
    });

    it("matches zero", () => {
        expect(signedHex("0")).toEqual(Result.ok([0, 1]));
    });

    it("doesn't match whitespace", () => {
        expect(signedHex(" 123")).toEqual(PResult.expected("hexadecimal"));
    });
});
