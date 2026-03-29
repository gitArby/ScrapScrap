G.keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, a: false, d: false, w: false, ' ': false, Escape: false, Enter: false, Backspace: false };

G.mouse = { x: 0, y: 0, clicked: false };

    var normalizedKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (G.keys.hasOwnProperty(normalizedKey)) G.keys[normalizedKey] = true;

    if (G.gameState === 'GAMEOVER_INPUT') {
        if (e.key === 'Enter' && G.playerName.length > 0) {
            var finalScore = G.totalScore + Math.floor(G.maxDistance / 10) + G.bonusScore;
            try { G.saveScore(finalScore); } catch (err) { console.error("Chyba ukládání:", err); }
            G.gameState = 'MENU';
        } else if (e.key === 'Escape') {
            G.gameState = 'MENU';
        } else if (e.key === 'Backspace') {
            G.playerName = G.playerName.slice(0, -1);
        } else if (e.key.length === 1 && G.playerName.length < 12) {
            G.playerName += e.key.toUpperCase();
        }
    }

    if (!e.repeat && (normalizedKey === 'ArrowUp' || normalizedKey === 'w' || normalizedKey === ' ') && G.gameState === 'PLAYING') {
        if (G.player.grounded) {
            G.player.dy = -G.player.jumpForce;
            G.player.grounded = false;
            G.player.jumpCount = 1;
            G.player.jumpPhaseTimer = 0;
            G.playSound(G.audio.jump);
        } else if (G.player.wallSliding) {
            // Wall-jump: push away from wall
            G.player.dy = -G.player.jumpForce * 0.9;
            G.player.x += G.player.wallDir * 40;
            G.player.facingRight = G.player.wallDir === -1;
            G.player.wallSliding = false;
            G.player.wallGrabbing = false;
            G.player.jumpCount = 2;
            G.player.jumpPhaseTimer = 0;
            G.playSound(G.audio.jump);
        } else if (G.player.jumpCount < 2) {
            G.player.dy = -G.player.jumpForce * 0.8;
            G.player.jumpCount = 2;
            G.playSound(G.audio.jump);
        }
    }
});

window.addEventListener('keyup', function (e) {
    var normalizedKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (G.keys.hasOwnProperty(normalizedKey)) G.keys[normalizedKey] = false;
});

window.addEventListener('mousemove', function (e) {
    var rect = G.canvas.getBoundingClientRect();
    var scaleX = G.canvas.width / rect.width;
    var scaleY = G.canvas.height / rect.height;
    G.mouse.x = (e.clientX - rect.left) * scaleX;
    G.mouse.y = (e.clientY - rect.top) * scaleY;
});
window.addEventListener('mousedown', function () { G.mouse.clicked = true; });
window.addEventListener('mouseup', function () { G.mouse.clicked = false; });
