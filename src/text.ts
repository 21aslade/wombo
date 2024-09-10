import { makeParser, Parser, PResult } from "./index.js";
import { Result } from "./result.js";

export function tag(tag: string): Parser<string> {
    return makeParser((s: string) => {
        if (s.startsWith(tag)) {
            return Result.ok([tag, tag.length]);
        } else {
            return PResult.expected(tag);
        }
    });
}

export function regex(r: RegExp): Parser<string> {
    return makeParser((s) => {
        const result = r.exec(s);
        if (result === null || result.index !== 0) {
            return PResult.expected(r.toString());
        }

        return Result.ok([result[0], result[0].length]);
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
