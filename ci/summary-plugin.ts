import path from "path";
import {BuildResult} from "esbuild";

export type AddToSummary = (result: BuildResult, filePath: string, part: string) => void;

export function addToSummary(result, filePath, part) {
    if (!result.plugins) {
        result.plugins = new Map();
    }
    if (!result.plugins.has(filePath)) {
        result.plugins.set(filePath, []);
    }
    result.plugins.get(filePath).push(part);
}

// Accumulateur global partagé entre tous les builds (clé = chemin relatif du fichier)
const globalRows = new Map<string, string[]>();

export function summaryPlugin() {
    return {
        name: 'summary',
        setup(build) {
            build.onEnd((result) => {
                if (!result.plugins) return;

                for (const [filePath, parts] of result.plugins) {
                    const relPath = path.relative(process.cwd(), filePath);
                    // Remplace la ligne existante au lieu de l'accumuler (utile en mode watch)
                    globalRows.set(relPath, [relPath, ...parts]);
                }
            });
        },
    };
}

export function printSummaryTable(clearConsole = false) {
    if (globalRows.size === 0) return;

    const rows = Array.from(globalRows.values());
    const columnCount = Math.max(...rows.map(row => row.length));
    const columnWidths: number[] = new Array(columnCount).fill(0);

    for (const row of rows) {
        for (let i = 0; i < columnCount; i++) {
            const cell = row[i] ?? '';
            columnWidths[i] = Math.max(columnWidths[i], cell.length);
        }
    }

    if (clearConsole) {
        // On efface les lignes précédemment affichées pour ne montrer que le tableau à jour
        console.clear();
    }

    console.log("Fichier(s) buildé(s) :");

    for (const row of rows) {
        const line = Array.from({length: columnCount}, (_, i) => {
            const cell = row[i] ?? '';
            return cell.padEnd(columnWidths[i]);
        }).join('  ');
        console.log(line.trimEnd());
    }
}
