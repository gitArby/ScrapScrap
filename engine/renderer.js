G.drawBgCover = function (img) {
    var ctx = G.ctx;
    if (!img || !img.complete || img.naturalHeight === 0) return false;
    var imgRatio = img.width / img.height;
    var canvasRatio = G.canvas.width / G.canvas.height;
    var drawWidth, drawHeight;

    if (canvasRatio > imgRatio) {
        drawWidth = G.canvas.width;
        drawHeight = G.canvas.width / imgRatio;
    } else {
        drawHeight = G.canvas.height;
        drawWidth = G.canvas.height * imgRatio;
    }

    var x = (G.canvas.width - drawWidth) / 2;
    var y = (G.canvas.height - drawHeight) / 2;
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    return true;
};

// Pixel-art button palettes
G._btnPalettes = {
    brass:  { face: '#9b7b4a', hover: '#b89955', active: '#7a6a4a', border: '#3a2a1a', hiL: '#c4a055', hiT: '#d4b872', shR: '#6b4e2a', shB: '#6b4e2a', shine: '#e8d5a0', text: '#e8d5a0', textHover: '#fff' },
    steel:  { face: '#6c7484', hover: '#7c8898', active: '#585e6c', border: '#282c34', hiL: '#949eac', hiT: '#b2bcc8', shR: '#484e5c', shB: '#484e5c', shine: '#d2dae8', text: '#d2dae8', textHover: '#fff' },
    danger: { face: '#c83728', hover: '#d84838', active: '#8c2319', border: '#3c1410', hiL: '#e14b37', hiT: '#f07860', shR: '#8c2319', shB: '#8c2319', shine: '#f5a090', text: '#f5c0b0', textHover: '#fff' }
};

G.drawBtn = function (text, x, y, w, h, action, style) {
    var ctx = G.ctx;
    var pal = G._btnPalettes[style] || G._btnPalettes.brass;
    var b = 4; // border pixel width
    var hover = G.mouse.x > x && G.mouse.x < x + w && G.mouse.y > y && G.mouse.y < y + h;
    var pressed = hover && G.mouse.clicked;

    var ox = pressed ? 2 : 0;
    var oy = pressed ? 4 : 0;
    var bx = x + ox, by = y + oy;

    // Outer border
    ctx.fillStyle = pal.border;
    ctx.fillRect(bx - b, by - b, w + b * 2, h + b * 2);

    // Face
    ctx.fillStyle = pressed ? pal.active : (hover ? pal.hover : pal.face);
    ctx.fillRect(bx, by, w, h);

    if (!pressed) {
        // Inner bevel: top + left highlight
        ctx.fillStyle = pal.hiL; ctx.fillRect(bx, by, b, h);
        ctx.fillStyle = pal.hiT; ctx.fillRect(bx, by, w, b);
        // Inner bevel: bottom + right shadow
        ctx.fillStyle = pal.shR; ctx.fillRect(bx + w - b, by, b, h);
        ctx.fillStyle = pal.shB; ctx.fillRect(bx, by + h - b, w, b);
        // Corner shine
        ctx.fillStyle = pal.shine; ctx.fillRect(bx, by, b, b);
        // Bottom/right outer shadow
        ctx.fillStyle = pal.border;
        ctx.fillRect(x + w, y + b, b, h);
        ctx.fillRect(x + b, y + h, w, b);
    } else {
        // Pressed: inverted bevel
        ctx.fillStyle = pal.shR; ctx.fillRect(bx, by, b, h);
        ctx.fillStyle = pal.shB; ctx.fillRect(bx, by, w, b);
        ctx.fillStyle = pal.hiL; ctx.fillRect(bx + w - b, by, b, h);
        ctx.fillStyle = pal.hiT; ctx.fillRect(bx, by + h - b, w, b);
    }

    // Text
    ctx.fillStyle = hover ? pal.textHover : pal.text;
    ctx.font = "bold 28px 'Press Start 2P', monospace";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + w / 2, by + h / 2 + 2);

    if (pressed) { G.mouse.clicked = false; action(); }
};

G.drawStar = function (cx, cy, spikes, outerRadius, innerRadius) {
    var ctx = G.ctx;
    var size = outerRadius * 2;
    var dx = cx - G.cameraX - outerRadius;
    var dy = cy - G.cameraY - outerRadius;

    if (G.drawAnimatedSprite(ctx, 'star', dx, dy, size, size, 120)) return;

    // Procedural fallback
    var sy = cy - G.cameraY;
    var rot = Math.PI / 2 * 3; var step = Math.PI / spikes;
    ctx.beginPath(); ctx.moveTo(cx - G.cameraX, sy - outerRadius);
    for (var i = 0; i < spikes; i++) {
        ctx.lineTo((cx - G.cameraX) + Math.cos(rot) * outerRadius, sy + Math.sin(rot) * outerRadius); rot += step;
        ctx.lineTo((cx - G.cameraX) + Math.cos(rot) * innerRadius, sy + Math.sin(rot) * innerRadius); rot += step;
    }
    ctx.closePath(); ctx.fillStyle = 'gold'; ctx.fill();
};

