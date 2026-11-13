/**
 * ============================================================================
 * THE STRANGER TEST V2 — SCRIPT
 * A 30-Second Premium Interactive Experience & Mini Personality Game
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // GOOGLE APPS SCRIPT WEB APP INTEGRATION
  // ==========================================================================
  // Responses are submitted automatically after the final answer.
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxGyCmHqRnitbPnnPQE-MBuE25peg1Cy7OcPLRo_Dad6kX6sIx26PuldXtbW5RA4dyZ/exec";

  // --------------------------------------------------------------------------
  // 1. STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const state = {
    currentScreen: 1,
    soundEnabled: true,
    audioInitialized: false,
    mood: null,
    freeDay: null,
    superpower: null,
    vibeResult: null,
    memorableAnswer: null,
    finalAnswer: null,
    isEnvelopeOpened: false,
    submissionStatus: 'idle'
  };

  // --------------------------------------------------------------------------
  // 2. WEB AUDIO API SYNTHESIZER
  // --------------------------------------------------------------------------
  class SoundSynthesizer {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
    }

    init() {
      if (this.ctx) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(state.soundEnabled ? 0.35 : 0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch (err) {
        console.warn('Web Audio not supported or blocked:', err);
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    setMuted(muted) {
      if (!this.masterGain || !this.ctx) return;
      const targetGain = muted ? 0 : 0.35;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }

    // 1. Welcome Sound: Soft, magical, welcoming chime
    playWelcome() {
      if (!this.ctx || !state.soundEnabled) return;
      this.resume();
      const now = this.ctx.currentTime;
      // Arpeggio: E5 (659.25), G#5 (830.61), B5 (987.77), E6 (1318.51)
      const freqs = [659.25, 830.61, 987.77, 1318.51];
      freqs.forEach((freq, index) => {
        const noteTime = now + index * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.22, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 1.3);
      });
    }

    // 2. Button Click: Subtle, satisfying pop
    playButtonClick() {
      if (!this.ctx || !state.soundEnabled) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.07);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.09);
    }

    // 3. Answer Selection: Cute confirmation sound
    playSelectAnswer() {
      if (!this.ctx || !state.soundEnabled) return;
      this.resume();
      const now = this.ctx.currentTime;
      // Two-tone upward chime (C5 523.25 -> G5 783.99)
      const notes = [523.25, 783.99];
      notes.forEach((freq, i) => {
        const t = now + i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.24, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.5);
      });
    }

    // 4. Screen Transition: Short magical whoosh
    playScreenTransition() {
      if (!this.ctx || !state.soundEnabled) return;
      this.resume();
      const now = this.ctx.currentTime;

      // Filtered noise buffer sweep
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 3.0;
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.18);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.36);
    }

    // 5. Envelope Opening: Delightful sparkle sound
    playEnvelopeOpen() {
      if (!this.ctx || !state.soundEnabled) return;
      this.resume();
      const now = this.ctx.currentTime;
      const freqs = [1046.5, 1318.5, 1567.98, 1760.0, 2093.0, 2637.0];
      freqs.forEach((freq, idx) => {
        const t = now + idx * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.42);
      });
    }

    // 6. Message Reveal: Gentle emotional piano-like chord
    playMessageReveal() {
      if (!this.ctx || !state.soundEnabled) return;
      this.resume();
      const now = this.ctx.currentTime;
      const chord = [185.0, 233.08, 277.18, 349.23, 415.3];

      chord.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const harmonic = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.03);

        harmonic.type = 'triangle';
        harmonic.frequency.setValueAtTime(freq * 2, now + index * 0.03);

        gain.gain.setValueAtTime(0, now + index * 0.03);
        gain.gain.linearRampToValueAtTime(0.14, now + index * 0.03 + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.03 + 2.5);

        osc.connect(gain);
        harmonic.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + index * 0.03);
        harmonic.start(now + index * 0.03);
        osc.stop(now + 2.6);
        harmonic.stop(now + 2.6);
      });
    }

    // 7. Final Celebration: Cheerful multi-note celebration sound
    playCelebration() {
      if (!this.ctx || !state.soundEnabled) return;
      this.resume();
      const now = this.ctx.currentTime;
      const fanfare = [
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.14 },
        { f: 987.77, d: 0.14 },
        { f: 1046.5, d: 0.35 },
        { f: 1567.98, d: 0.6 }
      ];

      let accumulatedTime = now;
      fanfare.forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, accumulatedTime);

        gain.gain.setValueAtTime(0, accumulatedTime);
        gain.gain.linearRampToValueAtTime(0.24, accumulatedTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, accumulatedTime + note.d);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(accumulatedTime);
        osc.stop(accumulatedTime + note.d + 0.05);

        accumulatedTime += 0.09;
      });
    }

    // 8. Hover Interaction: Very subtle tick for desktop
    playHover() {
      if (!this.ctx || !state.soundEnabled) return;
      if (window.matchMedia('(hover: none)').matches) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.035);
    }

    // 9. Refusal / Alert Sound: Cute playful cartoon wobble
    playDenied() {
      if (!this.ctx || !state.soundEnabled) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(210, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.35);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.38);
    }

    // 10. Result Reveal: Magical shimmering harp/arpeggio chime
    playResultReveal() {
      if (!this.ctx || !state.soundEnabled) return;
      this.resume();
      const now = this.ctx.currentTime;
      const freqs = [261.63, 329.63, 392.00, 493.88, 587.33, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const t = now + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.19, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 1.3);
      });
    }

    // 11. Counter Tick: Delicate micro-click for score counters
    playCounterTick() {
      if (!this.ctx || !state.soundEnabled) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.015);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.025);
    }
  }

  const sound = new SoundSynthesizer();

  // --------------------------------------------------------------------------
  // 3. DETERMINISTIC VIBE PERSONALITY PROFILES (16 COMBINATIONS)
  // --------------------------------------------------------------------------
  const freedayLabels = {
    explorer: "THE EXPLORER 🌍 (Going somewhere I've never been)",
    comfort: "THE COMFORT SEEKER 🍿 (Snacks, movies, bed)",
    spontaneous: "THE SPONTANEOUS ONE 🎉 (Whatever happens, happens!)",
    planner: "THE MASTER PLANNER 🧠 (First, I'll make a plan for the day)"
  };

  const powerLabels = {
    minds: "READ MINDS 🧠 (Know what everyone is thinking)",
    time: "STOP TIME ⏳ (Freeze the world whenever I want)",
    teleport: "TELEPORTATION ✨ (Travel anywhere in a second)",
    future: "SEE THE FUTURE 🔮 (Know what's coming next)"
  };

  const vibeProfiles = {
    explorer: {
      minds: {
        title: "The Mind-Reading Globetrotter 🌍🧠",
        desc: "You want to explore every corner of the world and know what everyone is secretly thinking. Fearless, observant, and impossible to surprise!",
        adventure: 94,
        curiosity: 98,
        relaxation: 38,
        mystery: 88
      },
      time: {
        title: "The Chrono-Adventurer 🌍⏳",
        desc: "You want to explore uncharted horizons, but on your own terms with no alarm clocks rushing you. Master of pacing and wanderlust.",
        adventure: 92,
        curiosity: 90,
        relaxation: 65,
        mystery: 85
      },
      teleport: {
        title: "The Interstellar Nomad 🌍✨",
        desc: "Packing bags? Too slow. You want to be in Tokyo for breakfast and Paris for dinner. Ultimate explorer energy with zero patience for airport lines!",
        adventure: 99,
        curiosity: 96,
        relaxation: 48,
        mystery: 78
      },
      future: {
        title: "The Prophetic Pathfinder 🌍🔮",
        desc: "You love discovering new paths, but you'd prefer to know if it rains before heading out. Strategic curiosity at its finest!",
        adventure: 88,
        curiosity: 95,
        relaxation: 42,
        mystery: 96
      }
    },
    comfort: {
      minds: {
        title: "The Cozy Mind-Reader 🍿🧠",
        desc: "You love being wrapped in a blanket, but your brain is secretly analyzing human psychology like a master detective. Chill on the outside, genius inside.",
        adventure: 35,
        curiosity: 88,
        relaxation: 96,
        mystery: 90
      },
      time: {
        title: "The Master of Hibernation 🍿⏳",
        desc: "World frozen? Perfect, that means 14 hours of uninterrupted sleep and zero notifications. You've unlocked the highest state of human peace!",
        adventure: 28,
        curiosity: 75,
        relaxation: 100,
        mystery: 82
      },
      teleport: {
        title: "The Ultra-Efficient Lounger 🍿✨",
        desc: "Why walk to the kitchen for snacks when you could teleport? You use supreme cosmic power strictly to maximize personal comfort. Respect.",
        adventure: 55,
        curiosity: 80,
        relaxation: 95,
        mystery: 68
      },
      future: {
        title: "The Clairvoyant Cocoon 🍿🔮",
        desc: "You want to know the future just to ensure no unexpected drama interrupts your Netflix schedule. Peak cozy foresight.",
        adventure: 32,
        curiosity: 84,
        relaxation: 94,
        mystery: 92
      }
    },
    spontaneous: {
      minds: {
        title: "The Chaotic Empath 🎉🧠",
        desc: "You run entirely on instinct, and reading minds would make life a wild improv show. Energetic, unpredictable, and surprisingly intuitive!",
        adventure: 89,
        curiosity: 99,
        relaxation: 40,
        mystery: 94
      },
      time: {
        title: "The Midnight Prankster 🎉⏳",
        desc: "Freezing time whenever things get too serious so you can plan your next random antic. Spontaneity with a built-in pause button!",
        adventure: 85,
        curiosity: 86,
        relaxation: 60,
        mystery: 90
      },
      teleport: {
        title: "The Instant Chaos Comet 🎉✨",
        desc: "One second here, next second across the globe. You don't have a plan and you don't need one. Pure chaotic main character energy!",
        adventure: 98,
        curiosity: 92,
        relaxation: 35,
        mystery: 75
      },
      future: {
        title: "The Gambler of Destiny 🎉🔮",
        desc: "You see what's coming next and decide to do the exact opposite just for the plot. Unpredictable in the most entertaining way!",
        adventure: 86,
        curiosity: 94,
        relaxation: 45,
        mystery: 95
      }
    },
    planner: {
      minds: {
        title: "The Chessmaster Diplomat 🧠♟️",
        desc: "You have a color-coded spreadsheet for life, and reading minds gives you a 10-step advantage in every interaction. Unstoppable intellect!",
        adventure: 58,
        curiosity: 95,
        relaxation: 55,
        mystery: 92
      },
      time: {
        title: "The Time Lord Organizer 🧠⏳",
        desc: "Freezing time is the ultimate productivity hack. You finally have enough hours to finish your to-do list, organize your closet, and still take a nap.",
        adventure: 62,
        curiosity: 85,
        relaxation: 72,
        mystery: 88
      },
      teleport: {
        title: "The Precision Teleporter 🧠✨",
        desc: "You calculate the exact coordinates to arrive precisely 2 minutes before the reservation. Maximum efficiency meets cosmic wizardry!",
        adventure: 80,
        curiosity: 88,
        relaxation: 68,
        mystery: 76
      },
      future: {
        title: "The 4D Multiverse Architect 🧠🔮",
        desc: "Knowing the future means your backup plans now have backup plans in alternate timelines. Truly playing 4D chess with reality!",
        adventure: 70,
        curiosity: 96,
        relaxation: 50,
        mystery: 99
      }
    }
  };

  // --------------------------------------------------------------------------
  // 4. AMBIENT BACKGROUND PARTICLES CANVAS
  // --------------------------------------------------------------------------
  class AmbientParticleBackground {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.numParticles = 36;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pointer = { x: -1000, y: -1000 };

      this.init();
    }

    init() {
      this.resize();
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('pointermove', (e) => {
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
      });

      this.colors = ['#B9A0FF', '#FFB8D2', '#FFF8F1', '#8057E5'];

      for (let i = 0; i < this.numParticles; i++) {
        this.particles.push(this.createParticle());
      }

      this.animate();
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.scale(dpr, dpr);
    }

    createParticle() {
      return {
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2.2 + 0.8,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        vx: (Math.random() - 0.5) * 0.45,
        vy: -Math.random() * 0.45 - 0.15,
        alpha: Math.random() * 0.5 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        angle: Math.random() * Math.PI * 2
      };
    }

    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      for (let p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.pulseSpeed;

        const dx = p.x - this.pointer.x;
        const dy = p.y - this.pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          p.x += (dx / dist) * force * 1.5;
          p.y += (dy / dist) * force * 1.5;
        }

        if (p.y < -10) p.y = this.height + 10;
        if (p.x < -10) p.x = this.width + 10;
        if (p.x > this.width + 10) p.x = -10;

        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.angle));

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = Math.max(0, currentAlpha);
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.fill();
        this.ctx.restore();
      }

      requestAnimationFrame(() => this.animate());
    }
  }

  // --------------------------------------------------------------------------
  // 5. CONFETTI ENGINE (CANVAS)
  // --------------------------------------------------------------------------
  class ConfettiEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.confetti = [];
      this.colors = ['#B9A0FF', '#FFB8D2', '#FFF8F1', '#8057E5', '#FFD166'];
      this.running = false;

      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.ctx.scale(dpr, dpr);
    }

    launch(count = 90) {
      const width = window.innerWidth;
      const height = window.innerHeight;

      for (let i = 0; i < count; i++) {
        this.confetti.push({
          x: width * 0.5 + (Math.random() - 0.5) * 160,
          y: height * 0.45,
          w: Math.random() * 8 + 6,
          h: Math.random() * 5 + 4,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          vx: (Math.random() - 0.5) * 14,
          vy: -Math.random() * 12 - 4,
          rotation: Math.random() * 360,
          vRotation: (Math.random() - 0.5) * 12,
          gravity: 0.28,
          friction: 0.98,
          alpha: 1,
          decay: Math.random() * 0.008 + 0.006
        });
      }

      if (!this.running) {
        this.running = true;
        this.render();
      }
    }

    render() {
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = this.confetti.length - 1; i >= 0; i--) {
        const c = this.confetti[i];
        c.vy += c.gravity;
        c.vx *= c.friction;
        c.vy *= c.friction;
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.vRotation;
        c.alpha -= c.decay;

        if (c.alpha <= 0 || c.y > window.innerHeight + 20) {
          this.confetti.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(c.x, c.y);
        this.ctx.rotate((c.rotation * Math.PI) / 180);
        this.ctx.fillStyle = c.color;
        this.ctx.globalAlpha = c.alpha;
        this.ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        this.ctx.restore();
      }

      if (this.confetti.length > 0) {
        requestAnimationFrame(() => this.render());
      } else {
        this.running = false;
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 6. MASCOT ("COSMO") CONTROLLER
  // --------------------------------------------------------------------------
  class MascotController {
    constructor() {
      this.el = document.getElementById('mascot-companion');
      this.wrapper = document.getElementById('mascot-trigger');
      this.bubble = document.getElementById('mascot-bubble');
      this.bubbleText = this.bubble ? this.bubble.querySelector('.bubble-content') : null;

      this.eyesNormal = document.querySelector('.eyes-normal');
      this.eyesHappy = document.querySelector('.eyes-happy');
      this.eyesSleepy = document.querySelector('.eyes-sleepy');
      this.eyesWink = document.querySelector('.eyes-wink');

      this.mouthSmile = document.querySelector('.mouth-smile');
      this.mouthOpen = document.querySelector('.mouth-open');
      this.mouthOoh = document.querySelector('.mouth-ooh');

      this.accessoryShades = document.querySelector('.accessory-shades');
      this.accessoryPartyHat = document.querySelector('.accessory-party-hat');

      this.bubbleTimer = null;
      this.pokeIndex = 0;
      this.pokeQuotes = [
        "Hi Mohima! That tickles! ✨",
        "Don't worry Mohima, you're doing great! 🌟",
        "Curiosity looks good on you, Mohima! ⏳",
        "I'm Cosmo! Nice to meet you, Mohima! 😊",
        "Psst... tap the answers! 👀"
      ];

      this.initEvents();
    }

    initEvents() {
      if (!this.wrapper) return;
      this.wrapper.addEventListener('click', () => this.handlePoke());
      this.wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handlePoke();
        }
      });
    }

    handlePoke() {
      ensureAudio();
      sound.playSelectAnswer();
      this.setHappy();
      this.bounce();

      const quote = this.pokeQuotes[this.pokeIndex % this.pokeQuotes.length];
      this.pokeIndex++;
      this.say(quote, 2400);
    }

    bounce() {
      if (!this.wrapper) return;
      this.wrapper.classList.remove('mascot-bounce', 'mascot-spin');
      void this.wrapper.offsetWidth;
      this.wrapper.classList.add('mascot-bounce');
    }

    spin() {
      if (!this.wrapper) return;
      this.wrapper.classList.remove('mascot-bounce', 'mascot-spin');
      void this.wrapper.offsetWidth;
      this.wrapper.classList.add('mascot-spin');
    }

    resetFeatures() {
      [this.eyesNormal, this.eyesHappy, this.eyesSleepy, this.eyesWink].forEach((el) => {
        if (el) el.classList.add('hidden');
      });
      [this.mouthSmile, this.mouthOpen, this.mouthOoh].forEach((el) => {
        if (el) el.classList.add('hidden');
      });
      [this.accessoryShades, this.accessoryPartyHat].forEach((el) => {
        if (el) el.classList.add('hidden');
      });
    }

    setIdle() {
      this.resetFeatures();
      if (this.eyesNormal) this.eyesNormal.classList.remove('hidden');
      if (this.mouthSmile) this.mouthSmile.classList.remove('hidden');
    }

    setHappy() {
      this.resetFeatures();
      if (this.eyesHappy) this.eyesHappy.classList.remove('hidden');
      if (this.mouthOpen) this.mouthOpen.classList.remove('hidden');
    }

    setCool() {
      this.resetFeatures();
      if (this.eyesNormal) this.eyesNormal.classList.remove('hidden');
      if (this.mouthSmile) this.mouthSmile.classList.remove('hidden');
      if (this.accessoryShades) this.accessoryShades.classList.remove('hidden');
    }

    setSleepy() {
      this.resetFeatures();
      if (this.eyesSleepy) this.eyesSleepy.classList.remove('hidden');
      if (this.mouthOoh) this.mouthOoh.classList.remove('hidden');
    }

    setWink() {
      this.resetFeatures();
      if (this.eyesWink) this.eyesWink.classList.remove('hidden');
      if (this.mouthSmile) this.mouthSmile.classList.remove('hidden');
    }

    setParty() {
      this.resetFeatures();
      if (this.eyesHappy) this.eyesHappy.classList.remove('hidden');
      if (this.mouthOpen) this.mouthOpen.classList.remove('hidden');
      if (this.accessoryPartyHat) this.accessoryPartyHat.classList.remove('hidden');
    }

    say(text, duration = 3000) {
      if (!this.bubble || !this.bubbleText) return;
      if (this.bubbleTimer) clearTimeout(this.bubbleTimer);

      this.bubbleText.textContent = text;
      this.bubble.classList.remove('hidden');

      this.bubbleTimer = setTimeout(() => {
        this.bubble.classList.add('hidden');
      }, duration);
    }
  }

  // --------------------------------------------------------------------------
  // 7. SCREEN MANAGER & INTERACTIONS
  // --------------------------------------------------------------------------
  let mascot;
  let confetti;

  function ensureAudio() {
    if (!state.audioInitialized) {
      sound.init();
      state.audioInitialized = true;
      const audioPrompt = document.getElementById('audio-prompt');
      if (audioPrompt) audioPrompt.classList.add('hidden');
    } else {
      sound.resume();
    }
  }

  function updateProgressBar(step) {
    const progressStep = parseInt(step, 10);
    const dots = document.querySelectorAll('.step-dot');
    const connectors = document.querySelectorAll('.step-connector');

    dots.forEach((dot) => {
      const s = parseInt(dot.getAttribute('data-step'), 10);
      dot.classList.remove('active', 'completed');
      if (s === progressStep) {
        dot.classList.add('active');
      } else if (s < progressStep) {
        dot.classList.add('completed');
      }
    });

    connectors.forEach((conn, index) => {
      conn.classList.remove('completed');
      if (index < progressStep - 1) {
        conn.classList.add('completed');
      }
    });

    const progressContainer = document.querySelector('.progress-bar-container');
    if (progressContainer) {
      progressContainer.setAttribute('aria-valuenow', progressStep);
    }
  }

  function navigateToScreen(targetScreen) {
    if (targetScreen === state.currentScreen) return;

    sound.playScreenTransition();

    const currentEl = document.getElementById(`screen-${state.currentScreen}`);
    const nextEl = document.getElementById(`screen-${targetScreen}`);

    if (currentEl) {
      currentEl.classList.remove('screen-active');
      currentEl.classList.add('screen-hidden');
    }

    if (nextEl) {
      nextEl.classList.remove('screen-hidden');
      nextEl.classList.add('screen-active');
    }

    state.currentScreen = targetScreen;
    updateProgressBar(targetScreen);

    // Mascot contextual speech
    if (targetScreen === 2) {
      mascot.setIdle();
      mascot.say("Be honest now! 😉", 2800);
    } else if (targetScreen === 3) {
      mascot.setWink();
      mascot.say("Free day mode! 🎈", 2800);
    } else if (targetScreen === 4) {
      mascot.setCool();
      mascot.say("Choose your superpower! ⚡", 2800);
    } else if (targetScreen === 5) {
      mascot.setHappy();
      mascot.bounce();
      mascot.say("Analyzing your aura... 🔮", 3000);
    } else if (targetScreen === 6) {
      mascot.setIdle();
      mascot.say("Special delivery! 💌", 3000);
    } else if (targetScreen === 7) {
      mascot.setParty();
      mascot.bounce();
      mascot.say("Moment of truth! ✨", 3000);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Animate score counter numbers and fill progress bars
  function animateScore(valElId, fillElId, targetVal, duration = 1100) {
    const valEl = document.getElementById(valElId);
    const fillEl = document.getElementById(fillElId);
    if (!valEl || !fillEl) return;

    fillEl.style.width = '0%';
    valEl.textContent = '0%';

    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.floor(easeProgress * targetVal);

      valEl.textContent = `${currentScore}%`;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        valEl.textContent = `${targetVal}%`;
      }
    }

    setTimeout(() => {
      fillEl.style.width = `${targetVal}%`;
      requestAnimationFrame(updateCounter);
    }, 150);
  }

  function renderVibeReport() {
    const q1 = state.freeDay || 'explorer';
    const q2 = state.superpower || 'teleport';

    const profile = (vibeProfiles[q1] && vibeProfiles[q1][q2])
      ? vibeProfiles[q1][q2]
      : vibeProfiles.explorer.teleport;

    state.vibeResult = profile;

    const titleEl = document.getElementById('vibe-profile-title');
    const descEl = document.getElementById('vibe-profile-desc');

    if (titleEl) titleEl.textContent = profile.title;
    if (descEl) descEl.textContent = profile.desc;

    // Trigger sound & confetti
    sound.playResultReveal();
    confetti.launch(50);

    // Animate score bars
    animateScore('val-adventure', 'fill-adventure', profile.adventure);
    animateScore('val-curiosity', 'fill-curiosity', profile.curiosity);
    animateScore('val-relaxation', 'fill-relaxation', profile.relaxation);
    animateScore('val-mystery', 'fill-mystery', profile.mystery);
  }

  // --------------------------------------------------------------------------
  // 8. EVENT WIRING & LOGIC
  // --------------------------------------------------------------------------
  function setupApp() {
    mascot = new MascotController();
    confetti = new ConfettiEngine('confetti-canvas');
    new AmbientParticleBackground('bg-canvas');

    // Setup Hover Sound for buttons
    const interactiveElements = document.querySelectorAll('button, .option-card, .envelope-wrapper');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', () => sound.playHover());
    });

    // ------------------------------------------------------------------------
    // Header & Sound Toggle
    // ------------------------------------------------------------------------
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        ensureAudio();
        state.soundEnabled = !state.soundEnabled;
        sound.setMuted(!state.soundEnabled);

        const speakerIcon = soundBtn.querySelector('.speaker-icon');
        const muteIcon = soundBtn.querySelector('.speaker-mute-icon');

        if (state.soundEnabled) {
          soundBtn.classList.remove('is-muted');
          soundBtn.title = "Sound: ON (Click to mute)";
          if (speakerIcon) speakerIcon.classList.remove('hidden');
          if (muteIcon) muteIcon.classList.add('hidden');
          sound.playButtonClick();
        } else {
          soundBtn.classList.add('is-muted');
          soundBtn.title = "Sound: MUTED (Click to unmute)";
          if (speakerIcon) speakerIcon.classList.add('hidden');
          if (muteIcon) muteIcon.classList.remove('hidden');
        }
      });
    }

    // ------------------------------------------------------------------------
    // Screen 1: The Mysterious Introduction
    // ------------------------------------------------------------------------
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();
        mascot.setHappy();
        mascot.bounce();

        setTimeout(() => {
          sound.playWelcome();
        }, 150);

        setTimeout(() => {
          navigateToScreen(2);
        }, 400);
      });
    }

    // ------------------------------------------------------------------------
    // Screen 2: The Mood Detector & Annoy Alert Modal
    // ------------------------------------------------------------------------
    const moodCards = document.querySelectorAll('.mood-grid .option-card');
    const moodReactionBox = document.getElementById('mood-reaction-box');
    const moodReactionText = document.getElementById('mood-reaction-text');
    const btnNextMood = document.getElementById('btn-next-mood');

    const annoyModal = document.getElementById('annoy-modal');
    const btnAnnoyDismiss = document.getElementById('btn-annoy-dismiss');
    const btnAnnoyClose = document.getElementById('btn-annoy-close');
    const annoyBackdrop = document.getElementById('annoy-backdrop');

    function closeAnnoyModal() {
      if (annoyModal) {
        annoyModal.classList.add('hidden');
      }
    }

    if (btnAnnoyDismiss) {
      btnAnnoyDismiss.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();
        closeAnnoyModal();
      });
    }

    if (btnAnnoyClose) {
      btnAnnoyClose.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();
        closeAnnoyModal();
      });
    }

    if (annoyBackdrop) {
      annoyBackdrop.addEventListener('click', () => {
        closeAnnoyModal();
      });
    }

    const moodResponses = {
      fabulous: "Main character energy detected. Respect. ✨",
      sleep: "System diagnosis: Sleep is urgently required. 😂",
      annoy: "Understood. Activating peaceful mode immediately. 🫡",
      entertainment: "Excellent. You've come to the right place. 😂"
    };

    moodCards.forEach((card) => {
      card.addEventListener('click', () => {
        ensureAudio();
        const moodKey = card.getAttribute('data-mood');

        // Playful refusal if user clicks "Don't annoy me"
        if (moodKey === 'annoy') {
          sound.playDenied();

          card.classList.remove('selected');
          card.setAttribute('aria-checked', 'false');
          card.classList.add('card-shake');
          setTimeout(() => card.classList.remove('card-shake'), 600);

          if (annoyModal) {
            annoyModal.classList.remove('hidden');
          }

          mascot.setWink();
          mascot.bounce();
          mascot.say("Nope! That one is banned! 😜", 3200);

          if (!state.mood || state.mood === 'annoy') {
            state.mood = null;
            if (moodReactionBox) moodReactionBox.classList.add('hidden');
            if (btnNextMood) btnNextMood.classList.add('hidden');
          }
          return;
        }

        sound.playSelectAnswer();
        state.mood = moodKey;

        moodCards.forEach((c) => {
          c.classList.remove('selected');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');

        if (moodReactionText && moodReactionBox) {
          moodReactionText.textContent = moodResponses[moodKey];
          moodReactionBox.classList.remove('hidden');
        }

        if (btnNextMood) {
          btnNextMood.classList.remove('hidden');
        }

        if (moodKey === 'fabulous') {
          mascot.setCool();
          mascot.bounce();
          mascot.say("Looking fabulous! 😎", 2500);
        } else if (moodKey === 'sleep') {
          mascot.setSleepy();
          mascot.say("Zzz... Nap time! 😴", 2500);
        } else if (moodKey === 'entertainment') {
          mascot.setHappy();
          mascot.bounce();
          mascot.say("Get ready for the show! 🍿", 2500);
        }
      });
    });

    if (btnNextMood) {
      btnNextMood.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();
        navigateToScreen(3);
      });
    }

    // ------------------------------------------------------------------------
    // Screen 3: Question 1 — The Free Day Challenge
    // ------------------------------------------------------------------------
    const freedayCards = document.querySelectorAll('.challenge-grid .option-card');
    const freedayReactionBox = document.getElementById('freeday-reaction-box');
    const freedayReactionText = document.getElementById('freeday-reaction-text');
    const btnNextFreeday = document.getElementById('btn-next-freeday');

    const freedayResponses = {
      explorer: "Curiosity level: dangerously high. 🌍",
      comfort: "Professional relaxation specialist detected. 😂",
      spontaneous: "Even you don't know what you'll do next. 😭",
      planner: "You probably have a backup plan for your backup plan. 😂"
    };

    freedayCards.forEach((card) => {
      card.addEventListener('click', () => {
        ensureAudio();
        sound.playSelectAnswer();

        const key = card.getAttribute('data-freeday');
        state.freeDay = key;

        freedayCards.forEach((c) => {
          c.classList.remove('selected');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');

        if (freedayReactionText && freedayReactionBox) {
          freedayReactionText.textContent = freedayResponses[key];
          freedayReactionBox.classList.remove('hidden');
        }

        if (btnNextFreeday) {
          btnNextFreeday.classList.remove('hidden');
        }

        if (key === 'explorer') {
          mascot.setCool();
          mascot.bounce();
          mascot.say("Adventure awaits! 🌍", 2500);
        } else if (key === 'comfort') {
          mascot.setSleepy();
          mascot.say("Blankets & snacks! 🍿", 2500);
        } else if (key === 'spontaneous') {
          mascot.setHappy();
          mascot.bounce();
          mascot.say("Chaos mode! 🎉", 2500);
        } else if (key === 'planner') {
          mascot.setWink();
          mascot.say("Calculated precision! 🧠", 2500);
        }
      });
    });

    if (btnNextFreeday) {
      btnNextFreeday.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();
        navigateToScreen(4);
      });
    }

    // ------------------------------------------------------------------------
    // Screen 4: Question 2 — The Superpower Challenge
    // ------------------------------------------------------------------------
    const powerCards = document.querySelectorAll('.power-grid .option-card');
    const powerReactionBox = document.getElementById('power-reaction-box');
    const powerReactionText = document.getElementById('power-reaction-text');
    const btnNextPower = document.getElementById('btn-next-power');

    const powerResponses = {
      minds: "Interesting... privacy might become a problem. 😂",
      time: "Someone definitely wants extra sleeping time. 😭",
      teleport: "No traffic, no waiting, no airport queues. Genius!",
      future: "Spoilers for your own life? Risky business. 😂"
    };

    powerCards.forEach((card) => {
      card.addEventListener('click', () => {
        ensureAudio();
        sound.playSelectAnswer();

        const key = card.getAttribute('data-power');
        state.superpower = key;

        powerCards.forEach((c) => {
          c.classList.remove('selected');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');

        if (powerReactionText && powerReactionBox) {
          powerReactionText.textContent = powerResponses[key];
          powerReactionBox.classList.remove('hidden');
        }

        if (btnNextPower) {
          btnNextPower.classList.remove('hidden');
        }

        if (key === 'minds') {
          mascot.setWink();
          mascot.say("Mind reader detected! 🧠", 2500);
        } else if (key === 'time') {
          mascot.setSleepy();
          mascot.say("Freeze time! ⏳", 2500);
        } else if (key === 'teleport') {
          mascot.setHappy();
          mascot.bounce();
          mascot.say("Poof! You're there! ✨", 2500);
        } else if (key === 'future') {
          mascot.setCool();
          mascot.say("Future vision active! 🔮", 2500);
        }
      });
    });

    if (btnNextPower) {
      btnNextPower.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();
        navigateToScreen(5);
        renderVibeReport();
      });
    }

    // ------------------------------------------------------------------------
    // Screen 5: The Personality Result (Your Official Vibe Report)
    // ------------------------------------------------------------------------
    const btnVibeContinue = document.getElementById('btn-vibe-continue');
    const btnMemorableContinue = document.getElementById('btn-memorable-continue');
    const memorableCards = document.querySelectorAll('.memorable-options .option-card');
    memorableCards.forEach((card) => {
      card.addEventListener('click', () => {
        ensureAudio();
        sound.playSelectAnswer();
        state.memorableAnswer = card.getAttribute('data-memorable');
        memorableCards.forEach((option) => {
          const selected = option === card;
          option.classList.toggle('selected', selected);
          option.setAttribute('aria-checked', selected ? 'true' : 'false');
        });
        if (btnMemorableContinue) btnMemorableContinue.classList.remove('hidden');
      });
    });

    if (btnVibeContinue) {
      btnVibeContinue.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();
        navigateToScreen('5-question');
      });
    }

    if (btnMemorableContinue) {
      btnMemorableContinue.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();
        navigateToScreen(6);
      });
    }

    // ------------------------------------------------------------------------
    // Screen 6: The Actual Reason (Envelope & Letter)
    // ------------------------------------------------------------------------
    const envelopeWrapper = document.getElementById('envelope-interactive');
    const envelopeFlap = document.getElementById('envelope-flap');
    const waxSeal = document.getElementById('wax-seal');
    const letterSheet = document.getElementById('letter-sheet');
    const envelopeHint = document.getElementById('envelope-hint');
    const letterModal = document.getElementById('letter-modal');
    const btnLetterContinue = document.getElementById('btn-letter-continue');
    const btnNextEnvelope = document.getElementById('btn-next-envelope');
    const btnLetterClose = document.getElementById('btn-letter-close');
    const modalBackdrop = document.getElementById('modal-backdrop');

    function closeLetterModal() {
      if (letterModal) letterModal.classList.add('hidden');
    }

    function openEnvelope() {
      if (state.isEnvelopeOpened) {
        if (letterModal) letterModal.classList.remove('hidden');
        return;
      }

      ensureAudio();
      state.isEnvelopeOpened = true;

      sound.playEnvelopeOpen();

      if (waxSeal) waxSeal.classList.add('broken');
      if (envelopeFlap) envelopeFlap.classList.add('opened');
      if (envelopeHint) envelopeHint.classList.add('hidden');

      setTimeout(() => {
        if (letterSheet) letterSheet.classList.add('slid-out');
        mascot.setHappy();
        mascot.bounce();
        confetti.launch(40);
      }, 350);

      setTimeout(() => {
        sound.playMessageReveal();
        if (letterModal) letterModal.classList.remove('hidden');
        if (btnNextEnvelope) btnNextEnvelope.classList.remove('hidden');
        mascot.say("Hope this made you smile 🌸", 3500);
      }, 1000);
    }

    if (envelopeWrapper) {
      envelopeWrapper.addEventListener('click', openEnvelope);
      envelopeWrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEnvelope();
        }
      });
    }

    if (waxSeal) {
      waxSeal.addEventListener('click', (e) => {
        e.stopPropagation();
        openEnvelope();
      });
    }

    if (btnLetterClose) {
      btnLetterClose.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();
        closeLetterModal();
      });
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', () => {
        closeLetterModal();
      });
    }

    if (btnLetterContinue) {
      btnLetterContinue.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();
        closeLetterModal();
        navigateToScreen(7);
      });
    }

    if (btnNextEnvelope) {
      btnNextEnvelope.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();
        closeLetterModal();
        navigateToScreen(7);
      });
    }

    // Global Escape key to dismiss any open modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (annoyModal && !annoyModal.classList.contains('hidden')) {
          closeAnnoyModal();
        } else if (letterModal && !letterModal.classList.contains('hidden')) {
          closeLetterModal();
        }
      }
    });

    // ------------------------------------------------------------------------
    // Screen 7: The Final Experiment & Optional Sharing
    // ------------------------------------------------------------------------
    const finalCards = document.querySelectorAll('.final-options-group .option-card');
    const finalOutcomeBox = document.getElementById('final-outcome-box');
    const outcomeMessageText = document.getElementById('outcome-message-text');
    const outcomeIcon = document.getElementById('outcome-icon');
    const btnRestart = document.getElementById('btn-restart');

    const creatorShareZone = document.getElementById('creator-share-zone');
    const shareStatus = document.getElementById('share-status');
    const shareRetryButton = document.getElementById('btn-share-retry');

    // Only show sharing zone if GOOGLE_SCRIPT_URL is configured
    if (creatorShareZone) {
      if (typeof GOOGLE_SCRIPT_URL === 'string' && GOOGLE_SCRIPT_URL.trim() !== '') {
        creatorShareZone.classList.remove('hidden');
      } else {
        creatorShareZone.classList.add('hidden');
      }
    }

    function setSubmissionStatus(status, message) {
      state.submissionStatus = status;
      if (finalCards) finalCards.forEach((card) => { card.disabled = status === 'submitting' || status === 'success'; });
      if (status === 'success') {
        if (shareStatus) {
          shareStatus.textContent = '';
          shareStatus.classList.add('hidden');
        }
      } else if (shareStatus) {
        shareStatus.textContent = message || (status === 'submitting' ? 'Sending your response…' : '');
        shareStatus.className = 'share-status-pill' + (status === 'error' ? ' is-error' : '');
        shareStatus.classList.remove('hidden');
      }
      if (shareRetryButton) shareRetryButton.classList.toggle('hidden', status !== 'error');
    }

    async function submitResponses() {
      if (state.submissionStatus === 'submitting' || state.submissionStatus === 'success') return;
      if (!GOOGLE_SCRIPT_URL || !state.mood || !state.freeDay || !state.superpower || !state.vibeResult || !state.memorableAnswer || !state.finalAnswer) {
        setSubmissionStatus('error', 'Could not send the response. Please check the service configuration and try again.');
        return;
      }

      const moodLabels = {
        fabulous: '😎 Absolutely fabulous',
        sleep: '😴 Need more sleep',
        annoy: '😒 Don\'t annoy me',
        entertainment: '😂 Here for the entertainment'
      };
      const finalLabels = {
        smile: '😂 Yes, a little!',
        notbad: '🙂 Not bad!',
        weird: '🤨 You\'re weird!'
      };
      const memorableLabels = {
        talkative: 'Someone who talks a lot.',
        laugh: 'Someone who makes you laugh.',
        details: 'Someone who remembers little things.',
        website: 'Someone who builds an entire website for you. 😂'
      };
      const payload = {
        timestamp: new Date().toISOString(),
        mood: moodLabels[state.mood] || state.mood,
        question1: freedayLabels[state.freeDay],
        question2: powerLabels[state.superpower],
        vibeProfile: state.vibeResult.title,
        adventureScore: state.vibeResult.adventure,
        curiosityScore: state.vibeResult.curiosity,
        relaxationScore: state.vibeResult.relaxation,
        mysteryScore: state.vibeResult.mystery,
        finalVerdict: finalLabels[state.finalAnswer] || state.finalAnswer,
        memorableAnswer: memorableLabels[state.memorableAnswer] || state.memorableAnswer
      };

      setSubmissionStatus('submitting');
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('The server returned an unsuccessful response.');
        const result = await response.json();
        if (!result || result.status !== 'success') throw new Error('The server did not confirm the save.');
        // Success is intentionally silent in the visitor interface.
        setSubmissionStatus('success');
      } catch (error) {
        // Apps Script redirects can block readable responses under browser CORS rules.
        setSubmissionStatus('error', 'Could not confirm the response. It may still be saved; check the Sheet before retrying.');
      }
    }

    if (shareRetryButton) shareRetryButton.addEventListener('click', submitResponses);

    const finalResponses = {
      smile: {
        text: "SUCCESS! A smile has officially been detected. Mission accomplished. 🎉",
        icon: "🎉"
      },
      notbad: {
        text: "Not bad? I'll accept that. Room for improvement! 😎",
        icon: "😎"
      },
      weird: {
        text: "Fair enough. But if you like this then it's totally worth it! ",
        icon: "👽"
      }
    };

    finalCards.forEach((card) => {
      card.addEventListener('click', () => {
        ensureAudio();

        const answerKey = card.getAttribute('data-final');
        state.finalAnswer = answerKey;

        finalCards.forEach((c) => {
          c.classList.remove('selected');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');

        sound.playCelebration();

        confetti.launch(110);
        setTimeout(() => confetti.launch(70), 300);

        mascot.setParty();
        mascot.spin();

        const config = finalResponses[answerKey];
        if (outcomeMessageText && outcomeIcon && finalOutcomeBox) {
          outcomeMessageText.textContent = config.text;
          outcomeIcon.textContent = config.icon;
          finalOutcomeBox.classList.remove('hidden');
        }

        if (answerKey === 'smile') {
          mascot.say("MISSION COMPLETE! 🌟", 4000);
        } else if (answerKey === 'notbad') {
          mascot.say("I'll take the win! 😎", 4000);
        } else {
          mascot.say("Proudly weird! 😂", 4000);
        }

        // Mark all progress steps completed
        const dots = document.querySelectorAll('.step-dot');
        const connectors = document.querySelectorAll('.step-connector');
        dots.forEach((dot) => dot.classList.add('completed'));
        connectors.forEach((conn) => conn.classList.add('completed'));

        submitResponses();
      });
    });

    // ------------------------------------------------------------------------
    // Restart Flow
    // ------------------------------------------------------------------------
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        ensureAudio();
        sound.playButtonClick();

        state.mood = null;
        state.freeDay = null;
        state.superpower = null;
        state.vibeResult = null;
        state.memorableAnswer = null;
        state.finalAnswer = null;
        state.isEnvelopeOpened = false;
        state.submissionStatus = 'idle';

        document.querySelectorAll('.option-card').forEach((c) => {
          c.classList.remove('selected');
          c.setAttribute('aria-checked', 'false');
        });

        if (moodReactionBox) moodReactionBox.classList.add('hidden');
        if (btnNextMood) btnNextMood.classList.add('hidden');

        if (freedayReactionBox) freedayReactionBox.classList.add('hidden');
        if (btnNextFreeday) btnNextFreeday.classList.add('hidden');

        if (powerReactionBox) powerReactionBox.classList.add('hidden');
        if (btnNextPower) btnNextPower.classList.add('hidden');
        if (btnMemorableContinue) btnMemorableContinue.classList.add('hidden');

        if (waxSeal) waxSeal.classList.remove('broken');
        if (envelopeFlap) envelopeFlap.classList.remove('opened');
        if (letterSheet) letterSheet.classList.remove('slid-out');
        if (envelopeHint) envelopeHint.classList.remove('hidden');
        if (annoyModal) annoyModal.classList.add('hidden');
        if (letterModal) letterModal.classList.add('hidden');
        if (btnNextEnvelope) btnNextEnvelope.classList.add('hidden');

        if (finalOutcomeBox) finalOutcomeBox.classList.add('hidden');

        if (shareStatus) { shareStatus.classList.add('hidden'); shareStatus.textContent = ''; }
        if (shareRetryButton) shareRetryButton.classList.add('hidden');
        finalCards.forEach((card) => { card.disabled = false; });

        mascot.setIdle();
        mascot.say("Ready for another round! ✨", 2500);

        navigateToScreen(1);
      });
    }

    // First user gesture listener on window for audio unlock
    const unlockAudio = () => {
      ensureAudio();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
  }

  // --------------------------------------------------------------------------
  // 9. BOOTSTRAP ON DOM READY
  // --------------------------------------------------------------------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupApp);
  } else {
    setupApp();
  }
})();
