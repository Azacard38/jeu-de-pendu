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
    descDiv.textContent = ""; // Masque la description au départ
    descDiv.style.display = "block"; // Toujours "block" pour garder la place
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
                descDiv.textContent = descriptionMotSecret || "";
                descDiv.style.visibility = "visible";
                btnDesc.textContent = "Masquer la description";
            } else {
                descDiv.style.visibility = "hidden";
                descDiv.textContent = "";
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
                descDiv.textContent = descriptionMotSecret || "";
                descDiv.style.visibility = "visible";
                btnDesc.textContent = "Masquer la description";
            } else {
                descDiv.style.visibility = "hidden";
                descDiv.textContent = "";
                btnDesc.textContent = "Afficher la description";
            }
        };
    }
    afficherMot();
    dessinerPendu();
    genererClavier();
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
        btn.style.margin = "12px";
        btn.style.padding = "24px 32px";
        btn.style.fontSize = "2em";
        btn.style.borderRadius = "14px";
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
        }
    } else {
        essaisRestants--;
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
   / \\         |
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

function verifierFin() {
    if (motSecret.split("").every(l => lettresTrouvees.includes(l))) {
        document.getElementById("message").textContent = "Bravo, tu as gagné !";
        jeuTermine = true;
        document.getElementById("rejouer").style.display = "inline-block";
        afficherAnimationVictoire();
    } else if (essaisRestants === 0) {
        document.getElementById("message").textContent = "Perdu ! Le mot était : " + motSecret;
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

        leftPanel.appendChild(btnErreur);
        leftPanel.appendChild(btnWin);
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
