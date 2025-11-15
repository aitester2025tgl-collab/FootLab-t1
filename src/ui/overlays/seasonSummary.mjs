import { hexToRgb, luminance, getReadableTextColor } from '../helpers.mjs';

export function showSeasonSummaryOverlay(summary, cb) {
  try {
    const overlay = document.getElementById('season-summary-overlay');
    if (!overlay) { if (typeof cb === 'function') cb(); return; }
    overlay.innerHTML = '';
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');

    const panel = document.createElement('div');
    panel.className = 'season-summary-panel';
    panel.style.width = 'min(1100px, 96vw)';
    panel.style.maxHeight = '90vh';
    panel.style.overflow = 'auto';
    panel.style.padding = '18px';
    panel.style.borderRadius = '12px';

    const clubNames = (summary && summary.clubs) ? summary.clubs.map(c => c.name).join(', ') : '';
    const title = `Resumo da Temporada ${summary && summary.season ? summary.season : ''}`;
    panel.innerHTML = `<h2 style="margin:0 0 12px 0;">${title}</h2><div style="margin-bottom:8px;color:rgba(0,0,0,0.6);">Clubes: ${clubNames}</div>`;

    const sections = [];
    if (summary.topScorers && summary.topScorers.length) {
      sections.push('<section><h3>Artilheiros</h3><ol>' + summary.topScorers.map(s => `<li>${s.player} (${s.club}) - ${s.goals}</li>`).join('') + '</ol></section>');
    }
    if (summary.assists && summary.assists.length) {
      sections.push('<section><h3>Assistências</h3><ol>' + summary.assists.map(s => `<li>${s.player} (${s.club}) - ${s.assists}</li>`).join('') + '</ol></section>');
    }
    if (summary.awards && summary.awards.length) {
      sections.push('<section><h3>Prêmios</h3><ul>' + summary.awards.map(a => `<li>${a.title} - ${a.player} (${a.club})</li>`).join('') + '</ul></section>');
    }

    panel.innerHTML += sections.join('');

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Fechar';
    closeBtn.style.marginTop = '12px';
    closeBtn.style.padding = '8px 12px';
    closeBtn.style.borderRadius = '8px';
    closeBtn.onclick = () => { overlay.style.display = 'none'; overlay.setAttribute('aria-hidden', 'true'); if (typeof cb === 'function') cb(); };

    overlay.appendChild(panel);
    overlay.appendChild(closeBtn);

    try {
      const dominantColor = (summary && summary.dominantColor) || '#2e2e2e';
      const rgb = hexToRgb(dominantColor) || [34,34,34];
      const fg = getReadableTextColor(dominantColor, '#ffffff');
      panel.style.background = `linear-gradient(rgba(0,0,0,0.06), rgba(0,0,0,0.02)), rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.96)`;
      panel.style.color = fg;
    } catch (e) { /* ignore */ }
  } catch (e) {
    console.warn('showSeasonSummaryOverlay failed', e);
    if (typeof cb === 'function') cb();
  }
}
