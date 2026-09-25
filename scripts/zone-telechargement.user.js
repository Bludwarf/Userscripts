// ==UserScript==
// @name         Liste pour Zone Telechargement
// @namespace    http://tampermonkey.net/
// @version      2026-09-25
// @description  Ajoute la liste des fichiers déjà téléchargés
// @author       You
// @match        https://www.zone-telechargement.press/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zone-telechargement.press
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    function getH1() {
        const h1List = document.getElementsByTagName('h1');
        if (h1List.length === 0) {
            throw new Error('Aucun titre trouvé');
        }
        return h1List[0];
    }

    // TODO faire une lib modulaire (avec TypeScript et pas d'import en live comme avec les UserScript DSN)
    /**
     * @param {string} name
     * @param {string} message
     * @param {() => Error} errorProvider
     * @return {unknown|string}
     */
    function getOrPrompt(name, message, errorProvider) {
        const storedValue = GM_getValue(name);
        if (storedValue) {
            return storedValue;
        }

        const value = prompt(message);
        if (!value) {
            throw errorProvider();
        }

        GM_setValue(name, value)
        return value;
    }

    function getTitle(h1 = getH1()) {
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
            titleParts.some(titlePart => titlePart === downloadedFilePart) // TODO renvoyer de l'HTML avec les mots clés qui matchent surlignés en jaune
        );
    }

    /**
     * @param {string} downloadedFilesRawList
     * @return {string[]}
     */
    function parseDownloadFiles(downloadedFilesRawList) {
        return downloadedFilesRawList
            .split(/\r?\n/)
            .map(item => item.trim())
            .filter(item => !!item);
    }

    function matchDownloadedFiles(title, downloadedFiles) {
        return downloadedFiles.filter(downloadedFile => match(title, downloadedFile));
    }

    function insertMatchingList(downloadedFiles) {
        const h1 = getH1();

        const title = getTitle();
        const matchingDownloadedFiles = matchDownloadedFiles(title, downloadedFiles)
        console.log("matchingDownloadedFiles", matchingDownloadedFiles);

        const matchingDownloadedFilesHtml = matchingDownloadedFiles.map(file => `<li>${file}</li>`).join('\n');
        const listHtml = matchingDownloadedFilesHtml ? `<h2>Déjà téléchargé :</h2><ul>${matchingDownloadedFilesHtml}</ul>` : `<h2>Pas déjà téléchargé</h2>`;
        h1.insertAdjacentHTML("afterend", `<div id="userscript">${listHtml}</div>`);
    }

    if (typeof module === 'undefined') {
        const downloadedFilesRawList = getOrPrompt('downloadedFilesRawList', `Liste des fichiers déjà téléchargés`, () => new Error(`Liste vide`));
        const downloadedFiles = parseDownloadFiles(downloadedFilesRawList);
        insertMatchingList(downloadedFiles);
    } else {
        module.exports = {getTitle, parseDownloadFiles, matchDownloadedFiles, insertMatchingList}; // Exports pour les tests
    }

})();
