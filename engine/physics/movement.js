G.updateMovement = function () {
    var p = G.player;
    var isMoving = false;

    p.lastX = p.x;
    p.lastY = p.y;

    // NoClip a moveSpeed bonus smazány. Rychlost je teď vždy standardní.
    var moveSpeed = p.speed;

    if (G.keys.ArrowLeft || G.keys.a) { p.x -= moveSpeed; p.facingRight = false; isMoving = true; }
    if (G.keys.ArrowRight || keys.d) { p.x += moveSpeed; p.facingRight = true; isMoving = true; }

    // BLOK PRO NOCLIP (LÉTÁNÍ) SMAZÁN

    if (p.grounded) {
        if (isMoving) {
            p.animTimer++;
            if (p.animTimer > p.animSpeed * 1.5) {
                p.frameIndex++;
                if (p.frameIndex >= 6) p.frameIndex = 0;
                p.animTimer = 0;
            }
        } else {
            p.animTimer++;
            if (p.animTimer > p.animSpeed * 1.5) {
                p.frameIndex++;
                if (p.frameIndex >= 4) p.frameIndex = 0;
                p.animTimer = 0;
            }
        }
    }

    // Gravitace teď působí za všech okolností (podmínka !noclip smazána)
    p.dy += G.gravity;
    p.y += p.dy;
    p.grounded = false;

    return isMoving;
};

G.updateCamera = function () {
    var p = G.player;

    if (p.x < 0) p.x = 0;
    if (p.x + p.width > G.mapEnd) p.x = G.mapEnd - p.width;

    // Smazány debug kontroly. Pád pod úroveň kamery teď zabije každého.
    if (p.y > G.cameraY + G.canvas.height + 400) {
        G.playSound(G.audio.gameover); G.gameState = 'GAMEOVER_INPUT';
    }

    var targetCameraX = p.x > G.canvas.width / 2 ? p.x - G.canvas.width / 2 : G.cameraX;
    if (targetCameraX > G.mapEnd - G.canvas.width) targetCameraX = G.mapEnd - G.canvas.width;
    G.cameraX += (targetCameraX - G.cameraX) * 0.1;

    var targetCameraY = p.y - G.canvas.height / 2 + p.height / 2;
    G.cameraY += (targetCameraY - G.cameraY) * 0.08;

    // Logika debug nesmrtelnosti (God Mode) smazána. 
    // Zůstává pouze standardní odpočet po zásahu nepřítelem.
    if (p.invincibleTimer > 0) {
        p.invincibleTimer--;
    } else {
        p.isInvincible = false;
    }

    if (p.x > G.maxDistance) G.maxDistance = p.x;
};
