export let motsData = [
    { mot: "FILTRE", description: "Nom d'un live.", ordre: 1 },
    { mot: "SAM", description: "Nom du personnage principal (très simple ;) )", ordre: 2 },
    { mot: "LILOU", description: "Nom du personnage secondaire", ordre: 3 },
    { mot: "PRIXROMANFILE", description: "attribu prestigieux attribué à un roman", ordre: 4 },
    { mot: "DEVILFILTERMAKER", description: "Nom de \"l'antagoniste\"", ordre: 5 },
    { mot: "FLORENCEHINCKEL", description: "l'autrice", ordre: 6 },
    { mot: "NATHAN", description: "editeur", ordre: 7 }
];

let motIndex = 0;
let ordreAleatoire = false;

export function normaliserOrdreMots() {
    // ...existing code from normaliserOrdreMots()...
    let maxOrdre = 0;
    motsData.forEach(m => { if (typeof m.ordre === "number") maxOrdre = Math.max(maxOrdre, m.ordre); });
    let nextOrdre = maxOrdre + 1;
    motsData.forEach((m, i) => {
        if (typeof m.ordre !== "number" || isNaN(m.ordre)) {
            m.ordre = nextOrdre++;
        }
    });
    const ordres = new Set();
    let needRenumber = false;
    motsData.forEach(m => {
        if (ordres.has(m.ordre)) needRenumber = true;
        ordres.add(m.ordre);
    });
    if (needRenumber) {
        motsData.forEach((m, i) => { m.ordre = i + 1; });
    }
}

export function choisirMot() {
    // ...existing code from choisirMot()...
    normaliserOrdreMots();
    if (!motsData.length) {
        document.getElementById("mot-secret").textContent = "Aucun mot disponible.";
        return;
    }
    let choix;
    if (ordreAleatoire) {
        choix = motsData[Math.floor(Math.random() * motsData.length)];
    } else {
        const sorted = [...motsData].sort((a, b) => (a.ordre ?? 9999) - (b.ordre ?? 9999));
        choix = sorted[motIndex % sorted.length];
        motIndex++;
    }
    // ...le reste de la logique doit être déplacé dans ui.js pour la gestion d'état global...
}

export function ouvrirPanelGestionMots() {
    // ...existing code from ouvrirPanelGestionMots()...
}

export { motIndex, ordreAleatoire };
