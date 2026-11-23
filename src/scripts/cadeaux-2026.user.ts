// ==UserScript==
// @description  Organisation des cadeaux pour Noël 2026
// @match        https://www.zone-telechargement.press/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zone-telechargement.press
// ==/UserScript==

const TOUT_LE_MONDE: Personne[] = [];
const TOUS_LES_ADULTES: Adulte[] = [];

class Personne {
    compte: Compte;

    constructor(
        readonly nom: string
    ) {
        TOUT_LE_MONDE.push(this);
    }
}

class Adulte extends Personne {

    personnes: Personne[] = [];

    constructor(
        name: string
    ) {
        super(name)
        TOUS_LES_ADULTES.push(this);
    }

    offrePour(...personnes: Personne[]): void {
        this.personnes.push(...personnes);
    }
}

class Enfant extends Personne {
    constructor(
        name: string
    ) {
        super(name)
    }
}

const Boubou = new Enfant('Boubou');
const Gégé = new Adulte('Gégé');
const GoumGoumy = new Enfant('Goum-Goumy');
const Martin = new Adulte('Martin');
const Mathieu = new Adulte('Mathieu');
const Morgane = new Adulte('Morgane');
const Poupouch = new Enfant('Poupouch');
const Prisca = new Adulte('Prisca');
const Théo = new Adulte('Théo');

Gégé.offrePour(Morgane)
Martin.offrePour(Boubou, Poupouch, Prisca)
Mathieu.offrePour(GoumGoumy, Théo)
Morgane.offrePour(Gégé)
Prisca.offrePour(Martin)
Théo.offrePour(Mathieu)

class Compte {
    readonly titulaires: Personne[];

    constructor(...titulaires: Personne[]) {
        this.titulaires = titulaires;
        for (const titulaire of titulaires) {
            titulaire.compte = this;
        }
    }
}

new Compte(Gégé);
new Compte(Martin, Prisca);
new Compte(Mathieu, Théo);
new Compte(Morgane);

class Pot {
    readonly ajouts: AjoutAuPot[] = [];

    get somme(): number {
        return this.ajouts.reduce((somme, ajout) => somme + ajout.somme, 0)
    }
}

const POT = new Pot();

class AjoutAuPot {
    constructor(
        readonly source: Compte,
        readonly somme: number,
    ) {
        POT.ajouts.push(this);
    }
}

new AjoutAuPot(Gégé.compte, 100)
new AjoutAuPot(Martin.compte, 180)
new AjoutAuPot(Mathieu.compte, 250)
new AjoutAuPot(Morgane.compte, 80)

console.log(POT.somme)
const part = POT.somme / TOUT_LE_MONDE.length;
console.log(part);

for (const adulte of TOUS_LES_ADULTES) {
    const nomsDesPersonnes = adulte.personnes.map(personne => personne.nom)
    const nombreDePersonnes = nomsDesPersonnes.length;
    if (nombreDePersonnes === 0) {
        throw new Error(`${adulte.nom} offre pour personne`)
    }
    const somme = afficherSomme(nombreDePersonnes * part);
    console.log(`${adulte.nom} offre pour ${somme} de cadeau à ${nomsDesPersonnes.join(' et ')}`)
}

function afficherSomme(somme: number): string {
    return somme.toFixed(2).replace('.', ',') + ' €';
}
