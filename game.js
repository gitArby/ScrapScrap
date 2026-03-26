const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1920;
canvas.height = 1080;

function resizeCanvas() {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    canvas.style.width = (1920 * scale) + 'px';
    canvas.style.height = (1080 * scale) + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let gameState = 'MENU';

let lastTime = 0;
const fps = 60;
const interval = 1000 / fps;

// ---------------------------------------------------------
// 1. OBRÁZKY A ASSET LOADING
// ---------------------------------------------------------
let assetsLoaded = 0;
const totalAssets = 7;

function assetLoaded() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        requestAnimationFrame(gameLoop);
    }
}

// --- AUDIO ---
const gameMusic = new Audio('music.mp3');
gameMusic.loop = true;
gameMusic.volume = 0.08;

const jumpSound = new Audio('jump.mp3');
jumpSound.volume = 0.2;

const damageSound = new Audio('damage.mp3');
damageSound.volume = 0.3;

const gameOverSound = new Audio('gameover.mp3');
gameOverSound.volume = 0.4;

function stopMusic() {
    gameMusic.pause();
    gameMusic.currentTime = 0;
}

const menuBg = new Image();
menuBg.src = 'menu.png';
menuBg.onload = assetLoaded;

const factoryBg = new Image();
factoryBg.src = 'factory.png';
factoryBg.onload = assetLoaded;

const runFrames = [];
for (let i = 1; i <= 5; i++) {
    let img = new Image();
    img.src = 'run' + i + '.png';
    img.onload = assetLoaded;
    runFrames.push(img);
}

// ---------------------------------------------------------
// 2. HRÁČ, MYŠ A SKÓRE
// ---------------------------------------------------------
const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, a: false, d: false, w: false, ' ': false, Escape: false, Enter: false };

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;

    if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && gameState === 'PLAYING') {
        if (player.grounded) {
            player.dy = -player.jumpForce;
            player.grounded = false;
            player.jumpCount = 1;
            jumpSound.currentTime = 0;
            jumpSound.play();
        } else if (player.jumpCount < 2) {
            player.dy = -player.jumpForce * 0.8;
            player.jumpCount = 2;
            jumpSound.currentTime = 0;
            jumpSound.play();
        }
    }
});

window.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

const mouse = { x: 0, y: 0, clicked: false };
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouse.x = (e.clientX - rect.left) * scaleX;
    mouse.y = (e.clientY - rect.top) * scaleY;
});
window.addEventListener('mousedown', () => { mouse.clicked = true; });
window.addEventListener('mouseup', () => { mouse.clicked = false; });

let player = {
    x: 100, y: 500, lastY: 500, width: 80, height: 80,
    speed: 10, dy: 0, jumpForce: 22, grounded: false, jumpCount: 0, facingRight: true, frameIndex: 0, animTimer: 0, animSpeed: 5,
    isBig: false, isGolden: false, lives: 1, isInvincible: false, invincibleTimer: 0
};

const gravity = 1.2;
let cameraX = 0;

let currentLevel = 1;
let totalScore = 0;
let maxDistance = 0;
let bonusScore = 0;
let scrapsCollected = 0;

function takeDamage() {
    if (player.isGolden) {
        damageSound.currentTime = 0;
        damageSound.play();
        player.lives = 2;
        player.isGolden = false;
        player.isInvincible = true;
        player.invincibleTimer = 120;
    } else if (player.lives >= 2) {
        damageSound.currentTime = 0;
        damageSound.play();
        player.lives = 1;
        player.width = 80;
        player.height = 80;
        player.y += 40;
        player.isBig = false;
        player.isGolden = false;
        player.isInvincible = true;
        player.invincibleTimer = 120;
    } else {
        gameOverSound.currentTime = 0;
        gameOverSound.play();
        gameState = 'GAMEOVER';
    }
}

// ---------------------------------------------------------
// 3. PROCEDURÁLNÍ GENERÁTOR LEVELU
// ---------------------------------------------------------
let platforms = [];
let stars = [];
let turrets = [];
let stompers = [];
let drones = [];
let bullets = [];
let traps = [];
let scraps = [];
let mapEnd = 15000;
let flag = { x: 0, y: 0, width: 60, height: 200 };

