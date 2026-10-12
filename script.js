
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("bestScore");
const overlay = document.getElementById("gameOverlay");
const overlayTag = document.getElementById("overlayTag");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Medium difficulty settings
const GRAVITY = 0.38;
const FLAP_STRENGTH = -6.8;
const PIPE_SPEED = 2.5;
const PIPE_WIDTH = 68;
const PIPE_GAP = 170;
const PIPE_SPACING = 205;
const GROUND_HEIGHT = 38;

let bird;
let pipes;
let score = 0;
let bestScore = getBestScore();
let gameState = "ready";
let animationId = null;
let lastTime = 0;
let groundOffset = 0;
let elapsedTime = 0;

bestScoreElement.textContent = bestScore;

// Save and load the best score safely
function getBestScore() {
  try {
    return Number(localStorage.getItem("neonFlappyBest")) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem("neonFlappyBest", String(value));
  } catch {
    // The game still works if storage is unavailable.
  }
}

// Create a new bird and reset the pipes
function resetGame() {
  bird = {
    x: 100,
    y: HEIGHT * 0.43,
    radius: 15,
    velocity: 0,
    rotation: 0
  };

  pipes = [];
  score = 0;
  groundOffset = 0;
  elapsedTime = 0;
  scoreElement.textContent = score;

  // Start with a pipe far enough ahead of the bird
  addPipe(WIDTH + 100);
  addPipe(WIDTH + 100 + PIPE_SPACING);
}

function addPipe(x) {
  const margin = 65;
  const minCenter = margin + PIPE_GAP / 2;
  const maxCenter = HEIGHT - GROUND_HEIGHT - margin - PIPE_GAP / 2;
  const gapCenter = minCenter +
    Math.random() * (maxCenter - minCenter);

  pipes.push({
    x,
    gapCenter,
    scored: false
  });
}

