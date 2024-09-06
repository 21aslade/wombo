import { Result } from "./result";

export type PError = Result<Set<string>, [Set<string>, string]>;

export type PResult<T> = Result<[T, number], PError>;
export const PResult = {
    map<T, U>(r: PResult<T>, f: (t: T) => U): PResult<U> {
        return r.map(([t, n]) => [f(t), n]);
    },
    expected(expected: string): PResult<never> {
        return Result.err(Result.ok(new Set([expected])))
    },
    require<T>(main: PResult<T>, remaining: string): PResult<T> {
        if (main.isErr() && main.error.isOk()) {
            return Result.err(Result.err([main.error.value, remaining]));
        } else {
            return main;
        }
    },
} as const;

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
        if (aResult.isErr()) {
            return Result.err(aResult.error);
        }

        const [aVal, aLen] = aResult.value;
        const remaining = s.slice(aLen);

        return required(b)(remaining).map(([bVal, bLen]) => [[aVal, bVal], aLen + bLen]);
    };
}

export function required<T>(p: Parser<T>): Parser<T> {
    return (s) => PResult.require(p(s), s);
}

export function completed<T>(p: Parser<T>): (s: string) => Result<T, [Set<string>, string]> {
    return (s) => {
        const result = p(s);
        if (result.isOk()) {
            if (result.value[1] < s.length) {
                return Result.err([new Set(["EOF"]), s.slice(result.value[1])])
            }
            return Result.ok(result.value[0]);
        } else if (result.error.isOk()) {
            return Result.err([result.error.value, s]);
        } else {
            return result.error.castOk();
        }
    };
}