function generateLevel() {
    platforms = []; stars = []; turrets = []; stompers = []; drones = []; bullets = []; traps = []; scraps = [];

    let gapMultiplier = Math.min(1.5, 1 + (currentLevel * 0.05));
    let heightMultiplier = Math.min(2.0, 1 + (currentLevel * 0.1));
    // ZVÝŠENÁ ŠANCE NA NEPŘÁTELE (Základ 48 % místo 33 %, maximum 90 %)
    let enemyDensity = Math.min(0.9, 0.40 + (currentLevel * 0.08));

    platforms.push({ type: 'box', x: 0, y: 850, width: 800, height: 300 });
    let currentX = 900;
    let currentY = 850;

    while (currentX < mapEnd - 1500) {
        let gap = (80 + Math.random() * 100) * gapMultiplier;
        let yOffset = ((Math.random() * 160) - 80) * heightMultiplier;
        currentY += yOffset;

        if (currentY > 950) currentY = 950;
        if (currentY < 400) currentY = 400;

        currentX += gap;
        let isGear = Math.random() < 0.45;

        if (isGear) {
            let radius = 100 + Math.random() * 150;
            let gearSpeed = (Math.random() * 0.03) + 0.015 + (currentLevel * 0.002);
            if (Math.random() < 0.5) gearSpeed *= -1;
            let colors = ['#a67b5b', '#8a5c3a', '#5c3a21'];
            let color = colors[Math.floor(Math.random() * colors.length)];
            platforms.push({ type: 'gear', x: currentX, y: currentY - radius, width: radius * 2, height: radius * 2, angle: 0, speed: gearSpeed, color: color });

            if (Math.random() < 0.5) {
                scraps.push({ x: currentX + radius - 15, y: currentY - radius - 60, width: 30, height: 30, collected: false });
            }
            currentX += radius * 2;
        } else {
            let width = 250 + Math.random() * 400;
            let height = 40 + Math.random() * 100;

            let randType = Math.random();
            let pType = 'box';
            if (randType < 0.15) pType = 'fragile';
            else if (randType < 0.30) pType = 'vent';

            if (pType === 'box') {
                platforms.push({ type: 'box', x: currentX, y: currentY, width: width, height: height });
            } else if (pType === 'fragile') {
                platforms.push({ type: 'fragile', x: currentX, y: currentY, width: width, height: height, state: 'IDLE', timer: 0 });
            } else if (pType === 'vent') {
                platforms.push({ type: 'vent', x: currentX, y: currentY, width: width, height: height });
            }

            if (width > 300 && pType === 'box' && Math.random() < 0.6) {
                let numBlocks = Math.floor(Math.random() * 4) + 1;
                let blockWidth = 60;
                let startBlockX = currentX + width / 2 - (numBlocks * blockWidth) / 2;

                for (let i = 0; i < numBlocks; i++) {
                    if (Math.random() < 0.35) {
                        platforms.push({ type: 'qblock', x: startBlockX + i * blockWidth, y: currentY - 200, width: blockWidth, height: blockWidth, hit: false });
                    } else {
                        platforms.push({ type: 'brick', x: startBlockX + i * blockWidth, y: currentY - 200, width: blockWidth, height: blockWidth, destroyed: false });
                    }
                }
            }

            if (Math.random() < 0.7) {
                let numScraps = Math.floor(width / 70);
                for (let i = 0; i < numScraps; i++) {
                    scraps.push({ x: currentX + 30 + i * 70, y: currentY - 60, width: 30, height: 30, collected: false });
                }
            }

            // ROZDĚLENÍ NEPŘÁTEL PŘI ÚSPĚŠNÉM GENERÁTORU
            if (width > 350 && pType === 'box') {
                if (Math.random() < enemyDensity) {
                    let enemyType = Math.random();
                    if (enemyType < 0.25) { // 25 % Dupáček
                        stompers.push({
                            x: currentX + width / 2, y: currentY - 90, width: 90, height: 90,
                            startX: currentX + 20, endX: currentX + width - 110,
                            speed: 2 + Math.random() * 1.5, chargeSpeed: 7 + Math.random() * 3,
                            facingRight: false, state: 'PATROL', timer: 0
                        });
                    } else if (enemyType < 0.50) { // 25 % Věž
                        turrets.push({
                            x: currentX + width / 2 - 30, y: currentY - 60, width: 60, height: 60,
                            timer: 0, shootInterval: Math.max(30, 60 + Math.random() * 80 - (currentLevel * 5))
                        });
                    } else if (enemyType < 0.70) { // 20 % Pístová drtička
                        traps.push({
                            x: currentX + width / 2 - 30, y: currentY, width: 60, height: 0, maxHeight: 110,
                            state: 'HIDDEN', timer: Math.floor(Math.random() * 100)
                        });
                    } else { // 30 % Létající Dron (mírně zvýšena šance na drony)
                        drones.push({
                            x: currentX + width / 2,
                            y: currentY - 250 - Math.random() * 150,
                            width: 60, height: 60,
                            speed: 1.5 + Math.random() + (currentLevel * 0.2),
                            timer: 0,
                            shootInterval: Math.max(50, 90 + Math.random() * 60 - (currentLevel * 5)),
                            hoverOffset: Math.random() * Math.PI * 2
                        });
                    }
                }
            }

            if (Math.random() < 0.1) {
                stars.push({ x: currentX + width / 2 - 20, y: currentY - 150, width: 40, height: 40, collected: false });
            }
            currentX += width;
        }
    }

    platforms.push({ type: 'box', x: mapEnd - 1000, y: 750, width: 1200, height: 400 });
    flag = { x: mapEnd - 400, y: 550, width: 60, height: 200 };
}

generateLevel();

