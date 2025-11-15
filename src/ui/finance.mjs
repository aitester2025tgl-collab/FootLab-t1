// ES module POC: finance panel
import { getReadableTextColor } from './helpers.mjs';

export function renderFinance(club) {
  try {
    const content = document.getElementById('hub-main-content');
    if (!content) return;
    const c = club || window.playerClub;
    if (!c) {
      content.innerHTML = '<h2>Finanças</h2><p>Nenhum clube do jogador definido.</p>';
      return;
    }
    const stadiumCap = Number(c.stadiumCapacity || c.stadium || 10000) || 10000;
    const ticketPrice = Number(c.ticketPrice || c.ticket || 20) || 20;
    const bud = Number(c.budget || 0) || 0;
    content.innerHTML = `
      <h2>Finanças</h2>
      <div style="display:flex;flex-direction:column;gap:10px;max-width:640px;">
          <div><strong>Orçamento:</strong> <span id="clubBudgetDisplay">${formatMoney(bud)}</span></div>
          <div><strong>Capacidade do Estádio (atual):</strong> <span id="stadiumCapacityDisplay">${stadiumCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span> lugares</div>
          <div><strong>Limite atual do motor:</strong> 65.000 lugares (pode expandir até 100.000)</div>
          <div style="display:flex;gap:12px;align-items:center;">
              <label style="min-width:160px;">Aumentar estádio (%)</label>
              <input id="upgradePercentInput" type="number" min="1" max="100" value="10" style="width:80px;padding:6px;border-radius:6px;border:1px solid #ccc;" />
              <button id="upgradeStadiumBtn" style="padding:8px 12px;border-radius:8px;background:#2b7; border:none; cursor:pointer;">Aumentar</button>
              <div id="upgradeCostDisplay" style="margin-left:8px;color:rgba(0,0,0,0.6)"></div>
          </div>
          <div style="display:flex;gap:12px;align-items:center;">
              <label style="min-width:160px;">Preço do bilhete (€)</label>
              <input id="ticketPriceInput" type="number" min="1" value="${ticketPrice}" style="width:100px;padding:6px;border-radius:6px;border:1px solid #ccc;" />
              <button id="setTicketBtn" style="padding:8px 12px;border-radius:8px;background:#58a; border:none; cursor:pointer;color:#fff;">Guardar</button>
              <div id="estRevenueDisplay" style="margin-left:8px;color:rgba(0,0,0,0.6)"></div>
          </div>
          <div style="opacity:0.9;font-size:0.92em;color:rgba(0,0,0,0.7);">Notas: o custo por lugar aumenta com o tamanho atual do estádio. A receita dos jogos entra no orçamento do clube após o fim de cada jogo.</div>
      </div>
    `;

    setTimeout(() => {
      try {
        const pctIn = document.getElementById('upgradePercentInput');
        const upgradeBtn = document.getElementById('upgradeStadiumBtn');
        const costDisp = document.getElementById('upgradeCostDisplay');
        const capDisp = document.getElementById('stadiumCapacityDisplay');
        const budDisp = document.getElementById('clubBudgetDisplay');
        const priceIn = document.getElementById('ticketPriceInput');
        const setTicket = document.getElementById('setTicketBtn');
        const estDisp = document.getElementById('estRevenueDisplay');

        function calcCostForPercent(pct) {
          const currentCap = Number(c.stadiumCapacity || c.stadium || 10000);
          const seatsAdded = Math.ceil(currentCap * (pct / 100));
          const costPerSeat = Math.round(20 + (currentCap / 1000) * 2);
          const total = seatsAdded * costPerSeat;
          return { seatsAdded, costPerSeat, total };
        }

        function updateCostDisplay() {
          const pct = Math.max(1, Math.min(100, Number(pctIn.value || 10)));
          const cc = calcCostForPercent(pct);
          costDisp.textContent = `${cc.seatsAdded} lugares → custo aprox. ${formatMoney(cc.total)} (${cc.costPerSeat}€/lugar)`;
          const estAttendance =
            window.Finance && typeof window.Finance.computeMatchAttendance === 'function'
              ? window.Finance.computeMatchAttendance({ homeClub: c, awayClub: {} }).attendance
              : Math.min(Number(c.stadiumCapacity || 10000), 10000);
          estDisp.textContent = estAttendance
            ? `Estimativa por jogo: ${estAttendance} espectadores → receita ~ ${formatMoney(Math.round(estAttendance * Number(priceIn.value || c.ticketPrice || 20)))} `
            : '';
        }

        pctIn.addEventListener('input', updateCostDisplay);
        priceIn.addEventListener('input', updateCostDisplay);
        updateCostDisplay();

        upgradeBtn.addEventListener('click', () => {
          const pct = Math.max(1, Math.min(100, Number(pctIn.value || 10)));
          const ccalc = calcCostForPercent(pct);
          const currentBudget = Number(c.budget || 0);
          if (ccalc.total > currentBudget) {
            alert('Orçamento insuficiente para esta expansão.');
            return;
          }
          const currentCap = Number(c.stadiumCapacity || c.stadium || 10000);
          const newCap = Math.min(100000, currentCap + ccalc.seatsAdded);
          c.stadiumCapacity = newCap;
          c.budget = currentBudget - ccalc.total;

          try {
            const snap = {
              currentJornada: window.currentJornada,
              playerClub: window.playerClub,
              allDivisions: window.allDivisions,
              allClubs: window.allClubs,
              currentRoundMatches: window.currentRoundMatches,
            };
            if (window.Elifoot && window.Elifoot.Persistence && typeof window.Elifoot.Persistence.saveSnapshot === 'function') {
              try { window.Elifoot.Persistence.saveSnapshot(snap); } catch (_) { /* ignore */ }
            } else {
              try { localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap)); } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }

          capDisp.textContent = newCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          budDisp.textContent = formatMoney(c.budget || 0);
          updateCostDisplay();
          alert(`Expansão aplicada: +${ccalc.seatsAdded} lugares (novo total ${newCap}). Custo: ${formatMoney(ccalc.total)}.`);
        });

        setTicket.addEventListener('click', () => {
          const price = Math.max(1, Math.round(Number(priceIn.value || c.ticketPrice || 20)));
          c.ticketPrice = price;
          try {
            const snap = {
              currentJornada: window.currentJornada,
              playerClub: window.playerClub,
              allDivisions: window.allDivisions,
              allClubs: window.allClubs,
              currentRoundMatches: window.currentRoundMatches,
            };
            if (window.Elifoot && window.Elifoot.Persistence && typeof window.Elifoot.Persistence.saveSnapshot === 'function') {
              try { window.Elifoot.Persistence.saveSnapshot(snap); } catch (_) { /* ignore */ }
            } else {
              try { localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap)); } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }
          alert('Preço do bilhete atualizado para ' + formatMoney(price));
          updateCostDisplay();
        });
      } catch (e) { /* ignore */ }
    }, 10);
  } catch (e) {
    try { const L = (window.Elifoot && window.Elifoot.Logger) || console; L.warn && L.warn('renderFinance failed', e); } catch (_) { /* ignore */ }
  }
}

// Attach to global namespace for backward compat
if (typeof window !== 'undefined') {
  window.Elifoot = window.Elifoot || {};
  window.Elifoot.Hub = window.Elifoot.Hub || {};
  window.Elifoot.Hub.renderFinance = window.Elifoot.Hub.renderFinance || renderFinance;
  window.renderFinance = window.renderFinance || renderFinance;
}
