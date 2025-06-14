const motsData = [
    { mot: "MACHINE", description: "machine complexe pour effectuer des tâches." },
    { mot: "JAVASCRIPT", description: "Langage de programmation du web." },
    { mot: "FROMAGE", description: "Aliment issu du lait." },
    { mot: "VOITURE", description: "Moyen de transport à quatre roues." },
    { mot: "CHOCOLAT", description: "Friandise à base de cacao." },
    { mot: "MONTAGNE", description: "Relief naturel élevé." },
    { mot: "PUZZLE", description: "Jeu où il faut assembler des pièces." }
];
let motSecret = "";
let descriptionMotSecret = "";
let lettresTrouvees = [];
let lettresJouees = [];
let essaisRestants = 7;
let jeuTermine = false;
let score = 0;
let scoreAide = 0; // Score d'aide
let lettresAide = 0; // Nombre de lettres trouvées grâce à l'aide

function choisirMot() {
    if (!motsData.length) {
        document.getElementById("mot-secret").textContent = "Aucun mot disponible.";
        return;
    }
    const choix = motsData[Math.floor(Math.random() * motsData.length)];
    motSecret = choix.mot;
    descriptionMotSecret = choix.description;
    lettresTrouvees = [];
    lettresJouees = [];
    essaisRestants = 7;
    jeuTermine = false;
    // score = 0; // Ne réinitialise plus le score ici
    scoreAide = 0; // Réinitialise le score d'aide
    lettresAide = 0; // Réinitialise le compteur d'aide
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
        btnDesc.style.margin = "10px 0 0 0";
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
                |    o/
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
    // pourc = 0 => +5 si gagne, -4 si perd
    // pourc = 50 => 0 si gagne, -7 si perd
    // pourc = 100 => -8 si gagne, -8 si perd
    // Interpolation linéaire
    let bonus, malus;
    if (pourc <= 50) {
        bonus = 5 - (pourc / 50) * 5; // de 5 à 0
        malus = -4 - (pourc / 50) * 3; // de -4 à -7
    } else {
        bonus = 0 - ((pourc - 50) / 50) * 8; // de 0 à -8
        malus = -7 - ((pourc - 50) / 50) * 1; // de -7 à -8
    }
    // Clamp les valeurs
    if (bonus < -8) bonus = -8;
    if (malus < -8) malus = -8;
    return { bonus: Math.round(bonus), malus: Math.round(malus) };
}

function verifierFin() {
    let total = motSecret.length;
    let pourc = total > 0 ? (lettresAide / total) * 100 : 0;
    let { bonus, malus } = calculerBonusAide(pourc);

    if (motSecret.split("").every(l => lettresTrouvees.includes(l))) {
        score += bonus; // Score ajusté selon l'aide
        majScore();
        scoreAide = 0;
        lettresAide = 0;
        majScoreAide();
        majPourcentageAide();
        document.getElementById("message").textContent = "Bravo, tu as gagné ! (Bonus : " + bonus + ")";
        jeuTermine = true;
        document.getElementById("rejouer").style.display = "inline-block";
        afficherAnimationVictoire();
    } else if (essaisRestants === 0) {
        score += malus; // Score ajusté selon l'aide (malus est négatif)
        majScore();
        scoreAide = 0;
        lettresAide = 0;
        majScoreAide();
        majPourcentageAide();
        document.getElementById("message").textContent = "Perdu ! Le mot était : " + motSecret + " (Malus : " + malus + ")";
        jeuTermine = true;
        document.getElementById("rejouer").style.display = "inline-block";
        afficherAnimationDefaite();
    }
}

function afficherAide() {
    // Affiche une lettre non trouvée au hasard
    const lettresRestantes = motSecret.split("").filter(l => !lettresTrouvees.includes(l));
    if (lettresRestantes.length === 0) return;
    const lettreAide = lettresRestantes[Math.floor(Math.random() * lettresRestantes.length)];
    if (!lettresTrouvees.includes(lettreAide)) {
        lettresTrouvees.push(lettreAide);
        if (!lettresJouees.includes(lettreAide)) {
            lettresJouees.push(lettreAide);
        }
        score -= 0.5; // -0.5 si on demande de l'aide
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
        leftPanel.style.display = "none"; // caché par défaut
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
            score = 0;
            majScore();
        };

        leftPanel.appendChild(btnErreur);
        leftPanel.appendChild(btnWin);
        leftPanel.appendChild(btnResetScore);
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
});
