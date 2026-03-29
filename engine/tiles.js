// Tileset singleton — all rendering objects pull assets from here via name
//
// Usage:
//   G.Tileset.sprite('coin', ctx, x, y, w, h, frame)    — draw specific frame
//   G.Tileset.animate('coin', ctx, x, y, w, h, 80)      — auto-animated
//   G.Tileset.tiled('box', plat)                         — 9-slice tiled platform
//   G.Tileset.variant('brick', ctx, x, y, w, h, seed)   — random variant by seed
//   G.Tileset.has('coin')                                — check if asset exists
//   G.Tileset.ready                                      — tileset loaded?
//   G.Tileset.get('coin')                                — get asset info {row, count}

G.TILE_SRC = 40;  // Source tile size in tileset PNG
G.TILE_SIZE = 64;  // Rendered tile size on screen

G.Tileset = {
  image: new Image(),
  ready: false,

  // Asset registry — name → {row, count}
  _assets: {},

  // Register an asset
  register: function (name, row, count) {
    this._assets[name] = { row: row, count: count };
  },

  // Get asset info
  get: function (name) {
    return this._assets[name] || null;
  },

  // Check if asset exists in registry
  has: function (name) {
    return this.ready && !!this._assets[name];
  },

  // Draw a specific frame of a named asset
  sprite: function (name, ctx, dx, dy, w, h, frame) {
    var a = this._assets[name];
    if (!this.ready || !a) return false;
    var ss = G.TILE_SRC;
    var idx = frame % a.count;
    var p = 0.5; // inset to prevent edge bleed
    ctx.drawImage(this.image, idx * ss + p, a.row * ss + p, ss - p * 2, ss - p * 2, dx, dy, w, h);
    return true;
  },

  // Draw time-animated asset
  animate: function (name, ctx, dx, dy, w, h, speedMs) {
    var a = this._assets[name];
    if (!this.ready || !a) return false;
    if (speedMs === undefined) speedMs = 100;
    var frame = Math.floor(Date.now() / speedMs) % a.count;
    return this.sprite(name, ctx, dx, dy, w, h, frame);
  },

  // Draw a variant based on a seed (deterministic per position)
  variant: function (name, ctx, dx, dy, w, h, seed) {
    var a = this._assets[name];
    if (!this.ready || !a) return false;
    var idx = (seed & 0x7fffffff) % a.count;
    return this.sprite(name, ctx, dx, dy, w, h, idx);
  },

  // 9-slice tiled platform rendering
  tiled: function (name, plat) {
    var a = this._assets[name];
    var ctx = G.ctx;
    var ts = G.TILE_SIZE;
    var sx = plat.x - G.cameraX;
    var sy = plat.y - G.cameraY;
    var cols = Math.ceil(plat.width / ts);
    var rows = Math.ceil(plat.height / ts);

    if (!this.ready || !a) {
      // Procedural fallback
      var pal = G.Tileset._palettes[name] || G.Tileset._palettes.box;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var tx = sx + c * ts,
            ty = sy + r * ts;
          var tw = Math.min(ts, plat.width - c * ts);
          var th = Math.min(ts, plat.height - r * ts);
          if (tx + tw < 0 || tx > G.canvas.width || ty + th < 0 || ty > G.canvas.height) continue;
          ctx.save();
          if (tw < ts || th < ts) {
            ctx.beginPath();
            ctx.rect(tx, ty, tw, th);
            ctx.clip();
          }
          G.Tileset._drawProceduralTile(tx, ty, ts, r === 0, r === rows - 1, c === 0, c === cols - 1, pal, ctx);
          ctx.restore();
        }
      }
      return;
    }

    var ss = G.TILE_SRC;
    var p = 0.5;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        // Position edge tiles at actual platform edges
        var tx, ty;
        if (c === cols - 1 && cols > 1) tx = sx + plat.width - ts;
        else tx = sx + c * ts;
        if (r === rows - 1 && rows > 1) ty = sy + plat.height - ts;
        else ty = sy + r * ts;

        if (tx + ts < 0 || tx > G.canvas.width || ty + ts < 0 || ty > G.canvas.height) continue;

        var idx = G.Tileset._sliceIndex(r, c, rows, cols);
        if (idx === 4 && a.count > 9) {
          var variants = a.count - 9;
          var hash = ((r * 31 + c * 17) & 0x7fffffff) % (variants + 1);
          if (hash > 0) idx = 9 + (hash - 1);
        }
        ctx.drawImage(this.image, idx * ss + p, a.row * ss + p, ss - p * 2, ss - p * 2, tx, ty, ts, ts);
      }
    }
  },

  // Belt overlay — single tile row across platform top
  belt: function (name, plat) {
    var a = this._assets[name];
    var ctx = G.ctx;
    var ts = G.TILE_SIZE;
    var sx = plat.x - G.cameraX;
    var sy = plat.y - G.cameraY;
    var cols = Math.ceil(plat.width / ts);

    if (!this.ready || !a) {
      var isRight = name === "conveyor_right";
      ctx.fillStyle = isRight ? "rgba(255,204,0,0.5)" : "rgba(255,50,50,0.5)";
      ctx.fillRect(sx, sy, plat.width, ts);
      return;
    }

    for (var c = 0; c < cols; c++) {
      var tx = sx + c * ts;
      var tw = Math.min(ts, plat.width - c * ts);
      if (tx + tw < 0 || tx > G.canvas.width) continue;
      ctx.save();
      if (tw < ts) {
        ctx.beginPath();
        ctx.rect(tx, sy, tw, ts);
        ctx.clip();
      }
      var idx = cols === 1 ? 1 : c === 0 ? 0 : c === cols - 1 ? 2 : 1;
      if (idx >= a.count) idx = 0;
      var ss = G.TILE_SRC;
      var p = 0.5;
      ctx.drawImage(this.image, idx * ss + p, a.row * ss + p, ss - p * 2, ss - p * 2, tx, sy, ts, ts);
      ctx.restore();
    }
  },

  // 9-slice index from grid position
  _sliceIndex: function (row, col, rows, cols) {
    var t = row === 0,
      b = row === rows - 1,
      l = col === 0,
      r = col === cols - 1;
    if (t && l) return 0;
    if (t && r) return 2;
    if (t) return 1;
    if (b && l) return 6;
    if (b && r) return 8;
    if (b) return 7;
    if (l) return 3;
    if (r) return 5;
    return 4;
  },

  // Procedural fallback palettes
  _palettes: {
    box: { face: "#bc8a5f", dark: "#8a5c3a", light: "#ebc49f", rivet: "#5c3a21" },
    fragile: { face: "#8c3b21", dark: "#5c2210", light: "#b55a35", rivet: "#6b2a12" },
    vent: { face: "#4a555c", dark: "#262d30", light: "#788891", rivet: "#3a4449" },
    conveyor: { face: "#444444", dark: "#222222", light: "#666666", rivet: "#555555" },
  },

  _drawProceduralTile: function (sx, sy, ts, isTop, isBottom, isLeft, isRight, pal, ctx) {
    var m = 3;
    ctx.fillStyle = pal.face;
    ctx.fillRect(sx, sy, ts, ts);
    if (!isBottom) {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(sx, sy + ts / 2, ts, ts / 2);
    }
    if (isTop) {
      ctx.fillStyle = pal.light;
      ctx.fillRect(sx, sy, ts, m);
    }
    if (isBottom) {
      ctx.fillStyle = pal.dark;
      ctx.fillRect(sx, sy + ts - m * 2, ts, m * 2);
    }
    if (isLeft) {
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(sx, sy, m, ts);
    }
    if (isRight) {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(sx + ts - m, sy, m, ts);
    }
    if (isTop || isBottom || isLeft || isRight) {
      ctx.fillStyle = pal.rivet;
      var rs = 4;
      if (isTop && isLeft) {
        ctx.beginPath();
        ctx.arc(sx + 8, sy + 8, rs, 0, Math.PI * 2);
        ctx.fill();
      }
      if (isTop && isRight) {
        ctx.beginPath();
        ctx.arc(sx + ts - 8, sy + 8, rs, 0, Math.PI * 2);
        ctx.fill();
      }
      if (isBottom && isLeft) {
        ctx.beginPath();
        ctx.arc(sx + 8, sy + ts - 8, rs, 0, Math.PI * 2);
        ctx.fill();
      }
      if (isBottom && isRight) {
        ctx.beginPath();
        ctx.arc(sx + ts - 8, sy + ts - 8, rs, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
};

// Load tileset
G.Tileset.image.src = "assets/images/tileset.png";
G.Tileset.image.onload = function () {
  G.Tileset.ready = true;
};
G.Tileset.image.onerror = function () {
  G.Tileset.ready = false;
};

// Register all assets
// Platforms (9-slice)
G.Tileset.register("box",            0, 9);
G.Tileset.register("fragile",        1, 9);
G.Tileset.register("vent",           2, 9);
G.Tileset.register("conveyor",       3, 9);
G.Tileset.register("conveyor_right", 4, 4);
G.Tileset.register("conveyor_left",  5, 4);

// Sprites
G.Tileset.register("coin",           6, 8);
G.Tileset.register("qblock",         7, 6); // 0-3 active anim, 4 hit, 5 opened
G.Tileset.register("brick",          8, 6);
G.Tileset.register("star",           9, 4);
G.Tileset.register("sawblade",      10, 4);
G.Tileset.register("drone",         11, 8);
G.Tileset.register("cannon_base",   12, 1);
G.Tileset.register("cannon",        13, 1);
G.Tileset.register("laser_base",    14, 5);
G.Tileset.register("laser_beam",    15, 2);
G.Tileset.register("trap_spikes",   16, 5); // 0=idle, 1-4=extending
G.Tileset.register("rc",            17, 8);

// === BACKWARD COMPAT (renderers that still use old API) ===
G._tilesetReady = false;
G.tileset = G.Tileset.image;
G.Tileset.image.addEventListener("load", function () {
  G._tilesetReady = true;
});
G.tilesetRows = {};
G.tilesetCounts = {};
(function () {
  for (var name in G.Tileset._assets) {
    var a = G.Tileset._assets[name];
    G.tilesetRows[name] = a.row;
    G.tilesetCounts[name] = a.count;
  }
})();
G.drawTileFromSheet = function (ctx, tileRow, tileIdx, dx, dy, dw, dh) {
  var ss = G.TILE_SRC;
  var ts = G.TILE_SIZE;
  var p = 0.5;
  if (dw === undefined) dw = ts;
  if (dh === undefined) dh = ts;
  ctx.drawImage(G.Tileset.image, tileIdx * ss + p, tileRow * ss + p, ss - p * 2, ss - p * 2, dx, dy, dw, dh);
};
G.drawSprite = function (ctx, rowName, dx, dy, w, h, frame) {
  return G.Tileset.sprite(rowName, ctx, dx, dy, w, h, frame);
};
G.drawAnimatedSprite = function (ctx, rowName, dx, dy, w, h, speedMs) {
  return G.Tileset.animate(rowName, ctx, dx, dy, w, h, speedMs);
};
G.renderTiledPlatform = function (plat, name) {
  G.Tileset.tiled(name, plat);
};
G.renderBeltOverlay = function (plat, name) {
  G.Tileset.belt(name, plat);
};
G.getTileCount = function (nameOrIdx) {
  if (G.tilesetCounts[nameOrIdx]) return G.tilesetCounts[nameOrIdx];
  for (var n in G.tilesetRows) {
    if (G.tilesetRows[n] === nameOrIdx) return G.tilesetCounts[n] || 0;
  }
  return 0;
};
G.drawQBlockTile = function (sx, sy, ts, hit, ctx) {
  if (G.Tileset.has("qblock")) {
    var a = G.Tileset.get("qblock");
    if (hit) {
      G.Tileset.sprite("qblock", ctx, sx, sy, ts, ts, 5);
    } else {
      var frame = Math.floor(Date.now() / 200) % 4;
      G.Tileset.sprite("qblock", ctx, sx, sy, ts, ts, frame);
    }
    return;
  }
  // Procedural fallback
  if (!hit) {
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(sx, sy, ts, ts);
    ctx.fillStyle = "#b38f00";
    var d = 6;
    ctx.fillRect(sx + 4, sy + 4, d, d);
    ctx.fillRect(sx + ts - 4 - d, sy + 4, d, d);
    ctx.fillRect(sx + 4, sy + ts - 4 - d, d, d);
    ctx.fillRect(sx + ts - 4 - d, sy + ts - 4 - d, d, d);
    ctx.fillStyle = "#b34722";
    ctx.font = "bold " + Math.floor(ts * 0.6) + "px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", sx + ts / 2, sy + ts / 2 + 2);
  } else {
    ctx.fillStyle = "#5c5c5c";
    ctx.fillRect(sx, sy, ts, ts);
    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(sx + 5, sy + 5, 7, 7);
    ctx.fillRect(sx + ts - 12, sy + 5, 7, 7);
    ctx.fillRect(sx + 5, sy + ts - 12, 7, 7);
    ctx.fillRect(sx + ts - 12, sy + ts - 12, 7, 7);
  }
};
G.renderBrickPlatform = function (plat) {
  var ctx = G.ctx;
  var ts = G.TILE_SIZE;
  var sx = plat.x - G.cameraX,
    sy = plat.y - G.cameraY;
  var cols = Math.ceil(plat.width / ts),
    rows = Math.ceil(plat.height / ts);
  if (G.Tileset.has("brick")) {
    for (var r = 0; r < rows; r++)
      for (var c = 0; c < cols; c++) {
        var tx = sx + c * ts,
          ty = sy + r * ts;
        if (tx + ts < 0 || tx > G.canvas.width || ty + ts < 0 || ty > G.canvas.height) continue;
        ctx.save();
        var tw = Math.min(ts, plat.width - c * ts),
          th = Math.min(ts, plat.height - r * ts);
        if (tw < ts || th < ts) {
          ctx.beginPath();
          ctx.rect(tx, ty, tw, th);
          ctx.clip();
        }
        var idx = G.Tileset._sliceIndex(r, c, rows, cols);
        G.Tileset.sprite("brick", ctx, tx, ty, ts, ts, idx);
        ctx.restore();
      }
  } else {
    for (var r = 0; r < rows; r++)
      for (var c = 0; c < cols; c++) {
        var tx = sx + c * ts,
          ty = sy + r * ts;
        if (tx + ts < 0 || tx > G.canvas.width) continue;
        ctx.fillStyle = "#b34722";
        ctx.fillRect(tx, ty, ts, ts);
      }
    ctx.strokeStyle = "#5c1e0a";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, plat.width, plat.height);
  }
};
