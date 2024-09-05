import { describe, it, expect } from "@jest/globals";
import { tag, uint } from ".";
import { Result } from "typescript-result";

describe("tag", () => {
    it("matches tag value", () => {
        const parser = tag("abc");
        expect(parser("abcde")).toEqual(Result.ok(["abc", 3]));
    });

    it("doesn't match mid-string", () => {
        const parser = tag("bcd");
        expect(parser("abcde")).toEqual(Result.error(new Set(["bcd"])));
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
        expect(uint("-5")).toEqual(Result.error(new Set(["nonnegative integer"])));
    })

    it("doesn't match zero prefix", () => {
        expect(uint("0123")).toEqual(Result.error(new Set(["nonnegative integer"])));
    })

    it("doesn't match whitespace", () => {
        expect(uint(" 123")).toEqual(Result.error(new Set(["nonnegative integer"])));
    })
})