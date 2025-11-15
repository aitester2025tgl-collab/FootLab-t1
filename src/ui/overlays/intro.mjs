import { hexToRgb, luminance, getReadableTextColor, normalizePosition } from '../helpers.mjs';

function getLogger() {
  return (window.Elifoot && window.Elifoot.Logger) || console;
}

export function setIntroColors(club) {
  const bg = (club && club.team && club.team.bgColor) || '#222';
  const fg = getReadableTextColor(bg, (club && club.team && club.team.color) || '#ffffff');
  const fgRgb = hexToRgb(fg);
  const blackContrast = luminance(fgRgb) > 0.5 ? 21 : 1;
  const whiteContrast = luminance(fgRgb) > 0.5 ? 1 : 21;
  const stroke = blackContrast >= whiteContrast ? '#000' : '#fff';
  const overlay = document.getElementById('intro-overlay');
  if (overlay) {
    overlay.style.setProperty('--intro-bg', bg);
    overlay.style.setProperty('--intro-fg', fg);
    overlay.style.setProperty('--intro-club-bg', bg);
    overlay.style.setProperty('--team-menu-stroke', stroke);
  }
  const hubMenu = document.getElementById('hub-menu');
  if (hubMenu) hubMenu.style.setProperty('--team-menu-stroke', stroke);
  return { bg, fg };
}

export function showIntroOverlay(club, cb) {
  try {
    const E = window.Elifoot || window;
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) {
      if (typeof cb === 'function') cb();
      return;
    }
    const playerMatch = (E.currentRoundMatches || window.currentRoundMatches || []).find(
      (m) => m.homeClub === club || m.awayClub === club
    );
    const isHome = playerMatch && playerMatch.homeClub === club;
    const starters = playerMatch
      ? isHome
        ? playerMatch.homePlayers
        : playerMatch.awayPlayers
      : club && club.team && club.team.players
        ? club.team.players.slice(0, 11)
        : [];
    const subs = playerMatch
      ? isHome
        ? playerMatch.homeSubs || []
        : playerMatch.awaySubs || []
      : club && club.team && club.team.players
        ? club.team.players.slice(11)
        : [];
    const { bg, fg } = setIntroColors(club);
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 560ms ease';
    const content = document.createElement('div');
    content.className = 'intro-card intro-lineup';
    content.style.background = 'var(--intro-bg)';
    content.style.color = 'var(--intro-fg)';
    const badge = `<div class="intro-badge" id="introBadge" style="background:${bg}; border-color:${getReadableTextColor(bg, '#ffffff')}"></div>`;
    const header = `<div class="intro-header">${badge}<div><h2 id="introTeamName">${(club && club.team && club.team.name) || 'Equipe'}</h2><div style="opacity:0.9;">Onze inicial / Suplentes</div></div></div>`;
    const renderSimpleListItem = (p, idx) => {
      const displayPos = normalizePosition(p.position) || '';
      const skill = p.skill || 0;
      return `<li data-idx="${idx}">${displayPos} — ${p.name || '—'} <span class="player-skill">(skill: ${skill})</span></li>`;
    };
    const startersList = (starters || []).map((p, i) => renderSimpleListItem(p, i)).join('');
    const subsList = (subs || []).map((p, i) => renderSimpleListItem(p, i)).join('');
    const startersHtml = `<div class="subs-col starters-col"><h3 style="margin:0 0 8px 0;">Onze Inicial</h3><ol class="intro-lineup-list">${startersList}</ol></div>`;
    const subsHtml = `<div class="subs-col subs-col-right"><h3 style="margin:0 0 8px 0;">Suplentes</h3><ol class="intro-lineup-list">${subsList}</ol></div>`;
    content.innerHTML = `${header}<div class="subs-columns">${startersHtml}${subsHtml}</div>`;
    overlay.innerHTML = '';
    overlay.appendChild(content);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        if (typeof cb === 'function') cb();
      }, 360);
    }, 2200);
  } catch (e) {
    try { const L = getLogger(); L.warn && L.warn('showIntroOverlay failed', e); } catch (_) {}
    if (typeof cb === 'function') cb();
  }
}

// Attach to globals for compatibility
if (typeof window !== 'undefined') {
  window.Elifoot = window.Elifoot || {};
  window.Elifoot.Overlays = window.Elifoot.Overlays || {};
  window.Elifoot.Overlays.setIntroColors = window.Elifoot.Overlays.setIntroColors || setIntroColors;
  window.Elifoot.Overlays.showIntroOverlay = window.Elifoot.Overlays.showIntroOverlay || showIntroOverlay;
}
