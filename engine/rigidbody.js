// Lightweight 2D rigid body collision system
// Shapes: 'rect' (default), 'circle'
// Every entity can have: shape, radius (for circles)
// Rects use x/y/width/height, circles use x/y/width/height for bounds + radius for collision

G.Collision = {};

// Get body info from any entity. Normalizes to center-based representation.
G.Collision.getBody = function (e) {
    if (e.shape === 'circle') {
        return {
            shape: 'circle',
            cx: e.x + e.width / 2,
            cy: e.y + e.height / 2,
            radius: e.radius || e.width / 2
        };
    }
    return {
        shape: 'rect',
        x: e.x,
        y: e.y,
        w: e.width,
        h: e.height,
        cx: e.x + e.width / 2,
        cy: e.y + e.height / 2
    };
};

// ---- Collision tests ----
// All return: { hit: bool, nx: number, ny: number, depth: number }
// nx/ny = collision normal pointing from A to B
// depth = penetration depth

var NO_HIT = { hit: false, nx: 0, ny: 0, depth: 0 };

G.Collision.rectRect = function (a, b) {
    var ax = a.x, ay = a.y, aw = a.w, ah = a.h;
    var bx = b.x, by = b.y, bw = b.w, bh = b.h;

    var overlapX = Math.min(ax + aw, bx + bw) - Math.max(ax, bx);
    var overlapY = Math.min(ay + ah, by + bh) - Math.max(ay, by);

    if (overlapX <= 0 || overlapY <= 0) return NO_HIT;

    // MTV: push along smallest overlap axis
    if (overlapX < overlapY) {
        var nx = (a.cx < b.cx) ? -1 : 1;
        return { hit: true, nx: nx, ny: 0, depth: overlapX };
    } else {
        var ny = (a.cy < b.cy) ? -1 : 1;
        return { hit: true, nx: 0, ny: ny, depth: overlapY };
    }
};

G.Collision.circleCircle = function (a, b) {
    var dx = b.cx - a.cx;
    var dy = b.cy - a.cy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var minDist = a.radius + b.radius;

    if (dist >= minDist) return NO_HIT;

    var depth = minDist - dist;
    if (dist === 0) {
        return { hit: true, nx: 0, ny: -1, depth: depth };
    }
    return { hit: true, nx: dx / dist, ny: dy / dist, depth: depth };
};

G.Collision.rectCircle = function (rect, circle) {
    // Closest point on rect to circle center
    var closestX = Math.max(rect.x, Math.min(circle.cx, rect.x + rect.w));
    var closestY = Math.max(rect.y, Math.min(circle.cy, rect.y + rect.h));

    var dx = circle.cx - closestX;
    var dy = circle.cy - closestY;
    var distSq = dx * dx + dy * dy;
    var r = circle.radius;

    if (distSq > r * r) return NO_HIT;

    var dist = Math.sqrt(distSq);
    var depth = r - dist;

    if (dist === 0) {
        // Circle center inside rect — push out via shortest axis
        var overlapLeft = circle.cx - rect.x;
        var overlapRight = rect.x + rect.w - circle.cx;
        var overlapTop = circle.cy - rect.y;
        var overlapBottom = rect.y + rect.h - circle.cy;
        var minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft) return { hit: true, nx: -1, ny: 0, depth: overlapLeft + r };
        if (minOverlap === overlapRight) return { hit: true, nx: 1, ny: 0, depth: overlapRight + r };
        if (minOverlap === overlapTop) return { hit: true, nx: 0, ny: -1, depth: overlapTop + r };
        return { hit: true, nx: 0, ny: 1, depth: overlapBottom + r };
    }

    return { hit: true, nx: dx / dist, ny: dy / dist, depth: depth };
};

// Auto-dispatch collision test between any two entities
G.Collision.test = function (a, b) {
    var ba = G.Collision.getBody(a);
    var bb = G.Collision.getBody(b);

    if (ba.shape === 'rect' && bb.shape === 'rect') {
        return G.Collision.rectRect(ba, bb);
    }
    if (ba.shape === 'circle' && bb.shape === 'circle') {
        return G.Collision.circleCircle(ba, bb);
    }
    if (ba.shape === 'rect' && bb.shape === 'circle') {
        var result = G.Collision.rectCircle(ba, bb);
        return result;
    }
    if (ba.shape === 'circle' && bb.shape === 'rect') {
        var result = G.Collision.rectCircle(bb, ba);
        // Flip normal since we swapped a/b
        return { hit: result.hit, nx: -result.nx, ny: -result.ny, depth: result.depth };
    }
    return NO_HIT;
};

