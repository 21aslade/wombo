import { Result } from "typescript-result";

type PError = Set<string>;

type PResult<T> = Result<[T, number], PError>;

type Parser<T> = (s: string) => PResult<T>;

export function tag(tag: string): Parser<string> {
    return (s: string) => {
        if (s.startsWith(tag)) {
            return Result.ok([tag, tag.length]);
        } else {
            return Result.error(new Set([tag]));
        }
    };
}