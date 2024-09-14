import { Option } from "./option.js";
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
    transpose<T, E>(r: Result<Option<T>, E>): Option<Result<T, E>> {
        if (r.isOk()) {
            return r.value.map<Result<T, E>>(Result.ok);
        } else {
            return Option.some(r.castOk());
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
    orElse<U>(f: (e: E) => Result<U, E>): Result<T | U, E>;
    unwrap(): T;
    unwrapOr<U>(u: U): T | U;
    unwrapOrElse<U>(f: (e: E) => U): T | U;
    ok(): Option<T>;
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

    orElse<U>(_f: (e: E) => Result<U, E>): Result<T | U, E> {
        return this;
    }

    unwrap(): T {
        return this.value;
    }

    unwrapOr<U>(_u: U): T | U {
        return this.value;
    }

    unwrapOrElse<U>(_f: (e: E) => U): T | U {
        return this.value;
    }

    ok(): Option<T> {
        return Option.some(this.value);
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

    orElse<U>(f: (e: E) => Result<U, E>): Result<U, E> {
        return f(this.error);
    }

    unwrap(): T {
        throw new Error("Attempted to unwrap Err value");
    }

    unwrapOr<U>(u: U): T | U {
        return u;
    }

    unwrapOrElse<U>(f: (e: E) => U): T | U {
        return f(this.error);
    }

    ok(): Option<T> {
        return Option.none();
    }
}
