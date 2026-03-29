G.takeDamage = function () {

    if (G.debugGodMode || G.debugNoClip) return;



    var p = G.player;

    G.screenShake = 20;

    G.spawnParticles(p.x + p.width / 2, p.y + p.height / 2, 30, 'red', 'square');



    if (p.isGolden) {

        G.playSound(G.audio.damage);

        p.lives = 2;

        p.isGolden = false;

        p.isInvincible = true;

        p.invincibleTimer = 120;

    } else if (p.lives >= 2) {

        G.playSound(G.audio.damage);

        p.lives = 1;

        p.width = 45;

        p.height = 80;

        p.y += 40;

        p.isBig = false;

        p.isGolden = false;

        p.isInvincible = true;

        p.invincibleTimer = 120;

    } else {

        G.playSound(G.audio.gameover);

        G.gameState = 'GAMEOVER_INPUT';

    }

};
