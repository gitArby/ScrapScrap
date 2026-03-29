// Player movement, gravity, camera, wall slide, invincibility

G.updateMovement = function () {
    var p = G.player;
    var isMoving = false;

    p.lastX = p.x;
    p.lastY = p.y;

    var noclip = G.debugNoClip;
    var moveSpeed = noclip ? p.speed * 2 : p.speed;

    if (G.keys.ArrowLeft || G.keys.a) { p.x -= moveSpeed; p.facingRight = false; isMoving = true; }
    if (G.keys.ArrowRight || G.keys.d) { p.x += moveSpeed; p.facingRight = true; isMoving = true; }

    if (noclip) {
        if (G.keys.ArrowUp || G.keys.w || G.keys[' ']) p.y -= moveSpeed;
        p.dy = 0;
        p.grounded = true;
    }

    if (p.grounded) {
        if (isMoving) {
            // Run-Sheet: 6 frames
            p.animTimer++;
            if (p.animTimer > p.animSpeed * 1.5) {
                p.frameIndex++;
                if (p.frameIndex >= 6) p.frameIndex = 0;
                p.animTimer = 0;
            }
        } else {
            // Idle-sprite: 4 frames
            p.animTimer++;
            if (p.animTimer > p.animSpeed * 1.5) {
                p.frameIndex++;
                if (p.frameIndex >= 4) p.frameIndex = 0;
                p.animTimer = 0;
            }
        }
    }

    if (!noclip) {
        p.dy += G.gravity;
        p.y += p.dy;
        p.grounded = false;
    }

    return isMoving;
};

G.updateWallSlide = function () {
    var p = G.player;
    if (p.wallSliding && !p.grounded) {
        var holdingTowardWall = (p.wallDir === -1 && (G.keys.ArrowRight || G.keys.d)) ||
                                (p.wallDir === 1 && (G.keys.ArrowLeft || G.keys.a));
        if (holdingTowardWall) {
            p.dy = 0;
            p.wallGrabbing = true;
        } else {
            p.dy = Math.min(p.dy, 3);
            p.wallGrabbing = false;
        }
        p.jumpCount = 1;
    } else {
        p.wallSliding = false;
        p.wallGrabbing = false;
    }
};

G.updateCamera = function () {
    var p = G.player;

    if (p.x < 0) p.x = 0;
    if (p.x + p.width > G.mapEnd) p.x = G.mapEnd - p.width;

    if (!G.debugNoClip && !G.debugGodMode && p.y > G.cameraY + G.canvas.height + 400) {
        G.playSound(G.audio.gameover); G.gameState = 'GAMEOVER_INPUT';
    }

    var targetCameraX = p.x > G.canvas.width / 2 ? p.x - G.canvas.width / 2 : G.cameraX;
    if (targetCameraX > G.mapEnd - G.canvas.width) targetCameraX = G.mapEnd - G.canvas.width;
    G.cameraX += (targetCameraX - G.cameraX) * 0.1;

    var targetCameraY = p.y - G.canvas.height / 2 + p.height / 2;
    G.cameraY += (targetCameraY - G.cameraY) * 0.08;

    if (G.debugGodMode) { p.isInvincible = true; }
    else if (p.invincibleTimer > 0) { p.invincibleTimer--; } else { p.isInvincible = false; }

    if (p.x > G.maxDistance) G.maxDistance = p.x;
};
