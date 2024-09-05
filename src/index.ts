import { Result } from "typescript-result";

type PError = Set<string>;

type PResult<T> = Result<[T, number], PError>;
const PResult = {
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
