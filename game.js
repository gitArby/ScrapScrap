const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1920;
canvas.height = 1080;

let gameState = 'MENU';

// --- OPRAVA PRO 200Hz MONITOR: Zámek na 60 FPS ---
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
        // Místo přímého update() spustíme časovanou smyčku
        requestAnimationFrame(gameLoop);
    }
}

// Načtení hudby
const gameMusic = new Audio('music.mp3');
gameMusic.loop = true;
gameMusic.volume = 0.08;

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
// 2. HRÁČ, LEVEL DESIGN A MYŠ
// ---------------------------------------------------------
const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, a: false, d: false, w: false, ' ': false };
window.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
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
    speed: 10, dy: 0, jumpForce: 22, grounded: false, facingRight: true, frameIndex: 0, animTimer: 0, animSpeed: 5,
    isBig: false, lives: 1, isInvincible: false, invincibleTimer: 0
};

const gravity = 1.2;
let cameraX = 0;

const platforms = [
    { type: 'box', x: 0, y: 850, width: 800, height: 300 },
    { type: 'box', x: 950, y: 700, width: 200, height: 40 },
    { type: 'box', x: 1300, y: 550, width: 200, height: 40 },
    { type: 'gear', x: 1650, y: 750, width: 300, height: 300, angle: 0, speed: 0.01, color: '#a67b5b' },
    { type: 'box', x: 2050, y: 600, width: 200, height: 40 },
    { type: 'gear', x: 2400, y: 700, width: 250, height: 250, angle: 0, speed: -0.015, color: '#8a5c3a' },
    { type: 'gear', x: 2750, y: 550, width: 200, height: 200, angle: 0, speed: 0.02, color: '#5c3a21' },
    { type: 'box', x: 3100, y: 850, width: 800, height: 300 }
];
const mapEnd = 3900;
const flag = { x: 3600, y: 650, width: 60, height: 200 };

let stars = [{ x: 1380, y: 470, width: 40, height: 40, collected: false }];
let turrets = [{ x: 2100, y: 540, width: 60, height: 60, timer: 0, shootInterval: 100 }];
let bullets = [];

function restartLevel() {
    player.x = 100; player.y = 500; player.dy = 0; player.width = 80; player.height = 80; player.isBig = false; player.lives = 1; player.jumpForce = 22; player.isInvincible = false; player.invincibleTimer = 0;
    bullets = []; cameraX = 0; stars.forEach(s => s.collected = false);
}

// ---------------------------------------------------------
// 3. POMOCNÉ KRESLÍCÍ FUNKCE A UI
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

