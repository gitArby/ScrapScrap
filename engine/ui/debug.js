G.drawDebugPanel = function () {
    var ctx = G.ctx;
    var p = G.player;

    var toggles = [
        { label: 'HITBOXY', key: 'debugHitboxes' },
        { label: 'FPS', key: 'debugFps' },
        { label: 'ENTITIES', key: 'debugEntityCount' },
        { label: 'FOV', key: 'debugFov' },
        { label: 'CANNON ARC', key: 'debugTrajectory' }
    ];

    var btnW = 280;
    var btnH = 36;
    var gap = 6;
    var panelW = btnW + 30;
    var panelH = 50 + toggles.length * (btnH + gap) + 60;
    var panelX = G.canvas.width - panelW - 20;
    var panelY = 20;

    // Panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title
    ctx.fillStyle = '#ff4400';
    ctx.font = "bold 12px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DEBUG [F8]', panelX + panelW / 2, panelY + 22);

    // Toggles
    var startY = panelY + 44;
    for (var i = 0; i < toggles.length; i++) {
        var t = toggles[i];
        var bx = panelX + 15;
        var by = startY + i * (btnH + gap);
        var on = G[t.key];
        var hover = G.mouse.x > bx && G.mouse.x < bx + btnW && G.mouse.y > by && G.mouse.y < by + btnH;

        ctx.fillStyle = on ? (hover ? '#44cc44' : '#228822') : (hover ? '#663333' : '#442222');
        ctx.fillRect(bx, by, btnW, btnH);
        ctx.strokeStyle = on ? '#44ff44' : '#ff4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, btnW, btnH);

        ctx.fillStyle = on ? '#44ff44' : '#ff6666';
        ctx.font = "bold 10px 'Press Start 2P', monospace";
        ctx.textAlign = 'left';
        ctx.fillText(t.label, bx + 8, by + btnH / 2);

        ctx.textAlign = 'right';
        ctx.fillStyle = on ? '#00ff00' : '#ff0000';
        ctx.fillText(on ? 'ON' : 'OFF', bx + btnW - 8, by + btnH / 2);

        if (hover && G.mouse.clicked) {
            G.mouse.clicked = false;
            G[t.key] = !G[t.key];
        }
    }

    // Live stats
    var statsY = startY + toggles.length * (btnH + gap) + 8;
    ctx.fillStyle = '#888';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.textAlign = 'left';
    ctx.fillText('POS: ' + Math.floor(p.x) + ', ' + Math.floor(p.y), panelX + 15, statsY);
    ctx.fillText('VEL: ' + p.dy.toFixed(1) + '  HP: ' + p.lives, panelX + 15, statsY + 14);
    ctx.fillText(G.gameState + '  LVL ' + G.currentLevel, panelX + 15, statsY + 28);
};
