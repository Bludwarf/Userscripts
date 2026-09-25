const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const os = require('os');

const globalVersion = process.env.VERSION || new Date().toISOString().slice(0, 10);

// Détection automatique des points d'entrée dans src/scripts/
const entryDir = 'src/scripts';
const entries = fs
    .readdirSync(entryDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => path.basename(f, '.ts'));

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
    /** @type Header */
    const header = require(path.resolve(`./${entryDir}/${name}.header.js`));
    const url = `https://github.com/Bludwarf/Userscripts/releases/latest/download/${name}.user.js`;
    return [
        "// ==UserScript==",
        `// @name         ${name}`,
        "// @namespace    https://github.com/Bludwarf/Userscripts",
        `// @version      ${globalVersion}`,
        `// @description  ${header.description}`,
        "// @author       bludwarf@gmail.com",
        ...header.match.map(match => `// @match        ${match}`),
        `// @icon         ${header.icon}`,
        ...(header.grant || []).map(grant => `// @grant        ${grant}`),
        `// @downloadURL  ${url}`,
        `// @updateURL    ${url}`,
        "// ==/UserScript==",
    ].join(os.EOL);
}

async function buildAll() {
    for (const name of entries) {
        await esbuild.build({
            entryPoints: [`${entryDir}/${name}.ts`],
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
                    entryPoints: [`${entryDir}/${name}.ts`],
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
