import chalk from "chalk";

const GM_CALL_REGEX = /\bGM_[A-Za-z0-9_]+(?=\s*\()/g;

const pluginName = 'autoGrant';

/**
 * Détecte tous les appels GM_xxx(...) dans le code buildé et ajoute
 * automatiquement les lignes "// @grant GM_xxx" manquantes dans le header.
 *
 * @param {Object} options
 * @param {RegExp} options.headerRegex - Regex du bloc UserScript (ex: HEADER_REGEX)
 * @param {RegExp} options.eolRegex - Regex de découpage des lignes (ex: ANY_EOL_REGEX)
 * @param {RegExp} options.headerLineRegex - Regex de parsing d'une ligne @key (ex: HEADER_LINE_REGEX)
 * @param {AddToSummary} options.addToSummary
 * @param {(name: string) => string} [options.renderGrantLine] - Formatage de la ligne à insérer
 */
export function autoGrantPlugin({
                                    headerRegex,
                                    eolRegex,
                                    headerLineRegex,
                                    addToSummary,
                                    renderGrantLine = (name) => `// @grant        ${name}`,
                                }) {
    return {
        name: pluginName,
        setup(build) {
            build.onEnd((result) => {
                if (!result.outputFiles) return;

                for (const file of result.outputFiles) {
                    const content = new TextDecoder().decode(file.contents);

                    // 1. Détecte tous les appels GM_xxx(...)
                    const calls = new Set(content.match(GM_CALL_REGEX) || []);
                    if (calls.size === 0) continue;

                    // 2. Extrait le header UserScript existant
                    const headerMatch = content.match(headerRegex);
                    if (!headerMatch) continue;
                    const header = headerMatch[0];

                    // 3. Récupère les @grant déjà déclarés (réutilise headerLineRegex)
                    const existingGrants = new Set(
                        header
                            .split(eolRegex)
                            .map((line) => line.match(headerLineRegex))
                            .filter((m) => m && m[1] === 'grant')
                            .map((m) => m[2])
                    );

                    // 4. Calcule les grants manquants
                    const missingGrants = [...calls]
                        .filter((fn) => !existingGrants.has(fn))
                        .sort();
                    if (missingGrants.length === 0) continue;

                    // 5. Insère les nouvelles lignes juste avant la fermeture du header
                    const newLines = missingGrants.map(renderGrantLine).join('\n');
                    const updatedHeader = header.replace(
                        '// ==/UserScript==',
                        `${newLines}\n// ==/UserScript==`
                    );

                    const updatedContent = content.replace(header, updatedHeader);
                    file.contents = new TextEncoder().encode(updatedContent);

                    addToSummary(result, file.path, chalk.yellow(`🔐 grants ajoutés: ${missingGrants.join(', ')}`));
                }
            });
        },
    };
}
