import { find } from '../core/content.js';
import { card, escape, external, favoriteButton, heading, icon, list, paragraphs, readingSection, shareButton } from '../core/ui.js';
import { prayerLinks, readingLink } from './recovery.js';

const itemSets = { steps: 'steps', readings: 'readings', worksheets: 'worksheets', printables: 'worksheets' };
const symbols = { steps: 'leaf', worksheets: 'file', printables: 'print', readings: 'book' };

export function toolkitItem(content, id) {
  for (const [group, key] of Object.entries(itemSets)) {
    const item = find(content[key], id);
    if (item) return { ...item, group, route: `toolkit/${group}/${item.id}` };
  }
  const item = find(content.resources, id);
  return item && { ...item, group: item.category, route: `toolkit/${item.category}/${item.id}` };
}

export const toolkitTitle = item => item.number ? `Step ${item.number} · ${item.title}` : item.title;

function resourceLinks(ids, content) {
  return `<div class="card-grid">${ids.map(id => toolkitItem(content, id)).filter(Boolean).map(item =>
    card({ href: `#/${item.route}`, title: toolkitTitle(item), symbol: symbols[item.group] ?? 'toolkit' })).join('')}</div>`;
}

export function toolkit({ content, parts, registry, state }) {
  if (!parts.length) {
    const spark = registry.find(feature => feature.id === 'meeting-spark');
    return { title: 'Sponsor Toolkit', html: `
      ${heading({ title: 'Sponsor Toolkit', intro: 'Reading, questions and practical exercises for working the Steps together.' })}
      <div class="card-grid toolkit-grid">
        ${spark && content.meetingSpark ? card({ href: `#/${spark.id}`, title: spark.name, symbol: spark.icon,
          tone: 'amber', description: 'Pick a meeting topic and time shares.' }) : ''}
        ${content.toolkitGroups.map(group => card({ ...group, href: `#/toolkit/${group.id}`, symbol: group.icon })).join('')}
      </div>` };
  }

  const [groupId, id] = parts;
  const group = find(content.toolkitGroups, groupId);
  if (!group || parts.length > 2) return null;
  const items = itemSets[groupId] ? content[itemSets[groupId]] : content.resources.filter(resource => resource.category === groupId);

  if (!id) {
    return { title: group.title, html: `
      ${heading({ title: group.title, intro: group.description, back: '#/toolkit', backLabel: 'Sponsor Toolkit' })}
      ${groupId === 'steps' ? `<p class="source-note">${external(content.references.steps, 'Read A.A.’s published Twelve Steps')}</p>` : ''}
      <div class="card-grid">${items.map(item => card({ href: `#/toolkit/${groupId}/${item.id}`,
        title: toolkitTitle(item), description: item.principle ?? item.reference ?? item.intro,
        symbol: group.icon, tone: group.tone })).join('')}</div>` };
  }

  const item = find(items, id);
  if (!item) return null;

  const title = toolkitTitle(item);
  const favoriteGroup = groupId === 'printables' ? 'worksheets' : groupId;
  const controls = `<div class="actions reading-actions">${favoriteButton(state, `toolkit/${favoriteGroup}/${item.id}`)}
    ${shareButton(groupId === 'readings' ? 'Share assignment' : 'Share link')}
    ${item.fields ? `<button class="button" data-action="print">${icon('print')} Print worksheet</button>` : ''}</div>`;
  let body;
  if (item.number) {
    body = `${readingSection('Purpose and principles', paragraphs([item.principle + '. Discuss this suggested approach and pace with your sponsor.']))}
      ${readingSection('Reading assignment', readingLink(item.reading, content))}
      ${readingSection('Discussion questions', list(item.questions))}
      ${readingSection(item.number === 4 ? 'Try a sample inventory' : 'Practice the principle', paragraphs(item.exercises))}
      ${item.worksheets.length ? readingSection('Worksheets', resourceLinks(item.worksheets, content)) : ''}
      ${readingSection('Related prayers', prayerLinks(item.prayers, content))}
      ${readingSection('Related resources', resourceLinks(item.related, content))}`;
  } else if (item.fields) {
    body = `<p class="source-note">Print or save a blank copy. Keep any answers somewhere private.</p>
      ${item.fields.map(([prompt, hint]) => readingSection(prompt,
        `<p>${escape(hint)}</p><div class="worksheet-lines" aria-hidden="true"></div>`)).join('')}
      <a class="back no-print" href="#/toolkit/steps/step-${item.step}">${icon('back')} Step ${item.step} guide</a>`;
  } else if (item.instructions) {
    body = `${readingSection('What to read', `<p><strong>${escape(item.source)}</strong><br>${escape(item.reference)}</p>
      ${external(item.url, 'Open the source')}`)}
      ${readingSection('How to approach it', paragraphs([item.instructions]))}
      ${readingSection('Reflection questions', list(item.questions))}
      ${readingSection('Related resources', resourceLinks(item.related, content))}`;
  } else {
    body = item.sections.map(section => readingSection(section.title, section.items ? list(section.items) : paragraphs(section.text))).join('');
    if (item.source) body += readingSection('Further reading', external(item.source.url, item.source.title));
    body += readingSection('Related resources', resourceLinks(item.related, content));
  }

  return { title, shareTitle: title, html: `<article class="reading ${item.fields ? 'worksheet' : ''}">
    ${heading({ title, intro: item.intro, kicker: item.step ? `Step ${item.step}` : '',
      back: `#/toolkit/${groupId}`, backLabel: group.title })}${controls}${body}</article>` };
}
