// --- Parameter & Playlists ---
const params = new URLSearchParams(window.location.search);
const city = params.get("city");

const playlists = {
  hamburg: ["videos/hamburg1.mp4","videos/hamburg2.mp4","videos/hamburg3.mp4"],
  berlin:  ["videos/berlin1.mp4","videos/berlin2.mp4","videos/berlin3.mp4"],
  wien:    ["videos/wien1.mp4","videos/wien2.mp4","videos/wien3.mp4"]
};

const startFallback = "index.html";
if (!city || !playlists[city]) {
  window.location.href = startFallback;
}

// --- DOM ---
const startImage = document.getElementById("startImage");
const startOverlay = document.getElementById("startOverlay");
const videoA = document.getElementById("videoA");
const videoB = document.getElementById("videoB");

let activeVideo = videoA;
let inactiveVideo = videoB;

// --- State ---
let index = 0;
let unlocked = false;
let isTransitioning = false;
let shakeLocked = false;
let inactivityTimer = null;

// --- Crossfade ---
function crossfade() {
  inactiveVideo.classList.add("active");
  activeVideo.classList.remove("active");
  [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
}

// --- Video laden & spielen ---
function loadVideo(src) {
  if (isTransitioning) return;
  isTransitioning = true;

  inactiveVideo.src = src;
  inactiveVideo.muted = false;
  inactiveVideo.style.display = "block";
  inactiveVideo.load();

  inactiveVideo.addEventListener("loadeddata", function onLoad() {
    inactiveVideo.removeEventListener("loadeddata", onLoad);

    // Startbild ausblenden
    startImage.style.display = "none";
    startOverlay.style.display = "none";

    inactiveVideo.play().then(() => {
      crossfade();

      // Altes Video wirklich stoppen
      inactiveVideo.pause();
      inactiveVideo.currentTime = 0;

      isTransitioning = false;

      // Shake erst nach Fade wieder erlauben
      setTimeout(() => {
        shakeLocked = false;
      }, 1200);
    });
  });
}

// --- Start per Touch ---
function startPlaylist() {
  if (unlocked) return;
  unlocked = true;
  index = 0;
  loadVideo(playlists[city][index]);
}

// --- Nächstes Video per Shake ---
function nextVideo() {
  if (!unlocked || isTransitioning || shakeLocked) return;

  shakeLocked = true;
  resetInactivity();

  index = (index + 1) % playlists[city].length;
  loadVideo(playlists[city][index]);
}

// --- Inaktivität ---
function resetInactivity() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    window.location.href = startFallback;
  }, 20000);
}
resetInactivity();

// --- Shake Detection ---
let lastX = null, lastY = null, lastZ = null;
const threshold = 18;

window.addEventListener("devicemotion", e => {
  const acc = e.accelerationIncludingGravity;
  if (!acc) return;

  if (unlocked && !shakeLocked && lastX !== null) {
    const delta =
      Math.abs(acc.x - lastX) +
      Math.abs(acc.y - lastY) +
      Math.abs(acc.z - lastZ);

    if (delta > threshold) nextVideo();
  }

  lastX = acc.x;
  lastY = acc.y;
  lastZ = acc.z;
});

// --- Touch Unlock (Autoplay-Freigabe) ---
startOverlay.addEventListener("click", startPlaylist);
startOverlay.addEventListener("touchstart", startPlaylist);
