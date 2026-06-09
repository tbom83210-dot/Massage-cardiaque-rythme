let mode = 'continue'; // 'continue' ou '30-2'
let state = 'STOPPED'; // 'STOPPED', 'RUNNING', 'PAUSED', 'INSUFLATION'
let totalCompressions = 0;
let cycleCompressions = 0;
let startTime = null;
let chronoInterval = null;
let metronomeInterval = null;
let countdownInterval = null;
let wakeLock = null;

const bpm = 110; 
const beatInterval = (60 / bpm) * 1000;

// Éléments DOM
const mainBtn = document.getElementById('main-action-btn');
const counterEl = document.getElementById('counter');
const modeIndicator = document.getElementById('mode-indicator');
const countdownEl = document.getElementById('insuflation-countdown');
const startTimeEl = document.getElementById('start-time');
const globalChronoEl = document.getElementById('global-chrono');
const progressBar = document.getElementById('progress-bar');
const flashZone = document.getElementById('flash-zone');

// Audio Context pour un bip ultra-précis sans latence
let audioCtx = null;
function playBeep() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Bip aigu bien audible
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

// Activer le Wake Lock pour garder l'écran allumé
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log("Wake Lock non supporté ou refusé");
    }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

function setMode(newMode) {
    if (state !== 'STOPPED') return; // Impossible de changer en cours de massage
    mode = newMode;
    document.getElementById('mode-continue').classList.toggle('active', mode === 'continue');
    document.getElementById('mode-30-2').classList.toggle('active', mode === '30-2');
    modeIndicator.innerText = mode === 'continue' ? "Mode Continu" : "Mode 30:2 (Sécurité)";
}

function handleMainAction() {
    if (state === 'STOPPED') {
        startCPR();
    } else if (state === 'RUNNING') {
        pauseCPR();
    } else if (state === 'PAUSED' || state === 'INSUFLATION') {
        resumeCPR();
    }
}

function startCPR() {
    state = 'RUNNING';
    startTime = new Date();
    startTimeEl.innerText = `Début : ${startTime.toLocaleTimeString('fr-FR')}`;
    
    // UI Update
    mainBtn.innerText = "PAUSE (DSA)";
    mainBtn.className = "action-btn btn-pause";
    
    requestWakeLock();
    startChrono();
    startMetronome();
}

function startChrono() {
    let seconds = 0;
    chronoInterval = setInterval(() => {
        seconds++;
        let m = Math.floor(seconds / 60).toString().padStart(2, '0');
        let s = (seconds % 60).toString().padStart(2, '0');
        globalChronoEl.innerText = `${m}:${s}`;
        
        // Barre de progression purement visuelle (boucle toutes les 2 min pour analyse DSA)
        let progress = ((seconds % 120) / 120) * 100;
        progressBar.style.width = `${progress}%`;
    }, 1000);
}

function startMetronome() {
    metronomeInterval = setInterval(() => {
        if (state !== 'RUNNING') return;

        // Compteurs
        totalCompressions++;
        cycleCompressions++;
        
        // Rendu Visuel & Sonore
        counterEl.innerText = mode === 'continue' ? totalCompressions : cycleCompressions;
        playBeep();
        
        flashZone.classList.add('flash-active');
        setTimeout(() => flashZone.classList.remove('flash-active'), 60);

        // Gestion spécifique du mode 30:2
        if (mode === '30-2' && cycleCompressions >= 30) {
            triggerInsuflation();
        }
    }, beatInterval);
}

function triggerInsuflation() {
    clearInterval(metronomeInterval);
    state = 'INSUFLATION';
    cycleCompressions = 0;
    
    counterEl.style.display = 'none';
    countdownEl.style.display = 'block';
    
    mainBtn.innerText = "REPRENDRE";
    mainBtn.className = "action-btn btn-resume";

    let timeLeft = 5;
    countdownEl.innerText = `${timeLeft}s`;

    countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            resumeCPR();
        } else {
            countdownEl.innerText = `${timeLeft}s`;
        }
    }, 1000);
}

function pauseCPR() {
    state = 'PAUSED';
    clearInterval(metronomeInterval);
    mainBtn.innerText = "REPRENDRE";
    mainBtn.className = "action-btn btn-resume";
    modeIndicator.innerText = "PAUSE EN COURS";
}

function resumeCPR() {
    state = 'RUNNING';
    clearInterval(countdownInterval);
    
    // Reset UI Insuflation au cas où
    countdownEl.style.display = 'none';
    counterEl.style.display = 'block';
    
    mainBtn.innerText = "PAUSE (DSA)";
    mainBtn.className = "action-btn btn-pause";
    modeIndicator.innerText = mode === 'continue' ? "Mode Continu" : "Mode 30:2";
    
    startMetronome();
}

// Réactiver le wake lock si l'application revient au premier plan
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state === 'RUNNING') {
        requestWakeLock();
    }
});

// Initialisation du texte
setMode('continue');