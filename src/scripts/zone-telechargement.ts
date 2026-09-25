// ==UserScript==
// @description  Ajoute la liste des fichiers déjà téléchargés
// @match        https://www.zone-telechargement.press/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zone-telechargement.press
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

function getH1() {
    const h1List = document.getElementsByTagName('h1');
    if (h1List.length === 0) {
        throw new Error('Aucun titre trouvé');
    }
    return h1List[0];
}

export function getTitle(h1 = getH1()) {
    return h1.textContent;
}

function lowerAndSplit(filename) {
    return filename
        // TODO "Vaiana, la légende du bout du monde" (actuel => "gende") : il faudrait ignorer les accents
        .toLowerCase()
        .replace(/-/g, '')
        .split(/[^A-Za-z]/)
        .filter(part => !!part)
        .filter(part => part.length > 3)
        ;
}

function match(title, downloadedFile: string) {
    const titleParts = lowerAndSplit(title);
    let downloadedFileName = downloadedFile.substring(downloadedFile.lastIndexOf('/'))
    downloadedFileName = downloadedFileName.substring(0, downloadedFileName.lastIndexOf('.'))
    const downloadedFileParts = lowerAndSplit(downloadedFileName);
    console.log('downloadedFileParts', downloadedFileParts);
    return downloadedFileParts.some(downloadedFilePart =>
        titleParts.some(titlePart => titlePart === downloadedFilePart), // TODO renvoyer de l'HTML avec les mots clés qui matchent surlignés en jaune
    );
}

/**
 * @param {string} downloadedFilesRawList
 * @return {string[]}
 */
export function parseDownloadFiles(downloadedFilesRawList) {
    // JSON.parse() ne semble pas disponible sur le site
    return (eval(downloadedFilesRawList) as string[]) // TODO sécu !?
        .map(item => item.trim())
        .filter(item => !!item);
}

export function matchDownloadedFiles(title, downloadedFiles) {
    return downloadedFiles.filter(downloadedFile => match(title, downloadedFile));
}

export function insertMatchingList(downloadedFiles) {
    const h1 = getH1();

    const title = getTitle();
    console.log(`Titre de la page courante : ${title}`, lowerAndSplit(title));
    console.log(`Fichiers déjà téléchargés`, downloadedFiles);
    const matchingDownloadedFiles = matchDownloadedFiles(title, downloadedFiles)
    console.log(`Fichiers déjà téléchargés correspondant au titre`, matchingDownloadedFiles);

    // TODO en plus du titre, on devrait aussi matcher sur le titre original, si existant (exemple "Projet dernière chance" : "Titre original : Project Hail Mary")

    const matchingDownloadedFilesHtml = matchingDownloadedFiles.map(file => `<li>${file}</li>`).join('\n');
    const listHtml = matchingDownloadedFilesHtml ? `<h2>Déjà téléchargé :</h2><ul>${matchingDownloadedFilesHtml}</ul>` : `<h2>Pas déjà téléchargé</h2>`;

    const existingDiv = document.getElementById('userscript');
    if (existingDiv) {
        existingDiv.innerHTML = listHtml;
    } else {
        h1.insertAdjacentHTML("afterend", `<div id="userscript">${listHtml}</div>`);
    }
}

export function insertButton() {
    const h1 = getH1();

    h1.insertAdjacentHTML('afterend', '<button id="import-paths-btn">Importer la liste de fichiers</button>');
    document.getElementById('import-paths-btn')?.addEventListener('click', () => {
        const downloadedFilesRawList = window.prompt('Colle la liste des chemins de fichiers au format JSON :');
        if (downloadedFilesRawList !== null) {
            const downloadedFiles = parseDownloadFiles(downloadedFilesRawList);
            insertMatchingList(downloadedFiles);
            GM_setValue('downloadedFilesRawList', downloadedFilesRawList);
        }
    });
}

// Auto-exécution uniquement en environnement réel (navigateur/Tampermonkey)
// `module` n'existe pas dans le bundle IIFE final, mais existe sous Jest (CommonJS)
if (typeof module === 'undefined') {
    const downloadedFilesRawList = GM_getValue('downloadedFilesRawList');

    insertButton();

    if (downloadedFilesRawList) {
        const downloadedFiles = parseDownloadFiles(downloadedFilesRawList);
        insertMatchingList(downloadedFiles);
    }

}
