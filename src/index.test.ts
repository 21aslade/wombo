import { describe, it, expect } from "@jest/globals";
import { tag } from ".";
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
