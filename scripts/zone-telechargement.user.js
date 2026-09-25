// ==UserScript==
// @name         Liste pour Zone Telechargement
// @namespace    http://tampermonkey.net/
// @version      2026-09-24
// @description  Ajoute la liste des fichiers déjà téléchargés
// @author       You
// @match        https://www.zone-telechargement.press/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zone-telechargement.press
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const downloadedFilesRawList = `
        Films\\Action\\Mission.Impossible.3..avi
        Films\\SF\\Avatar\\Avatar - MULTi HDLight 1080p TRUEFRENCH-Wawacity.Center.mkv
        Films\\SF\\Avatar\\avatar2.mp4
        Films\\SF\\Avatar\\Avatar.Fire.and.Ash.2025.MULTi.CA.1080p.WEB.H264-SUPPLY-Wawacity.pizza.mkv
        `;

    function getH1() {
        const h1List = document.getElementsByTagName('h1');
        if (h1List.length === 0) {
            throw new Error('Aucun titre trouvé');
        }
        return h1List[0];
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
        const downloadedFiles = parseDownloadFiles(downloadedFilesRawList);
        insertMatchingList(downloadedFiles);
    } else {
        module.exports = {getTitle, parseDownloadFiles, matchDownloadedFiles, insertMatchingList}; // Exports pour les tests
    }

})();
