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
    show("autoSlideWrap");
    show("personalityQuiz");
    show("factGenerator");
    // populate side-by-side gallery when revealed
    try { renderSideBySide(window.SLIDESHOW_IMAGES || []); } catch (e) {}
    show("surprise");
    
    // Initialize quiz when revealed
    try { initializeQuiz(); } catch (e) {}

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

// Note: gallery starts when curtain opens via call to renderSideBySide

// --- WebAudio Happy Birthday synth ---
let audioCtx = null;
let musicPlaying = false;
let isMuted = false;
let musicTimeouts = [];

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
  osc.connect(gain); gain.connect(audioCtx.destination);
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
    return;
  }
  // start playing
  musicPlaying = true;
  document.getElementById('toggleMusic').textContent = 'Pause Music';
  playHappyBirthday();
}

document.getElementById('toggleMusic')?.addEventListener('click', () => togglePlayMusic());
document.getElementById('muteMusic')?.addEventListener('click', () => {
  isMuted = !isMuted;
  document.getElementById('muteMusic').textContent = isMuted ? 'Unmute' : 'Mute';
  if (isMuted) { clearMusicTimeouts(); musicPlaying = false; document.getElementById('toggleMusic').textContent = 'Play Music'; }
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
