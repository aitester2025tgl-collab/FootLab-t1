// ES module POC: tactics panel
import { hexToRgb, getReadableTextColor } from './helpers.mjs';

export function initTacticPanel() {
  const tacticList = document.getElementById('tacticList');
  const tactics = (window.Elifoot && window.Elifoot.TACTICS) || window.TACTICS;
  if (!tacticList || !tactics) return;
  tacticList.innerHTML = '';

  // Compute team positional profile to determine which tactics are valid
  const team = window.Elifoot && window.Elifoot.playerClub && window.Elifoot.playerClub.team;
  const profile = { CB: 0, LB: 0, RB: 0, CM: 0, LW: 0, RW: 0, ST: 0, GK: 0 };
  if (team && Array.isArray(team.players)) {
    team.players.forEach((p) => {
      const pos = (p.position || '').toUpperCase();
      if (Object.prototype.hasOwnProperty.call(profile, pos)) profile[pos]++;
      else if (pos === 'DF') profile.CB++;
      else if (pos === 'MF' || pos === 'AM' || pos === 'DM') profile.CM++;
      else if (pos === 'FW' || pos === 'SS') profile.ST++;
    });
  }

  function tacticCompatible(tactic) {
    if (!tactic || !tactic.requires) return true;
    const req = tactic.requires;
    if (req.threeAtBack) {
      if ((profile.CB || 0) < 3) return false;
    }
    if (req.wingers) {
      const wide = (profile.LW || 0) + (profile.RW || 0);
      if (wide < 2) return false;
    }
    // Check striker/forward count requirement. Prefer explicit `requires.strikers` if present,
    // otherwise infer required forwards from tactic name (last number in formation, e.g. '4-3-3' -> 3).
    const reqStrikers =
      typeof req.strikers === 'number'
        ? req.strikers
        : (function () {
            try {
              const parts = (tactic && tactic.name && tactic.name.match(/\d+/g)) || [];
              if (parts.length === 0) return null;
              return parseInt(parts[parts.length - 1], 10);
            } catch (e) {
              return null;
            }
          })();
    if (reqStrikers != null) {
      if ((profile.ST || 0) < reqStrikers) return false;
    }
    return true;
  }

  tactics.forEach((tactic) => {
    if (!tacticCompatible(tactic)) return;
    const tacticItem = document.createElement('div');
    tacticItem.className = 'tactic-item';
    tacticItem.textContent = `${tactic.name}`;
    tacticItem.dataset.tactic = tactic.name;

    if (window.Elifoot && window.Elifoot.playerClub && window.Elifoot.playerClub.team) {
      const teamBg = window.Elifoot.playerClub.team.bgColor || '#2E7D32';
      const teamSec = window.Elifoot.playerClub.team.color || '#ffffff';
      const rgb = hexToRgb(teamBg) || [34, 125, 50];
      const alphaBg = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.12)`;
      const borderColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.28)`;
      tacticItem.style.backgroundColor = alphaBg;
      tacticItem.style.border = `1px solid ${borderColor}`;
      tacticItem.style.color = getReadableTextColor(teamBg, teamSec);
    }

    if (
      window.Elifoot &&
      window.Elifoot.playerClub &&
      window.Elifoot.playerClub.team.tactic === tactic.name
    ) {
      tacticItem.classList.add('active');
      if (window.Elifoot && window.Elifoot.playerClub && window.Elifoot.playerClub.team) {
        const teamBg2 = window.Elifoot.playerClub.team.bgColor || '#2E7D32';
        const rgb2 = hexToRgb(teamBg2) || [34, 125, 50];
        tacticItem.style.backgroundColor = `rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.26)`;
        tacticItem.style.border = `2px solid rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.6)`;
        tacticItem.style.boxShadow = `0 12px 30px rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.22), inset 0 0 0 1px rgba(255,255,255,0.03)`;
        const outlineColor = getReadableTextColor(
          teamBg2,
          window.Elifoot.playerClub.team.color || '#ffffff'
        );
        tacticItem.style.outline = `3px solid ${outlineColor}`;
        tacticItem.style.outlineOffset = '3px';
        tacticItem.style.zIndex = '3';
      }
    }

    tacticItem.addEventListener('click', () => {
      if (!window.Elifoot || !window.Elifoot.playerClub) return;
      window.Elifoot.playerClub.team.tactic = tactic.name;
      window.Elifoot.playerClub.team.tacticData = tactic;
      const teamBg = window.Elifoot.playerClub.team.bgColor || '#2E7D32';
      const rgb = hexToRgb(teamBg) || [34, 125, 50];
      document.querySelectorAll('.tactic-item').forEach((item) => {
        item.classList.remove('active');
        if (item.dataset.tactic === tactic.name) {
          item.classList.add('active');
          item.style.backgroundColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.26)`;
          item.style.border = `2px solid rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.6)`;
          item.style.boxShadow = `0 12px 30px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.26), inset 0 0 0 1px rgba(255,255,255,0.04)`;
          const outlineColor = getReadableTextColor(
            window.Elifoot.playerClub.team.bgColor || teamBg,
            window.Elifoot.playerClub.team.color || '#ffffff'
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
      const renderFn = (window.Elifoot && window.Elifoot.renderHubContent) || window.renderHubContent;
      if (typeof renderFn === 'function') renderFn('menu-team');
    });

    tacticList.appendChild(tacticItem);
  });

  try {
    const L = window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
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
  window.Elifoot = window.Elifoot || {};
  window.Elifoot.Tactics = window.Elifoot.Tactics || {};
  window.Elifoot.Tactics.initTacticPanel = window.Elifoot.Tactics.initTacticPanel || initTacticPanel;
  window.Elifoot.initTacticPanel = window.Elifoot.initTacticPanel || initTacticPanel;
}
