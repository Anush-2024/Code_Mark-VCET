import { validatePayload } from './crypto.js';

export let SKIP_CRYPTO_FOR_DEMO = true; // toggle from App.jsx for production

const FFT_SIZE = 4096;
const SMOOTHING = 0.0;
const POLL_INTERVAL_MS = 10;
const MIN_CONSECUTIVE = 2;
const COMMIT_TIME_MS = 25;
const REPEAT_TIME_MS = 70;
const FREQ_TOLERANCE_HZ = 110;
const MIN_SIGNAL_DB = -65;
const SEARCH_MIN_HZ = 800;
const SEARCH_MAX_HZ = 3100;

const SYMBOL_FREQS = [900, 1050, 1200, 1350, 1500, 1650, 1800, 1950];
const START_FREQ = 2700;
const END_FREQ = 2900;
const PARITY_FREQ = 2550;

function matchFrequency(hz) {
  const allFreqs = [
    { label: 'START', freq: START_FREQ },
    { label: 'END', freq: END_FREQ },
    { label: 'PARITY', freq: PARITY_FREQ },
    ...SYMBOL_FREQS.map((f, i) => ({ label: i, freq: f }))
  ];

  let bestLabel = null;
  let bestDist = Infinity;

  for (const { label, freq } of allFreqs) {
    const dist = Math.abs(hz - freq);
    if (dist < bestDist) {
      bestDist = dist;
      bestLabel = label;
    }
  }

  return bestDist <= FREQ_TOLERANCE_HZ ? bestLabel : null;
}

