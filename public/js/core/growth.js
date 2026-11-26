// The Newleaf growth mark: a sprig that gains a leaf at each early milestone,
// wrapped in a ring that fills toward the next milestone.
const thresholds = [1, 7, 30, 60, 90, 180, 270, 365, 545, 730];
const leafPath = 'M0 0C5-7.5 15-9 23-3.5C17 4 7 5 0 0Z';
const vein = 'M1.5 0 17-2.6';

export function growthStage(days) {
  return thresholds.filter(day => days >= day).length;
}

function leaves(count) {
  // Alternate sides up the stem. Lower leaves are larger.
  return Array.from({ length: count }, (_, index) => {
    const left = index % 2 === 0;
    const y = 84 - index * 6.2;
    const x = 60 + Math.sin((84 - y) / 14) * 2.4;
    const scale = (1.32 - index * .06).toFixed(3);
    const angle = left ? 202 - index * 2 : -22 + index * 2;
    return `<g class="growth-leaf${index === count - 1 ? ' growth-leaf-new' : ''}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle}) scale(${scale})">
      <path d="${leafPath}"/><path class="growth-vein" d="${vein}"/></g>`;
  }).join('');
}

export function growthMark(stats, { size = 'medium', label = '' } = {}) {
  const days = stats?.days ?? 0;
  const count = growthStage(days);
  const percent = stats ? Math.max(2, Math.min(100, stats.percent)) : 0;
  const top = 84 - Math.max(count - 1, 0) * 6.2 - 10;
  const bloom = days >= 730 ? `<g class="growth-bloom" transform="translate(60 ${top.toFixed(1)})">
    ${[0, 72, 144, 216, 288].map(angle => `<ellipse rx="3.2" ry="5.6" cy="-5" transform="rotate(${angle})"/>`).join('')}
    <circle r="2.6"/></g>` : '';
  return `<svg class="growth growth-${size}" viewBox="0 0 120 120" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>
    <circle class="growth-track" cx="60" cy="60" r="54" pathLength="100"/>
    ${stats ? `<circle class="growth-progress" cx="60" cy="60" r="54" pathLength="100" stroke-dasharray="${percent} 100" transform="rotate(-90 60 60)"/>` : ''}
    <path class="growth-soil" d="M40 92c8-3 32-3 40 0"/>
    <path class="growth-stem" d="M60 93C58 80 62 70 60 ${Math.min(86, top + 4).toFixed(1)}"/>
    ${count ? leaves(count) : '<circle class="growth-seed" cx="60" cy="88" r="3.4"/>'}
    ${bloom}
  </svg>`;
}

// A few drifting leaves for milestone days. Decorative only.
export function leafFall(count = 12) {
  return `<span class="leaf-fall" aria-hidden="true">${Array.from({ length: count }, () =>
    `<svg viewBox="-2 -8 27 14"><path d="${leafPath}"/></svg>`).join('')}</span>`;
}