G.drawGear = function (gx, gy, radius, angle, color, strokeColor) {
    var ctx = G.ctx;
    if (strokeColor === undefined) strokeColor = 'rgba(0,0,0,0.6)';
    ctx.save(); ctx.translate(gx - G.cameraX, gy - G.cameraY); ctx.rotate(angle); ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    for (var i = 0; i < 12; i++) {
        ctx.save(); ctx.rotate((i * Math.PI) / 6); ctx.fillRect(-radius / 8, -radius - (radius / 6), radius / 4, radius / 3); ctx.restore();
    }
    ctx.fillStyle = strokeColor; ctx.beginPath(); ctx.arc(0, 0, radius / 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
};

G.drawAir = function (p) {
    var ctx = G.ctx;
    var ts = G.TILE_SIZE;
    var sx = p.x - G.cameraX;
    var sy = p.y - G.cameraY;
    var cols = Math.ceil(p.width / ts);
    var rows = Math.ceil(p.height / ts);

    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var tx = sx + c * ts;
            var ty = sy + r * ts;
            if (tx + ts < 0 || tx > G.canvas.width || ty + ts < 0 || ty > G.canvas.height) continue;
            // Subtle grid pattern
            var shade = ((r + c) % 2 === 0) ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)';
            ctx.fillStyle = shade;
            ctx.fillRect(tx, ty, ts, ts);
        }
    }
};

G.drawBoxPlatform = function (p) {
    G.renderTiledPlatform(p, 'box');
};

G.drawFragilePlatform = function (p) {
    var ctx = G.ctx;
    if (p.state === 'SHAKING') {
        ctx.save();
        ctx.translate(Math.random() * 6 - 3, 0);
    }
    G.renderTiledPlatform(p, 'fragile');
    if (p.state === 'SHAKING') ctx.restore();
};

G.drawVentPlatform = function (p) {
    G.renderTiledPlatform(p, 'vent');
    // Steam particles rising from top
    var ctx = G.ctx;
    var screenX = p.x - G.cameraX; var screenY = p.y - G.cameraY;
    for (var i = 30; i < p.width - 30; i += 60) {
        var timeOffset = (Date.now() / 200 + i) % 10;
        ctx.fillStyle = 'rgba(200, 220, 230, ' + (0.4 - timeOffset / 25) + ')';
        ctx.beginPath();
        ctx.arc(screenX + i, screenY - timeOffset * 6, 8 + timeOffset * 2, 0, Math.PI * 2);
        ctx.fill();
    }
};

G.drawConveyorPlatform = function (p) {
    // Full 9-slice conveyor platform
    G.renderTiledPlatform(p, 'conveyor');
    // Direction indicator belt overlay on top
    var beltRow = p.speed > 0 ? 'conveyor_right' : 'conveyor_left';
    G.renderBeltOverlay(p, beltRow);
};

G.drawSpring = function (p) {
    var ctx = G.ctx;
    var screenX = p.x - G.cameraX; var screenY = p.y - G.cameraY;
    ctx.fillStyle = '#444'; ctx.fillRect(screenX, screenY + p.height - 10, p.width, 10);
    var springTop = p.state === 'BOUNCING' ? p.height - 20 : p.height - 10;
    ctx.strokeStyle = '#c00'; ctx.lineWidth = 4;
    ctx.beginPath();
    for (var i = 0; i < 3; i++) {
        var y1 = screenY + p.height - 10 - (i * springTop / 3);
        var y2 = screenY + p.height - 10 - ((i + 1) * springTop / 3);
        ctx.moveTo(screenX + 10, y1); ctx.lineTo(screenX + p.width - 10, y2);
    }
    ctx.stroke();
    ctx.fillStyle = '#888'; ctx.fillRect(screenX, screenY + p.height - springTop - 15, p.width, 10);
};

G.drawBrick = function (p) {
    if (G._tilesetReady && G.tilesetRows.brick !== undefined) {
        var ctx = G.ctx;
        var sx = p.x - G.cameraX; var sy = p.y - G.cameraY;
        // Pick a consistent variant per block based on position hash
        var total = G.tilesetCounts.brick || 1;
        var variant = ((Math.floor(p.x) * 31 + Math.floor(p.y) * 17) & 0x7FFFFFFF) % total;
        G.drawTileFromSheet(ctx, G.tilesetRows.brick, variant, sx, sy, p.width, p.height);
        return;
    }
    G.renderBrickPlatform(p);
};

