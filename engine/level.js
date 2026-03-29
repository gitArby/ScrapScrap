G.generateLevel = function () {
    G.platforms = []; G.stars = []; G.turrets = []; G.rcs = []; G.drones = [];
    G.bullets = []; G.traps = []; G.scraps = []; G.lasers = []; G.sawblades = [];

    var gapMultiplier = Math.min(1.5, 1 + (G.currentLevel * 0.05));
    var heightMultiplier = Math.min(2.0, 1 + (G.currentLevel * 0.1));
    var enemyDensity = Math.min(0.9, 0.40 + (G.currentLevel * 0.08));

    var maxJumpableUp = 250;
    var maxSafeDrop = 500;

    G.platforms.push({ type: 'box', x: 0, y: 850, width: 800, height: G.TILE_SIZE * 2 });
    var currentX = 900;
    var currentY = 850;
    var prevY = 850;

    var trend = 'FLAT';
    var trendSteps = 0;
    var trendMaxSteps = 0;

    while (currentX < G.mapEnd - 1500) {
        if (trendSteps >= trendMaxSteps) {
            var r = Math.random();
            if (r < 0.35) { trend = 'ASCENDING'; trendMaxSteps = 3 + Math.floor(Math.random() * 5); }
            else if (r < 0.65) { trend = 'DESCENDING'; trendMaxSteps = 3 + Math.floor(Math.random() * 4); }
            else { trend = 'FLAT'; trendMaxSteps = 4 + Math.floor(Math.random() * 6); }
            trendSteps = 0;
        }
        trendSteps++;

        var gap = (80 + Math.random() * 100) * gapMultiplier;
        var yOffset;
        if (trend === 'ASCENDING') {
            yOffset = -(40 + Math.random() * 80) * heightMultiplier;
        } else if (trend === 'DESCENDING') {
            yOffset = (40 + Math.random() * 80) * heightMultiplier;
        } else {
            yOffset = ((Math.random() * 80) - 40) * heightMultiplier;
        }
        currentY += yOffset;

        if (currentY > 1800) currentY = 1800;
        if (currentY < -1500) currentY = -1500;

        var heightDiff = prevY - currentY;
        if (heightDiff > maxJumpableUp) currentY = prevY - maxJumpableUp;
        if (heightDiff < -maxSafeDrop) currentY = prevY + maxSafeDrop;

        currentX += gap;
        var isGear = Math.random() < 0.45;

        if (isGear) {
            var radius = 100 + Math.random() * 150;

            // Gear top (landing surface) = currentY - 2*radius
            // Clamp so the top is reachable from previous platform
            var gearTop = currentY - 2 * radius;
            var jumpNeeded = prevY - gearTop;
            if (jumpNeeded > maxJumpableUp) {
                // Push currentY down so gear top is within jump range
                currentY = prevY - maxJumpableUp + 2 * radius;
            }

            var gearSpeed = (Math.random() * 0.03) + 0.015 + (G.currentLevel * 0.002);
            if (Math.random() < 0.5) gearSpeed *= -1;
            var colors = ['#a67b5b', '#8a5c3a', '#5c3a21'];
            var color = colors[Math.floor(Math.random() * colors.length)];
            G.platforms.push({ type: 'gear', shape: 'circle', radius: radius, x: currentX, y: currentY - radius, width: radius * 2, height: radius * 2, angle: 0, speed: gearSpeed, color: color });

            if (Math.random() < 0.5) {
                G.scraps.push({ x: currentX + radius - 15, y: currentY - radius - 60, width: 50, height: 50, collected: false });
            }
            currentX += radius * 2;
            // For next platform's height check, use gear top as the "floor" the player is on
            prevY = currentY - 2 * radius;
            continue;
        } else {
            var width = 250 + Math.random() * 400;
            var height = G.TILE_SIZE * 2; // 2 tile rows

            var randType = Math.random();
            var pType = 'box';
            if (randType < 0.10) pType = 'fragile';
            else if (randType < 0.20) pType = 'vent';
            else if (randType < 0.35) pType = 'conveyor';

            if (pType === 'box') {
                G.platforms.push({ type: 'box', x: currentX, y: currentY, width: width, height: height });
            } else if (pType === 'fragile') {
                G.platforms.push({ type: 'fragile', x: currentX, y: currentY, width: width, height: height, state: 'IDLE', timer: 0 });
            } else if (pType === 'vent') {
                G.platforms.push({ type: 'vent', x: currentX, y: currentY, width: width, height: height });
            } else if (pType === 'conveyor') {
                var dir = Math.random() < 0.5 ? 1 : -1;
                var cSpeed = 2 + Math.random() * 3 + (G.currentLevel * 0.3);
                G.platforms.push({ type: 'conveyor', x: currentX, y: currentY, width: width, height: height, speed: cSpeed * dir });
            }

            var hasBlocks = false;
            if (width > 300 && pType === 'box' && Math.random() < 0.6) {
                hasBlocks = true;
                var numBlocks = Math.floor(Math.random() * 4) + 1;
                var blockWidth = G.TILE_SIZE;
                var startBlockX = currentX + width / 2 - (numBlocks * blockWidth) / 2;

                for (var i = 0; i < numBlocks; i++) {
                    if (Math.random() < 0.35) {
                        G.platforms.push({ type: 'qblock', x: startBlockX + i * blockWidth, y: currentY - 200, width: blockWidth, height: blockWidth, hit: false });
                    } else {
                        G.platforms.push({ type: 'brick', x: startBlockX + i * blockWidth, y: currentY - 200, width: blockWidth, height: blockWidth });
                    }
                }
            }

            if (!hasBlocks && pType === 'box' && width > 200 && Math.random() < 0.2) {
                G.platforms.push({ type: 'spring', x: currentX + width / 2 - 30, y: currentY - 30, width: 60, height: 30, state: 'IDLE', timer: 0, oneWay: true });
            }

            if (Math.random() < 0.7) {
                var numScraps = Math.floor(width / 70);
                for (var i = 0; i < numScraps; i++) {
                    G.scraps.push({ x: currentX + 30 + i * 70, y: currentY - 60, width: 50, height: 50, collected: false });
                }
            }

            if (width > 350 && pType === 'box') {
                if (Math.random() < enemyDensity) {
                    var enemyType = Math.random();
                    if (enemyType < 0.20) {
                        G.rcs.push({
                            x: currentX + width / 2, y: currentY - 60, width: 60, height: 60,
                            startX: currentX + 20, endX: currentX + width - 80,
                            speed: 2 + Math.random() * 1.5, chargeSpeed: 7 + Math.random() * 3,
                            facingRight: false, state: 'PATROL', timer: 0,
                            fovRange: 600, fovAngle: Math.PI * 0.3
                        });
                    } else if (enemyType < 0.35) {
                        G.turrets.push({
                            x: currentX + width / 2 - 30, y: currentY - 60, width: 60, height: 60,
                            timer: 0, shootInterval: Math.max(30, 60 + Math.random() * 80 - (G.currentLevel * 5)),
                            fovRange: 1200, fovAngle: Math.PI * 0.75
                        });
                    } else if (enemyType < 0.50) {
                        G.traps.push({
                            x: currentX + width / 2 - 30, y: currentY, width: 60, height: 0, maxHeight: G.TILE_SIZE,
                            state: 'HIDDEN', timer: Math.floor(Math.random() * 100)
                        });
                    } else if (enemyType < 0.65) {
                        G.drones.push({
                            x: currentX + width / 2,
                            y: currentY - 250 - Math.random() * 150,
                            width: 60, height: 60, shape: 'circle', radius: 30,
                            speed: 1.5 + Math.random() + (G.currentLevel * 0.2),
                            timer: 0,
                            shootInterval: Math.max(50, 90 + Math.random() * 60 - (G.currentLevel * 5)),
                            hoverOffset: Math.random() * Math.PI * 2,
                            fovRange: 1000, fovAngle: Math.PI
                        });
                    } else if (enemyType < 0.85) {
                        G.sawblades.push({
                            x: currentX + 20, y: currentY - 60, width: 60, height: 60,
                            shape: 'circle', radius: 30,
                            startX: currentX + 20, endX: currentX + width - 80,
                            speed: 6 + Math.random() * 4 + (G.currentLevel * 0.5),
                            facingRight: true, angle: 0
                        });
                    } else {
                        G.lasers.push({
                            x: currentX + width / 2 - 20, y: currentY - 300 - Math.random() * 100, width: 40, height: 40,
                            timer: 0, state: 'OFF', onDuration: 60 + Math.random() * 60, offDuration: 60 + Math.random() * 60
                        });
                    }
                }
            }

            if (Math.random() < 0.1) {
                G.stars.push({ x: currentX + width / 2 - 20, y: currentY - 150, width: 40, height: 40, collected: false });
            }
            currentX += width;
        }
        prevY = currentY;
    }

    var finalY = currentY;
    if (Math.abs(finalY - prevY) > maxJumpableUp) finalY = prevY;
    G.platforms.push({ type: 'box', x: G.mapEnd - 1000, y: finalY, width: 1200, height: G.TILE_SIZE * 2 });
    G.flag = { x: G.mapEnd - 400, y: finalY - 200, width: 60, height: 200 };
};

