module.exports = {
    preset: "ts-jest",
    coverageReporters: [
        "html", // Pour GitLab Pages
        "text", // Pour plus de détails dans les logs du job dans GitLab CI
        "text-summary", // Pour l'attribut "coverage" du job GitLab CI "test"
        "cobertura", // Pour afficher la couverture du code modifié dans la Merge Request GitLab
    ],
    reporters: [
        "default", // Pour suivre l'exécution des tests dans les logs
        "jest-junit", // Pour avoir le rapport des tests dans la Merge Request GitLab
    ]
}