// Draw the neon sky and decorative stars
const stars = Array.from({ length: 55 }, () => ({
  x: Math.random() * WIDTH,
  y: Math.random() * (HEIGHT - GROUND_HEIGHT),
  radius: Math.random() * 1.5 + 0.4,
  alpha: Math.random() * 0.6 + 0.2
}));

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#071329");
  gradient.addColorStop(0.55, "#10274a");
  gradient.addColorStop(1, "#14203a");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Neon moon
  ctx.save();
  ctx.shadowBlur = 25;
  ctx.shadowColor = "#38bdf8";
  ctx.fillStyle = "#9be7ff";
  ctx.beginPath();
  ctx.arc(330, 100, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Stars
  stars.forEach((star) => {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#d8f4ff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;

  // Distant neon city skyline
  ctx.fillStyle = "#101d39";

  for (let x = 0; x < WIDTH; x += 38) {
    const buildingHeight = 35 + (Math.sin(x * 1.7) + 1) * 22;
    ctx.fillRect(
      x,
      HEIGHT - GROUND_HEIGHT - buildingHeight,
      28,
      buildingHeight
    );

    ctx.fillStyle = "#24476a";
    ctx.fillRect(
      x + 7,
      HEIGHT - GROUND_HEIGHT - buildingHeight + 12,
      4,
      5
    );
    ctx.fillStyle = "#101d39";
  }
}

// Draw a glowing pipe
function drawPipe(pipe) {
  const topHeight = pipe.gapCenter - PIPE_GAP / 2;
  const bottomY = pipe.gapCenter + PIPE_GAP / 2;
  const bottomHeight = HEIGHT - GROUND_HEIGHT - bottomY;

  ctx.save();

  ctx.shadowColor = "#39ff80";
  ctx.shadowBlur = 13;

  const pipeGradient = ctx.createLinearGradient(
    pipe.x, 0, pipe.x + PIPE_WIDTH, 0
  );
  pipeGradient.addColorStop(0, "#08783e");
  pipeGradient.addColorStop(0.45, "#37ff8b");
  pipeGradient.addColorStop(1, "#08783e");

  ctx.fillStyle = pipeGradient;
  ctx.strokeStyle = "#8affb6";
  ctx.lineWidth = 2;

  // Top pipe body
  ctx.fillRect(pipe.x + 5, 0, PIPE_WIDTH - 10, topHeight - 14);
  ctx.strokeRect(pipe.x + 5, 0, PIPE_WIDTH - 10, topHeight - 14);

  // Top pipe cap
  ctx.fillRect(pipe.x, topHeight - 18, PIPE_WIDTH, 18);
  ctx.strokeRect(pipe.x, topHeight - 18, PIPE_WIDTH, 18);

  // Bottom pipe body
  ctx.fillRect(
    pipe.x + 5,
    bottomY + 14,
    PIPE_WIDTH - 10,
    bottomHeight - 14
  );
  ctx.strokeRect(
    pipe.x + 5,
    bottomY + 14,
    PIPE_WIDTH - 10,
    bottomHeight - 14
  );

  // Bottom pipe cap
  ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, 18);
  ctx.strokeRect(pipe.x, bottomY, PIPE_WIDTH, 18);

  ctx.restore();
}

// Draw the bird using canvas shapes
function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  // Outer neon glow
  ctx.shadowColor = "#39ffb6";
  ctx.shadowBlur = 22;

  // Body
  const bodyGradient = ctx.createLinearGradient(-16, -15, 16, 15);
  bodyGradient.addColorStop(0, "#fff176");
  bodyGradient.addColorStop(1, "#ffb703");

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Wing
  ctx.fillStyle = "#ff8c42";
  ctx.beginPath();
  ctx.ellipse(-7, 4, 8, 5, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(8, -5, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#101827";
  ctx.beginPath();
  ctx.arc(10, -5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = "#ff6847";
  ctx.beginPath();
  ctx.moveTo(13, 1);
  ctx.lineTo(24, 5);
  ctx.lineTo(13, 8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Draw the ground
function drawGround() {
  const groundY = HEIGHT - GROUND_HEIGHT;

  ctx.fillStyle = "#091326";
  ctx.fillRect(0, groundY, WIDTH, GROUND_HEIGHT);

  ctx.save();
  ctx.shadowColor = "#39ffb6";
  ctx.shadowBlur = 14;
  ctx.strokeStyle = "#39ffb6";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(WIDTH, groundY);
  ctx.stroke();
  ctx.restore();

  // Moving ground lines
  ctx.strokeStyle = "#285b64";
  ctx.lineWidth = 2;

  for (let x = -40; x < WIDTH + 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x - groundOffset, groundY + 18);
    ctx.lineTo(x + 16 - groundOffset, groundY + 18);
    ctx.stroke();
  }
}

// Update game physics
function update(delta) {
  const step = Math.min(delta / 16.67, 2);

  elapsedTime += delta;

  bird.velocity += GRAVITY * step;
  bird.y += bird.velocity * step;
  bird.rotation = Math.min(0.9, Math.max(-0.45, bird.velocity * 0.08));

  groundOffset = (groundOffset + PIPE_SPEED * step) % 40;

  pipes.forEach((pipe) => {
    pipe.x -= PIPE_SPEED * step;

    // Award a point after passing a pipe
    if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.scored = true;
      score++;
      scoreElement.textContent = score;

      // Keep the best score in localStorage
      if (score > bestScore) {
        bestScore = score;
        bestScoreElement.textContent = bestScore;
        saveBestScore(bestScore);
      }
    }
  });

  // Remove pipes that have moved off screen
  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -10);

  // Add a new pipe when needed
  if (
    pipes.length > 0 &&
    pipes[pipes.length - 1].x < WIDTH - PIPE_SPACING
  ) {
    addPipe(WIDTH + 10);
  }

  checkCollision();
}

// Circle vs rectangle collision
function circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));

  const dx = cx - nearestX;
  const dy = cy - nearestY;

  return dx * dx + dy * dy < radius * radius;
}

