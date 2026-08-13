console.log("Home frontend javascript file");

// ===== Particle Network Animation =====
// Tashqi kutubxonasiz, oddiy Canvas 2D API bilan yozilgan.
// Nuqtalar sekin harakatlanadi, yaqin turgan nuqtalar orasida chiziq chiziladi.

const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

let width, height;
let particles = [];

const PARTICLE_COUNT = 70;
const MAX_DISTANCE = 140; // shu masofadan yaqin nuqtalar bir-biriga chiziq bilan ulanadi
const PARTICLE_COLOR = "rgba(127, 217, 164, 0.7)"; // SportPit yashil rangi
const LINE_COLOR = "47, 122, 82"; // RGB, chiziqning shaffofligi dinamik hisoblanadi

function resize() {
  width = canvas.width = canvas.offsetWidth;
  height = canvas.height = canvas.offsetHeight;
}

function createParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4, // gorizontal tezlik
      vy: (Math.random() - 0.5) * 0.4, // vertikal tezlik
      radius: Math.random() * 1.8 + 1,
    });
  }
}

function updateParticles() {
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;

    // ekran chetiga yetganda qarama-qarshi tomondan chiqadi
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
  });
}

function drawParticles() {
  ctx.clearRect(0, 0, width, height);

  // nuqtalarni chizish
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = PARTICLE_COLOR;
    ctx.fill();
  });

  // yaqin nuqtalar orasiga chiziq chizish
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MAX_DISTANCE) {
        const opacity = 1 - distance / MAX_DISTANCE;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(${LINE_COLOR}, ${opacity * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

function animate() {
  updateParticles();
  drawParticles();
  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  resize();
  createParticles();
});

resize();
createParticles();
animate();
