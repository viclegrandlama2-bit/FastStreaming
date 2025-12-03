const songsListEl = document.getElementById("songs-list");
const audioPlayer = document.getElementById("audio-player");
const songTitle = document.getElementById("song-title");
const songArtist = document.getElementById("song-artist");
const coverImage = document.getElementById("cover");
const playerBar = document.querySelector(".player-bar");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const playPauseBtn = document.getElementById("play-pause");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const clearFilters = document.getElementById("clear-filters");
const themeToggle = document.getElementById("theme-toggle");

let currentIndex = 0;
let wasPlaying = false;
let shuffleMode = false;
let repeatMode = false;
let isLowEnd = navigator.hardwareConcurrency <= 4 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let rafId = null;
let currentSongs = []; // Liste des morceaux filtrés

const platformSongs = [
  { title: "ACIDO III", artist: "UdieNnx", src: "audio/track1.mp3", cover: "covers/cover1.jpg", category: "funk" },
  { title: "SENTE MAIS", artist: "Eternxlkz", src: "audio/track2.mp3", cover: "covers/cover2.jpg", category: "funk" },
  { title: "MONTAGEM HYPNOSIS 4", artist: "DJ GR11", src: "audio/track3.mp3", cover: "covers/cover3.jpg", category: "funk" },
  { title: "MONTAGEM SUSSURRO", artist: "OTVphonk", src: "audio/track4.mp3", cover: "covers/cover4.jpg", category: "funk" },
  { title: "REALMENTE FUNK", artist: "Kimaklon", src: "audio/track5.mp3", cover: "covers/cover5.jpg", category: "funk" },
  { title: "SUA CAVALONA", artist: "N9PXLUS", src: "audio/track6.mp3", cover: "covers/cover6.jpg", category: "funk" },
  { title: "MEMORIZING 3", artist: "OXXED", src: "audio/track7.mp3", cover: "covers/cover7.jpg", category: "funk" },
  { title: "PIXEL NO FLUXO", artist: "Wxvey", src: "audio/track8.mp3", cover: "covers/cover8.jpg", category: "funk" },
  { title: "MONTAGEM GPT", artist: "Zhanbxqq", src: "audio/track9.mp3", cover: "covers/cover9.jpg", category: "funk" },
  { title: "PREMIER LEAGUE", artist: "Dexter HMC", src: "audio/track10.mp3", cover: "covers/cover10.jpg", category: "drill" },
  { title: "91022", artist: "Dexter HMC", src: "audio/track11.mp3", cover: "covers/cover11.jpg", category: "drill" },
  { title: "PAS DE BRUIT #1", artist: "LDK PRC", src: "audio/track12.mp3", cover: "covers/cover12.jpg", category: "drill" },
  { title: "101 Rue Cerçay", artist: "Dexter HMC", src: "audio/dtrack13.mp3", cover: "covers/cover13.jpg", category: "drill" },
  { title: "AFFIRMÉ / NDDB #5", artist: "BORO700", src: "audio/track14.mp3", cover: "covers/cover14.jpg", category: "drill" }
];

function renderSongs(filter = "", category = "") {
  songsListEl.innerHTML = "";

  const f = filter.toLowerCase();

  currentSongs = platformSongs.filter(song => {
    const title = song.title.toLowerCase();
    const artist = song.artist.toLowerCase();

    // Filtre plus souple : aucun filtre OU titre OU artiste contient le texte
    const matchesFilter = !f || title.includes(f) || artist.includes(f);
    const matchesCategory = !category || song.category === category;

    return matchesFilter && matchesCategory;
  });

  currentSongs.forEach((song, index) => {
    const div = document.createElement("div");
    div.classList.add("song");
    div.innerHTML = `
      <img src="${song.cover}" loading="lazy" alt="${song.title}">
      <div class="song-info">
        <strong>${song.title}</strong>
        <small>${song.artist}</small>
        <span class="category-badge category-${song.category}">${song.category.toUpperCase()}</span>
      </div>
      <button>Play</button>
    `;

    const btn = div.querySelector("button");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      playSong(index);
    });

    div.addEventListener("click", () => playSong(index));

    songsListEl.appendChild(div);
  });

  // Si plus aucun morceau ne correspond, on remet un état propre
  if (currentSongs.length === 0) {
    audioPlayer.pause();
    wasPlaying = false;
    playPauseBtn.textContent = "⏵";
    playerBar.classList.remove("playing");
    songTitle.textContent = "Aucun morceau";
    songArtist.textContent = "";
    coverImage.src = "covers/default.jpg";
  }
}