function checkCollision() {
  // Ceiling
  if (bird.y - bird.radius < 0) {
    endGame();
    return;
  }

  // Ground
  if (bird.y + bird.radius >= HEIGHT - GROUND_HEIGHT) {
    endGame();
    return;
  }

  // Pipes
  for (const pipe of pipes) {
    const topHeight = pipe.gapCenter - PIPE_GAP / 2;
    const bottomY = pipe.gapCenter + PIPE_GAP / 2;
    const bottomHeight = HEIGHT - GROUND_HEIGHT - bottomY;

    const hitTop = circleRectCollision(
      bird.x, bird.y, bird.radius,
      pipe.x, 0, PIPE_WIDTH, topHeight
    );

    const hitBottom = circleRectCollision(
      bird.x, bird.y, bird.radius,
      pipe.x, bottomY, PIPE_WIDTH, bottomHeight
    );

    if (hitTop || hitBottom) {
      endGame();
      return;
    }
  }
}

// Render one frame
function render() {
  drawBackground();
  pipes.forEach(drawPipe);
  drawGround();
  drawBird();
}

function gameLoop(timestamp) {
  if (gameState !== "running") {
    animationId = null;
    return;
  }

  const delta = lastTime
    ? Math.min(timestamp - lastTime, 32)
    : 16.67;

  lastTime = timestamp;

  update(delta);
  render();

  if (gameState === "running") {
    animationId = requestAnimationFrame(gameLoop);
  } else {
    animationId = null;
  }
}

function startGame() {
  if (gameState === "running") {
    flap();
    return;
  }

  resetGame();
  gameState = "running";
  overlay.classList.add("hidden");
  pauseBtn.disabled = false;
  pauseBtn.textContent = "❚❚ PAUSE";

  // Start with a small upward impulse
  bird.velocity = FLAP_STRENGTH;

  lastTime = 0;
  if (animationId === null) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

function flap() {
  if (gameState === "ready") {
    startGame();
    return;
  }

  if (gameState !== "running") return;

  bird.velocity = FLAP_STRENGTH;
}

function pauseGame() {
  if (gameState === "running") {
    gameState = "paused";

    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    overlay.classList.remove("hidden");
    overlayTag.textContent = "TAKE A BREATHER";
    overlayTitle.textContent = "GAME PAUSED";
    overlayMessage.textContent = "Ready to continue your flight?";
    startBtn.textContent = "RESUME GAME";
    pauseBtn.textContent = "▶ RESUME";
    return;
  }

  if (gameState === "paused") {
    gameState = "running";
    overlay.classList.add("hidden");
    pauseBtn.textContent = "❚❚ PAUSE";
    lastTime = 0;

    if (animationId === null) {
      animationId = requestAnimationFrame(gameLoop);
    }
  }
}

function endGame() {
  if (gameState !== "running") return;

  gameState = "over";

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  pauseBtn.disabled = true;
  overlay.classList.remove("hidden");
  overlayTag.textContent = "FLIGHT TERMINATED";
  overlayTitle.textContent = "GAME OVER!";
  overlayMessage.textContent =
    `Your score: ${score}. Best score: ${bestScore}. Can you beat it?`;
  startBtn.textContent = "PLAY AGAIN";

  render();
}

// Buttons
startBtn.addEventListener("click", () => {
  if (gameState === "paused") {
    pauseGame();
  } else {
    startGame();
  }
});

pauseBtn.addEventListener("click", pauseGame);

restartBtn.addEventListener("click", () => {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  resetGame();
  gameState = "ready";
  overlay.classList.remove("hidden");
  overlayTag.textContent = "READY PLAYER ONE";
  overlayTitle.textContent = "READY TO FLY?";
  overlayMessage.textContent =
    "Tap, click, or press Space to fly through the neon pipes.";
  startBtn.textContent = "START GAME";
  pauseBtn.disabled = true;
  pauseBtn.textContent = "❚❚ PAUSE";

  render();
});

// Keyboard controls
document.addEventListener("keydown", (event) => {
  if (
    event.code === "Space" ||
    event.code === "ArrowUp" ||
    event.code === "ArrowDown"
  ) {
    event.preventDefault();
  }

  if (event.repeat) return;

  if (
    event.code === "Space" ||
    event.code === "ArrowUp" ||
    event.code === "ArrowDown"
  ) {
    flap();
  }

  if (event.code === "KeyP" || event.code === "Escape") {
    pauseGame();
  }

  if (event.code === "KeyR") {
    restartBtn.click();
  }
});

// Mouse and touch controls
canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  flap();
});

// Initial screen
resetGame();
render();