G.drawQBlock = function (p) {
    var ctx = G.ctx;
    var screenX = p.x - G.cameraX; var screenY = p.y - G.cameraY;
    G.drawQBlockTile(screenX, screenY, p.width, p.hit, ctx);
};

G.drawTurret = function (t) {
    var ctx = G.ctx;
    var screenX = t.x - G.cameraX; var screenY = t.y - G.cameraY;
    var cx = screenX + t.width / 2; var cy = screenY + t.height / 2;
    var angle = t._aimAngle || 0;

    // Base first (behind)
    if (!G.Tileset.sprite('cannon_base', ctx, screenX, screenY, t.width, t.height, 0)) {
        ctx.fillStyle = '#2b2b2b'; ctx.fillRect(screenX, cy, t.width, t.height / 2);
        ctx.fillStyle = '#7a7a7a'; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
    }

    // Cannon barrel on top, rotated by aim angle
    // Single tile drawn at native aspect ratio (not stretched to turret size)
    if (G.Tileset.has('cannon')) {
        var bw = G.TILE_SIZE;
        var bh = G.TILE_SIZE;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle + Math.PI / 2);
        G.Tileset.sprite('cannon', ctx, -bw / 2, -bh, bw, bh, 0);
        ctx.restore();
    }
};

G.drawRC = function (s) {
    var ctx = G.ctx;
    var screenX = s.x - G.cameraX; var screenY = s.y - G.cameraY;

    // Try tileset — RC states: idle(0-1), alert(2), hunting(3-7)
    if (G.Tileset.has('rc')) {
        var frame;
        if (s.state === 'CHARGE') {
            // Hunting: cycle through frames 3-7
            frame = 3 + Math.floor(Date.now() / 60) % 5;
        } else if (s.state === 'CHARGING') {
            // Alert: show frame 2
            frame = 2;
        } else {
            // Idle patrol: alternate frames 0-1
            frame = Math.floor(Date.now() / 200) % 2;
        }
        ctx.save();
        if (!s.facingRight) {
            ctx.scale(-1, 1);
            G.drawSprite(ctx, 'rc', -screenX - s.width, screenY, s.width, s.height, frame);
        } else {
            G.drawSprite(ctx, 'rc', screenX, screenY, s.width, s.height, frame);
        }
        ctx.restore();
        return;
    }

    // Procedural fallback
    var centerY = screenY + s.height / 2;
    ctx.save();
    ctx.fillStyle = '#a67b5b'; ctx.fillRect(screenX, screenY, s.width, s.height);
    var sRatio = s.width / 90;
    ctx.fillStyle = '#3b2515'; var armX = s.facingRight ? screenX + s.width - 5 * sRatio : screenX - 25 * sRatio;
    ctx.fillRect(armX, centerY - 10 * sRatio, 30 * sRatio, 20 * sRatio);
    ctx.fillStyle = (s.state === 'CHARGE' || s.state === 'CHARGING') ? 'red' : '#ffcc00';
    var eyeX = s.facingRight ? screenX + s.width - 20 * sRatio : screenX + 10 * sRatio;
    ctx.beginPath(); ctx.arc(eyeX, screenY + 20 * sRatio, 8 * sRatio, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeX + (s.facingRight ? -12 * sRatio : 12 * sRatio), screenY + 20 * sRatio, 6 * sRatio, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5c3a'; ctx.fillRect(screenX + s.width / 4, screenY - 10 * sRatio, s.width / 2, 10 * sRatio);
    G.drawGear(s.x + s.width / 2, s.y - 5 * sRatio, 12 * sRatio, Date.now() / 200, '#bc8a5f', 'rgba(0,0,0,0.8)');
    ctx.fillStyle = '#5c3a21'; var legOffset = s.facingRight ? 10 * sRatio : -10 * sRatio;
    ctx.fillRect(screenX + s.width / 4 + legOffset, screenY + s.height - 10 * sRatio, 20 * sRatio, 20 * sRatio);
    ctx.fillRect(screenX + s.width * 0.6 + legOffset, screenY + s.height - 10 * sRatio, 20 * sRatio, 20 * sRatio);
    ctx.restore();
};

G.drawSawblade = function (s) {
    var ctx = G.ctx;
    var screenX = s.x - G.cameraX;
    var screenY = s.y - G.cameraY;
    var cx = screenX + s.width / 2;
    var cy = screenY + s.height / 2;

    if (G.Tileset.has('sawblade')) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(s.angle);
        G.Tileset.animate('sawblade', ctx, -s.width / 2, -s.height / 2, s.width, s.height, 80);
        ctx.restore();
        return;
    }

    // Procedural fallback
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(s.angle);
    ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(0, 0, s.width / 2 - 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#555';
    for (var i = 0; i < 8; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 4);
        ctx.beginPath(); ctx.moveTo(s.width / 2 - 5, -5); ctx.lineTo(s.width / 2 + 5, 0); ctx.lineTo(s.width / 2 - 5, 5); ctx.fill();
        ctx.restore();
    }
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
};

