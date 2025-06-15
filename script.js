// Import des modules (à placer en haut du fichier)
import { motsData, choisirMot, ouvrirPanelGestionMots, normaliserOrdreMots } from './mots.js';
import { reglagesScore, ouvrirPanelReglageScore, calculerBonusAide } from './score.js';
import { afficherMot, genererClavier, afficherAnimationVictoire, afficherAnimationDefaite } from './ui.js';
import { setupDebugPanel } from './debug.js';
import { saveMotsData, loadMotsData } from './storage.js';

let motSecret = "";
let descriptionMotSecret = "";
let lettresTrouvees = [];
let lettresJouees = [];
let essaisRestants = 7;
let jeuTermine = false;
let score = 0;
let scoreAide = 0; // Score d'aide
let lettresAide = 0; // Nombre de lettres trouvées grâce à l'aide

// Valeurs réglables pour le calcul du score
let reglagesScore = {
    bonus0: 0,      // Bonus ajouté à la victoire si 0% d'aide utilisée
    bonus50: -6,    // Bonus ajouté à la victoire si 50% d'aide utilisée
    bonus100: -10,  // Bonus ajouté à la victoire si 100% d'aide utilisée
    malus0: 2,      // Malus ajouté à la défaite si 0% d'aide utilisée
    malus50: -7,    // Malus ajouté à la défaite si 50% d'aide utilisée
    malus100: -8,   // Malus ajouté à la défaite si 100% d'aide utilisée
    baseWin: 8,     // Score de base ajouté à la victoire (avant bonus)
    baseLose: -4,   // Score de base ajouté à la défaite (avant malus)
};

let motIndex = 0; // Index du mot courant pour le mode ordre
let ordreAleatoire = false; // false = ordre par défaut, true = aléatoire

function choisirMot() {
    normaliserOrdreMots();
    // Choisit un mot au hasard ou dans l'ordre et réinitialise l'état du jeu (sauf le score général)
    if (!motsData.length) {
        document.getElementById("mot-secret").textContent = "Aucun mot disponible.";
        return;
    }
    let choix;
    if (ordreAleatoire) {
        choix = motsData[Math.floor(Math.random() * motsData.length)];
    } else {
        // Trie par ordre avant de choisir dans l'ordre
        const sorted = [...motsData].sort((a, b) => (a.ordre ?? 9999) - (b.ordre ?? 9999));
        choix = sorted[motIndex % sorted.length];
        motIndex++;
    }
    motSecret = choix.mot;
    descriptionMotSecret = choix.description;
    lettresTrouvees = [];
    lettresJouees = [];
    essaisRestants = 7;
    jeuTermine = false;
    // score = 0; // Ne réinitialise plus le score ici pour garder le score global
    scoreAide = 0; // Réinitialise le score d'aide pour la partie
    lettresAide = 0; // Réinitialise le compteur de lettres trouvées avec l'aide
    majScore();
    majScoreAide();
    majPourcentageAide();
    document.getElementById("message").textContent = "";
    document.getElementById("rejouer").style.display = "none";
    // Affiche la description brève
    let descDiv = document.getElementById("description");
    if (!descDiv) {
        descDiv = document.createElement("div");
        descDiv.id = "description";
        descDiv.style.margin = "12px 0 8px 0";
        descDiv.style.fontStyle = "italic";
        descDiv.style.color = "#666";
        const motSecretDiv = document.getElementById("mot-secret");
        if (motSecretDiv) motSecretDiv.parentNode.insertBefore(descDiv, motSecretDiv);
    }
    descDiv.textContent = "\u00B0"; // Espace insécable pour garder la hauteur même cachée
    descDiv.style.display = "block";
    descDiv.style.visibility = "hidden"; // Cache le texte sans déplacer le reste

    // Ajoute le bouton pour afficher/masquer la description si pas déjà présent
    if (!document.getElementById("btn-description")) {
        const btnDesc = document.createElement("button");
        btnDesc.id = "btn-description";
        btnDesc.textContent = "Afficher la description";
        btnDesc.style.margin = "450px 0 0 0";
        btnDesc.style.background = "#f5f5f5";
        btnDesc.style.border = "2px solid #bbb";
        btnDesc.style.borderRadius = "10px";
        btnDesc.style.fontSize = "1.1em";
        btnDesc.style.padding = "10px 22px";
        btnDesc.style.cursor = "pointer";
        btnDesc.onmouseover = function() { btnDesc.style.background = "#ffe082"; };
        btnDesc.onmouseout = function() { btnDesc.style.background = "#f5f5f5"; };
        btnDesc.onclick = function() {
            if (descDiv.style.visibility === "hidden") {
                descDiv.textContent = descriptionMotSecret || "\u00A0";
                descDiv.style.visibility = "visible";
                btnDesc.textContent = "Masquer la description";
            } else {
                descDiv.style.visibility = "hidden";
                descDiv.textContent = "\u00A0";
                btnDesc.textContent = "Afficher la description";
            }
        };
        // Ajoute le bouton dans le panneau de gauche SOUS le bouton debug
        let leftPanel = document.getElementById("left-panel-debug");
        if (!leftPanel) {
            // Si le panneau n'existe pas encore, on le crée et on l'affiche tout de suite
            leftPanel = document.createElement("div");
            leftPanel.id = "left-panel-debug";
            leftPanel.style.position = "fixed";
            leftPanel.style.left = "24px";
            leftPanel.style.top = "120px";
            leftPanel.style.display = "flex";
            leftPanel.style.flexDirection = "column";
            leftPanel.style.gap = "18px";
            leftPanel.style.zIndex = "100";
            document.body.appendChild(leftPanel);
        }
        // Cherche le bouton debug pour l'insérer juste après
        const btnDebug = document.getElementById("toggle-debug-panel");
        if (btnDebug && leftPanel.contains(btnDebug)) {
            // Insère juste après le bouton debug
            if (btnDebug.nextSibling) {
                leftPanel.insertBefore(btnDesc, btnDebug.nextSibling);
            } else {
                leftPanel.appendChild(btnDesc);
            }
        } else {
            leftPanel.appendChild(btnDesc);
        }
        // S'assure que le panneau est visible si debug est visible
        leftPanel.style.display = "flex";
    } else {
        // Réinitialise le bouton si déjà présent
        const btnDesc = document.getElementById("btn-description");
        btnDesc.textContent = "Afficher la description";
        btnDesc.onclick = function() {
            if (descDiv.style.visibility === "hidden") {
                descDiv.textContent = descriptionMotSecret || "\u00A0";
                descDiv.style.visibility = "visible";
                btnDesc.textContent = "Masquer la description";
            } else {
                descDiv.style.visibility = "hidden";
                descDiv.textContent = "\u00A0";
                btnDesc.textContent = "Afficher la description";
            }
        };
    }
    afficherMot();
    dessinerPendu();
    genererClavier();
}

