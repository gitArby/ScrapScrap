const G = {
    canvas: document.getElementById('gameCanvas'),
    ctx: null,

    gameState: 'MENU',

    lastTime: 0,
    fps: 60,
    interval: 1000 / 60,

    gravity: 1.2,
    cameraX: 0,
    cameraY: 0,

    currentLevel: 1,
    totalScore: 0,
    maxDistance: 0,
    bonusScore: 0,
    scrapsCollected: 0,
    coinsThisLevel: 0,
    gameStartTime: Date.now(),

    particles: [],
    screenShake: 0,

    platforms: [],
    stars: [],
    turrets: [],
    rcs: [],
    drones: [],
    bullets: [],
    traps: [],
    scraps: [],
    lasers: [],
    sawblades: [],
    mapEnd: 15000,
    flag: { x: 0, y: 0, width: 60, height: 200 },

    isBossLevel: false,
    boss: null,

    debugPanel: false,
    debugHitboxes: false,
    debugFps: false,
    debugEntityCount: false,
    debugFov: false,
    debugTrajectory: false,
    _fpsFrames: 0,
    _fpsLast: 0,
    _fpsCurrent: 0,

    player: {
        x: 100, y: 500, lastY: 500, width: 45, height: 80,
        speed: 10, dy: 0, jumpForce: 22, grounded: false, jumpCount: 0, facingRight: true, frameIndex: 0, animTimer: 0, animSpeed: 5,
        isBig: false, isGolden: false, lives: 1, isInvincible: false, invincibleTimer: 0,
        wallSliding: false, wallDir: 0, wallGrabbing: false
    }
};

G.ctx = G.canvas.getContext('2d');
G.canvas.width = 1920;
G.canvas.height = 1080;

function resizeCanvas() {
    const windowRatio = window.innerWidth / window.innerHeight;
    const targetHeight = 1080;
    const targetWidth = Math.max(targetHeight * windowRatio, 800);

    G.canvas.width = targetWidth;
    G.canvas.height = targetHeight;

    G.canvas.style.width = window.innerWidth + 'px';
    G.canvas.style.height = window.innerHeight + 'px';
    G.canvas.style.position = 'absolute';
    G.canvas.style.left = '0';
    G.canvas.style.top = '0';
    G.canvas.style.transform = 'none';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Decode obfuscated config values
G._xd = function (hex) {
    var k = atob(G.config._k);
    var r = '';
    for (var i = 0; i < hex.length; i += 2) {
        r += String.fromCharCode(parseInt(hex.substr(i, 2), 16) ^ k.charCodeAt((i / 2) % k.length));
    }
    return r;
};

// Cash in coins: coins * level → added to bonusScore
G.cashInCoins = function () {
    var earned = G.coinsThisLevel * G.currentLevel;
    G.bonusScore += earned;
    G.coinsThisLevel = 0;
    return earned;
};

G.spawnParticles = function (x, y, count, color, type) {
    if (type === undefined) type = 'square';
    for (let i = 0; i < count; i++) {
        G.particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 1) * 15,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.04,
            color: color,
            type: type,
            size: 3 + Math.random() * 8
        });
    }
};
