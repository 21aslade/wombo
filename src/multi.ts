import { makeParser, Parser, ParserFunction, PResult, required } from "./index.js";
import { Result } from "./result.js";

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
