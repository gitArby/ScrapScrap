G.drawLeaderboard = function () {
    var ctx = G.ctx;
    G.stopMusic();
    ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);
    ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 32px 'Press Start 2P', monospace";
    ctx.fillText("NEJLEPŠÍ SKÓRE", G.canvas.width / 2, 200);
    G.highScores.forEach(function (s, i) {
        ctx.font = "bold 20px 'Press Start 2P', monospace";
        ctx.fillText((i + 1) + '. ' + s.name + ' --- ' + s.score, G.canvas.width / 2, 350 + i * 80);
    });
    G.drawBtn("ZPĚT", G.canvas.width / 2 - 150, 850, 300, 80, function () { G.gameState = 'MENU'; });
};
