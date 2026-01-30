
document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const city = params.get("city");

  const playlists = {
    hamburg: ["videos/hamburg1.mp4", "videos/hamburg2.mp4", "videos/hamburg3.mp4"],
    berlin: ["videos/berlin1.mp4", "videos/berlin2.mp4", "videos/berlin3.mp4"],
    wien: ["videos/wien1.mp4", "videos/wien2.mp4", "videos/wien3.mp4"]
  };

  if (!city || !playlists[city]) {
    window.location.replace("index.html");
  }


  const startImage = document.getElementById("startImage");
  const startOverlay = document.getElementById("startOverlay");
  const videoContainer = document.getElementById("videoContainer");
  const idleImage = document.getElementById("idleImage");

  let videos = [];
  let activeIndex = 0; // Index im Videos-Array (0 oder 1)
  let playlistIndex = 0; // Index in der Playlist
  let unlocked = false;
  let isTransitioning = false;
  let shakeLocked = false;
  let inactivityTimer = null;


function resetInactivity() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {

    // 1. Videos stoppen & entfernen
    videos.forEach(v => {
      v.pause();
      v.src = "";
      v.remove();
    });
    videos = [];

    // 2. Idle-Bild anzeigen
    idleImage.style.display = "block";
    startImage.style.display = "none";
    startOverlay.style.display = "block";

    // 3. Zustand zurücksetzen
    unlocked = false;
    isTransitioning = false;

  }, 20000);
}

  function createVideos() {
    videoContainer.innerHTML = "";
    videos = [];

    for (let i = 0; i < 2; i++) {
      const v = document.createElement("video");
      v.style.display = "none";
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

function crossfade() {
  const active = videos[activeIndex];
  const inactive = videos[1 - activeIndex];

  // 🔇 altes Video wirklich stoppen
  active.pause();
  active.currentTime = 0;

  inactive.style.opacity = 1;
  active.style.opacity = 0;

  activeIndex = 1 - activeIndex;
}

  function loadVideo(src) {
    if (isTransitioning) return;
    isTransitioning = true;
    resetInactivity();

    const inactive = videos[1 - activeIndex];
    inactive.src = src;
    inactive.style.display = "block";

    if (!unlocked) inactive.muted = true;

    inactive.load();
    inactive.oncanplay = () => {
      startImage.style.display = "none";
      startOverlay.style.display = "none";
      idleImage.style.display = "none";

      inactive.play().then(() => {
        if (!unlocked) {
          videos.forEach(v => v.muted = false);
          unlocked = true;
        }

        crossfade();
        isTransitioning = false;

        shakeLocked = true;
        setTimeout(() => shakeLocked = false, 3000);
      }).catch(err => console.warn("Video konnte nicht automatisch starten:", err));
    };
  }

  function startPlaylist() {
    createVideos();
    playlistIndex = 0;
    setTimeout(() => {
      loadVideo(playlists[city][playlistIndex]);
    }, 200);
  }

  function nextVideo() {
    if (isTransitioning || shakeLocked) return;
    playlistIndex = (playlistIndex + 1) % playlists[city].length;
    loadVideo(playlists[city][playlistIndex]);
  }

  function showIdle() {
  startImage.style.display = "none";
  idleImage.style.display = "block";
}

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

  startOverlay.addEventListener("click", startPlaylist);
  startOverlay.addEventListener("touchstart", startPlaylist);

  resetInactivity();

});