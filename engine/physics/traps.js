// Pop-up spike traps

G.updateTraps = function () {
    var p = G.player;

    for (var i = 0; i < G.traps.length; i++) {
        var tr = G.traps[i];
        if (tr.state === 'HIDDEN') { tr.timer++; if (tr.timer > 100) { tr.state = 'RISING'; tr.timer = 0; } }
        else if (tr.state === 'RISING') { tr.height += 4; if (tr.height >= tr.maxHeight) { tr.height = tr.maxHeight; tr.state = 'EXTENDED'; } }
        else if (tr.state === 'EXTENDED') { tr.timer++; if (tr.timer > 60) { tr.state = 'RETRACTING'; tr.timer = 0; } }
        else if (tr.state === 'RETRACTING') { tr.height -= 3; if (tr.height <= 0) { tr.height = 0; tr.state = 'HIDDEN'; } }

        // Hitbox: from platform surface (tr.y) up by current height
        var trapTop = tr.y - tr.height;
        if (tr.height > 5 && p.x < tr.x + tr.width && p.x + p.width > tr.x && p.y < tr.y && p.y + p.height > trapTop) {
            if (!p.isInvincible) {
                G.takeDamage();
                if (G.gameState !== 'GAMEOVER_INPUT') { p.y = trapTop - p.height; p.dy = -8; }
            }
        }
    }
};
