// Physics orchestrator — calls each module in order

G.updatePlaying = function () {
    var isMoving = G.updateMovement();

    G.updatePlatforms();
    G.updateWallSlide();
    G.updateCamera();

    G.updateCollectibles();
    G.updateTurrets();
    G.updateDrones();
    G.updateBullets();
    G.updateSawblades();
    G.updateLasers();
    G.updateTraps();
    G.updateRCs();
    G.updateParticles();

    if (G.isBossLevel && G.boss && G.boss.hp > 0) {
        G.updateBoss();
    }

    // Flag
    var p = G.player;
    if (p.x < G.flag.x + G.flag.width && p.x + p.width > G.flag.x && p.y < G.flag.y + G.flag.height && p.y + p.height > G.flag.y) {
        G.gameState = 'VICTORY';
    }

    return isMoving;
};
