// ui.js — lightweight compatibility shim
/* eslint-disable no-empty */
// Purpose: expose legacy global functions but delegate heavy work to extracted modules
// (ui/hub.js, ui/matchBoard.js, ui/overlays.js, ui/tactics.js). Keep this file small.

(function () {
  'use strict';

  // Color helpers - use the centralized `window.ColorUtils` implementation.
  // Keep tiny fallback behavior so the UI doesn't throw if ColorUtils isn't present.
  function hexToRgb(hex) {
    if (window.ColorUtils && typeof window.ColorUtils.hexToRgb === 'function')
      return window.ColorUtils.hexToRgb(hex);
    if (!hex) return null;
    // minimal safe parse
    const h = String(hex).replace('#', '').trim();
    if (h.length === 3)
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
    if (h.length === 6)
      return [
        parseInt(h.substr(0, 2), 16),
        parseInt(h.substr(2, 2), 16),
        parseInt(h.substr(4, 2), 16),
      ];
    return null;
  }

  function luminance(rgb) {
    if (window.ColorUtils && typeof window.ColorUtils.luminance === 'function')
      return window.ColorUtils.luminance(rgb);
    if (!rgb) return 0;
    const s = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  }

  function adjustColor(hex, amt) {
    let c = String(hex).replace('#', '');
    if (c.length === 3)
      c = c
        .split('')
        .map((x) => x + x)
        .join('');
    let num = parseInt(c, 16);
    let r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amt));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
    let b = Math.min(255, Math.max(0, (num & 0xff) + amt));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function getReadableTextColor(bgHex, preferredHex) {
    if (window.ColorUtils && typeof window.ColorUtils.getReadableTextColor === 'function')
      return window.ColorUtils.getReadableTextColor(bgHex, preferredHex);
    return preferredHex || '#ffffff';
  }

  // UI small helpers that remain here
  function updateDayProgress(minute) {
    const progress = document.getElementById('dayProgress');
    if (progress) progress.style.width = `${(minute / 90) * 100}%`;
  }

  // Overlay delegators
  function setIntroColors(club) {
    if (window.Overlays && typeof window.Overlays.setIntroColors === 'function')
      return window.Overlays.setIntroColors(club);
    const bg = (club && club.team && club.team.bgColor) || '#222';
    const fg = (club && club.team && club.team.color) || '#fff';
    const overlay = document.getElementById('intro-overlay');
    if (overlay) {
      overlay.style.setProperty('--intro-bg', bg);
      overlay.style.setProperty('--intro-fg', fg);
    }
    return { bg, fg };
  }

  function showIntroOverlay(club, cb) {
    if (window.Overlays && typeof window.Overlays.showIntroOverlay === 'function')
      return window.Overlays.showIntroOverlay(club, cb);
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) {
      if (typeof cb === 'function') cb();
      return;
    }
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        if (typeof cb === 'function') cb();
      }, 300);
    }, 1200);
  }

  function showHalfTimeSubsOverlay(club, match, cb) {
    // CRÍTICO: Aplicar as cores no elemento ANTES de qualquer delegação ou retorno
    const overlay = document.getElementById('subs-overlay');
    if (overlay && club && club.team) {
      const bg = club.team.bgColor || '#2e2e2e';
      const fg = club.team.color || '#ffffff';
      const rgb = hexToRgb(bg);
      const lum = rgb ? luminance(rgb) : 0;
      const panelBgAdjust = lum < 0.35 ? 20 : -25;
      const panelBg = adjustColor(bg, panelBgAdjust);
      
      overlay.style.setProperty('--subs-overlay-bg', `rgba(${rgb ? rgb.join(',') : '0,0,0'}, 0.8)`, 'important');
      overlay.style.setProperty('--subs-panel-bg', panelBg, 'important');
      overlay.style.setProperty('--subs-fg', fg, 'important');
    }

    if (window.Overlays && typeof window.Overlays.showHalfTimeSubsOverlay === 'function')
      return window.Overlays.showHalfTimeSubsOverlay(club, match, cb);
    if (!overlay) {
      if (typeof cb === 'function') cb();
      return;
    }
    // Defensive: ensure overlay is a direct child of document.body so it
    // cannot push page content when shown. Also force fixed positioning
    // and a very large z-index to appear above other elements.
    try {
      if (overlay.parentElement !== document.body) document.body.appendChild(overlay);
    } catch (e) {}
    try {
      overlay.style.setProperty('position', 'fixed', 'important');
      overlay.style.setProperty('left', '0', 'important');
      overlay.style.setProperty('top', '0', 'important');
      overlay.style.setProperty('width', '100vw', 'important');
      overlay.style.setProperty('height', '100vh', 'important');
      overlay.style.setProperty('z-index', '2147483647', 'important');
      overlay.style.setProperty('display', 'flex', 'important');
      overlay.style.setProperty('justify-content', 'center', 'important');
      overlay.style.setProperty('align-items', 'center', 'important');
      overlay.style.setProperty(
        'background',
        'var(--subs-overlay-bg, rgba(0,0,0,0.66))',
        'important'
      );

      // Adicionar botão de fecho se não existir
      if (!overlay.querySelector('.resume-btn')) {
        const btn = document.createElement('button');
        btn.className = 'resume-btn';
        btn.textContent = 'Retomar Simulação';
        btn.style.cssText = 'position:absolute; bottom:40px; padding:12px 24px; cursor:pointer; background:#4CAF50; color:white; border:none; border-radius:4px; font-weight:bold;';
        btn.onclick = () => {
          overlay.style.setProperty('display', 'none', 'important');
          overlay.setAttribute('aria-hidden', 'true');
          if (typeof cb === 'function') cb();
        };
        overlay.appendChild(btn);
      }
    } catch (e) {}
    overlay.setAttribute('aria-hidden', 'false');
  }

  // Delegators to the extracted modules (Hub, MatchBoard, Tactics)
  function initHubUI() {
    if (window.Hub && typeof window.Hub.initHubUI === 'function') return window.Hub.initHubUI();
  }
  function renderHubContent(menuId) {
    if (window.Hub && typeof window.Hub.renderHubContent === 'function')
      return window.Hub.renderHubContent(menuId);
  }
  function renderTeamRoster(club) {
    if (window.Hub && typeof window.Hub.renderTeamRoster === 'function')
      return window.Hub.renderTeamRoster(club);
  }
  function buildNextOpponentHtml() {
    if (window.Hub && typeof window.Hub.buildNextOpponentHtml === 'function')
      return window.Hub.buildNextOpponentHtml();
    return '<div>Sem informação.</div>';
  }
  function renderAllDivisionsTables() {
    if (window.Hub && typeof window.Hub.renderAllDivisionsTables === 'function')
      return window.Hub.renderAllDivisionsTables();
  }
  function renderLeagueTable() {
    if (window.Hub && typeof window.Hub.renderLeagueTable === 'function')
      return window.Hub.renderLeagueTable();
  }

  function initTacticPanel() {
    if (window.Tactics && typeof window.Tactics.initTacticPanel === 'function')
      return window.Tactics.initTacticPanel();
  }

  function renderInitialMatchBoard(allDivisions) {
    if (window.MatchBoard && typeof window.MatchBoard.renderInitialMatchBoard === 'function')
      return window.MatchBoard.renderInitialMatchBoard(allDivisions);
  }
  function updateMatchBoardLine(matchIndex, matchResult) {
    if (window.MatchBoard && typeof window.MatchBoard.updateMatchBoardLine === 'function')
      return window.MatchBoard.updateMatchBoardLine(matchIndex, matchResult);
  }

  // --- Game Start ---
  function startGame(playerClub) {
    // Garantir que o scroll volta ao topo para evitar o efeito de "páginas empilhadas"
    window.scrollTo(0, 0);

    // Esconder TODOS os ecrãs principais de forma absoluta para evitar sobreposições
    const screens = ['screen-setup', 'screen-match', 'screen-hub', 'intro-screen'];
    screens.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.setProperty('display', 'none', 'important');
        el.style.opacity = '0';
      }
    });

    const hubScreen = document.getElementById('screen-hub');
    if (hubScreen) {
      // Injetar CSS para corrigir as proporções e forçar a verticalidade das laterais
      let styleEl = document.getElementById('hub-layout-adjustment');
      if (styleEl) styleEl.remove(); // Limpa o anterior se existir para evitar duplicação
      
      styleEl = document.createElement('style');
      styleEl.id = 'hub-layout-adjustment';
      document.head.appendChild(styleEl);
      
      styleEl.textContent = `
        /* O Hub principal é uma linha com 3 colunas */
        #screen-hub { 
          display: flex !important; 
          flex-direction: row !important; 
          width: 100vw !important; 
          height: 100vh !important; 
          overflow: hidden !important;
        }

        /* FORÇAR VERTICALIDADE NAS LATERAIS */
        .hub-sidebar, .hub-sidebar-left, .hub-sidebar-right, #tactics-panel, .tactics-column, .sidebar {
          display: flex !important;
          flex-direction: column !important; /* Empilha os blocos verticalmente */
          flex: 0 0 220px !important; /* Largura fixa e estreita para as laterais */
          width: 220px !important;
          gap: 30px !important; /* Espaço entre o bloco do treinador e os botões */
          padding: 15px !important;
          box-sizing: border-box !important;
          overflow-y: auto !important;
          background: rgba(0,0,0,0.2);
        }

        /* O PLANTEL (MEIO) - Prioridade Total */
        #hub-main-content {
          flex: 1 !important; /* Ocupa todo o espaço que sobra */
          display: block !important;
          min-width: 0 !important;
          overflow-y: auto !important;
          padding: 20px !important;
        }

        /* Forçar que cada grupo (Treinador, Finanças, Próximo Jogo) ocupe a largura total */
        .hub-sidebar > *, .hub-sidebar-left > *, #tactics-panel > *, .tactics-column > * {
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important; /* Garante que o conteúdo dentro destes blocos também seja vertical */
          margin-bottom: 10px !important;
          flex-shrink: 0 !important;
        }
      `;

      hubScreen.style.setProperty('display', 'flex', 'important');
      hubScreen.style.setProperty('flex-direction', 'row', 'important');
      hubScreen.style.opacity = '1';
    }

    // Also initialize the hub UI if the function exists
    if (typeof initHubUI === 'function') {
      try {
        initHubUI(playerClub);
      } catch (e) {
        console.error("Error initializing hub UI:", e);
      }
    }
  }

  // Expose legacy globals for backward compatibility
  window.updateDayProgress = window.updateDayProgress || updateDayProgress;
  window.hexToRgb = window.hexToRgb || hexToRgb;
  window.luminance = window.luminance || luminance;
  window.getReadableTextColor = window.getReadableTextColor || getReadableTextColor;
  window.setIntroColors = window.setIntroColors || setIntroColors;
  window.showIntroOverlay = window.showIntroOverlay || showIntroOverlay;
  window.showHalfTimeSubsOverlay = window.showHalfTimeSubsOverlay || showHalfTimeSubsOverlay;

  window.initHubUI = window.initHubUI || initHubUI;
  window.renderHubContent = window.renderHubContent || renderHubContent;
  window.renderTeamRoster = window.renderTeamRoster || renderTeamRoster;
  window.buildNextOpponentHtml = window.buildNextOpponentHtml || buildNextOpponentHtml;
  window.renderAllDivisionsTables = window.renderAllDivisionsTables || renderAllDivisionsTables;
  window.renderLeagueTable = window.renderLeagueTable || renderLeagueTable;
  window.initTacticPanel = window.initTacticPanel || initTacticPanel;
  window.renderInitialMatchBoard = window.renderInitialMatchBoard || renderInitialMatchBoard;
  window.updateMatchBoardLine = window.updateMatchBoardLine || updateMatchBoardLine;

  // Expose the newly added startGame function globally so main.js can call it.
  window.startGame = window.startGame || startGame;
})();