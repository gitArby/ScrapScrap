G.drawVictory = function () {
    var ctx = G.ctx;
    G.stopMusic();

    // Cash in coins on first frame of victory
    if (G._victoryCashedIn === undefined) {
        G._victoryCashedIn = G.cashInCoins();
    }

    ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);
    ctx.fillStyle = "#42cbf5"; ctx.textAlign = "center";
    ctx.font = "bold 32px 'Press Start 2P', monospace";
    ctx.fillText('LEVEL ' + G.currentLevel, G.canvas.width / 2, G.canvas.height / 2 - 120);
    ctx.font = "bold 20px 'Press Start 2P', monospace";
    ctx.fillText('DOKONCEN!', G.canvas.width / 2, G.canvas.height / 2 - 80);

    // Coin score breakdown
    ctx.fillStyle = '#e8d5a0';
    ctx.font = "bold 12px 'Press Start 2P', monospace";
    ctx.fillText('MINCE: ' + G._victoryCashedIn + ' (' + Math.floor(G._victoryCashedIn / G.currentLevel) + ' x ' + G.currentLevel + ')', G.canvas.width / 2, G.canvas.height / 2 - 30);

    G.drawBtn("DALSI LEVEL", G.canvas.width / 2 - 200, G.canvas.height / 2 + 30, 400, 70, function () {
        G.totalScore += Math.floor(G.maxDistance / 10) + G.bonusScore;
        G.currentLevel++;
        G._victoryCashedIn = undefined;
        G.gameState = 'PLAYING';
        G.restartLevel(false);
        G.playMusic();
    });
    G.drawBtn("MENU", G.canvas.width / 2 - 200, G.canvas.height / 2 + 120, 400, 70, function () {
        G._victoryCashedIn = undefined;
        G.gameState = 'MENU';
    }, 'steel');
};
