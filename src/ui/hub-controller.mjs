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
        // Procurar todos os saves com o prefixo 'footlab_save_'
        const saves = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('footlab_save_')) {
            try {
              const parsed = JSON.parse(localStorage.getItem(key));
              saves.push({ key: key, name: key.replace('footlab_save_', ''), data: parsed });
            } catch(e) {}
          }
        }
        
        // Tentar também o save antigo caso exista (e não seja um duplicado)
        const oldSaveRaw = localStorage.getItem('footlab_t1_save_snapshot');
        if (oldSaveRaw) {
           try {
             const oldSaveParsed = JSON.parse(oldSaveRaw);
             if (!saves.find(s => s.name === 'Save Antigo (Automático)')) {
               saves.push({ key: 'footlab_t1_save_snapshot', name: 'Save Antigo (Automático)', data: oldSaveParsed });
             }
           } catch(e) {}
        }

        if (saves.length === 0) {
          content.innerHTML = '<h2>Carregar Jogo</h2><p>Nenhum jogo salvo encontrado.</p>';
          break;
        }
        
        let html = '<h2>Carregar Jogo</h2><p>Selecione a gravação que deseja carregar:</p><div style="display:flex; flex-direction:column; gap:10px; margin-top:15px; max-width:500px;">';
        
        saves.forEach(save => {
          html += `
            <div style="padding:12px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.05);border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <strong style="color:#ffeb3b;font-size:1.1em;">${save.name}</strong><br>
                <span style="font-size:0.85em;color:#aaa;">Jornada: ${save.data.currentJornada || '-'} | Clube: ${(save.data.playerClub && save.data.playerClub.team && save.data.playerClub.team.name) || '-'}</span>
              </div>
              <button class="load-specific-btn" data-key="${save.key}" style="padding:8px 16px;border-radius:6px;border:none;background:#2196F3;color:white;cursor:pointer;font-weight:bold;transition:background 0.2s;">Carregar</button>
            </div>
          `;
        });
        html += '</div>';
        
        content.innerHTML = html;
        
        const btns = content.querySelectorAll('.load-specific-btn');
        btns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            const key = e.target.getAttribute('data-key');
            const saveData = localStorage.getItem(key);
            
            // Copiar para a chave padrão que o código original lê
            localStorage.setItem('footlab_t1_save_snapshot', saveData);
            
            if (typeof window.loadSavedGame === 'function') {
               window.loadSavedGame();
            } else {
               alert('Carregado! Por favor faça refresh à página caso não inicie sozinho.');
            }
          });
        });
      } catch (e) {
        content.innerHTML = '<h2>Carregar Jogo</h2><p>Erro ao ler o save.</p>';
      }
      break;
    case 'save-game':
      try {
        content.innerHTML = `
          <h2>Gravar Jogo</h2>
          <p>Guarde o estado atual do jogo para carregar mais tarde.</p>
          <div style="margin-top:20px; display:flex; flex-direction:column; gap:12px; max-width:320px; background:rgba(0,0,0,0.2); padding:20px; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
            <label for="saveGameName" style="font-size:0.9em; color:#ccc;">Nome da gravação:</label>
            <input type="text" id="saveGameName" placeholder="Ex: Minha Carreira" style="padding:10px 12px; border-radius:6px; border:1px solid #444; background:#222; color:#fff; font-size:1em;">
            <button id="doSaveBtn" style="padding:12px; border-radius:6px; border:none; background:#4CAF50; color:white; cursor:pointer; font-weight:bold; font-size:1.05em; margin-top:5px;">Gravar Jogo</button>
          </div>
        `;
        const btn = document.getElementById('doSaveBtn');
        if (btn)
          btn.addEventListener('click', () => {
            try {
              const inputName = document.getElementById('saveGameName').value.trim();
              const saveName = inputName || ('Save_' + new Date().toLocaleString().replace(/[:/]/g, '-'));
              const saveKey = 'footlab_save_' + saveName;

              const snap = {
                currentJornada: window.currentJornada,
                playerClub: window.playerClub,
                allDivisions: window.allDivisions,
                allClubs: window.allClubs,
                currentRoundMatches: window.currentRoundMatches,
                seasonCalendar: window.seasonCalendar || [],
                freeTransfers: window.FREE_TRANSFERS || [],
                pendingReleases: window.PENDING_RELEASES || [],
                transferHistory: window.TRANSFER_HISTORY || [],
              };
              
              // 1. Gravar SEMPRE na chave específica com o nome do save:
              try {
                localStorage.setItem(saveKey, JSON.stringify(snap));
              } catch (_) {}

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
                  // Gravar também no auto-save original por garantia
                  localStorage.setItem('footlab_t1_save_snapshot', JSON.stringify(snap));
                } catch (_) {}
                try {
                  localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
                } catch (_) {}
              }
              alert('Jogo gravado com sucesso com o nome: ' + saveName);
              document.getElementById('saveGameName').value = ''; // Limpar o campo após gravar
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
export function initHubUI(playerClub) {
  const E = window.FootLab || window.Elifoot || window;
  try {
    const L = (E && E.Logger) || console;
    L.debug && L.debug('Initializing Hub Controller with playerClub:', playerClub);
  } catch (_) {}


  // Store playerClub on the global namespace if it isn't already there
  if (playerClub && !E.playerClub) E.playerClub = playerClub;
  const club = E.playerClub;

  // Update coach and team name displays
  try {
    const coachNameDisplay = document.getElementById('coachNameDisplay');
    const playerTeamNameHub = document.getElementById('playerTeamNameHub');
    const playerTeamNameFooter = document.getElementById('playerTeamNameFooter');
    if (coachNameDisplay && club && club.coach) coachNameDisplay.textContent = club.coach.name;
    if (playerTeamNameHub && club && club.team) playerTeamNameHub.textContent = club.team.name;
    if (playerTeamNameFooter && club && club.team)
      playerTeamNameFooter.textContent = club.team.name;
  } catch (e) {
    /* ignore */
  }

  // Apply team colors to some UI areas (minimal conservative approach)
  try {
    const hubScreen = document.getElementById('screen-hub');
    const hubMenu = document.getElementById('hub-menu');
    if (hubScreen && club && club.team) {
      let bg = club.team.bgColor || '#2e2e2e';
      let fg = club.team.color || '#ffffff';
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
      const hubHeader = document.getElementById('hub-header');
      if (hubHeader) {
        hubHeader.style.backgroundColor = bg;
        hubHeader.style.color = getReadableTextColor(bg);
      }
      const hubFooter = document.getElementById('hub-footer-status');
      if (hubFooter) {
        hubFooter.style.backgroundColor = bg;
        hubFooter.style.color = getReadableTextColor(bg);
      }
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

  // Update finance displays
  updateBudgetDisplays(club);

  // Set default content and next opponent
  renderHubContent('menu-team');
  try {
    const opponentDetails = document.getElementById('nextOpponentDetails');
    if (opponentDetails) {
      const html =
        window.Hub &&
        window.Hub.buildNextOpponentHtml &&
        typeof window.Hub.buildNextOpponentHtml === 'function'
          ? window.Hub.buildNextOpponentHtml()
          : typeof buildNextOpponentHtml === 'function'
            ? buildNextOpponentHtml()
            : '—';
      opponentDetails.innerHTML = html;
    }
  } catch (e) {
    /* ignore */
  }

  // Initialize tactic panel
  initTacticPanel();

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

// default export not necessary but keep named exports
export default { initHubUI, renderHubContent, };