export let reglagesScore = {
    bonus0: 0,
    bonus50: -6,
    bonus100: -10,
    malus0: 2,
    malus50: -7,
    malus100: -8,
    baseWin: 8,
    baseLose: -4,
};

export function calculerBonusAide(pourc) {
    // ...existing code from calculerBonusAide()...
    let bonus, malus;
    if (pourc <= 50) {
        bonus = reglagesScore.bonus0 + (reglagesScore.bonus50 - reglagesScore.bonus0) * (pourc / 50);
        malus = reglagesScore.malus0 + (reglagesScore.malus50 - reglagesScore.malus0) * (pourc / 50);
    } else {
        bonus = reglagesScore.bonus50 + (reglagesScore.bonus100 - reglagesScore.bonus50) * ((pourc - 50) / 50);
        malus = reglagesScore.malus50 + (reglagesScore.malus100 - reglagesScore.malus50) * ((pourc - 50) / 50);
    }
    if (bonus < reglagesScore.bonus100) bonus = reglagesScore.bonus100;
    if (bonus > reglagesScore.bonus0) bonus = reglagesScore.bonus0;
    if (malus < reglagesScore.malus100) malus = reglagesScore.malus100;
    if (malus > reglagesScore.malus0) malus = reglagesScore.malus0;
    return { bonus: Math.round(bonus), malus: Math.round(malus) };
}

export function ouvrirPanelReglageScore() {
    // ...existing code from ouvrirPanelReglageScore()...
}