function playSong(index) {
  if (!currentSongs || currentSongs.length === 0) return;
  if (index < 0 || index >= currentSongs.length) index = 0;

  const song = currentSongs[index];

  audioPlayer.src = song.src;
  audioPlayer.load();

  audioPlayer.play().then(() => {
    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;
    coverImage.src = song.cover;
    playPauseBtn.textContent = "⏸";
    playerBar.classList.add("playing");
    wasPlaying = true;
    currentIndex = index;

    if (!isLowEnd) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateProgress);
    }
  }).catch(e => {
    console.error("Erreur lors de la lecture :", e);
  });
}

prevBtn.addEventListener("click", () => {
  if (!currentSongs || currentSongs.length === 0) return;
  if (shuffleMode) {
    currentIndex = Math.floor(Math.random() * currentSongs.length);
  } else {
    currentIndex = (currentIndex - 1 + currentSongs.length) % currentSongs.length;
  }
  playSong(currentIndex);
});

nextBtn.addEventListener("click", () => {
  if (!currentSongs || currentSongs.length === 0) return;
  if (shuffleMode) {
    currentIndex = Math.floor(Math.random() * currentSongs.length);
  } else {
    currentIndex = (currentIndex + 1) % currentSongs.length;
  }
  playSong(currentIndex);
});

playPauseBtn.addEventListener("click", () => {
  if (audioPlayer.paused) {
    audioPlayer.play().then(() => {
      playPauseBtn.textContent = "⏸";
      playerBar.classList.add("playing");
      wasPlaying = true;
      if (!isLowEnd) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updateProgress);
      }
    }).catch(e => {
      console.error("Erreur lors de la lecture :", e);
    });
  } else {
    audioPlayer.pause();
  }
});

shuffleBtn.addEventListener("click", () => {
  shuffleMode = !shuffleMode;
  shuffleBtn.classList.toggle("active", shuffleMode);
});

repeatBtn.addEventListener("click", () => {
  repeatMode = !repeatMode;
  repeatBtn.classList.toggle("active", repeatMode);
});

function updateProgress() {
  if (audioPlayer.duration) {
    const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progress.value = progressPercent;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    durationEl.textContent = formatTime(audioPlayer.duration);
  }

  if (!audioPlayer.paused && !audioPlayer.ended && !isLowEnd) {
    rafId = requestAnimationFrame(updateProgress);
  }
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? "0" + sec : sec}`;
}

progress.addEventListener("input", () => {
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (progress.value / 100) * audioPlayer.duration;
  }
});

// Quand un morceau se termine, on passe au suivant (en boucle)
audioPlayer.addEventListener("ended", () => {
  if (!currentSongs || currentSongs.length === 0) {
    wasPlaying = false;
    playPauseBtn.textContent = "⏵";
    playerBar.classList.remove("playing");
    return;
  }

  if (repeatMode) {
    playSong(currentIndex);
    return;
  }

  if (shuffleMode) {
    currentIndex = Math.floor(Math.random() * currentSongs.length);
  } else {
    currentIndex = (currentIndex + 1) % currentSongs.length;
  }

  playSong(currentIndex);
});

// Pause propre (sans tentative de relancer tout seul)
audioPlayer.addEventListener("pause", () => {
  wasPlaying = false;
  playPauseBtn.textContent = "⏵";
  playerBar.classList.remove("playing");
});

// Filtres
searchInput.addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();
  renderSongs(filter, categoryFilter.value);
});

categoryFilter.addEventListener("change", () => {
  renderSongs(searchInput.value.toLowerCase(), categoryFilter.value);
});

clearFilters.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "";
  renderSongs();
});

// Thème clair/sombre
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  themeToggle.textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
});

// Initialisation
renderSongs();
updateProgress();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(e => {
    console.log("SW error", e);
  });
}

