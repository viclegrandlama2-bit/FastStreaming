const songsListEl = document.getElementById('songs-list');
const audioPlayer = document.getElementById('audio-player');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const coverImage = document.getElementById('cover');
const waveform = document.getElementById('waveform');
const playerBar = document.querySelector('.player-bar');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const playPauseBtn = document.getElementById('play-pause');
const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volume = document.getElementById('volume');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const clearFilters = document.getElementById('clear-filters');
const themeToggle = document.getElementById('theme-toggle');

let currentIndex = 0;
let wasPlaying = false;
let shuffleMode = false;
let repeatMode = false;
let dominantColors = [];
let isLowEnd = (navigator.hardwareConcurrency || 1) < 4 || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastUpdate = 0;
let rafId;

let platformSongs = [
    {title: "ACIDO III", artist: "UdieNnx", src: "audio/track1.mp3", cover:"covers/cover1.jpg", category: "funk"},
    {title: "SENTE MAIS", artist: "Eternxlkz", src: "audio/track2.mp3", cover:"covers/cover2.jpg", category: "funk"},
    {title: "MONTAGEM HYPNOSIS 4", artist: "DJ GR11", src: "audio/track3.mp3", cover:"covers/cover3.jpg", category: "funk"},
    {title: "MONTAGEM SUSSURRO", artist: "OTVphonk", src: "audio/track4.mp3", cover:"covers/cover4.jpg", category: "funk"},
    {title: "REALMENTE FUNK", artist: "Kimaklon", src: "audio/track5.mp3", cover:"covers/cover5.jpg", category: "funk"},
    {title: "SUA CAVALONA", artist: "N9PXLUS", src: "audio/track6.mp3", cover:"covers/cover6.jpg", category: "funk"},
    {title: "MEMORIZING 3", artist: "OXXED", src: "audio/track7.mp3", cover:"covers/cover7.jpg", category: "funk"},
    {title: "PIXEL NO FLUXÃO", artist: "Wxvey", src: "audio/track8.mp3", cover:"covers/cover8.jpg", category: "funk"},
    {title: "MONTAGEM GPT", artist: "Zhanbxqq", src: "audio/track9.mp3", cover: "covers/cover9.jpg", category: "funk"}
];

function getDominantColors(imgSrc, callback) {
    if (sessionStorage.getItem(imgSrc)) {
        callback(JSON.parse(sessionStorage.getItem(imgSrc)));
        return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const colorMap = {};
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3] / 255;
            if (a > 0.5) {
                const hex = rgbToHex(r, g, b);
                colorMap[hex] = (colorMap[hex] || 0) + 1;
            }
        }

        const sortedColors = Object.entries(colorMap)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([hex]) => hex);

        const colors = sortedColors.length ? sortedColors : ['#9b59b6', '#8e44ad', '#000'];
        sessionStorage.setItem(imgSrc, JSON.stringify(colors));
        callback(colors);
    };
    img.onerror = () => callback(['#9b59b6', '#8e44ad', '#000']);
    img.src = imgSrc;
}

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function renderSongs(filter="", category="") {
    songsListEl.innerHTML="";
    platformSongs.forEach((song,index) => {
        if ((song.title.toLowerCase().includes(filter) || song.artist.toLowerCase().includes(filter)) &&
            (!category || song.category === category)) {
            const div = document.createElement('div');
            div.classList.add('song');
            div.innerHTML = `<img src="${song.cover}" loading="lazy">
                <div class="song-info"><strong>${song.title}</strong><small>${song.artist}</small>
                <span class="category-badge category-${song.category}">${song.category.toUpperCase()}</span>
                </div>
                <button>▶ Play</button>`;
            const btn = div.querySelector('button');
            btn.addEventListener('click', (e)=>{ e.stopPropagation(); playSong(index); });
            div.addEventListener('click', () => playSong(index));
            songsListEl.appendChild(div);
        }
    });
}
renderSongs();

// Écouteurs pour filtres
searchInput.addEventListener('input', (e) => {
    const filter = e.target.value.toLowerCase();
    renderSongs(filter, categoryFilter.value);
});
categoryFilter.addEventListener('change', () => {
    renderSongs(searchInput.value.toLowerCase(), categoryFilter.value);
});

// Bouton clear filters
clearFilters.addEventListener('click', () => {
    searchInput.value = '';
    categoryFilter.value = '';
    renderSongs('', '');
});

// Reset au load
searchInput.value = '';
categoryFilter.value = '';

