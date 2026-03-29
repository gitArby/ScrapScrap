// Draw a settings slider: title label, progress bar with -, + buttons, percentage
G._drawSlider = function (label, x, y, w, value, maxVal, onDec, onInc) {
  var ctx = G.ctx;
  var barH = 32;
  var btnSize = 50;
  var gap = 12;
  var barX = x + btnSize + gap;
  var barW = w - (btnSize + gap) * 2;
  var pct = value / maxVal;

  // Label above
  ctx.fillStyle = "#e8d5a0";
  ctx.font = "bold 14px 'Press Start 2P', monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(label, x, y - 8);

  // Percentage on right
  ctx.textAlign = "right";
  ctx.fillStyle = "#fff";
  ctx.fillText(Math.round(pct * 100) + "%", x + w, y - 8);

  // - button
  G.drawBtn("-", x, y, btnSize, barH, onDec, "steel");

  // Progress bar background
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(barX, y, barW, barH);
  // Border
  ctx.strokeStyle = "#6b4e2a";
  ctx.lineWidth = 3;
  ctx.strokeRect(barX, y, barW, barH);
  // Fill
  ctx.fillStyle = "#c4a055";
  ctx.fillRect(barX + 3, y + 3, (barW - 6) * pct, barH - 6);
  // Shine on fill
  if (pct > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(barX + 3, y + 3, (barW - 6) * pct, (barH - 6) / 2);
  }
  // Notches
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  for (var i = 1; i < maxVal; i++) {
    var nx = barX + (barW * i) / maxVal;
    ctx.fillRect(nx - 1, y, 2, barH);
  }

  // + button
  G.drawBtn("+", x + w - btnSize, y, btnSize, barH, onInc, "steel");
};

G.drawSettings = function () {
  var ctx = G.ctx;
  ctx.fillStyle = "#1a110a";
  ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);

  // Title
  ctx.fillStyle = "#e8d5a0";
  ctx.textAlign = "center";
  ctx.font = "bold 28px 'Press Start 2P', monospace";
  ctx.fillText("NASTAVENI", G.canvas.width / 2, 280);

  var cx = G.canvas.width / 2;
  var sliderW = 500;
  var sx = cx - sliderW / 2;

  // Music slider
  G._drawSlider(
    "HUDBA",
    sx,
    380,
    sliderW,
    G.musicLevel,
    25,
    function () {
      if (G.musicLevel > 0) {
        G.musicLevel--;
        G.updateVolumes();
        G.saveSoundSettings();
      }
    },
    function () {
      if (G.musicLevel < 25) {
        G.musicLevel++;
        G.updateVolumes();
        G.saveSoundSettings();
      }
    }
  );

  // SFX slider
  G._drawSlider(
    "EFEKTY",
    sx,
    460,
    sliderW,
    G.sfxLevel,
    25,
    function () {
      if (G.sfxLevel > 0) {
        G.sfxLevel--;
        G.updateVolumes();
        G.saveSoundSettings();
        G.playSound(G.audio.jump);
      }
    },
    function () {
      if (G.sfxLevel < 25) {
        G.sfxLevel++;
        G.updateVolumes();
        G.saveSoundSettings();
        G.playSound(G.audio.jump);
      }
    }
  );

  // Mute all / unmute all
  var isMuted = G.musicLevel === 0 && G.sfxLevel === 0;
  G.drawBtn(
    isMuted ? "ZAPNOUT VSE" : "ZTLUMIT VSE",
    cx - 200,
    560,
    400,
    60,
    function () {
      if (isMuted) {
        G.musicLevel = 25;
        G.sfxLevel = 25;
      } else {
        G.musicLevel = 0;
        G.sfxLevel = 0;
      }
      G.updateVolumes();
      G.saveSoundSettings();
    },
    isMuted ? "brass" : "danger"
  );

  // Back
  G.drawBtn(
    "ZPET",
    cx - 200,
    660,
    400,
    60,
    function () {
      G.gameState = "MENU";
    },
    "steel"
  );
};
