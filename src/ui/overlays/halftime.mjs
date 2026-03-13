import { hexToRgb, luminance, getReadableTextColor, normalizePosition } from '../helpers.mjs';

function getLogger() {
  return (window.FootLab && window.FootLab.Logger) || console;
}

export function showHalfTimeSubsOverlay(club, match, cb) {
  try {
    const overlay = document.getElementById('subs-overlay');
    if (!overlay) {
      if (typeof cb === 'function') cb();
      return;
    }
    // Ensure overlay is a direct child of document.body so it's not affected
    // by ancestor stacking contexts (transforms, z-index) that can push it
    // behind or cause layout shifts. Append to body if needed.
    try {
      if (overlay.parentElement !== document.body) document.body.appendChild(overlay);
    } catch (e) {
      /* ignore */
    }
    const isHome = match.homeClub === club;
    const starters = isHome ? match.homePlayers || [] : match.awayPlayers || [];
    const subs = isHome ? match.homeSubs || [] : match.awaySubs || [];
    overlay.innerHTML = '';
    // Ensure the overlay is fixed to the viewport and sits above the app.
    // Use setProperty with "important" to override any conflicting rules.
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
    } catch (e) {
      /* ignore */
    }
    // Prevent background scroll while overlay is open
    const _prevBodyOverflow = document.body.style.overflow;
    try {
      document.body.style.overflow = 'hidden';
    } catch (e) {
      /* ignore */
    }
    overlay.setAttribute('aria-hidden', 'false');
    const hubMenu = document.getElementById('hub-menu');
    const hubMenuPrev = hubMenu
      ? {
          bg: hubMenu.style.getPropertyValue('--team-menu-bg'),
          fg: hubMenu.style.getPropertyValue('--team-menu-fg'),
        }
      : null;
    let teamBg = (club && club.team && club.team.bgColor) || '#2e2e2e';
    let teamSec = (club && club.team && club.team.color) || '#ffffff';
    const fg = getReadableTextColor(teamBg, teamSec);
    const rgb = hexToRgb(teamBg) || [34, 34, 34];
    const panelBg = `linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.28)), rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.9)`;
    try {
      if (hubMenu && club && club.team) {
        hubMenu.style.setProperty('--team-menu-bg', teamBg);
        hubMenu.style.setProperty('--team-menu-fg', fg);
      }
      overlay.style.setProperty('--subs-fg', fg);
      overlay.style.setProperty('--subs-overlay-bg', 'rgba(0,0,0,0.66)');
      overlay.style.setProperty('--subs-panel-bg', panelBg);
    } catch (e) {
      /* ignore */
    }

    const panel = document.createElement('div');
    panel.className = 'subs-panel';
    panel.className = 'subs-panel';
    panel.style.color = fg;
    // allow absolutely positioned prompts inside the panel
    panel.style.position = 'relative';
    const homeGoals = typeof match.homeGoals === 'number' ? match.homeGoals : 0;
    const awayGoals = typeof match.awayGoals === 'number' ? match.awayGoals : 0;
    const scoreText = `${homeGoals} - ${awayGoals}`;
    const rawSubsForPanel = subs || [];

    panel.innerHTML = [
      `<div class="subs-header"><div class="subs-title"><div class="team-badge" style="background:${teamBg}"></div><div>Substituições ao Intervalo — <span class="subs-team-name">${club.team.name}</span></div></div><div class="subs-meta"><span class="subs-score">${scoreText}</span></div></div>`,
      `<div class="subs-body">`,
      `<div class="subs-columns">`,
      `<div class="subs-col starters-col"><h3 style="margin:0 0 8px 0;">Onze Inicial</h3><ol class="starters-list">${starters.map((p, si) => `<li data-si='${si}' data-name='${p.name}' data-pos='${p.position}'><span class="player-pos-badge">${normalizePosition(p.position)}</span><span class="player-name">${p.name}</span><span class="player-skill">${p.skill || 0}</span></li>`).join('')}</ol></div>`,
      `<div class="subs-col subs-col-right"><h3 style="margin:0 0 8px 0;">Suplentes</h3><ul class="subs-list">${rawSubsForPanel
        .map((p, idx) => {
          const cls = normalizePosition(p.position || p.pos || '') === 'GK' ? 'is-gk' : '';
          return `<li class="${cls}" data-idx='${idx}' data-name='${p.name}' data-pos='${p.position}'><span class="player-pos-badge">${normalizePosition(p.position)}</span><span class="player-name">${p.name}</span><span class="player-skill">${p.skill || 0}</span></li>`;
        })
        .join('')}</ul></div>`,
      `</div>`,
      `</div>`,
      `<div class="subs-actions">`,
      `<div id="subs-pairs" class="subs-pairs"></div>`,
      `<button id="subsBackToGameBtn" class="subs-back-btn">Voltar ao Jogo</button>`,
      `</div>`,
      `<div class="subs-footer">Regras: apenas 5 substituições; GR pode ser substituído só por GR.</div>`,
    ].join('');

    overlay.appendChild(panel);
    try {
      const teamRgb = hexToRgb(teamBg) || [34, 34, 34];
      const teamLum = luminance(teamRgb);
      const panelSurface = teamLum < 0.45 ? 'rgba(255,255,255,0.94)' : 'rgba(10,10,10,0.92)';
      const itemSurface = teamLum < 0.45 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.02)';
      const borderColor = teamLum < 0.45 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
      overlay.style.setProperty('--subs-panel-bg', panelSurface);
      panel.style.background = panelSurface;
      const panelTextColor = teamLum < 0.45 ? '#111' : '#fff';
      panel.style.color = panelTextColor;
      overlay.style.setProperty('--subs-fg', panelTextColor);
      panel.querySelectorAll('.subs-col').forEach((col) => {
        col.style.background = itemSurface;
        col.style.border = `1px solid ${borderColor}`;
        col.style.boxShadow = 'inset 0 1px 0 rgba(0,0,0,0.04)';
        col.style.color = panelTextColor;
      });
      panel.querySelectorAll('.starters-list, .subs-list').forEach((list) => {
        list.style.maxHeight = '60vh';
        list.style.overflowY = 'auto';
        list.style.margin = '0';
        list.style.padding = '6px';
        list.style.display = 'block';
      });
      const liBgFull = teamLum < 0.45 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
      panel.querySelectorAll('.subs-list li, .starters-list li').forEach((li) => {
        li.style.borderBottom = 'none';
        li.style.padding = '8px 12px';
        li.style.backgroundClip = 'padding-box';
        li.style.color = panelTextColor;
        li.style.background = liBgFull;
        li.style.borderRadius = '8px';
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.justifyContent = 'space-between';
      });
      const headerNode = panel.querySelector('h2');
      if (headerNode) headerNode.style.background = teamBg;
    } catch (e) {
      /* ignore */
    }

    setTimeout(() => {
      const backBtn = panel.querySelector('#subsBackToGameBtn');
      if (backBtn) {
        backBtn.onclick = () => {
          try {
            if (document.activeElement && typeof document.activeElement.blur === 'function')
              document.activeElement.blur();
          } catch (e) {}
          try {
            if (selectedOut && typeof selectedOut.idx === 'number' && selectedSubIdx !== null) {
              pairs.push({ outIdx: selectedOut.idx, inIdx: selectedSubIdx, applied: false });
              selectedOut = null;
              selectedSubIdx = null;
              renderPairs();
            }
            pairs.forEach((pr, idx) => {
              try {
                if (!pr.applied) applyPair(idx);
              } catch (e) {
                /* ignore */
              }
            });
          } catch (e) {
            try {
              const L = getLogger();
              L.warn && L.warn('Error auto-applying substitutions on close', e);
            } catch (_) {}
          }

          if (hubMenu && hubMenuPrev) {
            if (hubMenuPrev.bg) hubMenu.style.setProperty('--team-menu-bg', hubMenuPrev.bg);
            if (hubMenuPrev.fg) hubMenu.style.setProperty('--team-menu-fg', hubMenuPrev.fg);
          }
          // hide overlay and restore body scroll
          overlay.style.display = 'none';
          overlay.setAttribute('aria-hidden', 'true');
          try {
            document.body.style.overflow = _prevBodyOverflow || '';
          } catch (e) {
            /* ignore */
          }
          if (typeof cb === 'function') cb();
        };
      }
    }, 0);

    const pairsContainer = panel.querySelector('#subs-pairs');
    let selectedOut = null;
    let selectedSubIdx = null;
    const pairs = [];

    const renderLists = function () {
      const startersHtml = (isHome ? match.homePlayers : match.awayPlayers)
        .map(
          (p, si) =>
            `<li data-si="${si}" data-name="${p.name}" data-pos="${normalizePosition(p.position)}"><span class="player-pos-badge">${normalizePosition(p.position)}</span> <span class="player-name">${p.name}</span> <span class="player-skill">(skill: ${p.skill || 0})</span></li>`
        )
        .join('');
      const rawSubs = isHome ? match.homeSubs || [] : match.awaySubs || [];
      const subsHtml = rawSubs
        .map((p, idx) => {
          const cls = normalizePosition(p.position || p.pos || '') === 'GK' ? 'is-gk' : '';
          return `<li class="${cls}" data-idx="${idx}" data-name="${p.name}" data-pos="${p.position}"><span class="player-pos-badge">${normalizePosition(p.position)}</span> <span class="player-name">${p.name}</span> <span class="player-skill">(skill: ${p.skill || 0})</span></li>`;
        })
        .join('');
      const startersCol = panel.querySelector('.starters-col .starters-list');
      const subsCol = panel.querySelector('.subs-col-right .subs-list');
      if (startersCol) startersCol.innerHTML = startersHtml;
      if (subsCol) subsCol.innerHTML = subsHtml;
      attachListHandlers();
    };

    const renderPairs = function () {
      pairsContainer.innerHTML = `<strong>Trocas:</strong><ul>${pairs
        .map((pr, i) => {
          const out = (isHome ? match.homePlayers : match.awayPlayers)[pr.outIdx] || {
            name: '-',
            position: '',
          };
          const incoming = (isHome ? match.homeSubs : match.awaySubs)[pr.inIdx] || {
            name: '-',
            position: '',
          };
          const appliedCls = pr.applied ? 'applied' : '';
          const statusNode = pr.applied
            ? `<button disabled>aplicada</button>`
            : `<span class="pending">pendente</span>`;
          return `<li class="${appliedCls}" data-pair="${i}">${normalizePosition(out.position)} ${out.name} → ${normalizePosition(incoming.position)} ${incoming.name} ${statusNode} <button data-remove="${i}">remover</button></li>`;
        })
        .join('')}</ul>`;
      pairsContainer.querySelectorAll('button[data-remove]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const idx = Number(btn.getAttribute('data-remove'));
          const pr = pairs[idx];
          if (!pr) return;
          const outNode = panel.querySelector(`.starters-list li[data-si="${pr.outIdx}"]`);
          const inNode = panel.querySelector(`.subs-list li[data-idx="${pr.inIdx}"]`);
          if (outNode) outNode.classList.remove('paired');
          if (inNode) inNode.classList.remove('paired');
          pairs.splice(idx, 1);
          renderPairs();
          const MAX_SUBS =
            (window.FootLab &&
              window.FootLab.GameConfig &&
              window.FootLab.GameConfig.rules &&
              window.FootLab.GameConfig.rules.maxSubs) ||
            5;
          if (pairs.length < MAX_SUBS) {
            panel
              .querySelectorAll('.starters-list li.disabled')
              .forEach((n) => n.classList.remove('disabled'));
            panel
              .querySelectorAll('.subs-list li.disabled')
              .forEach((n) => n.classList.remove('disabled'));
          }
        });
      });
    };

    const attachListHandlers = function () {
      panel.querySelectorAll('.starters-list li').forEach((n) => {
        n.classList.remove('paired');
        n.classList.remove('disabled');
      });
      panel.querySelectorAll('.subs-list li').forEach((n) => {
        n.classList.remove('paired');
        n.classList.remove('disabled');
      });
      panel.querySelectorAll('.subs-list li').forEach((n) => n.classList.remove('selected-out'));
      if (selectedOut && typeof selectedOut.idx === 'number') {
        panel
          .querySelectorAll('.starters-list li')
          .forEach((n) => n.classList.remove('selected-out'));
        const outNode = panel.querySelector(`.starters-list li[data-si="${selectedOut.idx}"]`);
        if (outNode) outNode.classList.add('selected-out');
      }
      const startersNodes = panel.querySelectorAll('.starters-list li');
      const subsNodes = panel.querySelectorAll('.subs-list li');
      const maybeShowConfirm = function () {
        if (selectedOut && typeof selectedOut.idx === 'number' && selectedSubIdx !== null) {
          const out = selectedOut.player;
          const inIdx = selectedSubIdx;
          const incoming = (isHome ? match.homeSubs : match.awaySubs)[inIdx];
          const ENFORCE_GK_ONLY =
            (window.FootLab &&
              window.FootLab.GameConfig &&
              window.FootLab.GameConfig.rules &&
              window.FootLab.GameConfig.rules.enforceGkOnlySwap) !== false;
          if (ENFORCE_GK_ONLY) {
            if (out.position === 'GK' && incoming.position !== 'GK') {
              const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
              if (subNode) {
                subNode.classList.add('invalid-swap');
                setTimeout(() => subNode.classList.remove('invalid-swap'), 400);
              }
              return;
            }
            if (incoming.position === 'GK' && out.position !== 'GK') {
              const teamPlayers = isHome ? match.homePlayers || [] : match.awayPlayers || [];
              const hasSentOffGk = teamPlayers.some(
                (p) => p && p.sentOff && String(p.position || '').toUpperCase() === 'GK'
              );
              if (!hasSentOffGk) {
                const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
                if (subNode) {
                  subNode.classList.add('invalid-swap');
                  setTimeout(() => subNode.classList.remove('invalid-swap'), 400);
                }
                return;
              }
            }
          }
          const confirmDiv = document.createElement('div');
          confirmDiv.className = 'subs-confirm-prompt';
          // position the prompt fixed to the viewport and attach it to the overlay
          // so it won't be clipped by the panel's scrolling container.
          confirmDiv.style.position = 'fixed';
          confirmDiv.style.left = '50%';
          confirmDiv.style.top = '50%';
          confirmDiv.style.transform = 'translate(-50%, -50%)';
          confirmDiv.style.minWidth = '320px';
          confirmDiv.style.maxWidth = '90%';
          confirmDiv.style.background = panel.style.background || teamBg;
          confirmDiv.style.color = panel.style.color || fg;
          confirmDiv.style.padding = '20px 18px';
          confirmDiv.style.borderRadius = '12px';
          confirmDiv.style.boxShadow = '0 6px 28px rgba(0,0,0,0.45)';
          confirmDiv.style.zIndex = '2147483650';
          confirmDiv.style.textAlign = 'center';
          confirmDiv.innerHTML = `<div>
                    <h3 style="margin:0 0 8px 0">Confirmar Substituição?</h3>
                    <div style='margin:8px 0;font-size:1.05em;'>${out.position} <b>${out.name}</b> → ${incoming.position} <b>${incoming.name}</b></div>
                    <div style="display:flex;gap:12px;justify-content:center;margin-top:12px;"><button id="subsDoConfirmBtn" style="padding:8px 14px;border-radius:8px;">Confirmar</button>
                    <button id="subsDoCancelBtn" style="padding:8px 14px;border-radius:8px;">Cancelar</button></div>
                  </div>`;
          // append confirm prompt to the overlay (viewport-level) to avoid clipping
          try {
            overlay.appendChild(confirmDiv);
          } catch (e) {
            panel.appendChild(confirmDiv);
          }
          confirmDiv.querySelector('#subsDoConfirmBtn').onclick = () => {
            try {
              const outNode = panel.querySelector(
                `.starters-list li[data-si="${selectedOut.idx}"]`
              );
              const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
              if (outNode) outNode.classList.add('paired');
              if (subNode) subNode.classList.add('paired');
              pairs.push({ outIdx: selectedOut.idx, inIdx, applied: false });
              const pairIndex = pairs.length - 1;
              applyPair(pairIndex);
              const MAX_SUBS =
                (window.FootLab &&
                  window.FootLab.GameConfig &&
                  window.FootLab.GameConfig.rules &&
                  window.FootLab.GameConfig.rules.maxSubs) ||
                5;
              if (pairs.length >= MAX_SUBS) {
                panel
                  .querySelectorAll('.starters-list li:not(.paired)')
                  .forEach((n) => n.classList.add('disabled'));
                panel
                  .querySelectorAll('.subs-list li:not(.paired)')
                  .forEach((n) => n.classList.add('disabled'));
              }
            } catch (err) {
              try {
                const L = getLogger();
                L.warn && L.warn('Error applying substitution on confirm', err);
              } catch (_) {}
            } finally {
              try {
                if (confirmDiv && confirmDiv.parentNode)
                  confirmDiv.parentNode.removeChild(confirmDiv);
              } catch (_) {}
              selectedOut = null;
              selectedSubIdx = null;
              panel
                .querySelectorAll('.starters-list li')
                .forEach((n) => n.classList.remove('selected-out'));
            }
          };
          confirmDiv.querySelector('#subsDoCancelBtn').onclick = () => {
            try {
              if (confirmDiv && confirmDiv.parentNode)
                confirmDiv.parentNode.removeChild(confirmDiv);
            } catch (_) {}
            selectedSubIdx = null;
          };
        }
      };

      startersNodes.forEach((node) => {
        node.addEventListener('click', () => {
          const si = Number(node.getAttribute('data-si'));
          if (node.classList.contains('disabled') || node.classList.contains('paired')) return;
          if (selectedOut && selectedOut.idx === si) {
            node.classList.remove('selected-out');
            selectedOut = null;
            return;
          }
          panel
            .querySelectorAll('.starters-list li')
            .forEach((n) => n.classList.remove('selected-out'));
          panel
            .querySelectorAll('.subs-list li')
            .forEach((n) => n.classList.remove('selected-out'));
          node.classList.add('selected-out');
          selectedOut = { idx: si, player: (isHome ? match.homePlayers : match.awayPlayers)[si] };
          maybeShowConfirm();
        });
      });

      subsNodes.forEach((node) => {
        node.addEventListener('click', () => {
          if (node.classList.contains('disabled') || node.classList.contains('paired')) return;
          if (!selectedOut) return;
          const inIdx = Number(node.getAttribute('data-idx'));
          selectedSubIdx = inIdx;
          maybeShowConfirm();
        });
      });
    };

    function applyPair(pairIndex) {
      const pr = pairs[pairIndex];
      if (!pr || pr.applied) return;
      const outIdx = pr.outIdx;
      const inIdx = pr.inIdx;
      if (isHome) {
        const outPlayer = match.homePlayers[outIdx];
        const incoming = match.homeSubs[inIdx];
        if (outPlayer && incoming) {
          match.homePlayers[outIdx] = incoming;
          const sidx = match.homeSubs.findIndex((s) => s.name === incoming.name);
          if (sidx >= 0) match.homeSubs.splice(sidx, 1);
          match.homeSubs.push(outPlayer);
        }
      } else {
        const outPlayer = match.awayPlayers[outIdx];
        const incoming = match.awaySubs[inIdx];
        if (outPlayer && incoming) {
          match.awayPlayers[outIdx] = incoming;
          const sidx = match.awaySubs.findIndex((s) => s.name === incoming.name);
          if (sidx >= 0) match.awaySubs.splice(sidx, 1);
          match.awaySubs.push(outPlayer);
        }
      }
      try {
        if (
          window.FootLab &&
          window.FootLab.Lineups &&
          typeof window.FootLab.Lineups.reorderMatchByRoster === 'function'
        )
          window.FootLab.Lineups.reorderMatchByRoster(club, match, isHome);
      } catch (e) {}
      pr.applied = true;
      renderLists();
      renderPairs();
      try {
        if (typeof window.updateMatchBoardLine === 'function' && typeof match.index !== 'undefined')
          window.updateMatchBoardLine(match.index, match);
      } catch (e) {}
    }

    renderLists();
    renderPairs();
  } catch (e) {
    try {
      const L = getLogger();
      L.warn && L.warn('showHalfTimeSubsOverlay failed', e);
    } catch (_) {}
    if (typeof cb === 'function') cb();
  }
}
