// RC car AI: patrol, FOV detect, charge, player collision

G.updateRCs = function () {
    var p = G.player;

    for (var i = G.rcs.length - 1; i >= 0; i--) {
        var s = G.rcs[i];
        var sFacing = s.facingRight ? 0 : Math.PI;
        s._facingAngle = sFacing;
        if (s.state === 'PATROL') {
            s.x += s.facingRight ? s.speed : -s.speed;
            if (s.x > s.endX) { s.x = s.endX; s.facingRight = false; }
            if (s.x < s.startX) { s.x = s.startX; s.facingRight = true; }
            if (G.Collision.canSee(s, sFacing, p)) {
                s.state = 'CHARGING'; s.timer = 60;
            }
        } else if (s.state === 'CHARGING') {
            s.timer--; if (s.timer <= 0) { s.state = 'CHARGE'; s._chargeFrame = 0; }
        } else if (s.state === 'CHARGE') {
            s._chargeFrame = (s._chargeFrame || 0) + 1;
            var chargeRamp = G.Ease.inQuad(Math.min(s._chargeFrame / 20, 1));
            s.x += (s.facingRight ? 1 : -1) * s.chargeSpeed * chargeRamp;
            if (s.x > s.endX) { s.x = s.endX; s.state = 'PATROL'; s.facingRight = false; }
            if (s.x < s.startX) { s.x = s.startX; s.state = 'PATROL'; s.facingRight = true; }
            if (Math.random() < 0.4) G.spawnParticles(s.x + s.width / 2, s.y + s.height, 2, '#a67b5b', 'dust');
        }
        if (G.Collision.overlaps(p, s)) {
            var prevBottom = p.lastY + p.height;
            if (p.dy > 0 && prevBottom <= s.y + 30) {
                G.spawnParticles(s.x + s.width / 2, s.y + s.height / 2, 40, '#a67b5b', 'square');
                G.screenShake = 15; G.rcs.splice(i, 1); p.dy = -18; p.jumpCount = 1;
                G.bonusScore += 500; G.playSound(G.audio.jump);
            } else if (!p.isInvincible) {
                G.takeDamage();
                if (G.gameState !== 'GAMEOVER_INPUT') { s.state = 'PATROL'; s.x += s.facingRight ? -50 : 50; }
            }
        }
    }
};
