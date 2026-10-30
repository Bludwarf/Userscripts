export const HEADER_REGEX = /\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/;
export const ANY_EOL_REGEX = /\r?\n/g;
export const HEADER_LINE_REGEX = /\/\/ @(\S+)\s+(.+)/;

const arrayHeaderKeys = ["match", "grant"] as const;
type ArrayHeaderKey = typeof arrayHeaderKeys[number];

/**
 * Type guard : vérifie si une clé de header correspond à une valeur de type tableau
 */
function isArrayHeaderKey(key: string): key is ArrayHeaderKey {
    return (arrayHeaderKeys as readonly string[]).includes(key);
}

/**
 * @param filePath chemin vers le fichier source
 * @param source contenu du fichier source
 * @param unparsedSourceRawHeaderLine passer une variable contenant un tableau de chaîne, pour récupérer les lignes non parsées
 */
export function parseUserscriptHeader(filePath: string, source: string, unparsedSourceRawHeaderLine?: string[]): Header {
    const match = source.match(HEADER_REGEX);
    if (!match) {
        throw new Error(`Aucun header de Userscript trouvé dans le fichier ${filePath}`);
    }
    const sourceRawHeader = match[0];
    const sourceHeader: Partial<Header> = {};
    const parsedHeaderKeys: Array<keyof Header> = [
        "name",
        "description",
        "icon",
        "author",
        "grant",
        "match",
    ];

    sourceRawHeader.split(ANY_EOL_REGEX).slice(1, -1).forEach(sourceRawHeaderLine => {
        const lineMatch = sourceRawHeaderLine.match(HEADER_LINE_REGEX);
        if (!lineMatch) {
            throw new Error(`Ligne de header de Userscript non reconnue : ${sourceRawHeaderLine}`);
        }
        const [_, key, value] = lineMatch as [string, keyof Header, string];

        if (isArrayHeaderKey(key)) {
            if (!sourceHeader[key]) {
                sourceHeader[key] = [];
            }
            sourceHeader[key]!.push(value);
        } else {
            sourceHeader[key] = value;
            if (unparsedSourceRawHeaderLine && !parsedHeaderKeys.includes(key)) {
                unparsedSourceRawHeaderLine.push(sourceRawHeaderLine);
            }
        }
    });

    return sourceHeader as Header;
}

/**
 * En-tête de script utilisateur
 * @see https://www.tampermonkey.net/documentation.php?locale=fr
 */
export interface Header {
    /** optionnel : le nom du script, sans extension, par défaut */
    name?: string;
    description: string;
    icon?: string;
    author?: string;
    /** optionnels : ajoutés automatiquement par le plugin "auto-grant" */
    grant?: string[]
    match: string[];
    updateURL?: string;
    downloadURL?: string;
}
