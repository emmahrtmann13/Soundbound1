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

let unlocked = false;
let inactivityTimer = null;
let isTransitioning = false;

// --- Funktionen ---
function createVideos() {
  // Video Elemente dynamisch erzeugen
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

function loadVideo(src) {
  if (isTransitioning) return;
  isTransitioning = true;

  inactiveVideo.src = src;
  inactiveVideo.muted = false;
  inactiveVideo.style.display = "block";
  inactiveVideo.load();

  inactiveVideo.play().then(() => {
    const onPlaying = () => {
      inactiveVideo.removeEventListener('playing', onPlaying);
      // perform crossfade once the new video is actually playing
      crossfade();
      // hide start image once first video is visible
      if (startImage && startImage.style.display !== "none") startImage.style.display = "none";
      isTransitioning = false;
    };
    inactiveVideo.addEventListener('playing', onPlaying);
  }).catch(()=>{ isTransitioning = false; });
}

function crossfade() {
  inactiveVideo.classList.add("active");
  activeVideo.classList.remove("active");
  [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
}

function startPlaylist() {
  if (unlocked) return;
  unlocked = true;

  // Startbild ausblenden
  startImage.style.display = "none";

  // Videos erzeugen
  createVideos();

  // Index für diese Stadt auf 0
  cityIndex[city] = 0;

  // Video 1 starten
  loadVideo(playlists[city][cityIndex[city]]);
}

function nextVideo() {
  if (!unlocked) return;
  resetInactivity();

  // Nächstes Video in Playlist
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
    startPlaylist();
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

// --- Touchstart & Click als Unlock (Chrome Autoplay) ---
window.addEventListener("touchstart", startPlaylist, {once:true});
window.addEventListener("click", startPlaylist, {once:true});
