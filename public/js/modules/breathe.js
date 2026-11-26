import { escape, heading, icon } from '../core/ui.js';

const patterns = {
  box: { label: 'Box', detail: '4 · 4 · 4 · 4', steps: [['in', 4], ['hold', 4], ['out', 4], ['rest', 4]] },
  relax: { label: 'Relax', detail: '4 · 7 · 8', steps: [['in', 4], ['hold', 7], ['out', 8]] },
  even: { label: 'Even', detail: '5 · 5', steps: [['in', 5], ['out', 5]] },
};
const words = { ready: 'Ready when you are', in: 'Breathe in', hold: 'Hold', out: 'Breathe out', rest: 'Rest' };
let session = null;

export function breathePanel({ compact = false } = {}) {
  return `<section class="breathe ${compact ? 'breathe-compact' : ''}" data-phase="ready" aria-labelledby="breathe-title">
    <div class="breathe-head">
      <h2 id="breathe-title">${compact ? 'Breathe with me' : 'Follow the circle'}</h2>
      <fieldset class="segmented breathe-patterns"><legend class="sr-only">Breathing pattern</legend>
        ${Object.entries(patterns).map(([id, pattern], index) => `<label><input type="radio" name="breathe-pattern" value="${id}" ${index ? '' : 'checked'}>
          <span>${escape(pattern.label)} <small>${escape(pattern.detail)}</small></span></label>`).join('')}
      </fieldset>
    </div>
    <div class="breathe-stage">
      <span class="breathe-halo" aria-hidden="true"></span>
      <span class="breathe-orb" aria-hidden="true"></span>
      <div class="breathe-label">
        <span class="breathe-word" aria-live="polite">${words.ready}</span>
        <span class="breathe-count" aria-hidden="true"></span>
      </div>
    </div>
    <div class="actions breathe-actions">
      <button class="button" type="button" data-breathe-toggle>${icon('leaf')} Start breathing</button>
      <span class="breathe-round muted" aria-live="off"></span>
    </div>
  </section>`;
}

export function breathePage() {
  return { title: 'Breathe', html: `<div class="reading breathe-page">
    ${heading({ title: 'Breathe', kicker: 'I Need a Moment', back: '#/moment', backLabel: 'I Need a Moment',
      intro: 'Slow breathing can settle your body before you decide what to do next. Breathe through your nose if you can. Stop if you feel dizzy.' })}
    ${breathePanel()}
    <a class="link-card" href="#/moment"><span class="icon-badge tone-amber">${icon('pause')}</span>
      <span class="card-copy"><strong>Find a next step</strong><span>Choose what’s happening right now.</span></span>${icon('arrow', 'card-arrow')}</a>
  </div>` };
}

function stop(el, message = words.ready) {
  if (session) {
    clearTimeout(session.timer);
    clearInterval(session.ticker);
  }
  session = null;
  if (!el?.isConnected) return;
  el.dataset.phase = 'ready';
  el.querySelector('.breathe-word').textContent = message;
  el.querySelector('.breathe-count').textContent = '';
  el.querySelector('[data-breathe-toggle]').innerHTML = `${icon('leaf')} Start breathing`;
}

function step(el) {
  if (!el.isConnected || !session) return stop(el);
  const steps = patterns[session.pattern].steps;
  const [phase, seconds] = steps[session.index];
  let left = seconds;
  el.style.setProperty('--phase-ms', `${seconds * 1000}ms`);
  el.dataset.phase = phase;
  el.querySelector('.breathe-word').textContent = words[phase];
  el.querySelector('.breathe-count').textContent = left;
  el.querySelector('.breathe-round').textContent = `Round ${session.round}`;
  clearInterval(session.ticker);
  session.ticker = setInterval(() => {
    left -= 1;
    if (!el.isConnected) return stop(el);
    if (left > 0) el.querySelector('.breathe-count').textContent = left;
  }, 1000);
  session.timer = setTimeout(() => {
    if (!session) return;
    session.index = (session.index + 1) % steps.length;
    if (session.index === 0) session.round += 1;
    step(el);
  }, seconds * 1000);
}

export function mountBreathe(root) {
  const el = root.querySelector('.breathe');
  if (!el) return;
  if (session) stop(null);
  el.addEventListener('click', event => {
    if (!event.target.closest('[data-breathe-toggle]')) return;
    if (session) return stop(el, 'Well done. Come back anytime.');
    session = { pattern: el.querySelector('[name="breathe-pattern"]:checked')?.value ?? 'box', index: 0, round: 1 };
    el.querySelector('[data-breathe-toggle]').innerHTML = `${icon('pause')} Stop`;
    step(el);
  });
  el.addEventListener('change', event => {
    if (event.target.name !== 'breathe-pattern' || !session) return;
    clearTimeout(session.timer);
    Object.assign(session, { pattern: event.target.value, index: 0, round: 1 });
    step(el);
  });
}
