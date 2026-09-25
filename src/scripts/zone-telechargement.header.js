/** @type Header */
module.exports = {
    description: "Ajoute la liste des fichiers déjà téléchargés",
    match: ["https://www.zone-telechargement.press/*"],
    icon: "https://www.google.com/s2/favicons?sz=64&domain=zone-telechargement.press",
    grant: [
        "GM_getValue",
        "GM_setValue",
    ]
}
