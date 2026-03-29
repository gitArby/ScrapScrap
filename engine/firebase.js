G.playerName = "ROBOT_" + Math.floor(Math.random() * 999);
G.highScores = [];

(function () {
  var d = G.config._d;
  var x = G._xd;

  firebase.initializeApp({
    apiKey: x(d.a),
    authDomain: x(d.b),
    projectId: x(d.c),
    storageBucket: x(d.d),
    messagingSenderId: x(d.e),
    appId: x(d.f),
  });

  var db = firebase.firestore();
  var serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

  delete window.firebase;

  db.collection("scores")
    .orderBy("score", "desc")
    .limit(5)
    .onSnapshot(
      function (snapshot) {
        G.highScores = [];
        snapshot.forEach(function (doc) {
          G.highScores.push(doc.data());
        });
      },
      function (error) {
        console.error("Firebase chyba načítání leaderboardu:", !!error.message ? error.message : error);
      }
    );

  G.saveScore = function (score) {
    var timeSpent = Math.max(1, Math.floor((Date.now() - G.gameStartTime) / 1000));

    if (score > timeSpent * 800 + 100000) {
      console.error("ANTI-CHEAT: Detekováno podezřelé skóre (příliš vysoké za krátký čas).");
      return;
    }

    var token = btoa(encodeURIComponent(G.playerName + "_" + score + "_" + timeSpent + x(d.g)));

    db.collection("scores")
      .add({
        name: G.playerName,
        score: score,
        timeSpent: timeSpent,
        token: token,
        timestamp: serverTimestamp(),
      })
      .catch(function (err) {
        console.error("Firebase chyba ukládání skóre:", err);
      });
  };
})();
