// Shared UI helpers for color, position normalization, and basic club/player utilities
export function hexToRgb(hex) {
  if (!hex) return [46, 46, 46];
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const v = parseInt(h, 16);
  if (isNaN(v)) return [46, 46, 46];
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function luminance(rgb) {
  if (!rgb) return 0;
  const s = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}

export function getReadableTextColor(bg, pref) {
  const E = window.Elifoot || window;
  if (E.ColorUtils && typeof E.ColorUtils.getReadableTextColor === 'function')
    return E.ColorUtils.getReadableTextColor(bg, pref);
  return pref || '#ffffff';
}

export function normalizePosition(pos) {
  if (!pos) return '';
  const p = String(pos || '').toUpperCase().trim();
  if (p === 'GK' || p === 'GOALKEEPER') return 'GK';
  if (/^(CB|CENTERBACK|CENTREBACK|CEN|CTR|DC|DF)$/.test(p)) return 'CB';
  if (/^(LB|LWB|LEFTBACK|LEFTBACKWARD)$/.test(p)) return 'LB';
  if (/^(RB|RWB|RIGHTBACK|RIGHTBACKWARD)$/.test(p)) return 'RB';
  if (/^(CDM|DM|DEFMID|HOLDING)$/.test(p)) return 'CM';
  if (/^(CM|MC|MID|MF|MIDFIELDER|CENTRAL)$/.test(p)) return 'CM';
  if (/^(AM|CAM|OM|SS|SH|ATT|AMF)$/.test(p)) return 'CM';
  if (/^(LW|LM|LEFTWING|LEFT)$/.test(p)) return 'LW';
  if (/^(RW|RM|RIGHTWING|RIGHT)$/.test(p)) return 'RW';
  if (/^(ST|CF|FW|FORWARD|STRIKER)$/.test(p)) return 'ST';
  if (/^D/.test(p)) return 'CB';
  if (/^M/.test(p)) return 'CM';
  if (/^F|^A|^S/.test(p)) return 'ST';
  return p;
}

export function avgSkill(club) {
  if (!club || !club.team || !Array.isArray(club.team.players) || club.team.players.length === 0)
    return 0;
  const sum = club.team.players.reduce((s, p) => s + (p && typeof p.skill === 'number' ? p.skill : 0), 0);
  return Math.round(sum / club.team.players.length);
}

export function isPlayerInAnyClub(player) {
  try {
    const all = window.ALL_CLUBS || window.allClubs || [];
    for (const c of all) {
      if (!c || !c.team || !Array.isArray(c.team.players)) continue;
      if (
        c.team.players.find(
          (p) =>
            (p && p.id && player.id && p.id === player.id) || (p && p.name && p.name === player.name)
        )
      )
        return true;
    }
  } catch (e) {
    /* ignore */
  }
  return false;
}

// Attach helpers to global ColorUtils for legacy code that checks E.ColorUtils
if (typeof window !== 'undefined') {
  window.Elifoot = window.Elifoot || {};
  window.Elifoot.ColorUtils = window.Elifoot.ColorUtils || {};
  // only set if missing to avoid overwriting existing implementations
  if (!window.Elifoot.ColorUtils.hexToRgb) window.Elifoot.ColorUtils.hexToRgb = hexToRgb;
  if (!window.Elifoot.ColorUtils.luminance) window.Elifoot.ColorUtils.luminance = luminance;
  if (!window.Elifoot.ColorUtils.getReadableTextColor)
    window.Elifoot.ColorUtils.getReadableTextColor = getReadableTextColor;
}
