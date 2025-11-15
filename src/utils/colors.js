// utils/colors.js - shared color/contrast helpers
(function () {
  function hexToRgb(hex) {
    if (!hex) return null;
    const h = hex.replace('#', '').trim();
    if (h.length === 3) {
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
    }
    if (h.length === 6) {
      return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
      ];
    }
    return null;
  }
  function luminance(rgb) {
    if (!rgb) return 0;
    const s = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  }
  function getReadableTextColor(bgHex, preferredHex) {
    const bgRgb = hexToRgb(bgHex || '#000');
    const prefRgb = hexToRgb(preferredHex || '#fff');
    const Lbg = luminance(bgRgb);
    function contrast(L1, L2) {
      return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    }
    const prefLum = luminance(prefRgb);
    if (contrast(Lbg, prefLum) >= 4.5) return preferredHex;
    const whiteContrast = contrast(Lbg, 1);
    const blackContrast = contrast(Lbg, 0);
    return whiteContrast >= blackContrast ? '#fff' : '#000';
  }
  // simple memo
  const _memo = new Map();
  function getReadableCached(bg, pref) {
    const key = bg + '|' + pref;
    if (_memo.has(key)) return _memo.get(key);
    const val = getReadableTextColor(bg, pref);
    _memo.set(key, val);
    return val;
  }
  function hslToHex(h, s, l) {
    // h: 0..360, s: 0..100, l: 0..100
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  // export to window when available and to CommonJS for tests
  try {
    if (typeof window !== 'undefined' && window) {
      window.ColorUtils = {
        hexToRgb,
        luminance,
        getReadableTextColor,
        getReadableCached,
        hslToHex,
      };
    }
  } catch (e) {
    /* ignore */
  }
  try {
    if (typeof module !== 'undefined' && module.exports)
      module.exports = { hexToRgb, luminance, getReadableTextColor, getReadableCached, hslToHex };
  } catch (e) {
    /* ignore */
  }
})();
