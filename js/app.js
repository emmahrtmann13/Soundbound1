// ===== Parameter & Playlists =====
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

// ===== DOM =====
const startOverlay = document.getElementById("startOverlay");
const player = document.getElementById("player");

// ===== State =====
const cityNames = { hamburg:"HAMBURG", berlin:"BERLIN", wien:"WIEN" };
startOverlay.innerText = "START " + cityNames[city];

let index = 0;
let unlocked = false;
let isTransitioning = false;
let inactivityTimer = null;
let lastX = null, lastY = null, lastZ = null;
const threshold = 18;

// Videos werden erst nach Tippen erzeugt
let videoA, videoB;
let activeVideo, inactiveVideo;

// ===== Funktionen =====
function createVideos() {
  videoA = document.createElement("video");
  videoB = document.createElement("video");

  [videoA, videoB].forEach(v=>{
    v.playsInline = true;
    v.preload = "auto";
    v.style.position = "absolute";
    v.style.width = "100%";
    v.style.height = "100%";
    v.style.objectFit = "cover";
    v.style.opacity = 0;
    v.style.transition = "opacity 1.2s linear";
    player.appendChild(v);
  });

  activeVideo = videoA;
  inactiveVideo = videoB;
}

function crossfade() {
  inactiveVideo.classList.add("active");
  activeVideo.classList.remove("active");
  [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
  inactiveVideo.pause();
  inactiveVideo.currentTime = 0;
  isTransitioning = false;
}

function playVideo(src) {
  if(isTransitioning) return;
  isTransitioning = true;

  inactiveVideo.src = src;
  inactiveVideo.muted = false;
  inactiveVideo.load();

  inactiveVideo.play().then(()=>{
    crossfade();
  }).catch(err=>{
    console.warn("Play blockiert:", err);
    isTransitioning=false;
  });
}

function startPlaylist() {
  if(unlocked) return;
  unlocked = true;

  startOverlay.style.display = "none";

  // Videos erzeugen NACH Tippen!
  createVideos();

  index = 0;
  playVideo(playlists[city][index]);
  resetInactivity();
}

function nextVideo() {
  if(!unlocked || isTransitioning) return;
  index = (index + 1) % playlists[city].length;
  playVideo(playlists[city][index]);
  resetInactivity();
}

function resetInactivity() {
  if(inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(()=>{
    window.location.href="index.html";
  }, 20000);
}

// ===== Input =====
startOverlay.addEventListener("click", startPlaylist);
startOverlay.addEventListener("touchstart", startPlaylist);

// Shake Detection
window.addEventListener("devicemotion", e=>{
  if(!unlocked) return;
  const acc = e.accelerationIncludingGravity;
  if(!acc) return;

  if(lastX!==null){
    const delta = Math.abs(acc.x-lastX)+Math.abs(acc.y-lastY)+Math.abs(acc.z-lastZ);
    if(delta>threshold) nextVideo();
  }

  lastX=acc.x; lastY=acc.y; lastZ=acc.z;
});
