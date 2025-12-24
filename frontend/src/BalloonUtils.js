// BalloonUtils.js
// Utility for animated rising balloons (emojis)

export function random(min, max) {
  return Math.random() * (max - min) + min;
}

export function createBalloonConfig(emojisArr, sceneWidth) {
  const emoji = emojisArr[Math.floor(Math.random() * emojisArr.length)];
  const startX = random(0.05 * sceneWidth, 0.95 * sceneWidth);
  const duration = random(8, 16); // seconds
  const swayDuration = random(2.5, 5.5); // seconds
  const size = random(1.7, 3.3); // rem
  const fadeStart = random(0.6, 0.8); // percent
  return {
    emoji,
    startX,
    duration,
    swayDuration,
    size,
    fadeStart,
    id: Date.now() + Math.random(),
  };
}
