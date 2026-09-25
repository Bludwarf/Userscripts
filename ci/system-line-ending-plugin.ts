import os from "os";
import chalk from "chalk";

const pluginName = 'systemLineEnding';

interface Options {
    anyEOLRegex: RegExp;
    unixEOL: string;
    unixEOLRegex: RegExp;
    addToSummary?: any;
}

/**
 * Converti les sauts de ligne des fichiers générés au format du système actuel.
 * esbuild génère uniquement des sauts de ligne Unix (\n).
 */
export function systemLineEndingPlugin({
                                           anyEOLRegex,
                                           unixEOL,
                                           unixEOLRegex,
                                           addToSummary,
                                       }: Options) {
    return {
        name: pluginName,
        setup(build) {
            build.onEnd(result => {
                if (!result.outputFiles) return;

                for (const file of result.outputFiles) {
                    const content = new TextDecoder().decode(file.contents);

                    // Même si la ligne suivante paraît bizarre, elle permet de générer les bons sauts de ligne sur Windows.
                    // Si on supprime le 1er "replace", les sauts de ligne sont doublés.
                    const withCRLF = content.replace(anyEOLRegex, unixEOL).replace(unixEOLRegex, os.EOL);

                    // On modifie directement les bytes en mémoire, pour que le plugin suivant (skipIfUnchanged)
                    // voie le contenu déjà converti
                    file.contents = new TextEncoder().encode(withCRLF);

                    addToSummary(result, file.path, chalk.cyan('↩️  CRLF'));
                }
            });
        },
    };
}
