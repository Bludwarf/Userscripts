// ==UserScript==
// @name         Liste pour Zone Telechargement
// @namespace    http://tampermonkey.net/
// @version      2026-09-24
// @description  try to take over the world!
// @author       You
// @match        https://www.zone-telechargement.press/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zone-telechargement.press
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const h1List = document.getElementsByTagName('h1');
    if (h1List.length === 0) {
        throw new Error('Aucun titre trouvé');
    }
    const h1 = h1List[0];
    const title = h1.textContent;
    console.log(title);

    function split(filename) {
        return filename.split(/[^A-Za-z]/).filter(part => !!part);
    }

    const titleParts = split(title);
    console.log(titleParts);

    const downloadedFiles = [
        `Films\\Action\\Mission.Impossible.3..avi`,
        `Films\\SF\\Avatar\\Avatar - MULTi HDLight 1080p TRUEFRENCH-Wawacity.Center.mkv`,
        `Films\\SF\\Avatar\\avatar2.mp4`,
        `Films\\SF\\Avatar\\Avatar.Fire.and.Ash.2025.MULTi.CA.1080p.WEB.H264-SUPPLY-Wawacity.pizza.mkv`,
    ];

    function match(downloadedFile) {
        const downloadedFileName = downloadedFile.substring(downloadedFile.lastIndexOf('\\')); // TODO getExt()
        const downloadedFileParts = split(downloadedFile);
        console.log('downloadedFileParts', downloadedFileParts);
        return downloadedFileParts.some(downloadedFilePart =>
            titleParts.some(titlePart => titlePart === downloadedFilePart) // TODO renvoyer de l'HTML avec les mots clés qui matchent surlignés en jaune
        );
    }

    const matchingDownloadedFiles = downloadedFiles.filter(downloadedFile => match(downloadedFile))

    const matchingDownloadedFilesHtml = matchingDownloadedFiles.map(file => `<li>${file}</li>`).join('\n');
    const listHtml = matchingDownloadedFilesHtml ? `<h2>Déjà téléchargé :</h2><ul>${matchingDownloadedFilesHtml}</ul>` : `<h2>Pas déjà téléchargé</h2>`;
    h1.insertAdjacentHTML("afterend", listHtml);

})();
