(function () {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 1920;
    canvas.height = 1080;

    function resizeCanvas() {
        const windowRatio = window.innerWidth / window.innerHeight;
        const targetHeight = 1080;
        // Zajisti, ze sirka nepujde pod 800 (pro hodne uzke monitory), jinak vezme presny pomer stran
        const targetWidth = Math.max(targetHeight * windowRatio, 800);

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.transform = 'none';
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
    const totalAssets = 9;

    function assetLoaded() {
        assetsLoaded++;
        if (assetsLoaded === totalAssets) {
            requestAnimationFrame(gameLoop);
        }
    }

    // --- AUDIO A NASTAVENÍ HLASITOSTI ---
    let musicLevel = 10; // 0 až 10 (10 = 100%)
    let sfxLevel = 10;   // 0 až 10 (10 = 100%)

    const gameMusic = new Audio('music.mp3');
    gameMusic.loop = true;

    const jumpSound = new Audio('jump.mp3');
    const damageSound = new Audio('damage.mp3');
    const gameOverSound = new Audio('gameover.mp3');

    // Funkce pro aktualizaci reálné hlasitosti v objektech
    function updateVolumes() {
        gameMusic.volume = (musicLevel / 10) * 0.08;
        jumpSound.volume = (sfxLevel / 10) * 0.2;
        damageSound.volume = (sfxLevel / 10) * 0.3;
        gameOverSound.volume = (sfxLevel / 10) * 0.4;

        if (musicLevel === 0) {
            gameMusic.pause();
        } else if (gameState === 'PLAYING' || gameState === 'PAUSED') {
            if (gameMusic.paused) gameMusic.play().catch(e => console.log(e));
        }
    }

    // Inicializace základních hlasitostí
    updateVolumes();

    function playSound(audioObj) {
        if (sfxLevel > 0) {
            audioObj.currentTime = 0;
            audioObj.play().catch(e => console.log("Audio play error:", e));
        }
    }

    function playMusic() {
        if (musicLevel > 0) {
            gameMusic.play().catch(e => console.log("Music play error:", e));
        }
    }

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

    const jumpImg = new Image();
    jumpImg.src = 'jump.png';
    jumpImg.onload = assetLoaded;

    const fallImg = new Image();
    fallImg.src = 'fall.png';
    fallImg.onload = assetLoaded;

    // ---------------------------------------------------------
    // 2. HRÁČ, MYŠ A SKÓRE
    // ---------------------------------------------------------
    const firebaseConfig = {
        apiKey: "AIzaSyBbKXxVKvd2BImAVtUzKKVNpwL0If384fg",
        authDomain: "scrapscrap-8df08.firebaseapp.com",
        projectId: "scrapscrap-8df08",
        storageBucket: "scrapscrap-8df08.firebasestorage.app",
        messagingSenderId: "129438387489",
        appId: "1:129438387489:web:ca13a76ff5b487d96e5c68"
    };

    firebase.initializeApp(firebaseConfig);

    // App Check vypnut - způsoboval blokování zápisů na GitHub Pages
    // const appCheck = firebase.appCheck();
    // appCheck.activate(
    //     new firebase.appCheck.ReCaptchaV3Provider('6LcR25ssAAAAAM0pmYyh9Pmec8S5atPgrCa19m9i'),
    //     true
    // );

    const db = firebase.firestore();
    const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

    // Vymazani firebase z globalniho scope, aby nesel vyjet cely obsah databaze z konzole
    delete window.firebase;

    let playerName = "ROBOT_" + Math.floor(Math.random() * 999);
    let highScores = [];

    // Načtení Top 5 skóre v reálném čase z Firebase
    db.collection('scores').orderBy('score', 'desc').limit(5).onSnapshot(snapshot => {
        highScores = [];
        snapshot.forEach(doc => {
            highScores.push(doc.data());
        });
    }, error => {
        console.error("Firebase chyba načítání leaderboardu:", !!error.message ? error.message : error);
    });

    function saveScore(score) {
        let timeSpent = Math.max(1, Math.floor((Date.now() - gameStartTime) / 1000));

        // Základní Anti-Cheat ochrana rychlosti zisku skóre (500 základ + 100 za sekundu max)
        if (score > (timeSpent * 100) + 500) {
            console.error("ANTI-CHEAT: Detekováno podezřelé skóre (příliš vysoké za krátký čas).");
            return;
        }

        // Generování jednoduchého obfuskovaného tokenu proti zápisu přes obyčejnou DB query
        let secret = "_SCRaP_SEcrET_2026!_";
        let token = btoa(playerName + "_" + score + "_" + timeSpent + secret);

        db.collection('scores').add({
            name: playerName,
            score: score,
            timeSpent: timeSpent,
            token: token,
            timestamp: serverTimestamp()
        }).catch(err => console.error("Firebase chyba ukládání skóre:", err));
    }

    const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, a: false, d: false, w: false, ' ': false, Escape: false, Enter: false, Backspace: false };

    window.addEventListener('keydown', (e) => {
        // Normalizace pro W, A, D, aby fungovaly i při zapnutém CapsLocku (A -> a)
        let normalizedKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (keys.hasOwnProperty(normalizedKey)) keys[normalizedKey] = true;

        if (gameState === 'GAMEOVER_INPUT') {
            if (e.key === 'Enter' && playerName.length > 0) {
                let finalScore = totalScore + Math.floor(maxDistance / 10) + bonusScore;
                try { saveScore(finalScore); } catch (err) { console.error("Chyba ukládání:", err); }
                gameState = 'LEADERBOARD';
            } else if (e.key === 'Backspace') {
                playerName = playerName.slice(0, -1);
            } else if (e.key.length === 1 && playerName.length < 12) {
                playerName += e.key.toUpperCase();
            }
        }

        if (!e.repeat && (normalizedKey === 'ArrowUp' || normalizedKey === 'w' || normalizedKey === ' ') && gameState === 'PLAYING') {
            if (player.grounded) {
                player.dy = -player.jumpForce;
                player.grounded = false;
                player.jumpCount = 1;
                playSound(jumpSound);
            } else if (player.jumpCount < 2) {
                player.dy = -player.jumpForce * 0.8;
                player.jumpCount = 2;
                playSound(jumpSound);
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        let normalizedKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (keys.hasOwnProperty(normalizedKey)) keys[normalizedKey] = false;
    });

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
    let cameraY = 0;

    let currentLevel = 1;
    let totalScore = 0;
    let maxDistance = 0;
    let bonusScore = 0;
    let scrapsCollected = 0;
    let gameStartTime = Date.now();

    let particles = [];
    let screenShake = 0;

    function spawnParticles(x, y, count, color, type = 'square') {
        for (let i = 0; i < count; i++) {
            particles.push({
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
    }

    function takeDamage() {
        screenShake = 20;
        spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 30, 'red', 'square');
        if (player.isGolden) {
            playSound(damageSound);
            player.lives = 2;
            player.isGolden = false;
            player.isInvincible = true;
            player.invincibleTimer = 120;
        } else if (player.lives >= 2) {
            playSound(damageSound);
            player.lives = 1;
            player.width = 80;
            player.height = 80;
            player.y += 40;
            player.isBig = false;
            player.isGolden = false;
            player.isInvincible = true;
            player.invincibleTimer = 120;
        } else {
            playSound(gameOverSound);
            gameState = 'GAMEOVER_INPUT';
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
    let lasers = [];
    let sawblades = [];
    let mapEnd = 15000;
    let flag = { x: 0, y: 0, width: 60, height: 200 };

    function generateLevel() {
        platforms = []; stars = []; turrets = []; stompers = []; drones = []; bullets = []; traps = []; scraps = []; lasers = []; sawblades = [];

        let gapMultiplier = Math.min(1.5, 1 + (currentLevel * 0.05));
        let heightMultiplier = Math.min(2.0, 1 + (currentLevel * 0.1));
        let enemyDensity = Math.min(0.9, 0.40 + (currentLevel * 0.08));

        // Maximální výškový rozdíl, který hráč zvládne double-jumpem (jumpForce=22, 0.8x = 17.6)
        const maxJumpableUp = 250;
        const maxSafeDrop = 500;

        platforms.push({ type: 'box', x: 0, y: 850, width: 800, height: 300 });
        let currentX = 900;
        let currentY = 850;
        let prevY = 850;

        // Trendový systém pro vertikální sekce
        let trend = 'FLAT';
        let trendSteps = 0;
        let trendMaxSteps = 0;

        while (currentX < mapEnd - 1500) {
            // Rozhodnutí o novém trendu
            if (trendSteps >= trendMaxSteps) {
                let r = Math.random();
                if (r < 0.35) { trend = 'ASCENDING'; trendMaxSteps = 3 + Math.floor(Math.random() * 5); }
                else if (r < 0.65) { trend = 'DESCENDING'; trendMaxSteps = 3 + Math.floor(Math.random() * 4); }
                else { trend = 'FLAT'; trendMaxSteps = 4 + Math.floor(Math.random() * 6); }
                trendSteps = 0;
            }
            trendSteps++;

            let gap = (80 + Math.random() * 100) * gapMultiplier;
            let yOffset;
            if (trend === 'ASCENDING') {
                yOffset = -(40 + Math.random() * 80) * heightMultiplier;
            } else if (trend === 'DESCENDING') {
                yOffset = (40 + Math.random() * 80) * heightMultiplier;
            } else {
                yOffset = ((Math.random() * 80) - 40) * heightMultiplier;
            }
            currentY += yOffset;

            // Rozšířené limity výšky
            if (currentY > 1800) currentY = 1800;
            if (currentY < -1500) currentY = -1500;

            // BEZPEČNOSTNÍ POJISTKA: Omezit výškový rozdíl aby byl level vždy dohratelný
            let heightDiff = prevY - currentY; // kladné = hráč musí skočit nahoru
            if (heightDiff > maxJumpableUp) {
                currentY = prevY - maxJumpableUp;
            }
            if (heightDiff < -maxSafeDrop) {
                currentY = prevY + maxSafeDrop;
            }

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
                if (randType < 0.10) pType = 'fragile';
                else if (randType < 0.20) pType = 'vent';
                else if (randType < 0.35) pType = 'conveyor';

                if (pType === 'box') {
                    platforms.push({ type: 'box', x: currentX, y: currentY, width: width, height: height });
                } else if (pType === 'fragile') {
                    platforms.push({ type: 'fragile', x: currentX, y: currentY, width: width, height: height, state: 'IDLE', timer: 0 });
                } else if (pType === 'vent') {
                    platforms.push({ type: 'vent', x: currentX, y: currentY, width: width, height: height });
                } else if (pType === 'conveyor') {
                    let dir = Math.random() < 0.5 ? 1 : -1;
                    let cSpeed = 2 + Math.random() * 3 + (currentLevel * 0.3);
                    platforms.push({ type: 'conveyor', x: currentX, y: currentY, width: width, height: height, speed: cSpeed * dir });
                }

                // Nejdříve rozhodnutí o blocích
                let hasBlocks = false;
                if (width > 300 && pType === 'box' && Math.random() < 0.6) {
                    hasBlocks = true;
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

                // Pružina: jen pokud nad platformou NEJSOU bloky
                if (!hasBlocks && pType === 'box' && width > 200 && Math.random() < 0.2) {
                    platforms.push({ type: 'spring', x: currentX + width / 2 - 30, y: currentY - 30, width: 60, height: 30, state: 'IDLE', timer: 0 });
                }

                if (Math.random() < 0.7) {
                    let numScraps = Math.floor(width / 70);
                    for (let i = 0; i < numScraps; i++) {
                        scraps.push({ x: currentX + 30 + i * 70, y: currentY - 60, width: 30, height: 30, collected: false });
                    }
                }

                if (width > 350 && pType === 'box') {
                    if (Math.random() < enemyDensity) {
                        let enemyType = Math.random();
                        if (enemyType < 0.20) {
                            stompers.push({
                                x: currentX + width / 2, y: currentY - 60, width: 60, height: 60,
                                startX: currentX + 20, endX: currentX + width - 80,
                                speed: 2 + Math.random() * 1.5, chargeSpeed: 7 + Math.random() * 3,
                                facingRight: false, state: 'PATROL', timer: 0
                            });
                        } else if (enemyType < 0.35) {
                            turrets.push({
                                x: currentX + width / 2 - 30, y: currentY - 60, width: 60, height: 60,
                                timer: 0, shootInterval: Math.max(30, 60 + Math.random() * 80 - (currentLevel * 5))
                            });
                        } else if (enemyType < 0.50) {
                            traps.push({
                                x: currentX + width / 2 - 30, y: currentY, width: 60, height: 0, maxHeight: 110,
                                state: 'HIDDEN', timer: Math.floor(Math.random() * 100)
                            });
                        } else if (enemyType < 0.65) {
                            drones.push({
                                x: currentX + width / 2,
                                y: currentY - 250 - Math.random() * 150,
                                width: 60, height: 60,
                                speed: 1.5 + Math.random() + (currentLevel * 0.2),
                                timer: 0,
                                shootInterval: Math.max(50, 90 + Math.random() * 60 - (currentLevel * 5)),
                                hoverOffset: Math.random() * Math.PI * 2
                            });
                        } else if (enemyType < 0.85) {
                            sawblades.push({
                                x: currentX + 20, y: currentY - 60, width: 60, height: 60,
                                startX: currentX + 20, endX: currentX + width - 80,
                                speed: 6 + Math.random() * 4 + (currentLevel * 0.5),
                                facingRight: true, angle: 0
                            });
                        } else {
                            lasers.push({
                                x: currentX + width / 2 - 20, y: currentY - 300 - Math.random() * 100, width: 40, height: 40,
                                timer: 0, state: 'OFF', onDuration: 60 + Math.random() * 60, offDuration: 60 + Math.random() * 60
                            });
                        }
                    }
                }

                if (Math.random() < 0.1) {
                    stars.push({ x: currentX + width / 2 - 20, y: currentY - 150, width: 40, height: 40, collected: false });
                }
                currentX += width;
            }
            prevY = currentY;
        }

        // Vlajka na výšce poslední platformy, ale plynule přechod z poslední výšky
        let finalY = currentY;
        // Pokud je vlajka příliš vysoko/nízko oproti posledním platformám, zarovnej
        if (Math.abs(finalY - prevY) > maxJumpableUp) {
            finalY = prevY;
        }
        platforms.push({ type: 'box', x: mapEnd - 1000, y: finalY, width: 1200, height: 400 });
        flag = { x: mapEnd - 400, y: finalY - 200, width: 60, height: 200 };
    }

    // ---------------------------------------------------------
    // 3B. BOSS FIGHT (každý 5. level)
    // ---------------------------------------------------------
    let isBossLevel = false;
    let boss = null;

    function generateBossLevel() {
        platforms = []; stars = []; turrets = []; stompers = []; drones = []; bullets = []; traps = []; scraps = []; lasers = []; sawblades = [];
        isBossLevel = true;

        let arenaWidth = 2500;
        let arenaY = 750;
        platforms.push({ type: 'box', x: 0, y: arenaY, width: arenaWidth, height: 400 });
        platforms.push({ type: 'box', x: 300, y: arenaY - 200, width: 200, height: 30 });
        platforms.push({ type: 'box', x: arenaWidth - 500, y: arenaY - 200, width: 200, height: 30 });
        platforms.push({ type: 'box', x: arenaWidth / 2 - 100, y: arenaY - 350, width: 200, height: 30 });

        let bossNum = Math.floor(currentLevel / 5); // 1, 2, 3, 4...
        let variant = ((bossNum - 1) % 3); // 0=CRUSHER, 1=GUNNER, 2=INFERNO

        // Škálování: každý boss encounter je těžší
        let hpScale = bossNum;
        let speedScale = 1 + (bossNum - 1) * 0.3;

        let bossHP, bossSpeed, bossSize, bossType, bossName;

        if (variant === 0) {
            // CRUSHER: Velký, pomalý, hodně HP, silný CHARGE a SLAM
            bossType = 'CRUSHER';
            bossName = 'DRTIČ';
            bossHP = 6 + hpScale * 3;
            bossSpeed = 2.5 * speedScale;
            bossSize = 220;
        } else if (variant === 1) {
            // GUNNER: Střední, střílí hodně, méně HP
            bossType = 'GUNNER';
            bossName = 'STŘELEC';
            bossHP = 4 + hpScale * 2;
            bossSpeed = 3.5 * speedScale;
            bossSize = 180;
        } else {
            // INFERNO: Rychlý, ohnivý, střední HP, zanechává ohnivé stopy
            bossType = 'INFERNO';
            bossName = 'INFERNO';
            bossHP = 5 + hpScale * 2;
            bossSpeed = 4 * speedScale;
            bossSize = 190;
        }

        boss = {
            x: arenaWidth / 2 - bossSize / 2, y: arenaY - bossSize, width: bossSize, height: bossSize,
            hp: bossHP, maxHP: bossHP,
            speed: bossSpeed,
            type: bossType, name: bossName,
            state: 'IDLE',
            timer: 0,
            facingRight: false,
            hitCooldown: 0,
            slamY: 0,
            phaseTimer: 0,
            bossNum: bossNum
        };

        mapEnd = arenaWidth;
        flag = { x: -9999, y: -9999, width: 0, height: 0 };
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
            gameStartTime = Date.now();
        }

        isBossLevel = false;
        boss = null;

        if (currentLevel % 5 === 0) {
            generateBossLevel();
        } else {
            mapEnd = 15000;
            generateLevel();
        }
        player.x = 100; player.y = 500; player.dy = 0;

        player.width = player.isBig ? 120 : 80;
        player.height = player.isBig ? 120 : 80;
        player.jumpForce = player.isBig ? 25 : 22;

        player.isInvincible = false; player.invincibleTimer = 0; player.jumpCount = 0;
        cameraX = 0; cameraY = 0; maxDistance = 0; bonusScore = 0;
    }

    // ---------------------------------------------------------
    // 4. POMOCNÉ KRESLÍCÍ FUNKCE A UI
    // ---------------------------------------------------------
    function drawBgCover(img) {
        if (!img || !img.complete || img.naturalHeight === 0) return false;
        const imgRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth, drawHeight;

        if (canvasRatio > imgRatio) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgRatio;
        } else {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgRatio;
        }

        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        return true;
    }
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
        let sy = cy - cameraY;
        let rot = Math.PI / 2 * 3; let step = Math.PI / spikes; ctx.beginPath(); ctx.moveTo(cx - cameraX, sy - outerRadius);
        for (let i = 0; i < spikes; i++) { ctx.lineTo((cx - cameraX) + Math.cos(rot) * outerRadius, sy + Math.sin(rot) * outerRadius); rot += step; ctx.lineTo((cx - cameraX) + Math.cos(rot) * innerRadius, sy + Math.sin(rot) * innerRadius); rot += step; }
        ctx.closePath(); ctx.fillStyle = 'gold'; ctx.fill();
    }

    function drawGear(gx, gy, radius, angle, color, strokeColor = 'rgba(0,0,0,0.6)') {
        ctx.save(); ctx.translate(gx - cameraX, gy - cameraY); ctx.rotate(angle); ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = color;
        for (let i = 0; i < 12; i++) {
            ctx.save(); ctx.rotate((i * Math.PI) / 6); ctx.fillRect(-radius / 8, -radius - (radius / 6), radius / 4, radius / 3); ctx.restore();
        }
        ctx.fillStyle = strokeColor; ctx.beginPath(); ctx.arc(0, 0, radius / 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawBoxPlatform(p) {
        let screenX = p.x - cameraX; let screenY = p.y - cameraY;
        ctx.fillStyle = '#bc8a5f'; ctx.fillRect(screenX, screenY, p.width, p.height);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(screenX, screenY + p.height / 2, p.width, p.height / 2);
        ctx.fillStyle = '#ebc49f'; ctx.fillRect(screenX, screenY, p.width, 3);
        ctx.fillStyle = '#8a5c3a'; ctx.fillRect(screenX, screenY + p.height - 10, p.width, 10);
        if (p.width > 20 && p.height > 20) {
            ctx.fillStyle = '#6e4a2d'; ctx.beginPath();
            ctx.arc(screenX + 15, screenY + 15, 5, 0, Math.PI * 2); ctx.arc(screenX + p.width - 15, screenY + 15, 5, 0, Math.PI * 2);
            if (p.height > 30) { ctx.arc(screenX + 15, screenY + p.height - 20, 5, 0, Math.PI * 2); ctx.arc(screenX + p.width - 15, screenY + p.height - 20, 5, 0, Math.PI * 2); }
            ctx.fill();
        }
    }

    function drawFragilePlatform(p) {
        let screenX = p.x - cameraX; let screenY = p.y - cameraY;
        if (p.state === 'SHAKING') screenX += (Math.random() * 6 - 3);

        ctx.fillStyle = '#8c3b21'; ctx.fillRect(screenX, screenY, p.width, p.height);
        ctx.fillStyle = '#b55a35'; ctx.fillRect(screenX, screenY, p.width, 5);
        ctx.fillStyle = '#5c2210'; ctx.fillRect(screenX, screenY + p.height - 10, p.width, 10);

        ctx.strokeStyle = '#3d1407'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(screenX + 20, screenY); ctx.lineTo(screenX + 30, screenY + 20); ctx.lineTo(screenX + 25, screenY + p.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(screenX + p.width - 30, screenY); ctx.lineTo(screenX + p.width - 40, screenY + 15); ctx.stroke();
    }

    function drawVentPlatform(p) {
        let screenX = p.x - cameraX; let screenY = p.y - cameraY;
        ctx.fillStyle = '#4a555c'; ctx.fillRect(screenX, screenY, p.width, p.height);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(screenX, screenY + p.height / 2, p.width, p.height / 2);
        ctx.fillStyle = '#788891'; ctx.fillRect(screenX, screenY, p.width, 3);
        ctx.fillStyle = '#262d30'; ctx.fillRect(screenX, screenY + p.height - 10, p.width, 10);

        ctx.fillStyle = '#1a1f21';
        for (let i = 20; i < p.width - 20; i += 40) {
            ctx.fillRect(screenX + i, screenY, 15, p.height);

            let timeOffset = (Date.now() / 200 + i) % 10;
            ctx.fillStyle = `rgba(200, 220, 230, ${0.5 - timeOffset / 20})`;
            ctx.beginPath();
            ctx.arc(screenX + i + 7.5, screenY - timeOffset * 5, 10 + timeOffset * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1a1f21';
        }
    }

    function drawConveyorPlatform(p) {
        let screenX = p.x - cameraX; let screenY = p.y - cameraY;
        ctx.fillStyle = '#444'; ctx.fillRect(screenX, screenY, p.width, p.height);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(screenX, screenY + p.height / 2, p.width, p.height / 2);
        ctx.fillStyle = '#666'; ctx.fillRect(screenX, screenY, p.width, 4);
        ctx.fillStyle = p.speed > 0 ? '#ffcc00' : '#ff3333';
        let offset = (Date.now() / 20 * Math.abs(p.speed)) % 40;
        if (p.speed < 0) offset = 40 - offset;
        for (let i = offset; i < p.width; i += 40) {
            ctx.fillRect(screenX + i, screenY, 10, 10);
        }
    }

    function drawSpring(p) {
        let screenX = p.x - cameraX; let screenY = p.y - cameraY;
        ctx.fillStyle = '#444'; ctx.fillRect(screenX, screenY + p.height - 10, p.width, 10);
        let springTop = p.state === 'BOUNCING' ? p.height - 20 : p.height - 10;
        ctx.strokeStyle = '#c00'; ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            let y1 = screenY + p.height - 10 - (i * springTop / 3);
            let y2 = screenY + p.height - 10 - ((i + 1) * springTop / 3);
            ctx.moveTo(screenX + 10, y1);
            ctx.lineTo(screenX + p.width - 10, y2);
        }
        ctx.stroke();
        ctx.fillStyle = '#888'; ctx.fillRect(screenX, screenY + p.height - springTop - 15, p.width, 10);
    }

    function drawBrick(p) {
        let screenX = p.x - cameraX; let screenY = p.y - cameraY;
        ctx.fillStyle = '#b34722';
        ctx.fillRect(screenX, screenY, p.width, p.height);
        ctx.strokeStyle = '#5c1e0a'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + p.height / 3); ctx.lineTo(screenX + p.width, screenY + p.height / 3);
        ctx.moveTo(screenX, screenY + (p.height / 3) * 2); ctx.lineTo(screenX + p.width, screenY + (p.height / 3) * 2);
        ctx.moveTo(screenX + p.width / 2, screenY); ctx.lineTo(screenX + p.width / 2, screenY + p.height / 3);
        ctx.moveTo(screenX + p.width / 4, screenY + p.height / 3); ctx.lineTo(screenX + p.width / 4, screenY + (p.height / 3) * 2);
        ctx.moveTo(screenX + (p.width / 4) * 3, screenY + p.height / 3); ctx.lineTo(screenX + (p.width / 4) * 3, screenY + (p.height / 3) * 2);
        ctx.moveTo(screenX + p.width / 2, screenY + (p.height / 3) * 2); ctx.lineTo(screenX + p.width / 2, screenY + p.height);
        ctx.stroke();
        ctx.strokeRect(screenX, screenY, p.width, p.height);
    }

    function drawQBlock(p) {
        let screenX = p.x - cameraX; let screenY = p.y - cameraY;
        if (!p.hit) {
            ctx.fillStyle = '#ffcc00'; ctx.fillRect(screenX, screenY, p.width, p.height);
            ctx.fillStyle = '#b38f00';
            ctx.fillRect(screenX + 4, screenY + 4, 6, 6); ctx.fillRect(screenX + p.width - 10, screenY + 4, 6, 6);
            ctx.fillRect(screenX + 4, screenY + p.height - 10, 6, 6); ctx.fillRect(screenX + p.width - 10, screenY + p.height - 10, 6, 6);
            ctx.fillStyle = '#b34722'; ctx.font = 'bold 35px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('?', screenX + p.width / 2, screenY + p.height / 2 + 2);
        } else {
            ctx.fillStyle = '#5c5c5c'; ctx.fillRect(screenX, screenY, p.width, p.height);
            ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 4; ctx.strokeRect(screenX, screenY, p.width, p.height);
            ctx.fillStyle = '#2b2b2b';
            ctx.fillRect(screenX + 6, screenY + 6, 8, 8); ctx.fillRect(screenX + p.width - 14, screenY + 6, 8, 8);
            ctx.fillRect(screenX + 6, screenY + p.height - 14, 8, 8); ctx.fillRect(screenX + p.width - 14, screenY + p.height - 14, 8, 8);
        }
    }

    function drawTurret(t) {
        let screenX = t.x - cameraX; let screenY = t.y - cameraY; let centerX = screenX + t.width / 2; let centerY = screenY + t.height / 2;
        let targetX = player.x + player.width / 2 - cameraX; let targetY = player.y + player.height / 2 - cameraY;
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
        let screenX = s.x - cameraX; let screenY = s.y - cameraY; let centerY = screenY + s.height / 2;
        ctx.save();
        ctx.fillStyle = '#a67b5b'; ctx.fillRect(screenX, screenY, s.width, s.height);

        let sRatio = s.width / 90;
        ctx.fillStyle = '#3b2515'; let armX = s.facingRight ? screenX + s.width - 5 * sRatio : screenX - 25 * sRatio; ctx.fillRect(armX, centerY - 10 * sRatio, 30 * sRatio, 20 * sRatio);

        ctx.fillStyle = (s.state === 'CHARGE' || s.state === 'CHARGING') ? 'red' : '#ffcc00';
        let eyeX = s.facingRight ? screenX + s.width - 20 * sRatio : screenX + 10 * sRatio; ctx.beginPath(); ctx.arc(eyeX, screenY + 20 * sRatio, 8 * sRatio, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeX + (s.facingRight ? -12 * sRatio : 12 * sRatio), screenY + 20 * sRatio, 6 * sRatio, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#8a5c3a'; ctx.fillRect(screenX + s.width / 4, screenY - 10 * sRatio, s.width / 2, 10 * sRatio);
        drawGear(s.x + s.width / 2, s.y - 5 * sRatio, 12 * sRatio, Date.now() / 200, '#bc8a5f', 'rgba(0,0,0,0.8)');

        ctx.fillStyle = '#5c3a21'; let legOffset = s.facingRight ? 10 * sRatio : -10 * sRatio;
        ctx.fillRect(screenX + s.width / 4 + legOffset, screenY + s.height - 10 * sRatio, 20 * sRatio, 20 * sRatio); ctx.fillRect(screenX + s.width * 0.6 + legOffset, screenY + s.height - 10 * sRatio, 20 * sRatio, 20 * sRatio);
        ctx.restore();
    }

    function drawSawblade(s) {
        let screenX = s.x - cameraX;
        let cx = screenX + s.width / 2;
        let cy = s.y - cameraY + s.height / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(s.angle);
        ctx.fillStyle = '#aaa';
        ctx.beginPath(); ctx.arc(0, 0, s.width / 2 - 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#555';
        for (let i = 0; i < 8; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 4);
            ctx.beginPath(); ctx.moveTo(s.width / 2 - 5, -5); ctx.lineTo(s.width / 2 + 5, 0); ctx.lineTo(s.width / 2 - 5, 5); ctx.fill();
            ctx.restore();
        }
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawLaser(l) {
        let screenX = l.x - cameraX; let screenY = l.y - cameraY;
        ctx.fillStyle = '#444'; ctx.fillRect(screenX, screenY, l.width, l.height);
        ctx.fillStyle = '#222'; ctx.fillRect(screenX + 10, screenY + l.height, l.width - 20, 10);

        if (l.state === 'WARNING') {
            let alpha = Math.abs(Math.sin(Date.now() / 100));
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.5})`;
            ctx.fillRect(screenX + 15, screenY + l.height + 10, l.width - 30, canvas.height + 2000);
        } else if (l.state === 'ON') {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(255, 50, 50, 0.5)';
            ctx.fillRect(screenX - 10, screenY + l.height + 10, l.width + 20, canvas.height + 2000);
            ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
            ctx.fillRect(screenX + 5, screenY + l.height + 10, l.width - 10, canvas.height + 2000);
            ctx.fillStyle = 'white'; ctx.fillRect(screenX + 15, screenY + l.height + 10, l.width - 30, canvas.height + 2000);
            ctx.restore();
        }
    }

    function drawDrone(d) {
        let screenX = d.x - cameraX;
        let centerX = screenX + d.width / 2;
        let centerY = d.y - cameraY + d.height / 2;

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
        let targetY = player.y + player.height / 2 - cameraY;
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
        let screenX = tr.x - cameraX; let screenY = tr.y - cameraY;
        ctx.fillStyle = '#1a110a'; ctx.fillRect(screenX - 5, screenY, tr.width + 10, 10);
        if (tr.height > 0) {
            ctx.fillStyle = '#7a7a7a'; ctx.fillRect(screenX + 15, screenY - tr.height, 30, tr.height);
            ctx.fillStyle = '#a33327'; ctx.fillRect(screenX, screenY - tr.height - 30, tr.width, 30);
            ctx.fillStyle = '#eeeeee'; ctx.beginPath(); ctx.moveTo(screenX, screenY - tr.height - 30); ctx.lineTo(screenX + 15, screenY - tr.height - 45);
            ctx.lineTo(screenX + 30, screenY - tr.height - 30); ctx.lineTo(screenX + 45, screenY - tr.height - 45); ctx.lineTo(screenX + 60, screenY - tr.height - 30); ctx.fill();
        }
    }

    function drawScrap(sc) {
        let screenX = sc.x - cameraX; let screenY = sc.y - cameraY;
        ctx.save(); ctx.translate(screenX + 15, screenY + 15); ctx.rotate(Date.now() / 400);
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
            if (!drawBgCover(menuBg)) { ctx.fillStyle = '#2e1e12'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

            drawBtn("HRÁT", canvas.width / 2 - 150, canvas.height / 2 - 150, 300, 80, () => {
                gameState = 'PLAYING'; restartLevel(true); playMusic();
            });
            drawBtn("LEADERBOARD", canvas.width / 2 - 150, canvas.height / 2 - 50, 300, 80, () => {
                gameState = 'LEADERBOARD';
            });
            drawBtn("NASTAVENÍ", canvas.width / 2 - 150, canvas.height / 2 + 50, 300, 80, () => {
                gameState = 'SETTINGS';
            });
            drawBtn("CREDITS", canvas.width / 2 - 150, canvas.height / 2 + 150, 300, 80, () => {
                gameState = 'CREDITS';
            });
        }
        else if (gameState === 'SETTINGS') {
            ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 80px Georgia";
            ctx.fillText("NASTAVENÍ ZVUKU", canvas.width / 2, 300);

            // --- HUDBA ---
            drawBtn("-", canvas.width / 2 - 250, 450, 80, 80, () => {
                if (musicLevel > 0) { musicLevel--; updateVolumes(); }
            });

            ctx.fillStyle = '#bc8a5f'; ctx.fillRect(canvas.width / 2 - 150, 450, 300, 80);
            ctx.strokeStyle = '#8a5c3a'; ctx.lineWidth = 4; ctx.strokeRect(canvas.width / 2 - 150, 450, 300, 80);
            ctx.fillStyle = 'white'; ctx.font = 'bold 35px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText("HUDBA: " + (musicLevel * 10) + "%", canvas.width / 2, 490);

            drawBtn("+", canvas.width / 2 + 170, 450, 80, 80, () => {
                if (musicLevel < 10) { musicLevel++; updateVolumes(); }
            });

            // --- EFEKTY ---
            drawBtn("-", canvas.width / 2 - 250, 570, 80, 80, () => {
                if (sfxLevel > 0) { sfxLevel--; updateVolumes(); playSound(jumpSound); }
            });

            ctx.fillStyle = '#bc8a5f'; ctx.fillRect(canvas.width / 2 - 150, 570, 300, 80);
            ctx.strokeStyle = '#8a5c3a'; ctx.lineWidth = 4; ctx.strokeRect(canvas.width / 2 - 150, 570, 300, 80);
            ctx.fillStyle = 'white'; ctx.font = 'bold 35px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText("EFEKTY: " + (sfxLevel * 10) + "%", canvas.width / 2, 610);

            drawBtn("+", canvas.width / 2 + 170, 570, 80, 80, () => {
                if (sfxLevel < 10) { sfxLevel++; updateVolumes(); playSound(jumpSound); }
            });

            drawBtn("ZPĚT", canvas.width / 2 - 200, 750, 400, 80, () => {
                gameState = 'MENU';
            });
        }
        else if (gameState === 'CREDITS') {
            ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 50px Georgia";
            ctx.fillText("Hru vytvořili:", canvas.width / 2, 400);
            ctx.fillStyle = "#ebc49f"; ctx.font = "bold 70px Georgia";
            ctx.fillText("Adam Macků a Zdeněk Vápeník", canvas.width / 2, 500);
            drawBtn("ZPĚT DO MENU", canvas.width / 2 - 200, canvas.height - 200, 400, 80, () => { gameState = 'MENU'; });
        }
        else if (gameState === 'GAMEOVER_INPUT') {
            stopMusic();
            ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#a33327"; ctx.textAlign = "center"; ctx.font = "bold 100px Georgia"; ctx.fillText("ZNIČEN!", canvas.width / 2, 300);
            ctx.fillStyle = "white"; ctx.font = "bold 50px Georgia"; ctx.fillText("ZADEJ SVÉ JMÉNO:", canvas.width / 2, 450);
            ctx.fillStyle = "#bc8a5f"; ctx.fillRect(canvas.width / 2 - 300, 500, 600, 100);
            ctx.fillStyle = "white"; ctx.font = "bold 60px Courier New";
            ctx.fillText(playerName + (Math.floor(Date.now() / 500) % 2 === 0 ? "_" : ""), canvas.width / 2, 570);
            ctx.font = "italic 30px Georgia"; ctx.fillText("STISKNI ENTER PRO ULOŽENÍ", canvas.width / 2, 650);
        }
        else if (gameState === 'LEADERBOARD') {
            stopMusic();
            ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 80px Georgia";
            ctx.fillText("NEJLEPŠÍ SKÓRE", canvas.width / 2, 200);
            highScores.forEach((s, i) => { ctx.font = "bold 50px Georgia"; ctx.fillText(`${i + 1}. ${s.name} --- ${s.score}`, canvas.width / 2, 350 + i * 80); });
            drawBtn("ZPĚT", canvas.width / 2 - 150, 850, 300, 80, () => { gameState = 'MENU'; });
        }
        else if (gameState === 'VICTORY') {
            stopMusic();
            ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#42cbf5";
            ctx.textAlign = "center"; ctx.font = "bold 120px Georgia";

            ctx.fillText(`LEVEL ${currentLevel} DOKONČEN!`, canvas.width / 2, canvas.height / 2 - 50);

            drawBtn("DALŠÍ LEVEL", canvas.width / 2 - 200, canvas.height / 2 + 80, 400, 80, () => {
                totalScore += Math.floor(maxDistance / 10) + bonusScore;
                currentLevel++;
                gameState = 'PLAYING';
                restartLevel(false);
                playMusic();
            });
            drawBtn("MENU", canvas.width / 2 - 200, canvas.height / 2 + 180, 400, 80, () => { gameState = 'MENU'; });
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

                player.lastX = player.x;
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

                    if (p.type === 'spring' && p.state === 'BOUNCING') {
                        p.timer--;
                        if (p.timer <= 0) p.state = 'IDLE';
                    }

                    // Detekce překrytí (AABB)
                    let overlapX = player.x + player.width > p.x && player.x < p.x + p.width;
                    let overlapY = player.y + player.height > p.y && player.y < p.y + p.height;

                    if (!overlapX) continue;

                    let isSolid = (p.type === 'box' || (p.type === 'fragile' && p.state !== 'FALLING') || p.type === 'vent' || p.type === 'brick' || p.type === 'qblock' || p.type === 'conveyor' || p.type === 'spring');

                    // PŘISTÁNÍ SHORA (padání dolů na platformu)
                    if (isSolid && player.dy >= 0) {
                        let prevBottom = player.lastY + player.height;
                        let currBottom = player.y + player.height;
                        // Rozšířená tolerance: pokud hráč byl nad platformou a teď je v ní nebo pod ní
                        if (prevBottom <= p.y + 10 && currBottom >= p.y) {
                            if (!player.grounded && player.dy > 5) spawnParticles(player.x + player.width / 2, p.y, 10, '#888', 'dust');
                            if (p.type === 'spring') {
                                player.dy = -player.jumpForce * 1.5;
                                player.grounded = false; player.jumpCount = 1;
                                p.state = 'BOUNCING';
                                p.timer = 15;
                                screenShake = 10;
                                spawnParticles(player.x + player.width / 2, p.y + p.height, 20, '#c00', 'dust');
                                playSound(jumpSound);
                            } else {
                                player.y = p.y - player.height; player.dy = 0; player.grounded = true; player.jumpCount = 0;

                                if (p.type === 'conveyor') {
                                    player.x += p.speed;
                                } else if (p.type === 'fragile' && p.state === 'IDLE') {
                                    p.state = 'SHAKING';
                                } else if (p.type === 'vent') {
                                    player.dy = -player.jumpForce * 1.6; player.grounded = false; player.jumpCount = 1;
                                    playSound(jumpSound);
                                }
                            }
                        }
                    }
                    // NARAZ ZESPODU (brick/qblock)
                    else if ((p.type === 'brick' || p.type === 'qblock') && player.dy < 0) {
                        if (player.y <= p.y + p.height && player.lastY >= p.y + p.height / 2) {
                            player.y = p.y + p.height;
                            player.dy = 0;

                            if (p.type === 'brick') {
                                p.destroyed = true;
                                bonusScore += 50;
                                playSound(jumpSound);
                                spawnParticles(p.x + p.width / 2, p.y + p.height / 2, 15, '#b34722', 'square');
                            } else if (p.type === 'qblock' && !p.hit) {
                                p.hit = true;
                                playSound(jumpSound);

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
                    // BOČNÍ KOLIZE: pokud hráč je UVNITŘ solidní platformy, vytlač ho ven
                    else if (isSolid && overlapY) {
                        let playerCenterX = player.x + player.width / 2;
                        let platCenterX = p.x + p.width / 2;
                        if (playerCenterX < platCenterX) {
                            player.x = p.x - player.width;
                        } else {
                            player.x = p.x + p.width;
                        }
                    }
                }

                if (player.x < 0) player.x = 0; if (player.x + player.width > mapEnd) player.x = mapEnd - player.width;

                if (player.y > cameraY + canvas.height + 400) {
                    playSound(gameOverSound); gameState = 'GAMEOVER_INPUT';
                }

                if (player.x > canvas.width / 2) cameraX = player.x - canvas.width / 2;
                if (cameraX > mapEnd - canvas.width) cameraX = mapEnd - canvas.width;

                // Plynulé sledování hráče po ose Y
                let targetCameraY = player.y - canvas.height / 2 + player.height / 2;
                cameraY += (targetCameraY - cameraY) * 0.08;

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
                    if (Math.abs(t.x - player.x) < Math.max(1200, canvas.width)) {
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

                    if (dist < Math.max(1000, canvas.width)) {
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
                            spawnParticles(d.x + d.width / 2, d.y + d.height / 2, 30, '#7a7a7a', 'circle');
                            screenShake = 10;
                            drones.splice(i, 1);
                            player.dy = -15;
                            player.jumpCount = 1;
                            bonusScore += 400; playSound(jumpSound);
                        }
                        else if (!player.isInvincible) {
                            takeDamage();
                            if (gameState !== 'GAMEOVER_INPUT') { player.dy = -5; }
                        }
                    }
                }

                for (let i = bullets.length - 1; i >= 0; i--) {
                    let b = bullets[i]; b.x += b.vx; b.y += b.vy; let bulletHit = false;
                    if (b.x < player.x + player.width && b.x + b.width > player.x && b.y < player.y + player.height && b.y + b.height > player.y && !player.isInvincible) {
                        takeDamage(); bullets.splice(i, 1); bulletHit = true;
                    }
                    if (!bulletHit && (b.x < cameraX - 1000 || b.x > cameraX + canvas.width + 1000)) { bullets.splice(i, 1); }
                }

                for (let i = sawblades.length - 1; i >= 0; i--) {
                    let s = sawblades[i];
                    s.x += s.facingRight ? s.speed : -s.speed;
                    s.angle += s.facingRight ? 0.2 : -0.2;
                    if (s.x > s.endX) { s.x = s.endX; s.facingRight = false; }
                    if (s.x < s.startX) { s.x = s.startX; s.facingRight = true; }
                    if (Math.random() < 0.3) spawnParticles(s.x + s.width / 2, s.y + s.height, 2, '#ffcc00', 'circle');

                    if (player.x < s.x + s.width && player.x + player.width > s.x && player.y < s.y + s.height && player.y + player.height > s.y) {
                        let prevBottom = player.lastY + player.height;
                        if (player.dy > 0 && prevBottom <= s.y + 30) {
                            spawnParticles(s.x + s.width / 2, s.y + s.height / 2, 30, '#aaa', 'circle');
                            screenShake = 10;
                            sawblades.splice(i, 1); player.dy = -15; player.jumpCount = 1;
                            bonusScore += 300; playSound(jumpSound);
                        } else if (!player.isInvincible) {
                            takeDamage();
                            if (gameState !== 'GAMEOVER_INPUT') { player.dy = -10; player.y = s.y - player.height; }
                        }
                    }
                }

                for (let l of lasers) {
                    if (Math.abs(l.x - player.x) < Math.max(2000, canvas.width)) {
                        l.timer++;
                        if (l.state === 'OFF' && l.timer > l.offDuration) { l.state = 'WARNING'; l.timer = 0; }
                        else if (l.state === 'WARNING' && l.timer > 30) { l.state = 'ON'; l.timer = 0; }
                        else if (l.state === 'ON' && l.timer > l.onDuration) { l.state = 'OFF'; l.timer = 0; }
                    }
                    if (l.state === 'ON') {
                        let beamLeft = l.x + 10; let beamRight = l.x + l.width - 10;
                        if (player.x + player.width > beamLeft && player.x < beamRight && player.y + player.height > l.y + l.height) {
                            if (!player.isInvincible) {
                                takeDamage();
                                if (gameState !== 'GAMEOVER_INPUT') { player.dy = -10; player.x += (player.x < l.x + l.width / 2) ? -50 : 50; }
                            }
                        }
                    }
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
                            if (gameState !== 'GAMEOVER_INPUT') { player.y = trapTop - player.height - 10; player.dy = -10; }
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
                        if (Math.random() < 0.4) spawnParticles(s.x + s.width / 2, s.y + s.height, 2, '#a67b5b', 'dust');
                    }

                    if (player.x < s.x + s.width && player.x + player.width > s.x && player.y < s.y + s.height && player.y + player.height > s.y) {
                        let prevBottom = player.lastY + player.height;

                        if (player.dy > 0 && prevBottom <= s.y + 30) {
                            spawnParticles(s.x + s.width / 2, s.y + s.height / 2, 40, '#a67b5b', 'square');
                            screenShake = 15;
                            stompers.splice(i, 1); player.dy = -18;
                            player.jumpCount = 1;
                            bonusScore += 500; playSound(jumpSound);
                        }
                        else if (!player.isInvincible) {
                            takeDamage();
                            if (gameState !== 'GAMEOVER_INPUT') { s.state = 'PATROL'; s.x += s.facingRight ? -50 : 50; }
                        }
                    }
                }

                for (let i = particles.length - 1; i >= 0; i--) {
                    let pt = particles[i];
                    pt.x += pt.vx; pt.y += pt.vy;
                    pt.vy += gravity * 0.5;
                    pt.life -= pt.decay;
                    if (pt.life <= 0) particles.splice(i, 1);
                }
                if (screenShake > 0) screenShake--;

                // BOSS FIGHT LOGIKA
                if (isBossLevel && boss && boss.hp > 0) {
                    boss.phaseTimer++;
                    if (boss.hitCooldown > 0) boss.hitCooldown--;

                    let arenaY = 750;

                    if (boss.state === 'IDLE') {
                        boss.facingRight = player.x > boss.x;
                        boss.timer++;
                        let idleTime = boss.type === 'INFERNO' ? 50 : (boss.type === 'GUNNER' ? 70 : 90);
                        if (boss.timer > idleTime) {
                            let attack = Math.random();
                            if (boss.type === 'CRUSHER') {
                                // Crusher: hodně CHARGE a SLAM
                                if (attack < 0.45) { boss.state = 'CHARGE'; }
                                else if (attack < 0.85) { boss.state = 'SLAM'; boss.slamY = boss.y; }
                                else { boss.state = 'SHOOT'; }
                            } else if (boss.type === 'GUNNER') {
                                // Gunner: hodně střílí
                                if (attack < 0.15) { boss.state = 'CHARGE'; }
                                else if (attack < 0.30) { boss.state = 'SLAM'; boss.slamY = boss.y; }
                                else { boss.state = 'SHOOT'; }
                            } else {
                                // Inferno: rychlý charge s ohnivou stopou
                                if (attack < 0.50) { boss.state = 'CHARGE'; }
                                else if (attack < 0.70) { boss.state = 'SLAM'; boss.slamY = boss.y; }
                                else { boss.state = 'SHOOT'; }
                            }
                            boss.timer = 0;
                        }
                    } else if (boss.state === 'CHARGE') {
                        let dir = boss.facingRight ? 1 : -1;
                        let chargeMultiplier = boss.type === 'CRUSHER' ? 2.5 : (boss.type === 'INFERNO' ? 4 : 2);
                        boss.x += dir * boss.speed * chargeMultiplier;
                        if (Math.random() < 0.5) {
                            let dustColor = boss.type === 'INFERNO' ? '#ff6600' : (boss.type === 'CRUSHER' ? '#a33327' : '#3366cc');
                            spawnParticles(boss.x + boss.width / 2, boss.y + boss.height, 2, dustColor, 'dust');
                        }
                        // Inferno zanechává ohnivou stopu
                        if (boss.type === 'INFERNO' && Math.random() < 0.6) {
                            spawnParticles(boss.x + boss.width / 2, boss.y + boss.height - 10, 3, '#ff4400', 'spark');
                        }
                        boss.timer++;
                        if (boss.timer % 30 === 0) boss.facingRight = player.x > boss.x;
                        if (boss.x < 10) { boss.x = 10; boss.state = 'STUNNED'; boss.timer = 0; screenShake = 15; }
                        if (boss.x + boss.width > mapEnd - 10) { boss.x = mapEnd - boss.width - 10; boss.state = 'STUNNED'; boss.timer = 0; screenShake = 15; }
                        if (boss.timer > 120) { boss.state = 'IDLE'; boss.timer = 0; }
                    } else if (boss.state === 'SLAM') {
                        boss.timer++;
                        let slamPower = boss.type === 'CRUSHER' ? 15 : 12;
                        if (boss.timer < 30) {
                            boss.y -= slamPower;
                        } else if (boss.timer < 45) {
                            boss.facingRight = player.x > boss.x;
                            boss.x += (boss.facingRight ? 1 : -1) * 5;
                        } else if (boss.timer < 60) {
                            boss.y += 22;
                            if (boss.y >= arenaY - boss.height) {
                                boss.y = arenaY - boss.height;
                                let shockRadius = boss.type === 'CRUSHER' ? 400 : 300;
                                screenShake = boss.type === 'CRUSHER' ? 30 : 25;
                                let dustColor = boss.type === 'INFERNO' ? '#ff6600' : (boss.type === 'CRUSHER' ? '#a33327' : '#3366cc');
                                spawnParticles(boss.x + boss.width / 2, arenaY, 40, dustColor, 'dust');
                                if (Math.abs((player.x + player.width / 2) - (boss.x + boss.width / 2)) < shockRadius && player.y + player.height >= arenaY - 20) {
                                    if (!player.isInvincible) { takeDamage(); if (gameState !== 'GAMEOVER_INPUT') { player.dy = -15; } }
                                }
                                boss.state = 'STUNNED';
                                boss.timer = 0;
                            }
                        }
                    } else if (boss.state === 'SHOOT') {
                        boss.timer++;
                        boss.facingRight = player.x > boss.x;
                        let shootInterval = boss.type === 'GUNNER' ? 10 : 20;
                        let shootDuration = boss.type === 'GUNNER' ? 80 : 60;
                        let bulletSpeed = boss.type === 'GUNNER' ? 9 : 7;
                        if (boss.timer % shootInterval === 0 && boss.timer <= shootDuration) {
                            let startX = boss.facingRight ? boss.x + boss.width : boss.x;
                            let startY = boss.y + boss.height / 2;
                            let targetX = player.x + player.width / 2;
                            let targetY = player.y + player.height / 2;
                            // Gunner střílí burst s mírným rozptylem
                            let spread = boss.type === 'GUNNER' ? (Math.random() - 0.5) * 0.3 : 0;
                            let angle = Math.atan2(targetY - startY, targetX - startX) + spread;
                            bullets.push({ x: startX, y: startY, width: 20, height: 20, vx: Math.cos(angle) * bulletSpeed, vy: Math.sin(angle) * bulletSpeed });
                        }
                        if (boss.timer > shootDuration + 20) { boss.state = 'IDLE'; boss.timer = 0; }
                    } else if (boss.state === 'STUNNED') {
                        boss.timer++;
                        let stunTime = boss.type === 'CRUSHER' ? 100 : (boss.type === 'INFERNO' ? 60 : 80);
                        if (boss.timer > stunTime) { boss.state = 'IDLE'; boss.timer = 0; }
                    }

                    // Gravitace pro bosse (pokud není ve vzduchu kvůli slamu)
                    if (boss.state !== 'SLAM') {
                        if (boss.y < arenaY - boss.height) boss.y += 8;
                        if (boss.y > arenaY - boss.height) boss.y = arenaY - boss.height;
                    }

                    // Kolize hráče s bossem
                    if (player.x < boss.x + boss.width && player.x + player.width > boss.x && player.y < boss.y + boss.height && player.y + player.height > boss.y) {
                        let prevBottom = player.lastY + player.height;
                        // Skok na hlavu
                        if (player.dy > 0 && prevBottom <= boss.y + 40 && boss.hitCooldown <= 0) {
                            boss.hp--;
                            boss.hitCooldown = 60;
                            player.dy = -player.jumpForce;
                            player.jumpCount = 1;
                            screenShake = 20;
                            spawnParticles(boss.x + boss.width / 2, boss.y, 30, '#ff4444', 'square');
                            playSound(jumpSound);
                            if (boss.hp <= 0) {
                                // Boss poražen!
                                spawnParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 80, '#ffcc00', 'square');
                                spawnParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 40, '#a33327', 'circle');
                                screenShake = 40;
                                bonusScore += 10000;
                                boss.state = 'DEAD';
                                // Výhra po krátké pauze
                                setTimeout(() => { gameState = 'VICTORY'; }, 1500);
                            } else {
                                boss.state = 'STUNNED';
                                boss.timer = 0;
                            }
                        } else if (!player.isInvincible && boss.hitCooldown <= 0) {
                            // Kontaktní poškození
                            takeDamage();
                            if (gameState !== 'GAMEOVER_INPUT') {
                                player.dy = -12;
                                player.x += (player.x < boss.x + boss.width / 2) ? -80 : 80;
                            }
                        }
                    }
                }

                if (player.x < flag.x + flag.width && player.x + player.width > flag.x && player.y < flag.y + flag.height && player.y + player.height > flag.y) { gameState = 'VICTORY'; }
            }

            // VYKRESLOVÁNÍ
            if (!drawBgCover(factoryBg)) { ctx.fillStyle = '#5c8fb3'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

            ctx.save();
            if (screenShake > 0) {
                let sx = (Math.random() - 0.5) * screenShake;
                let sy = (Math.random() - 0.5) * screenShake;
                ctx.translate(sx, sy);
            }

            for (let p of platforms) {
                if (p.type === 'box') { drawBoxPlatform(p); }
                else if (p.type === 'fragile') { drawFragilePlatform(p); }
                else if (p.type === 'vent') { drawVentPlatform(p); }
                else if (p.type === 'brick' && !p.destroyed) { drawBrick(p); }
                else if (p.type === 'qblock') { drawQBlock(p); }
                else if (p.type === 'gear') { p.angle += p.speed; drawGear(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, p.angle, p.color); }
                else if (p.type === 'conveyor') { drawConveyorPlatform(p); }
                else if (p.type === 'spring') { drawSpring(p); }
            }

            for (let s of stars) { if (!s.collected) { drawStar(s.x + 20, s.y + 20, 5, 20, 10); } }
            for (let t of turrets) { drawTurret(t); }
            traps.forEach(drawTrap);
            stompers.forEach(drawStomper);
            drones.forEach(drawDrone);
            sawblades.forEach(drawSawblade);
            lasers.forEach(drawLaser);

            for (let sc of scraps) { if (!sc.collected) { drawScrap(sc); } }

            ctx.fillStyle = '#777'; ctx.fillRect(flag.x - cameraX, flag.y - cameraY, 10, flag.height);
            ctx.fillStyle = '#32a852'; ctx.fillRect(flag.x - cameraX + 10, flag.y - cameraY, flag.width, 40);

            // BOSS VYKRESLENÍ
            if (isBossLevel && boss && boss.state !== 'DEAD') {
                let bx = boss.x - cameraX;
                let by = boss.y - cameraY;
                let blink = boss.state === 'STUNNED' && Math.floor(Date.now() / 100) % 2 === 0;

                if (!blink) {
                    // Barvy podle typu
                    let bodyMain, bodyDark, bodyLight, eyeColor, eyeCharge, armColor, legColor, gearColor;
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

                    // Tělo
                    ctx.fillStyle = boss.state === 'CHARGE' ? bodyLight : bodyMain;
                    ctx.fillRect(bx, by, boss.width, boss.height);
                    ctx.fillStyle = bodyDark;
                    ctx.fillRect(bx, by + boss.height - 15, boss.width, 15);
                    ctx.fillStyle = bodyLight;
                    ctx.fillRect(bx, by, boss.width, 8);

                    // Oči
                    let eyeBaseX = boss.facingRight ? bx + boss.width - 70 : bx + 20;
                    ctx.fillStyle = boss.state === 'CHARGE' ? eyeCharge : eyeColor;
                    ctx.beginPath(); ctx.arc(eyeBaseX, by + 60, 20, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(eyeBaseX + 40, by + 60, 16, 0, Math.PI * 2); ctx.fill();
                    let pupilDir = boss.facingRight ? 5 : -5;
                    ctx.fillStyle = '#000';
                    ctx.beginPath(); ctx.arc(eyeBaseX + pupilDir, by + 62, 8, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(eyeBaseX + 40 + pupilDir, by + 62, 6, 0, Math.PI * 2); ctx.fill();

                    // Paže – Gunner má děla
                    ctx.fillStyle = armColor;
                    let armY = by + boss.height / 2;
                    if (boss.type === 'GUNNER') {
                        ctx.fillRect(bx - 40, armY - 10, 45, 35);
                        ctx.fillRect(bx + boss.width - 5, armY - 10, 45, 35);
                        ctx.fillStyle = '#555';
                        ctx.fillRect(bx - 45, armY, 10, 15);
                        ctx.fillRect(bx + boss.width + 35, armY, 10, 15);
                    } else {
                        ctx.fillRect(bx - 30, armY - 15, 35, 50);
                        ctx.fillRect(bx + boss.width - 5, armY - 15, 35, 50);
                    }

                    // Nohy
                    ctx.fillStyle = legColor;
                    ctx.fillRect(bx + 30, by + boss.height - 5, 40, 30);
                    ctx.fillRect(bx + boss.width - 70, by + boss.height - 5, 40, 30);

                    // Ozubené kolo
                    drawGear(boss.x + boss.width / 2, boss.y - 5, 25, Date.now() / 150, gearColor, 'rgba(0,0,0,0.8)');

                    // Ústa
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(bx + 40, by + 110, boss.width - 80, 30);
                    ctx.fillStyle = boss.type === 'INFERNO' ? '#ff8800' : '#ccc';
                    for (let i = 0; i < 5; i++) {
                        ctx.fillRect(bx + 50 + i * 22, by + 110, 10, 15);
                    }

                    // Inferno: oheň kolem těla
                    if (boss.type === 'INFERNO' && boss.state !== 'STUNNED') {
                        for (let i = 0; i < 3; i++) {
                            let fx = bx + Math.random() * boss.width;
                            let fy = by + boss.height - 20 - Math.random() * 30;
                            ctx.fillStyle = `rgba(255, ${100 + Math.floor(Math.random() * 100)}, 0, 0.6)`;
                            ctx.beginPath(); ctx.arc(fx, fy, 5 + Math.random() * 8, 0, Math.PI * 2); ctx.fill();
                        }
                    }
                }

                // Health Bar
                let hpBarWidth = boss.width + 40;
                let hpBarX = bx - 20;
                let hpBarY = by - 50;
                ctx.fillStyle = '#333'; ctx.fillRect(hpBarX, hpBarY, hpBarWidth, 20);
                let hpRatio = Math.max(0, boss.hp / boss.maxHP);
                let hpColor = boss.type === 'CRUSHER' ? '#e74c3c' : (boss.type === 'GUNNER' ? '#3498db' : '#e67e22');
                if (hpRatio <= 0.25) hpColor = '#c0392b';
                ctx.fillStyle = hpColor;
                ctx.fillRect(hpBarX + 2, hpBarY + 2, (hpBarWidth - 4) * hpRatio, 16);
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, 20);
                ctx.fillStyle = 'white'; ctx.font = 'bold 16px Georgia'; ctx.textAlign = 'center';
                ctx.fillText(`${boss.hp} / ${boss.maxHP}`, bx + boss.width / 2, hpBarY + 16);
            }

            // Boss Fight nadpis s jménem
            if (isBossLevel && boss && boss.hp > 0) {
                ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.font = 'bold 50px Georgia';
                ctx.fillText(`⚔ ${boss.name} ⚔`, canvas.width / 2, 80);
            }

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let b of bullets) {
                ctx.fillStyle = 'rgba(255, 150, 0, 0.4)';
                ctx.beginPath(); ctx.arc(b.x - cameraX, b.y - cameraY, 16, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath(); ctx.arc(b.x - cameraX, b.y - cameraY, 10, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();

            // Výběr správného sprite: skok nahoru / pád dolů / běh
            let currentImg;
            if (!player.grounded && player.dy < -2) {
                currentImg = jumpImg;
            } else if (!player.grounded && player.dy > 2) {
                currentImg = fallImg;
            } else {
                currentImg = runFrames[player.frameIndex];
            }
            ctx.save();
            let blinkOn = !player.isInvincible || (Math.floor(Date.now() / 150) % 2 === 0);

            if (player.isGolden && blinkOn) { ctx.shadowColor = 'gold'; ctx.shadowBlur = 30; }

            if (blinkOn && currentImg.complete && currentImg.naturalWidth > 0) {
                // Správný poměr stran: výška = player.height, šířka podle poměru obrázku
                let imgRatio = currentImg.naturalWidth / currentImg.naturalHeight;
                let drawH = player.height;
                let drawW = drawH * imgRatio;
                // Vycentrovat horizontálně na hitbox hráče
                let offsetX = (player.width - drawW) / 2;
                let drawX = player.x - cameraX + offsetX;
                let drawY = player.y - cameraY;

                if (!player.facingRight) { ctx.scale(-1, 1); ctx.drawImage(currentImg, -drawX - drawW, drawY, drawW, drawH); }
                else { ctx.drawImage(currentImg, drawX, drawY, drawW, drawH); }
            }
            ctx.restore();

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let pt of particles) {
                ctx.globalAlpha = Math.max(0, pt.life);
                ctx.fillStyle = pt.color;
                let sx = pt.x - cameraX;
                let sy = pt.y - cameraY;
                if (pt.type === 'circle' || pt.type === 'dust' || pt.type === 'spark') {
                    ctx.beginPath(); ctx.arc(sx, sy, pt.size, 0, Math.PI * 2); ctx.fill();
                } else {
                    ctx.fillRect(sx - pt.size / 2, sy - pt.size / 2, pt.size, pt.size);
                }
            }
            ctx.restore();

            ctx.restore(); // Konec screenShake

            ctx.fillStyle = "#1a110a"; ctx.fillRect(20, 20, 300, 20);
            ctx.fillStyle = "#ebc49f"; ctx.fillRect(20, 20, Math.max(0, (player.x / mapEnd) * 300), 20);
            ctx.fillStyle = "white"; ctx.textAlign = "left"; ctx.font = "bold 20px Georgia"; ctx.fillText("POSTUP LEVELU", 20, 60);

            let currentScore = totalScore + Math.floor(maxDistance / 10) + bonusScore;
            ctx.fillStyle = "white"; ctx.textAlign = "right"; ctx.font = "bold 40px Georgia";
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
})();
