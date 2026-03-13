// Hub controller: wiring for hub menu and default rendering.
// Delegates to modular renderers imported as ES modules, but keeps backwards-compatible globals.
import { getReadableTextColor, hexToRgb, luminance } from './helpers.mjs';
import { renderTeamRoster } from './roster.mjs';
import { renderTransfers, showBuyFreePlayerMenu } from './transfers.mjs';
import { renderFinance } from './finance.mjs';
import { initTacticPanel } from './tactics.mjs';

const FootLab = window.FootLab || window.Elifoot || window;

export function updateBudgetDisplays(club) {
  try {
    const headerBudget = document.getElementById('club-budget');
    const finBudget = document.getElementById('clubBudgetDisplay');
    const revEl = document.getElementById('club-revenue');
    const expEl = document.getElementById('club-expenses');
    const val = Number((club && (Number(club.budget) || 0)) || 0);
    if (headerBudget) headerBudget.textContent = formatMoney(val);
    if (finBudget) finBudget.textContent = formatMoney(val);
    try {
      const rev = Number((club && (Number(club.revenue) || 0)) || 0);
      const exp = Number((club && (Number(club.expenses) || 0)) || 0);
      if (revEl) revEl.textContent = formatMoney(rev);
      if (expEl) expEl.textContent = formatMoney(exp);
    } catch (e) {
      /* ignore */
    }
  } catch (e) {
    /* ignore */
  }
}

export function renderHubContent(menuId) {
  const content = document.getElementById('hub-main-content');
  if (!content) return;
  // delegate to module renderers, fallback to legacy global functions
  switch (menuId) {
    case 'menu-team':
      try {
        renderTeamRoster(window.playerClub);
      } catch (e) {
        if (typeof window.renderTeamRoster === 'function')
          window.renderTeamRoster(window.playerClub);
      }
      break;
    case 'menu-transfers':
      try {
        renderTransfers();
      } catch (e) {
        if (typeof window.renderTransfers === 'function') window.renderTransfers();
      }
      break;
    case 'menu-finance':
      try {
        renderFinance(window.playerClub);
      } catch (e) {
        if (typeof window.renderFinance === 'function') window.renderFinance(window.playerClub);
      }
      break;
    case 'menu-next-match':
      try {
        const html =
          window.Hub &&
          window.Hub.buildNextOpponentHtml &&
          typeof window.Hub.buildNextOpponentHtml === 'function'
            ? window.Hub.buildNextOpponentHtml()
            : typeof buildNextOpponentHtml === 'function'
              ? buildNextOpponentHtml()
              : '<h2>Próximo Jogo</h2>';
        content.innerHTML = `<h2>Próximo Jogo</h2><div id="nextMatchDetails">${html}</div>`;
      } catch (e) {
        content.innerHTML = '<h2>Próximo Jogo</h2><div id="nextMatchDetails">—</div>';
      }
      break;
    case 'menu-liga':
      try {
        if (typeof window.renderLeagueTable === 'function') window.renderLeagueTable();
      } catch (e) {
        /* ignore */
      }
      break;
    case 'menu-standings':
      try {
        if (typeof window.renderAllDivisionsTables === 'function')
          window.renderAllDivisionsTables();
      } catch (e) {
        /* ignore */
      }
      break;
    case 'menu-load':
      try {
        const snap =
          FootLab && FootLab.Persistence && typeof FootLab.Persistence.loadSnapshot === 'function'
            ? FootLab.Persistence.loadSnapshot()
            : (function () {
                try {
                  const raw =
                    localStorage.getItem('footlab_t1_save_snapshot') ||
                    localStorage.getItem('elifoot_save_snapshot');
                  return raw ? JSON.parse(raw) : null;
                } catch (e) {
                  return null;
                }
              })();
        if (!snap) {
          content.innerHTML = '<h2>Carregar Jogo</h2><p>Nenhum jogo salvo encontrado.</p>';
          break;
        }
        const html = `<h2>Jogo salvo</h2><div style="padding:12px;background:rgba(0,0,0,0.06);border-radius:8px;"><div><strong>Jornada:</strong> ${snap.currentJornada || '-'} </div><div><strong>Clube do jogador:</strong> ${(snap.playerClub && snap.playerClub.team && snap.playerClub.team.name) || '-'}</div><div style="margin-top:10px;"><button id="loadSavedBtn" style="padding:8px 12px;border-radius:8px;border:none;">Carregar jogo salvo</button></div></div>`;
        content.innerHTML = html;
        const btn = document.getElementById('loadSavedBtn');
        if (btn)
          btn.addEventListener('click', () => {
            if (typeof window.loadSavedGame === 'function') window.loadSavedGame();
          });
      } catch (e) {
        content.innerHTML = '<h2>Carregar Jogo</h2><p>Erro ao ler o save.</p>';
      }
      break;
    case 'save-game':
      try {
        content.innerHTML = `<h2>Gravar Jogo</h2><p>Guarde o estado atual do jogo para carregar mais tarde.</p><div style="margin-top:10px;"><button id="doSaveBtn" style="padding:8px 12px;border-radius:8px;border:none;">Gravar agora</button></div>`;
        const btn = document.getElementById('doSaveBtn');
        if (btn)
          btn.addEventListener('click', () => {
            try {
              const snap = {
                currentJornada: window.currentJornada,
                playerClub: window.playerClub,
                allDivisions: window.allDivisions,
                allClubs: window.allClubs,
                currentRoundMatches: window.currentRoundMatches,
              };
              if (
                FootLab &&
                FootLab.Persistence &&
                typeof FootLab.Persistence.saveSnapshot === 'function'
              ) {
                try {
                  FootLab.Persistence.saveSnapshot(snap);
                } catch (_) {}
              } else {
                try {
                  localStorage.setItem('footlab_t1_save_snapshot', JSON.stringify(snap));
                } catch (_) {}
                try {
                  localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
                } catch (_) {}
              }
              alert('Jogo gravado com sucesso.');
            } catch (e) {
              alert('Erro ao gravar o jogo: ' + (e && e.message));
            }
          });
      } catch (e) {
        content.innerHTML = '<h2>Gravar Jogo</h2><p>Erro ao preparar gravação.</p>';
      }
      break;
    default:
      content.innerHTML = '<h2>Bem-vindo!</h2><p>Selecione uma opção no menu.</p>';
  }
}

