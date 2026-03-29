(function () {
    G.loadAssets(function () {
        requestAnimationFrame(gameLoop);
    });

    function gameLoop(timestamp) {
        requestAnimationFrame(gameLoop);
        var deltaTime = timestamp - G.lastTime;
        if (deltaTime > G.interval) {
            G.lastTime = timestamp - (deltaTime % G.interval);
            update();
        }
    }

    function update() {
        G.ctx.clearRect(0, 0, G.canvas.width, G.canvas.height);

        if (G.gameState === 'MENU') {
            G.drawMenu();
        }
        else if (G.gameState === 'SETTINGS') {
            G.drawSettings();
        }
        else if (G.gameState === 'CREDITS') {
            G.drawCredits();
        }
        else if (G.gameState === 'GAMEOVER_INPUT') {
            G.drawGameOverInput();
        }
        else if (G.gameState === 'LEADERBOARD') {
            G.drawLeaderboard();
        }
        else if (G.gameState === 'VICTORY') {
            G.drawVictory();
        }
        else if (G.gameState === 'PLAYING' || G.gameState === 'PAUSED') {
            var isMoving = false;

            if (G.gameState === 'PLAYING') {
                if (G.keys.Escape) { G.gameState = 'PAUSED'; G.keys.Escape = false; }
                isMoving = G.updatePlaying();
                G.updateTweens();
            }

            G.renderWorld(isMoving);
            G.drawHUD();

            if (G.debugFps) G.drawFpsCounter();
            if (G.debugEntityCount) G.drawEntityCount();

            if (G.gameState === 'PAUSED') {
                G.drawPause();
            }
        }

        if (G.debugPanel) G.drawDebugPanel();
    }
})();
