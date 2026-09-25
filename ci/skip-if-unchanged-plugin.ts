import fs from "fs";
import path from "path";
import chalk from "chalk";
import { parseUserscriptHeader } from "./userscript-header-parser";
import { AddToSummary } from "./summary-plugin";

const pluginName = 'skip-if-unchanged';

type Mode = 'local' | 'remote';

type Status = 'unchanged' | 'modified' | 'created' | 'error';

interface Options {
    /** Mode de détection du contenu précédent : comparaison avec le fichier local, ou téléchargement via downloadURL/updateURL */
    mode: Mode;

    /** Préfixe des lignes à ignorer lors de la comparaison */
    ignorePrefix?: RegExp;

    addToSummary?: AddToSummary;
}

/**
 * Résultat de la lecture de l'ancien contenu (local ou distant).
 */
interface PreviousContentResult {
    content: string | null;
    /** true si l'absence de contenu est due à une 404 (ou fichier local inexistant) */
    notFound: boolean;
    /** true si une erreur autre que 404 est survenue (réseau, etc.) */
    hasError: boolean;
}

/**
 * Plugin esbuild : n'écrase pas l'ancien fichier si le nouveau contenu
 * est identique à l'ancien (en local, ou distant via downloadURL/updateURL),
 * à l'exception des lignes commençant par un préfixe donné.
 *
 * Nécessite de désactiver l'option "write" de "esbuild".
 */
export function skipIfUnchangedPlugin({
    mode,
    ignorePrefix,
    addToSummary,
}: Options) {
    if (mode !== 'local' && mode !== 'remote') {
        throw new Error(
            `[${pluginName}] Le paramètre "mode" est obligatoire et doit valoir "local" ou "remote" (reçu : ${JSON.stringify(mode)})`
        );
    }

    return {
        name: pluginName,
        setup(build) {
            build.onEnd(async result => {
                if (!result.outputFiles) return;

                for (const file of result.outputFiles) {
                    const newContent = new TextDecoder().decode(file.contents);

                    const previous = mode === 'local'
                        ? readLocalContent(file.path)
                        : await readRemoteContent(file.path, newContent);

                    let status: Status;

                    if (previous.hasError) {
                        status = 'error';
                    } else if (previous.notFound) {
                        status = 'created';
                    } else if (isContentEquivalent(previous.content!, newContent, ignorePrefix)) {
                        status = 'unchanged';
                    } else {
                        status = 'modified';
                    }

                    const shouldWrite = status !== 'unchanged';

                    if (shouldWrite) {
                        fs.mkdirSync(path.dirname(file.path), { recursive: true });
                        fs.writeFileSync(file.path, newContent, 'utf8');
                    }

                    addToSummary(result, file.path, report(status));
                }
            });
        },
    };
}

/**
 * Lit le contenu de l'ancien fichier local, s'il existe.
 */
function readLocalContent(filePath: string): PreviousContentResult {
    try {
        if (!fs.existsSync(filePath)) {
            return { content: null, notFound: true, hasError: false };
        }
        const content = fs.readFileSync(filePath, 'utf8');
        return { content, notFound: false, hasError: false };
    } catch (err) {
        console.warn(`⚠️  Erreur lors de la lecture locale de ${filePath}, le fichier sera écrit.`, err);
        return { content: null, notFound: false, hasError: true };
    }
}

/**
 * Télécharge le contenu distant depuis l'URL extraite du header (downloadURL/updateURL) du nouveau contenu.
 */
async function readRemoteContent(filePath: string, newContent: string): Promise<PreviousContentResult> {
    const newHeader = parseUserscriptHeader(filePath, newContent);
    const remoteUrl = newHeader?.downloadURL || newHeader?.updateURL;

    if (!remoteUrl) {
        console.warn(`⚠️  Aucune URL downloadURL/updateURL trouvée dans le header de ${filePath}, le fichier sera écrit.`);
        return { content: null, notFound: false, hasError: true };
    }

    try {
        const response = await fetch(remoteUrl);

        if (response.status === 404) {
            return { content: null, notFound: true, hasError: false };
        }

        if (!response.ok) {
            console.warn(`⚠️  Impossible de récupérer ${remoteUrl} (status ${response.status}), le fichier sera écrit.`);
            return { content: null, notFound: false, hasError: true };
        }

        const content = await response.text();
        return { content, notFound: false, hasError: false };
    } catch (err) {
        console.warn(`⚠️  Erreur réseau lors de la récupération de ${remoteUrl}, le fichier sera écrit.`, err);
        return { content: null, notFound: false, hasError: true };
    }
}

/**
 * Compare deux contenus en ignorant les lignes commençant par le préfixe donné.
 */
function isContentEquivalent(oldContent: string, newContent: string, ignorePrefix?: RegExp): boolean {
    const stripIgnoredLines = (content: string) =>
        content
            .split(/\r\n|\n/)
            .filter(line => !ignorePrefix || !line.match(ignorePrefix));

    const oldLines = stripIgnoredLines(oldContent);
    const newLines = stripIgnoredLines(newContent);

    if (oldLines.length !== newLines.length) return false;
    return oldLines.every((line, i) => line === newLines[i]);
}

function report(status: Status): string {
    switch (status) {
        case 'unchanged':
            return chalk.gray('⏭️  non modifié');
        case 'modified':
            return chalk.blue('📝 modifié');
        case 'created':
            return chalk.green('✨  créé');
        case 'error':
            return chalk.red('❌  recréé car erreur');
    }
}