G.generateBossLevel = function () {
    G.platforms = []; G.stars = []; G.turrets = []; G.rcs = []; G.drones = [];
    G.bullets = []; G.traps = []; G.scraps = []; G.lasers = []; G.sawblades = [];
    G.isBossLevel = true;

    var arenaWidth = 2500;
    var arenaY = 750;
    G.platforms.push({ type: 'box', x: 0, y: arenaY, width: arenaWidth, height: G.TILE_SIZE * 2 });
    G.platforms.push({ type: 'box', x: 300, y: arenaY - 200, width: 200, height: G.TILE_SIZE * 2 });
    G.platforms.push({ type: 'box', x: arenaWidth - 500, y: arenaY - 200, width: 200, height: G.TILE_SIZE * 2 });
    G.platforms.push({ type: 'box', x: arenaWidth / 2 - 100, y: arenaY - 350, width: 200, height: G.TILE_SIZE * 2 });

    var bossNum = Math.floor(G.currentLevel / 5);
    var variant = ((bossNum - 1) % 3);

    var hpScale = bossNum;
    var speedScale = 1 + (bossNum - 1) * 0.3;

    var bossHP, bossSpeed, bossSize, bossType, bossName;

    if (variant === 0) {
        bossType = 'CRUSHER'; bossName = 'DRTIČ';
        bossHP = 6 + hpScale * 3; bossSpeed = 2.5 * speedScale; bossSize = 220;
    } else if (variant === 1) {
        bossType = 'GUNNER'; bossName = 'STŘELEC';
        bossHP = 4 + hpScale * 2; bossSpeed = 3.5 * speedScale; bossSize = 180;
    } else {
        bossType = 'INFERNO'; bossName = 'INFERNO';
        bossHP = 5 + hpScale * 2; bossSpeed = 4 * speedScale; bossSize = 190;
    }

    G.boss = {
        x: arenaWidth / 2 - bossSize / 2, y: arenaY - bossSize, width: bossSize, height: bossSize,
        hp: bossHP, maxHP: bossHP,
        speed: bossSpeed,
        type: bossType, name: bossName,
        state: 'IDLE',
        timer: 0,
        facingRight: false,
        hitCooldown: 0,
        slamY: 0,
        phaseTimer: 0,
        bossNum: bossNum
    };

    G.mapEnd = arenaWidth;
    G.flag = { x: -9999, y: -9999, width: 0, height: 0 };
};

