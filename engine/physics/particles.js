// Particle simulation and screen shake decay

G.updateParticles = function () {
    for (var i = G.particles.length - 1; i >= 0; i--) {
        var pt = G.particles[i];
        pt.x += pt.vx; pt.y += pt.vy;
        pt.vy += G.gravity * 0.5;
        pt.life -= pt.decay;
        if (pt.life <= 0) G.particles.splice(i, 1);
    }
    if (G.screenShake > 0) G.screenShake *= 0.85;
    if (G.screenShake < 0.5) G.screenShake = 0;
};
