import { escape, heading, icon, list } from '../core/ui.js';
import { mountShareTimer, shareTimer } from './share-timer.js';

const deck = { category: 'all', style: 'all', remaining: [], history: [], index: -1 };
const currentTopic = () => deck.history[deck.index];

function chooseTopics(library) {
  return library.topics.filter(topic =>
    (deck.category === 'all' || topic.category === deck.category)
    && (deck.style === 'all' || topic.style === deck.style));
}

function advance(pool) {
  if (!pool.length) return;
  if (deck.index < deck.history.length - 1) {
    deck.index++;
    return;
  }
  if (!deck.remaining.length) deck.remaining = [...pool];
  const choices = deck.remaining.length > 1
    ? deck.remaining.filter(topic => topic.id !== currentTopic()?.id) : deck.remaining;
  const topic = choices[Math.floor(Math.random() * choices.length)];
  deck.remaining = deck.remaining.filter(item => item.id !== topic.id);
  if (deck.history.length >= pool.length) deck.history.shift();
  deck.history.push(topic);
  deck.index = deck.history.length - 1;
}

function selectFilter(key, label, any, values) {
  return `<label class="field"><span>${label}</span><select name="spark-${key}">
    <option value="all" ${deck[key] === 'all' ? 'selected' : ''}>${any}</option>
    ${Object.entries(values).map(([id, title]) =>
      `<option value="${escape(id)}" ${deck[key] === id ? 'selected' : ''}>${escape(title)}</option>`).join('')}
  </select></label>`;
}

function mountDeck(root, library, copy) {
  const view = root.querySelector('#spark-topic');
  const count = root.querySelector('#spark-count');
  const status = root.querySelector('#spark-status');
  const next = root.querySelector('[data-spark-next]');
  const previous = root.querySelector('[data-spark-previous]');
  const copyButton = root.querySelector('[data-spark-copy]');
  let pool = chooseTopics(library);

  function display(announce = false) {
    const topic = currentTopic();
    const label = topic && [topic.label, library.categories[topic.category], library.styles[topic.style]].filter(Boolean).join(' · ');
    view.innerHTML = topic ? `
      <p class="eyebrow">${escape(label)}</p>
      <h3>${escape(topic.title)}</h3>
      <p class="spark-opening">${escape(topic.opening)}</p>
      ${list(topic.questions)}` :
      '<p>No topics match. Try another category or style.</p>';
    count.textContent = `${pool.length} ${pool.length === 1 ? 'topic' : 'topics'}`;
    next.disabled = pool.length < 2;
    previous.disabled = deck.index < 1;
    copyButton.disabled = !topic;
    if (announce) status.textContent = topic ? `Topic: ${topic.title}.` : 'No topics match.';
  }

  for (const key of ['category', 'style']) {
    const select = root.querySelector(`[name="spark-${key}"]`);
    select.addEventListener('change', () => {
      deck[key] = select.value;
      Object.assign(deck, { remaining: [], history: [], index: -1 });
      pool = chooseTopics(library);
      advance(pool);
      display(true);
    });
  }
  next.addEventListener('click', () => {
    advance(pool);
    display(true);
  });
  previous.addEventListener('click', () => {
    if (deck.index > 0) deck.index--;
    display(true);
    if (previous.disabled) next.focus();
  });
  copyButton.addEventListener('click', () => {
    const topic = currentTopic();
    if (!topic) return;
    const title = [topic.label, topic.title].filter(Boolean).join(' · ');
    const prompts = topic.questions.map(question => `• ${question}`).join('\n');
    copy(`${title}\n\n${topic.opening}\n\n${prompts}`, 'Topic copied.', copyButton);
  });

  if (!currentTopic()) advance(pool);
  display();
}

export function meetingSpark({ content, parts }) {
  const library = content.meetingSpark;
  if (parts.length || !library) return null;
  return {
    title: 'Meeting Spark',
    html: `<article class="reading meeting-spark">
      ${heading({ title: 'Meeting Spark', intro: 'Pick a topic for your group and keep track of share time.',
        back: '#/toolkit', backLabel: 'Sponsor Toolkit' })}
      <div class="spark-layout">
        <section class="reading-section spark-deck" aria-labelledby="spark-deck-title">
          <div class="spark-deck-heading">
            <h2 id="spark-deck-title">Meeting topic</h2>
            <button class="button quiet spark-timer-jump" type="button" data-spark-jump>
              ${icon('clock')} Share timer
            </button>
          </div>
          <div class="spark-filters">
            ${selectFilter('category', 'Category', 'All', library.categories)}
            ${selectFilter('style', 'Style', 'Any style', library.styles)}
          </div>
          <p class="spark-count muted" id="spark-count"></p>
          <div class="spark-topic" id="spark-topic"></div>
          <p class="sr-only" id="spark-status" role="status"></p>
          <div class="actions spark-topic-actions">
            <button class="button" type="button" data-spark-next>Next topic ${icon('arrow')}</button>
            <button class="button secondary" type="button" data-spark-previous>${icon('back')} Previous</button>
            <button class="button secondary" type="button" data-spark-copy>${icon('copy')} Copy topic</button>
          </div>
        </section>
        ${shareTimer()}
      </div>
    </article>`,
    mount(root, copy) {
      mountDeck(root, library, copy);
      mountShareTimer(root.querySelector('#spark-timer'));
      root.querySelector('[data-spark-jump]').addEventListener('click', () => {
        root.querySelector('#spark-timer').scrollIntoView({ block: 'start' });
        root.querySelector('#spark-timer-title').focus({ preventScroll: true });
      });
    },
  };
}
