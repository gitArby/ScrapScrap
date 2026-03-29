// Steampunk HUD — bottom notch bar
// Ported from debug/demo.jsx

var HP = {
    outline: '#3a2a1a',
    dark: '#6b4e2a',
    mid: '#9b7b4a',
    light: '#c4a055',
    highlight: '#d4b872',
    shine: '#e8d5a0',
    steel_dark: '#484e5c',
    steel_mid: '#6c7484',
    red: '#c83728',
    red_light: '#e14b37',
    cyan: '#4ae0e0',
    cyan_dark: '#2a8888',
    gold: '#dca520',
    gold_light: '#f0c850'
};

// Draw a pixel-art heart
function drawHeart(ctx, x, y, s, filled) {
    if (filled) {
        ctx.fillStyle = HP.red_light;
        // Top bumps
        ctx.fillRect(x + s, y, s * 3, s);
        ctx.fillRect(x + s * 6, y, s * 3, s);
        ctx.fillRect(x, y + s, s * 5, s);
        ctx.fillRect(x + s * 6, y + s, s * 5, s);
        // Body
        ctx.fillStyle = HP.red;
        ctx.fillRect(x, y + s * 2, s * 11, s * 4);
        ctx.fillRect(x + s, y + s * 6, s * 9, s);
        ctx.fillRect(x + s * 2, y + s * 7, s * 7, s);
        ctx.fillRect(x + s * 3, y + s * 8, s * 5, s);
        ctx.fillRect(x + s * 4, y + s * 9, s * 3, s);
        ctx.fillRect(x + s * 5, y + s * 10, s, s);
        // Shine
        ctx.fillStyle = '#f07860';
        ctx.fillRect(x + s * 2, y + s, s * 2, s);
        ctx.fillRect(x + s, y + s * 2, s * 2, s * 2);
    } else {
        ctx.fillStyle = HP.steel_dark;
        // Just outline shape
        ctx.fillRect(x + s, y, s * 3, s);
        ctx.fillRect(x + s * 6, y, s * 3, s);
        ctx.fillRect(x, y + s, s, s * 5);
        ctx.fillRect(x + s * 10, y + s, s, s * 5);
        ctx.fillRect(x + s, y + s * 6, s, s);
        ctx.fillRect(x + s * 9, y + s * 6, s, s);
        ctx.fillRect(x + s * 2, y + s * 7, s, s);
        ctx.fillRect(x + s * 8, y + s * 7, s, s);
        ctx.fillRect(x + s * 3, y + s * 8, s, s);
        ctx.fillRect(x + s * 7, y + s * 8, s, s);
        ctx.fillRect(x + s * 4, y + s * 9, s, s);
        ctx.fillRect(x + s * 6, y + s * 9, s, s);
        ctx.fillRect(x + s * 5, y + s * 10, s, s);
        ctx.fillRect(x + s * 4, y, s * 2, s * 2);
        // Inner dark fill
        ctx.fillStyle = HP.steel_dark;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x + s, y + s, s * 9, s * 5);
        ctx.fillRect(x + s * 2, y + s * 6, s * 7, s);
        ctx.fillRect(x + s * 3, y + s * 7, s * 5, s);
        ctx.fillRect(x + s * 4, y + s * 8, s * 3, s);
        ctx.fillRect(x + s * 5, y + s * 9, s, s);
        ctx.globalAlpha = 1;
    }
}

// Draw a pixel coin icon
function drawCoinIcon(ctx, x, y, s) {
    ctx.fillStyle = HP.gold;
    ctx.fillRect(x + s * 3, y + s, s * 4, s);
    ctx.fillRect(x + s, y + s * 2, s, s * 6);
    ctx.fillRect(x + s * 8, y + s * 2, s, s * 6);
    ctx.fillRect(x + s * 3, y + s * 8, s * 4, s);
    ctx.fillStyle = HP.gold_light;
    ctx.fillRect(x + s * 2, y + s * 2, s * 6, s * 6);
    ctx.fillStyle = HP.outline;
    ctx.fillRect(x + s * 4, y + s * 3, s * 2, s);
    ctx.fillRect(x + s * 4, y + s * 5, s * 2, s);
    ctx.fillRect(x + s * 3, y + s * 4, s, s);
    ctx.fillRect(x + s * 6, y + s * 4, s, s);
}

// Beveled box helper
function bevelBox(ctx, x, y, w, h, bg, light, dark, border) {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = border || HP.outline;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    // Inner bevel
    ctx.fillStyle = light; ctx.fillRect(x + 2, y + 2, w - 4, 2);
    ctx.fillRect(x + 2, y + 2, 2, h - 4);
    ctx.fillStyle = dark; ctx.fillRect(x + 2, y + h - 4, w - 4, 2);
    ctx.fillRect(x + w - 4, y + 2, 2, h - 4);
}

