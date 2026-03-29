G.drawGameOverInput = function () {
    var ctx = G.ctx;
    G.stopMusic();

    // Cash in coins on first frame
    if (G._deathCashedIn === undefined) {
        G._deathCashedIn = G.cashInCoins();
    }

    ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);
    ctx.fillStyle = "#a33327"; ctx.textAlign = "center";
    ctx.font = "bold 36px 'Press Start 2P', monospace";
    ctx.fillText("ZNICEN!", G.canvas.width / 2, 250);

    // Coin breakdown
    ctx.fillStyle = '#e8d5a0';
    ctx.font = "bold 12px 'Press Start 2P', monospace";
    ctx.fillText('MINCE: +' + G._deathCashedIn, G.canvas.width / 2, 310);

    var currentScore = G.totalScore + Math.floor(G.maxDistance / 10) + G.bonusScore;
    ctx.fillStyle = '#c4a055';
    ctx.fillText('SKORE: ' + currentScore, G.canvas.width / 2, 340);

    ctx.fillStyle = "white";
    ctx.font = "bold 14px 'Press Start 2P', monospace";
    ctx.fillText("ZADEJ JMENO:", G.canvas.width / 2, 420);
    ctx.fillStyle = "#bc8a5f"; ctx.fillRect(G.canvas.width / 2 - 250, 440, 500, 70);
    ctx.fillStyle = "white";
    ctx.font = "bold 20px 'Press Start 2P', monospace";
    ctx.fillText(G.playerName + (Math.floor(Date.now() / 500) % 2 === 0 ? "_" : ""), G.canvas.width / 2, 480);

    ctx.fillStyle = '#888';
    ctx.font = "bold 10px 'Press Start 2P', monospace";
    ctx.fillText("ENTER = ULOZIT  |  ESC = PRESKOCIT", G.canvas.width / 2, 540);
};