function majScore() {
    let scoreDiv = document.getElementById("score");
    if (!scoreDiv) {
        scoreDiv = document.createElement("div");
        scoreDiv.id = "score";
        scoreDiv.style.fontSize = "2em";
        scoreDiv.style.fontWeight = "bold";
        scoreDiv.style.color = "#1976d2";
        scoreDiv.style.margin = "18px auto 0 auto";
        scoreDiv.style.maxWidth = "700px";
        scoreDiv.style.textAlign = "center";
        // Place le score en haut de la page (avant le mot secret)
        const motSecretDiv = document.getElementById("mot-secret");
        if (motSecretDiv && motSecretDiv.parentNode) {
            motSecretDiv.parentNode.insertBefore(scoreDiv, motSecretDiv);
        } else {
            document.body.insertBefore(scoreDiv, document.body.firstChild);
        }
    }
    scoreDiv.textContent = "Score : " + score.toFixed(1);
}

function majScoreAide() {
    let aideDiv = document.getElementById("score-aide");
    if (!aideDiv) {
        aideDiv = document.createElement("div");
        aideDiv.id = "score-aide";
        aideDiv.style.fontSize = "1.5em";
        aideDiv.style.fontWeight = "bold";
        aideDiv.style.color = "#ff9800";
        aideDiv.style.margin = "0 0 8px 0";
        aideDiv.style.textAlign = "right";
        // Place au-dessus des essais restants
        const essaisDiv = document.getElementById("essais-restants");
        if (essaisDiv && essaisDiv.parentNode) {
            essaisDiv.parentNode.insertBefore(aideDiv, essaisDiv);
        } else {
            // Si essais-restants pas encore là, on l'ajoutera plus tard dans dessinerPendu
        }
    }
    aideDiv.textContent = "Score d'aide : " + scoreAide.toFixed(1);
    majPourcentageAide();
}

function majPourcentageAide() {
    let pourcDiv = document.getElementById("score-pourc-aide");
    if (!pourcDiv) {
        pourcDiv = document.createElement("div");
        pourcDiv.id = "score-pourc-aide";
        pourcDiv.style.fontSize = "1.1em";
        pourcDiv.style.fontWeight = "normal";
        pourcDiv.style.color = "#ffb300";
        pourcDiv.style.margin = "0 0 12px 0";
        pourcDiv.style.textAlign = "right";
        // Place juste après score-aide
        const aideDiv = document.getElementById("score-aide");
        if (aideDiv && aideDiv.parentNode) {
            if (aideDiv.nextSibling) {
                aideDiv.parentNode.insertBefore(pourcDiv, aideDiv.nextSibling);
            } else {
                aideDiv.parentNode.appendChild(pourcDiv);
            }
        }
    }
    let total = motSecret.length;
    let pourc = total > 0 ? (lettresAide / total) * 100 : 0;
    pourcDiv.textContent = "Pourcentage de lettres trouvées avec l'aide : " + pourc.toFixed(1) + "%";
}

function afficherMot() {
    const motAffiche = motSecret.split("").map(l => lettresTrouvees.includes(l) ? l : "_").join(" ");
    const motSecretDiv = document.getElementById("mot-secret");
    motSecretDiv.textContent = motAffiche;
    motSecretDiv.style.fontSize = "3em";
    motSecretDiv.style.letterSpacing = "0.35em";
    motSecretDiv.style.margin = "28px 0";
    motSecretDiv.style.fontWeight = "bold";
    motSecretDiv.style.fontFamily = "monospace";
    motSecretDiv.style.color = "#222";
}

function genererClavier() {
    const clavierDiv = document.getElementById("clavier");
    if (!clavierDiv) return; // Sécurité si l'élément n'existe pas
    clavierDiv.innerHTML = "";
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let lettre of alphabet) {
        const btn = document.createElement("button");
        btn.textContent = lettre;
        btn.disabled = lettresJouees.includes(lettre) || jeuTermine;
        btn.style.margin = "6px";
        btn.style.padding = "20px 25px";
        btn.style.fontSize = "1.5em";
        btn.style.borderRadius = "10px";
        btn.style.border = "2px solid #bbb";
        btn.style.background = btn.disabled ? "#eee" : "#fff";
        btn.style.cursor = btn.disabled ? "not-allowed" : "pointer";
        btn.onmouseover = function() {
            if (!btn.disabled) btn.style.background = "#ffe082";
        };
        btn.onmouseout = function() {
            btn.style.background = btn.disabled ? "#eee" : "#fff";
        };
        btn.onclick = () => verifierLettre(lettre);
        clavierDiv.appendChild(btn);
    }
}

function verifierLettre(lettre) {
    if (jeuTermine || lettresJouees.includes(lettre)) return;
    lettresJouees.push(lettre);
    if (motSecret.includes(lettre)) {
        if (!lettresTrouvees.includes(lettre)) {
            lettresTrouvees.push(lettre);
            score += 1; // +1 pour une bonne lettre
            majScore();
        }
    } else {
        essaisRestants--;
        score -= 1; // -1 pour une mauvaise lettre
        majScore();
    }
    afficherMot();
    dessinerPendu();
    genererClavier();
    verifierFin();
}

function dessinerPendu() {
    const penduDiv = document.getElementById("pendu-drawing");
    if (!penduDiv) return;
    const etapes = [
`    +-----------+
    |           |
                |
                |
                |
                |
                |
    =======================`,
`    +-----------+
    |           |
    O           |
                |
                |
                |
                |
    =======================`,
`    +-----------+
    |           |
    O           |
   /            |
                |
                |
                |
    =======================`,
`    +-----------+
    |           |
    O           |
   /|\\          |
                |
                |
                |
    =======================`,
`    +-----------+
    |           |
    O           |
   /|\\          |
   /            |
                |
                |
    =======================`,
`    +-----------+
    |           |
    O           |
   /|\\          |
   / \\          |
                |
                |
    =======================`,
`    +-----------+
    |           |
    O           |
   /|\\          |
   / \\          |
   _ _          |
  /   \\         |
    =======================`
    ];
    const erreurs = 7 - essaisRestants;
    penduDiv.innerHTML = `<pre style="text-align:left;display:inline-block;font-size:2.8em;line-height:1.1;background:#fffbe6;padding:32px 48px;border-radius:18px;box-shadow:0 2px 12px #0002;margin:0;min-height:320px;width:520px;">${etapes[Math.min(erreurs, etapes.length - 1)]}</pre>`;
    // Affiche le nombre d'essais restants en dehors de la boîte du pendu
    if (!document.getElementById("essais-restants")) {
        const essaisDiv = document.createElement("div");
        essaisDiv.id = "essais-restants";
        essaisDiv.style.marginTop = "24px";
        essaisDiv.style.fontSize = "2em";
        essaisDiv.style.color = "#333";
        essaisDiv.style.textAlign = "right";
        penduDiv.parentNode.insertBefore(essaisDiv, penduDiv.nextSibling);
    }
    document.getElementById("essais-restants").innerHTML = `Essais restants : <b>${essaisRestants}</b>`;
    majScoreAide(); // Met à jour l'affichage du score d'aide à chaque dessin
}

