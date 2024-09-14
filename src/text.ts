import { makeParser, Parser } from "./index.js";
import { ParseResult } from "./parseResult.js";
import { Result } from "./result.js";

export const eof: Parser<void> = makeParser((s) =>
    s === "" ? ParseResult.ok(undefined, 0) : ParseResult.expected("EOF"),
);

export function tag(tag: string): Parser<string> {
    return makeParser((s: string) => {
        if (s.startsWith(tag)) {
            return ParseResult.ok(tag, tag.length);
        } else {
            return ParseResult.expected(tag);
        }
    });
}

export function regex(r: RegExp): Parser<string> {
    return makeParser((s) => {
        const result = r.exec(s);
        if (result === null || result.index !== 0) {
            return ParseResult.expected(r.toString());
        }

        return ParseResult.ok(result[0], result[0].length);
    });
}

export const uint: Parser<number> = regex(/[1-9]\d*|0(?!\d)/)
    .map(parseInt)
    .expect("nonnegative integer");

export const int: Parser<number> = regex(/-?[1-9]\d*|-?0(?!\d)/)
    .map(parseInt)
    .expect("integer");

export const hex: Parser<number> = regex(/[1-9A-Fa-f][0-9A-Fa-f]*|0(?!\d)/)
    .map((s) => parseInt(s, 16))
    .expect("nonnegative hexadecimal");

export const signedHex: Parser<number> = regex(/-?[1-9A-Fa-f][0-9A-Fa-f]*|-?0(?!\d)/)
    .map((s) => parseInt(s, 16))
    .expect("hexadecimal");
