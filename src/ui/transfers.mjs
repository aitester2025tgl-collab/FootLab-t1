// ES module POC for transfers UI (extracted from `ui/hub.js`).
// Conservative: uses window globals (formatMoney, renderTeamRoster) and attaches to window.Elifoot.Hub for backwards compat.
import { isPlayerInAnyClub } from './helpers.mjs';

export function renderTransfers() {
  try {
    const content = document.getElementById('hub-main-content');
    if (!content) return;
    const market = window.transferMarket || window.availableTransfers || window.transferList || [];
    const rawFreeAgents = window.FREE_TRANSFERS || window.freeAgents || [];
    const freeAgents = Array.isArray(rawFreeAgents)
      ? rawFreeAgents.filter((p) => !isPlayerInAnyClub(p))
      : [];

    if (
      (!Array.isArray(market) || market.length === 0) &&
      (!Array.isArray(freeAgents) || freeAgents.length === 0)
    ) {
      content.innerHTML = '<h2>Transferências</h2><p>Nenhum jogador disponível no mercado.</p>';
      return;
    }

    let html = `<h2>Transferências</h2><div class="hub-box" style="padding:16px;display:flex;flex-direction:column;gap:12px; border:1px solid rgba(128,128,128,0.2);">`;
    html += `<div style="display:flex; gap:6px; margin-bottom:16px; background:rgba(128,128,128,0.1); padding:6px; border-radius:10px; overflow-x:auto;">
              <button id="tab-market" style="flex:1; padding:10px 16px; border-radius:6px; border:none; background:var(--team-menu-fg, #111); color:var(--team-menu-bg, #eee); font-weight:bold; cursor:pointer; opacity:1; white-space:nowrap; transition:all 0.2s;">Mercado</button>
              <button id="tab-free" style="flex:1; padding:10px 16px; border-radius:6px; border:none; background:transparent; color:inherit; font-weight:bold; cursor:pointer; opacity:0.6; white-space:nowrap; transition:all 0.2s;">Jogadores Livres</button>
              <button id="tab-movements" style="flex:1; padding:10px 16px; border-radius:6px; border:none; background:transparent; color:inherit; font-weight:bold; cursor:pointer; opacity:0.6; white-space:nowrap; transition:all 0.2s;">Movimentos</button>
              <button id="tab-my" style="flex:1; padding:10px 16px; border-radius:6px; border:none; background:transparent; color:inherit; font-weight:bold; cursor:pointer; opacity:0.6; white-space:nowrap; transition:all 0.2s;">Meus</button>
            </div>`;
    html += `<div id="trans-tab-content" style="display:flex;flex-direction:column;gap:8px;">`;

    html += `<div data-tab="market" class="trans-tab" style="display:block;">`;
    if (Array.isArray(market) && market.length) {
      const buyer = window.playerClub || null;
      market.forEach((p) => {
        try {
          const pos = p.position || p.pos || '-';
          const name = p.name || p.playerName || '—';
          const clubObj = p.club || p.originalClubRef || null;
          const club =
            (clubObj && (clubObj.team ? clubObj.team.name : clubObj.name)) || p.clubName || 'Livre';
          const price = p.price || p.minPrice || p.value || 0;
          let isOwn = false;
          if (buyer && clubObj) {
            try {
              if (clubObj === buyer) isOwn = true;
              else if (clubObj.team && buyer.team && clubObj.team === buyer.team) isOwn = true;
              else {
                const pName = clubObj.team
                  ? clubObj.team.name
                  : clubObj.name || clubObj.clubName || '';
                const bName = buyer.team ? buyer.team.name : buyer.name || buyer.clubName || '';
                if (pName && bName && String(pName).trim() === String(bName).trim()) isOwn = true;
              }
            } catch (e) {
              isOwn = false;
            }
          }
          const btnTitle = isOwn ? 'Não é possível comprar jogadores do seu próprio clube' : '';
          const btnStyle = isOwn
            ? 'padding:10px 16px;border-radius:6px;border:none;background:rgba(128,128,128,0.5);color:inherit;cursor:not-allowed;opacity:0.7;font-weight:bold;'
            : 'padding:10px 16px;border-radius:6px;border:none;background:#4CAF50;color:#fff;font-weight:bold;cursor:pointer;transition:transform 0.2s;';
          const disabledAttr = isOwn ? 'disabled' : '';
          html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(128,128,128,0.1); border-radius:8px; border:1px solid rgba(128,128,128,0.1); margin-bottom:8px; flex-wrap:wrap; gap:12px;">
                    <div style="display:flex; gap:12px; align-items:center; flex:1; min-width:200px;">
                      <div style="width:40px; font-weight:700; text-align:center; opacity:0.8; background:rgba(128,128,128,0.2); padding:4px 0; border-radius:4px;">${pos}</div>
                      <div style="font-weight:700; font-size:1.1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;" title="${name}">${name}</div>
                      <div style="opacity:0.7; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;" title="${club}">${club}</div>
                    </div>
                    <div style="display:flex; gap:16px; align-items:center; justify-content:flex-end;">
                      <div style="font-weight:800; font-size:1.15em; opacity:0.95;">${formatMoney(price)}</div>
                      <button data-player-name="${name}" class="buy-market-btn" title="${btnTitle}" ${disabledAttr} style="${btnStyle}">${isOwn ? 'Não disponível' : 'Comprar'}</button>
                    </div>
                  </div>`;
        } catch (e) {
          const name = (p && (p.name || p.playerName)) || '—';
          html += `<div style="padding:12px;background:rgba(128,128,128,0.1);border-radius:6px;margin-bottom:8px;"><div style="font-weight:600">${name}</div></div>`;
        }
      });
    } else {
      html += `<div style="opacity:0.85;padding:8px">Nenhum item no mercado.</div>`;
    }
    html += `</div>`;

    html += `<div data-tab="free" class="trans-tab" style="display:none;">`;
    if (Array.isArray(freeAgents) && freeAgents.length) {
      freeAgents.forEach((p, idx) => {
        const pos = p.position || p.pos || '-';
        const name = p.name || p.playerName || '—';
        const prev =
          p.previousClubName ||
          (p.club && (p.club.team ? p.club.team.name : p.club.name)) ||
          p.clubName ||
          '—';
        const minContract = p.minContract || p.minMonthly || p.minSalary || 0;
        const skill = typeof p.skill === 'number' ? p.skill : p._skill || 0;
        html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(128,128,128,0.1); border-radius:8px; border:1px solid rgba(128,128,128,0.1); margin-bottom:8px; flex-wrap:wrap; gap:12px;">
                  <div style="display:flex; gap:12px; align-items:center; flex:1; min-width:250px;">
                    <div style="width:40px; font-weight:700; text-align:center; opacity:0.8; background:rgba(128,128,128,0.2); padding:4px 0; border-radius:4px;">${pos}</div>
                    <div style="font-weight:700; font-size:1.1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;" title="${name}">${name}</div>
                    <div style="opacity:0.7; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;" title="${prev}">${prev}</div>
                    <div style="background:rgba(128,128,128,0.2); padding:4px 8px; border-radius:4px; font-size:0.9em; font-weight:bold;">Skill <span style="color:var(--team-menu-fg, inherit); opacity: 0.9;">${skill}</span></div>
                  </div>
                  <div style="display:flex; gap:16px; align-items:center; justify-content:flex-end;">
                    <div style="font-weight:800; font-size:1.1em; color:#4CAF50; text-shadow:0 0 1px rgba(255,255,255,0.2);">Mín: ${formatMoney(minContract)}</div>
                    <button data-free-idx="${idx}" class="buy-free-btn" style="padding:10px 16px; border-radius:6px; border:none; background:#4CAF50; color:#fff; cursor:pointer; font-weight:bold; transition:transform 0.2s;">Assinar</button>
                  </div>
                </div>`;
      });
    } else {
      html += `<div style="opacity:0.85;padding:8px">Nenhum jogador livre disponível.</div>`;
    }
    html += `</div>`;

    // Movements tab (transfer history)
    html += `<div data-tab="movements" class="trans-tab" style="display:none;">`;
    try {
      const history = Array.isArray(window.TRANSFER_HISTORY)
        ? window.TRANSFER_HISTORY.slice().reverse()
        : [];
      if (history.length === 0) {
        html += `<div style="opacity:0.85;padding:8px">Nenhum movimento registado.</div>`;
      } else {
        history.forEach((h, i) => {
          const player = h.player || '—';
          const from = h.from || '—';
          const to = h.to || '—';
          const fee = Number(h.fee || 0);
          const salary = Number(h.salary || 0);
          const when = h.time ? new Date(Number(h.time)).toLocaleString() : '';
          html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(128,128,128,0.1); border-radius:8px; border:1px solid rgba(128,128,128,0.1); margin-bottom:8px; flex-wrap:wrap; gap:12px;">
                      <div style="display:flex; flex-direction:column; gap:6px; flex:1; min-width:200px;">
                        <div style="font-weight:700; font-size:1.1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${player}">${player}</div>
                        <div style="opacity:0.8; font-size:0.9em; font-weight:600; display:flex; gap:8px; flex-wrap:wrap;">
                          <span><strong style="opacity:0.7;">De:</strong> ${from}</span> 
                          <span>➔</span> 
                          <span><strong style="opacity:0.7;">Para:</strong> ${to}</span>
                          <span style="opacity:0.6;">· ${when}</span>
                        </div>
                      </div>
                      <div style="text-align:right; font-size:1.05em; font-weight:bold; opacity:0.95; display:flex; flex-direction:column; gap:4px;">
                        <span style="font-size: 1.1em;">${fee ? formatMoney(fee) : 'Custo Zero'}</span>
                        <span style="font-size:0.85em; opacity:0.8; color:var(--team-menu-fg, inherit);">${salary ? formatMoney(salary) + ' /mês' : ''}</span>
                      </div>
                    </div>`;
        });
      }
    } catch (e) {
      html += `<div style="opacity:0.85;padding:8px">Erro ao ler histórico de transferências.</div>`;
    }
    html += `</div>`;

    // My Players tab (transfers involving the current team)
    html += `<div data-tab="my" class="trans-tab" style="display:none;">`;
    try {
      const history = Array.isArray(window.TRANSFER_HISTORY)
        ? window.TRANSFER_HISTORY.slice().reverse()
        : [];
      const buyer = window.playerClub || {};
      const buyerName = (buyer.team && buyer.team.name) || buyer.name || '';
      const mine = history.filter((h) => {
        try {
          if (!buyerName) return false;
          return (
            String(h.from || '').trim() === String(buyerName).trim() ||
            String(h.to || '').trim() === String(buyerName).trim()
          );
        } catch (_) {
          return false;
        }
      });
      if (mine.length === 0)
        html += `<div style="opacity:0.85;padding:8px">Nenhum movimento para a sua equipa.</div>`;
      else {
        mine.forEach((h) => {
          const player = h.player || '—';
          const from = h.from || '—';
          const to = h.to || '—';
          const fee = Number(h.fee || 0);
          const salary = Number(h.salary || 0);
          const when = h.time ? new Date(Number(h.time)).toLocaleString() : '';
          html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(128,128,128,0.1); border-radius:8px; border:1px solid rgba(128,128,128,0.1); margin-bottom:8px; flex-wrap:wrap; gap:12px;">
                      <div style="display:flex; flex-direction:column; gap:6px; flex:1; min-width:200px;">
                        <div style="font-weight:700; font-size:1.1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${player}">${player}</div>
                        <div style="opacity:0.8; font-size:0.9em; font-weight:600; display:flex; gap:8px; flex-wrap:wrap;">
                          <span><strong style="opacity:0.7;">De:</strong> ${from}</span> 
                          <span>➔</span> 
                          <span><strong style="opacity:0.7;">Para:</strong> ${to}</span>
                          <span style="opacity:0.6;">· ${when}</span>
                        </div>
                      </div>
                      <div style="text-align:right; font-size:1.05em; font-weight:bold; opacity:0.95; display:flex; flex-direction:column; gap:4px;">
                        <span style="font-size: 1.1em;">${fee ? formatMoney(fee) : 'Custo Zero'}</span>
                        <span style="font-size:0.85em; opacity:0.8; color:var(--team-menu-fg, inherit);">${salary ? formatMoney(salary) + ' /mês' : ''}</span>
                      </div>
                    </div>`;
        });
      }
    } catch (e) {
      html += `<div style="opacity:0.85;padding:8px">Erro ao filtrar movimentos da equipa.</div>`;
    }
    html += `</div>`;

    html += `</div>`;
    html += `</div>`;
    content.innerHTML = html;

    setTimeout(() => {
      try {
        const tabMarket = document.getElementById('tab-market');
        const tabFree = document.getElementById('tab-free');
        const tabs = content.querySelectorAll('.trans-tab');
        const showTab = (name) => {
          tabs.forEach((t) => {
            t.style.display = t.getAttribute('data-tab') === name ? 'block' : 'none';
          });
          const allTabBtns = [tabMarket, tabFree, tabMov, tabMy].filter(Boolean);
          allTabBtns.forEach(b => {
             b.style.background = 'transparent';
             b.style.color = 'inherit';
             b.style.opacity = '0.6';
          });
          const activeBtn = name === 'market' ? tabMarket : name === 'free' ? tabFree : name === 'movements' ? tabMov : tabMy;
          if (activeBtn) {
             activeBtn.style.background = 'var(--team-menu-fg, #111)';
             activeBtn.style.color = 'var(--team-menu-bg, #eee)';
             activeBtn.style.opacity = '1';
          }
        };
        if (tabMarket) tabMarket.addEventListener('click', () => showTab('market'));
        if (tabFree) tabFree.addEventListener('click', () => showTab('free'));
        const tabMov = document.getElementById('tab-movements');
        const tabMy = document.getElementById('tab-my');
        if (tabMov) tabMov.addEventListener('click', () => showTab('movements'));
        if (tabMy) tabMy.addEventListener('click', () => showTab('my'));

        content.querySelectorAll('.buy-market-btn').forEach((b) => {
          b.addEventListener('click', () => {
            if (b.disabled) {
              const title = b.getAttribute('title') || 'Ação indisponível';
              alert(title);
              return;
            }
            const name = b.getAttribute('data-player-name');
            alert(
              'Comprar do mercado: ' +
                name +
                '. Implementar fluxo de transferência dependendo do tipo de listagem.'
            );
          });
        });

        content.querySelectorAll('.buy-free-btn').forEach((b) => {
          b.addEventListener('click', () => {
            const idx = Number(b.getAttribute('data-free-idx'));
            const freeList = Array.isArray(rawFreeAgents)
              ? rawFreeAgents.filter((p) => !isPlayerInAnyClub(p))
              : [];
            const pl = freeList[idx];
            if (!pl) return alert('Jogador livre não encontrado');
            showBuyFreePlayerMenu(pl, rawFreeAgents, idx);
          });
        });
      } catch (e) {
        try {
          const L = (window.Elifoot && window.Elifoot.Logger) || console;
          L.warn && L.warn('attach transfer handlers failed', e);
        } catch (e) {
          const L = (window.FootLab && window.FootLab.Logger) || console;
          L.warn && L.warn('attach transfer handlers failed', e);
        }
      }
    }, 10);
  } catch (e) {
    try {
      const L = (window.FootLab && window.FootLab.Logger) || console;
      L.warn && L.warn('renderTransfers failed', e);
    } catch (_) {
      /* ignore */
    }
  }
}

// Buy free player overlay (copied/adapted from original hub.js)
export function showBuyFreePlayerMenu(pl, rawFreeAgents, idxInFiltered) {
  try {
    const overlayId = 'buy-free-overlay';
    let overlay = document.getElementById(overlayId);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.style.position = 'fixed';
      overlay.style.left = '0';
      overlay.style.top = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.zIndex = '70010';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.background = 'rgba(0,0,0,0.5)';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = '';
    const box = document.createElement('div');
    // Use the standard subs-panel + transfer root classes so sizing and colors match halftime panel
    box.className = 'subs-panel transfer-overlay-root';
    box.style.background = '#2e2e2e';
    box.style.color = '#ffffff';
    box.style.padding = '30px';
    box.style.borderRadius = '12px';
    box.style.boxShadow = '0 15px 40px rgba(0,0,0,0.8)';
    box.style.border = '1px solid rgba(255,255,255,0.1)';
    const skill = pl.skill || 0;
    const minC = Math.max(0, Number(pl.minContract || pl.minMonthly || pl.minSalary || 0));
    const prev =
      pl.previousClubName ||
      (pl.club && (pl.club.team ? pl.club.team.name : pl.club.name)) ||
      pl.clubName ||
      '—';
    const html = `
          <h3 style="margin-top:0; color:#4CAF50; font-size:1.5em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">Assinar Jogador Livre</h3>
          <div style="margin-top:16px;font-weight:700;font-size:1.2em;">${pl.name} <span style="font-weight:500;opacity:0.85">(${pl.position || ''})</span></div>
          <div style="margin-top:8px;opacity:0.8;font-size:1em;">Skill: ${skill} · Clube anterior: ${prev}</div>
          <div style="margin-top:8px;font-size:1em;">Salário Mínimo: <strong style="color:#8BC34A">${formatMoney(minC)}</strong></div>
          <div style="margin-top:24px;display:flex;gap:12px;align-items:center;background:rgba(0,0,0,0.2);padding:16px;border-radius:8px;">
            <label style="min-width:120px;font-weight:bold;opacity:0.9;">Salário a Propor:</label>
            <input id="buyFreeSalaryInput" type="number" min="${minC}" value="${minC || Math.max(500, Number(pl.salary || 500))}" style="width:160px;padding:10px;border-radius:6px;border:1px solid #555;background:#111;color:#fff;font-size:1.1em;font-weight:bold;" />
          </div>
          <div style="margin-top:24px;display:flex;justify-content:flex-end;gap:12px;">
            <button id="buyFreeCancelBtn" style="padding:12px 20px;border-radius:6px;border:none;background:#555;color:#fff;font-weight:bold;cursor:pointer;">Cancelar</button>
            <button id="buyFreeConfirmBtn" style="padding:12px 20px;border-radius:6px;border:none;background:#4CAF50;color:#fff;font-weight:bold;cursor:pointer;">Assinar (1 ano)</button>
          </div>`;
    box.innerHTML = html;
    overlay.appendChild(box);

    setTimeout(() => {
      const cancel = document.getElementById('buyFreeCancelBtn');
      const confirm = document.getElementById('buyFreeConfirmBtn');
      const salaryIn = document.getElementById('buyFreeSalaryInput');
      if (cancel)
        cancel.addEventListener('click', () => {
          try {
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
          } catch (e) {
            /* ignore */
          }
        });
      if (confirm)
        confirm.addEventListener('click', () => {
          const salary = Math.max(minC, Math.round(Number(salaryIn.value || minC || 500)));
          const buyer = window.playerClub;
          if (!buyer) return alert('Nenhum clube comprador definido (playerClub).');
          const ridx = rawFreeAgents.findIndex(
            (pp) => (pp.id && pl.id && pp.id === pl.id) || (pp.name && pp.name === pl.name)
          );
          if (ridx >= 0) rawFreeAgents.splice(ridx, 1);
          const playerToAdd = Object.assign({}, pl);
          playerToAdd.salary = salary;
          playerToAdd.contractYears = 1;
          playerToAdd.contractYearsLeft = 1;
          buyer.team.players = buyer.team.players || [];
          buyer.team.players.push(playerToAdd);
          if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
          alert(
            `${pl.name} assinado por ${buyer.team.name} por ${formatMoney(salary)} /mês (1 ano).`
          );
          // re-render transfers and roster if available
          try {
            if (typeof renderTransfers === 'function') renderTransfers();
          } catch (_) {}
          try {
            if (typeof renderTeamRoster === 'function') renderTeamRoster(buyer);
          } catch (_) {}
        });
    }, 10);
  } catch (e) {
    try {
      const L = (window.FootLab && window.FootLab.Logger) || console;
      L.warn && L.warn('showBuyFreePlayerMenu failed', e);
    } catch (_) {
      /* ignore */
    }
  }
}

// Attach to global namespace for backwards compat
if (typeof window !== 'undefined') {
  window.FootLab = window.FootLab || {};
  window.FootLab.Hub = window.FootLab.Hub || {};
  window.FootLab.Hub.renderTransfers = window.FootLab.Hub.renderTransfers || renderTransfers;
  window.FootLab.Hub.showBuyFreePlayerMenu =
    window.FootLab.Hub.showBuyFreePlayerMenu || showBuyFreePlayerMenu;
  // also export globals used elsewhere
  window.renderTransfers = window.renderTransfers || renderTransfers;
  window.showBuyFreePlayerMenu = window.showBuyFreePlayerMenu || showBuyFreePlayerMenu;
  // Backwards compatibility: keep old global object available
  window.Elifoot = window.Elifoot || window.FootLab;
}
