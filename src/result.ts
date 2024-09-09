export type Result<T, E> = Ok<T, E> | Err<T, E>;
export const Result = {
    ok<T, E>(t: T): Ok<T, E> {
        return new Ok(t);
    },
    err<T, E>(e: E): Err<T, E> {
        return new Err(e);
    },
    try<T>(f: () => T): Result<T, unknown> {
        try {
            return Result.ok(f());
        } catch (e) {
            return Result.err(e);
        }
    },
} as const;

interface ResultBase<T, E> {
    isOk(): this is Ok<T, E>;
    isErr(): this is Err<T, E>;

    map<U>(f: (t: T) => U): Result<U, E>;
    and<U>(r: Result<U, E>): Result<U, E>;
    andThen<U>(f: (t: T) => Result<U, E>): Result<U, E>;
    or<U>(r: Result<U, E>): Result<T | U, E>;
    or_else<U>(f: (e: E) => Result<U, E>): Result<T | U, E>;
}

class Ok<T, E> implements ResultBase<T, E> {
    value: T;
    error: undefined;

    constructor(t: T) {
        this.value = t;
    }

    toString(): string {
        return `Ok(${this.value})`;
    }

    castErr<U>(): Ok<T, U> {
        return this as Ok<T, unknown> as Ok<T, U>;
    }

    isOk(): this is Ok<T, E> {
        return true;
    }

    isErr(): this is Err<T, E> {
        return false;
    }

    map<U>(f: (t: T) => U): Ok<U, E> {
        return new Ok(f(this.value));
    }

    and<U>(r: Result<U, E>): Result<U, E> {
        return r;
    }

    andThen<U>(f: (t: T) => Result<U, E>): Result<U, E> {
        return f(this.value);
    }

    or<U>(_r: Result<U, E>): Ok<T, E> {
        return this;
    }

    or_else<U>(_f: (e: E) => Result<U, E>): Result<T | U, E> {
        return this;
    }
}

class Err<T, E> implements ResultBase<T, E> {
    value: undefined;
    error: E;

    constructor(e: E) {
        this.error = e;
    }

    toString(): string {
        return `Err(${this.value})`;
    }

    castOk<U>(): Err<U, E> {
        return this as Err<unknown, E> as Err<U, E>;
    }

    isOk(): this is Ok<T, E> {
        return false;
    }

    isErr(): this is Err<T, E> {
        return true;
    }

    map<U>(f: (t: T) => U): Result<U, E> {
        return this.castOk();
    }

    and<U>(r: Result<U, E>): Err<U, E> {
        return this.castOk();
    }

    andThen<U>(f: (t: T) => Result<U, E>): Err<U, E> {
        return this.castOk();
    }

    or<U>(r: Result<U, E>): Result<U, E> {
        return r;
    }

    or_else<U>(f: (e: E) => Result<U, E>): Result<U, E> {
        return f(this.error);
    }
}
