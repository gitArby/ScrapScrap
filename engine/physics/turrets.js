// Cannon AI: fires arc projectiles at player

G.BULLET_FLIGHT_FRAMES = 60; // frames for bullet to reach target
G.ARC_HEIGHT_RATIO = 0.4;    // arc peak height = distance * ratio
G.BARREL_LENGTH = G.TILE_SIZE;

G.getBarrelTip = function (cx, cy, angle) {
    return {
        x: cx + Math.cos(angle) * G.BARREL_LENGTH,
        y: cy + Math.sin(angle) * G.BARREL_LENGTH
    };
};

// Generate arc path points (quadratic bezier: start → control → end)
G.buildArcPath = function (sx, sy, ex, ey, arcHeight) {
    // Control point is at midpoint, raised by arcHeight
    var mx = (sx + ex) / 2;
    var my = Math.min(sy, ey) - arcHeight;
    var points = [];
    var steps = 30;
    for (var i = 0; i <= steps; i++) {
        var t = i / steps;
        var u = 1 - t;
        // Quadratic bezier: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
        var x = u * u * sx + 2 * u * t * mx + t * t * ex;
        var y = u * u * sy + 2 * u * t * my + t * t * ey;
        points.push({ x: x, y: y });
    }
    return points;
};

G.updateTurrets = function () {
    var p = G.player;
    var TURRET_ROTATE_SPEED = 0.04;

    for (var i = 0; i < G.turrets.length; i++) {
        var t = G.turrets[i];
        var tcx = t.x + t.width / 2, tcy = t.y + t.height / 2;
        var pcx = p.x + p.width / 2, pcy = p.y + p.height / 2;

        var dx = pcx - tcx;
        var dy = pcy - tcy;
        var dist = Math.sqrt(dx * dx + dy * dy);

        // Aim angle: point at the arc control point (above midpoint)
        var arcHeight = dist * G.ARC_HEIGHT_RATIO;
        var mx = (tcx + pcx) / 2;
        var my = Math.min(tcy, pcy) - arcHeight;
        var targetAngle = Math.atan2(my - tcy, mx - tcx);

        // Initialize aim
        if (t._aimAngle === undefined) t._aimAngle = targetAngle;

        // Rotate barrel toward arc direction
        var diff = targetAngle - t._aimAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        if (Math.abs(diff) < TURRET_ROTATE_SPEED) {
            t._aimAngle = targetAngle;
        } else {
            t._aimAngle += (diff > 0 ? 1 : -1) * TURRET_ROTATE_SPEED;
        }

        t._facingAngle = -Math.PI / 2; // FOV fixed facing up

        // Build arc path for debug visualization
        var tip = G.getBarrelTip(tcx, tcy, t._aimAngle);
        t._bulletPath = G.buildArcPath(tip.x, tip.y, pcx, pcy, arcHeight);

        // FOV check from bottom of base, facing up
        var fovOriginY = t.y + t.height;
        var canSee = G.Collision.inFOV(
            { x: tcx, y: fovOriginY },
            -Math.PI / 2,
            t.fovAngle,
            t.fovRange,
            { x: pcx, y: pcy }
        ) && G.Collision.lineOfSight(tcx, fovOriginY, pcx, pcy);

        if (canSee) {
            t.timer++;
            if (t.timer > t.shootInterval) {
                var fireTip = G.getBarrelTip(tcx, tcy, t._aimAngle);
                // Arc bullet: stores start, end, control point, and progress
                var fArcHeight = dist * G.ARC_HEIGHT_RATIO;
                var cmx = (fireTip.x + pcx) / 2;
                var cmy = Math.min(fireTip.y, pcy) - fArcHeight;
                G.bullets.push({
                    x: fireTip.x, y: fireTip.y,
                    width: 20, height: 20,
                    shape: 'circle', radius: 10,
                    // Arc data
                    arc: true,
                    sx: fireTip.x, sy: fireTip.y,
                    ex: pcx, ey: pcy,
                    cx: cmx, cy: cmy,
                    t: 0,
                    duration: G.BULLET_FLIGHT_FRAMES,
                    vx: 0, vy: 0 // not used for arc bullets but needed for compat
                });
                t.timer = 0;
            }
        }
    }
};
