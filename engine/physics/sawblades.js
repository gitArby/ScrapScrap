// Sawblade movement and player collision
// Eased: decelerates near edges, accelerates from rest — feels heavy

G.updateSawblades = function () {
    var p = G.player;

    for (var i = G.sawblades.length - 1; i >= 0; i--) {
        var s = G.sawblades[i];

        // Calculate position ratio along patrol path [0, 1]
        var range = s.endX - s.startX;
        if (range <= 0) range = 1;
        var ratio = (s.x - s.startX) / range; // 0 at startX, 1 at endX

        // Ease: slow near edges (0 and 1), fast in middle
        // Use a sine curve: sin(ratio * PI) peaks at 0.5, zero at 0 and 1
        var speedMul = 0.3 + 0.7 * Math.sin(ratio * Math.PI);
        var currentSpeed = s.speed * speedMul;

        s.x += s.facingRight ? currentSpeed : -currentSpeed;

        // Spin proportional to movement speed (heavy = slow spin at edges)
        s.angle += (s.facingRight ? 1 : -1) * 0.05 * (1 + speedMul * 3);

        if (s.x >= s.endX) { s.x = s.endX; s.facingRight = false; }
        if (s.x <= s.startX) { s.x = s.startX; s.facingRight = true; }

        // Sparks only at higher speeds
        if (speedMul > 0.5 && Math.random() < 0.3) {
            G.spawnParticles(s.x + s.width / 2, s.y + s.height, 2, '#ffcc00', 'circle');
        }

        if (G.Collision.overlaps(p, s)) {
            var prevBottom = p.lastY + p.height;
            if (p.dy > 0 && prevBottom <= s.y + 30) {
                G.spawnParticles(s.x + s.width / 2, s.y + s.height / 2, 30, '#aaa', 'circle');
                G.screenShake = 10; G.sawblades.splice(i, 1); p.dy = -15; p.jumpCount = 1;
                G.bonusScore += 300; G.playSound(G.audio.jump);
            } else if (!p.isInvincible) {
                G.takeDamage(); if (G.gameState !== 'GAMEOVER_INPUT') { p.dy = -10; p.y = s.y - p.height; }
            }
        }
    }
};
