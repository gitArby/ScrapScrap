G.drawCredits = function () {
  var ctx = G.ctx;
  ctx.fillStyle = "#1a110a";
  ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "bold 32px 'Press Start 2P', monospace";
  ctx.fillText("Hru vytvořili:", G.canvas.width / 2, 400);
  ctx.fillStyle = "#ebc49f";
  ctx.font = "bold 24px 'Press Start 2P', monospace";
  ctx.fillText("Adam Macků a Zdeněk Vápeník", G.canvas.width / 2, 500);
  G.drawBtn("ZPĚT DO MENU", G.canvas.width / 2 - 200, G.canvas.height - 200, 400, 80, function () {
    G.gameState = "MENU";
  });
};
