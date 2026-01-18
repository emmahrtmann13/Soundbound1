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
const player = document.getElementById("player");

let activeVideo = videoA;
let inactiveVideo = videoB;

// --- Playlist Index ---
const cityIndex = { hamburg:0, berlin:0, wien:0 };

let unlocked = false;
let isTransitioning = false;
let inactivityTimer = null;

// --- Crossfade ---
function crossfade() {
  inactiveVideo.classList.add("active");
  activeVideo.classList.remove("active");
  [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
}

// --- Video laden & abspielen ---
function loadVideo(src) {
  if (isTransitioning) return;
  isTransitioning = true;

  inactiveVideo.src = src;
  inactiveVideo.muted = false;
  inactiveVideo.style.display = "block";
  inactiveVideo.load();

  // Warten bis das Video mindestens einen Frame geladen hat
  inactiveVideo.addEventListener('loadeddata', function onData() {
    inactiveVideo.removeEventListener('loadeddata', onData);
    
    // Startbild ausblenden
    startImage.style.display = "none";

    // Video mit Ton starten
    inactiveVideo.play().then(()=>{
      crossfade();
      isTransitioning = false;
    }).catch(()=>{
      console.warn("Play wurde blockiert, bitte Touch erneut.");
      isTransitioning = false;
    });
  });
}

// --- Playlist starten ---
function startPlaylist() {
  if (unlocked) return;
  unlocked = true;

  // Overlay ausblenden
  startOverlay.style.display = "none";

  // Index auf 0
  cityIndex[city] = 0;

  // Erstes Video starten
  inactiveVideo = videoA;
  activeVideo = videoB;
  loadVideo(playlists[city][cityIndex[city]]);
}

// --- Nächstes Video ---
function nextVideo() {
  if (!unlocked) return;
  resetInactivity();

  cityIndex[city] = (cityIndex[city]+1) % playlists[city].length;
  loadVideo(playlists[city][cityIndex[city]]);
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

window.addEventListener("devicemotion", e=>{
  const acc = e.accelerationIncludingGravity;
  if(!acc) return;

  if(unlocked){
    if(lastX !== null){
      const delta = Math.abs(acc.x-lastX)+Math.abs(acc.y-lastY)+Math.abs(acc.z-lastZ);
      if(delta>threshold) nextVideo();
    }
  }

  lastX = acc.x;
  lastY = acc.y;
  lastZ = acc.z;
});

// --- Touchstart & Click als Unlock ---
startOverlay.addEventListener("click", startPlaylist);
startOverlay.addEventListener("touchstart", startPlaylist);
