import { Result } from "./result.js";
import { ParseError } from "./error.js";

export type PError = Result<Set<string>, ParseError>;

export type PResult<T> = Result<[T, number], PError>;
export const PResult = {
    map<T, U>(r: PResult<T>, f: (t: T) => U): PResult<U> {
        return r.map(([t, n]) => [f(t), n]);
    },
    expected(expected: string): PResult<never> {
        return Result.err(Result.ok(new Set([expected])));
    },
    require<T>(main: PResult<T>, remaining: string): PResult<T> {
        if (main.isErr() && main.error.isOk()) {
            return Result.err(Result.err(new ParseError(main.error.value, remaining)));
        } else {
            return main;
        }
    },
} as const;

/**
 * Adds convenience functions like map, expect, and require to a parser function
 * @param p the parser function to transform
 * @returns p as a Parser<T>
 */
export function makeParser<T>(p: ParserFunction<T>): Parser<T> {
    const parser = p.bind(undefined) as Parser<T>;
    parser.map = (f) => mapped(parser, f);
    parser.expect = (e) => expected(parser, e);
    parser.require = () => required(parser);
    return parser;
}

/** The type of a parser, augmented with convenience functions */
export type Parser<T> = ParserFunction<T> & ParserExt<T>;

/** The type of a parser */
export type ParserFunction<T> = (s: string) => PResult<T>;

/** Convenience functions for a parser */
export type ParserExt<T> = {
    map<U>(f: (t: T) => U): Parser<U>;
    expect(expected: string): Parser<T>;
    require(): Parser<T>;
};

export function completed<T>(p: ParserFunction<T>): (s: string) => Result<T, ParseError> {
    return (s) => {
        const result = p(s);
        if (result.isOk()) {
            if (result.value[1] < s.length) {
                return Result.err(
                    new ParseError(new Set(["EOF"]), s.slice(result.value[1])),
                );
            }
            return Result.ok(result.value[0]);
        } else if (result.error.isOk()) {
            return Result.err(new ParseError(result.error.value, s));
        } else {
            return result.error.castOk();
        }
    };
}

export function mapped<T, U>(p: ParserFunction<T>, f: (t: T) => U): Parser<U> {
    return makeParser((s) => PResult.map(p(s), f));
}

export function expected<T>(p: ParserFunction<T>, expected: string): Parser<T> {
    return makeParser((s) => {
        const result = p(s);
        if (result.isErr() && result.error.isOk()) {
            return PResult.expected(expected);
        }

        return result;
    });
}

export function required<T>(p: ParserFunction<T>): Parser<T> {
    return makeParser((s) => PResult.require(p(s), s));
}
