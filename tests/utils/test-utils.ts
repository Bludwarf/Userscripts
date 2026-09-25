import * as fs from "node:fs";
import * as path from "node:path";

export function loadPage(site, page) {
    document.documentElement.innerHTML = fs.readFileSync(
        path.resolve(__dirname, `../pages/${site}/${page}`),
        'utf8'
    );
}
