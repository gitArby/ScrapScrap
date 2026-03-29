G.drawVictory = function () {
    var ctx = G.ctx;
    G.stopMusic();
    ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);
    ctx.fillStyle = "#42cbf5"; ctx.textAlign = "center"; ctx.font = "bold 40px 'Press Start 2P', monospace";
    ctx.fillText('LEVEL ' + G.currentLevel + ' DOKONČEN!', G.canvas.width / 2, G.canvas.height / 2 - 50);

    G.drawBtn("DALŠÍ LEVEL", G.canvas.width / 2 - 200, G.canvas.height / 2 + 80, 400, 80, function () {
        G.totalScore += Math.floor(G.maxDistance / 10) + G.bonusScore;
        G.currentLevel++;
        G.gameState = 'PLAYING';
        G.restartLevel(false);
        G.playMusic();
    });
    G.drawBtn("MENU", G.canvas.width / 2 - 200, G.canvas.height / 2 + 180, 400, 80, function () { G.gameState = 'MENU'; });
};
