// ==== Parameter & Playlists ====
const params = new URLSearchParams(window.location.search);
const city = params.get("city");

const playlists = {
  hamburg: ["videos/hamburg1.mp4","videos/hamburg2.mp4","videos/hamburg3.mp4"],
  berlin:  ["videos/berlin1.mp4","videos/berlin2.mp4","videos/berlin3.mp4"],
  wien:    ["videos/wien1.mp4","videos/wien2.mp4","videos/wien3.mp4"]
};

if (!city || !playlists[city]) {
  window.location.href = "index.html";
}

// ==== DOM Elemente ====
const startImage = document.getElementById("startImage");
const startOverlay = document.getElementById("startOverlay");
const videoA = document.getElementById("videoA");
const videoB = document.getElementById("videoB");

let activeVideo = videoA;
let inactiveVideo = videoB;
let index = 0;
let unlocked = false;
let isTransitioning = false;
let shakeLocked = false;
let inactivityTimer = null;
let firstInteraction = false;

// ==== Reset / Init ====
function resetPlayer() {
  videoA.pause(); videoB.pause();
  videoA.src = ""; videoB.src = "";

  startImage.style.display = "block";
  startOverlay.style.display = "flex";

  videoA.classList.remove("active");
  videoB.classList.remove("active");

  activeVideo = videoA;
  inactiveVideo = videoB;
  index = 0;
  unlocked = false;
  isTransitioning = false;
  shakeLocked = false;
  firstInteraction = false;

  resetInactivity();
}

// Reset beim Laden
window.addEventListener("load", resetPlayer);

// ==== Inaktivität ====
function resetInactivity() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    window.location.href = "index.html";
  }, 20000);
}

// ==== Crossfade & Video Laden ====
function crossfade() {
  inactiveVideo.classList.add("active");
  activeVideo.classList.remove("active");
  [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
}

function loadVideo(src) {
  if (isTransitioning) return;
  isTransitioning = true;

  inactiveVideo.src = src;
  inactiveVideo.style.display = "block";

  // Vor erster Interaktion stumm starten für Autoplay
  if (!firstInteraction) inactiveVideo.muted = true;

  inactiveVideo.load();
  inactiveVideo.oncanplay = () => {
    startImage.style.display = "none";
    startOverlay.style.display = "none";

    inactiveVideo.play().then(() => {
      crossfade();
      isTransitioning = false;

      // Shake-Delay 1,5s
      setTimeout(() => shakeLocked = false, 1500);
    }).catch(err => {
      console.warn("Video konnte nicht automatisch starten:", err);
    });
  };
}

// ==== Playlist-Steuerung ====
function startPlaylist() {
  if (unlocked) return;
  unlocked = true;
  firstInteraction = true;

  // Ton nach erstem Tippen freigeben
  videoA.muted = false;
  videoB.muted = false;

  index = 0;
  loadVideo(playlists[city][index]);
}

function nextVideo() {
  if (!unlocked || isTransitioning || shakeLocked) return;

  shakeLocked = true;
  resetInactivity();

  index = (index + 1) % playlists[city].length;
  loadVideo(playlists[city][index]);
}

// ==== Shake Detection ====
let lastX = null, lastY = null, lastZ = null;
const threshold = 15;

function shakeHandler(e) {
  const acc = e.accelerationIncludingGravity;
  if (!acc || !unlocked || shakeLocked) return;

  if (lastX !== null) {
    const delta =
      Math.abs(acc.x - lastX) +
      Math.abs(acc.y - lastY) +
      Math.abs(acc.z - lastZ);

    if (delta > threshold) nextVideo();
  }

  lastX = acc.x;
  lastY = acc.y;
  lastZ = acc.z;
}

// ==== iOS DeviceMotion Berechtigung ====
function requestDeviceMotionPermission() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          window.addEventListener('devicemotion', shakeHandler);
        }
      })
      .catch(console.error);
  } else {
    window.addEventListener('devicemotion', shakeHandler);
  }
}

requestDeviceMotionPermission();

// ==== Overlay Touch ====
startOverlay.addEventListener("click", startPlaylist);
startOverlay.addEventListener("touchstart", startPlaylist);
