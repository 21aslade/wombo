import { Result } from "./result.js";

export type Option<T> = Some<T> | None;
export const Option = {
    some<T>(t: T): Some<T> {
        return new Some(t);
    },
    none(): None {
        return new None();
    },
    try<T>(f: () => T): Option<T> {
        try {
            return Option.some(f());
        } catch {
            return Option.none();
        }
    },
    transpose<T, E>(o: Option<Result<T, E>>): Result<Option<T>, E> {
        if (o.isSome()) {
            return o.value.map<Option<T>>(Option.some);
        } else {
            return Result.ok(Option.none());
        }
    },
};

interface OptionBase<T> {
    value: T | undefined;

    isSome(): this is Some<T>;
    isNone(): this is None;

    map<U>(f: (t: T) => U): Option<U>;
    and<U>(other: Option<U>): Option<U>;
    andThen<U>(f: (t: T) => Option<U>): Option<U>;
    or<U = T>(other: Option<U>): Option<T | U>;
    orElse<U = T>(f: () => Option<U>): Option<T | U>;
    unwrapOr<U = T>(other: U): T | U;
    unrapOrElse<U = T>(f: () => U): T | U;
    okOr<E>(error: E): Result<T, E>;
    okOrElse<E>(f: () => E): Result<T, E>;
}

class Some<T> implements OptionBase<T> {
    value: T;

    constructor(t: T) {
        this.value = t;
    }
    isSome(): this is Some<T> {
        return true;
    }
    isNone(): this is None {
        return false;
    }
    map<U>(f: (t: T) => U): Option<U> {
        return new Some(f(this.value));
    }
    and<U>(other: Option<U>): Option<U> {
        return other;
    }
    andThen<U>(f: (t: T) => Option<U>): Option<U> {
        return f(this.value);
    }
    or<U = T>(_other: Option<U>): Option<T | U> {
        return this;
    }
    orElse<U = T>(_f: () => Option<U>): Option<T | U> {
        return this;
    }
    unwrapOr<U = T>(_other: U): T | U {
        return this.value;
    }
    unrapOrElse<U = T>(_f: () => U): T | U {
        return this.value;
    }
    okOr<E>(_error: E): Result<T, E> {
        return Result.ok(this.value);
    }
    okOrElse<E>(_f: () => E): Result<T, E> {
        return Result.ok(this.value);
    }
}

class None implements OptionBase<never> {
    value: undefined;

    isSome(): this is Some<never> {
        return false;
    }
    isNone(): this is None {
        return true;
    }
    map<U>(f: (t: never) => U): Option<U> {
        return this;
    }
    and<U>(other: Option<U>): Option<U> {
        return this;
    }
    andThen<U>(f: (t: never) => Option<U>): Option<U> {
        return this;
    }
    or<U = never>(other: Option<U>): Option<U> {
        return other;
    }
    orElse<U = never>(f: () => Option<U>): Option<U> {
        return f();
    }
    unwrapOr<U = never>(other: U): U {
        return other;
    }
    unrapOrElse<U = never>(f: () => U): U {
        return f();
    }
    okOr<E>(error: E): Result<never, E> {
        return Result.err(error);
    }
    okOrElse<E>(f: () => E): Result<never, E> {
        return Result.err(f());
    }
}
