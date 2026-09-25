const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const os = require('os');

const globalVersion = process.env.VERSION || new Date().toISOString().slice(0, 10);

// Détection automatique des points d'entrée dans src/scripts/
const entryDir = 'src/scripts';
const entries = fs
    .readdirSync(entryDir)
    .filter((f) => f.endsWith('.user.ts'))
    .map((f) => path.basename(f, '.user.ts'));

const HEADER_REGEX = /\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/;
const NEW_LINE_REGEX = /\r?\n/;
const HEADER_LINE_REGEX = /\/\/ @(\S+)\s+(.+)/;

/**
 * @typedef Header
 * @description En-tête de script utilisateur
 * @see https://www.tampermonkey.net/documentation.php?locale=fr
 * @property {string} description
 * @property {string[]} match
 * @property {string} icon
 * @property {string[]} grant
 */
function renderBanner(name) {
    const filePath = `${entryDir}/${name}.user.ts`;
    const source = fs.readFileSync(filePath, 'utf8');
    const match = source.match(HEADER_REGEX);
    if (!match) {
        throw new Error(`Aucun header trouvé dans le fichier ${filePath}`);
    }
    const sourceRawHeader = match[0];
    /** @type Header */
    const sourceHeader = {};
    sourceRawHeader.split(NEW_LINE_REGEX).slice(1, -1).forEach(sourceRawHeaderLine => {
        const lineMatch = sourceRawHeaderLine.match(HEADER_LINE_REGEX);
        if (!lineMatch) {
            throw new Error(`Ligne de header non reconnue : ${sourceRawHeaderLine}`);
        }
        const [_, key, value] = lineMatch;
        if (["match", "grant"]) {
            if (!(key in sourceHeader)) {
                sourceHeader[key] = [];
            }
            sourceHeader[key].push(value);
        } else {
            sourceHeader[key] = value;
        }
    })

    const url = `https://github.com/Bludwarf/Userscripts/releases/latest/download/${name}.user.js`;
    return [
        "// ==UserScript==",
        `// @name         ${name}`,
        "// @namespace    https://github.com/Bludwarf/Userscripts",
        `// @version      ${globalVersion}`,
        `// @description  ${sourceHeader.description}`,
        "// @author       bludwarf@gmail.com",
        ...sourceHeader.match.map(match => `// @match        ${match}`),
        `// @icon         ${sourceHeader.icon}`,
        ...(sourceHeader.grant || []).map(grant => `// @grant        ${grant}`),
        `// @downloadURL  ${url}`,
        `// @updateURL    ${url}`,
        "// ==/UserScript==",
    ].join(os.EOL);
}

async function buildAll() {
    for (const name of entries) {
        await esbuild.build({
            entryPoints: [`${entryDir}/${name}.user.ts`],
            bundle: true,
            outfile: `dist/${name}.user.js`,
            format: 'iife',
            target: 'es2020',
            banner: {js: renderBanner(name)},
            minify: false,
            sourcemap: false, // pas utile pour un fichier standalone final
        });
        console.log(`✅ Build réussi : dist/${name}.user.js`);
    }
}

const isWatch = process.argv.includes('--watch');

async function main() {
    if (isWatch) {
        const contexts = await Promise.all(
            entries.map((name) =>
                esbuild.context({
                    entryPoints: [`${entryDir}/${name}.user.ts`],
                    bundle: true,
                    outfile: `dist/${name}.user.js`,
                    format: 'iife',
                    target: 'es2020',
                    banner: {js: renderBanner(name)},
                })
            )
        );
        await Promise.all(contexts.map((ctx) => ctx.watch()));
        console.log('👀 Watching...');
    } else {
        await buildAll();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
