// ===============================
// GLOBAL VARIABLES
// ===============================
let mode = "MENU"; 
let player;
let planets = [];
let planetImgs = []; 
let currentLevel = "easy";
let spawnTimer = 0
let blinkTimer = 0;
let isBlinking = false;
let bgImg;             // Variabel untuk Background
let lives = 3;         // Nyawa awal
let score = 0;         // Skor awal
let scoreIncreaseRate = 1;

// ===============================
// PRELOAD – load gambar planet dan background
// ===============================
async function preload() {
  // MUAT GAMBAR BACKGROUND DULU
  bgImg = loadImage("assets/bg_galaxy.jpeg"); 
  
  // MUAT GAMBAR PLANET EASY SEBAGAI DEFAULT
  await loadPlanetImages("easy"); 
}

// ===============================
// LOAD GAMBAR PLANET OTOMATIS
// ===============================
async function loadPlanetImages(level) {
  planetImgs = [];  

  const folder = `assets/planets_${level}/`;
  const response = await fetch(folder);
  const text = await response.text();

  const regex = /(href=")(.*?)(\.png|\.jpg|\.jpeg)"/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    let filename = match[2] + match[3];
    
    
    planetImgs.push(loadImage(filename)); 
  }
}

// ===============================
// SETUP
// ===============================
function setup() {
  createCanvas(400, 600);
  player = new Player();
}

// ===============================
// GAMEMODE UTAMA (DRAW)
// ===============================
function draw() {
  // Tampilkan gambar background (di lapisan paling bawah)
  image(bgImg, 0, 0, width, height); 

  if (mode === "MENU") {
    drawMenu();
  } else if (mode === "GAME") {
    gameLoop();
  } else if (mode === "GAME_OVER") { 
    drawGameOver();
  }
}

// ===============================
// MENU UTAMA
// ===============================
function drawMenu() {
  textAlign(CENTER);
  fill(255);
  textSize(32);
  text("GALACTIC DODGE", width / 2, 120);

  drawButton("EASY", width/2, 250);
  drawButton("HARD", width/2, 330);
  drawButton("EXTREME", width/2, 410);
}

function drawButton(label, x, y) {
  fill(80);
  rectMode(CENTER);
  rect(x, y, 200, 50, 10);

  fill(255);
  textSize(24);
  text(label, x, y + 8);
}

// ===============================
// HUD (SCORE & LIVES) (FUNGSI BARU)
// ===============================
function drawHUD() {
  textAlign(LEFT);
  fill(255);
  textSize(20);
  
  // Tampilkan Skor di kiri atas
  text(`SCORE: ${score}`, 10, 30); 
  
  // Tampilkan Nyawa di kanan atas
  textAlign(RIGHT); // Posisikan teks ke kanan
  text(`LIVES: ${lives}`, width - 10, 30);
}

// ===============================
// LAYAR GAME OVER
// ===============================
function drawGameOver() {
  textAlign(CENTER);
  fill(255, 0, 0);
  textSize(48);
  text("GAME OVER", width / 2, height / 2 - 50);

  fill(255);
  textSize(24);
  text(`FINAL SCORE: ${score}`, width / 2, height / 2 + 10);
  
  // Tombol Restart
  drawButton("RESTART", width/2, height / 2 + 100); 
}

// ===============================
// RESET GAME 
// ===============================
function resetGame() {
  lives = 3;     // Reset nyawa
  score = 0;     // Reset skor
  planets = [];  // Kosongkan semua planet
  player = new Player(); // Reset posisi player
  mode = "MENU"; // Kembali ke menu utama
}

// ===============================
// PILIH LEVEL / RESTART
// ===============================
async function mousePressed() {
  if (mode === "MENU") {
    if (mouseY > 220 && mouseY < 280) startGame("easy");
    if (mouseY > 300 && mouseY < 360) startGame("hard");
    if (mouseY > 380 && mouseY < 440) startGame("extreme");
  } else if (mode === "GAME_OVER") { 
    // Cek apakah tombol RESTART ditekan
    if (mouseY > height / 2 + 70 && mouseY < height / 2 + 130) {
      resetGame();
    }
  }
}

async function startGame(level) {
  currentLevel = level;
  await loadPlanetImages(level);
  planets = [];
  player = new Player();
  mode = "GAME";
  lives = 3; // Pastikan nyawa direset saat memulai game baru
  score = 0; // Pastikan skor direset
}

// ===============================
// GAME LOOP UTAMA
// ===============================
function gameLoop() {
  score += scoreIncreaseRate; // Tambah skor setiap frame

  // PLAYER
  player.update();
  player.draw();

  // SPAWN PLANET
  spawnTimer++;
  if (spawnTimer > 40) {
    planets.push(new Planet());
    spawnTimer = 0;
  }

  // UPDATE & DRAW PLANET
  for (let i = planets.length - 1; i >= 0; i--) { // Loop mundur untuk hapus planet
    let p = planets[i];
    p.update();
    p.draw();

    if (p.hits(player)) {
      player.hit();
      // Periksa Game Over setelah player terkena hit
      if (lives <= 0) {
        mode = "GAME_OVER"; 
        break; // Keluar dari loop setelah game over
      }
    }
  }
  
  drawHUD(); // Tampilkan skor dan nyawa
}

// ===============================
// CLASS PLAYER
// ===============================
class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - 80;
    this.size = 50;
  }

  update() {
    if (keyIsDown(LEFT_ARROW)) this.x -= 5;
    if (keyIsDown(RIGHT_ARROW)) this.x += 5;

    this.x = constrain(this.x, 0, width);
  }

  draw() {
    if (isBlinking) {
      // Logic kedip (hanya gambar 5 dari 10 frame)
      if (frameCount % 10 < 5) return; 
    }

    fill(0, 200, 255);
    ellipse(this.x, this.y, this.size);
  }

  hit() {
    if (!isBlinking) { // Cegah hit bertubi-tubi saat berkedip
        lives--; // KURANGI NYAWA
        blinkTimer = 30;
        isBlinking = true;
        setTimeout(() => isBlinking = false, 1000); // Kedip selama 1 detik
    }
  }
}

// ===============================
// CLASS PLANET
// ===============================
class Planet {
  constructor() {
    this.x = random(width);
    this.y = -50;

    if (currentLevel === "easy") this.speed = random(2, 4);
    if (currentLevel === "hard") this.speed = random(4, 7);
    if (currentLevel === "extreme") this.speed = random(7, 12);

    this.img = random(planetImgs);
    this.size = random(40, 80);
  }

  update() {
    this.y += this.speed;
  }

  draw() {
    // Pengurangan 50 untuk offset karena image di p5.js digambar dari pojok kiri atas secara default
    image(this.img, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size); 
  }

  hits(player) {
    let d = dist(this.x, this.y, player.x, player.y);
    return d < this.size * 0.4 + player.size * 0.4; // Toleransi tabrakan sedikit dikurangi
  }
}