function afficherAnimationVictoire() {
    const penduDiv = document.getElementById("pendu-drawing");
    if (!penduDiv) return;
    // Animation : le pendu saute, fait la fête, puis salue (smiley à droite)
    const frames = [
`    +-----------+
    |           |
    O           |
   /|\\          |
   / \\          |
                |
                |
    =======================`,
`    +-----------+
    |           |
   \\O/          |
    |           |
   / \\          |
                |
                |
    =======================`,
`    +-----------+
    |           |
   \\O/          |
    |           |
   / \\          |
                |
                |
    =======================`,
`    +-----------+
    |           |
   \\O/          |
    |           |
   / \\          |
                |    ^_^
                |
    =======================`,
`    +-----------+
    |           |
   \\O/          |
    |           |
   / \\          |
                |   \\^_^/
                |
    =======================`,
`    +-----------+
    |           |
   \\O/          |
    |           |
   / \\          |
                |    ^_^
                |
    =======================`,
`    +-----------+
    |           |
   \\O           |
    |\\          |
   / \\          |
                |    ^_^
                |
    =======================`,
`    +-----------+
    |           |
    O/          |
   /|           |
   / \\          |
                |    ^_^
                |
    =======================`,
`    +-----------+
    |           |
   \\O/          |
    |           |
   / \\          |
                |    ^_^
                |
    =======================`
    ];
    let i = 0;
    function animate() {
        if (i < frames.length) {
            penduDiv.innerHTML = `<pre style="text-align:left;display:inline-block;font-size:2.8em;line-height:1.1;background:#fffbe6;padding:32px 48px;border-radius:18px;box-shadow:0 2px 12px #0002;margin:0;min-height:320px;width:520px;">${frames[i]}</pre>`;
            i++;
            setTimeout(animate, 220);
        }
    }
    animate();
}

function afficherAnimationDefaite() {
    const penduDiv = document.getElementById("pendu-drawing");
    if (!penduDiv) return;
    // Animation : la tête tombe, le corps se penche, puis "GAME OVER" avec effet de disparition et croix
    const frames = [
`    +-----------+
    |           |
    O           |
   /|\\          |
   / \\          |
                |
                |
    =======================`,
`    +-----------+
    |           |
   ( )          |
   /|\\          |
   / \\          |
                |
    O           |
    =======================`,
`    +-----------+
    |           |
                |
   /|\\          |
   / \\          |
                |
   ( )          |
    =======================`,
`    +-----------+
    |           |
                |
   /|           |
   / \\          |
                |
   ( )          |
    =======================`,
`    +-----------+
    |           |
                |
                |
   /            |
                |
   ( )          |
    =======================`,
`    +-----------+
    |           |
                |
                |
                |
                |
   GAME OVER    |
    =======================`,
`    +-----------+
    |           |
                |
                |
                |
                |
   GAME OVER    |
    =======================`,
`    +-----------+
    |           |
                |
                |
                |
                |
   X X X X X X  |
    =======================`,
`    +-----------+
    |           |
                |
                |
                |
                |
   GAME OVER    |
    =======================`
    ];
    let i = 0;
    function animate() {
        if (i < frames.length) {
            penduDiv.innerHTML = `<pre style="text-align:left;display:inline-block;font-size:2.8em;line-height:1.1;background:#fffbe6;padding:32px 48px;border-radius:18px;box-shadow:0 2px 12px #0002;margin:0;min-height:320px;width:520px;">${frames[i]}</pre>`;
            i++;
            setTimeout(animate, 300);
        }
    }
    animate();
}

function calculerBonusAide(pourc) {
    // Calcule le bonus/malus en fonction du pourcentage d'aide utilisée
    // Interpolation linéaire entre les valeurs réglables
    let bonus, malus;
    if (pourc <= 50) {
        // Entre 0% et 50% d'aide
        bonus = reglagesScore.bonus0 + (reglagesScore.bonus50 - reglagesScore.bonus0) * (pourc / 50);
        malus = reglagesScore.malus0 + (reglagesScore.malus50 - reglagesScore.malus0) * (pourc / 50);
    } else {
        // Entre 50% et 100% d'aide
        bonus = reglagesScore.bonus50 + (reglagesScore.bonus100 - reglagesScore.bonus50) * ((pourc - 50) / 50);
        malus = reglagesScore.malus50 + (reglagesScore.malus100 - reglagesScore.malus50) * ((pourc - 50) / 50);
    }
    // Clamp pour éviter de dépasser les bornes
    if (bonus < reglagesScore.bonus100) bonus = reglagesScore.bonus100;
    if (bonus > reglagesScore.bonus0) bonus = reglagesScore.bonus0;
    if (malus < reglagesScore.malus100) malus = reglagesScore.malus100;
    if (malus > reglagesScore.malus0) malus = reglagesScore.malus0;
    return { bonus: Math.round(bonus), malus: Math.round(malus) };
}

