/**
 * @jest-environment jsdom
 */
import {
    getTitle,
    insertMatchingList,
    matchDownloadedFiles,
    parseDownloadFiles,
} from "../../src/scripts/zone-telechargement";
import {loadPage} from "../utils/test-utils";
import stringComparison from "string-comparison";

function loadZTPage(page) {
    loadPage('zone-telechargement', page);
}

describe('Avatar : De feu et de cendres', () => {
    const page = "Avatar De feu et de cendres.htm";
    const title = 'Avatar : De feu et de cendres';

    test(`getTitle`, () => {
        loadZTPage(page);
        const title = getTitle();
        expect(title).toBe('Avatar : De feu et de cendres');
    });

    test('parseDownloadFiles', () => {
        const downloadedFilesRawList = `[
            "Films/Action/Mission.Impossible.3..avi",
            "Films/SF/Avatar/Avatar - MULTi HDLight 1080p TRUEFRENCH-Wawacity.Center.mkv",
            "Films/SF/Avatar/avatar2.mp4",
            "Films/SF/Avatar/Avatar.Fire.and.Ash.2025.MULTi.CA.1080p.WEB.H264-SUPPLY-Wawacity.pizza.mkv"
        ]`;
        expect(parseDownloadFiles(downloadedFilesRawList)).toEqual([
            `Films/Action/Mission.Impossible.3..avi`,
            `Films/SF/Avatar/Avatar - MULTi HDLight 1080p TRUEFRENCH-Wawacity.Center.mkv`,
            `Films/SF/Avatar/avatar2.mp4`,
            `Films/SF/Avatar/Avatar.Fire.and.Ash.2025.MULTi.CA.1080p.WEB.H264-SUPPLY-Wawacity.pizza.mkv`,
        ]);
    });

    describe('matchDownloadedFiles', () => {

        test(`Aucun match sur les dossiers`, () => {
            expect(matchDownloadedFiles(title, [
                `Films/Autres/Autre.film.mkv`,
                `Films/SF/Avatar/Avatar.Fire.and.Ash.mkv`,
            ])).toEqual([
                `Films/SF/Avatar/Avatar.Fire.and.Ash.mkv`,
            ]);
        });

        test(`Aucun match dans le nom`, () => {
            expect(matchDownloadedFiles(title, [
                `Films/SF/Avatar/Autre.film.mkv`,
                `Films/SF/Avatar/Avatar.Fire.and.Ash.mkv`,
            ])).toEqual([
                `Films/SF/Avatar/Avatar.Fire.and.Ash.mkv`,
            ]);
        });

        test(`Match sur "and"`, () => {
            expect(matchDownloadedFiles(title, [
                `Films/SF/Avatar/Avatar.Fire.and.Ash.mkv`
            ])).toEqual([
                `Films/SF/Avatar/Avatar.Fire.and.Ash.mkv`,
            ]);
        });

        test(`Match sur casse différente`, () => {
            expect(matchDownloadedFiles(title, [
                `Films/SF/Avatar/avatar.mp4`
            ])).toEqual([
                `Films/SF/Avatar/avatar.mp4`,
            ]);
        });

        test(`Match sur l'extension => ignoré`, () => {
            expect(matchDownloadedFiles(title, [
                `Films/SF/Avatar/Bludwarf.avatar`,
                `Films/SF/Avatar/Avatar.Fire.and.Ash.mkv`,
            ])).toEqual([
                `Films/SF/Avatar/Avatar.Fire.and.Ash.mkv`,
            ]);
        });

        test(`Matcher sur la fusion des mots entre tirets`, () => {
            expect(matchDownloadedFiles(`X-Men : Dark Phoenix`, [
                `Avatar.The.Way.Of.Water.2022.Multi.Truefrench.1080P.hdlight.Ddp.5.1.Atmos.X264-Wawacity.Tools.mkv`,
                `X-Men.mkv`,
            ])).toEqual([
                `X-Men.mkv`,
            ]);
        });

        // TODO à corriger
        // test(`Matcher sur des mots de plus de 3 lettres`, () => {
        //     expect(matchDownloadedFiles(`Vaiana, la légende du bout du monde`, [
        //         `Clips/Français/Barbara - L'aigle noir.avi`,
        //         'Vaina.mkv'
        //     ])).toEqual([
        //         'Vaina.mkv'
        //     ]);
        // });

    });

    describe('insertMatchingList', () => {

        // TODO se produira un jour ?
        // test(`Message si pas de match`, () => {
        //     loadZTPage(page);
        //     insertMatchingList([`Films/Autres/Autre.film.mkv`]);
        //     const userscriptElement = document.getElementById('userscript');
        //     console.log(document.getElementsByTagName("h2").length)
        //     expect(userscriptElement).toBeTruthy();
        //     expect(userscriptElement.textContent).toContain("Pas déjà téléchargé");
        // });

        test(`Message si match`, () => {
            loadZTPage(page);
            insertMatchingList([`Films/SF/Avatar/avatar.mp4`]);
            const userscriptElement = document.getElementById('userscript');
            console.log(document.getElementsByTagName("h2").length)
            expect(userscriptElement).toBeTruthy();
            expect(userscriptElement.textContent).toContain("Déjà téléchargé");
        });

        test('lib', () => {
            const cos = stringComparison.cosine
            console.log(cos.similarity(title, title))
            console.log(cos.distance(title, "Avatar2"))
            console.log(cos.distance(title, "avatar"))
            const sortMatch = cos.sortMatch(title, ["Avatar2", "avatar", "Avengers", "Malcolm", "etc"]);
            console.log(sortMatch)
            const ratingSum = sortMatch.reduce((pr, sm) => pr + sm.rating, 0);
            const ratingAverage = ratingSum / sortMatch.length;
            console.log(ratingAverage);
            const sortAboveAverageMatch = sortMatch
                .filter(m => m.rating >= ratingAverage)
                .map(m => m.member)
                .reverse();
            console.log(sortAboveAverageMatch);
        });
    });

});
