import {expect} from 'vitest';

expect.extend({
    /**
     * @param received
     * @param expected true : toBeTruthy ; false : toBeFalsy
     */
    toBeBooleany(received: unknown, expected: boolean) { // TODO typage plus précis
        if (!!received === expected) {
            return {
                pass: true,
                message: () => '',
            };
        } else {
            return {
                message: () =>
                    `Expected: ${this.utils.printExpected(expected)}\nReceived: ${this.utils.printReceived(
                        received,
                    )}\n\n${this.utils.diff(expected, received)}`,
                pass: false,
            };
        }
    },
});

interface CustomMatchers<R> {
    /**
     * @param expected true : toBeTruthy ; false : toBeFalsy
     */
    toBeBooleany(expected: boolean): R;
}

declare module 'vitest' {
    interface Assertion<
        R extends void | Promise<void> = void,
        T = unknown
    > extends CustomMatchers<R> {
    } // TODO typage plus précis
}