function verifierFin() {
    // Vérifie si la partie est gagnée ou perdue et applique le score de base + bonus/malus
    let total = motSecret.length;
    let pourc = total > 0 ? (lettresAide / total) * 100 : 0;
    let { bonus, malus } = calculerBonusAide(pourc);

    // Score avant bonus/malus (pour affichage)
    let scoreAvant = score;

    if (motSecret.split("").every(l => lettresTrouvees.includes(l))) {
        // Victoire
        score += reglagesScore.baseWin; // Ajoute le score de base victoire
        let scoreAvantBonus = score;
        score += bonus; // Ajoute le bonus/malus selon l'aide
        majScore();
        scoreAide = 0;
        lettresAide = 0;
        majScoreAide();
        majPourcentageAide();
        // Affiche le détail du score dans le message
        document.getElementById("message").textContent =
            "Bravo, tu as gagné ! (Score de base : " + reglagesScore.baseWin +
            ", Score avant bonus : " + scoreAvantBonus.toFixed(1) +
            ", Bonus : " + bonus + ")";
        jeuTermine = true;
        document.getElementById("rejouer").style.display = "inline-block";
        afficherAnimationVictoire();
    } else if (essaisRestants === 0) {
        // Défaite
        score += reglagesScore.baseLose; // Ajoute le score de base défaite
        let scoreAvantMalus = score;
        score += malus; // Ajoute le bonus/malus selon l'aide
        majScore();
        scoreAide = 0;
        lettresAide = 0;
        majScoreAide();
        majPourcentageAide();
        // Affiche le détail du score dans le message
        document.getElementById("message").textContent =
            "Perdu ! Le mot était : " + motSecret +
            " (Score de base : " + reglagesScore.baseLose +
            ", Score avant malus : " + scoreAvantMalus.toFixed(1) +
            ", Malus : " + malus + ")";
        jeuTermine = true;
        document.getElementById("rejouer").style.display = "inline-block";
        afficherAnimationDefaite();
    }
}

function afficherAide() {
    // Ne rien faire si la partie est terminée
    if (jeuTermine) return;
    // Affiche une lettre non trouvée au hasard
    const lettresRestantes = motSecret.split("").filter(l => !lettresTrouvees.includes(l));
    if (lettresRestantes.length === 0) return;
    const lettreAide = lettresRestantes[Math.floor(Math.random() * lettresRestantes.length)];
    if (!lettresTrouvees.includes(lettreAide)) {
        lettresTrouvees.push(lettreAide);
        if (!lettresJouees.includes(lettreAide)) {
            lettresJouees.push(lettreAide);
        }
        score -= 0.5; // Retiré : ne perds plus de point avec l'aide
        scoreAide += 0.5; // +0.5 au score d'aide
        lettresAide += 1; // +1 lettre trouvée grâce à l'aide
        majScore();
        majScoreAide();
        majPourcentageAide();
        afficherMot();
        dessinerPendu();
        genererClavier();
        verifierFin();
    }
}

