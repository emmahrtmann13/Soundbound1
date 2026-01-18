const params = new URLSearchParams(window.location.search);
const city = params.get("city");

const playlists = {
  hamburg: ["videos/hamburg1.mp4", "videos/hamburg2.mp4", "videos/hamburg3.mp4"],
  berlin:  ["videos/berlin1.mp4",  "videos/berlin2.mp4",  "videos/berlin3.mp4"],
  wien:    ["videos/wien1.mp4",    "videos/wien2.mp4",    "videos/wien3.mp4"]
};

const startFallback = "index.html";

if (!city || !playlists[city]) {
  window.location.href = startFallback;
}

const videoA = document.getElementById("videoA");
const videoB = document.getElementById("videoB");

let activeVideo = videoA;
let inactiveVideo = videoB;
let index = 0;
let audioUnlocked = false;
let inactivityTimer = null;

// Querformat lock (best effort)
if (screen.orientation && screen.orientation.lock) {
  screen.orientation.lock("landscape").catch(() => {});
}

function loadVideo(src, withSound) {
  inactiveVideo.src = src;
  inactiveVideo.muted = !withSound;
  inactiveVideo.load();
  inactiveVideo.play().then(() => {
    crossfade();
  }).catch(() => {});
}

function crossfade() {
  inactiveVideo.classList.add("active");
  activeVideo.classList.remove("active");

  const temp = activeVideo;
  activeVideo = inactiveVideo;
  inactiveVideo = temp;
}

function nextVideo() {
  resetInactivity();

  if (!audioUnlocked) {
    audioUnlocked = true;
  }

  const list = playlists[city];
  const src = list[index];
  loadVideo(src, true);

  index = (index + 1) % list.length;
}

function resetInactivity() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    window.location.href = startFallback;
  }, 20000);
}

// Shake Detection
let lastX = null, lastY = null, lastZ = null;
const threshold = 18;

window.addEventListener("devicemotion", (e) => {
  const acc = e.accelerationIncludingGravity;
  if (!acc) return;

  if (lastX !== null) {
    const deltaX = Math.abs(acc.x - lastX);
    const deltaY = Math.abs(acc.y - lastY);
    const deltaZ = Math.abs(acc.z - lastZ);

    if (deltaX + deltaY + deltaZ > threshold) {
      nextVideo();
    }
  }

  lastX = acc.x;
  lastY = acc.y;
  lastZ = acc.z;
});

// Initial inactivity timer
resetInactivity();
