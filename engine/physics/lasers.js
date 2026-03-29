// Laser state machine and beam collision

G.updateLasers = function () {
    var p = G.player;

    for (var i = 0; i < G.lasers.length; i++) {
        var l = G.lasers[i];
        if (Math.abs(l.x - p.x) < Math.max(2000, G.canvas.width)) {
            l.timer++;
            if (l.state === 'OFF' && l.timer > l.offDuration) { l.state = 'WARNING'; l.timer = 0; }
            else if (l.state === 'WARNING' && l.timer > 30) { l.state = 'ON'; l.timer = 0; }
            else if (l.state === 'ON' && l.timer > l.onDuration) { l.state = 'OFF'; l.timer = 0; }
        }
        if (l.state === 'ON') {
            var beamLeft = l.x + 10; var beamRight = l.x + l.width - 10;
            if (p.x + p.width > beamLeft && p.x < beamRight && p.y + p.height > l.y + l.height) {
                if (!p.isInvincible) {
                    G.takeDamage();
                    if (G.gameState !== 'GAMEOVER_INPUT') { p.dy = -10; p.x += (p.x < l.x + l.width / 2) ? -50 : 50; }
                }
            }
        }
    }
};
