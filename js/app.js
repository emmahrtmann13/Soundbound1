// ==== Parameter & Playlists ====
const params = new URLSearchParams(window.location.search);
const city = params.get("city");

const playlists = {
  hamburg: ["videos/hamburg1.mp4", "videos/hamburg2.mp4", "videos/hamburg3.mp4"],
  berlin:  ["videos/berlin1.mp4", "videos/berlin2.mp4", "videos/berlin3.mp4"],
  wien:    ["videos/wien1.mp4", "videos/wien2.mp4", "videos/wien3.mp4"]
};

if (!city || !playlists[city]) {
  window.location.replace("index.html");
}

// ==== DOM Elemente ====
const startImage = document.getElementById("startImage");
const startOverlay = document.getElementById("startOverlay");
const videoContainer = document.getElementById("videoContainer");

let videos = [];
let activeIndex = 0;
let playlistIndex = 0;
let isTransitioning = false;
let shakeLocked = false;
let inactivityTimer = null;

// ==== Inaktivität 20s ====
function resetInactivity() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    videos.forEach(v => {
      v.pause();
      v.src = "";
      v.remove();
    });
    window.location.replace("index.html?reset=" + Date.now());
  }, 20000);
}

// ==== Videos erstellen für Crossfade ====
function createVideos() {
  videoContainer.innerHTML = "";
  videos = [];
  for (let i = 0; i < 2; i++) {
    const v = document.createElement("video");
    v.style.position = "absolute";
    v.style.width = "100%";
    v.style.height = "100%";
    v.style.objectFit = "cover";
    v.style.opacity = 0;
    v.style.transition = "opacity 1.5s linear";
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.muted = true;
    videoContainer.appendChild(v);
    videos.push(v);
  }
}

// ==== Crossfade ====
function crossfade() {
  const active = videos[activeIndex];
  const inactive = videos[1 - activeIndex];
  inactive.style.opacity = 1;
  active.style.opacity = 0;
  activeIndex = 1 - activeIndex;
}

// ==== Video laden & abspielen ====
function loadVideo(src) {
  if (isTransitioning) return;
  isTransitioning = true;
  resetInactivity();

  const inactive = videos[1 - activeIndex];
  inactive.src = src;
  inactive.style.display = "block";

  inactive.load();
  inactive.oncanplay = () => {
    inactive.play().then(() => {
      crossfade();
      isTransitioning = false;

      shakeLocked = true;
      setTimeout(() => shakeLocked = false, 3000);
    }).catch(err => console.warn("Play fehlgeschlagen:", err));
  };
}

// ==== Playlist starten ====
function startPlaylist() {
  // Erstes Video dynamisch erzeugen + direkt abspielen
  videoContainer.innerHTML = "";
  const firstVideo = document.createElement("video");
  firstVideo.style.position = "absolute";
  firstVideo.style.width = "100%";
  firstVideo.style.height = "100%";
  firstVideo.style.objectFit = "cover";
  firstVideo.setAttribute("playsinline", "");
  firstVideo.setAttribute("webkit-playsinline", "");
  firstVideo.muted = false;
  videoContainer.appendChild(firstVideo);

  firstVideo.src = playlists[city][0];
  firstVideo.load();
  firstVideo.play().catch(err => console.warn("Play nach Overlay-Tap fehlgeschlagen:", err));

  // Danach Crossfade Videos erzeugen
  createVideos();
  playlistIndex = 1;
}

// ==== Nächstes Video (Shake) ====
function nextVideo() {
  if (isTransitioning || shakeLocked) return;
  playlistIndex = (playlistIndex + 1) % playlists[city].length;
  loadVideo(playlists[city][playlistIndex]);
}

// ==== Shake Detection ====
let lastX = null, lastY = null, lastZ = null;
const threshold = 15;

function shakeHandler(e) {
  const acc = e.accelerationIncludingGravity;
  if (!acc || shakeLocked) return;

  if (lastX !== null) {
    const delta = Math.abs(acc.x - lastX) +
                  Math.abs(acc.y - lastY) +
                  Math.abs(acc.z - lastZ);
    if (delta > threshold) nextVideo();
  }

  lastX = acc.x;
  lastY = acc.y;
  lastZ = acc.z;
}

// ==== DeviceMotion Permission (iOS) ====
function requestDeviceMotionPermission() {
  if (typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted')
          window.addEventListener('devicemotion', shakeHandler);
      })
      .catch(console.error);
  } else {
    window.addEventListener('devicemotion', shakeHandler);
  }
}

requestDeviceMotionPermission();

// ==== Overlay Tap ====
startOverlay.addEventListener("click", () => {
  startOverlay.style.display = "none";
  startImage.style.display = "none";
  startPlaylist();
});
startOverlay.addEventListener("touchstart", () => {
  startOverlay.dispatchEvent(new Event("click"));
});

// ==== Initial Inaktivität starten ====
resetInactivity();