function playSong(index){
    const song = platformSongs[index];
    audioPlayer.src = song.src;
    audioPlayer.load();
    audioPlayer.play();
    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;
    coverImage.src = song.cover;
    playPauseBtn.textContent = '⏸';
    playerBar.classList.add('playing');
    wasPlaying = true;
    currentIndex = index;

    getDominantColors(song.cover, (colors) => {
        dominantColors = colors;
        updateBackground(0);
    });
}

prevBtn.addEventListener('click', () => { 
    currentIndex = shuffleMode ? Math.floor(Math.random() * platformSongs.length) : (currentIndex - 1 + platformSongs.length) % platformSongs.length; 
    playSong(currentIndex); 
});
nextBtn.addEventListener('click', () => { 
    currentIndex = shuffleMode ? Math.floor(Math.random() * platformSongs.length) : (currentIndex + 1) % platformSongs.length; 
    playSong(currentIndex); 
});
playPauseBtn.addEventListener('click', () => { 
    if(audioPlayer.paused){ 
        audioPlayer.play(); 
        playPauseBtn.textContent='⏸'; 
        playerBar.classList.add('playing');
        wasPlaying = true;
    } else{ 
        audioPlayer.pause(); 
        playPauseBtn.textContent='▶'; 
        playerBar.classList.remove('playing');
        wasPlaying = false;
    } 
});

shuffleBtn.addEventListener('click', () => { 
    shuffleMode = !shuffleMode; 
    shuffleBtn.classList.toggle('active', shuffleMode); 
});
repeatBtn.addEventListener('click', () => { 
    repeatMode = !repeatMode; 
    repeatBtn.classList.toggle('active', repeatMode); 
});

volume.addEventListener('input', () => { 
    audioPlayer.volume = volume.value; 
    localStorage.setItem('volume', volume.value); 
});
volume.value = localStorage.getItem('volume') || 1;
audioPlayer.volume = volume.value;

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    themeToggle.textContent = document.body.classList.contains('light-theme') ? '🌞' : '🌙';
    updateBackground(audioPlayer.currentTime / (audioPlayer.duration || 1));
});

function updateProgress(){
    const now = performance.now();
    const delta = isLowEnd ? 33 : 16;
    if (now - lastUpdate < delta) {
        rafId = requestAnimationFrame(updateProgress);
        return;
    }
    lastUpdate = now;

    if(audioPlayer.duration){
        const progressPercent = audioPlayer.currentTime / audioPlayer.duration;
        progress.value = progressPercent * 100;
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        durationEl.textContent = formatTime(audioPlayer.duration);
        progress.style.background = `linear-gradient(to right, var(--accent) ${progress.value}%, var(--progress-bg) ${progress.value}%)`; // Fix : var light

        if (!isLowEnd) {
            updateBackground(progressPercent);
        }
    }
    rafId = requestAnimationFrame(updateProgress);
}

function updateBackground(progressPercent) {
    if (dominantColors.length < 2) return;
    const isLight = document.body.classList.contains('light-theme');
    const sat = isLight ? 30 : 50;
    const light = isLight ? 90 : 10;

    const color1 = dominantColors[0];
    const color2 = dominantColors[1] || dominantColors[0];
    const hue1 = hexToHsl(color1).h;
    const hue2 = hexToHsl(color2).h;
    const interpHue = (hue1 + (hue2 - hue1) * progressPercent + 360 * progressPercent) % 360;

    document.body.style.background = `linear-gradient(135deg, hsl(${interpHue}, ${sat}%, ${light}%), hsl(${(interpHue + 180) % 360}, ${sat}%, ${light + 10}%)`;
}

function hexToHsl(hex) {
    let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h,s,l = (max + min)/2;
    if (max == min) { h = s = 0; } else {
        const d = max - min; s = l > 0.5 ? d/(2-max-min) : d/(max+min);
        switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break; }
        h /= 6;
    }
    return {h: h*360, s: s*100, l: l*100};
}

requestAnimationFrame(updateProgress);
progress.addEventListener('input', () => { if(audioPlayer.duration){ audioPlayer.currentTime = (progress.value/100)*audioPlayer.duration; } });

function formatTime(seconds){ const min=Math.floor(seconds/60); const sec=Math.floor(seconds%60); return `${min}:${sec<10?'0':''}${sec}`; }

audioPlayer.addEventListener('ended', () => {
    if (repeatMode) { 
        playSong(currentIndex); 
        return; 
    }
    currentIndex = shuffleMode ? Math.floor(Math.random() * platformSongs.length) : (currentIndex + 1) % platformSongs.length;
    playSong(currentIndex);
});

audioPlayer.addEventListener('pause', () => {
    if (wasPlaying && !audioPlayer.ended) {
        setTimeout(() => {
            audioPlayer.play().catch(e => console.log('Erreur relance:', e));
        }, 100);
    }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(e => console.log('SW error:', e));
}