export function startListening(onPayload, onStatus, onSignalLevel) {
  let isRunning = true;
  let audioContext = null;
  let mediaStream = null;
  let analyser = null;
  let timerId = null;

  // State Machine
  let state = 'IDLE'; // IDLE, COLLECTING, PARITY_WAIT, DONE
  let collectedSymbols = [];
  let paritySymbols = [];
  
  let lastSymbol = null;
  let consecutiveCount = 0;
  let lastCommitted = null;
  let firstDetectionTime = 0;
  let pollCount = 0;

  let crowdedFailures = 0;

  const resetState = () => {
    state = 'IDLE';
    collectedSymbols = [];
    paritySymbols = [];
    lastSymbol = null;
    consecutiveCount = 0;
    lastCommitted = null;
    firstDetectionTime = 0;
    onStatus('listening');
  };

  const initAudio = async () => {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation:   false,
          noiseSuppression:   false,
          autoGainControl:    false,
          channelCount:       1,
          sampleRate:         { ideal: 44100 }
        }
      });
      const track = mediaStream.getAudioTracks()[0];
      const settings = track.getSettings();
      console.log('[Decoder] mic settings:', settings);

      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      console.log('[Decoder] actual sample rate:', sampleRate);
      
      const source = audioContext.createMediaStreamSource(mediaStream);
      analyser = audioContext.createAnalyser();
      
      analyser.fftSize = FFT_SIZE;
      console.log('[Decoder] actual fftSize:', analyser.fftSize);
      analyser.smoothingTimeConstant = SMOOTHING;
      source.connect(analyser);
      
      onStatus('listening');
      pollLoop();
    } catch (err) {
      console.error('[Decoder] mic error:', err.name, err.message);
      onStatus('error');
    }
  };

  const processSymbol = (sym) => {
    console.log('[Decoder] state:', state, '| committed:', sym, '| collected:', collectedSymbols.length);
    if (state === 'IDLE') {
      if (sym === 'START') {
        state = 'COLLECTING';
        onStatus('receiving');
      }
    } else if (state === 'COLLECTING') {
      if (sym === 'PARITY') {
        state = 'PARITY_WAIT';
      } else if (typeof sym === 'number') {
        collectedSymbols.push(sym);
        if (SKIP_CRYPTO_FOR_DEMO && collectedSymbols.length === 18) {
           // We have 18 symbols = 9 chars (Version + SENDER_ID)
           state = 'DONE';
           finalizePayload();
        }
      } else if (sym === 'END') {
        resetState();
      }
    } else if (state === 'PARITY_WAIT') {
      if (typeof sym === 'number') {
        paritySymbols.push(sym);
      } else if (sym === 'END') {
        state = 'DONE';
        finalizePayload();
      }
    }
  };

  const finalizePayload = async () => {
    // Bypass parity/length constraints for instant recognition
    let payloadString = '';
    for (let i = 0; i < collectedSymbols.length - 1; i += 2) {
      const upper = collectedSymbols[i];
      const lower = collectedSymbols[i+1];
      const charCode = ((upper << 3) | lower) + 48;
      payloadString += String.fromCharCode(charCode);
    }

    console.log('[Decoder] payload received:', payloadString);
    console.log('[Decoder] raw payload:', payloadString, '| length:', payloadString.length);

    if (SKIP_CRYPTO_FOR_DEMO) {
      if (payloadString.length >= 9 && payloadString.startsWith('1')) {
        onStatus('done');
        onPayload(payloadString, {
          valid: true,
          senderUUID: payloadString.substring(1, 9),
          raw: payloadString
        });
        setTimeout(resetState, 1000);
      } else {
        // Garbage or misaligned reading. Silently reset and try next cycle.
        resetState();
      }
      return;
    }

    const validation = await validatePayload(payloadString);
    if (validation.valid) {
      crowdedFailures = 0;
      onStatus('done');
      onPayload(payloadString, validation);
      setTimeout(resetState, 2000);
    } else {
      console.log('[Decoder] payload rejected:', payloadString);
      crowdedFailures++;
      checkCrowded();
      setTimeout(resetState, 2000);
    }
  };

  const checkCrowded = () => {
    if (crowdedFailures >= 5) {
      onStatus('crowded');
    }
  };

  const pollLoop = () => {
    if (!isRunning || !analyser || !audioContext) return;

    pollCount++;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatFrequencyData(dataArray);

    const binSize = audioContext.sampleRate / analyser.fftSize;
    const minBin = Math.floor(SEARCH_MIN_HZ / binSize);
    const maxBin = Math.floor(SEARCH_MAX_HZ / binSize);

    let maxEnergy = -Infinity;
    let maxIndex = -1;

    for (let i = minBin; i <= maxBin; i++) {
      if (i >= 0 && i < bufferLength) {
        if (dataArray[i] > maxEnergy) {
          maxEnergy = dataArray[i];
          maxIndex = i;
        }
      }
    }

    if (onSignalLevel) {
      onSignalLevel(maxEnergy);
    }

    if (maxEnergy >= MIN_SIGNAL_DB) {
      const domFreq = maxIndex * binSize;
      
      if (pollCount % 10 === 0) {
        console.log('[Decoder] dominant freq:', domFreq.toFixed(0), 'Hz | dB:', maxEnergy.toFixed(1));
      }

      const sym = matchFrequency(domFreq);

      if (sym !== null) {
        console.log('[Decoder] matched symbol:', sym, 'from freq:', domFreq.toFixed(0));

        if (sym === lastSymbol) {
          consecutiveCount++;
          const elapsed = Date.now() - firstDetectionTime;
          
          if (consecutiveCount >= MIN_CONSECUTIVE || elapsed >= COMMIT_TIME_MS) {
            if (sym !== lastCommitted) {
              lastCommitted = sym;
              processSymbol(sym);
            } else if (elapsed > REPEAT_TIME_MS) {
              // The same symbol has played long enough to be TWO distinct symbols
              // (meaning we missed the gap). Commit it again.
              lastCommitted = sym;
              processSymbol(sym);
              firstDetectionTime = Date.now(); // reset timer
              consecutiveCount = 1;
            }
          }
        } else {
          lastSymbol = sym;
          consecutiveCount = 1;
          firstDetectionTime = Date.now();
        }
      } else {
        lastSymbol = null;
        consecutiveCount = 0;
        lastCommitted = null;
        firstDetectionTime = 0;
      }
    } else {
      lastSymbol = null;
      consecutiveCount = 0;
      lastCommitted = null;
      firstDetectionTime = 0;
    }

    timerId = setTimeout(pollLoop, POLL_INTERVAL_MS);
  };

  initAudio();

  return {
    stop: () => {
      isRunning = false;
      if (timerId) clearTimeout(timerId);
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    }
  };
}
