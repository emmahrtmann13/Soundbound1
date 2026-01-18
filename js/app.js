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

const startImage = document.getElementById("startImage");
const videoA = document.getElementById("videoA");
const videoB = document.getElementById("videoB");

let activeVideo = videoA;
let inactiveVideo = videoB;
let index = 0; // Zeigt immer das nächste Video an
let unlocked = false; // erste User-Interaktion
let inactivityTimer = null;

// --- Funktionen ---
function loadVideo(src) {
  inactiveVideo.src = src;
  inactiveVideo.muted = false;
  inactiveVideo.load();
  inactiveVideo.play().then(() => crossfade()).catch(() => {});
}

function crossfade() {
  inactiveVideo.classList.add("active");
  activeVideo.classList.remove("active");
  [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
}

function startPlaylist() {
  if (unlocked) return;
  unlocked = true;
  startImage.style.display = "none"; // Startbild ausblenden
  index = 0; // Playlist beginnt bei 0
  loadVideo(playlists[city][index]);
}

// Nächstes Video
function nextVideo() {
  if (!unlocked) return;
  resetInactivity();
  index = (index + 1) % playlists[city].length;
  loadVideo(playlists[city][index]);
}

// --- Inactivity ---
function resetInactivity() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    window.location.href = startFallback;
  }, 20000);
}
resetInactivity();

// --- Touch & Shake Detection ---
window.addEventListener("touchstart", startPlaylist, {once: true});
window.addEventListener("click", startPlaylist, {once: true});

let lastX = null, lastY = null, lastZ = null;
const threshold = 18;

window.addEventListener("devicemotion", e => {
  const acc = e.accelerationIncludingGravity;
  if (!acc) return;

  // erster Shake gilt als Unlock + Start Playlist
  if (!unlocked) {
    startPlaylist();
  } else {
    if (lastX !== null) {
      const delta = Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
      if (delta > threshold) nextVideo();
    }
  }

  lastX = acc.x;
  lastY = acc.y;
  lastZ = acc.z;
});
