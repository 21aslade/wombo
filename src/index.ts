import { Result } from "typescript-result";

export type PError = Set<string>;

export type PResult<T> = Result<[T, number], PError>;
export const PResult = {
    map<T, U>(r: PResult<T>, f: (t: T) => U): PResult<U> {
        return r.map(([t, n]) => [f(t), n]);
    },
    expected(expected: string): PResult<never> {
        return Result.error(new Set([expected]))
    }
}

type Parser<T> = (s: string) => PResult<T>;

export function tag(tag: string): Parser<string> {
    return (s: string) => {
        if (s.startsWith(tag)) {
            return Result.ok([tag, tag.length]);
        } else {
            return PResult.expected(tag);
        }
    };
}

function uintPrefixLen(s: string): number {
    if (s[0] === "0") { return 0; }

    let numberLength = 0;
    while (numberLength < s.length) {
        const c = s[numberLength] ?? '';
        if (c < "0" || c > "9") {
            return numberLength;
        }

        numberLength++;
    }

    return numberLength;
}

export const uint: Parser<number> = (s: string) => {
    const len = uintPrefixLen(s);

    if (len === 0) {
        return PResult.expected("nonnegative integer");
    }

    const numeric = s.slice(0, len);
    const parsed = parseInt(numeric);
    return Result.ok([parsed, len]);
};

export function many0<T>(p: Parser<T>): Parser<T[]> {
    return (s: string) => {
        let remaining = s;
        let results = [];
        do {
            const result = p(remaining);
            if (!result.isOk()) {
                break;
            }

            const [t, len] = result.value;
            remaining = remaining.slice(len);
            results.push(t);
        } while(remaining.length > 0);

        return Result.ok([results, s.length - remaining.length]);
    };
}

export function many1<T>(p: Parser<T>): Parser<T[]> {
    return (s: string) => {
        const matches = many0(p)(s);

        if (matches.isOk()) {
            const [results] = matches.value;

            if (results.length <= 0) {
                // always an error
                return PResult.map(p(s), (_) => []);
            }
        }

        return matches;
    };
}

export function pair<A, B>(a: Parser<A>, b: Parser<B>): Parser<[A, B]> {
    return (s) => {
        const aResult = a(s);
        if (!aResult.isOk()) {
            return Result.error(aResult.error!!);
        }

        const [aVal, aLen] = aResult.value;
        const remaining = s.slice(aLen);

        return b(remaining).map(([bVal, bLen]) => [[aVal, bVal], aLen + bLen])
    };
}
