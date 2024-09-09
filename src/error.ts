export class ParseError {
    expected: Set<string>;
    remaining: string;

    constructor(expected: Set<string>, remaining: string) {
        this.expected = expected;
        this.remaining = remaining;
    }
}
