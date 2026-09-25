// ==UserScript==
// @description  Ajoute la liste des fichiers déjà téléchargés
// @match        https://www.zone-telechargement.press/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zone-telechargement.press
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

import {getOrPromptString} from "../lib/window-utils";

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
        .toLowerCase()
        .split(/[^A-Za-z]/).filter(part => !!part);
}

function match(title, downloadedFile) {
    const titleParts = lowerAndSplit(title);
    let downloadedFileName = downloadedFile.substring(downloadedFile.lastIndexOf('\\'))
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
    return downloadedFilesRawList
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(item => !!item);
}

export function matchDownloadedFiles(title, downloadedFiles) {
    return downloadedFiles.filter(downloadedFile => match(title, downloadedFile));
}

export function insertMatchingList(downloadedFiles) {
    const h1 = getH1();

    const title = getTitle();
    console.log(`Titre de la page courante : ${title}`);
    console.log(`Fichiers déjà téléchargés`, downloadedFiles);
    const matchingDownloadedFiles = matchDownloadedFiles(title, downloadedFiles)
    console.log(`Fichiers déjà téléchargés correspondant au titre`, matchingDownloadedFiles);

    const matchingDownloadedFilesHtml = matchingDownloadedFiles.map(file => `<li>${file}</li>`).join('\n');
    const listHtml = matchingDownloadedFilesHtml ? `<h2>Déjà téléchargé :</h2><ul>${matchingDownloadedFilesHtml}</ul>` : `<h2>Pas déjà téléchargé</h2>`;
    h1.insertAdjacentHTML("afterend", `<div id="userscript">${listHtml}</div>`);
}

// Auto-exécution uniquement en environnement réel (navigateur/Tampermonkey)
// `module` n'existe pas dans le bundle IIFE final, mais existe sous Jest (CommonJS)
if (typeof module === 'undefined') {
    // TODO FIXME ce n'est pas suffisant : quand on fait un prompt, les sauts de ligne disparaissent
    const downloadedFilesRawList = getOrPromptString('downloadedFilesRawList', `Liste des fichiers déjà téléchargés`, () => new Error(`Liste vide`));
    const downloadedFiles = parseDownloadFiles(downloadedFilesRawList);
    insertMatchingList(downloadedFiles);
}
