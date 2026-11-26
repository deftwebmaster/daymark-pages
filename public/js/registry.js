import { home, tracker } from './modules/today.js';
import { prayers } from './modules/prayers.js';
import { moments, practice } from './modules/recovery.js';
import { toolkit } from './modules/toolkit.js';
import { about, favorites, more, privacy, settings } from './modules/settings.js';

export const registry = [
  { id: 'today', name: 'Today', icon: 'home', nav: 'today', primary: true, enabled: true, render: home },
  { id: 'prayers', name: 'Prayers', icon: 'book', nav: 'prayers', primary: true, enabled: true, render: prayers,
    home: { title: 'Prayer Library', description: 'Words for the days you need them.', tone: 'sage' } },
  { id: 'toolkit', name: 'Toolkit', icon: 'toolkit', nav: 'toolkit', primary: true, enabled: true, render: toolkit,
    home: { title: 'Sponsor Toolkit', description: 'Work the Steps together.', tone: 'clay' } },
  { id: 'more', name: 'More', icon: 'more', nav: 'more', primary: true, enabled: true, render: more },
  { id: 'sobriety', name: 'Sobriety', icon: 'leaf', nav: 'today', enabled: true, render: tracker },
  { id: 'practice', name: 'Daily Practice', icon: 'sunrise', nav: 'today', enabled: true, render: practice },
  { id: 'moment', name: 'I Need a Moment', icon: 'pause', enabled: true, render: moments },
  { id: 'settings', name: 'Settings', icon: 'settings', nav: 'more', enabled: true, render: settings },
  { id: 'favorites', name: 'Favorites', icon: 'heart', nav: 'more', enabled: true, render: favorites },
  { id: 'privacy', name: 'Privacy', icon: 'lock', nav: 'more', enabled: true, render: privacy },
  { id: 'about', name: 'About', icon: 'leaf', nav: 'more', enabled: true, render: about },
].filter(feature => feature.enabled);

export const navigation = registry.filter(feature => feature.primary);
