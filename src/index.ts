import { Result } from "./result.js";
import { ParseError, ParseResult } from "./parseResult.js";
import { eof } from "./text.js";
import { terminated } from "./multi.js";

/**
 * Adds convenience functions like map, expect, and require to a parser function
 * @param p the parser function to transform
 * @returns p as a Parser<T>
 */
export function makeParser<T>(p: ParserFunction<T>): Parser<T> {
    const parser = p.bind(undefined) as Parser<T>;
    parser.map = (f) => mapped(parser, f);
    parser.expect = (e) => expected(parser, e);
    return parser;
}

/** The type of a parser, augmented with convenience functions */
export type Parser<T> = ParserFunction<T> & ParserExt<T>;

/** The type of a parser */
export type ParserFunction<T> = (s: string) => ParseResult<T>;

/** Convenience functions for a parser */
export type ParserExt<T> = {
    map<U>(f: (t: T) => U): Parser<U>;
    expect(expected: string): Parser<T>;
};

export function completed<T>(p: ParserFunction<T>): (s: string) => Result<T, ParseError> {
    return (s) => terminated(p, eof)(s).toResult();
}

export function mapped<T, U>(p: ParserFunction<T>, f: (t: T) => U): Parser<U> {
    return makeParser((s) => p(s).map(f));
}

export function expected<T>(p: ParserFunction<T>, expected: string): Parser<T> {
    return makeParser((s) => {
        const result = p(s);
        if (result.isErr() && !result.isFatal()) {
            return ParseResult.expected(expected);
        }

        return result;
    });
}
