/* Asset manifest — single source of truth for sprite/font paths.
   Consumed at runtime by fx.js (Fx.sprite/preload) and the DOM games, and by
   the asset-existence test (test/assets.test.js). Must load before fx.js. */
(function () {
  const SP = "/assets/sprites/";
  window.FxAssets = {
    sprites: {
      coin: SP + "coin.svg",
      bomb: SP + "bomb.svg",
      star: SP + "star.svg",
      sparkle: SP + "sparkle.svg",
      basket: SP + "basket.svg",
      bgScene: SP + "bg-scene.svg",
      cardBack: SP + "card-back.svg",
      faceStar: SP + "face-star.svg",
      faceMushroom: SP + "face-mushroom.svg",
      faceTurtle: SP + "face-turtle.svg",
      faceFlower: SP + "face-flower.svg",
      faceFlame: SP + "face-flame.svg",
      faceGem: SP + "face-gem.svg",
      faceFox: SP + "face-fox.svg",
      faceNote: SP + "face-note.svg",
      dieBlank: SP + "die-blank.svg",
      balloon: SP + "balloon.svg",
      balloonPop: SP + "balloon-pop.svg",
      targetGo: SP + "target-go.svg",
    },
    // Self-hosted display font (each entry expects a sibling OFL.txt license).
    fonts: {
      display: "/assets/fonts/Fredoka.woff2",
    },
  };
})();