window.addEventListener("DOMContentLoaded", function() {
    // Affiche un message d'attente pendant le chargement
    const motSecretDiv = document.getElementById("mot-secret");
    if (motSecretDiv) motSecretDiv.textContent = "Chargement des mots...";

    // Sécurité : ne rien faire si les éléments n'existent pas
    if (!document.getElementById("rejouer") || !document.getElementById("clavier") || !document.getElementById("pendu-drawing")) return;
    document.getElementById("rejouer").onclick = choisirMot;
    choisirMot();
    // Ajoute un bouton d'aide si pas déjà présent
    if (!document.getElementById("aide")) {
        const aideBtn = document.createElement("button");
        aideBtn.id = "aide";
        aideBtn.textContent = "Aide ?";
        aideBtn.style.margin = "10px";
        aideBtn.onclick = afficherAide;
        const clavierDiv = document.getElementById("clavier");
        if (clavierDiv) clavierDiv.parentNode.insertBefore(aideBtn, clavierDiv);
    }
    // Agrandit la description si elle existe
    const descDiv = document.getElementById("description");
    if (descDiv) {
        descDiv.style.background = "#f5f5f5";
        descDiv.style.padding = "16px 24px";
        descDiv.style.borderRadius = "12px";
        descDiv.style.fontSize = "1.7em";
        descDiv.style.marginBottom = "18px";
        descDiv.style.maxWidth = "700px";
        descDiv.style.marginLeft = "auto";
        descDiv.style.marginRight = "auto";
        descDiv.style.display = "block";
        descDiv.style.minHeight = "2.2em"; // Toujours une hauteur pour éviter le déplacement
        // Ajoute un espace insécable si la description est cachée
        if (descDiv.style.visibility === "hidden" || !descDiv.textContent) {
            descDiv.textContent = "\u00A0";
        }
    }
    // Agrandit le bouton "Aide"
    const aideBtn = document.getElementById("aide");
    if (aideBtn) {
        aideBtn.style.background = "#fffbe6";
        aideBtn.style.border = "2px solid #ffe082";
        aideBtn.style.borderRadius = "12px";
        aideBtn.style.fontSize = "1.5em";
        aideBtn.style.padding = "16px 32px";
        aideBtn.style.cursor = "pointer";
        aideBtn.onmouseover = function() { aideBtn.style.background = "#ffe082"; };
        aideBtn.onmouseout = function() { aideBtn.style.background = "#fffbe6"; };
    }
    // Agrandit le bouton "Rejouer"
    const rejouerBtn = document.getElementById("rejouer");
    if (rejouerBtn) {
        rejouerBtn.style.background = "#e3f2fd";
        rejouerBtn.style.border = "2px solid #90caf9";
        rejouerBtn.style.borderRadius = "12px";
        rejouerBtn.style.fontSize = "1.5em";
        rejouerBtn.style.padding = "16px 32px";
        rejouerBtn.style.cursor = "pointer";
        rejouerBtn.onmouseover = function() { rejouerBtn.style.background = "#90caf9"; };
        rejouerBtn.onmouseout = function() { rejouerBtn.style.background = "#e3f2fd"; };
    }
    // Ajoute les boutons "Erreur" et "Gagner" à gauche de l'écran si pas déjà présents
    if (!document.getElementById("btn-erreur")) {
        // Création du panneau latéral pour les boutons
        const leftPanel = document.createElement("div");
        leftPanel.id = "left-panel-debug";
        leftPanel.style.position = "fixed";
        leftPanel.style.left = "24px";
        leftPanel.style.top = "120px";
        leftPanel.style.display = "none";
        leftPanel.style.flexDirection = "column";
        leftPanel.style.gap = "18px";
        leftPanel.style.zIndex = "100";

        const btnErreur = document.createElement("button");
        btnErreur.id = "btn-erreur";
        btnErreur.textContent = "Simuler erreur";
        btnErreur.style.padding = "18px 22px";
        btnErreur.style.fontSize = "1.2em";
        btnErreur.style.borderRadius = "10px";
        btnErreur.style.background = "#ffe0e0";
        btnErreur.style.border = "2px solid #e57373";
        btnErreur.style.cursor = "pointer";
        btnErreur.onclick = function() {
            if (!jeuTermine && essaisRestants > 0) {
                essaisRestants--;
                dessinerPendu();
                genererClavier();
                verifierFin();
            }
        };

        const btnWin = document.createElement("button");
        btnWin.id = "btn-win";
        btnWin.textContent = "Gagner";
        btnWin.style.padding = "18px 22px";
        btnWin.style.fontSize = "1.2em";
        btnWin.style.borderRadius = "10px";
        btnWin.style.background = "#e0ffe0";
        btnWin.style.border = "2px solid #81c784";
        btnWin.style.cursor = "pointer";
        btnWin.onclick = function() {
            if (!jeuTermine) {
                motSecret.split("").forEach(l => {
                    if (!lettresTrouvees.includes(l)) lettresTrouvees.push(l);
                });
                afficherMot();
                dessinerPendu();
                genererClavier();
                verifierFin();
            }
        };

        // Bouton pour réinitialiser le score
        const btnResetScore = document.createElement("button");
        btnResetScore.id = "btn-reset-score";
        btnResetScore.textContent = "Réinitialiser le score";
        btnResetScore.style.padding = "18px 22px";
        btnResetScore.style.fontSize = "1.2em";
        btnResetScore.style.borderRadius = "10px";
        btnResetScore.style.background = "#e3f2fd";
        btnResetScore.style.border = "2px solid #90caf9";
        btnResetScore.style.cursor = "pointer";
        btnResetScore.onclick = function() {
            if (confirm("Voulez-vous vraiment réinitialiser le score ?")) {
                score = 0;
                majScore();
            }
        };

        // Bouton pour basculer entre ordre et aléatoire
        const btnOrdre = document.createElement("button");
        btnOrdre.id = "btn-ordre";
        btnOrdre.textContent = "Aléatoire"; // Affiche le mode à activer au clic
        btnOrdre.style.padding = "18px 22px";
        btnOrdre.style.fontSize = "1.2em";
        btnOrdre.style.borderRadius = "10px";
        btnOrdre.style.background = "#fffde7";
        btnOrdre.style.border = "2px solid #ffe082";
        btnOrdre.style.cursor = "pointer";
        btnOrdre.onclick = function() {
            ordreAleatoire = !ordreAleatoire;
            btnOrdre.textContent = ordreAleatoire ? "Ordre" : "Aléatoire";
            motIndex = 0; // reset l'index si on repasse en mode ordre
        };

        // Nouveau bouton "Gestion" principal
        const btnGestion = document.createElement("div");
        btnGestion.style.position = "relative";
        btnGestion.style.display = "inline-block";

        const btnGestionMain = document.createElement("button");
        btnGestionMain.id = "btn-gestion-main";
        btnGestionMain.textContent = "Gestion";
        btnGestionMain.style.padding = "18px 22px";
        btnGestionMain.style.fontSize = "1.2em";
        btnGestionMain.style.borderRadius = "10px";
        btnGestionMain.style.background = "#ffd54f";
        btnGestionMain.style.border = "2px solid #bbb";
        btnGestionMain.style.cursor = "pointer";
        btnGestionMain.style.marginBottom = "8px";
        btnGestionMain.onmouseover = showGestionMenu;
        btnGestionMain.onmouseout = hideGestionMenuDelayed;

        // Sous-menu qui apparaît au survol
        const gestionMenu = document.createElement("div");
        gestionMenu.id = "gestion-menu";
        gestionMenu.style.position = "absolute";
        gestionMenu.style.left = "110%";
        gestionMenu.style.top = "0";
        gestionMenu.style.display = "none";
        gestionMenu.style.flexDirection = "column";
        gestionMenu.style.gap = "8px";
        gestionMenu.style.background = "#fffde7";
        gestionMenu.style.border = "1px solid #bbb";
        gestionMenu.style.borderRadius = "10px";
        gestionMenu.style.boxShadow = "0 2px 8px #0002";
        gestionMenu.style.padding = "8px 0";
        gestionMenu.style.zIndex = "1000";
        gestionMenu.onmouseover = showGestionMenu;
        gestionMenu.onmouseout = hideGestionMenuDelayed;

        // Bouton "Réglages score"
        const btnReglageScore = document.createElement("button");
        btnReglageScore.id = "btn-reglage-score";
        btnReglageScore.textContent = "Réglages score";
        btnReglageScore.style.padding = "10px 22px";
        btnReglageScore.style.fontSize = "1em";
        btnReglageScore.style.borderRadius = "8px";
        btnReglageScore.style.background = "#fffde7";
        btnReglageScore.style.border = "1px solid #ffe082";
        btnReglageScore.style.cursor = "pointer";
        btnReglageScore.onclick = function(e) {
            e.stopPropagation();
            ouvrirPanelReglageScore();
            gestionMenu.style.display = "none";
        };

        // Bouton "Gestion mots"
        const btnOpenGestion = document.createElement("button");
        btnOpenGestion.id = "btn-open-gestion-mots";
        btnOpenGestion.textContent = "Gestion mots";
        btnOpenGestion.style.padding = "10px 22px";
        btnOpenGestion.style.fontSize = "1em";
        btnOpenGestion.style.borderRadius = "8px";
        btnOpenGestion.style.background = "#ffd54f";
        btnOpenGestion.style.border = "1px solid #bbb";
        btnOpenGestion.style.cursor = "pointer";
        btnOpenGestion.onclick = function(e) {
            e.stopPropagation();
            ouvrirPanelGestionMots();
            gestionMenu.style.display = "none";
        };

        gestionMenu.appendChild(btnReglageScore);
        gestionMenu.appendChild(btnOpenGestion);

        btnGestion.appendChild(btnGestionMain);
        btnGestion.appendChild(gestionMenu);

        // Gestion du survol pour afficher/cacher le menu
        let gestionMenuTimeout;
        function showGestionMenu() {
            clearTimeout(gestionMenuTimeout);
            gestionMenu.style.display = "flex";
        }
        function hideGestionMenuDelayed() {
            gestionMenuTimeout = setTimeout(() => {
                gestionMenu.style.display = "none";
            }, 250);
        }

        leftPanel.appendChild(btnGestion);

        // ...ajout des autres boutons...
        leftPanel.appendChild(btnErreur);
        leftPanel.appendChild(btnWin);
        leftPanel.appendChild(btnResetScore);
        leftPanel.appendChild(btnOrdre);

        document.body.appendChild(leftPanel);

        // Ajout du petit bouton flottant pour afficher/masquer le panneau
        if (!document.getElementById("toggle-debug-panel")) {
            const toggleBtn = document.createElement("button");
            toggleBtn.id = "toggle-debug-panel";
            toggleBtn.title = "Afficher les boutons de test";
            toggleBtn.textContent = "debug";
            toggleBtn.style.position = "fixed";
            toggleBtn.style.left = "10px";
            toggleBtn.style.top = "70px";
            toggleBtn.style.width = "56px";
            toggleBtn.style.height = "36px";
            toggleBtn.style.borderRadius = "18px";
            toggleBtn.style.background = "#eee";
            toggleBtn.style.border = "2px solid #bbb";
            toggleBtn.style.fontSize = "1.1em";
            toggleBtn.style.cursor = "pointer";
            toggleBtn.style.zIndex = "101";
            toggleBtn.style.boxShadow = "0 2px 8px #0002";
            toggleBtn.style.display = "flex";
            toggleBtn.style.alignItems = "center";
            toggleBtn.style.justifyContent = "center";
            toggleBtn.onmouseover = function() { toggleBtn.style.background = "#ffe082"; };
            toggleBtn.onmouseout = function() { toggleBtn.style.background = "#eee"; };
            toggleBtn.onclick = function() {
                leftPanel.style.display = leftPanel.style.display === "none" ? "flex" : "none";
            };
            document.body.appendChild(toggleBtn);
        }
    }

    // Supprime le bouton gestion mots flottant s'il existe déjà ailleurs (pour éviter doublon)
    const oldGestionBtn = document.getElementById("btn-open-gestion-mots");
    if (oldGestionBtn && oldGestionBtn.parentNode !== document.getElementById("gestion-menu")) {
        oldGestionBtn.parentNode.removeChild(oldGestionBtn);
    }
});