G.drawHUD = function () {
    var ctx = G.ctx;
    var cw = G.canvas.width;
    var ch = G.canvas.height;
    var p = G.player;

    var barMaxW = 800;
    var barW = Math.min(barMaxW, cw - 40);
    var barX = (cw - barW) / 2;
    var barY = ch - 60;
    var barH = 48;
    var notchW = 160;
    var notchH = 64;
    var leftW = (barW - notchW) / 2;

    // Hearts above left bar
    var heartS = 2;
    var heartW = 11 * heartS;
    var maxLives = 5;
    for (var i = 0; i < maxLives; i++) {
        drawHeart(ctx, barX + 8 + i * (heartW + 4), barY - 32, heartS, i < p.lives);
    }

    // Left bar
    bevelBox(ctx, barX, barY, leftW, barH, HP.mid, HP.highlight, HP.dark);

    // Coins
    drawCoinIcon(ctx, barX + 10, barY + 14, 2);
    ctx.fillStyle = HP.shine;
    ctx.font = "bold 11px 'Press Start 2P', monospace";
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('' + G.scrapsCollected, barX + 36, barY + 25);

    // Score
    var currentScore = G.totalScore + Math.floor(G.maxDistance / 10) + G.bonusScore;
    ctx.fillStyle = HP.highlight;
    ctx.font = "bold 16px 'Press Start 2P', monospace";
    ctx.textAlign = 'right';
    ctx.fillText(currentScore.toLocaleString(), barX + leftW - 10, barY + 26);

    // Center notch
    var notchX = barX + leftW;
    var notchY = barY - (notchH - barH);
    bevelBox(ctx, notchX, notchY, notchW, notchH, HP.light, HP.shine, HP.dark);

    // Level label
    ctx.fillStyle = HP.dark;
    ctx.font = "bold 8px 'Press Start 2P', monospace";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('LEVEL', notchX + notchW / 2, notchY + 16);

    // Level number
    ctx.fillStyle = HP.outline;
    ctx.font = "bold 28px 'Press Start 2P', monospace";
    ctx.fillText('' + G.currentLevel, notchX + notchW / 2, notchY + 42);

    // Rivets on notch corners
    var rv = 6;
    ctx.fillStyle = HP.mid;
    ctx.strokeStyle = HP.dark; ctx.lineWidth = 1;
    [[notchX + 8, notchY + 6], [notchX + notchW - 8 - rv, notchY + 6],
     [notchX + 8, notchY + notchH - 8 - rv], [notchX + notchW - 8 - rv, notchY + notchH - 8 - rv]].forEach(function (pos) {
        ctx.fillRect(pos[0], pos[1], rv, rv);
        ctx.strokeRect(pos[0], pos[1], rv, rv);
    });

    // Right bar
    var rightX = notchX + notchW;
    bevelBox(ctx, rightX, barY, leftW, barH, HP.mid, HP.highlight, HP.dark);

    // Progress percentage
    var progress = G.player.x / G.mapEnd;
    ctx.fillStyle = HP.dark;
    ctx.font = "bold 8px 'Press Start 2P', monospace";
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(progress * 100) + '%', rightX + leftW - 10, barY + 25);

    // Progress bar along bottom
    var pbH = 12;
    var pbY = barY + barH;
    // Background
    ctx.fillStyle = HP.dark;
    ctx.fillRect(barX, pbY, barW, pbH);
    ctx.strokeStyle = HP.outline; ctx.lineWidth = 2;
    ctx.strokeRect(barX, pbY, barW, pbH);
    // Fill
    var fillW = Math.max(0, (barW - 4) * progress);
    ctx.fillStyle = HP.cyan;
    ctx.fillRect(barX + 2, pbY + 2, fillW, pbH - 4);
    // Shine
    if (fillW > 0) {
        ctx.fillStyle = 'rgba(200,255,255,0.3)';
        ctx.fillRect(barX + 2, pbY + 2, fillW, (pbH - 4) / 2);
    }
    // Tick marks
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    for (var t = 0.25; t < 1; t += 0.25) {
        ctx.fillRect(barX + barW * t - 1, pbY, 2, pbH);
    }
};

G.drawPause = function () {
    var ctx = G.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);
    ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 20px 'Press Start 2P', monospace";
    ctx.fillText("PAUZA", G.canvas.width / 2, G.canvas.height / 2 - 100);
    G.drawBtn("POKRACOVAT", G.canvas.width / 2 - 200, G.canvas.height / 2, 400, 80, function () { G.gameState = 'PLAYING'; });
    G.drawBtn("MENU", G.canvas.width / 2 - 200, G.canvas.height / 2 + 100, 400, 80, function () { G.gameState = 'MENU'; }, 'danger');
    if (G.keys.Escape) { G.gameState = 'PLAYING'; G.keys.Escape = false; }
};

G.drawFpsCounter = function () {
    G._fpsFrames++;
    var now = performance.now();
    if (now - G._fpsLast >= 1000) {
        G._fpsCurrent = G._fpsFrames;
        G._fpsFrames = 0;
        G._fpsLast = now;
    }
    var ctx = G.ctx;
    ctx.fillStyle = G._fpsCurrent < 50 ? '#ff4444' : '#44ff44';
    ctx.font = "bold 12px 'Press Start 2P', monospace";
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('FPS: ' + G._fpsCurrent, 20, 20);
};

G.drawEntityCount = function () {
    var ctx = G.ctx;
    var total = G.platforms.length + G.rcs.length + G.turrets.length +
        G.drones.length + G.sawblades.length + G.traps.length + G.lasers.length +
        G.bullets.length + G.scraps.length + G.stars.length + G.particles.length;
    ctx.fillStyle = '#ffcc00';
    ctx.font = "bold 10px 'Press Start 2P', monospace";
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    var y = G.debugFps ? 40 : 20;
    ctx.fillText('ENT: ' + total + ' P:' + G.particles.length + ' B:' + G.bullets.length, 20, y);
};