export function initHubUI() {
  const E = window.FootLab || window.Elifoot || window;
  try {
    const L = (E && E.Logger) || console;
    L.debug && L.debug('Initializing Hub Controller');
  } catch (_) {}

  // Apply team colors to some UI areas (minimal conservative approach)
  try {
    const hubScreen = document.getElementById('screen-hub');
    const hubMenu = document.getElementById('hub-menu');
    if (hubScreen && E.playerClub && E.playerClub.team) {
      let bg = E.playerClub.team.bgColor || '#2e2e2e';
      let fg = E.playerClub.team.color || '#ffffff';
      if (!/^#([0-9a-f]{3}){1,2}$/i.test(bg)) bg = '#2e2e2e';
      if (!/^#([0-9a-f]{3}){1,2}$/i.test(fg)) fg = '#ffffff';
      // compute luminance and adjust team colors for readability
      const bgRgb = hexToRgb(bg);
      const bgLum = luminance(bgRgb);
      // light/darken slightly (use adjustColor like archived implementation)
      const adjustColor = (hex, amt) => {
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
      };
      if (bgLum < 0.18) bg = adjustColor(bg, 32);
      if (bgLum > 0.85) bg = adjustColor(bg, -32);

      // Apply team color as the page background (archived behaviour) and derive panel bg
      hubScreen.style.backgroundImage = 'none';
      hubScreen.style.backgroundColor = bg;
      hubScreen.style.setProperty('--hub-bg', bg);
      const panelBgAdjust = bgLum < 0.35 ? 18 : -22;
      const panelBg = adjustColor(bg, panelBgAdjust);
      hubScreen.style.setProperty('--hub-panel-bg', panelBg);
      hubScreen.style.color = fg;
      if (hubMenu) {
        hubMenu.style.setProperty('--team-menu-bg', panelBg);
        hubMenu.style.setProperty('--team-menu-fg', fg);
      }
    }
  } catch (e) {
    /* ignore */
  }

  // Menu wiring
  const menuButtons = document.querySelectorAll('#hub-menu .hub-menu-btn');
  menuButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const menuId = e.target.id;
      menuButtons.forEach((b) => {
        b.classList.remove('active');
        b.style.background = 'rgba(255,255,255,0.07)';
        b.style.color = getReadableTextColor(
          (E.playerClub && E.playerClub.team && E.playerClub.team.bgColor) || '#2e2e2e',
          (E.playerClub && E.playerClub.team && E.playerClub.team.color) || '#008000'
        );
        b.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
      });
      e.target.classList.add('active');
      e.target.style.background =
        'linear-gradient(90deg, rgba(255,255,255,0.13) 0%, rgba(0,0,0,0.13) 100%)';
      e.target.style.color = getReadableTextColor(
        (E.playerClub && E.playerClub.team && E.playerClub.team.bgColor) || '#2e2e2e',
        (E.playerClub && E.playerClub.team && E.playerClub.team.color) || '#008000'
      );
      e.target.style.boxShadow = '0 6px 18px rgba(0,0,0,0.16)';
      if (menuId === 'menu-team') {
        // prefer pending releases popup before rendering team
        if (E && E.Offers && typeof E.Offers.showPendingReleasesPopup === 'function') {
          E.Offers.showPendingReleasesPopup(() => renderHubContent(menuId));
        } else {
          renderHubContent(menuId);
        }
      } else {
        renderHubContent(menuId);
      }
    });
  });

  // Default render
  const defaultBtn = document.getElementById('menu-team');
  if (defaultBtn) {
    defaultBtn.classList.add('active');
    defaultBtn.style.background =
      'linear-gradient(90deg, rgba(255,255,255,0.13) 0%, rgba(0,0,0,0.13) 100%)';
    defaultBtn.style.color = getReadableTextColor(
      (E.playerClub && E.playerClub.team && E.playerClub.team.bgColor) || '#2e2e2e',
      (E.playerClub && E.playerClub.team && E.playerClub.team.color) || '#008000'
    );
    defaultBtn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.16)';
    try {
      const hubMenu = document.getElementById('hub-menu');
      const leftCol = document.getElementById('left-column');
      if (hubMenu) hubMenu.classList.add('compact-buttons');
      if (leftCol) leftCol.classList.add('compact');
    } catch (e) {}
    renderHubContent('menu-team');
    try {
      if (typeof updateBudgetDisplays === 'function') updateBudgetDisplays(window.playerClub);
    } catch (_) {}
  }

  // Simulate button wiring (preserve previous behavior)
  const simulateBtn = document.getElementById('simulateBtnHub');
  if (
    simulateBtn &&
    ((E && typeof E.simulateDay === 'function') || typeof window.simulateDay === 'function')
  ) {
    simulateBtn.addEventListener('click', (e) => {
      // Only mark as user-initiated for trusted DOM events. This prevents
      // programmatic clicks (element.click() / dispatched events) from
      // authorizing simulation runs.
      try {
        if (typeof window !== 'undefined' && e && e.isTrusted) window.__userInitiatedSim = true;
      } catch (_) {}
      const simFn = (E && E.simulateDay) || window.simulateDay;
      if (!simFn || typeof simFn !== 'function') return;
      if (E && E.Offers && typeof E.Offers.showPendingReleasesPopup === 'function') {
        E.Offers.showPendingReleasesPopup(() => {
          try {
            simFn();
          } catch (err) {
            try {
              const L = (E && E.Logger) || console;
              L.warn && L.warn('simulateDay failed', err);
            } catch (_) {}
          }
        });
      } else {
        try {
          simFn();
        } catch (err) {
          try {
            const L = (E && E.Logger) || console;
            L.warn && L.warn('simulateDay failed', err);
          } catch (_) {}
        }
      }
      // clear the transient user flag shortly after starting so subsequent
      // programmatic calls remain blocked unless re-authorized by user action.
      try {
        setTimeout(() => {
          if (typeof window !== 'undefined') window.__userInitiatedSim = false;
        }, 500);
      } catch (_) {}
    });
  }

  // Initialize tactic panel via module
  try {
    initTacticPanel();
  } catch (e) {
    try {
      if (typeof window.initTacticPanel === 'function') window.initTacticPanel();
    } catch (_) {}
  }

  // expose for backwards-compat
  window.Hub = window.Hub || {};
  window.Hub.initHubUI = window.Hub.initHubUI || initHubUI;
  window.Hub.renderHubContent = window.Hub.renderHubContent || renderHubContent;
  window.Hub.renderTeamRoster = window.Hub.renderTeamRoster || renderTeamRoster;
  window.Hub.renderTransfers = window.Hub.renderTransfers || renderTransfers;
  window.Hub.renderFinance = window.Hub.renderFinance || renderFinance;
  window.Hub.createFloatingOpponentBox =
    window.Hub.createFloatingOpponentBox || window.Hub.createFloatingOpponentBox || function () {};

  window.FootLab = window.FootLab || window.Elifoot || {};
  window.FootLab.Hub = window.FootLab.Hub || {};
  window.FootLab.Hub.initHubUI = window.FootLab.Hub.initHubUI || initHubUI;
  window.FootLab.Hub.renderHubContent = window.FootLab.Hub.renderHubContent || renderHubContent;
  window.FootLab.Hub.renderTeamRoster = window.FootLab.Hub.renderTeamRoster || renderTeamRoster;
  window.FootLab.Hub.renderTransfers = window.FootLab.Hub.renderTransfers || renderTransfers;
  window.FootLab.Hub.renderFinance = window.FootLab.Hub.renderFinance || renderFinance;

  // compatibility alias
  window.Elifoot = window.Elifoot || window.FootLab;

  // also export globals
  window.initHubUI = window.initHubUI || initHubUI;
  window.renderHubContent = window.renderHubContent || renderHubContent;
  window.renderTeamRoster = window.renderTeamRoster || renderTeamRoster;
}

// default export not necessary but keep named exports
export default { initHubUI, renderHubContent };
