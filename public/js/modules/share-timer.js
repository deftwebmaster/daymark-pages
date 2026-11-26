const lengths = [1, 2, 3, 4, 5];
const minute = 60_000;
const timer = { length: 3, remaining: 3 * minute, deadline: 0, phase: 'ready', sound: false };
const status = {
  ready: 'Ready', running: 'Share in progress', paused: 'Paused', finished: 'Time’s up',
};
const controls = {
  ready: 'Start timer', running: 'Pause', paused: 'Resume', finished: 'Start next share',
};
let ticker;
let audio;
let wakeLock;
let requestingWakeLock = false;

export function shareTimer() {
  return `<section class="reading-section spark-timer" id="spark-timer" aria-labelledby="spark-timer-title">
    <h2 id="spark-timer-title" tabindex="-1">Share timer</h2>
    <label class="field"><span>Share length</span>
      <select name="share-length">${lengths.map(length =>
        `<option value="${length}">${length} ${length === 1 ? 'minute' : 'minutes'}</option>`).join('')}</select>
    </label>
    <div class="spark-timer-face">
      <div class="spark-time" role="timer" aria-label="Time remaining" aria-live="off"></div>
      <div class="spark-timer-status" role="status"></div>
    </div>
    <progress max="180" value="0" aria-label="Share time used"></progress>
    <div class="actions">
      <button class="button" type="button" data-spark-timer-toggle>Start timer</button>
      <button class="button secondary" type="button" data-spark-timer-reset>Reset</button>
    </div>
    <label class="check-field"><input type="checkbox" name="share-chime"> Chime when time is up</label>
  </section>`;
}

function prepareChime() {
  if (!timer.sound || !window.AudioContext) return;
  try {
    audio ??= new AudioContext();
    if (audio.state !== 'running') audio.resume().catch(() => {});
  } catch {
    // The visual timer still works when audio is unavailable.
  }
}

function chime() {
  if (!timer.sound || audio?.state !== 'running') return;
  try {
    const start = audio.currentTime;
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    tone.frequency.value = 660;
    volume.gain.setValueAtTime(.001, start);
    volume.gain.linearRampToValueAtTime(.12, start + .035);
    volume.gain.exponentialRampToValueAtTime(.001, start + .65);
    tone.connect(volume);
    volume.connect(audio.destination);
    tone.start(start);
    tone.stop(start + .67);
  } catch {
    // Still display the finished state if the audio output becomes unavailable.
  }
}

async function syncWakeLock() {
  if (timer.phase !== 'running' || document.hidden) {
    const lock = wakeLock;
    wakeLock = null;
    await lock?.release().catch(() => {});
    return;
  }
  if (wakeLock || requestingWakeLock || !navigator.wakeLock) return;
  requestingWakeLock = true;
  try {
    const lock = await navigator.wakeLock.request('screen');
    if (timer.phase !== 'running' || document.hidden || lock.released) {
      await lock.release();
      return;
    }
    wakeLock = lock;
    lock.addEventListener('release', () => {
      if (wakeLock === lock) wakeLock = null;
    }, { once: true });
  } catch {
    // The clock remains accurate if the screen lock is denied or unsupported.
  } finally {
    requestingWakeLock = false;
  }
}

function displayTimer() {
  const panel = document.getElementById('spark-timer');
  if (!panel) return;
  const seconds = Math.ceil(timer.remaining / 1000);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const output = panel.querySelector('[role="timer"]');
  const state = panel.querySelector('[role="status"]');
  if (output.textContent !== time) output.textContent = time;
  if (state.textContent !== status[timer.phase]) state.textContent = status[timer.phase];
  panel.dataset.phase = timer.phase;
  const progress = panel.querySelector('progress');
  progress.max = timer.length * 60;
  progress.value = progress.max - seconds;
  const length = panel.querySelector('[name="share-length"]');
  length.value = timer.length;
  length.disabled = timer.phase === 'running' || timer.phase === 'paused';
  const toggle = panel.querySelector('[data-spark-timer-toggle]');
  if (toggle.textContent !== controls[timer.phase]) toggle.textContent = controls[timer.phase];
  panel.querySelector('[data-spark-timer-reset]').disabled = timer.phase === 'ready';
}

function tick() {
  if (timer.phase === 'running') {
    timer.remaining = Math.max(0, Math.min(timer.length * minute, timer.deadline - Date.now()));
    if (!timer.remaining) {
      timer.phase = 'finished';
      clearInterval(ticker);
      syncWakeLock();
      chime();
    }
  }
  displayTimer();
}

function reset() {
  clearInterval(ticker);
  timer.remaining = timer.length * minute;
  timer.phase = 'ready';
  tick();
  syncWakeLock();
}

function toggleTimer() {
  const wasRunning = timer.phase === 'running';
  tick();
  if (wasRunning) {
    if (timer.phase === 'running') timer.phase = 'paused';
    clearInterval(ticker);
  } else {
    if (timer.phase !== 'paused') timer.remaining = timer.length * minute;
    prepareChime();
    timer.deadline = Date.now() + timer.remaining;
    timer.phase = 'running';
    ticker = setInterval(tick, 250);
  }
  tick();
  syncWakeLock();
}

export function mountShareTimer(panel) {
  const length = panel.querySelector('[name="share-length"]');
  length.addEventListener('change', () => {
    if (length.disabled || !lengths.includes(Number(length.value))) return;
    timer.length = Number(length.value);
    reset();
  });
  const sound = panel.querySelector('[name="share-chime"]');
  sound.checked = timer.sound;
  sound.disabled = !window.AudioContext;
  sound.addEventListener('change', () => {
    timer.sound = sound.checked;
    prepareChime();
  });
  panel.querySelector('[data-spark-timer-toggle]').addEventListener('click', toggleTimer);
  panel.querySelector('[data-spark-timer-reset]').addEventListener('click', reset);
  tick();
}

document.addEventListener('visibilitychange', () => {
  tick();
  syncWakeLock();
});
