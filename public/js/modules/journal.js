import { formatDate, parseDate, today } from '../core/dates.js';
import { limits } from '../core/storage.js';
import { escape, heading, icon } from '../core/ui.js';

const prompts = [
  'Where was I honest, kind, or useful today?',
  'Was I resentful, selfish, dishonest, or afraid?',
  'Do I owe anyone an apology or a call?',
  'What would I like to do differently tomorrow?',
];

function entryForm(entry, date) {
  const gratitude = entry?.gratitude ?? [];
  const isToday = date === today();
  return `<form class="panel journal-form" id="journal-form" novalidate>
    <div class="journal-form-head">
      <h2>${isToday ? 'Tonight' : escape(formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' }))}</h2>
      <label class="field journal-date"><span>Entry date</span>
        <input type="date" name="journal-date" value="${escape(date)}" max="${today()}" min="0001-01-01"></label>
    </div>
    <fieldset class="journal-gratitude">
      <legend>Three things I’m grateful for</legend>
      ${[0, 1, 2].map(index => `<label class="gratitude-line"><span class="gratitude-number" aria-hidden="true">${index + 1}</span>
        <span class="sr-only">Gratitude ${index + 1}</span>
        <input name="gratitude" maxlength="${limits.gratitude}" autocomplete="off" value="${escape(gratitude[index] ?? '')}"></label>`).join('')}
    </fieldset>
    <label class="field"><span>Evening inventory</span>
      <textarea name="reflection" rows="6" maxlength="${limits.reflection}" aria-describedby="journal-prompts">${escape(entry?.reflection ?? '')}</textarea></label>
    <ul class="journal-prompts" id="journal-prompts">${prompts.map(prompt => `<li>${escape(prompt)}</li>`).join('')}</ul>
    <div class="actions"><button class="button" type="submit">${icon('check')} ${entry ? 'Update entry' : 'Save entry'}</button>
      ${entry ? `<button class="button quiet" type="button" data-action="delete-entry" data-id="${escape(entry.id)}">${icon('trash')} Delete</button>` : ''}</div>
  </form>`;
}

function pastEntries(entries, current) {
  const past = entries.filter(entry => entry.id !== current);
  if (!past.length) return '';
  return `<section class="journal-history" aria-labelledby="journal-history-title">
    <h2 id="journal-history-title">Earlier entries</h2>
    <ol class="plain-list journal-list">${past.slice(0, 60).map(entry => `<li>
      <a class="journal-item" href="#/journal/${escape(entry.id)}">
        <time datetime="${escape(entry.id)}"><span>${escape(formatDate(entry.id, { month: 'short' }))}</span>
          <strong>${escape(formatDate(entry.id, { day: 'numeric' }))}</strong></time>
        <span class="card-copy"><strong>${escape(entry.gratitude.find(Boolean) || 'Evening inventory')}</strong>
          <span>${escape(entry.reflection.slice(0, 110) || `${entry.gratitude.filter(Boolean).length} gratitudes`)}</span></span>
        ${icon('arrow', 'card-arrow')}</a></li>`).join('')}</ol>
    ${past.length > 60 ? `<p class="muted">Showing the 60 most recent entries. Export a backup from Settings to keep them all.</p>` : ''}
  </section>`;
}

export function journal({ parts, state }) {
  if (parts.length > 1) return null;
  const date = parts[0] ?? today();
  if (!parseDate(date) || date > today()) return null;
  const entry = state.journal.find(item => item.id === date);
  return { title: 'Journal', html: `<div class="reading journal">
    ${heading({ title: 'Journal', kicker: 'Daily Practice', back: '#/today', backLabel: 'Today',
      intro: 'Three good things and an honest look at the day. Entries stay on this device and are included in backups you export.' })}
    ${entryForm(entry, date)}
    ${pastEntries(state.journal, date)}
  </div>` };
}

export function readEntry(form) {
  const data = new FormData(form);
  return {
    id: String(data.get('journal-date')),
    gratitude: data.getAll('gratitude').map(item => String(item).trim()),
    reflection: String(data.get('reflection')).trim(),
  };
}