// Panneau flottant de réglages score
function ouvrirPanelReglageScore() {
    // Crée et affiche le panneau flottant pour régler les valeurs de score
    if (document.getElementById("panel-reglage-score")) {
        document.getElementById("panel-reglage-score").style.display = "block";
        return;
    }
    const panel = document.createElement("div");
    panel.id = "panel-reglage-score";
    panel.style.position = "fixed";
    panel.style.top = "80px";
    panel.style.left = "50%";
    panel.style.transform = "translateX(-50%)";
    panel.style.background = "#fffde7";
    panel.style.border = "2px solid #ffe082";
    panel.style.borderRadius = "16px";
    panel.style.padding = "28px 32px";
    panel.style.zIndex = "999";
    panel.style.boxShadow = "0 4px 24px #0003";
    panel.style.minWidth = "340px";
    panel.style.fontSize = "1.1em";

    // Ajoute les champs pour régler tous les paramètres de score
    panel.innerHTML = `
        <div style="font-weight:bold;font-size:1.3em;margin-bottom:18px;">Réglages du score (bonus/malus)</div>
        <label>Score de base victoire : <input id="input-baseWin" type="number" value="${reglagesScore.baseWin}" style="width:60px"></label><br>
        <label>Score de base défaite : <input id="input-baseLose" type="number" value="${reglagesScore.baseLose}" style="width:60px"></label><br>
        <label>Bonus victoire (0% aide): <input id="input-bonus0" type="number" value="${reglagesScore.bonus0}" style="width:60px"></label><br>
        <label>Bonus victoire (50% aide): <input id="input-bonus50" type="number" value="${reglagesScore.bonus50}" style="width:60px"></label><br>
        <label>Bonus victoire (100% aide): <input id="input-bonus100" type="number" value="${reglagesScore.bonus100}" style="width:60px"></label><br>
        <label>Malus défaite (0% aide): <input id="input-malus0" type="number" value="${reglagesScore.malus0}" style="width:60px"></label><br>
        <label>Malus défaite (50% aide): <input id="input-malus50" type="number" value="${reglagesScore.malus50}" style="width:60px"></label><br>
        <label>Malus défaite (100% aide): <input id="input-malus100" type="number" value="${reglagesScore.malus100}" style="width:60px"></label><br>
        <div style="margin-top:18px;display:flex;gap:12px;">
            <button id="btn-save-reglage-score" style="padding:8px 18px;border-radius:8px;background:#e0f2f1;border:1px solid #26a69a;cursor:pointer;">Enregistrer</button>
            <button id="btn-close-reglage-score" style="padding:8px 18px;border-radius:8px;background:#ffe0e0;border:1px solid #e57373;cursor:pointer;">Fermer</button>
        </div>
    `;

    document.body.appendChild(panel);

    // Ferme le panneau sans enregistrer
    document.getElementById("btn-close-reglage-score").onclick = function() {
        panel.style.display = "none";
    };

    // Enregistre les nouvelles valeurs dans reglagesScore
    document.getElementById("btn-save-reglage-score").onclick = function() {
        reglagesScore.baseWin = parseInt(document.getElementById("input-baseWin").value, 10);
        reglagesScore.baseLose = parseInt(document.getElementById("input-baseLose").value, 10);
        reglagesScore.bonus0 = parseInt(document.getElementById("input-bonus0").value, 10);
        reglagesScore.bonus50 = parseInt(document.getElementById("input-bonus50").value, 10);
        reglagesScore.bonus100 = parseInt(document.getElementById("input-bonus100").value, 10);
        reglagesScore.malus0 = parseInt(document.getElementById("input-malus0").value, 10);
        reglagesScore.malus50 = parseInt(document.getElementById("input-malus50").value, 10);
        reglagesScore.malus100 = parseInt(document.getElementById("input-malus100").value, 10);
        panel.style.display = "none";
    };
}

