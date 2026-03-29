// Bullet movement, player hit, platform hit

G.updateBullets = function () {
    var p = G.player;

    for (var i = G.bullets.length - 1; i >= 0; i--) {
        var b = G.bullets[i];

        if (b.arc) {
            // Arc bullet: move along quadratic bezier
            b.t += 1 / b.duration;
            if (b.t >= 1) { G.bullets.splice(i, 1); continue; }
            var u = 1 - b.t;
            b.x = u * u * b.sx + 2 * u * b.t * b.cx + b.t * b.t * b.ex;
            b.y = u * u * b.sy + 2 * u * b.t * b.cy + b.t * b.t * b.ey;
        } else {
            // Linear bullet (drone bombs etc)
            b.x += b.vx;
            b.y += b.vy;
            if (b.gravity) b.vy += b.gravity;
        }

        var bulletHit = false;
        // Hit player
        if (G.Collision.overlaps(p, b) && !p.isInvincible) {
            G.takeDamage(); G.bullets.splice(i, 1); bulletHit = true;
        }
        // Hit solid platforms (arc bullets skip platform collision — they follow a fixed path)
        if (!bulletHit && !b.arc) {
            for (var j = 0; j < G.platforms.length; j++) {
                var plat = G.platforms[j];
                if (plat.oneWay || plat.type === 'gear' || plat.type === 'air') continue;
                if (plat.type === 'fragile' && plat.state === 'FALLING') continue;
                var isSolid = (plat.type === 'box' || plat.type === 'fragile' || plat.type === 'vent' || plat.type === 'brick' || plat.type === 'qblock' || plat.type === 'conveyor');
                if (isSolid && G.Collision.overlaps(b, plat)) {
                    G.spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 5, '#ffcc00', 'circle');
                    G.bullets.splice(i, 1); bulletHit = true;
                    break;
                }
            }
        }
        if (!bulletHit && (b.x < G.cameraX - 1000 || b.x > G.cameraX + G.canvas.width + 1000 || b.y > G.cameraY + G.canvas.height + 1000)) {
            G.bullets.splice(i, 1);
        }
    }
};
