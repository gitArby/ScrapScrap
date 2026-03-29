// Platform entity factory
// Usage: G.Platform(x, y, cols, rows, material)
//
// Materials: 'standard', 'vent', 'falling', 'lbelt', 'rbelt'
//
// Examples:
//   G.Platform(100, 850, 10, 2, 'standard')  — 10 wide, 2 tall box platform
//   G.Platform(500, 850, 8, 2, 'lbelt')      — left-moving conveyor
//   G.Platform(900, 850, 6, 2, 'falling')    — crumbling platform

G.MATERIALS = {
    standard: {
        type: 'box',
        props: {}
    },
    vent: {
        type: 'vent',
        props: {}
    },
    falling: {
        type: 'fragile',
        props: { state: 'IDLE', timer: 0 }
    },
    lbelt: {
        type: 'conveyor',
        props: { speed: -4 }
    },
    rbelt: {
        type: 'conveyor',
        props: { speed: 4 }
    },
    air: {
        type: 'air',
        props: {}
    }
};

// Fill a region with air tiles (decorative background, no collision)
G.Air = function (x, y, cols, rows) {
    var ts = G.TILE_SIZE;
    var air = {
        type: 'air',
        x: x,
        y: y,
        width: cols * ts,
        height: rows * ts
    };
    G.platforms.push(air);
    return air;
};

// Fill the entire map with air background tiles
G.FillAir = function (mapWidth, mapHeight, groundY) {
    var ts = G.TILE_SIZE;
    var cols = Math.ceil(mapWidth / ts);
    var rows = Math.ceil(mapHeight / ts);
    // Place air behind everything from top of map to ground
    G.Air(0, groundY - rows * ts, cols, rows);
};

// Create and register a platform
G.Platform = function (x, y, cols, rows, material) {
    var mat = G.MATERIALS[material] || G.MATERIALS.standard;
    var ts = G.TILE_SIZE;

    var plat = {
        type: mat.type,
        x: x,
        y: y,
        width: cols * ts,
        height: rows * ts
    };

    // Copy material-specific props
    for (var key in mat.props) {
        plat[key] = mat.props[key];
    }

    G.platforms.push(plat);
    return plat;
};

// Shorthand: place a platform at tile grid coordinates (grid-snapped)
// G.PlatformAt(tileX, tileY, cols, rows, material)
G.PlatformAt = function (tileX, tileY, cols, rows, material) {
    var ts = G.TILE_SIZE;
    return G.Platform(tileX * ts, tileY * ts, cols, rows, material);
};

// Create a spring on top of an existing platform
G.Spring = function (x, y) {
    var ts = G.TILE_SIZE;
    var spring = {
        type: 'spring',
        x: x,
        y: y - 30,
        width: 60,
        height: 30,
        state: 'IDLE',
        timer: 0,
        oneWay: true
    };
    G.platforms.push(spring);
    return spring;
};

// Create brick/qblock row above a position
// pattern: string like 'BQBBQ' where B=brick, Q=qblock
G.BlockRow = function (x, y, pattern) {
    var ts = G.TILE_SIZE;
    for (var i = 0; i < pattern.length; i++) {
        var ch = pattern[i];
        if (ch === 'B' || ch === 'b') {
            G.platforms.push({ type: 'brick', x: x + i * ts, y: y, width: ts, height: ts });
        } else if (ch === 'Q' || ch === 'q') {
            G.platforms.push({ type: 'qblock', x: x + i * ts, y: y, width: ts, height: ts, hit: false });
        }
        // skip spaces or other chars
    }
};
