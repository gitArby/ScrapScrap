// Boss fight AI and collision

G.updateBoss = function () {
    var p = G.player;
    var boss = G.boss;
    boss.phaseTimer++;
    if (boss.hitCooldown > 0) boss.hitCooldown--;

    var arenaY = 750;

    if (boss.state === 'IDLE') {
        boss.facingRight = p.x > boss.x;
        boss.timer++;
        var idleTime = boss.type === 'INFERNO' ? 50 : (boss.type === 'GUNNER' ? 70 : 90);
        if (boss.timer > idleTime) {
            var attack = Math.random();
            if (boss.type === 'CRUSHER') {
                if (attack < 0.45) boss.state = 'CHARGE';
                else if (attack < 0.85) { boss.state = 'SLAM'; boss.slamY = boss.y; }
                else boss.state = 'SHOOT';
            } else if (boss.type === 'GUNNER') {
                if (attack < 0.15) boss.state = 'CHARGE';
                else if (attack < 0.30) { boss.state = 'SLAM'; boss.slamY = boss.y; }
                else boss.state = 'SHOOT';
            } else {
                if (attack < 0.50) boss.state = 'CHARGE';
                else if (attack < 0.70) { boss.state = 'SLAM'; boss.slamY = boss.y; }
                else boss.state = 'SHOOT';
            }
            boss.timer = 0;
        }
    } else if (boss.state === 'CHARGE') {
        var dir = boss.facingRight ? 1 : -1;
        var chargeMultiplier = boss.type === 'CRUSHER' ? 2.5 : (boss.type === 'INFERNO' ? 4 : 2);
        boss.x += dir * boss.speed * chargeMultiplier;
        if (Math.random() < 0.5) {
            var dustColor = boss.type === 'INFERNO' ? '#ff6600' : (boss.type === 'CRUSHER' ? '#a33327' : '#3366cc');
            G.spawnParticles(boss.x + boss.width / 2, boss.y + boss.height, 2, dustColor, 'dust');
        }
        if (boss.type === 'INFERNO' && Math.random() < 0.6) {
            G.spawnParticles(boss.x + boss.width / 2, boss.y + boss.height - 10, 3, '#ff4400', 'spark');
        }
        boss.timer++;
        if (boss.timer % 30 === 0) boss.facingRight = p.x > boss.x;
        if (boss.x < 10) { boss.x = 10; boss.state = 'STUNNED'; boss.timer = 0; G.screenShake = 15; }
        if (boss.x + boss.width > G.mapEnd - 10) { boss.x = G.mapEnd - boss.width - 10; boss.state = 'STUNNED'; boss.timer = 0; G.screenShake = 15; }
        if (boss.timer > 120) { boss.state = 'IDLE'; boss.timer = 0; }
    } else if (boss.state === 'SLAM') {
        boss.timer++;
        var slamPower = boss.type === 'CRUSHER' ? 15 : 12;
        if (boss.timer < 30) {
            var riseT = G.Ease.outQuad(boss.timer / 30);
            boss.y = boss.slamY - slamPower * 30 * riseT;
        } else if (boss.timer < 45) {
            boss.facingRight = p.x > boss.x;
            boss.x += (boss.facingRight ? 1 : -1) * 5;
        } else if (boss.timer < 60) {
            var dropT = G.Ease.inCubic((boss.timer - 45) / 15);
            boss.y += slamPower * 2.5 * dropT + 5;
            if (boss.y >= arenaY - boss.height) {
                boss.y = arenaY - boss.height;
                var shockRadius = boss.type === 'CRUSHER' ? 400 : 300;
                G.screenShake = boss.type === 'CRUSHER' ? 30 : 25;
                var dustColor = boss.type === 'INFERNO' ? '#ff6600' : (boss.type === 'CRUSHER' ? '#a33327' : '#3366cc');
                G.spawnParticles(boss.x + boss.width / 2, arenaY, 40, dustColor, 'dust');
                if (Math.abs((p.x + p.width / 2) - (boss.x + boss.width / 2)) < shockRadius && p.y + p.height >= arenaY - 20) {
                    if (!p.isInvincible) { G.takeDamage(); if (G.gameState !== 'GAMEOVER_INPUT') p.dy = -15; }
                }
                boss.state = 'STUNNED'; boss.timer = 0;
            }
        }
    } else if (boss.state === 'SHOOT') {
        boss.timer++;
        boss.facingRight = p.x > boss.x;
        var shootInterval = boss.type === 'GUNNER' ? 10 : 20;
        var shootDuration = boss.type === 'GUNNER' ? 80 : 60;
        var bulletSpeed = boss.type === 'GUNNER' ? 9 : 7;
        if (boss.timer % shootInterval === 0 && boss.timer <= shootDuration) {
            var startX = boss.facingRight ? boss.x + boss.width : boss.x;
            var startY = boss.y + boss.height / 2;
            var targetX = p.x + p.width / 2; var targetY = p.y + p.height / 2;
            var spread = boss.type === 'GUNNER' ? (Math.random() - 0.5) * 0.3 : 0;
            var angle = Math.atan2(targetY - startY, targetX - startX) + spread;
            G.bullets.push({ x: startX, y: startY, width: 20, height: 20, shape: 'circle', radius: 10, vx: Math.cos(angle) * bulletSpeed, vy: Math.sin(angle) * bulletSpeed });
        }
        if (boss.timer > shootDuration + 20) { boss.state = 'IDLE'; boss.timer = 0; }
    } else if (boss.state === 'STUNNED') {
        boss.timer++;
        var stunTime = boss.type === 'CRUSHER' ? 100 : (boss.type === 'INFERNO' ? 60 : 80);
        if (boss.timer > stunTime) { boss.state = 'IDLE'; boss.timer = 0; }
    }

    if (boss.state !== 'SLAM') {
        if (boss.y < arenaY - boss.height) boss.y += 8;
        if (boss.y > arenaY - boss.height) boss.y = arenaY - boss.height;
    }

    if (G.Collision.overlaps(p, boss)) {
        var prevBottom = p.lastY + p.height;
        if (p.dy > 0 && prevBottom <= boss.y + 40 && boss.hitCooldown <= 0) {
            boss.hp--; boss.hitCooldown = 60;
            p.dy = -p.jumpForce; p.jumpCount = 1;
            G.screenShake = 20;
            G.spawnParticles(boss.x + boss.width / 2, boss.y, 30, '#ff4444', 'square');
            G.playSound(G.audio.jump);
            if (boss.hp <= 0) {
                G.spawnParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 80, '#ffcc00', 'square');
                G.spawnParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 40, '#a33327', 'circle');
                G.screenShake = 40; G.bonusScore += 10000;
                boss.state = 'DEAD';
                setTimeout(function () { G.gameState = 'VICTORY'; }, 1500);
            } else { boss.state = 'STUNNED'; boss.timer = 0; }
        } else if (!p.isInvincible && boss.hitCooldown <= 0) {
            G.takeDamage();
            if (G.gameState !== 'GAMEOVER_INPUT') {
                p.dy = -12;
                p.x += (p.x < boss.x + boss.width / 2) ? -80 : 80;
            }
        }
    }
};
