import {basename} from "node:path";
import {readdirSync, readFileSync} from "node:fs";
import {EOL} from "node:os";
import {autoGrantPlugin} from "./ci/auto-grant-plugin";
import {skipIfUnchangedPlugin} from "./ci/skip-if-unchanged-plugin";
import {systemLineEndingPlugin} from "./ci/system-line-ending-plugin";
import {addToSummary, summaryPlugin} from "./ci/summary-plugin";
import * as esbuild from "esbuild";
import {BuildOptions} from "esbuild";
import chalk from "chalk";
import {ANY_EOL_REGEX, HEADER_LINE_REGEX, HEADER_REGEX, parseUserscriptHeader} from "./ci/userscript-header-parser";

const globalVersion = process.env.VERSION || new Date().toISOString().slice(0, 10).replace(/-/g, '.');

// Détection automatique des points d'entrée dans src/scripts/
const entryDir = 'src/scripts';
const entries = readdirSync(entryDir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map((f) => basename(f, '.ts'));

const UNIX_EOL = "\n";
const UNIX_EOL_REGEX = new RegExp(UNIX_EOL, "g");

const targetDir = "dist";

function renderBanner(name) {
    const filePath = `${entryDir}/${name}.ts`;
    const source = readFileSync(filePath, 'utf8');
    const unparsedSourceRawHeaderLine = [];
    const sourceHeader = parseUserscriptHeader(filePath, source, unparsedSourceRawHeaderLine);

    const url = `https://github.com/Bludwarf/Userscripts/releases/latest/download/${name}.user.js`;
    return [
        "// ==UserScript==",
        `// @name         ${sourceHeader.name || name}`,
        "// @namespace    https://github.com/Bludwarf/Userscripts",
        `// @version      ${globalVersion}`,
        `// @description  ${sourceHeader.description}`,
        `// @icon         ${sourceHeader.icon}`,
        ...(sourceHeader.grant || []).map(grant => `// @grant        ${grant}`),
        "// @author       bludwarf@gmail.com",
        ...sourceHeader.match.map(match => `// @match        ${match}`),
        `// @updateURL    ${url}`,
        `// @downloadURL  ${url}`,
        ...unparsedSourceRawHeaderLine,
        "// ==/UserScript==",
    ].join(EOL);
}

/**
 * @typedef PluginWithReport
 * @extends Plugin
 * @property report()
 */
/**
 * @param {string} entryDir
 * @param {string} name
 * @param {Partial<BuildOptions>?} options
 * @return {BuildOptions}
 */
function buildOptions(entryDir, name, options = {}): Partial<BuildOptions> {
    // noinspection JSValidateTypes : on envoie bien un objet qui est supporté par esbuild
    return {
        entryPoints: [`${entryDir}/${name}.ts`],
        outfile: `${targetDir}/${name}.user.js`,
        bundle: true,
        format: 'iife',
        target: 'es2020',
        banner: {
            js: renderBanner(name),
        },
        write: false, // Nécessaire pour que les plugins accèdent à result.outputFiles
        plugins: [
            autoGrantPlugin({
                headerRegex: HEADER_REGEX,
                eolRegex: ANY_EOL_REGEX,
                headerLineRegex: HEADER_LINE_REGEX,
                addToSummary
            }),
            ...(EOL !== UNIX_EOL ? [systemLineEndingPlugin({
                anyEOLRegex: ANY_EOL_REGEX,
                unixEOL: UNIX_EOL,
                unixEOLRegex: UNIX_EOL_REGEX,
                addToSummary,
            })] : []),
            skipIfUnchangedPlugin({
                mode: 'remote',
                ignorePrefix: /^\/\/\s+@version.+/,
                addToSummary,
            }),
            summaryPlugin(),
        ],
        ...options,
    }
}

async function buildAll() {
    for (const name of entries) {
        // noinspection JSCheckFunctionSignatures : cf. buildOptions
        await esbuild.build(buildOptions(entryDir, name, {
            minify: false,
            sourcemap: false, // pas utile pour un fichier standalone final
        }));
    }
    console.log();
    console.log(chalk.green(`✅  Build réussi !`));
}

const isWatch = process.argv.includes('--watch');

async function main() {
    if (isWatch) {
        // noinspection JSCheckFunctionSignatures : cf. buildOptions
        const contexts = await Promise.all(
            entries.map((name) =>
                esbuild.context(buildOptions(entryDir, name))
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