// Quick overlap check (no normal/depth, just boolean) — fast path
G.Collision.overlaps = function (a, b) {
    var ba = G.Collision.getBody(a);
    var bb = G.Collision.getBody(b);

    if (ba.shape === 'rect' && bb.shape === 'rect') {
        return a.x < b.x + b.width && a.x + a.width > b.x &&
               a.y < b.y + b.height && a.y + a.height > b.y;
    }
    if (ba.shape === 'circle' && bb.shape === 'circle') {
        var dx = ba.cx - bb.cx;
        var dy = ba.cy - bb.cy;
        var r = ba.radius + bb.radius;
        return dx * dx + dy * dy < r * r;
    }
    // Mixed: use full test
    return G.Collision.test(a, b).hit;
};

// Resolve overlap by pushing entity A out of entity B
G.Collision.resolve = function (entity, info) {
    if (!info.hit) return;
    entity.x -= info.nx * info.depth;
    entity.y -= info.ny * info.depth;
};

// Check if A's bottom crossed B's top (landing detection)
// Works for both shapes — uses top of bounding box for rects, top of arc for circles
G.Collision.landingTest = function (player, platform, prevBottom) {
    var pb = G.Collision.getBody(platform);
    var surfaceY;

    if (pb.shape === 'circle') {
        // Find surface Y on the circle arc at player's X
        var dx = (player.x + player.width / 2) - pb.cx;
        if (Math.abs(dx) > pb.radius) return { landed: false };
        surfaceY = pb.cy - Math.sqrt(pb.radius * pb.radius - dx * dx);
    } else {
        surfaceY = platform.y;
    }

    var currBottom = player.y + player.height;
    var tolerance = (pb.shape === 'circle') ? Math.max(50, pb.radius * 0.4) : 10;

    if (player.dy >= 0 && prevBottom <= surfaceY + tolerance && currBottom >= surfaceY) {
        return { landed: true, surfaceY: surfaceY };
    }
    return { landed: false };
};

// Check if a point is inside a FOV cone
// origin: {x, y}, facingAngle in radians, fovAngle (half-angle), range, target: {x, y}
G.Collision.inFOV = function (origin, facingAngle, fovAngle, range, target) {
    var dx = target.x - origin.x;
    var dy = target.y - origin.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > range) return false;

    var angleToTarget = Math.atan2(dy, dx);
    var diff = angleToTarget - facingAngle;
    // Normalize to [-PI, PI]
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    return Math.abs(diff) <= fovAngle;
};

// Raycast from A to B, checking if any solid platform blocks the path
// Returns true if line of sight is clear
G.Collision.lineOfSight = function (ax, ay, bx, by) {
    var dx = bx - ax;
    var dy = by - ay;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return true;

    // Step along the ray in increments
    var steps = Math.ceil(dist / 40);
    var stepX = dx / steps;
    var stepY = dy / steps;

    for (var i = 1; i < steps; i++) {
        var px = ax + stepX * i;
        var py = ay + stepY * i;
        // Check against solid platforms
        for (var j = 0; j < G.platforms.length; j++) {
            var plat = G.platforms[j];
            if (plat.type === 'gear' || plat.type === 'air' || plat.oneWay) continue;
            if (plat.type === 'fragile' && plat.state === 'FALLING') continue;
            var body = G.Collision.getBody(plat);
            if (body.shape === 'rect') {
                if (px >= body.x && px <= body.x + body.w && py >= body.y && py <= body.y + body.h) {
                    return false;
                }
            }
        }
    }
    return true;
};

// Full visibility check: is target in enemy's FOV cone AND has clear line of sight?
// enemy needs: x, y, width, height, fovRange, fovAngle, and a facing direction
G.Collision.canSee = function (enemy, facingAngle, target) {
    var ex = enemy.x + enemy.width / 2;
    var ey = enemy.y + enemy.height / 2;
    var tx = target.x + target.width / 2;
    var ty = target.y + target.height / 2;

    if (!G.Collision.inFOV({ x: ex, y: ey }, facingAngle, enemy.fovAngle, enemy.fovRange, { x: tx, y: ty })) {
        return false;
    }
    return G.Collision.lineOfSight(ex, ey, tx, ty);
};
