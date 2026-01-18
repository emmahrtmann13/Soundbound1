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

// --- DOM Elemente ---
const startImage = document.getElementById("startImage");
const videoA = document.getElementById("videoA");
const videoB = document.getElementById("videoB");

let activeVideo = videoA;
let inactiveVideo = videoB;

// --- Index pro Stadt ---
const cityIndex = { hamburg:0, berlin:0, wien:0 };

let unlocked = false; // erste Interaktion
let inactivityTimer = null;

// --- Funktionen ---
function loadVideo(src) {
  inactiveVideo.src = src;
  inactiveVideo.muted = false;
  inactiveVideo.style.display = "block"; // sichtbar machen
  inactiveVideo.load();
  inactiveVideo.play().then(() => crossfade()).catch(()=>{});
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
    // Zurück zum Startbild
    window.location.href = startFallback;
  }, 20000);
}
resetInactivity();

// --- Shake & Touch Detection ---
let lastX = null, lastY = null, lastZ = null;
const threshold = 18;

window.addEventListener("devicemotion", e=>{
  const acc = e.accelerationIncludingGravity;
  if(!acc) return;

  // erster Shake -> Unlock
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

// Touchstart & Klick ebenfalls als Unlock (Autoplay-Policy)
window.addEventListener("touchstart", startPlaylist, {once:true});
window.addEventListener("click", startPlaylist, {once:true});
