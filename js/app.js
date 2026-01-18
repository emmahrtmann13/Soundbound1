// ===== Parameter =====
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

// ===== Videos =====
let videoA = document.createElement("video");
let videoB = document.createElement("video");

[videoA, videoB].forEach(v => {
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

let activeVideo = videoA;
let inactiveVideo = videoB;

// ===== Start Text =====
const cityNames = { hamburg:"HAMBURG", berlin:"BERLIN", wien:"WIEN" };
startOverlay.innerText = "START " + cityNames[city];

// ===== State =====
let index = 0;
let unlocked = false;
let isTransitioning = false;
let inactivityTimer = null;

// ===== Core =====
function playVideo(src) {
  if (isTransitioning) return;
  isTransitioning = true;

  inactiveVideo.src = src;
  inactiveVideo.muted = false;
  inactiveVideo.load();

  inactiveVideo.play().then(() => {
    inactiveVideo.style.opacity = 1;
    activeVideo.style.opacity = 0;

    const old = activeVideo;
    activeVideo = inactiveVideo;
    inactiveVideo = old;

    inactiveVideo.pause();
    inactiveVideo.currentTime = 0;

    setTimeout(() => {
      isTransitioning = false;
    }, 1200);
  });
}

function startPlaylist() {
  if (unlocked) return;
  unlocked = true;
  index = 0;
  startOverlay.style.display = "none";
  playVideo(playlists[city][index]);
  resetInactivity();
}

function nextVideo() {
  if (!unlocked || isTransitioning) return;
  index = (index + 1) % playlists[city].length;
  playVideo(playlists[city][index]);
  resetInactivity();
}

// ===== Inactivity =====
function resetInactivity() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    window.location.href = "index.html";
  }, 20000);
}

// ===== Input =====
startOverlay.addEventListener("click", startPlaylist);
startOverlay.addEventListener("touchstart", startPlaylist);

let lastX=null,lastY=null,lastZ=null;
const threshold = 18;

window.addEventListener("devicemotion", e=>{
  const a = e.accelerationIncludingGravity;
  if(!a || !unlocked) return;

  if(lastX!==null){
    const delta = Math.abs(a.x-lastX)+Math.abs(a.y-lastY)+Math.abs(a.z-lastZ);
    if(delta>threshold) nextVideo();
  }
  lastX=a.x; lastY=a.y; lastZ=a.z;
});
