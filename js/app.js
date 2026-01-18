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
const player = document.getElementById("player");
const startImage = document.getElementById("startImage");

// --- Video Layer Variablen ---
let videoA, videoB;
let activeVideo, inactiveVideo;

// --- Playlist Index pro Stadt ---
const cityIndex = { hamburg:0, berlin:0, wien:0 };

let unlocked = false; // erste Interaktion
let inactivityTimer = null;
let isTransitioning = false;

// --- Video-Erzeugung ---
function createVideos() {
  videoA = document.createElement("video");
  videoB = document.createElement("video");

  [videoA, videoB].forEach(v => {
    v.playsInline = true;
    v.preload = "auto";
    v.style.position = "absolute";
    v.style.width = "100%";
    v.style.height = "100%";
    v.style.objectFit = "cover";
    v.style.opacity = 0;
    v.style.transition = "opacity 1.5s linear";
    player.appendChild(v);
  });

  activeVideo = videoA;
  inactiveVideo = videoB;
}

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

  const onPlaying = () => {
    inactiveVideo.removeEventListener('playing', onPlaying);
    crossfade();
    isTransitioning = false;
  };

  inactiveVideo.addEventListener('playing', onPlaying);

  inactiveVideo.play().catch(()=>{ isTransitioning = false; });
}

// --- Playlist starten ---
function startPlaylist() {
  if (unlocked) return;
  unlocked = true;

  // Videos erzeugen
  createVideos();

  // Index auf 0 setzen
  cityIndex[city] = 0;

  // Startbild bleibt sichtbar bis erstes Video wirklich spielt
  inactiveVideo = videoA;
  activeVideo = videoB;

  inactiveVideo.src = playlists[city][cityIndex[city]];
  inactiveVideo.muted = false;
  inactiveVideo.style.display = "block";
  inactiveVideo.load();

  const onPlaying = () => {
    inactiveVideo.removeEventListener('playing', onPlaying);
    startImage.style.display = "none"; // erst jetzt ausblenden
    crossfade();
    isTransitioning = false;
  };
  inactiveVideo.addEventListener('playing', onPlaying);

  inactiveVideo.play().catch(()=>{ isTransitioning = false; });
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

  if(!unlocked){
    startPlaylist(); // erster Shake → Start
  }else{
    if(lastX !== null){
      const delta = Math.abs(acc.x-lastX)+Math.abs(acc.y-lastY)+Math.abs(acc.z-lastZ);
      if(delta>threshold) nextVideo();
    }
  }

  lastX = acc.x;
  lastY = acc.y;
  lastZ = acc.z;
});

// --- Touch/Klick als Unlock (Autoplay-Policy Android) ---
window.addEventListener("touchstart", startPlaylist, {onc