// Remplace la fonction ouvrirPanelGestionMots par une version complète et fonctionnelle :
function ouvrirPanelGestionMots() {
    normaliserOrdreMots();
    let panel = document.getElementById("panel-gestion-mots");
    if (panel) {
        panel.style.display = "block";
        if (typeof loadMotsData === "function") loadMotsData();
        afficherListeMotsGestion();
        setTimeout(() => {
            const inputMot = document.getElementById("mot-gestion-mot");
            if (inputMot) inputMot.focus();
        }, 100);
        return;
    }
    panel = document.createElement("div");
    panel.id = "panel-gestion-mots";
    panel.style.position = "fixed";
    panel.style.top = "80px";
    panel.style.left = "50%";
    panel.style.transform = "translateX(-50%)";
    panel.style.background = "#fffde7";
    panel.style.border = "2px solid #ffe082";
    panel.style.borderRadius = "16px";
    panel.style.padding = "28px 32px";
    panel.style.zIndex = "999";
    panel.style.boxShadow = "0 4px 24px #0003";
    panel.style.minWidth = "400px";
    panel.style.fontSize = "1.1em";
    panel.style.maxHeight = "80vh";
    panel.style.overflowY = "auto";

    panel.innerHTML = `
        <div style="font-weight:bold;font-size:1.3em;margin-bottom:18px;">Gestion des mots</div>
        <div style="display:flex;gap:10px;margin-bottom:10px;">
            <button id="btn-export-mots" style="padding:6px 14px;border-radius:8px;background:#e0f2f1;border:1px solid #26a69a;cursor:pointer;">Exporter .TXT</button>
            <button id="btn-import-mots" style="padding:6px 14px;border-radius:8px;background:#fffde7;border:1px solid #ffe082;cursor:pointer;">Importer .TXT</button>
            <input type="file" id="input-import-mots" accept=".txt" style="display:none;">
        </div>
        <div id="gestion-mots-list"></div>
        <hr style="margin:18px 0;">
        <div style="font-weight:bold;margin-bottom:8px;">Ajouter / Modifier un mot</div>
        <form id="form-mot-gestion">
            <input id="mot-gestion-mot" type="text" placeholder="Mot" style="width:120px;margin-right:8px;" maxlength="32" required>
            <input id="mot-gestion-desc" type="text" placeholder="Description" style="width:180px;margin-right:8px;" maxlength="64">
            
            <button type="submit" style="padding:6px 18px;border-radius:8px;background:#e0f2f1;border:1px solid #26a69a;cursor:pointer;">Enregistrer</button>
            <button type="button" id="btn-annuler-mot" style="padding:6px 18px;border-radius:8px;background:#ffe0e0;border:1px solid #e57373;cursor:pointer;">Annuler</button>
        </form>
        <button id="btn-fermer-gestion-mots" style="margin-top:18px;padding:8px 18px;border-radius:8px;background:#ffe0e0;border:1px solid #e57373;cursor:pointer;">Fermer</button>
    `;
    document.body.appendChild(panel);

    document.getElementById("btn-fermer-gestion-mots").onclick = function() {
        panel.style.display = "none";
    };

    document.getElementById("btn-annuler-mot").onclick = function(e) {
        e.preventDefault();
        document.getElementById("mot-gestion-mot").value = "";
        document.getElementById("mot-gestion-desc").value = "";

        document.getElementById("mot-gestion-mot").disabled = false;
    };

    document.getElementById("form-mot-gestion").onsubmit = function(e) {
        e.preventDefault();
        const mot = document.getElementById("mot-gestion-mot").value.trim().toUpperCase();
        const desc = document.getElementById("mot-gestion-desc").value.trim();

        if (!mot) return;
        // Vérifie si un autre mot a déjà ce numéro d'ordre
        const idx = motsData.findIndex(m => m.mot === mot);
        if (idx >= 0) {
            // Modification
            motsData[idx].description = desc;
            motsData[idx].ordre = ordre;
        } else {
            // Ajout
            motsData.push({ mot, description: desc });
        }
        // Si plusieurs mots ont le même ordre, renumérote pour éviter les doublons
        let ordres = {};
        motsData.forEach(m => {
            if (ordres[m.ordre]) {
                // Décale les suivants
                let newOrdre = m.ordre;
                while (ordres[newOrdre]) newOrdre++;
                m.ordre = newOrdre;
            }
            ordres[m.ordre] = true;
        });
        if (typeof saveMotsData === "function") saveMotsData();
        normaliserOrdreMots();
        afficherListeMotsGestion();
        document.getElementById("form-mot-gestion").reset();
        document.getElementById("mot-gestion-mot").disabled = false;
    };

    // Ajout export/import
    document.getElementById("btn-export-mots").onclick = function() {
        // Format: ORDRE;MOT;DESCRIPTION (une ligne par mot)
        const lignes = [...motsData]
            .sort((a, b) => (a.ordre ?? 9999) - (b.ordre ?? 9999))
            .map(m => `${m.ordre};${m.mot};${(m.description||"").replace(/[\r\n;]/g, " ")}`);
        const blob = new Blob([lignes.join("\n")], {type: "text/plain"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "mots_pendu.txt";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); }, 100);
    };

    document.getElementById("btn-import-mots").onclick = function() {
        document.getElementById("input-import-mots").click();
    };

    document.getElementById("input-import-mots").onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const txt = ev.target.result;
            const lignes = txt.split(/\r?\n/);
            let nouveaux = [];
            for (let ligne of lignes) {
                if (!ligne.trim()) continue;
                // ORDRE;MOT;DESCRIPTION
                const parts = ligne.split(";");
                if (parts.length < 2) continue;
                const ordre = parseInt(parts[0], 10);
                const mot = (parts[1] || "").trim().toUpperCase();
                const description = (parts[2] || "").trim();
                if (!mot || isNaN(ordre)) continue;
                nouveaux.push({ mot, description, ordre });
            }
            if (nouveaux.length) {
                if (confirm("Remplacer la liste actuelle par celle du fichier ? (OK = remplace, Annuler = ajoute)")) {
                    motsData.length = 0;
                }
                // Ajoute ou remplace
                for (let n of nouveaux) {
                    const idx = motsData.findIndex(m => m.mot === n.mot);
                    if (idx >= 0) {
                        motsData[idx] = n;
                    } else {
                        motsData.push(n);
                    }
                }
                normaliserOrdreMots();
                if (typeof saveMotsData === "function") saveMotsData();
                afficherListeMotsGestion();
            }
        };
        reader.readAsText(file);
        // Reset input pour permettre de réimporter le même fichier
        e.target.value = "";
    };

    afficherListeMotsGestion();
    setTimeout(() => {
        const inputMot = document.getElementById("mot-gestion-mot");
        if (inputMot) inputMot.focus();
    }, 100);
}

