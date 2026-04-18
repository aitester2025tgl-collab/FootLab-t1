// ES module POC: finance panel
import { getReadableTextColor } from './helpers.mjs';

export function renderFinance(club) {
  try {
    const FootLab = window.FootLab || window.Elifoot || window;
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
      <h2>Finanças do Clube</h2>
      
      <div class="hub-box" style="margin-bottom: 20px; max-width: 800px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);">
        <h3 style="margin-top:0; margin-bottom: 15px; color:#ffeb3b; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Estádio & Infraestruturas</h3>
        
        <div style="margin-bottom: 20px;">
          <div style="display:flex; justify-content: space-between;">
            <span>Capacidade Atual: <strong><span id="stadiumCapacityDisplay">${stadiumCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span> lugares</strong></span>
            <span style="color:#aaa; font-size: 0.85em;">Máx: 100.000 lugares</span>
          </div>
          <div style="width: 100%; height: 12px; background: rgba(0,0,0,0.4); border-radius: 6px; margin: 8px 0; overflow:hidden;">
            <div style="width: ${Math.min(100, (stadiumCap/100000)*100)}%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 6px; transition: width 0.3s;"></div>
          </div>
          <div style="font-size:0.85em; color:#999; margin-bottom: 12px;">O custo por lugar aumenta à medida que o estádio cresce. O limite máximo permitido pela câmara é de 100.000 lugares.</div>
          <div style="display:flex; gap:12px; align-items:center; margin-top: 12px;">
            <label style="font-size:0.9em; color:#ccc;">Expandir estádio (%):</label>
            <input id="upgradePercentInput" type="number" min="1" max="100" value="5" style="width:70px; padding:6px; border-radius:4px; border:1px solid #555; background:#222; color:#fff;" />
            <button id="upgradeStadiumBtn" style="padding:6px 12px; border-radius:4px; background:#4CAF50; color:white; border:none; cursor:pointer; font-weight:bold;">Aumentar</button>
            <span id="upgradeCostDisplay" style="font-size:0.9em; color:#bbb; margin-left:10px;"></span>
          </div>
        </div>
      </div>
      
      <div class="hub-box" style="max-width: 800px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);">
        <h3 style="margin-top:0; margin-bottom: 15px; color:#ffeb3b; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Bilheteira & Tesouraria</h3>
        <div style="font-size: 1.2em; margin-bottom: 15px;">Saldo Atual: <strong style="color:#4CAF50;" id="clubBudgetDisplay">${formatMoney(bud)}</strong></div>
        
        <div style="display:flex; gap:12px; align-items:center;">
            <label style="min-width:140px; color:#ccc;">Preço do Bilhete (€):</label>
            <input id="ticketPriceInput" type="number" min="1" value="${ticketPrice}" style="width:90px; padding:8px; border-radius:4px; border:1px solid #555; background:#222; color:#fff; font-weight:bold;" />
            <button id="setTicketBtn" style="padding:8px 16px; border-radius:4px; background:#2196F3; border:none; cursor:pointer; color:#fff; font-weight:bold;">Aplicar Novo Preço</button>
        </div>
        <div style="margin-top:8px; font-size:0.85em; color:#999;">Preços altos afastam os adeptos em jogos normais, mas jogos grandes (contra equipas de topo) suportam bilhetes mais caros!</div>
        <div id="estRevenueDisplay" style="margin-top:12px; font-size:0.95em; color:#bbb; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px;"></div>
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
          
          // Atualizar estimativa visual usando a nova lógica de preços
          const basePrice = (c.division || 4) === 1 ? 30 : (c.division || 4) === 2 ? 25 : (c.division || 4) === 3 ? 18 : 12;
          const selectedPrice = Math.max(1, Number(priceIn.value || 20));
          let priceFactor = basePrice / selectedPrice;
          priceFactor = Math.max(0.2, Math.min(1.5, priceFactor));
          
          const cap = Number(c.stadiumCapacity || 10000);
          const members = Number(c.members || Math.floor(cap * 0.5));
          
          // Assumindo um desempenho neutro (0.5) e adversário normal para a estimativa visual
          const baseFill = 0.5 * 0.7 * priceFactor;
          let estAttendance = members + Math.floor((cap - members) * baseFill);
          if (estAttendance > cap) estAttendance = cap;
          
          estDisp.innerHTML = `Estimativa Assistência (Meio da Tabela): <strong>${estAttendance.toLocaleString()} espectadores</strong><br/>
                               Estimativa Receita por Jogo: <strong style="color:#4CAF50;">${formatMoney(Math.round(estAttendance * selectedPrice))}</strong>`;
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
            if (
              FootLab &&
              FootLab.Persistence &&
              typeof FootLab.Persistence.saveSnapshot === 'function'
            ) {
              try {
                FootLab.Persistence.saveSnapshot(snap);
              } catch (_) {
                /* ignore */
              }
            } else {
              try {
                localStorage.setItem('footlab_t1_save_snapshot', JSON.stringify(snap));
              } catch (_) {}
              try {
                localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
              } catch (_) {}
            }
          } catch (e) {
            /* ignore */
          }

          capDisp.textContent = newCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          budDisp.textContent = formatMoney(c.budget || 0);
          updateCostDisplay();
          alert(
            `Expansão aplicada: +${ccalc.seatsAdded} lugares (novo total ${newCap}). Custo: ${formatMoney(ccalc.total)}.`
          );
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
            if (
              FootLab &&
              FootLab.Persistence &&
              typeof FootLab.Persistence.saveSnapshot === 'function'
            ) {
              try {
                FootLab.Persistence.saveSnapshot(snap);
              } catch (_) {
                /* ignore */
              }
            } else {
              try {
                localStorage.setItem('footlab_t1_save_snapshot', JSON.stringify(snap));
              } catch (_) {}
              try {
                localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
              } catch (_) {}
            }
          } catch (e) {
            /* ignore */
          }
          alert('Preço do bilhete atualizado para ' + formatMoney(price));
          updateCostDisplay();
        });
      } catch (e) {
        /* ignore */
      }
    }, 10);
  } catch (e) {
    try {
      const L =
        (window.FootLab && window.FootLab.Logger) ||
        (window.Elifoot && window.Elifoot.Logger) ||
        console;
      L.warn && L.warn('renderFinance failed', e);
    } catch (_) {
      /* ignore */
    }
  }
}

// Attach to global namespace for backward compat
if (typeof window !== 'undefined') {
  window.FootLab = window.FootLab || window.Elifoot || {};
  window.FootLab.Hub = window.FootLab.Hub || {};
  window.FootLab.Hub.renderFinance = window.FootLab.Hub.renderFinance || renderFinance;
  window.renderFinance = window.renderFinance || renderFinance;

  // compatibility alias
  window.Elifoot = window.Elifoot || window.FootLab;
}
