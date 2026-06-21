// Curtain opening
document.getElementById("openCurtain").addEventListener("click", function() {
  const curtain = document.getElementById("curtain");
  // start surprise effects immediately
  try { startSurpriseEffects(10000); } catch (e) {}
  // start music on user click (if not muted)
  try { if (!isMuted) togglePlayMusic(true); } catch (e) {}
  // drop the big cake
  try { dropBigCake(); } catch (e) {}
  curtain.style.transition = "all 2s ease";
  curtain.style.transform = "translateY(-100%)";
  curtain.style.opacity = "0";

  setTimeout(() => {
    curtain.style.display = "none";
    const show = id => { const el = document.getElementById(id); if (el) el.classList.remove("hidden"); };
    show("nameReveal");
    show("quotes");
    show("wishes");
    show("loveReasons");
    show("miniGame");
    show("storybook");
    show("autoSlideWrap");
    show("personalityQuiz");
    show("factGenerator");
    // populate side-by-side gallery when revealed
    try { renderSideBySide(window.SLIDESHOW_IMAGES || []); } catch (e) {}
    show("surprise");
    
    // Initialize quiz when revealed
    try { initializeQuiz(); } catch (e) {}
    try { startQuoteSparkles(); } catch (e) {}

    // surprise visuals are started immediately on click by startSurpriseEffects
  }, 2000);
});

// Balloon animation
function launchBalloons() {
  const balloonContainer = document.getElementById("balloons");
  if (!balloonContainer) return;
  balloonContainer.classList.remove("hidden");

  const colors = ["#ff6f61", "#6a0572", "#ffd700", "#00bfff", "#32cd32"];
  const balloon = document.createElement("div");
  balloon.className = "balloon";
  balloon.style.setProperty("--color", colors[Math.floor(Math.random() * colors.length)]);
  balloon.style.left = Math.random() * 100 + "vw";
  balloon.style.animationDelay = (Math.random() *10)+ "s";
  balloonContainer.appendChild(balloon);

  // remove balloon after animation completes
  balloon.addEventListener("animationend", () => balloon.remove());
}

// Cake animation
function launchCake() {
  const cakeContainer = document.getElementById('cakes');
  if (!cakeContainer) return;
  cakeContainer.classList.remove('hidden');

  const cake = document.createElement('div');
  cake.className = 'cake';
  cake.textContent = '🎂';
  cake.style.left = Math.random() * 100 + 'vw';
  cake.style.animationDuration = (4 + Math.random() * 4) + 's';
  cake.style.fontSize = (18 + Math.random() * 24) + 'px';
  cakeContainer.appendChild(cake);

  cake.addEventListener('animationend', () => cake.remove());
}

// Big cake drop and confetti
function dropBigCake() {
  const big = document.getElementById('bigCake');
  if (!big) return;
  big.classList.remove('hidden');
  // reset
  big.classList.remove('animate');
  // force reflow then animate
  void big.offsetWidth;
  big.classList.add('animate');

  function onEnd() {
    big.removeEventListener('animationend', onEnd);
    // emit confetti from cake center
    emitCakeConfetti(30);
    // remove big cake after a short delay
    setTimeout(() => big.classList.add('hidden'), 1200);
  }
  big.addEventListener('animationend', onEnd);
}

function emitCakeConfetti(count=24) {
  const container = document.getElementById('cakes') || document.body;
  const rect = (document.getElementById('bigCake') || container).getBoundingClientRect();
  for (let i=0;i<count;i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    // random color
    piece.style.background = ['#ff6f61','#ffd700','#6a0572','#00bfff','#32cd32'][Math.floor(Math.random()*5)];
    // start at cake center
    piece.style.left = (rect.left + rect.width/2 + (Math.random()*80-40)) + 'px';
    piece.style.top = (rect.top + rect.height/2 + (Math.random()*20-10)) + 'px';
    // random horizontal translation distance
    piece.style.setProperty('--tx', (Math.random()*400-200)+'px');
    // random delay
    piece.style.animationDelay = (Math.random()*0.2)+'s';
    container.appendChild(piece);
    // cleanup after animation
    piece.addEventListener('animationend', () => piece.remove());
  }
}

// Start both balloons and cakes repeatedly for a duration (ms)
function startSurpriseEffects(durationMs = 10000) {
  if (document.getElementById('balloons')) {
    launchBalloons();
    const bi = setInterval(launchBalloons, 400);
    setTimeout(() => clearInterval(bi), durationMs);
  }
  if (document.getElementById('cakes')) {
    launchCake();
    const ci = setInterval(launchCake, 700);
    setTimeout(() => clearInterval(ci), durationMs);
  }
}

// (Upload/gallery slideshow removed — keeping auto slideshow only)

