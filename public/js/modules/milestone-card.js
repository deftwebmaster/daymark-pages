import { config } from '../config.js';
import { escape, icon } from '../core/ui.js';

// Square-ish 4:5 portrait suits most social feeds. The card shows the milestone only, never the date.
const width = 1080;
const height = 1350;
const leaf = 'M0 0C5-7.5 15-9 23-3.5C17 4 7 5 0 0Z';
let images;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function split(label) {
  const match = /^(\d+)\s+(.+)$/.exec(label);
  return match ? [match[1], match[2]] : [label, ''];
}

function drawLaurel(ctx, cx, cy, radius) {
  const shape = new Path2D(leaf);
  for (const side of [-1, 1]) {
    for (let index = 0; index < 10; index++) {
      // Bottom to top along each side of the wreath.
      const angle = (side < 0 ? 122 + index * 15 : 58 - index * 15) * Math.PI / 180;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const tangent = side < 0 ? Math.atan2(Math.cos(angle), -Math.sin(angle)) : Math.atan2(-Math.cos(angle), Math.sin(angle));
      for (const tilt of [-.55, .55]) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tangent + tilt * side);
        const scale = 3.5 - index * .15;
        ctx.scale(scale, scale);
        ctx.fillStyle = tilt < 0 ? '#b9dc98e6' : '#8fc27ecc';
        ctx.fill(shape);
        ctx.restore();
      }
    }
  }
}

export async function drawMilestoneCard(canvas, label) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  images ??= Promise.all([loadImage('./assets/images/daybreak.jpg'), loadImage(config.brandMark)]);
  const [[background, mark]] = await Promise.all([images, document.fonts?.load('300 200px Fraunces'),
    document.fonts?.load('italic 400 60px Fraunces'), document.fonts?.load('500 60px Fraunces')].map(item => item ?? null));

  // Background art, cropped to cover.
  const scale = Math.max(width / background.width, height / background.height);
  const drawWidth = background.width * scale;
  const drawHeight = background.height * scale;
  ctx.drawImage(background, (width - drawWidth) * .42, (height - drawHeight) * .5, drawWidth, drawHeight);
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, '#0f2a1ecc');
  shade.addColorStop(.35, '#0f2a1e8c');
  shade.addColorStop(.7, '#0f2a1ed9');
  shade.addColorStop(1, '#0b2016f7');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(540, 600, 40, 540, 600, 420);
  glow.addColorStop(0, '#0c22179e');
  glow.addColorStop(1, '#0c221700');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Brand row.
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(88, 88, 84, 84, 20);
  else ctx.rect(88, 88, 84, 84);
  ctx.clip();
  ctx.drawImage(mark, 88, 88, 84, 84);
  ctx.restore();
  ctx.fillStyle = '#fffdf0';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '500 58px Fraunces, Georgia, serif';
  ctx.fillText(config.name, 196, 148);
  ctx.font = '600 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#d9e9b8cc';
  ctx.fillText(`by ${config.organization}`, 198, 182);

  // Wreath and milestone.
  drawLaurel(ctx, 540, 600, 300);
  const [number, unit] = split(label);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fffdf0';
  ctx.font = `300 ${number.length > 2 ? 230 : 300}px Fraunces, Georgia, serif`;
  ctx.fillText(number, 540, 690);
  ctx.font = '650 38px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f4d891';
  ctx.fillText(unit ? `${unit} of recovery`.toUpperCase() : 'IN RECOVERY', 540, 772);

  ctx.font = 'italic 400 64px Fraunces, Georgia, serif';
  ctx.fillStyle = '#d9e9b8';
  ctx.fillText('Just for today.', 540, 1030);
  ctx.fillText('Keep growing.', 540, 1108);
  ctx.font = '600 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#fffdf0aa';
  ctx.fillText(new URL(config.deployment).host, 540, 1262);
  ctx.textAlign = 'start';
}

export function milestoneCardSection(stats) {
  const reached = stats?.marks.filter(mark => mark.day <= stats.days) ?? [];
  if (!reached.length) return '';
  const chosen = stats.reachedToday ?? reached.at(-1);
  return `<section class="panel milestone-card" aria-labelledby="milestone-card-title">
    <h2 id="milestone-card-title">${icon('image')} Celebrate a milestone</h2>
    <p>Make an image to share with your sponsor, home group, or anyone cheering you on. It shows the milestone only, never your date.</p>
    <label class="field"><span>Milestone</span><select name="milestone-card">
      ${reached.map(mark => `<option value="${escape(mark.label)}" ${mark === chosen ? 'selected' : ''}>${escape(mark.label)}</option>`).join('')}
    </select></label>
    <div class="milestone-preview"><canvas role="img" aria-label="${escape(chosen.label)} milestone card"></canvas></div>
    <div class="actions"><button class="button" type="button" data-card-share>${icon('share')} Share image</button>
      <button class="button secondary" type="button" data-card-save>${icon('download')} Save image</button></div>
    <p class="muted milestone-status" role="status"></p>
  </section>`;
}

function blob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(file => file ? resolve(file) : reject(new Error('The image could not be created.')), 'image/png'));
}

function save(file, name) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function mountMilestoneCard(root) {
  const section = root.querySelector('.milestone-card');
  if (!section) return;
  const canvas = section.querySelector('canvas');
  const select = section.querySelector('select');
  const status = section.querySelector('.milestone-status');
  let ready = drawMilestoneCard(canvas, select.value);
  ready.catch(() => { status.textContent = 'The preview could not be drawn. Try reloading the page.'; });
  select.addEventListener('change', () => {
    canvas.setAttribute('aria-label', `${select.value} milestone card`);
    ready = drawMilestoneCard(canvas, select.value);
  });
  section.addEventListener('click', async event => {
    const share = event.target.closest('[data-card-share]');
    const download = event.target.closest('[data-card-save]');
    if (!share && !download) return;
    try {
      await ready;
      const name = `newleaf-${select.value.replace(/\s+/g, '-')}.png`;
      const file = new File([await blob(canvas)], name, { type: 'image/png' });
      if (share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `${select.value} · ${config.name}` });
          status.textContent = 'Shared.';
        } catch (error) {
          if (error.name !== 'AbortError') throw error;
        }
        return;
      }
      save(file, name);
      status.textContent = share ? 'Sharing images isn’t supported here, so the image was saved instead.' : 'Image saved.';
    } catch (error) {
      status.textContent = error?.message || 'The image could not be prepared.';
    }
  });
}
