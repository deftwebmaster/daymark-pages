import { find } from '../core/content.js';
import { card, escape, external, favoriteButton, heading, icon, list, paragraphs, readingSection, shareButton } from '../core/ui.js';

export function prayerLinks(ids, content) {
  return `<div class="card-grid">${ids.map(id => find(content.prayers, id)).filter(Boolean).map(prayer =>
    card({ href: `#/prayers/${prayer.id}`, title: prayer.title, symbol: 'book' })).join('')}</div>`;
}

export function readingLink(id, content) {
  const reading = find(content.readings, id);
  if (!reading) return '';
  return card({ href: `#/toolkit/readings/${reading.id}`, title: reading.title,
    description: reading.reference, symbol: 'book', tone: 'amber' });
}

export function moments({ content, parts }) {
  if (!parts.length) {
    return { title: 'I Need a Moment', html: `<div class="moment-layout">
      ${heading({ title: 'What’s happening right now?', intro: 'Choose what fits this moment. You can start with one small action.',
        kicker: 'I Need a Moment', back: '#/today', backLabel: 'Today' })}
      <div class="card-grid moment-grid">${content.situations.map(item => card({
        href: `#/moment/${item.id}`, title: item.title, symbol: item.icon, tone: item.tone,
      })).join('')}</div></div>` };
  }
  const item = parts.length === 1 ? find(content.situations, parts[0]) : null;
  if (!item) return null;
  const urgentHelp = item.urgent ? `<section class="support-panel" aria-labelledby="live-support">
    <h2 id="live-support">${icon('phone')} Live support</h2>
    <p>If there’s immediate danger, a suspected overdose, or a medical emergency, call your local emergency number now.</p>
    <div class="actions"><a class="button" href="tel:911">Call 911 (U.S.)</a>
    <a class="button secondary" href="tel:988">Call 988 (U.S.)</a><a class="button secondary" href="sms:988">Text 988 (U.S.)</a></div>
    <p>The U.S. 988 Lifeline offers crisis support for emotional distress and substance use. Outside the U.S., use your local crisis service.</p>
    <p>${external(content.references.crisis, 'SAMHSA crisis resources')} · Phone and text require service.</p>
    </section>` : '';
  const title = item.detailTitle ?? item.title;
  return { title, html: `<article class="reading moment-reading">
    ${heading({ title, intro: item.grounding, back: '#/moment', backLabel: 'I Need a Moment' })}
    ${urgentHelp}
    ${readingSection('What you can do now', list(item.actions, true))}
    ${readingSection('Reach out', paragraphs([item.connection]))}
    ${readingSection('A principle to come back to', paragraphs([item.principle]))}
    ${readingSection('Prayers for this moment', prayerLinks(item.prayers, content))}
    ${readingSection('Suggested reading', readingLink(item.reading, content))}
    </article>` };
}

export function practice({ parts, content, state }) {
  if (!parts.length) {
    return { title: 'Daily Practice', html: `
      ${heading({ title: 'Daily Practice', intro: 'Take a few quiet minutes at the start or end of your day.' })}
      <div class="card-grid">${content.practices.map(item => card({ href: `#/practice/${item.id}`,
        title: item.title, description: item.short, symbol: item.icon, tone: item.tone })).join('')}</div>` };
  }

  const item = parts.length === 1 ? find(content.practices, parts[0]) : null;
  if (!item) return null;
  return { title: item.title, shareTitle: item.title, html: `<article class="reading practice">
    ${heading({ title: item.title, intro: item.intro, kicker: 'Daily Practice', back: '#/today', backLabel: 'Today' })}
    <div class="actions reading-actions">${favoriteButton(state, `practice/${item.id}`)}${shareButton()}</div>
    ${item.sections.map(section => readingSection(section.title,
      `${paragraphs(section.text ?? [])}${section.questions ? list(section.questions) : ''}
      ${section.reading ? readingLink(section.reading, content) : ''}${section.prayer ? prayerLinks([section.prayer], content) : ''}`)).join('')}
    </article>` };
}
