import { makeParser, Parser, ParserFunction, PResult, required } from "./index.js";
import { Option } from "./option.js";
import { Result } from "./result.js";

export function opt<T>(p: Parser<T>): Parser<Option<T>> {
    return makeParser<Option<T>>((s) => {
        const result = p(s);
        if (result.isOk()) {
            return Result.ok([Option.some(result.value[0]), result.value[1]]);
        } else if (result.error.isOk()) {
            return Result.ok([Option.none(), 0]);
        } else {
            return result.castOk();
        }
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

export function separatedPair<A, S, B>(
    a: ParserFunction<A>,
    sep: ParserFunction<S>,
    b: ParserFunction<B>,
): Parser<[A, B]> {
    return makeParser((s) => {
        const aResult = a(s);
        if (aResult.isErr()) {
            return Result.err(aResult.error);
        }

        const [aVal, aLen] = aResult.value;
        const aRemaining = s.slice(aLen);

        const sepResult = required(sep)(aRemaining);
        if (sepResult.isErr()) {
            return sepResult.castOk();
        }

        const [_, sepLen] = sepResult.value;
        const sepRemaining = aRemaining.slice(sepLen);

        return required(b)(sepRemaining).map(([bVal, bLen]) => [
            [aVal, bVal],
            aLen + sepLen + bLen,
        ]);
    });
}
