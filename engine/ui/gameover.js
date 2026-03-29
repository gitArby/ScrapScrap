G.drawGameOverInput = function () {
    var ctx = G.ctx;
    G.stopMusic();
    ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);
    ctx.fillStyle = "#a33327"; ctx.textAlign = "center"; ctx.font = "bold 48px 'Press Start 2P', monospace"; ctx.fillText("ZNIČEN!", G.canvas.width / 2, 300);
    ctx.fillStyle = "white"; ctx.font = "bold 20px 'Press Start 2P', monospace"; ctx.fillText("ZADEJ SVÉ JMÉNO:", G.canvas.width / 2, 450);
    ctx.fillStyle = "#bc8a5f"; ctx.fillRect(G.canvas.width / 2 - 300, 500, 600, 100);
    ctx.fillStyle = "white"; ctx.font = "bold 24px 'Press Start 2P', monospace";
    ctx.fillText(G.playerName + (Math.floor(Date.now() / 500) % 2 === 0 ? "_" : ""), G.canvas.width / 2, 570);
    ctx.fillStyle = '#aaa'; ctx.font = "italic 30px 'Press Start 2P', monospace";
    ctx.fillText("ENTER = ULOŽIT SKÓRE  |  ESC = PŘESKOČIT", G.canvas.width / 2, 650);
};