G.drawLaser = function (l) {
    var ctx = G.ctx;
    var screenX = l.x - G.cameraX; var screenY = l.y - G.cameraY;

    // Try tileset — base with firing animation
    if (G.Tileset.has('laser_base')) {
        var baseFrame;
        if (l.state === 'ON' || l.state === 'WARNING') {
            // Animate through firing frames (1+)
            var total = G.Tileset.get('laser_base').count;
            baseFrame = 1 + Math.floor(Date.now() / 100) % (total - 1);
        } else {
            baseFrame = 0; // Idle
        }
        G.Tileset.sprite('laser_base', ctx, screenX, screenY, l.width, l.height, baseFrame);
    } else {
        // Procedural fallback
        ctx.fillStyle = '#3a3a3a'; ctx.fillRect(screenX, screenY, l.width, l.height);
        ctx.fillStyle = '#555'; ctx.fillRect(screenX + 2, screenY + 2, l.width - 4, l.height - 4);
        var glowColor = l.state === 'ON' ? '#ff2222' : (l.state === 'WARNING' ? '#ff8800' : '#661111');
        ctx.fillStyle = glowColor;
        ctx.beginPath(); ctx.arc(screenX + l.width / 2, screenY + l.height - 5, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#222'; ctx.fillRect(screenX + 5, screenY + l.height, l.width - 10, 10);
    }
    // Beam — starts right at bottom face of base
    var beamTop = screenY + l.height;
    var beamH = G.canvas.height + 2000;
    if (l.state === 'WARNING') {
        var alpha = Math.abs(Math.sin(Date.now() / 100));
        ctx.fillStyle = 'rgba(255, 0, 0, ' + (alpha * 0.7) + ')';
        ctx.fillRect(screenX + l.width / 2 - 1.5, beamTop, 3, beamH);
    } else if (l.state === 'ON') {
        // Try tileset beam tile, tiled vertically
        if (G._tilesetReady && G.tilesetRows.laser_beam !== undefined) {
            var ts = G.TILE_SIZE;
            var beamFrame = Math.floor(Date.now() / 100) % (G.tilesetCounts.laser_beam || 1);
            for (var by = beamTop; by < beamTop + beamH; by += ts) {
                if (by > G.canvas.height) break;
                G.drawTileFromSheet(ctx, G.tilesetRows.laser_beam, beamFrame, screenX, by, l.width, ts);
            }
        } else {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(255, 50, 50, 0.5)'; ctx.fillRect(screenX - 10, beamTop, l.width + 20, beamH);
            ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'; ctx.fillRect(screenX + 5, beamTop, l.width - 10, beamH);
            ctx.fillStyle = 'white'; ctx.fillRect(screenX + 15, beamTop, l.width - 30, beamH);
            ctx.restore();
        }
    }
};

G.drawDrone = function (d) {
    var ctx = G.ctx; var p = G.player;
    var screenX = d.x - G.cameraX;
    var screenY = d.y - G.cameraY;

    // Try tileset
    if (G.drawAnimatedSprite(ctx, 'drone', screenX, screenY, d.width, d.height, 120)) return;

    // Procedural fallback
    var centerX = screenX + d.width / 2;
    var centerY = screenY + d.height / 2;
    ctx.save(); ctx.translate(centerX, centerY);
    ctx.save(); ctx.rotate(Date.now() / 100);
    ctx.fillStyle = '#7a7a7a'; ctx.fillRect(-35, -d.height / 2 - 5, 70, 4); ctx.restore();
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(-5, -d.height / 2 - 10, 10, 10);
    ctx.fillStyle = '#a67b5b'; ctx.beginPath(); ctx.arc(0, 0, d.width / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c3a21'; ctx.beginPath(); ctx.arc(0, 0, d.width / 2 - 5, 0, Math.PI * 2); ctx.fill();
    var targetX = p.x + p.width / 2 - G.cameraX;
    var targetY = p.y + p.height / 2 - G.cameraY;
    var angle = Math.atan2(targetY - centerY, targetX - centerX);
    ctx.rotate(angle);
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(0, -10, 30, 20);
    var heat = Math.floor((d.timer / d.shootInterval) * 255);
    ctx.fillStyle = 'rgb(255, ' + (255 - heat) + ', 0)';
    ctx.beginPath(); ctx.arc(10, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
};

G.drawTrap = function (tr) {
    var ctx = G.ctx;
    var screenX = tr.x - G.cameraX; var screenY = tr.y - G.cameraY;

    // Sits on top of the platform
    var ts = G.TILE_SIZE;
    var drawY = screenY - ts; // one tile above the platform surface

    if (G.Tileset.has('trap_spikes')) {
        if (tr.height <= 0) {
            // Idle: frame 0
            G.Tileset.sprite('trap_spikes', ctx, screenX, drawY, tr.width, ts, 0);
        } else {
            // Extending: frames 1-4 based on extension ratio
            var ratio = tr.height / tr.maxHeight;
            var frame = 1 + Math.min(Math.floor(ratio * 4), 3);
            G.Tileset.sprite('trap_spikes', ctx, screenX, drawY, tr.width, ts, frame);
        }
    } else {
        // Procedural fallback
        ctx.fillStyle = '#1a110a'; ctx.fillRect(screenX - 5, screenY, tr.width + 10, 8);
        if (tr.height > 0) {
            var spikeTop = screenY - tr.height;
            ctx.fillStyle = '#7a7a7a'; ctx.fillRect(screenX + 15, spikeTop, 30, tr.height);
            ctx.fillStyle = '#a33327';
            ctx.beginPath();
            ctx.moveTo(screenX, spikeTop); ctx.lineTo(screenX + 15, spikeTop - 10);
            ctx.lineTo(screenX + 30, spikeTop); ctx.lineTo(screenX + 45, spikeTop - 10);
            ctx.lineTo(screenX + 60, spikeTop); ctx.fill();
        }
    }
};

G.drawScrap = function (sc) {
    var ctx = G.ctx;
    var screenX = sc.x - G.cameraX; var screenY = sc.y - G.cameraY;
    if (G.drawAnimatedSprite(ctx, 'coin', screenX, screenY, sc.width, sc.height, 80)) return;
    // Procedural fallback
    ctx.save(); ctx.translate(screenX + 15, screenY + 15); ctx.rotate(Date.now() / 400);
    ctx.fillStyle = '#cccccc'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#888888'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
};

G.drawBoss = function () {
    var ctx = G.ctx;
    var boss = G.boss;
    if (!G.isBossLevel || !boss || boss.state === 'DEAD') return;

    var bx = boss.x - G.cameraX;
    var by = boss.y - G.cameraY;
    var blink = boss.state === 'STUNNED' && Math.floor(Date.now() / 100) % 2 === 0;

    if (!blink) {
        var bodyMain, bodyDark, bodyLight, eyeColor, eyeCharge, armColor, legColor, gearColor;
        if (boss.type === 'CRUSHER') {
            bodyMain = '#8B0000'; bodyDark = '#5c0000'; bodyLight = '#aa2020';
            eyeColor = '#ff4444'; eyeCharge = '#ff0'; armColor = '#6e0000'; legColor = '#4a0000'; gearColor = '#aa2020';
        } else if (boss.type === 'GUNNER') {
            bodyMain = '#1a3a5c'; bodyDark = '#0d1f33'; bodyLight = '#2a5a8c';
            eyeColor = '#44aaff'; eyeCharge = '#00ffff'; armColor = '#0d2a44'; legColor = '#091a2e'; gearColor = '#2a5a8c';
        } else {
            bodyMain = '#aa4400'; bodyDark = '#662200'; bodyLight = '#dd6600';
            eyeColor = '#ffaa00'; eyeCharge = '#ffff00'; armColor = '#883300'; legColor = '#552200'; gearColor = '#dd6600';
        }

        ctx.fillStyle = boss.state === 'CHARGE' ? bodyLight : bodyMain;
        ctx.fillRect(bx, by, boss.width, boss.height);
        ctx.fillStyle = bodyDark; ctx.fillRect(bx, by + boss.height - 15, boss.width, 15);
        ctx.fillStyle = bodyLight; ctx.fillRect(bx, by, boss.width, 8);

        var eyeBaseX = boss.facingRight ? bx + boss.width - 70 : bx + 20;
        ctx.fillStyle = boss.state === 'CHARGE' ? eyeCharge : eyeColor;
        ctx.beginPath(); ctx.arc(eyeBaseX, by + 60, 20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeBaseX + 40, by + 60, 16, 0, Math.PI * 2); ctx.fill();
        var pupilDir = boss.facingRight ? 5 : -5;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(eyeBaseX + pupilDir, by + 62, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeBaseX + 40 + pupilDir, by + 62, 6, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = armColor;
        var armY = by + boss.height / 2;
        if (boss.type === 'GUNNER') {
            ctx.fillRect(bx - 40, armY - 10, 45, 35); ctx.fillRect(bx + boss.width - 5, armY - 10, 45, 35);
            ctx.fillStyle = '#555'; ctx.fillRect(bx - 45, armY, 10, 15); ctx.fillRect(bx + boss.width + 35, armY, 10, 15);
        } else {
            ctx.fillRect(bx - 30, armY - 15, 35, 50); ctx.fillRect(bx + boss.width - 5, armY - 15, 35, 50);
        }

        ctx.fillStyle = legColor;
        ctx.fillRect(bx + 30, by + boss.height - 5, 40, 30);
        ctx.fillRect(bx + boss.width - 70, by + boss.height - 5, 40, 30);

        G.drawGear(boss.x + boss.width / 2, boss.y - 5, 25, Date.now() / 150, gearColor, 'rgba(0,0,0,0.8)');

        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(bx + 40, by + 110, boss.width - 80, 30);
        ctx.fillStyle = boss.type === 'INFERNO' ? '#ff8800' : '#ccc';
        for (var i = 0; i < 5; i++) { ctx.fillRect(bx + 50 + i * 22, by + 110, 10, 15); }

        if (boss.type === 'INFERNO' && boss.state !== 'STUNNED') {
            for (var i = 0; i < 3; i++) {
                var fx = bx + Math.random() * boss.width;
                var fy = by + boss.height - 20 - Math.random() * 30;
                ctx.fillStyle = 'rgba(255, ' + (100 + Math.floor(Math.random() * 100)) + ', 0, 0.6)';
                ctx.beginPath(); ctx.arc(fx, fy, 5 + Math.random() * 8, 0, Math.PI * 2); ctx.fill();
            }
        }
    }

    var hpBarWidth = boss.width + 40;
    var hpBarX = bx - 20;
    var hpBarY = by - 50;
    ctx.fillStyle = '#333'; ctx.fillRect(hpBarX, hpBarY, hpBarWidth, 20);
    var hpRatio = Math.max(0, boss.hp / boss.maxHP);
    var hpColor = boss.type === 'CRUSHER' ? '#e74c3c' : (boss.type === 'GUNNER' ? '#3498db' : '#e67e22');
    if (hpRatio <= 0.25) hpColor = '#c0392b';
    ctx.fillStyle = hpColor; ctx.fillRect(hpBarX + 2, hpBarY + 2, (hpBarWidth - 4) * hpRatio, 16);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, 20);
    ctx.fillStyle = 'white'; ctx.font = "bold 16px 'Press Start 2P', monospace"; ctx.textAlign = 'center';
    ctx.fillText(boss.hp + ' / ' + boss.maxHP, bx + boss.width / 2, hpBarY + 16);
};

G.drawPlayer = function (isMoving) {
    var ctx = G.ctx;
    var p = G.player;

    var drawFrame = p.frameIndex;
    var currentImg = G.images.idle; // Idle-sprite.png: 4 frames

    if (!p.grounded) {
        // Airborne: use Jump-sprite.png (5 frames)
        // 0=launch, 1=rising, 2=peak, 3=falling, 4=fast fall
        currentImg = G.images.jumpSheet;
        if (p.jumpPhaseTimer !== undefined && p.jumpPhaseTimer < 6) {
            drawFrame = 0; p.jumpPhaseTimer++;
        } else if (p.dy < -5) {
            drawFrame = 1; // rising fast
        } else if (p.dy < 0) {
            drawFrame = 2; // peak
        } else if (p.dy < 5) {
            drawFrame = 3; // falling
        } else {
            drawFrame = 4; // fast fall
        }
    } else {
        p.jumpPhaseTimer = undefined;
        if (isMoving) {
            // Running: use Run-Sheet.png (6 frames)
            currentImg = G.images.runSheet;
            drawFrame = p.frameIndex % 6;
        } else {
            // Idle: use Idle-sprite.png (4 frames)
            currentImg = G.images.idle;
            drawFrame = p.frameIndex % 4;
        }
    }

    ctx.save();
    var blinkOn = !p.isInvincible || (Math.floor(Date.now() / 150) % 2 === 0);

    if (p.isGolden && blinkOn) { ctx.shadowColor = 'gold'; ctx.shadowBlur = 30; }

    if (blinkOn && currentImg.complete && currentImg.naturalWidth > 0) {
        var frameWidth = 53;
        var frameHeight = 95;
        var sx = drawFrame * frameWidth;
        var sy = 0;

        var spriteScale = 1.0;
        var spr_offsetX = 0;
        var spr_offsetY = 0;

        var drawH = p.height * spriteScale;
        var drawW = (frameWidth / frameHeight) * drawH;

        var offsetX = (p.width - drawW) / 2 + spr_offsetX;
        var drawX = p.x - G.cameraX + offsetX;
        var drawY = p.y - G.cameraY + (p.height - drawH) + spr_offsetY;

        if (!p.facingRight) {
            ctx.scale(-1, 1);
            ctx.drawImage(currentImg, sx, sy, frameWidth, frameHeight, -drawX - drawW, drawY, drawW, drawH);
        } else {
            ctx.drawImage(currentImg, sx, sy, frameWidth, frameHeight, drawX, drawY, drawW, drawH);
        }
    }
    ctx.restore();
};

G.drawParticles = function () {
    var ctx = G.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < G.particles.length; i++) {
        var pt = G.particles[i];
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        var sx = pt.x - G.cameraX;
        var sy = pt.y - G.cameraY;
        if (pt.type === 'circle' || pt.type === 'dust' || pt.type === 'spark') {
            ctx.beginPath(); ctx.arc(sx, sy, pt.size, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillRect(sx - pt.size / 2, sy - pt.size / 2, pt.size, pt.size);
        }
    }
    ctx.restore();
};

G.drawBullets = function () {
    var ctx = G.ctx;
    for (var i = 0; i < G.bullets.length; i++) {
        var b = G.bullets[i];
        var bx = b.x - G.cameraX; var by = b.y - G.cameraY;

        // Try tileset — pick frame by rotation angle from velocity
        if (G._tilesetReady && G.tilesetRows.bullet !== undefined) {
            var angle = Math.atan2(b.vy, b.vx);
            var totalFrames = G.getTileCount(G.tilesetRows.bullet);
            var frame = Math.round(((angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * totalFrames) % totalFrames;
            G.drawSprite(ctx, 'bullet', bx - b.width / 2, by - b.height / 2, b.width, b.height, frame);
            continue;
        }

        // Procedural fallback
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255, 150, 0, 0.4)';
        ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
};

G.renderWorld = function (isMoving) {
    var ctx = G.ctx;

    if (!G.drawBgCover(G.images.factoryBg)) {
        ctx.fillStyle = '#5c8fb3'; ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);
    }

    ctx.save();
    if (G.screenShake > 0) {
        var sx = (Math.random() - 0.5) * G.screenShake;
        var sy = (Math.random() - 0.5) * G.screenShake;
        ctx.translate(sx, sy);
    }

    // Air tiles (background layer)
    for (var i = 0; i < G.platforms.length; i++) {
        if (G.platforms[i].type === 'air') G.drawAir(G.platforms[i]);
    }

    // Solid platforms
    for (var i = 0; i < G.platforms.length; i++) {
        var p = G.platforms[i];
        if (p.type === 'air') continue;
        if (p.type === 'box') { G.drawBoxPlatform(p); }
        else if (p.type === 'fragile') { G.drawFragilePlatform(p); }
        else if (p.type === 'vent') { G.drawVentPlatform(p); }
        else if (p.type === 'brick') { G.drawBrick(p); }
        else if (p.type === 'qblock') { G.drawQBlock(p); }
        else if (p.type === 'gear') { p.angle += p.speed; G.drawGear(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, p.angle, p.color); }
        else if (p.type === 'conveyor') { G.drawConveyorPlatform(p); }
        else if (p.type === 'spring') { G.drawSpring(p); }
    }

    for (var i = 0; i < G.stars.length; i++) {
        if (!G.stars[i].collected) G.drawStar(G.stars[i].x + 20, G.stars[i].y + 20, 5, 20, 10);
    }
    G.turrets.forEach(G.drawTurret);
    G.traps.forEach(G.drawTrap);
    G.rcs.forEach(G.drawRC);
    G.drones.forEach(G.drawDrone);
    G.sawblades.forEach(G.drawSawblade);
    G.lasers.forEach(G.drawLaser);

    for (var i = 0; i < G.scraps.length; i++) {
        if (!G.scraps[i].collected) G.drawScrap(G.scraps[i]);
    }

    ctx.fillStyle = '#777'; ctx.fillRect(G.flag.x - G.cameraX, G.flag.y - G.cameraY, 10, G.flag.height);
    ctx.fillStyle = '#32a852'; ctx.fillRect(G.flag.x - G.cameraX + 10, G.flag.y - G.cameraY, G.flag.width, 40);

    G.drawBoss();

    if (G.isBossLevel && G.boss && G.boss.hp > 0) {
        ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.font = "bold 50px 'Press Start 2P', monospace";
        ctx.fillText('\u2694 ' + G.boss.name + ' \u2694', G.canvas.width / 2, 80);
    }

    G.drawBullets();
    G.drawPlayer(isMoving);
    G.drawParticles();

    if (G.debugHitboxes) G.drawHitboxes();
    if (G.debugFov) G.drawFovCones();
    if (G.debugTrajectory) G.drawTrajectories();

    ctx.restore(); // screenShake
};

G.drawFovCones = function () {
    var ctx = G.ctx;

    function drawCone(entity, color) {
        if (!entity.fovRange || entity._facingAngle === undefined) return;
        var cx = entity.x + entity.width / 2 - G.cameraX;
        var cy = entity.y + entity.height / 2 - G.cameraY;
        var angle = entity._facingAngle;
        var half = entity.fovAngle;
        var range = entity.fovRange;

        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, range, angle - half, angle + half);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, range, angle - half, angle + half);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    for (var i = 0; i < G.turrets.length; i++) drawCone(G.turrets[i], '#ff4444');
    for (var i = 0; i < G.rcs.length; i++) drawCone(G.rcs[i], '#ff8800');
    for (var i = 0; i < G.drones.length; i++) drawCone(G.drones[i], '#4488ff');
};

G.drawTrajectories = function () {
    var ctx = G.ctx;
    var p = G.player;
    var pcx = p.x + p.width / 2 - G.cameraX;
    var pcy = p.y + p.height / 2 - G.cameraY;

    for (var i = 0; i < G.turrets.length; i++) {
        var t = G.turrets[i];
        if (!t._bulletPath || t._bulletPath.length < 2) continue;

        // Arc line
        ctx.save();
        ctx.strokeStyle = 'rgba(255,100,0,0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(t._bulletPath[0].x - G.cameraX, t._bulletPath[0].y - G.cameraY);
        for (var j = 1; j < t._bulletPath.length; j++) {
            ctx.lineTo(t._bulletPath[j].x - G.cameraX, t._bulletPath[j].y - G.cameraY);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Target crosshair at player
        ctx.strokeStyle = 'rgba(255,50,0,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pcx - 10, pcy); ctx.lineTo(pcx + 10, pcy);
        ctx.moveTo(pcx, pcy - 10); ctx.lineTo(pcx, pcy + 10);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(pcx, pcy, 15, 0, Math.PI * 2); ctx.stroke();

        ctx.restore();
    }
};

G.drawHitboxes = function () {
    var ctx = G.ctx;
    ctx.lineWidth = 2;

    // Draw body shape based on entity's .shape property
    function drawBody(e, color) {
        ctx.strokeStyle = color;
        var body = G.Collision.getBody(e);
        if (body.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(body.cx - G.cameraX, body.cy - G.cameraY, body.radius, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.strokeRect(body.x - G.cameraX, body.y - G.cameraY, body.w, body.h);
        }
    }

    // Player
    drawBody(G.player, '#00ff00');

    // Platforms
    for (var i = 0; i < G.platforms.length; i++) {
        var p = G.platforms[i];
        drawBody(p, '#ffff00');
    }

    // Enemies
    for (var i = 0; i < G.rcs.length; i++) drawBody(G.rcs[i], '#ff0000');
    for (var i = 0; i < G.turrets.length; i++) drawBody(G.turrets[i], '#ff0000');
    for (var i = 0; i < G.drones.length; i++) drawBody(G.drones[i], '#ff0000');
    for (var i = 0; i < G.sawblades.length; i++) drawBody(G.sawblades[i], '#ff0000');

    // Traps (active hitbox)
    for (var i = 0; i < G.traps.length; i++) {
        var tr = G.traps[i];
        if (tr.height > 5) {
            var trapTop = tr.y - tr.height;
            ctx.strokeStyle = '#ff4400';
            ctx.strokeRect(tr.x - G.cameraX, trapTop - G.cameraY, tr.width, tr.height);
        }
    }

    // Lasers (beam when ON)
    for (var i = 0; i < G.lasers.length; i++) {
        var l = G.lasers[i];
        drawBody(l, '#ff00ff');
        if (l.state === 'ON') {
            ctx.strokeStyle = 'rgba(255,0,255,0.3)';
            ctx.strokeRect(l.x + 10 - G.cameraX, l.y + l.height - G.cameraY, l.width - 20, G.canvas.height + 2000);
        }
    }

    // Bullets
    for (var i = 0; i < G.bullets.length; i++) drawBody(G.bullets[i], '#ff8800');

    // Collectibles
    for (var i = 0; i < G.scraps.length; i++) {
        if (!G.scraps[i].collected) drawBody(G.scraps[i], '#00ffff');
    }
    for (var i = 0; i < G.stars.length; i++) {
        if (!G.stars[i].collected) drawBody(G.stars[i], '#00ffff');
    }

    // Flag
    drawBody(G.flag, '#32a852');

    // Boss
    if (G.isBossLevel && G.boss && G.boss.state !== 'DEAD') {
        drawBody(G.boss, '#ff0044');
    }
};