function restartLevel(fullReset = true) {
    if (fullReset) {
        currentLevel = 1;
        totalScore = 0;
        scrapsCollected = 0;
        player.isBig = false;
        player.isGolden = false;
        player.lives = 1;
    }

    generateLevel();
    player.x = 100; player.y = 500; player.dy = 0;

    player.width = player.isBig ? 120 : 80;
    player.height = player.isBig ? 120 : 80;
    player.jumpForce = player.isBig ? 25 : 22;

    player.isInvincible = false; player.invincibleTimer = 0; player.jumpCount = 0;
    cameraX = 0; maxDistance = 0; bonusScore = 0;
}

// ---------------------------------------------------------
// 4. POMOCNÉ KRESLÍCÍ FUNKCE A UI
// ---------------------------------------------------------
function drawBtn(text, x, y, w, h, action) {
    let hover = mouse.x > x && mouse.x < x + w && mouse.y > y && mouse.y < y + h;
    ctx.fillStyle = hover ? '#ebc49f' : '#bc8a5f';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#8a5c3a'; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = hover ? '#1a110a' : 'white';
    ctx.font = 'bold 35px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
    if (hover && mouse.clicked) { mouse.clicked = false; action(); }
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3; let step = Math.PI / spikes; ctx.beginPath(); ctx.moveTo(cx - cameraX, cy - outerRadius);
    for (let i = 0; i < spikes; i++) { ctx.lineTo((cx - cameraX) + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius); rot += step; ctx.lineTo((cx - cameraX) + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius); rot += step; }
    ctx.closePath(); ctx.fillStyle = 'gold'; ctx.fill();
}

