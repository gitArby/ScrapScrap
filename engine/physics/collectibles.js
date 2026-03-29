// Scraps and power-up stars

G.updateCollectibles = function () {
    var p = G.player;

    for (var i = 0; i < G.scraps.length; i++) {
        var sc = G.scraps[i];
        if (!sc.collected && G.Collision.overlaps(p, sc)) {
            sc.collected = true; G.bonusScore += 10; G.scrapsCollected++;
            if (G.scrapsCollected >= 100) { G.scrapsCollected -= 100; p.lives++; }
        }
    }

    for (var i = 0; i < G.stars.length; i++) {
        var s = G.stars[i];
        if (!s.collected && G.Collision.overlaps(p, s)) {
            s.collected = true;
            if (p.lives === 1) { p.width = 68; p.height = 120; p.y -= 40; p.jumpForce = 25; p.isBig = true; p.lives = 2; }
            else if (p.lives >= 2) { p.lives += 2; p.isGolden = true; }
        }
    }
};