function drawGear(gx, gy, radius, angle, color) {
    ctx.save(); ctx.translate(gx - cameraX, gy); ctx.rotate(angle); ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    for (let i = 0; i < 12; i++) {
        ctx.save(); ctx.rotate((i * Math.PI) / 6); ctx.fillRect(-radius / 8, -radius - (radius / 6), radius / 4, radius / 3); ctx.restore();
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.beginPath(); ctx.arc(0, 0, radius / 3, 0, Math.PI * 2); ctx.fill();
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

function drawTurret(t) {
    let screenX = t.x - cameraX; let centerX = screenX + t.width / 2; let centerY = t.y + t.height / 2;
    let targetX = player.x + player.width / 2 - cameraX; let targetY = player.y + player.height / 2;
    let angle = Math.atan2(targetY - centerY, targetX - centerX);
    ctx.fillStyle = '#3b2515'; ctx.fillRect(screenX + 10, centerY, t.width - 20, t.height / 2);
    ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(angle); ctx.fillStyle = '#8a5c3a'; ctx.fillRect(0, -10, 45, 20);
    ctx.fillStyle = '#1a110a'; ctx.fillRect(40, -5, 5, 10); ctx.restore();
    ctx.fillStyle = '#a67b5b'; ctx.beginPath(); ctx.arc(centerX, centerY, 22, 0, Math.PI * 2); ctx.fill();
    let redIntensity = Math.floor((t.timer / t.shootInterval) * 255);
    ctx.fillStyle = `rgb(${redIntensity}, 0, 0)`; ctx.beginPath(); ctx.arc(centerX, centerY, 8, 0, Math.PI * 2); ctx.fill();
}

// ---------------------------------------------------------
// 4. HLAVNÍ SMYČKA (ŘÍZENÍ ČASU)
// ---------------------------------------------------------
function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);
    const deltaTime = timestamp - lastTime;

    // Logika se spustí jen 60x za vteřinu bez ohledu na monitor
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
            gameState = 'PLAYING'; restartLevel(); gameMusic.play();
        });
        drawBtn("CREDITS", canvas.width / 2 - 150, canvas.height / 2 + 150, 300, 80, () => {
            gameState = 'CREDITS';
        });
    }
    else if (gameState === 'CREDITS') {
        ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 50px Georgia";
        ctx.fillText("Hru vytvořili:", canvas.width / 2, 400);
        ctx.fillStyle = "#ebc49f"; ctx.font = "bold 70px Georgia";
        ctx.fillText("Adam Macků a Zdeněk Vápeník", canvas.width / 2, 500);
        drawBtn("ZPĚT DO MENU", canvas.width / 2 - 200, canvas.height - 200, 400, 80, () => {
            gameState = 'MENU';
        });
    }
    else if (gameState === 'GAMEOVER' || gameState === 'VICTORY') {
        ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = (gameState === 'GAMEOVER') ? "#a33327" : "#42cbf5";
        ctx.textAlign = "center"; ctx.font = "bold 120px Georgia";
        ctx.fillText((gameState === 'GAMEOVER') ? "ZNIČEN!" : "LEVEL DOKONČEN!", canvas.width / 2, canvas.height / 2 - 50);

        if (gameState === 'GAMEOVER') {
            drawBtn("RESTART", canvas.width / 2 - 250, canvas.height / 2 + 100, 220, 80, () => {
                gameState = 'PLAYING'; restartLevel();
            });
            drawBtn("MENU", canvas.width / 2 + 30, canvas.height / 2 + 100, 220, 80, () => {
                gameState = 'MENU';
            });
        } else {
            drawBtn("NÁVRAT DO MENU", canvas.width / 2 - 200, canvas.height / 2 + 100, 400, 80, () => {
                gameState = 'MENU';
            });
        }
    }
    else if (gameState === 'PLAYING') {
        let isMoving = false;
        if (keys.ArrowLeft || keys.a) { player.x -= player.speed; player.facingRight = false; isMoving = true; }
        if (keys.ArrowRight || keys.d) { player.x += player.speed; player.facingRight = true; isMoving = true; }

        if (isMoving && player.grounded) {
            player.animTimer++; if (player.animTimer > player.animSpeed) { player.frameIndex++; if (player.frameIndex >= runFrames.length) player.frameIndex = 0; player.animTimer = 0; }
        } else { player.frameIndex = 0; }

        if ((keys.ArrowUp || keys.w || keys[' ']) && player.grounded) { player.dy = -player.jumpForce; }

        player.lastY = player.y;
        player.dy += gravity;
        player.y += player.dy;
        player.grounded = false;

        for (let p of platforms) {
            if (player.x + player.width > p.x && player.x < p.x + p.width) {
                if (p.type === 'box') {
                    if (player.dy >= 0) {
                        let prevBottom = player.lastY + player.height;
                        let currBottom = player.y + player.height;
                        if (prevBottom <= p.y && currBottom >= p.y) {
                            player.y = p.y - player.height; player.dy = 0; player.grounded = true;
                        }
                    }
                }
                else if (p.type === 'gear') {
                    let cx = p.x + p.width / 2; let cy = p.y + p.height / 2; let radius = p.width / 2;
                    let dx = (player.x + player.width / 2) - cx;
                    if (Math.abs(dx) <= radius) {
                        let arcY = cy - Math.sqrt(radius * radius - dx * dx);
                        if (player.lastY + player.height <= arcY + 25 && player.y + player.height >= arcY - 15) {
                            player.y = arcY - player.height; player.dy = 0; player.grounded = true;
                            player.x += p.speed * radius; // Běžící pás
                        }
                    }
                }
            }
        }

        if (player.x < 0) player.x = 0;
        if (player.x + player.width > mapEnd) player.x = mapEnd - player.width;
        if (player.y > canvas.height + 200) gameState = 'GAMEOVER';
        if (player.x > canvas.width / 2) cameraX = player.x - canvas.width / 2;
        if (cameraX > mapEnd - canvas.width) cameraX = mapEnd - canvas.width;

        if (player.invincibleTimer > 0) { player.invincibleTimer--; } else { player.isInvincible = false; }

        for (let s of stars) { if (!s.collected && player.x < s.x + s.width && player.x + player.width > s.x && player.y < s.y + s.height && player.y + player.height > s.y) { s.collected = true; if (player.lives === 1) { player.width = 120; player.height = 120; player.y -= 40; player.jumpForce = 25; player.isBig = true; player.lives = 2; } } }

        for (let t of turrets) {
            if (Math.abs(t.x - player.x) < 1200) {
                t.timer++;
                if (t.timer > t.shootInterval) {
                    let startX = t.x + t.width / 2; let startY = t.y + 15;
                    let targetX = player.x + player.width / 2; let targetY = player.y + player.height / 2;
                    let angle = Math.atan2(targetY - startY, targetX - startX);
                    let bulletSpeed = 5;
                    bullets.push({ x: startX, y: startY, width: 20, height: 20, vx: Math.cos(angle) * bulletSpeed, vy: Math.sin(angle) * bulletSpeed });
                    t.timer = 0;
                }
            }
        }

        for (let i = bullets.length - 1; i >= 0; i--) {
            let b = bullets[i]; b.x += b.vx; b.y += b.vy; let bulletHit = false;
            if (b.x < player.x + player.width && b.x + b.width > player.x && b.y < player.y + player.height && b.y + b.height > player.y) {
                if (!player.isInvincible) {
                    if (player.lives === 2) {
                        player.lives = 1; player.width = 80; player.height = 80; player.y += 40;
                        player.isBig = false; player.isInvincible = true; player.invincibleTimer = 120;
                        bullets.splice(i, 1); bulletHit = true;
                    } else { gameState = 'GAMEOVER'; }
                }
            }
            if (!bulletHit && (b.x < cameraX - 1000 || b.x > cameraX + 3000)) { bullets.splice(i, 1); }
        }

        if (player.x < flag.x + flag.width && player.x + player.width > flag.x && player.y < flag.y + flag.height && player.y + player.height > flag.y) { gameState = 'VICTORY'; }

        // VYKRESLOVÁNÍ
        if (factoryBg.complete && factoryBg.naturalHeight !== 0) { ctx.drawImage(factoryBg, 0, 0, canvas.width, canvas.height); }
        else { ctx.fillStyle = '#5c8fb3'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

        for (let p of platforms) {
            if (p.type === 'box') { drawBoxPlatform(p); }
            else if (p.type === 'gear') { p.angle += p.speed; drawGear(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, p.angle, p.color); }
        }

        for (let s of stars) { if (!s.collected) { drawStar(s.x + 20, s.y + 20, 5, 20, 10); } }
        for (let t of turrets) { drawTurret(t); }

        ctx.fillStyle = '#777'; ctx.fillRect(flag.x - cameraX, flag.y, 10, flag.height);
        ctx.fillStyle = '#32a852'; ctx.fillRect(flag.x - cameraX + 10, flag.y, flag.width, 40);
        ctx.fillStyle = '#ffcc00'; for (let b of bullets) { ctx.beginPath(); ctx.arc(b.x - cameraX, b.y, 10, 0, Math.PI * 2); ctx.fill(); }

        let currentImg = runFrames[player.frameIndex];
        ctx.save();
        let blinkOn = !player.isInvincible || (Math.floor(Date.now() / 150) % 2 === 0);
        if (blinkOn) {
            if (!player.facingRight) { ctx.scale(-1, 1); ctx.drawImage(currentImg, -(player.x - cameraX) - player.width, player.y, player.width, player.height); }
            else { ctx.drawImage(currentImg, player.x - cameraX, player.y, player.width, player.height); }
        }
        ctx.restore();
        ctx.fillStyle = "#ebc49f"; ctx.textAlign = "right"; ctx.font = "bold 40px Georgia"; ctx.fillText("LEVEL 1", canvas.width - 50, 60);
    }
}