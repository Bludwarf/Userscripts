/**
 * @param {string} name
 * @param {string} message
 * @param {() => Error} errorProvider
 * @return {unknown|string}
 */
export function getOrPromptString(name: string, message: string, errorProvider: () => Error): string {
    const storedValue = GM_getValue(name);
    if (storedValue) {
        return "" + storedValue;
    }

    const value = prompt(message);
    if (!value) {
        throw errorProvider();
    }

    GM_setValue(name, value)
    return value;
}
