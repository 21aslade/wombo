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
    parser.expect = (e) => expect(parser, e);
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

export function tag(tag: string): Parser<string> {
    return makeParser((s: string) => {
        if (s.startsWith(tag)) {
            return Result.ok([tag, tag.length]);
        } else {
            return PResult.expected(tag);
        }
    });
}

function uintPrefixLen(s: string): number {
    if (s[0] === "0") {
        return 0;
    }

    let numberLength = 0;
    while (numberLength < s.length) {
        const c = s[numberLength] ?? "";
        if (c < "0" || c > "9") {
            return numberLength;
        }

        numberLength++;
    }

    return numberLength;
}

export const uint: Parser<number> = makeParser((s: string) => {
    const len = uintPrefixLen(s);

    if (len === 0) {
        return PResult.expected("nonnegative integer");
    }

    const numeric = s.slice(0, len);
    const parsed = parseInt(numeric);
    return Result.ok([parsed, len]);
});

export function many0<T>(p: ParserFunction<T>): Parser<T[]> {
    return makeParser((s: string) => {
        let remaining = s;
        let results = [];
        do {
            const result = p(remaining);
            if (result.isErr()) {
                if (result.error.isErr()) {
                    return result.castOk();
                } else {
                    break;
                }
            }

            const [t, len] = result.value;
            remaining = remaining.slice(len);
            results.push(t);
        } while (remaining.length > 0);

        return Result.ok([results, s.length - remaining.length]);
    });
}

export function many1<T>(p: ParserFunction<T>): Parser<T[]> {
    return makeParser((s: string) => {
        const matches = many0(p)(s);

        if (matches.isOk()) {
            const [results] = matches.value;

            if (results.length <= 0) {
                // always an error
                return PResult.map(p(s), (_) => []);
            }
        }

        return matches;
    });
}

export function pair<A, B>(a: ParserFunction<A>, b: ParserFunction<B>): Parser<[A, B]> {
    return makeParser((s) => {
        const aResult = a(s);
        if (aResult.isErr()) {
            return Result.err(aResult.error);
        }

        const [aVal, aLen] = aResult.value;
        const remaining = s.slice(aLen);

        return required(b)(remaining).map(([bVal, bLen]) => [[aVal, bVal], aLen + bLen]);
    });
}

export function required<T>(p: ParserFunction<T>): Parser<T> {
    return makeParser((s) => PResult.require(p(s), s));
}

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

export function regex(r: RegExp): Parser<string> {
    return makeParser((s) => {
        const result = r.exec(s);
        if (result === null || result.index !== 0) {
            return PResult.expected(r.toString());
        }

        return Result.ok([result[0], result[0].length]);
    });
}

export function mapped<T, U>(p: ParserFunction<T>, f: (t: T) => U): Parser<U> {
    return makeParser((s) => PResult.map(p(s), f));
}

export function expect<T>(p: ParserFunction<T>, expected: string): Parser<T> {
    return makeParser((s) => {
        const result = p(s);
        if (result.isErr() && result.error.isOk()) {
            return PResult.expected(expected);
        }

        return result;
    });
}

export function alt<T>(...parsers: ParserFunction<T>[]): Parser<T> {
    return makeParser((s) => {
        let expected: Set<string> = new Set();
        for (const parser of parsers) {
            const result = parser(s);
            if (result.isErr() && result.error.isOk()) {
                result.error.value.forEach((s) => expected.add(s));
            } else {
                return result;
            }
        }

        return Result.err(Result.ok(expected));
    });
}