// --- Side-by-side gallery from assets images ---
function renderSideBySide(images) {
  if (!images || !images.length) return;
  const wrap = document.getElementById('sideBySideWrap');
  const gallery = document.getElementById('sideBySideGallery');
  if (!wrap || !gallery) return;
  gallery.innerHTML = '';
  images.forEach((src, idx) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Photo ${idx+1}`;
    img.className = 'side-image';
    img.loading = 'lazy';
    gallery.appendChild(img);
  });
  wrap.classList.remove('hidden');
}

function startQuoteSparkles() {
  const quotes = document.getElementById('quotes');
  if (!quotes) return;
  for (let i = 0; i < 8; i++) {
    createQuoteSparkle(quotes);
  }
  const interval = setInterval(() => {
    if (!document.body.contains(quotes)) {
      clearInterval(interval);
      return;
    }
    createQuoteSparkle(quotes);
  }, 1200);
}

function createQuoteSparkle(container) {
  const sparkle = document.createElement('div');
  sparkle.className = 'quote-sparkle';
  sparkle.style.left = `${10 + Math.random() * 80}%`;
  sparkle.style.top = `${10 + Math.random() * 70}%`;
  sparkle.style.animationDuration = `${3 + Math.random() * 2.5}s`;
  sparkle.style.animationDelay = `${Math.random() * 1.2}s`;
  container.appendChild(sparkle);
  sparkle.addEventListener('animationend', () => sparkle.remove());
}

// Note: gallery starts when curtain opens via call to renderSideBySide

// --- WebAudio Happy Birthday synth ---
let audioCtx = null;
let musicPlaying = false;
let isMuted = false;
let musicTimeouts = [];
let analyser = null;
let masterGain = null;
let vizAnimationId = null;
let vizRunning = false;

const NOTE_FREQ = {
  'C4': 261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392.00,'A4':440.00,'B4':493.88,
  'C5':523.25,'D5':587.33,'E5':659.25
};

const HAPPY_BIRTHDAY = [
  ['G4',0.45],['G4',0.45],['A4',0.9],['G4',0.9],['C5',0.9],['B4',1.2],
  ['G4',0.45],['G4',0.45],['A4',0.9],['G4',0.9],['D5',0.9],['C5',1.2],
  ['G4',0.45],['G4',0.45],['G5',0.9],['E5',0.9],['C5',0.9],['B4',0.9],['A4',1.2],
  ['F5',0.45],['F5',0.45],['E5',0.9],['C5',0.9],['D5',0.9],['C5',1.2]
];

function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // master gain and analyser for visualizer
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.9;
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  masterGain.connect(analyser);
  analyser.connect(audioCtx.destination);
}

function playNote(freq, duration, timeOffset=0) {
  if (!audioCtx) ensureAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + timeOffset);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + timeOffset + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + timeOffset + duration);
  osc.connect(gain);
  // connect to masterGain so analyser can read output
  if (masterGain) gain.connect(masterGain); else gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + timeOffset);
  osc.stop(audioCtx.currentTime + timeOffset + duration + 0.02);
}

function playHappyBirthday() {
  if (!HAPPY_BIRTHDAY || !HAPPY_BIRTHDAY.length) return;
  ensureAudio();
  let cursor = 0;
  for (let i=0;i<HAPPY_BIRTHDAY.length;i++) {
    const [note, dur] = HAPPY_BIRTHDAY[i];
    const freq = NOTE_FREQ[note] || NOTE_FREQ['C4'];
    playNote(freq, dur, cursor);
    cursor += dur;
  }
  // stop flag after sequence
  const t = setTimeout(() => { musicPlaying = false; document.getElementById('toggleMusic').textContent = 'Play Music'; }, cursor*1000+200);
  musicTimeouts.push(t);
}

function clearMusicTimeouts() {
  musicTimeouts.forEach(t => clearTimeout(t));
  musicTimeouts = [];
}

function togglePlayMusic(forcePlay=false) {
  if (isMuted) return;
  if (musicPlaying && !forcePlay) {
    // just stop
    clearMusicTimeouts();
    musicPlaying = false;
    document.getElementById('toggleMusic').textContent = 'Play Music';
    stopVisualizer();
    return;
  }
  // start playing
  musicPlaying = true;
  document.getElementById('toggleMusic').textContent = 'Pause Music';
  playHappyBirthday();
  startVisualizer();
}

document.getElementById('toggleMusic')?.addEventListener('click', () => togglePlayMusic());
document.getElementById('muteMusic')?.addEventListener('click', () => {
  isMuted = !isMuted;
  document.getElementById('muteMusic').textContent = isMuted ? 'Unmute' : 'Mute';
  if (isMuted) { clearMusicTimeouts(); musicPlaying = false; document.getElementById('toggleMusic').textContent = 'Play Music'; }
});
document.getElementById('toggleViz')?.addEventListener('click', () => {
  const el = document.getElementById('musicViz');
  if (!el) return;
  vizRunning = !vizRunning;
  if (vizRunning) startVisualizer(); else stopVisualizer();
});

// --- Age reveal with counting ---
function revealAge(targetAge = 23) {
  const ageReveal = document.getElementById('ageReveal');
  const counter = document.getElementById('ageCounter');
  if (!ageReveal || !counter) return;
  
  ageReveal.classList.remove('hidden');
  let currentAge = 0;
  const duration = 1.8; // seconds
  const startTime = Date.now();
  
  function animate() {
    const elapsed = (Date.now() - startTime) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    // easeOut cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    currentAge = Math.floor(easeProgress * targetAge);
    counter.textContent = currentAge;
    
    if (progress < 1) requestAnimationFrame(animate);
    else {
      counter.textContent = targetAge;
      ageReveal.classList.add('show');
    }
  }
  animate();
}

// Blow candles interaction
function blowCandles() {
  const quoteSection = document.getElementById('quotes');
  if (!quoteSection || quoteSection.classList.contains('hidden')) return;
  
  // Create 5 candles
  for (let i = 0; i < 5; i++) {
    const candle = document.createElement('div');
    candle.className = 'candle';
    candle.style.left = (20 + i * 15) + '%';
    candle.style.bottom = '15%';
    document.body.appendChild(candle);
    
    // Stagger the blow animation
    setTimeout(() => {
      candle.classList.add('blow');
      candle.addEventListener('animationend', () => candle.remove());
    }, i * 100);
  }
  
  // Show age reveal after candles are blown
  setTimeout(() => {
    const ageReveal = document.getElementById('ageReveal');
    const counter = document.getElementById('ageCounter');
    if (!ageReveal || !counter) return;
    
    ageReveal.classList.remove('hidden', 'fade-out');
    counter.textContent = '23';
    ageReveal.classList.add('show');
    
    // Fade out after 10 seconds
    setTimeout(() => {
      ageReveal.classList.add('fade-out');
    }, 10000);
  }, 900);
}

document.getElementById('blowCandlesBtn')?.addEventListener('click', blowCandles);

// --- Birthday Fact Generator ---
const BIRTHDAY_FACTS = [
  // About June 23
  "📅 June 23rd is just days after the Summer Solstice - still the season of growth and light!",
  "♋ People born on June 23rd are Cancers - known for being caring, intuitive, and deeply emotional.",
  "🌙 Cancer is ruled by the Moon, the planet of emotions, intuition, and inner wisdom.",
  "🎂 June 23rd birthdays celebrate in early summer - a time of warmth and new adventures!",
  "✨ June 23, 2003 was a Thursday - a powerful day for new beginnings!",
  
  // About age 23
  "💫 23 is a prime number - special and indivisible!",
  "🧠 At 23, the prefrontal cortex (decision-making part of the brain) is fully developed.",
  "💪 23 is considered the prime age for athletic performance - strong, experienced, and energetic!",
  "🏀 Michael Jordan wore #23 - one of the greatest athletes of all time!",
  "🔬 23 pairs of chromosomes make up human DNA - you're a perfect genetic match!",
  
  // Fun celebratory facts
  "🎉 The word 'birthday' comes from ancient times when people believed birthdays were spiritually significant.",
  "🕯️ Blowing out candles is believed to have originated from ancient Greek moon goddess celebrations.",
  "🎁 The most common birthday gift is money - but thoughtful gifts mean so much more!",
  "🎂 The average person spends $70-$100 on birthday celebrations per year.",
  "🌟 Every second, around 188 people celebrate their birthday worldwide!",
  
  // Chaitra-specific facts
  "🎨 Your name Chaitra means 'Spring' in Sanskrit - symbolizing new beginnings and renewal!",
  "🌸 Spring represents growth, energy, and the beauty of fresh starts.",
  "♋ As a Cancer, you're known for being protective, loyal, and deeply caring of loved ones.",
  "💎 Pearls are the birthstone for June - symbolizing purity and wisdom.",
  "🌹 June flowers are roses and honeysuckle - representing love and sweetness.",
  "🔮 Cancers are natural nurturers with incredible emotional intelligence and empathy!",
  "🌊 Your zodiac element is Water - representing flow, adaptability, and emotional depth.",
  "💝 Born in 2003, you're Gen Z - creative, tech-savvy, and socially conscious!",
  "🎯 23 is the perfect age to chase dreams with wisdom gained from 23 years of experiences.",
  "🎪 You've lived through 23 years of incredible growth, learning, and unforgettable moments!"
];

let factIndex = 0;

function generateFact() {
  const factDisplay = document.getElementById('factDisplay');
  if (!factDisplay) return;
  
  // Get random fact
  factIndex = Math.floor(Math.random() * BIRTHDAY_FACTS.length);
  const fact = BIRTHDAY_FACTS[factIndex];
  
  // Add animation class
  factDisplay.classList.remove('fact-animate');
  void factDisplay.offsetWidth; // Force reflow
  factDisplay.classList.add('fact-animate');
  
  // Update text with slight delay for smooth transition
  setTimeout(() => {
    factDisplay.textContent = fact;
  }, 150);
}

document.getElementById('generateFactBtn')?.addEventListener('click', generateFact);

// --- Interactive Storybook ---
const STORY_PAGES = [
  { title: 'A Bright Beginning', text: 'Once upon a time — on 23 June 2003 — a small spark of joy started a day full of surprises. We gathered friends, songs, and warm wishes to celebrate.', img: 'assets/images/1.jpg' },
  { title: 'Laughs & Candles', text: 'Candles flicker with each memory. Laughter filled the room as stories were shared and dreams whispered into the night.', img: 'assets/images/2.jpg' },
  { title: 'Adventures Await', text: 'With every year comes a new adventure. Pack your curiosity and kindness — the world loves you.', img: 'assets/images/3.jpg' },
  { title: 'Forever Loved', text: 'You are loved more than words can say. Every page of life is brighter with you in it.', img: 'assets/images/4.jpg' }
];

let storyIndex = 0;
let storyUtterance = null;

function renderStoryPage(idx, direction='next') {
  const pageEl = document.getElementById('storyPage');
  const idxEl = document.getElementById('storyIndex');
  const totalEl = document.getElementById('storyTotal');
  if (!pageEl || !idxEl || !totalEl) return;
  idx = Math.max(0, Math.min(idx, STORY_PAGES.length-1));
  totalEl.textContent = String(STORY_PAGES.length);
  idxEl.textContent = String(idx+1);

  // animate out
  pageEl.classList.remove('flip-in');
  pageEl.classList.add('flip-out');
  setTimeout(() => {
    const data = STORY_PAGES[idx];
    pageEl.innerHTML = `<h3>${data.title}</h3><p>${data.text}</p>${data.img?`<img src="${data.img}" alt="${data.title}">`:''}`;
    pageEl.classList.remove('flip-out');
    pageEl.classList.add('flip-in');
    // stop any running narration
    stopNarration();
    storyIndex = idx;
  }, 220);
}

function nextStory() { renderStoryPage(storyIndex+1, 'next'); }
function prevStory() { renderStoryPage(storyIndex-1, 'prev'); }

function narrateStory() {
  if (!('speechSynthesis' in window)) return alert('Speech Synthesis not supported in this browser.');
  stopNarration();
  const data = STORY_PAGES[storyIndex];
  const utter = new SpeechSynthesisUtterance(`${data.title}. ${data.text}`);
  utter.rate = 1.02; utter.pitch = 1;
  utter.onend = () => { document.getElementById('storyNarrate').textContent = '🔊 Narrate'; };
  storyUtterance = utter;
  window.speechSynthesis.speak(utter);
  document.getElementById('storyNarrate').textContent = '⏸ Stop';
}

function stopNarration() {
  if (storyUtterance) { try { window.speechSynthesis.cancel(); } catch(e){} storyUtterance = null; }
}

document.getElementById('storyNext')?.addEventListener('click', () => { nextStory(); });
document.getElementById('storyPrev')?.addEventListener('click', () => { prevStory(); });
document.getElementById('storyNarrate')?.addEventListener('click', () => {
  if (storyUtterance) stopNarration(); else narrateStory();
});

// keyboard navigation
window.addEventListener('keydown', (e) => {
  if (document.querySelector('#storybook')?.classList.contains('hidden')) return;
  if (e.key === 'ArrowRight') nextStory();
  if (e.key === 'ArrowLeft') prevStory();
  if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); narrateStory(); }
});

// initialize story on load
window.addEventListener('load', () => { renderStoryPage(0); });

// --- Fireworks Canvas (music-synced) ---
let fwCanvas, fwCtx, fwWidth, fwHeight;
let fireworks = [];
let fwAnimId = null;
let fwSync = false;
let fwLastSpawn = 0;

function initFireworksCanvas() {
  fwCanvas = document.getElementById('fireworksCanvas');
  if (!fwCanvas) return;
  fwCtx = fwCanvas.getContext('2d');
  function resize() {
    fwWidth = fwCanvas.width = Math.floor(window.innerWidth * devicePixelRatio);
    fwHeight = fwCanvas.height = Math.floor(window.innerHeight * devicePixelRatio);
    fwCanvas.style.width = window.innerWidth + 'px';
    fwCanvas.style.height = window.innerHeight + 'px';
    // use setTransform to avoid cumulative scaling on resize
    fwCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();
  animateFireworks();

  document.getElementById('fireworksBtn')?.addEventListener('click', () => {
    // manual burst at center
    spawnFirework(window.innerWidth/2, window.innerHeight/2, 1.2);
  });
  document.getElementById('fireworksSyncToggle')?.addEventListener('click', (e) => {
    fwSync = !fwSync;
    const btn = e.currentTarget;
    btn.textContent = fwSync ? 'Sync: On' : 'Sync: Off';
    if (fwSync) startFireworksSync(); else stopFireworksSync();
  });
}

class FWParticle {
  constructor(x,y, vx, vy, life, color, size) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.life = life; this.color = color; this.size = size; this.alpha = 1;
  }
  update(dt) {
    this.vx *= 0.99; this.vy += 0.06; // gravity
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt * 0.02;
    this.alpha = Math.max(0, this.life);
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

function spawnFirework(x, y, intensity=1) {
  const colors = ['#ff6f61','#ffd700','#6a0572','#00bfff','#8be46b','#ff94b9'];
  const count = Math.floor(30 * intensity + Math.random()*20);
  for (let i=0;i<count;i++) {
    const angle = Math.random()*Math.PI*2;
    const speed = (2 + Math.random()*4) * (0.6 + intensity);
    const vx = Math.cos(angle)*speed; const vy = Math.sin(angle)*speed;
    const color = colors[Math.floor(Math.random()*colors.length)];
    const p = new FWParticle(x, y, vx, vy, 1 + Math.random()*0.8, color, 2 + Math.random()*3);
    fireworks.push(p);
  }
}

function animateFireworks() {
  const now = performance.now();
  const dt = 1; // simple fixed step
  if (!fwCtx) return;
  // clear canvas each frame (avoid dark overlay); use lighter composite for glow
  // clear using default transform (pixel coords)
  fwCtx.save();
  fwCtx.setTransform(1,0,0,1,0,0);
  fwCtx.clearRect(0,0,fwCanvas.width, fwCanvas.height);
  fwCtx.restore();
  fwCtx.globalCompositeOperation = 'lighter';

  // update and draw particles
  for (let i = fireworks.length-1; i >= 0; i--) {
    const p = fireworks[i];
    p.update(dt);
    if (p.life <= 0 || p.alpha <= 0) { fireworks.splice(i,1); continue; }
    p.draw(fwCtx);
  }

  // restore normal composite for subsequent frames
  fwCtx.globalCompositeOperation = 'source-over';
  fwAnimId = requestAnimationFrame(animateFireworks);
}

let fwSyncInterval = null;
function startFireworksSync() {
  if (!analyser) ensureAudio();
  if (!analyser) return;
  const data = new Uint8Array(analyser.frequencyBinCount);
  fwLastSpawn = 0;
  function tick() {
    analyser.getByteFrequencyData(data);
    // compute average energy
    let sum = 0; for (let i=0;i<data.length;i++) sum += data[i];
    const avg = sum / data.length;
    const now = performance.now();
    // spawn when loud enough and cooldown passed
    if (avg > 100 && (now - fwLastSpawn) > 300) {
      // spawn at a random horizontal position, height tied to frequency bins
      const x = Math.random()*window.innerWidth;
      const y = Math.random()*window.innerHeight*0.6 + window.innerHeight*0.15;
      const intensity = Math.min(3, (avg - 90) / 60);
      spawnFirework(x, y, intensity);
      fwLastSpawn = now;
    }
  }
  fwSyncInterval = setInterval(tick, 120);
}

function stopFireworksSync() {
  if (fwSyncInterval) { clearInterval(fwSyncInterval); fwSyncInterval = null; }
}

// initialize on load
window.addEventListener('load', () => { initFireworksCanvas(); });

// Header jump to storybook
document.getElementById('jumpStoryBtn')?.addEventListener('click', (e) => {
  const sb = document.getElementById('storybook');
  const page = document.getElementById('storyPage');
  if (sb) sb.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => { if (page) page.focus(); }, 600);
});


// --- Easter Egg Hunt ---
const EGG_KEY = 'foundEggs_v1';
const EASTER_MESSAGES = [
  'A secret message: You are loved more than the stars.',
  'Hidden photo unlocked! Check the gallery for a surprise.',
  'Bonus: Play the mini-game twice as long next time!',
  'Tiny confetti storm unlocked — party mode on!',
  'You found a secret wishlist item — now make a wish!',
  'Surprise badge unlocked: Super Finder'
];

function initEasterEggs() {
  const existing = document.querySelectorAll('.site-egg');
  if (existing.length) return; // already added

  const found = JSON.parse(localStorage.getItem(EGG_KEY) || '[]');
  const total = 6;
  document.getElementById('eggTotal').textContent = String(total);
  document.getElementById('eggFoundCount').textContent = String(found.length || 0);

  for (let i=0;i<total;i++) {
    const e = document.createElement('button');
    e.className = 'site-egg';
    e.setAttribute('aria-label', 'Hidden egg');
    e.dataset.eggId = String(i);
    e.style.left = (6 + Math.random()*82) + '%';
    e.style.top = (8 + Math.random()*78) + '%';
    // colors
    const palette = ['#ff6f61','#ffd166','#6a0572','#00bcd4','#ff94b9','#8be46b'];
    e.style.background = palette[i % palette.length];
    e.innerHTML = '🥚';
    if (found.includes(i)) { e.classList.add('found'); }
    e.addEventListener('click', (ev) => { ev.stopPropagation(); revealEgg(i); });
    document.body.appendChild(e);
  }

  // controls
  document.getElementById('eggHintBtn')?.addEventListener('click', toggleEggHints);
  document.querySelector('#eggModal .egg-close')?.addEventListener('click', hideEggModal);
}

let eggHintsOn = false;
function toggleEggHints() {
  eggHintsOn = !eggHintsOn;
  document.querySelectorAll('.site-egg').forEach(el => {
    if (eggHintsOn) el.classList.add('hint'); else el.classList.remove('hint');
  });
  const btn = document.getElementById('eggHintBtn');
  if (btn) btn.textContent = eggHintsOn ? '🔎 Hints On' : '🔎 Find Eggs';
}

function revealEgg(id) {
  const num = Number(id);
  const found = JSON.parse(localStorage.getItem(EGG_KEY) || '[]');
  if (!found.includes(num)) {
    found.push(num);
    localStorage.setItem(EGG_KEY, JSON.stringify(found));
    document.getElementById('eggFoundCount').textContent = String(found.length);
    const el = document.querySelector(`.site-egg[data-egg-id='${num}']`);
    if (el) el.classList.add('found');
    try { emitCakeConfetti(12); } catch(e){}
  }
  showEggModal('Surprise!', EASTER_MESSAGES[num % EASTER_MESSAGES.length]);

  // if all eggs found, clear them from the page and celebrate
  const total = Number(document.getElementById('eggTotal')?.textContent || 0);
  const updatedFound = JSON.parse(localStorage.getItem(EGG_KEY) || '[]');
  if (updatedFound.length >= total && total > 0) {
    setTimeout(() => {
      clearEggs();
      try { emitCakeConfetti(60); } catch(e){}
      showEggModal('All Eggs Found!', 'You found them all — bonus unlocked!');
    }, 600);
  }
}

function clearEggs() {
  document.querySelectorAll('.site-egg').forEach(el => el.remove());
  const controls = document.getElementById('eggControls');
  if (controls) controls.style.display = 'none';
}

function showEggModal(title, message) {
  const modal = document.getElementById('eggModal');
  if (!modal) return;
  modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false');
  document.getElementById('eggModalTitle').textContent = title;
  document.getElementById('eggModalMessage').textContent = message;
}

function hideEggModal() {
  const modal = document.getElementById('eggModal');
  if (!modal) return;
  modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true');
}

// initialize after DOM ready
window.addEventListener('load', () => { initEasterEggs(); });

// --- Mini-game: Pop the Balloons ---
let gameInterval = null;
let gameSpawnInterval = null;
let gameTimeLeft = 30;
let gameScore = 0;

function startGame() {
  const timerEl = document.getElementById('gameTimer');
  const scoreEl = document.getElementById('gameScore');
  const startBtn = document.getElementById('startGameBtn');
  const resetBtn = document.getElementById('resetGameBtn');
  const area = document.getElementById('gameArea');
  if (!timerEl || !scoreEl || !startBtn || !area) return;

  // reset
  clearInterval(gameInterval); clearInterval(gameSpawnInterval);
  area.innerHTML = '';
  gameTimeLeft = 30; gameScore = 0; scoreEl.textContent = '0'; timerEl.textContent = String(gameTimeLeft);
  startBtn.style.display = 'none'; resetBtn.style.display = 'none';

  // spawn balloons
  // spawn slower so balloons don't overcrowd when they rise slowly
  gameSpawnInterval = setInterval(() => spawnGameBalloon(area), 1500);
  // game timer
  gameInterval = setInterval(() => {
    gameTimeLeft -= 1;
    timerEl.textContent = String(gameTimeLeft);
    if (gameTimeLeft <= 0) endGame();
  }, 1000);
}

function spawnGameBalloon(area) {
  const b = document.createElement('div');
  b.className = 'game-balloon';
  // random color
  const colors = ['#ff6f61','#ffd700','#6a0572','#00bfff','#ff94b9'];
  const color = colors[Math.floor(Math.random()*colors.length)];
  b.style.background = `radial-gradient(circle at 30% 30%, #fff, ${color})`;
  const left = Math.random() * 86; // leave margin
  b.style.left = left + '%';
  b.style.bottom = '-120px';
  b.innerHTML = '🎈<div class="string"></div>';
  area.appendChild(b);

  // animate rise
  // make balloons rise much slower (longer duration)
  const rise = 18 + Math.random()*12; // seconds (18-30s)
  b.animate([{ transform: 'translateY(0)' }, { transform: `translateY(-${rise*100}vh)` }], { duration: rise*1000, easing: 'linear' });

  const popHandler = (e) => {
    e.stopPropagation();
    popBalloon(b);
  };
  b.addEventListener('click', popHandler);

  // remove after animation ends
  setTimeout(() => { if (b.parentNode) b.remove(); }, (rise*1000)+600);
}

function popBalloon(b) {
  if (!b) return;
  // prevent double pop
  if (b.classList.contains('pop')) return;
  b.classList.add('pop');
  gameScore += 1;
  document.getElementById('gameScore').textContent = String(gameScore);
  // small pop effect: confetti
  try { emitCakeConfetti(6); } catch (e) {}
  setTimeout(() => { if (b.parentNode) b.remove(); }, 350);
}

function endGame() {
  clearInterval(gameInterval); clearInterval(gameSpawnInterval);
  gameInterval = null; gameSpawnInterval = null;
  document.getElementById('startGameBtn').style.display = 'inline-block';
  document.getElementById('resetGameBtn').style.display = 'inline-block';
  // big confetti for result
  try { emitCakeConfetti(30); } catch (e) {}
  const area = document.getElementById('gameArea');
  if (area) {
    const msg = document.createElement('div');
    msg.className = 'game-result';
    msg.textContent = `Time's up! You popped ${gameScore} balloons.`;
    msg.style.position = 'absolute'; msg.style.left='50%'; msg.style.top='40%'; msg.style.transform='translate(-50%,-50%)'; msg.style.background='rgba(255,255,255,0.9)'; msg.style.padding='14px 18px'; msg.style.borderRadius='12px'; msg.style.boxShadow='0 10px 30px rgba(106,5,114,0.08)';
    area.appendChild(msg);
    setTimeout(() => { if (msg.parentNode) msg.remove(); }, 4500);
  }
}

document.getElementById('startGameBtn')?.addEventListener('click', startGame);
document.getElementById('resetGameBtn')?.addEventListener('click', () => { document.getElementById('gameArea').innerHTML=''; document.getElementById('gameScore').textContent='0'; document.getElementById('gameTimer').textContent='30'; document.getElementById('resetGameBtn').style.display='none'; });

// --- Visualizer drawing ---
function startVisualizer() {
  if (!analyser) ensureAudio();
  const canvas = document.getElementById('musicViz');
  if (!canvas || !analyser) return;
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  const ctx = canvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    vizAnimationId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const barWidth = (canvas.width / bufferLength) * 1.6;
    let x = 0;
    for (let i=0;i<bufferLength;i++) {
      const v = dataArray[i] / 255;
      const barHeight = v * canvas.height * 0.9;
      const hue = 330 - (v * 120);
      ctx.fillStyle = 'hsl(' + hue + ' 85% 60%)'.replace(/\s+/g, ' ');
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  if (!vizAnimationId) draw();
}

function stopVisualizer() {
  if (vizAnimationId) cancelAnimationFrame(vizAnimationId);
  vizAnimationId = null;
  const canvas = document.getElementById('musicViz');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }
}

// --- Floating sparkle particles for background ---
function startParticleEffect() {
  const wrap = document.getElementById('particles');
  if (!wrap) return;
  const colors = ['#ffd6e8','#fff6f8','#ffd1f0','#ffe4f2'];
  setInterval(() => {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 6 + Math.random()*10;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = (Math.random()*100) + '%';
    p.style.bottom = '-10px';
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.opacity = 0.9;
    p.style.transform = 'translateY(0)';
    p.style.animation = 'particleFloat ' + (8 + Math.random()*8) + 's linear forwards';
    wrap.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }, 400);
}

// start particles immediately
try { startParticleEffect(); } catch (e) {}

// --- 23 Reasons We Love You ---
const REASONS_OF_LOVE = [
  "Your kindness makes every friend feel supported and cherished.",
  "You bring light into the room with your warm smile.",
  "Your creativity turns ordinary moments into beautiful memories.",
  "You are thoughtful in the sweetest and most personal ways.",
  "Your laughter is contagious and brightens everyone's day.",
  "You always know how to make people feel comfortable and loved.",
  "Your courage inspires others to follow their hearts.",
  "You have a gift for turning dreams into reality.",
  "Your generosity is endless and deeply appreciated.",
  "You are brave, even when life feels uncertain.",
  "Your love for adventure makes every moment exciting.",
  "You are deeply loyal and a true friend through everything.",
  "Your gentle spirit brings peace to everyone around you.",
  "You celebrate life with enthusiasm and grace.",
  "Your intelligence and curiosity make you endlessly fascinating.",
  "You make the people around you feel noticed and special.",
  "Your caring heart is one of the most beautiful parts of you.",
  "Your confidence encourages others to believe in themselves.",
  "You are wonderfully unique and perfectly yourself.",
  "Your passion for the things you love is inspiring.",
  "You have a natural way of turning ordinary days into celebrations.",
  "Your presence feels like a warm hug to everyone you meet.",
  "Your kindness, beauty, and spirit are reasons to celebrate every day."
];
let currentReasonIndex = 0;

function revealReason() {
  const card = document.getElementById('reasonCard');
  const counter = document.getElementById('reasonCounter');
  const resetBtn = document.getElementById('resetReasonsBtn');
  if (!card || !counter || !resetBtn) return;

  if (currentReasonIndex >= REASONS_OF_LOVE.length) {
    card.textContent = "You've already revealed all 23 reasons! Thank you for being amazing. ❤️";
    card.classList.add('reason-complete');
    return;
  }

  card.textContent = REASONS_OF_LOVE[currentReasonIndex];
  card.classList.add('reveal');
  setTimeout(() => card.classList.remove('reveal'), 500);

  currentReasonIndex += 1;
  counter.textContent = currentReasonIndex;

  if (currentReasonIndex === REASONS_OF_LOVE.length) {
    card.textContent = "All 23 reasons are revealed! You're loved more than words can say. ❤️";
    card.classList.add('reason-complete');
    startSurpriseEffects(5000);
    resetBtn.style.display = 'inline-block';
  } else {
    resetBtn.style.display = 'inline-block';
  }
}

function resetReasons() {
  currentReasonIndex = 0;
  const card = document.getElementById('reasonCard');
  const counter = document.getElementById('reasonCounter');
  const resetBtn = document.getElementById('resetReasonsBtn');
  if (!card || !counter || !resetBtn) return;

  card.textContent = 'Tap the button below to reveal a reason why Chaitra is so special.';
  card.classList.remove('reason-complete');
  counter.textContent = '0';
  resetBtn.style.display = 'none';
}

document.getElementById('revealReasonBtn')?.addEventListener('click', revealReason);
document.getElementById('resetReasonsBtn')?.addEventListener('click', resetReasons);

// --- Personality Quiz ---
const QUIZ_DATA = [
  {
    question: "What's your ideal way to celebrate your birthday?",
    answers: [
      { text: "Quiet day with close loved ones ✨", type: "reflective" },
      { text: "Big party with lots of friends 🎉", type: "social" },
      { text: "Adventure or new experience 🌍", type: "adventurous" },
      { text: "Cozy time doing my favorite things 🎨", type: "creative" }
    ]
  },
  {
    question: "When faced with challenges, you tend to:",
    answers: [
      { text: "Reflect and think things through 🤔", type: "reflective" },
      { text: "Talk it out with others 💬", type: "social" },
      { text: "Take action and face it head-on 💪", type: "adventurous" },
      { text: "Find a creative solution 🎯", type: "creative" }
    ]
  },
  {
    question: "Your friends value you most for:",
    answers: [
      { text: "Your deep understanding & empathy 💝", type: "reflective" },
      { text: "Your ability to bring people together 🤝", type: "social" },
      { text: "Your courage & enthusiasm 🔥", type: "adventurous" },
      { text: "Your unique ideas & perspective 💡", type: "creative" }
    ]
  },
  {
    question: "In your free time, you enjoy:",
    answers: [
      { text: "Journaling or meditation 📔", type: "reflective" },
      { text: "Hanging out with friends 👥", type: "social" },
      { text: "Trying new things & exploring 🗺️", type: "adventurous" },
      { text: "Creating art, music, or writing ✍️", type: "creative" }
    ]
  },
  {
    question: "Your biggest strength is:",
    answers: [
      { text: "Emotional intelligence & intuition 🌙", type: "reflective" },
      { text: "Communication & charisma ⭐", type: "social" },
      { text: "Confidence & determination 💎", type: "adventurous" },
      { text: "Imagination & innovation 🎪", type: "creative" }
    ]
  }
];

const PERSONALITY_RESULTS = {
  reflective: {
    title: "The Thoughtful Dreamer 🌙",
    emoji: "🌙",
    description: "You're intuitive, empathetic, and deeply aware of your emotions and others'. Like Cancer, your superpower is understanding the unseen depths in people and situations.",
    traits: ["Intuitive", "Empathetic", "Wise", "Introspective", "Caring"]
  },
  social: {
    title: "The Radiant Soul ⭐",
    emoji: "⭐",
    description: "You light up any room with your warmth and infectious energy. People are drawn to your genuine kindness and ability to make everyone feel valued and included.",
    traits: ["Charismatic", "Friendly", "Warm", "Inclusive", "Joyful"]
  },
  adventurous: {
    title: "The Fearless Pioneer 🔥",
    emoji: "🔥",
    description: "You're bold, confident, and not afraid to pursue your dreams. Your courage and determination inspire others to believe in themselves and take action.",
    traits: ["Courageous", "Determined", "Confident", "Bold", "Inspiring"]
  },
  creative: {
    title: "The Visionary Artist 🎨",
    emoji: "🎨",
    description: "Your mind overflows with ideas and unique perspectives. You see the world differently and have the gift of creating beauty, meaning, and innovation in everything you do.",
    traits: ["Creative", "Imaginative", "Innovative", "Thoughtful", "Expressive"]
  }
};

let quizAnswers = {};
let currentQuestion = 0;

function initializeQuiz() {
  quizAnswers = {};
  currentQuestion = 0;
  displayQuestion();
}

function displayQuestion() {
  const quizContent = document.getElementById('quizContent');
  const progressBar = document.getElementById('progressBar');
  
  if (currentQuestion >= QUIZ_DATA.length) {
    showQuizResults();
    return;
  }
  
  const question = QUIZ_DATA[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_DATA.length) * 100;
  progressBar.style.width = progress + '%';
  
  let html = `
    <div class="quiz-question">
      <div class="question-number">Question ${currentQuestion + 1} of ${QUIZ_DATA.length}</div>
      <div class="question-text">${question.question}</div>
      <div class="answer-options">
  `;
  
  question.answers.forEach((answer, idx) => {
    html += `
      <div class="answer-option" onclick="selectAnswer(${currentQuestion}, ${idx})">
        ${answer.text}
      </div>
    `;
  });
  
  html += `</div></div>`;
  quizContent.innerHTML = html;
}

function selectAnswer(questionIdx, answerIdx) {
  const question = QUIZ_DATA[questionIdx];
  const answerType = question.answers[answerIdx].type;
  
  quizAnswers[questionIdx] = answerType;
  currentQuestion++;
  
  setTimeout(() => displayQuestion(), 300);
}

function showQuizResults() {
  // Count personality types
  const counts = { reflective: 0, social: 0, adventurous: 0, creative: 0 };
  Object.values(quizAnswers).forEach(type => counts[type]++);
  
  // Find dominant personality
  let dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  const result = PERSONALITY_RESULTS[dominant];
  
  const quizContent = document.getElementById('quizContent');
  const progressBar = document.getElementById('progressBar');
  progressBar.style.width = '100%';
  
  let html = `
    <div class="quiz-result">
      <div class="result-emoji">${result.emoji}</div>
      <div class="result-title">${result.title}</div>
      <div class="result-description">${result.description}</div>
      <div class="result-traits">
  `;
  
  result.traits.forEach(trait => {
    html += `<div class="trait-badge">${trait}</div>`;
  });
  
  html += `
      </div>
    </div>
  `;
  
  quizContent.innerHTML = html;
  document.getElementById('retakeQuizBtn').style.display = 'block';
}

document.getElementById('retakeQuizBtn')?.addEventListener('click', () => {
  document.getElementById('retakeQuizBtn').style.display = 'none';
  initializeQuiz();
});
