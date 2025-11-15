// ES module POC for transfers UI (extracted from `ui/hub.js`).
// Conservative: uses window globals (formatMoney, renderTeamRoster) and attaches to window.Elifoot.Hub for backwards compat.
import { isPlayerInAnyClub } from './helpers.mjs';

export function renderTransfers() {
  try {
    const content = document.getElementById('hub-main-content');
    if (!content) return;
    const market = window.transferMarket || window.availableTransfers || window.transferList || [];
    const rawFreeAgents = window.FREE_TRANSFERS || window.freeAgents || [];
    const freeAgents = Array.isArray(rawFreeAgents) ? rawFreeAgents.filter((p) => !isPlayerInAnyClub(p)) : [];

    if ((!Array.isArray(market) || market.length === 0) && (!Array.isArray(freeAgents) || freeAgents.length === 0)) {
      content.innerHTML = '<h2>Transferências</h2><p>Nenhum jogador disponível no mercado.</p>';
      return;
    }

    let html = `<h2>Transferências</h2><div class="hub-box subs-panel" style="padding:8px;display:flex;flex-direction:column;gap:8px;">`;
    html += `<div style="display:flex;gap:8px;margin-bottom:8px;"><button id="tab-market" style="padding:6px 10px;border-radius:8px;border:none;background:#eee;color:#111;font-weight:700;">Mercado</button><button id="tab-free" style="padding:6px 10px;border-radius:8px;border:none;background:transparent;color:#aaa;font-weight:700;">Jogadores Livres</button></div>`;
    html += `<div id="trans-tab-content" style="display:flex;flex-direction:column;gap:8px;">`;

    html += `<div data-tab="market" class="trans-tab" style="display:block;">`;
    if (Array.isArray(market) && market.length) {
      const buyer = window.playerClub || null;
      market.forEach((p) => {
        try {
          const pos = p.position || p.pos || '-';
          const name = p.name || p.playerName || '—';
          const clubObj = p.club || p.originalClubRef || null;
          const club = (clubObj && (clubObj.team ? clubObj.team.name : clubObj.name)) || p.clubName || 'Livre';
          const price = p.price || p.minPrice || p.value || 0;
          let isOwn = false;
          if (buyer && clubObj) {
            try {
              if (clubObj === buyer) isOwn = true;
              else if (clubObj.team && buyer.team && clubObj.team === buyer.team) isOwn = true;
              else {
                const pName = clubObj.team ? clubObj.team.name : clubObj.name || clubObj.clubName || '';
                const bName = buyer.team ? buyer.team.name : buyer.name || buyer.clubName || '';
                if (pName && bName && String(pName).trim() === String(bName).trim()) isOwn = true;
              }
            } catch (e) {
              isOwn = false;
            }
          }
          const btnTitle = isOwn ? 'Não é possível comprar jogadores do seu próprio clube' : '';
          const btnStyle = isOwn
            ? 'padding:6px 8px;border-radius:6px;border:none;background:#9e9e9e;color:#fff;cursor:not-allowed;opacity:0.9;'
            : 'padding:6px 8px;border-radius:6px;border:none;background:#2b7;color:#fff;';
          const disabledAttr = isOwn ? 'disabled' : '';
          html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:rgba(0,0,0,0.04);border-radius:6px;">
                    <div style="display:flex;gap:10px;align-items:center;"><div style="width:36px;font-weight:700;text-align:center">${pos}</div><div style="font-weight:600">${name}</div><div style="opacity:0.8;margin-left:8px">${club}</div></div>
                    <div style="display:flex;gap:8px;align-items:center;"><div style="font-weight:700;color:#FFEB3B">${formatMoney(price)}</div><button data-player-name="${name}" class="buy-market-btn" title="${btnTitle}" ${disabledAttr} style="${btnStyle}">${isOwn ? 'Não disponível' : 'Comprar'}</button></div>
                </div>`;
        } catch (e) {
          const name = (p && (p.name || p.playerName)) || '—';
          html += `<div style="padding:6px 8px;background:rgba(0,0,0,0.02);border-radius:6px;"><div style="font-weight:600">${name}</div></div>`;
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
        const prev = p.previousClubName || (p.club && (p.club.team ? p.club.team.name : p.club.name)) || p.clubName || '—';
        const minContract = p.minContract || p.minMonthly || p.minSalary || 0;
        const skill = typeof p.skill === 'number' ? p.skill : p._skill || 0;
        html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:rgba(0,0,0,0.03);border-radius:6px;">
                    <div style="display:flex;gap:10px;align-items:center;"><div style="width:36px;font-weight:700;text-align:center">${pos}</div><div style="font-weight:600">${name}</div><div style="opacity:0.8;margin-left:8px">${prev}</div><div style="opacity:0.75;margin-left:8px;font-size:0.9em;color:#ddd">Skill: ${skill}</div></div>
                    <div style="display:flex;gap:8px;align-items:center;"><div style="font-weight:700;color:#8BC34A">Mín: ${formatMoney(minContract)}</div><button data-free-idx="${idx}" class="buy-free-btn" style="padding:6px 8px;border-radius:6px;border:none;background:#2b7;color:#fff;">Comprar</button></div>
                </div>`;
      });
    } else {
      html += `<div style="opacity:0.85;padding:8px">Nenhum jogador livre disponível.</div>`;
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
          if (name === 'market') {
            tabMarket.style.background = '#eee';
            tabMarket.style.color = '#111';
            tabFree.style.background = 'transparent';
            tabFree.style.color = '#aaa';
          } else {
            tabFree.style.background = '#eee';
            tabFree.style.color = '#111';
            tabMarket.style.background = 'transparent';
            tabMarket.style.color = '#aaa';
          }
        };
        if (tabMarket) tabMarket.addEventListener('click', () => showTab('market'));
        if (tabFree) tabFree.addEventListener('click', () => showTab('free'));

        content.querySelectorAll('.buy-market-btn').forEach((b) => {
          b.addEventListener('click', () => {
            if (b.disabled) {
              const title = b.getAttribute('title') || 'Ação indisponível';
              alert(title);
              return;
            }
            const name = b.getAttribute('data-player-name');
            alert('Comprar do mercado: ' + name + '. Implementar fluxo de transferência dependendo do tipo de listagem.');
          });
        });

        content.querySelectorAll('.buy-free-btn').forEach((b) => {
          b.addEventListener('click', () => {
            const idx = Number(b.getAttribute('data-free-idx'));
            const freeList = Array.isArray(rawFreeAgents) ? rawFreeAgents.filter((p) => !isPlayerInAnyClub(p)) : [];
            const pl = freeList[idx];
            if (!pl) return alert('Jogador livre não encontrado');
            showBuyFreePlayerMenu(pl, rawFreeAgents, idx);
          });
        });
      } catch (e) {
        try {
          const L = (window.Elifoot && window.Elifoot.Logger) || console; L.warn && L.warn('attach transfer handlers failed', e);
        } catch (_) {
          /* ignore */
        }
      }
    }, 10);
  } catch (e) {
    try { const L = (window.Elifoot && window.Elifoot.Logger) || console; L.warn && L.warn('renderTransfers failed', e); } catch (_) { /* ignore */ }
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
    box.style.maxWidth = '620px';
    box.style.width = '92%';
    box.style.background = 'var(--hub-panel-bg, #222)';
    box.style.color = '#fff';
    box.style.padding = '14px';
    box.style.borderRadius = '10px';
    const skill = pl.skill || 0;
    const minC = Math.max(0, Number(pl.minContract || pl.minMonthly || pl.minSalary || 0));
    const prev = pl.previousClubName || (pl.club && (pl.club.team ? pl.club.team.name : pl.club.name)) || pl.clubName || '—';
    const html = `
                <h3>Assinar jogador livre</h3>
                <div style="margin-top:6px;font-weight:700">${pl.name} <span style="font-weight:500;opacity:0.85">(${pl.position || ''})</span></div>
                <div style="margin-top:6px;color:rgba(255,255,255,0.85)">Skill: ${skill} · Clube anterior: ${prev} · Salário mínimo: ${formatMoney(minC)}</div>
                <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
                    <label style="min-width:120px">Salário mensal</label>
                    <input id="buyFreeSalaryInput" type="number" min="${minC}" value="${minC || Math.max(500, Number(pl.salary || 500))}" style="width:160px;padding:6px;border-radius:6px;border:1px solid #ccc;" />
                </div>
                <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:8px;">
                    <button id="buyFreeCancelBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#fff;color:#111">Cancelar</button>
                    <button id="buyFreeConfirmBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#2b7;color:#fff">Assinar (1 ano)</button>
                </div>`;
    box.innerHTML = html;
    overlay.appendChild(box);

    setTimeout(() => {
      const cancel = document.getElementById('buyFreeCancelBtn');
      const confirm = document.getElementById('buyFreeConfirmBtn');
      const salaryIn = document.getElementById('buyFreeSalaryInput');
      if (cancel) cancel.addEventListener('click', () => { try { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); } catch (e) { /* ignore */ } });
      if (confirm) confirm.addEventListener('click', () => {
        const salary = Math.max(minC, Math.round(Number(salaryIn.value || minC || 500)));
        const buyer = window.playerClub;
        if (!buyer) return alert('Nenhum clube comprador definido (playerClub).');
        const ridx = rawFreeAgents.findIndex((pp) => (pp.id && pl.id && pp.id === pl.id) || (pp.name && pp.name === pl.name));
        if (ridx >= 0) rawFreeAgents.splice(ridx, 1);
        const playerToAdd = Object.assign({}, pl);
        playerToAdd.salary = salary;
        playerToAdd.contractYears = 1;
        playerToAdd.contractYearsLeft = 1;
        buyer.team.players = buyer.team.players || [];
        buyer.team.players.push(playerToAdd);
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        alert(`${pl.name} assinado por ${buyer.team.name} por ${formatMoney(salary)} /mês (1 ano).`);
        // re-render transfers and roster if available
        try { if (typeof renderTransfers === 'function') renderTransfers(); } catch (_) {}
        try { if (typeof renderTeamRoster === 'function') renderTeamRoster(buyer); } catch (_) {}
      });
    }, 10);
  } catch (e) {
    try { const L = (window.Elifoot && window.Elifoot.Logger) || console; L.warn && L.warn('showBuyFreePlayerMenu failed', e); } catch (_) { /* ignore */ }
  }
}

// Attach to global namespace for backwards compat
if (typeof window !== 'undefined') {
  window.Elifoot = window.Elifoot || {};
  window.Elifoot.Hub = window.Elifoot.Hub || {};
  window.Elifoot.Hub.renderTransfers = window.Elifoot.Hub.renderTransfers || renderTransfers;
  window.Elifoot.Hub.showBuyFreePlayerMenu = window.Elifoot.Hub.showBuyFreePlayerMenu || showBuyFreePlayerMenu;
  // also export globals used elsewhere
  window.renderTransfers = window.renderTransfers || renderTransfers;
  window.showBuyFreePlayerMenu = window.showBuyFreePlayerMenu || showBuyFreePlayerMenu;
}
