// Platform collision: box, fragile, vent, conveyor, spring, brick, qblock, gear

G.updatePlatforms = function () {
    var p = G.player;

    for (var pi = 0; pi < G.platforms.length; pi++) {
        var plat = G.platforms[pi];

        if (plat.type === 'fragile') {
            if (plat.state === 'SHAKING') { plat.timer++; if (plat.timer > 30) plat.state = 'FALLING'; }
            else if (plat.state === 'FALLING') { plat.y += 15; }
        }

        if (plat.type === 'spring' && plat.state === 'BOUNCING') {
            plat.timer--;
            if (plat.timer <= 0) plat.state = 'IDLE';
        }

        if (plat.type === 'air') continue;

        var hit = G.Collision.test(p, plat);
        if (!hit.hit) continue;

        var isSolid = (plat.type === 'box' || (plat.type === 'fragile' && plat.state !== 'FALLING') || plat.type === 'vent' || plat.type === 'brick' || plat.type === 'qblock' || plat.type === 'conveyor' || plat.type === 'spring');

        // Use previous position to determine which face we're hitting
        var prevBottom = p.lastY + p.height;
        var prevTop = p.lastY;
        var prevRight = p.lastX + p.width;
        var prevLeft = p.lastX;

        // Gear collision (circle)
        if (plat.type === 'gear') {
            var landing = G.Collision.landingTest(p, plat, prevBottom);
            if (landing.landed) {
                p.y = landing.surfaceY - p.height; p.dy = 0; p.grounded = true; p.jumpCount = 0;
                p.x += plat.speed * plat.radius;
            } else {
                G.Collision.resolve(p, hit);
                if (hit.ny > 0.5 && p.dy < 0) p.dy = 0;
            }
            continue;
        }

        if (!isSolid) continue;
        if (plat.oneWay && hit.ny >= 0) continue; // oneWay only blocks from top

        // Determine collision direction by checking which axis has less penetration
        // AND which side the player was on last frame
        var overlapLeft = (p.x + p.width) - plat.x;    // player's right into plat's left
        var overlapRight = (plat.x + plat.width) - p.x; // plat's right into player's left
        var overlapTop = (p.y + p.height) - plat.y;      // player's bottom into plat's top
        var overlapBottom = (plat.y + plat.height) - p.y; // plat's bottom into player's top

        // Find minimum overlap axis
        var minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        // Landing from above
        if (minOverlap === overlapTop && p.dy >= 0 && prevBottom <= plat.y + 15) {
            var surfaceY = plat.y;
            if (!p.grounded && p.dy > 5) G.spawnParticles(p.x + p.width / 2, plat.y, 10, '#888', 'dust');
            if (plat.type === 'spring') {
                var springPower = G.Ease.outBack(Math.min(p.dy / 20, 1));
                p.dy = -p.jumpForce * (1.2 + springPower * 0.5);
                p.grounded = false; p.jumpCount = 1;
                plat.state = 'BOUNCING'; plat.timer = 15;
                G.screenShake = 10;
                G.spawnParticles(p.x + p.width / 2, plat.y + plat.height, 20, '#c00', 'dust');
                G.playSound(G.audio.jump);
            } else {
                p.y = surfaceY - p.height; p.dy = 0; p.grounded = true; p.jumpCount = 0;
                if (plat.type === 'conveyor') p.x += plat.speed;
                else if (plat.type === 'fragile' && plat.state === 'IDLE') plat.state = 'SHAKING';
                else if (plat.type === 'vent') { p.dy = -p.jumpForce * 1.6; p.grounded = false; p.jumpCount = 1; G.playSound(G.audio.jump); }
            }
        }
        // Hit from below
        else if (minOverlap === overlapBottom && p.dy < 0) {
            p.y = plat.y + plat.height; p.dy = 0;
            if (plat.type === 'qblock' && !plat.hit) {
                plat.hit = true; G.playSound(G.audio.jump);
                var roll = Math.random();
                if (roll < 0.15) {
                    G.stars.push({ x: plat.x + 10, y: plat.y - 50, width: 40, height: 40, collected: false });
                } else if (roll < 0.55) {
                    var numCoins = 1 + Math.floor(Math.random() * 3);
                    for (var ci = 0; ci < numCoins; ci++) {
                        G.scraps.push({ x: plat.x + ci * 20, y: plat.y - 60 - ci * 20, width: 50, height: 50, collected: false });
                    }
                } else {
                    G.bonusScore += 50;
                }
            }
        }
        // Push left (player hit plat's left face)
        else if (minOverlap === overlapLeft) {
            p.x = plat.x - p.width;
            var isWall = (plat.type === 'box' || plat.type === 'brick' || plat.type === 'qblock');
            if (isWall && !p.grounded && p.dy > 0) { p.wallSliding = true; p.wallDir = -1; }
        }
        // Push right (player hit plat's right face)
        else if (minOverlap === overlapRight) {
            p.x = plat.x + plat.width;
            var isWall = (plat.type === 'box' || plat.type === 'brick' || plat.type === 'qblock');
            if (isWall && !p.grounded && p.dy > 0) { p.wallSliding = true; p.wallDir = 1; }
        }
    }
};
