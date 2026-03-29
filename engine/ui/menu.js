G.drawMenu = function () {
    var ctx = G.ctx;
    if (!G.drawBgCover(G.images.menuBg)) { ctx.fillStyle = '#2e1e12'; ctx.fillRect(0, 0, G.canvas.width, G.canvas.height); }

    var cx = G.canvas.width / 2;
    var cy = G.canvas.height / 2;

    G.drawBtn("HRÁT", cx - 175, cy - 180, 350, 70, function () {
        G.gameState = 'PLAYING'; G.restartLevel(true); G.playMusic();
    });
    G.drawBtn("LEADERBOARD", cx - 175, cy - 90, 350, 70, function () {
        G.gameState = 'LEADERBOARD';
    }, 'steel');
    G.drawBtn("NASTAVENÍ", cx - 175, cy, 350, 70, function () {
        G.gameState = 'SETTINGS';
    }, 'steel');
    G.drawBtn("CREDITS", cx - 175, cy + 90, 350, 70, function () {
        G.gameState = 'CREDITS';
    }, 'steel');
    G.drawBtn("DEMO", cx - 175, cy + 180, 350, 70, function () {
        G.gameState = 'PLAYING';
        G.currentLevel = 1; G.totalScore = 0; G.scrapsCollected = 0;
        G.player.isBig = false; G.player.isGolden = false; G.player.lives = 1;
        G.gameStartTime = Date.now();
        G.isBossLevel = false; G.boss = null; G.mapEnd = 12000;
        G.generateDemoLevel();
        G.player.x = 100; G.player.y = 500; G.player.dy = 0;
        G.player.width = 45; G.player.height = 80; G.player.jumpForce = 22;
        G.player.isInvincible = false; G.player.invincibleTimer = 0; G.player.jumpCount = 0;
        G.cameraX = 0; G.cameraY = 0; G.maxDistance = 0; G.bonusScore = 0;
        G.playMusic();
    }, 'danger');
};