G.restartLevel = function (fullReset) {
    if (fullReset === undefined) fullReset = true;
    var p = G.player;

    if (fullReset) {
        G.currentLevel = 1;
        G.totalScore = 0;
        G.scrapsCollected = 0;
        p.isBig = false;
        p.isGolden = false;
        p.lives = 1;
        G.gameStartTime = Date.now();
    }

    G.isBossLevel = false;
    G.boss = null;

    if (G.currentLevel % 5 === 0) {
        G.generateBossLevel();
    } else {
        G.mapEnd = 15000;
        G.generateLevel();
    }
    p.x = 100; p.y = 500; p.dy = 0;

    p.width = p.isBig ? 68 : 45;
    p.height = p.isBig ? 120 : 80;
    p.jumpForce = p.isBig ? 25 : 22;

    p.isInvincible = false; p.invincibleTimer = 0; p.jumpCount = 0;
    G.cameraX = 0; G.cameraY = 0; G.maxDistance = 0; G.bonusScore = 0;
};

G.generateDemoLevel = function () {
    G.platforms = []; G.stars = []; G.turrets = []; G.rcs = []; G.drones = [];
    G.bullets = []; G.traps = []; G.scraps = []; G.lasers = []; G.sawblades = [];
    G.isBossLevel = false; G.boss = null;
    G.mapEnd = 12000;

    var y = 850;
    var x = 0;
    var ts = G.TILE_SIZE;

    // === SECTION 1: Platform types ===
    G.Platform(x, y, 6, 2, 'standard');                      // spawn

    x = 500;
    G.Platform(x, y, 6, 2, 'standard');                      // box + coin
    G.scraps.push({ x: x + 175, y: y - 70, width: 50, height: 50, collected: false });

    x = 1000;
    G.Platform(x, y, 6, 2, 'falling');                       // fragile

    x = 1500;
    G.Platform(x, y, 6, 2, 'vent');                          // vent

    x = 2000;
    G.Platform(x, y, 6, 2, 'rbelt');                         // conveyor right

    x = 2500;
    G.Platform(x, y, 6, 2, 'lbelt');                         // conveyor left

    x = 3000;
    G.Platform(x, y, 6, 2, 'standard');                      // spring base
    G.Spring(x + 170, y);

    // === SECTION 2: Mario blocks ===
    x = 3500;
    G.Platform(x, y, 9, 2, 'standard');
    G.BlockRow(x + 100, y - 200, 'BQBQB');
    G.stars.push({ x: x + 250, y: y - 320, width: 40, height: 40, collected: false });

    // === SECTION 3: Gears ===
    x = 4200;
    var gearR = 120;
    G.platforms.push({ type: 'gear', shape: 'circle', radius: gearR, x: x, y: y - gearR, width: gearR * 2, height: gearR * 2, angle: 0, speed: 0.02, color: '#a67b5b' });
    x += gearR * 2 + 100;
    gearR = 200;
    G.platforms.push({ type: 'gear', shape: 'circle', radius: gearR, x: x, y: y - gearR, width: gearR * 2, height: gearR * 2, angle: 0, speed: -0.015, color: '#8a5c3a' });

    // === SECTION 4: Enemies ===
    x = 5000;
    G.Platform(x, y, 9, 2, 'standard');
    G.rcs.push({ x: x + 200, y: y - 60, width: 60, height: 60, startX: x + 20, endX: x + 520, speed: 2, chargeSpeed: 8, facingRight: true, state: 'PATROL', timer: 0, fovRange: 600, fovAngle: Math.PI * 0.3 });

    x = 5700;
    G.Platform(x, y, 6, 2, 'standard');
    G.turrets.push({ x: x + 170, y: y - 60, width: 60, height: 60, timer: 0, shootInterval: 90, fovRange: 1200, fovAngle: Math.PI * 0.75 });

    x = 6200;
    G.Platform(x, y, 6, 2, 'standard');
    G.drones.push({ x: x + 170, y: y - 300, width: 60, height: 60, shape: 'circle', radius: 30, speed: 2, timer: 0, shootInterval: 80, hoverOffset: 0, fovRange: 1000, fovAngle: Math.PI });

    x = 6700;
    G.Platform(x, y, 8, 2, 'standard');
    G.sawblades.push({ x: x + 50, y: y - 60, width: 60, height: 60, shape: 'circle', radius: 30, startX: x + 20, endX: x + 420, speed: 5, facingRight: true, angle: 0 });

    x = 7300;
    G.Platform(x, y, 6, 2, 'standard');
    G.traps.push({ x: x + 170, y: y, width: 60, height: 0, maxHeight: G.TILE_SIZE, state: 'HIDDEN', timer: 50 });

    x = 7800;
    G.Platform(x, y, 6, 2, 'standard');
    G.lasers.push({ x: x + 180, y: y - 400, width: 40, height: 40, timer: 0, state: 'OFF', onDuration: 90, offDuration: 60 });

    // === SECTION 5: Collectibles ===
    x = 8400;
    G.Platform(x, y, 12, 2, 'standard');
    for (var i = 0; i < 10; i++) {
        G.scraps.push({ x: x + 40 + i * 70, y: y - 70, width: 50, height: 50, collected: false });
    }

    // === SECTION 6: Wall slide test ===
    x = 9400;
    G.Platform(x, y, 3, 2, 'standard');
    G.Platform(x, y - 500, 1, 8, 'standard');                // left wall
    G.Platform(x + 300, y - 500, 1, 8, 'standard');          // right wall
    G.stars.push({ x: x + 160, y: y - 550, width: 40, height: 40, collected: false });

    // === SECTION 7: Gauntlet ===
    x = 10000;
    G.Platform(x, y, 23, 2, 'standard');
    G.rcs.push({ x: x + 100, y: y - 60, width: 60, height: 60, startX: x + 20, endX: x + 700, speed: 3, chargeSpeed: 10, facingRight: true, state: 'PATROL', timer: 0, fovRange: 600, fovAngle: Math.PI * 0.3 });
    G.sawblades.push({ x: x + 400, y: y - 60, width: 60, height: 60, shape: 'circle', radius: 30, startX: x + 400, endX: x + 900, speed: 7, facingRight: true, angle: 0 });
    G.turrets.push({ x: x + 1000, y: y - 60, width: 60, height: 60, timer: 0, shootInterval: 60, fovRange: 1200, fovAngle: Math.PI * 0.75 });
    G.drones.push({ x: x + 700, y: y - 350, width: 60, height: 60, shape: 'circle', radius: 30, speed: 2.5, timer: 0, shootInterval: 70, hoverOffset: 0, fovRange: 1000, fovAngle: Math.PI });
    G.lasers.push({ x: x + 600, y: y - 400, width: 40, height: 40, timer: 0, state: 'OFF', onDuration: 60, offDuration: 90 });
    G.traps.push({ x: x + 300, y: y, width: 60, height: 0, maxHeight: G.TILE_SIZE, state: 'HIDDEN', timer: 20 });
    G.traps.push({ x: x + 800, y: y, width: 60, height: 0, maxHeight: G.TILE_SIZE, state: 'HIDDEN', timer: 60 });
    G.BlockRow(x + 200, y - 200, 'BQBBQBQB');

    // End
    G.Platform(G.mapEnd - 600, y, 9, 2, 'standard');
    G.flag = { x: G.mapEnd - 400, y: y - 200, width: 60, height: 200 };
};

G.generateLevel();
