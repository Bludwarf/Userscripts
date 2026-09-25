import path from "path";
import {BuildResult} from "esbuild";

export type AddToSummary = (result: BuildResult, filePath: string, part: string) => void;

/**
 * @type {AddToSummary}
 */
export function addToSummary(result, filePath, part) {
    if (!result.plugins) {
        result.plugins = new Map();
    }
    if (!result.plugins.has(filePath)) {
        result.plugins.set(filePath, []);
    }
    result.plugins.get(filePath).push(part);
}

/**
 * Ajoute un champ "plugins" dans le résultat de build, pour que chaque plugin puisse y ajouter son propre résultat
 */
export function summaryPlugin() {
    return {
        name: 'summary',
        setup(build) {
            build.onEnd((result) => {
                if (result.plugins) {
                    for (const [filePath, parts] of result.plugins) {
                        const relPath = path.relative(process.cwd(), filePath);
                        console.log(`${relPath} : ${parts.join(' | ')}`);
                    }
                }
            });
        },
    };
}
