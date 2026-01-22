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

const startVideo = document.getElementById("startVideo");
const startOverlay = document.getElementById("startOverlay");
const videoContainer = document.getElementById("videoContainer");

let videoA, videoB;
let activeVideo, inactiveVideo;
let index = 0;
let isTransitioning = false;
let shakeLocked = false;
let inactivityTimer = null;

// ---------- Inaktivität ----------
function resetInactivity() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    window.location.href = "index.html?reset=" + Date.now();
  }, 20000);
}

// ---------- Video Setup ----------
function createVideos() {
  videoContainer.innerHTML = "";

  videoA = document.createElement("video");
  videoB = document.createElement("video");

  [videoA, videoB].forEach(v => {
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.style.position = "absolute";
    v.style.width = "100%";
    v.style.height = "100%";
    v.style.objectFit = "cover";
    v.classList.add("video");
    videoContainer.appendChild(v);
  });

  activeVideo = videoA;
  inactiveVideo = videoB;
}

function crossfade() {
  inactiveVideo.classList.add("active");
  activeVideo.classList.remove("active");
  [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
}

function loadVideo(src) {
  if (isTransitioning) return;
  isTransitioning = true;

  inactiveVideo.src = src;
  inactiveVideo.load();
  inactiveVideo.play().then(() => {
    crossfade();
    isTransitioning = false;
    setTimeout(() => shakeLocked = false, 3000); // 3 Sekunden Shake-Sperre
  });
}

// ---------- Start ----------
function startExperience() {
  startOverlay.style.display = "none";
  startVideo.pause();
  startVideo.style.display = "none";

  createVideos();

  activeVideo.muted = false;
  inactiveVideo.muted = false;

  index = 0;
  loadVideo(playlists[city][index]);
  resetInactivity();
}

startOverlay.addEventListener("click", startExperience);
startOverlay.addEventListener("touchstart", startExperience);

// ---------- Shake ----------
let lastX, lastY, lastZ;
const threshold = 18;

function shakeHandler(e) {
  if (shakeLocked) return;

  const acc = e.accelerationIncludingGravity;
  if (!acc) return;

  if (lastX !== undefined) {
    const delta = Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
    if (delta > threshold) {
      shakeLocked = true;
      index = (index + 1) % playlists[city].length;
      loadVideo(playlists[city][index]);
      resetInactivity();
    }
  }

  lastX = acc.x;
  lastY = acc.y;
  lastZ = acc.z;
}

if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
  DeviceMotionEvent.requestPermission().then(res => {
    if (res === "granted") window.addEventListener("devicemotion", shakeHandler);
  });
} else {
  window.addEventListener("devicemotion", shakeHandler);
}
