// ES module POC: tactics panel
import { hexToRgb, getReadableTextColor } from './helpers.mjs';

export function initTacticPanel() {
  const tacticList = document.getElementById('tacticList');
  const tactics = (window.FootLab && window.FootLab.TACTICS) || window.TACTICS;
  if (!tacticList || !tactics) return;
  tacticList.innerHTML = '';

  // Compute team positional profile to determine which tactics are valid
  const team = window.FootLab && window.FootLab.playerClub && window.FootLab.playerClub.team;
  
  let validTactics = tactics;
  if (team && window.FootLab && window.FootLab.Lineups && typeof window.FootLab.Lineups.getCompatibleTactics === 'function') {
    validTactics = window.FootLab.Lineups.getCompatibleTactics(team);
  }

  validTactics.forEach((tactic) => {
    const tacticItem = document.createElement('div');
    tacticItem.className = 'tactic-item';
    tacticItem.textContent = `${tactic.name}`;
    tacticItem.dataset.tactic = tactic.name;

    if (window.FootLab && window.FootLab.playerClub && window.FootLab.playerClub.team) {
      const teamBg = window.FootLab.playerClub.team.bgColor || '#2E7D32';
      const teamSec = window.FootLab.playerClub.team.color || '#ffffff';
      const rgb = hexToRgb(teamBg) || [34, 125, 50];
      const alphaBg = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.12)`;
      const borderColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.28)`;
      tacticItem.style.backgroundColor = alphaBg;
      tacticItem.style.border = `1px solid ${borderColor}`;
      tacticItem.style.color = getReadableTextColor(teamBg, teamSec);
    }

    if (
      window.FootLab &&
      window.FootLab.playerClub &&
      window.FootLab.playerClub.team.tactic === tactic.name
    ) {
      tacticItem.classList.add('active');
      if (window.FootLab && window.FootLab.playerClub && window.FootLab.playerClub.team) {
        const teamBg2 = window.FootLab.playerClub.team.bgColor || '#2E7D32';
        const rgb2 = hexToRgb(teamBg2) || [34, 125, 50];
        tacticItem.style.backgroundColor = `rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.26)`;
        tacticItem.style.border = `2px solid rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.6)`;
        tacticItem.style.boxShadow = `0 12px 30px rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.22), inset 0 0 0 1px rgba(255,255,255,0.03)`;
        const outlineColor = getReadableTextColor(
          teamBg2,
          (window.FootLab &&
            window.FootLab.playerClub &&
            window.FootLab.playerClub.team &&
            window.FootLab.playerClub.team.color) ||
            (window.Elifoot &&
              window.Elifoot.playerClub &&
              window.Elifoot.playerClub.team &&
              window.Elifoot.playerClub.team.color) ||
            '#ffffff'
        );
        tacticItem.style.outline = `3px solid ${outlineColor}`;
        tacticItem.style.outlineOffset = '3px';
        tacticItem.style.zIndex = '3';
      }
    }

    tacticItem.addEventListener('click', () => {
      if (!window.FootLab || !window.FootLab.playerClub) return;
      window.FootLab.playerClub.team.tactic = tactic.name;
      window.FootLab.playerClub.team.tacticData = tactic;
      const teamBg =
        (window.FootLab &&
          window.FootLab.playerClub &&
          window.FootLab.playerClub.team &&
          window.FootLab.playerClub.team.bgColor) ||
        (window.Elifoot &&
          window.Elifoot.playerClub &&
          window.Elifoot.playerClub.team &&
          window.Elifoot.playerClub.team.bgColor) ||
        '#2E7D32';
      const rgb = hexToRgb(teamBg) || [34, 125, 50];
      document.querySelectorAll('.tactic-item').forEach((item) => {
        item.classList.remove('active');
        if (item.dataset.tactic === tactic.name) {
          item.classList.add('active');
          item.style.backgroundColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.26)`;
          item.style.border = `2px solid rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.6)`;
          item.style.boxShadow = `0 12px 30px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.26), inset 0 0 0 1px rgba(255,255,255,0.04)`;
          const outlineColor = getReadableTextColor(
            window.FootLab.playerClub.team.bgColor || teamBg,
            window.FootLab.playerClub.team.color || '#ffffff'
          );
          item.style.outline = `3px solid ${outlineColor}`;
          item.style.outlineOffset = '3px';
          item.style.transform = 'translateY(-4px)';
          item.style.zIndex = '5';
        } else {
          item.style.backgroundColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.12)`;
          item.style.border = `1px solid rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.28)`;
          item.style.boxShadow = 'none';
          item.style.transform = 'translateY(0)';
          item.style.outline = 'none';
          item.style.zIndex = '';
        }
      });
      const renderFn =
        (window.FootLab && window.FootLab.renderHubContent) || window.renderHubContent;
      if (typeof renderFn === 'function') renderFn('menu-team');
    });

    tacticList.appendChild(tacticItem);
  });

  try {
    const L = window.FootLab && window.FootLab.Logger ? window.FootLab.Logger : console;
    L.info && L.info('Painel de táticas inicializado');
  } catch (_) {
    /* ignore */
  }
}

// Attach to globals for backwards compatibility
if (typeof window !== 'undefined') {
  window.Tactics = window.Tactics || {};
  window.Tactics.initTacticPanel = window.Tactics.initTacticPanel || initTacticPanel;
  window.initTacticPanel = window.initTacticPanel || initTacticPanel;
  window.FootLab = window.FootLab || {};
  window.FootLab.Tactics = window.FootLab.Tactics || {};
  window.FootLab.Tactics.initTacticPanel =
    window.FootLab.Tactics.initTacticPanel || initTacticPanel;
  window.FootLab.initTacticPanel = window.FootLab.initTacticPanel || initTacticPanel;
  // Backwards compatibility: keep old global if external code expects it
  window.Elifoot = window.Elifoot || window.FootLab;
}
