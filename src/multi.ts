import { makeParser, Parser, ParserFunction } from "./index.js";
import { ParseResult } from "./parseResult.js";
import { Option } from "./option.js";
import { Result } from "./result.js";

export function opt<T>(p: ParserFunction<T>): Parser<Option<T>> {
    return makeParser<Option<T>>((s) => {
        const result = p(s);
        if (result.isOk()) {
            return result.map(Option.some);
        } else if (result.isErr() && !result.isFatal()) {
            return ParseResult.okExpecting(Option.none(), 0, result.expected);
        } else {
            return result.castOk<Option<T>>();
        }
    });
}

export function alt<T>(...parsers: ParserFunction<T>[]): Parser<T> {
    return makeParser((s) => {
        let expected: Set<string> = new Set();
        for (const parser of parsers) {
            const result = parser(s);
            if (result.isFatal() || result.isOk()) {
                return result;
            } else {
                result.expected.forEach((s) => expected.add(s));
            }
        }

        return ParseResult.expected(...expected);
    });
}

export function many0<T>(p: ParserFunction<T>): Parser<T[]> {
    return opt(many1(p)).map((t) => t.unwrapOr([]));
}

export function many1<T>(p: ParserFunction<T>): Parser<T[]> {
    return makeParser((s: string) => {
        let remaining = s;
        let results = [];
        let expected: Set<string>;
        do {
            const result = p(remaining);
            if (result.isErr()) {
                if (result.isFatal()) {
                    return result.castOk();
                } else {
                    expected = result.expected;
                    break;
                }
            } else if (result.consumed === 0) {
                throw new Error("Attempted to call many on a zero-length parser");
            }

            remaining = remaining.slice(result.consumed);
            results.push(result.result.unwrap());
        } while (true);

        if (results.length > 0) {
            return ParseResult.okExpecting(
                results,
                s.length - remaining.length,
                expected,
            );
        } else {
            return ParseResult.expected(...(expected ?? []));
        }
    });
}

export function pair<A, B>(a: ParserFunction<A>, b: ParserFunction<B>): Parser<[A, B]> {
    return makeParser((s) => {
        const aResult = a(s);
        if (aResult.isErr()) {
            return aResult.castOk();
        }

        const remaining = s.slice(aResult.consumed);
        return aResult.and(b(remaining));
    });
}

export function separatedPair<A, S, B>(
    a: ParserFunction<A>,
    sep: ParserFunction<S>,
    b: ParserFunction<B>,
): Parser<[A, B]> {
    return pair(terminated(a, sep), b);
}

export function terminated<T, E>(a: ParserFunction<T>, b: ParserFunction<E>): Parser<T> {
    return pair(a, b).map(([t, _]) => t);
}

export function preceded<T, S>(a: ParserFunction<S>, b: ParserFunction<T>): Parser<T> {
    return pair(a, b).map(([_, t]) => t);
}

export function delimited<S, T, E>(
    start: ParserFunction<S>,
    parser: ParserFunction<T>,
    end: ParserFunction<E>,
): Parser<T> {
    return preceded(start, terminated(parser, end));
}
