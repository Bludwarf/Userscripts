import {basename} from "node:path";
import {readdirSync, readFileSync} from "node:fs";
import {EOL} from "node:os";
import {autoGrantPlugin} from "./ci/auto-grant-plugin";
import {skipIfUnchangedPlugin} from "./ci/skip-if-unchanged-plugin";
import {systemLineEndingPlugin} from "./ci/system-line-ending-plugin";
import {addToSummary, printSummaryTable, summaryPlugin} from "./ci/summary-plugin";
import * as esbuild from "esbuild";
import {BuildOptions} from "esbuild";
import chalk from "chalk";
import {
    ANY_EOL_REGEX,
    Header,
    HEADER_LINE_REGEX,
    HEADER_REGEX,
    parseUserscriptHeader,
} from "./ci/userscript-header-parser";

const globalVersion = process.env.VERSION || new Date().toISOString().slice(0, 10).replace(/-/g, '.');

// Détection automatique des points d'entrée dans src/scripts/
const entryDir = 'src/scripts';
const userscriptExtension = '.user.ts';
const entries = readdirSync(entryDir)
    .filter((f) => f.endsWith(userscriptExtension) && !f.endsWith('.test.ts'))
    .map((f) => basename(f, userscriptExtension));

const UNIX_EOL = "\n";
const UNIX_EOL_REGEX = new RegExp(UNIX_EOL, "g");

const targetDir = "dist";

function renderBanner(name: string) {
    const filePath = `${entryDir}/${name}${userscriptExtension}`;
    const source = readFileSync(filePath, 'utf8');
    const unparsedSourceRawHeaderLine = [];
    const sourceHeader = parseUserscriptHeader(filePath, source, unparsedSourceRawHeaderLine);
    const defaultHeader: Partial<Header> = {
        name,
        author: `bludwarf@gmail.com`,
    };
    const mergedHeader: Header = Object.assign({}, defaultHeader, sourceHeader);

    const url = `https://github.com/Bludwarf/Userscripts/releases/latest/download/${name}.user.js`;
    return [
        "// ==UserScript==",
        `// @name         ${mergedHeader.name}`,
        "// @namespace    https://github.com/Bludwarf/Userscripts",
        `// @version      ${globalVersion}`,
        `// @description  ${sourceHeader.description}`,
        `// @icon         ${sourceHeader.icon}`,
        ...(sourceHeader.grant || []).map(grant => `// @grant        ${grant}`),
        `// @author       ${mergedHeader.author}`,
        ...sourceHeader.match.map(match => `// @match        ${match}`),
        `// @updateURL    ${url}`,
        `// @downloadURL  ${url}`,
        ...unparsedSourceRawHeaderLine,
        "// ==/UserScript==",
    ].join(EOL);
}

function buildOptions(entryDir: string, name: string, options: Partial<BuildOptions> | null = {}): Partial<BuildOptions> {
    // noinspection JSValidateTypes : on envoie bien un objet qui est supporté par esbuild
    return {
        entryPoints: [`${entryDir}/${name}${userscriptExtension}`],
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
                // addToSummary, // À décommenter pour DEBUG
            }),
            ...(EOL !== UNIX_EOL ? [systemLineEndingPlugin({
                anyEOLRegex: ANY_EOL_REGEX,
                unixEOL: UNIX_EOL,
                unixEOLRegex: UNIX_EOL_REGEX,
                // addToSummary, // À décommenter pour DEBUG
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
    printSummaryTable();
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