function drawGear(gx, gy, radius, angle, color, strokeColor = 'rgba(0,0,0,0.6)') {
    ctx.save(); ctx.translate(gx - cameraX, gy); ctx.rotate(angle); ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    for (let i = 0; i < 12; i++) {
        ctx.save(); ctx.rotate((i * Math.PI) / 6); ctx.fillRect(-radius / 8, -radius - (radius / 6), radius / 4, radius / 3); ctx.restore();
    }
    ctx.fillStyle = strokeColor; ctx.beginPath(); ctx.arc(0, 0, radius / 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawBoxPlatform(p) {
    let screenX = p.x - cameraX;
    ctx.fillStyle = '#bc8a5f'; ctx.fillRect(screenX, p.y, p.width, p.height);
    ctx.fillStyle = '#ebc49f'; ctx.fillRect(screenX, p.y, p.width, 5);
    ctx.fillStyle = '#8a5c3a'; ctx.fillRect(screenX, p.y + p.height - 10, p.width, 10);
    if (p.width > 20 && p.height > 20) {
        ctx.fillStyle = '#6e4a2d'; ctx.beginPath();
        ctx.arc(screenX + 15, p.y + 15, 5, 0, Math.PI * 2); ctx.arc(screenX + p.width - 15, p.y + 15, 5, 0, Math.PI * 2);
        if (p.height > 30) { ctx.arc(screenX + 15, p.y + p.height - 20, 5, 0, Math.PI * 2); ctx.arc(screenX + p.width - 15, p.y + p.height - 20, 5, 0, Math.PI * 2); }
        ctx.fill();
    }
}

function drawFragilePlatform(p) {
    let screenX = p.x - cameraX;
    if (p.state === 'SHAKING') screenX += (Math.random() * 6 - 3);

    ctx.fillStyle = '#8c3b21'; ctx.fillRect(screenX, p.y, p.width, p.height);
    ctx.fillStyle = '#b55a35'; ctx.fillRect(screenX, p.y, p.width, 5);
    ctx.fillStyle = '#5c2210'; ctx.fillRect(screenX, p.y + p.height - 10, p.width, 10);

    ctx.strokeStyle = '#3d1407'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(screenX + 20, p.y); ctx.lineTo(screenX + 30, p.y + 20); ctx.lineTo(screenX + 25, p.y + p.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(screenX + p.width - 30, p.y); ctx.lineTo(screenX + p.width - 40, p.y + 15); ctx.stroke();
}

function drawVentPlatform(p) {
    let screenX = p.x - cameraX;
    ctx.fillStyle = '#4a555c'; ctx.fillRect(screenX, p.y, p.width, p.height);
    ctx.fillStyle = '#788891'; ctx.fillRect(screenX, p.y, p.width, 5);
    ctx.fillStyle = '#262d30'; ctx.fillRect(screenX, p.y + p.height - 10, p.width, 10);

    ctx.fillStyle = '#1a1f21';
    for (let i = 20; i < p.width - 20; i += 40) {
        ctx.fillRect(screenX + i, p.y, 15, p.height);

        let timeOffset = (Date.now() / 200 + i) % 10;
        ctx.fillStyle = `rgba(200, 220, 230, ${0.5 - timeOffset / 20})`;
        ctx.beginPath();
        ctx.arc(screenX + i + 7.5, p.y - timeOffset * 5, 10 + timeOffset * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1f21';
    }
}

function drawBrick(p) {
    let screenX = p.x - cameraX;
    ctx.fillStyle = '#b34722';
    ctx.fillRect(screenX, p.y, p.width, p.height);
    ctx.strokeStyle = '#5c1e0a'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, p.y + p.height / 3); ctx.lineTo(screenX + p.width, p.y + p.height / 3);
    ctx.moveTo(screenX, p.y + (p.height / 3) * 2); ctx.lineTo(screenX + p.width, p.y + (p.height / 3) * 2);
    ctx.moveTo(screenX + p.width / 2, p.y); ctx.lineTo(screenX + p.width / 2, p.y + p.height / 3);
    ctx.moveTo(screenX + p.width / 4, p.y + p.height / 3); ctx.lineTo(screenX + p.width / 4, p.y + (p.height / 3) * 2);
    ctx.moveTo(screenX + (p.width / 4) * 3, p.y + p.height / 3); ctx.lineTo(screenX + (p.width / 4) * 3, p.y + (p.height / 3) * 2);
    ctx.moveTo(screenX + p.width / 2, p.y + (p.height / 3) * 2); ctx.lineTo(screenX + p.width / 2, p.y + p.height);
    ctx.stroke();
    ctx.strokeRect(screenX, p.y, p.width, p.height);
}

function drawQBlock(p) {
    let screenX = p.x - cameraX;
    if (!p.hit) {
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(screenX, p.y, p.width, p.height);
        ctx.fillStyle = '#b38f00';
        ctx.fillRect(screenX + 4, p.y + 4, 6, 6); ctx.fillRect(screenX + p.width - 10, p.y + 4, 6, 6);
        ctx.fillRect(screenX + 4, p.y + p.height - 10, 6, 6); ctx.fillRect(screenX + p.width - 10, p.y + p.height - 10, 6, 6);
        ctx.fillStyle = '#b34722'; ctx.font = 'bold 35px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', screenX + p.width / 2, p.y + p.height / 2 + 2);
    } else {
        ctx.fillStyle = '#5c5c5c'; ctx.fillRect(screenX, p.y, p.width, p.height);
        ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 4; ctx.strokeRect(screenX, p.y, p.width, p.height);
        ctx.fillStyle = '#2b2b2b';
        ctx.fillRect(screenX + 6, p.y + 6, 8, 8); ctx.fillRect(screenX + p.width - 14, p.y + 6, 8, 8);
        ctx.fillRect(screenX + 6, p.y + p.height - 14, 8, 8); ctx.fillRect(screenX + p.width - 14, p.y + p.height - 14, 8, 8);
    }
}

function drawTurret(t) {
    let screenX = t.x - cameraX; let centerX = screenX + t.width / 2; let centerY = t.y + t.height / 2;
    let targetX = player.x + player.width / 2 - cameraX; let targetY = player.y + player.height / 2;
    let angle = Math.atan2(targetY - centerY, targetX - centerX);
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(screenX, centerY, t.width, t.height / 2);
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(screenX + 10, centerY - 10, t.width - 20, t.height / 2);
    ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(angle); ctx.fillStyle = '#5c5c5c'; ctx.fillRect(0, -15, 55, 30);
    let heat = Math.floor((t.timer / t.shootInterval) * 255); ctx.fillStyle = `rgb(255, ${255 - heat}, 0)`; ctx.fillRect(10, -5, 30, 10);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(45, -10, 20, 20); ctx.restore();
    ctx.fillStyle = '#7a7a7a'; ctx.beginPath(); ctx.arc(centerX, centerY, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a110a'; ctx.beginPath(); ctx.arc(centerX, centerY, 10, 0, Math.PI * 2); ctx.fill();
}

function drawStomper(s) {
    let screenX = s.x - cameraX; let centerY = s.y + s.height / 2;
    ctx.save();
    ctx.fillStyle = '#a67b5b'; ctx.fillRect(screenX, s.y, s.width, s.height);
    ctx.fillStyle = '#3b2515'; let armX = s.facingRight ? screenX + s.width - 5 : screenX - 25; ctx.fillRect(armX, centerY - 10, 30, 20);
    ctx.fillStyle = (s.state === 'CHARGE' || s.state === 'CHARGING') ? 'red' : '#ffcc00';
    let eyeX = s.facingRight ? screenX + s.width - 20 : screenX + 10; ctx.beginPath(); ctx.arc(eyeX, s.y + 20, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeX + (s.facingRight ? -12 : 12), s.y + 20, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5c3a'; ctx.fillRect(screenX + s.width / 4, s.y - 10, s.width / 2, 10);
    drawGear(s.x + s.width / 2, s.y - 5, 12, Date.now() / 200, '#bc8a5f', 'rgba(0,0,0,0.8)');
    ctx.fillStyle = '#5c3a21'; let legOffset = s.facingRight ? 10 : -10;
    ctx.fillRect(screenX + s.width / 4 + legOffset, s.y + s.height - 10, 20, 20); ctx.fillRect(screenX + s.width * 0.6 + legOffset, s.y + s.height - 10, 20, 20);
    ctx.restore();
}

function drawDrone(d) {
    let screenX = d.x - cameraX;
    let centerX = screenX + d.width / 2;
    let centerY = d.y + d.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.save();
    ctx.rotate(Date.now() / 100);
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(-35, -d.height / 2 - 5, 70, 4);
    ctx.restore();
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(-5, -d.height / 2 - 10, 10, 10);

    ctx.fillStyle = '#a67b5b';
    ctx.beginPath(); ctx.arc(0, 0, d.width / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c3a21';
    ctx.beginPath(); ctx.arc(0, 0, d.width / 2 - 5, 0, Math.PI * 2); ctx.fill();

    let targetX = player.x + player.width / 2 - cameraX;
    let targetY = player.y + player.height / 2;
    let angle = Math.atan2(targetY - centerY, targetX - centerX);

    ctx.rotate(angle);
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(0, -10, 30, 20);

    let heat = Math.floor((d.timer / d.shootInterval) * 255);
    ctx.fillStyle = `rgb(255, ${255 - heat}, 0)`;
    ctx.beginPath(); ctx.arc(10, 0, 8, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
}

function drawTrap(tr) {
    let screenX = tr.x - cameraX; ctx.fillStyle = '#1a110a'; ctx.fillRect(screenX - 5, tr.y, tr.width + 10, 10);
    if (tr.height > 0) {
        ctx.fillStyle = '#7a7a7a'; ctx.fillRect(screenX + 15, tr.y - tr.height, 30, tr.height);
        ctx.fillStyle = '#a33327'; ctx.fillRect(screenX, tr.y - tr.height - 30, tr.width, 30);
        ctx.fillStyle = '#eeeeee'; ctx.beginPath(); ctx.moveTo(screenX, tr.y - tr.height - 30); ctx.lineTo(screenX + 15, tr.y - tr.height - 45);
        ctx.lineTo(screenX + 30, tr.y - tr.height - 30); ctx.lineTo(screenX + 45, tr.y - tr.height - 45); ctx.lineTo(screenX + 60, tr.y - tr.height - 30); ctx.fill();
    }
}

function drawScrap(sc) {
    let screenX = sc.x - cameraX; ctx.save(); ctx.translate(screenX + 15, sc.y + 15); ctx.rotate(Date.now() / 400);
    ctx.fillStyle = '#cccccc'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#888888'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

// ---------------------------------------------------------
// 5. HLAVNÍ SMYČKA (ŘÍZENÍ ČASU)
// ---------------------------------------------------------
function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);
    const deltaTime = timestamp - lastTime;
    if (deltaTime > interval) {
        lastTime = timestamp - (deltaTime % interval);
        update();
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'MENU') {
        if (menuBg.complete && menuBg.naturalHeight !== 0) ctx.drawImage(menuBg, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = '#2e1e12'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

        drawBtn("PLAY", canvas.width / 2 - 150, canvas.height / 2 + 50, 300, 80, () => {
            gameState = 'PLAYING'; restartLevel(true); gameMusic.play();
        });
        drawBtn("CREDITS", canvas.width / 2 - 150, canvas.height / 2 + 150, 300, 80, () => { gameState = 'CREDITS'; });
    }
    else if (gameState === 'CREDITS') {
        ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 50px Georgia";
        ctx.fillText("Hru vytvořili:", canvas.width / 2, 400);
        ctx.fillStyle = "#ebc49f"; ctx.font = "bold 70px Georgia";
        ctx.fillText("Adam Macků a Zdeněk Vápeník", canvas.width / 2, 500);
        drawBtn("ZPĚT DO MENU", canvas.width / 2 - 200, canvas.height - 200, 400, 80, () => { gameState = 'MENU'; });
    }
    else if (gameState === 'GAMEOVER' || gameState === 'VICTORY') {
        stopMusic();
        ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = (gameState === 'GAMEOVER') ? "#a33327" : "#42cbf5";
        ctx.textAlign = "center"; ctx.font = "bold 120px Georgia";

        if (gameState === 'GAMEOVER') {
            ctx.fillText("ZNIČEN!", canvas.width / 2, canvas.height / 2 - 120);

            let finalScore = totalScore + Math.floor(maxDistance / 10) + bonusScore;
            ctx.fillStyle = "white"; ctx.font = "bold 50px Georgia";
            ctx.fillText("FINÁLNÍ SKÓRE: " + finalScore, canvas.width / 2, canvas.height / 2 - 30);

            drawBtn("RESTART", canvas.width / 2 - 250, canvas.height / 2 + 80, 220, 80, () => { gameState = 'PLAYING'; restartLevel(true); gameMusic.play(); });
            drawBtn("MENU", canvas.width / 2 + 30, canvas.height / 2 + 80, 220, 80, () => { gameState = 'MENU'; });
        } else {
            ctx.fillText(`LEVEL ${currentLevel} DOKONČEN!`, canvas.width / 2, canvas.height / 2 - 50);

            drawBtn("DALŠÍ LEVEL", canvas.width / 2 - 200, canvas.height / 2 + 80, 400, 80, () => {
                totalScore += Math.floor(maxDistance / 10) + bonusScore;
                currentLevel++;
                gameState = 'PLAYING';
                restartLevel(false);
                gameMusic.play();
            });
            drawBtn("MENU", canvas.width / 2 - 200, canvas.height / 2 + 180, 400, 80, () => { gameState = 'MENU'; });
        }
    }
    else if (gameState === 'PLAYING' || gameState === 'PAUSED') {

        if (gameState === 'PLAYING') {
            if (keys.Escape) { gameState = 'PAUSED'; keys.Escape = false; }

            if (player.x > maxDistance) { maxDistance = player.x; }

            let isMoving = false;
            if (keys.ArrowLeft || keys.a) { player.x -= player.speed; player.facingRight = false; isMoving = true; }
            if (keys.ArrowRight || keys.d) { player.x += player.speed; player.facingRight = true; isMoving = true; }

            if (isMoving && player.grounded) {
                player.animTimer++; if (player.animTimer > player.animSpeed) { player.frameIndex++; if (player.frameIndex >= runFrames.length) player.frameIndex = 0; player.animTimer = 0; }
            } else { player.frameIndex = 0; }

            player.lastY = player.y; player.dy += gravity; player.y += player.dy; player.grounded = false;

            for (let p of platforms) {

                if (p.type === 'fragile') {
                    if (p.state === 'SHAKING') {
                        p.timer++;
                        if (p.timer > 30) p.state = 'FALLING';
                    } else if (p.state === 'FALLING') {
                        p.y += 15;
                    }
                }

                if (p.type === 'brick' && p.destroyed) continue;

                if (player.x + player.width > p.x && player.x < p.x + p.width) {

                    if ((p.type === 'box' || (p.type === 'fragile' && p.state !== 'FALLING') || p.type === 'vent' || p.type === 'brick' || p.type === 'qblock') && player.dy >= 0) {
                        let prevBottom = player.lastY + player.height; let currBottom = player.y + player.height;
                        if (prevBottom <= p.y && currBottom >= p.y) {
                            player.y = p.y - player.height; player.dy = 0; player.grounded = true; player.jumpCount = 0;

                            if (p.type === 'fragile' && p.state === 'IDLE') {
                                p.state = 'SHAKING';
                            } else if (p.type === 'vent') {
                                player.dy = -player.jumpForce * 1.6; player.grounded = false; player.jumpCount = 1;
                                jumpSound.currentTime = 0; jumpSound.play();
                            }
                        }
                    }
                    else if ((p.type === 'brick' || p.type === 'qblock') && player.dy < 0) {
                        let prevTop = player.lastY; let currTop = player.y;
                        if (prevTop >= p.y + p.height && currTop <= p.y + p.height) {
                            player.y = p.y + p.height;
                            player.dy = 0;

                            if (p.type === 'brick') {
                                p.destroyed = true;
                                bonusScore += 50;
                                jumpSound.currentTime = 0; jumpSound.play();
                            } else if (p.type === 'qblock' && !p.hit) {
                                p.hit = true;
                                jumpSound.currentTime = 0; jumpSound.play();

                                if (Math.random() < 0.25) {
                                    stars.push({ x: p.x + 10, y: p.y - 50, width: 40, height: 40, collected: false });
                                } else {
                                    bonusScore += 50;
                                    scrapsCollected += 10;
                                    if (scrapsCollected >= 100) { scrapsCollected -= 100; player.lives++; }
                                }
                            }
                        }
                    }
                    else if (p.type === 'gear') {
                        let cx = p.x + p.width / 2; let cy = p.y + p.height / 2; let radius = p.width / 2; let dx = (player.x + player.width / 2) - cx;
                        if (Math.abs(dx) <= radius) {
                            let arcY = cy - Math.sqrt(radius * radius - dx * dx);
                            if (player.dy >= 0 && player.y + player.height >= arcY - 20 && player.lastY + player.height <= arcY + 50) {
                                player.y = arcY - player.height; player.dy = 0; player.grounded = true; player.jumpCount = 0; player.x += p.speed * radius;
                            }
                        }
                    }
                }
            }

            if (player.x < 0) player.x = 0; if (player.x + player.width > mapEnd) player.x = mapEnd - player.width;

            if (player.y > canvas.height + 200) {
                gameOverSound.currentTime = 0; gameOverSound.play(); gameState = 'GAMEOVER';
            }

            if (player.x > canvas.width / 2) cameraX = player.x - canvas.width / 2;
            if (cameraX > mapEnd - canvas.width) cameraX = mapEnd - canvas.width;

            if (player.invincibleTimer > 0) { player.invincibleTimer--; } else { player.isInvincible = false; }

            for (let sc of scraps) {
                if (!sc.collected && player.x < sc.x + sc.width && player.x + player.width > sc.x && player.y < sc.y + sc.height && player.y + player.height > sc.y) {
                    sc.collected = true; bonusScore += 10; scrapsCollected++;
                    if (scrapsCollected >= 100) { scrapsCollected -= 100; player.lives++; }
                }
            }

            for (let s of stars) {
                if (!s.collected && player.x < s.x + s.width && player.x + player.width > s.x && player.y < s.y + s.height && player.y + player.height > s.y) {
                    s.collected = true;
                    if (player.lives === 1) {
                        player.width = 120; player.height = 120; player.y -= 40; player.jumpForce = 25; player.isBig = true; player.lives = 2;
                    } else if (player.lives >= 2) {
                        player.lives += 2; player.isGolden = true;
                    }
                }
            }

            for (let t of turrets) {
                if (Math.abs(t.x - player.x) < 1200) {
                    t.timer++;
                    if (t.timer > t.shootInterval) {
                        let startX = t.x + t.width / 2; let startY = t.y + 15;
                        let targetX = player.x + player.width / 2; let targetY = player.y + player.height / 2;
                        let angle = Math.atan2(targetY - startY, targetX - startX);
                        bullets.push({ x: startX, y: startY, width: 20, height: 20, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5 });
                        t.timer = 0;
                    }
                }
            }

            for (let i = drones.length - 1; i >= 0; i--) {
                let d = drones[i];
                let dist = Math.hypot(player.x + player.width / 2 - (d.x + d.width / 2), player.y + player.height / 2 - (d.y + d.height / 2));

                d.hoverOffset += 0.05;
                d.y += Math.sin(d.hoverOffset) * 1.5;

                if (dist < 1000) {
                    if (d.x + d.width / 2 < player.x + player.width / 2) d.x += d.speed;
                    else d.x -= d.speed;

                    if (d.y + d.height / 2 < player.y - 100) d.y += d.speed * 0.5;
                    else if (d.y + d.height / 2 > player.y - 100) d.y -= d.speed * 0.5;

                    d.timer++;
                    if (d.timer > d.shootInterval) {
                        let startX = d.x + d.width / 2; let startY = d.y + d.height;
                        let targetX = player.x + player.width / 2; let targetY = player.y + player.height / 2;
                        let angle = Math.atan2(targetY - startY, targetX - startX);
                        bullets.push({ x: startX, y: startY, width: 16, height: 16, vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6 });
                        d.timer = 0;
                    }
                }

                if (player.x < d.x + d.width && player.x + player.width > d.x && player.y < d.y + d.height && player.y + player.height > d.y) {
                    let prevBottom = player.lastY + player.height;

                    if (player.dy > 0 && prevBottom <= d.y + 20) {
                        drones.splice(i, 1);
                        player.dy = -15;
                        player.jumpCount = 1;
                        bonusScore += 400; jumpSound.currentTime = 0; jumpSound.play();
                    }
                    else if (!player.isInvincible) {
                        takeDamage();
                        if (gameState !== 'GAMEOVER') { player.dy = -5; }
                    }
                }
            }

            for (let i = bullets.length - 1; i >= 0; i--) {
                let b = bullets[i]; b.x += b.vx; b.y += b.vy; let bulletHit = false;
                if (b.x < player.x + player.width && b.x + b.width > player.x && b.y < player.y + player.height && b.y + b.height > player.y && !player.isInvincible) {
                    takeDamage(); bullets.splice(i, 1); bulletHit = true;
                }
                if (!bulletHit && (b.x < cameraX - 1000 || b.x > cameraX + 3000)) { bullets.splice(i, 1); }
            }

            for (let tr of traps) {
                if (tr.state === 'HIDDEN') {
                    tr.timer++; if (tr.timer > 100) { tr.state = 'RISING'; tr.timer = 0; }
                } else if (tr.state === 'RISING') {
                    tr.height += 4; if (tr.height >= tr.maxHeight) { tr.height = tr.maxHeight; tr.state = 'EXTENDED'; }
                } else if (tr.state === 'EXTENDED') {
                    tr.timer++; if (tr.timer > 60) { tr.state = 'RETRACTING'; tr.timer = 0; }
                } else if (tr.state === 'RETRACTING') {
                    tr.height -= 3; if (tr.height <= 0) { tr.height = 0; tr.state = 'HIDDEN'; }
                }

                let trapTop = tr.y - tr.height - 30;
                if (tr.height > 10 && player.x < tr.x + tr.width && player.x + player.width > tr.x && player.y < tr.y && player.y + player.height > trapTop) {
                    if (!player.isInvincible) {
                        takeDamage();
                        if (gameState !== 'GAMEOVER') { player.y = trapTop - player.height - 10; player.dy = -10; }
                    }
                }
            }

            for (let i = stompers.length - 1; i >= 0; i--) {
                let s = stompers[i];
                if (s.state === 'PATROL') {
                    s.x += s.facingRight ? s.speed : -s.speed;
                    if (s.x > s.endX) { s.x = s.endX; s.facingRight = false; }
                    if (s.x < s.startX) { s.x = s.startX; s.facingRight = true; }
                    if (Math.abs(player.y + player.height - (s.y + s.height)) < 20) {
                        if ((s.facingRight && player.x > s.x && player.x < s.x + 600) || (!s.facingRight && player.x < s.x && player.x > s.x - 600)) { s.state = 'CHARGING'; s.timer = 60; }
                    }
                } else if (s.state === 'CHARGING') {
                    s.timer--; if (s.timer <= 0) { s.state = 'CHARGE'; }
                } else if (s.state === 'CHARGE') {
                    s.x += s.facingRight ? s.chargeSpeed : -s.chargeSpeed;
                    if (s.x > s.endX) { s.x = s.endX; s.state = 'PATROL'; s.facingRight = false; }
                    if (s.x < s.startX) { s.x = s.startX; s.state = 'PATROL'; s.facingRight = true; }
                }

                if (player.x < s.x + s.width && player.x + player.width > s.x && player.y < s.y + s.height && player.y + player.height > s.y) {
                    let prevBottom = player.lastY + player.height;

                    if (player.dy > 0 && prevBottom <= s.y + 30) {
                        stompers.splice(i, 1); player.dy = -18;
                        player.jumpCount = 1;
                        bonusScore += 500; jumpSound.currentTime = 0; jumpSound.play();
                    }
                    else if (!player.isInvincible) {
                        takeDamage();
                        if (gameState !== 'GAMEOVER') { s.state = 'PATROL'; s.x += s.facingRight ? -50 : 50; }
                    }
                }
            }

            if (player.x < flag.x + flag.width && player.x + player.width > flag.x && player.y < flag.y + flag.height && player.y + player.height > flag.y) { gameState = 'VICTORY'; }
        }

        // VYKRESLOVÁNÍ
        if (factoryBg.complete && factoryBg.naturalHeight !== 0) { ctx.drawImage(factoryBg, 0, 0, canvas.width, canvas.height); }
        else { ctx.fillStyle = '#5c8fb3'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

        for (let p of platforms) {
            if (p.type === 'box') { drawBoxPlatform(p); }
            else if (p.type === 'fragile') { drawFragilePlatform(p); }
            else if (p.type === 'vent') { drawVentPlatform(p); }
            else if (p.type === 'brick' && !p.destroyed) { drawBrick(p); }
            else if (p.type === 'qblock') { drawQBlock(p); }
            else if (p.type === 'gear') { p.angle += p.speed; drawGear(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, p.angle, p.color); }
        }

        for (let s of stars) { if (!s.collected) { drawStar(s.x + 20, s.y + 20, 5, 20, 10); } }
        for (let t of turrets) { drawTurret(t); }
        traps.forEach(drawTrap);
        stompers.forEach(drawStomper);
        drones.forEach(drawDrone);

        for (let sc of scraps) { if (!sc.collected) { drawScrap(sc); } }

        ctx.fillStyle = '#777'; ctx.fillRect(flag.x - cameraX, flag.y, 10, flag.height);
        ctx.fillStyle = '#32a852'; ctx.fillRect(flag.x - cameraX + 10, flag.y, flag.width, 40);
        ctx.fillStyle = '#ffcc00'; for (let b of bullets) { ctx.beginPath(); ctx.arc(b.x - cameraX, b.y, 10, 0, Math.PI * 2); ctx.fill(); }

        let currentImg = runFrames[player.frameIndex];
        ctx.save();
        let blinkOn = !player.isInvincible || (Math.floor(Date.now() / 150) % 2 === 0);

        if (player.isGolden && blinkOn) { ctx.shadowColor = 'gold'; ctx.shadowBlur = 30; }

        if (blinkOn) {
            if (!player.facingRight) { ctx.scale(-1, 1); ctx.drawImage(currentImg, -(player.x - cameraX) - player.width, player.y, player.width, player.height); }
            else { ctx.drawImage(currentImg, player.x - cameraX, player.y, player.width, player.height); }
        }
        ctx.restore();

        ctx.fillStyle = "#1a110a"; ctx.fillRect(20, 20, 300, 20);
        ctx.fillStyle = "#ebc49f"; ctx.fillRect(20, 20, Math.max(0, (player.x / mapEnd) * 300), 20);
        ctx.textAlign = "left"; ctx.font = "bold 20px Georgia"; ctx.fillText("POSTUP LEVELU", 20, 60);

        let currentScore = totalScore + Math.floor(maxDistance / 10) + bonusScore;
        ctx.fillStyle = "#ebc49f"; ctx.textAlign = "right"; ctx.font = "bold 40px Georgia";
        ctx.fillText("LEVEL " + currentLevel, canvas.width - 50, 60);
        ctx.fillText("SKÓRE: " + currentScore, canvas.width - 50, 110);

        if (gameState === 'PAUSED') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 100px Georgia";
            ctx.fillText("PAUZA", canvas.width / 2, canvas.height / 2 - 100);
            drawBtn("POKRAČOVAT", canvas.width / 2 - 200, canvas.height / 2, 400, 80, () => { gameState = 'PLAYING'; });
            drawBtn("NÁVRAT DO MENU", canvas.width / 2 - 200, canvas.height / 2 + 100, 400, 80, () => { gameState = 'MENU'; });
            if (keys.Escape) { gameState = 'PLAYING'; keys.Escape = false; }
        }
    }
}
