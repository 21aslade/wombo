import { Option } from "./option.js";
import { Result } from "./result.js";

export class ParseResult<T> {
    result: Result<T, void>;
    consumed: number;
    expected: Set<string>;

    private constructor(
        result: Result<T, void>,
        consumed: number,
        expected: Set<string>,
    ) {
        this.result = result;
        this.consumed = consumed;
        this.expected = expected;
    }

    castOk<U>(): ParseResult<U> {
        return this.map(() => {
            throw new Error("Attempted to castOk an Ok ParseResult");
        });
    }

    isOk(): boolean {
        return this.result.isOk();
    }

    isErr(): boolean {
        return this.result.isErr();
    }

    isFatal(): boolean {
        return this.isErr() && this.consumed > 0;
    }

    expect(expected: string) {
        return new ParseResult(this.result, this.consumed, new Set([expected]));
    }

    toResult(): Result<T, ParseError> {
        if (this.result.isOk()) {
            return this.result.castErr();
        } else {
            return Result.err(new ParseError(this.expected, this.consumed));
        }
    }

    map<U>(f: (t: T) => U): ParseResult<U> {
        return new ParseResult(this.result.map(f), this.consumed, this.expected);
    }

    tryMap<U>(f: (t: T) => Result<U, string>): ParseResult<U> {
        if (this.result.isOk()) {
            const result = f(this.result.value);
            if (result.isOk()) {
                return new ParseResult(result.castErr(), this.consumed, this.expected);
            } else {
                return new ParseResult(
                    Result.err(undefined),
                    0,
                    new Set(this.result.error),
                );
            }
        } else {
            return this.castOk();
        }
    }

    and<U>(other: ParseResult<U>): ParseResult<[T, U]> {
        if (this.result.isOk()) {
            const result: Result<[T, U], void> = other.result.andThen((b) =>
                this.result.map((a) => [a, b]),
            );
            const expected: Set<string> =
                other.consumed > 0
                    ? other.expected
                    : new Set([...this.expected, ...other.expected]);
            return new ParseResult(result, this.consumed + other.consumed, expected);
        } else {
            return this.castOk();
        }
    }

    or<U>(other: ParseResult<U>): ParseResult<T | U> {
        if (this.result.isErr() && this.consumed === 0) {
            if (other.result.isOk()) {
                return other;
            } else {
                const expected = new Set([...this.expected, ...other.expected]);
                return new ParseResult(Result.err(undefined), other.consumed, expected);
            }
        } else {
            return this;
        }
    }

    static ok<T>(value: T, consumed: number): ParseResult<T> {
        return new ParseResult(Result.ok(value), consumed, new Set());
    }

    static okExpecting<T>(
        value: T,
        consumed: number,
        expected: Set<string>,
    ): ParseResult<T> {
        return new ParseResult(Result.ok(value), consumed, expected);
    }

    static expected(...expected: string[]): ParseResult<never> {
        return new ParseResult(Result.err(undefined), 0, new Set(expected));
    }

    static fatal(consumed: number, ...expected: string[]) {
        return new ParseResult(Result.err(undefined), consumed, new Set(expected));
    }
}

export class ParseError {
    expected: Set<string>;
    consumed: number;

    constructor(expected: Set<string>, consumed: number) {
        this.expected = expected;
        this.consumed = consumed;
    }
}
