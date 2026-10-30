import {readFileSync} from "fs";

/**
 * Charge une page dans le contexte d'environnement de test, pour simuler la page courante vue par TamperMonkey.
 */
export function loadPage(dir: Site, path: string) {
    document.body.innerHTML = readPageHTML(dir, path);
    setWindowLocation(`https://${dir}.localhost${path}`);
}

const ROOT_DIR = './src/test-resources';
type Site = 'zone-telechargement';
function readPageHTML(dir: Site, path: string): string {
    return readFileSync(`${ROOT_DIR}/pages/${dir}${path}.html`).toString();
}

/**
 * Source : https://stackoverflow.com/a/73965890/1655155
 */
function setWindowLocation(href: string) {
    Object.defineProperty(window, 'location', {
        configurable: true,
        enumerable: true,
        value: new URL(href),
    });
}
