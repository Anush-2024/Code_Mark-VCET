// FSK Tone Generation with Web Audio API

// Frequency map
const SYMBOL_FREQS = [900, 1050, 1200, 1350, 1500, 1650, 1800, 1950]; // symbols 0–7
const START_FREQ = 2700;
const END_FREQ = 2900;
const PARITY_FREQ = 2550;

// Timing constraints
const TONE_DURATION = 0.08;
const GAP_DURATION = 0.02;
const FADE_TIME = 0.005;
const GAIN = 0.95;

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playTone(ctx, freq, startTime) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;

  // Enveloping to prevent clicks
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(GAIN, startTime + FADE_TIME);
  gainNode.gain.setValueAtTime(GAIN, startTime + TONE_DURATION - FADE_TIME);
  gainNode.gain.linearRampToValueAtTime(0, startTime + TONE_DURATION);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + TONE_DURATION);
}

export function getBroadcastDurationMs(payloadLength) {
  // 1 START + (payloadLength * 2) symbols + 1 PARITY_MARKER + 2 PARITY_SYMBOLS + 1 END
  const totalTones = 1 + (payloadLength * 2) + 1 + 2 + 1;
  const timePerToneAndGap = TONE_DURATION + GAP_DURATION;
  return (totalTones * timePerToneAndGap * 1000) + 100; // adding 100ms buffer
}

export async function broadcastPayload(payloadString, onProgress) {
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  console.log('[Encoder] AudioContext state:', ctx.state);
  
  let time = ctx.currentTime + 0.1; // Start slighty in the future
  
  const stepTime = TONE_DURATION + GAP_DURATION;
  let toneIndex = 0;
  
  const allFreqs = [];
  const scheduleTone = (freq) => {
    allFreqs.push(freq);
    playTone(ctx, freq, time);
    time += stepTime;
    toneIndex++;
  };

  // 1. START TONE
  scheduleTone(START_FREQ);

  // 2. DATA TONES
  let xorSum = 0;
  for (let i = 0; i < payloadString.length; i++) {
    const charCode = payloadString.charCodeAt(i) - 48;
    const upper = (charCode >> 3) & 0b111;
    const lower = charCode & 0b111;
    
    scheduleTone(SYMBOL_FREQS[upper]);
    scheduleTone(SYMBOL_FREQS[lower]);
    
    xorSum ^= upper;
    xorSum ^= lower;
  }

  // 3. PARITY TONES
  scheduleTone(PARITY_FREQ);
  
  const parityUpper = (xorSum >> 3) & 0b111;
  const parityLower = xorSum & 0b111;
  
  scheduleTone(SYMBOL_FREQS[parityUpper]);
  scheduleTone(SYMBOL_FREQS[parityLower]);

  // 4. END TONE
  scheduleTone(END_FREQ);

  console.log('[Encoder] broadcasting sequence:', allFreqs);

  const durationMs = getBroadcastDurationMs(payloadString.length);
  
  return new Promise((resolve) => {
    let startProgress = performance.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = performance.now() - startProgress;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      if (onProgress) onProgress(progress);
      
      if (elapsed >= durationMs) {
        clearInterval(progressInterval);
        resolve();
      }
    }, 50);
  });
}

// CSMA Backoff: Check if channel is clear before broadcasting
async function isChannelClear() {
  return true; // Bypass CSMA backoff for instant demo recognition
}

const PAUSE_BETWEEN_CYCLES_MS = 200;

export function startBroadcasting(payloadString, onCycle) {
  let isRunning = true;
  let cycleCount = 0;

  const loop = async () => {
    if (!isRunning) return;

    if (getAudioContext().state === 'suspended') {
      await getAudioContext().resume();
    }

    // CSMA backoff logic
    const clear = await isChannelClear();
    if (!clear) {
      // Wait random 150-600ms
      const backoffMs = Math.floor(Math.random() * (600 - 150 + 1) + 150);
      setTimeout(loop, backoffMs);
      return;
    }

    if (!isRunning) return;
    
    cycleCount++;
    if (onCycle) onCycle(cycleCount);
    
    await broadcastPayload(payloadString);
    
    if (isRunning) {
      setTimeout(loop, PAUSE_BETWEEN_CYCLES_MS);
    }
  };

  loop();

  return {
    stop: () => {
      isRunning = false;
    }
  };
}
