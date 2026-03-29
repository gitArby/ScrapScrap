// Load saved sound settings or use defaults
G.musicLevel = parseInt(localStorage.getItem("ss_musicLevel")) || 25;
G.sfxLevel = parseInt(localStorage.getItem("ss_sfxLevel")) || 25;
if (localStorage.getItem("ss_musicLevel") === "0") G.musicLevel = 0;
if (localStorage.getItem("ss_sfxLevel") === "0") G.sfxLevel = 0;

G.saveSoundSettings = function () {
  localStorage.setItem("ss_musicLevel", G.musicLevel);
  localStorage.setItem("ss_sfxLevel", G.sfxLevel);
};

G.audio = {
  music: new Audio("assets/audio/music.mp3"),
  jump: new Audio("assets/audio/jump.mp3"),
  damage: new Audio("assets/audio/damage.mp3"),
  gameover: new Audio("assets/audio/gameover.mp3"),
};
G.audio.music.loop = true;

G.images = {
  menuBg: new Image(),
  factoryBg: new Image(),
  idle: new Image(),
  runSheet: new Image(),
  jumpSheet: new Image(),
};
G.images.menuBg.src = "assets/images/menu.png";
G.images.factoryBg.src = "assets/images/factory.png";
G.images.idle.src = "assets/images/Idle-sprite.png";
G.images.runSheet.src = "assets/images/Run-Sheet.png";
G.images.jumpSheet.src = "assets/images/Jump-sprite.png";

G.updateVolumes = function () {
  G.audio.music.volume = (G.musicLevel / 25) * 0.08;
  G.audio.jump.volume = (G.sfxLevel / 25) * 0.2;
  G.audio.damage.volume = (G.sfxLevel / 25) * 0.3;
  G.audio.gameover.volume = (G.sfxLevel / 25) * 0.4;

  if (G.musicLevel === 0) {
    G.audio.music.pause();
  } else if (G.gameState === "PLAYING" || G.gameState === "PAUSED") {
    if (G.audio.music.paused)
      G.audio.music.play().catch(function (e) {
        console.log(e);
      });
  }
};

G.playSound = function (audioObj) {
  if (G.sfxLevel > 0) {
    audioObj.currentTime = 0;
    audioObj.play().catch(function (e) {
      console.log("Audio play error:", e);
    });
  }
};

G.playMusic = function () {
  if (G.musicLevel > 0) {
    G.audio.music.play().catch(function (e) {
      console.log("Music play error:", e);
    });
  }
};

G.stopMusic = function () {
  G.audio.music.pause();
  G.audio.music.currentTime = 0;
};

G.loadAssets = function (onReady) {
  let loaded = 0;
  const total = 5;
  function check() {
    loaded++;
    if (loaded === total) onReady();
  }
  G.images.menuBg.onload = check;
  G.images.factoryBg.onload = check;
  G.images.idle.onload = check;
  G.images.runSheet.onload = check;
  G.images.jumpSheet.onload = check;
};

G.updateVolumes();