// Modifie la fonction d'affichage pour trier par ordre et afficher/modifier le numéro
function afficherListeMotsGestion() {
    normaliserOrdreMots();
    const listDiv = document.getElementById("gestion-mots-list");
    if (!listDiv) return;
    listDiv.innerHTML = "";
    // Trie par ordre croissant
    const sorted = [...motsData].sort((a, b) => (a.ordre ?? 9999) - (b.ordre ?? 9999));
    sorted.forEach((item, sortedIdx) => {
        const realIdx = motsData.findIndex(m => m.mot === item.mot);
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.marginBottom = "6px";
        // Flèches haut/bas
        let upDisabled = sortedIdx === 0 ? "opacity:0.3;pointer-events:none;" : "";
        let downDisabled = sortedIdx === sorted.length - 1 ? "opacity:0.3;pointer-events:none;" : "";
        div.innerHTML = `
            <span style="min-width:36px;text-align:right;font-weight:bold;font-size:1.2em;color:#1976d2;margin-right:8px;">${item.ordre}</span>
            <button data-up="${realIdx}" title="Monter" style="margin-right:2px;padding:2px 6px;border-radius:6px;background:#e3f2fd;border:1px solid #90caf9;cursor:pointer;${upDisabled}">▲</button>
            <button data-down="${realIdx}" title="Descendre" style="margin-right:8px;padding:2px 6px;border-radius:6px;background:#e3f2fd;border:1px solid #90caf9;cursor:pointer;${downDisabled}">▼</button>
            <span style="min-width:90px;font-weight:bold;">${item.mot}</span>
            <span style="flex:1;margin-left:10px;color:#666;">${item.description || ""}</span>
            <button data-edit="${realIdx}" style="margin-left:10px;padding:2px 10px;border-radius:6px;background:#e3f2fd;border:1px solid #90caf9;cursor:pointer;">✏️</button>
            <button data-del="${realIdx}" style="margin-left:6px;padding:2px 10px;border-radius:6px;background:#ffe0e0;border:1px solid #e57373;cursor:pointer;">🗑️</button>
        `;
        listDiv.appendChild(div);
    });

    // Flèche haut
    listDiv.querySelectorAll("button[data-up]").forEach(btn => {
        btn.onclick = function() {
            const idx = parseInt(btn.getAttribute("data-up"), 10);
            // Trouve l'index dans le trié
            const sorted = [...motsData].sort((a, b) => (a.ordre ?? 9999) - (b.ordre ?? 9999));
            const pos = sorted.findIndex(m => m.mot === motsData[idx].mot);
            if (pos > 0) {
                // Échange les ordres avec le précédent
                const prev = sorted[pos - 1];
                const curr = sorted[pos];
                let tmp = prev.ordre;
                prev.ordre = curr.ordre;
                curr.ordre = tmp;
                if (typeof saveMotsData === "function") saveMotsData();
                afficherListeMotsGestion();
            }
        };
    });
    // Flèche bas
    listDiv.querySelectorAll("button[data-down]").forEach(btn => {
        btn.onclick = function() {
            const idx = parseInt(btn.getAttribute("data-down"), 10);
            const sorted = [...motsData].sort((a, b) => (a.ordre ?? 9999) - (b.ordre ?? 9999));
            const pos = sorted.findIndex(m => m.mot === motsData[idx].mot);
            if (pos < sorted.length - 1) {
                // Échange les ordres avec le suivant
                const next = sorted[pos + 1];
                const curr = sorted[pos];
                let tmp = next.ordre;
                next.ordre = curr.ordre;
                curr.ordre = tmp;
                if (typeof saveMotsData === "function") saveMotsData();
                afficherListeMotsGestion();
            }
        };
    });

    listDiv.querySelectorAll("button[data-edit]").forEach(btn => {
        btn.onclick = function() {
            const idx = parseInt(btn.getAttribute("data-edit"), 10);
            document.getElementById("mot-gestion-mot").value = motsData[idx].mot;
            document.getElementById("mot-gestion-desc").value = motsData[idx].description || "";

            document.getElementById("mot-gestion-mot").disabled = true;
        };
    });
    listDiv.querySelectorAll("button[data-del]").forEach(btn => {
        btn.onclick = function() {
            const idx = parseInt(btn.getAttribute("data-del"), 10);
            if (confirm("Supprimer le mot \"" + motsData[idx].mot + "\" ?")) {
                motsData.splice(idx, 1);
                if (typeof saveMotsData === "function") saveMotsData();
                normaliserOrdreMots();
                afficherListeMotsGestion();
            }
        };
    });
}

// Ajoute une fonction pour s'assurer que chaque mot a un numéro d'ordre unique et croissant
function normaliserOrdreMots() {
    // Si un mot n'a pas d'ordre, on lui en donne un à la suite
    let maxOrdre = 0;
    motsData.forEach(m => { if (typeof m.ordre === "number") maxOrdre = Math.max(maxOrdre, m.ordre); });
    let nextOrdre = maxOrdre + 1;
    motsData.forEach((m, i) => {
        if (typeof m.ordre !== "number" || isNaN(m.ordre)) {
            m.ordre = nextOrdre++;
        }
    });
    // Si doublons, on renumérote tout proprement
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

// Appelle la normalisation au chargement des mots personnalisés
function loadMotsData() {
    const val = getCookie && getCookie("motsData");
    if (val) {
        try {
            const arr = JSON.parse(val);
            if (Array.isArray(arr)) {
                motsData.length = 0;
                arr.forEach(obj => motsData.push(obj));
                normaliserOrdreMots();
            }
        } catch(e) {}
    }
    normaliserOrdreMots();
}

// Amélioration 1 : Séparation du code en modules/fichiers pour la lisibilité et la maintenance
// Voici une suggestion de découpage :

// 1. script.js (fichier principal, point d'entrée)
// 2. mots.js (gestion de la liste des mots, import/export, normalisation, gestion ordre, etc.)
// 3. score.js (calculs de score, réglages, panneau de réglages, etc.)
// 4. ui.js (affichage, génération du clavier, animations, gestion des panneaux, etc.)
// 5. debug.js (boutons et panneau debug, gestion du mode debug)
// 6. storage.js (sauvegarde/chargement localStorage/cookies)

// Exemple d'import (si vous utilisez des modules ES6) :
// import { motsData, choisirMot, ouvrirPanelGestionMots, normaliserOrdreMots } from './mots.js';
// import { reglagesScore, ouvrirPanelReglageScore, calculerBonusAide } from './score.js';
// import { afficherMot, genererClavier, afficherAnimationVictoire, afficherAnimationDefaite } from './ui.js';
// import { setupDebugPanel } from './debug.js';
// import { saveMotsData, loadMotsData } from './storage.js';

// Pour utiliser ce découpage, il faut :
// - Créer les fichiers correspondants (mots.js, score.js, ui.js, debug.js, storage.js)
// - Remplacer les fonctions globales par des exports/imports
// - Charger le script principal (script.js) en dernier dans votre HTML

// Avantages :
// - Code plus lisible, plus facile à maintenir
// - Possibilité de réutiliser ou tester chaque module séparément
// - Plus simple pour travailler à plusieurs sur le projet
// - Possibilité de réutiliser ou tester chaque module séparément
// - Plus simple pour travailler à plusieurs sur le projet
