// Drone AI: hover, FOV chase, shoot, stomp collision

G.updateDrones = function () {
    var p = G.player;

    for (var i = G.drones.length - 1; i >= 0; i--) {
        var d = G.drones[i];
        d.hoverOffset += 0.05;
        var hoverT = (Math.sin(d.hoverOffset) + 1) / 2;
        d.y += G.Ease.lerp(-1.5, 1.5, hoverT, G.Ease.inOutSine);
        var dcx = d.x + d.width / 2, dcy = d.y + d.height / 2;
        var dAngle = Math.atan2(p.y + p.height / 2 - dcy, p.x + p.width / 2 - dcx);
        d._facingAngle = dAngle;
        // 360° FOV — just range + LOS check, no angle restriction
        var dDist = Math.hypot(p.x + p.width / 2 - dcx, p.y + p.height / 2 - dcy);
        var droneCanSee = dDist < d.fovRange && G.Collision.lineOfSight(dcx, dcy, p.x + p.width / 2, p.y + p.height / 2);
        if (droneCanSee) {
            if (dcx < p.x + p.width / 2) d.x += d.speed; else d.x -= d.speed;
            if (dcy < p.y - 100) d.y += d.speed * 0.5;
            else if (dcy > p.y - 100) d.y -= d.speed * 0.5;
            d.timer++;
            if (d.timer > d.shootInterval) {
                var startX = dcx; var startY = d.y + d.height;
                // Drop bombs straight down with gravity
                G.bullets.push({ x: startX, y: startY, width: 16, height: 16, shape: 'circle', radius: 8, vx: 0, vy: 2, gravity: 0.3 });
                d.timer = 0;
            }
        }
        if (G.Collision.overlaps(p, d)) {
            var prevBottom = p.lastY + p.height;
            if (p.dy > 0 && prevBottom <= d.y + 20) {
                G.spawnParticles(d.x + d.width / 2, d.y + d.height / 2, 30, '#7a7a7a', 'circle');
                G.screenShake = 10; G.drones.splice(i, 1); p.dy = -15; p.jumpCount = 1;
                G.bonusScore += 400; G.playSound(G.audio.jump);
            } else if (!p.isInvincible) {
                G.takeDamage(); if (G.gameState !== 'GAMEOVER_INPUT') { p.dy = -5; }
            }
        }
    }
};
