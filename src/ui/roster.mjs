// ES module POC: extracted renderTeamRoster
// This module is conservative: it references window globals when available
// and attaches itself to `window.Elifoot.Hub.renderTeamRoster` for backwards compatibility.
import {
  hexToRgb,
  luminance,
  getReadableTextColor,
  normalizePosition,
  avgSkill,
} from './helpers.mjs';

function showRenewContractMenu(player, club, minDemanded, formatMoneyFn, renderTeamRosterFn) {
  const overlayId = 'renew-contract-overlay';
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
    overlay.style.background = 'rgba(0,0,0,0.7)';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'subs-panel transfer-overlay-root';
  box.style.padding = '24px';
  box.style.background = '#2e2e2e';
  box.style.color = '#fff';
  box.style.borderRadius = '10px';
  box.style.boxShadow = '0 10px 40px rgba(0,0,0,0.8)';
  box.style.maxWidth = '420px';
  
  const html = `
        <h3 style="margin-top:0; color:#ffeb3b; font-size:1.3em;">Renovação de Contrato</h3>
        <div style="margin-top:8px;font-weight:700;font-size:1.1em;">${player.name} <span style="font-weight:500;opacity:0.85">(${player.position || ''})</span></div>
        <div style="margin-top:12px; font-size:0.95em;">O jogador exige um salário mínimo mensal de <strong style="color:#8BC34A;">${formatMoneyFn(minDemanded)}</strong>.</div>
        <div style="margin-top:16px;display:flex;gap:8px;align-items:center;">
          <label style="min-width:120px; color:#ccc;">Salário a propor:</label>
          <input id="renewSalaryInput" type="number" min="${minDemanded}" value="${minDemanded}" style="width:150px;padding:8px;border-radius:6px;border:1px solid #555;background:#111;color:#fff;font-size:1.05em;font-weight:bold;" />
        </div>
        <div style="margin-top:24px;display:flex;justify-content:flex-end;gap:12px;">
          <button id="renewCancelBtn" style="padding:10px 16px;border-radius:6px;border:none;background:#555;color:#fff;cursor:pointer;font-weight:bold;transition:background 0.2s;">Cancelar</button>
          <button id="renewConfirmBtn" style="padding:10px 16px;border-radius:6px;border:none;background:#4CAF50;color:#fff;cursor:pointer;font-weight:bold;transition:background 0.2s;">Propor Contrato</button>
        </div>`;
  box.innerHTML = html;
  overlay.appendChild(box);

  setTimeout(() => {
    const cancel = document.getElementById('renewCancelBtn');
    const confirm = document.getElementById('renewConfirmBtn');
    const salaryIn = document.getElementById('renewSalaryInput');
    
    if (cancel) cancel.addEventListener('click', () => {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });
    
    if (confirm) confirm.addEventListener('click', () => {
      const proposed = Math.max(1, Math.round(Number(salaryIn.value) || 0));
      if (proposed >= minDemanded) {
         player.salary = proposed;
         player.contractYears = 1;
         player.contractYearsLeft = 1;
         alert(`${player.name} aceitou a proposta de ${formatMoneyFn(proposed)} e renovou por 1 época!`);
         if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
         renderTeamRosterFn(club); 
      } else {
         alert(`${player.name} recusou a sua proposta! O valor oferecido é demasiado baixo.`);
         if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }
    });
  }, 10);
}

export function renderTeamRoster(club) {
  try {
    const formatMoney =
      (window.FootLab && window.FootLab.formatMoney) || window.formatMoney || ((v) => String(v));
    const content = document.getElementById('hub-main-content');
    if (!content) return;
    if (!club || !club.team || !club.team.players || club.team.players.length === 0) {
      content.innerHTML = '<h2>ERRO</h2><p>Equipa não tem jogadores!</p>';
      return;
    }
    const teamBg = (club.team && club.team.bgColor) || '#2e2e2e';
    let teamFg = getReadableTextColor(teamBg, (club.team && club.team.color) || '#ffffff');
    try {
      const c = luminance(hexToRgb(teamBg));
      if (c < 0.18) teamFg = '#fff';
    } catch (e) {
      /* ignore */
    }

    const players = Array.isArray(club.team.players) ? club.team.players.slice() : [];

    const enriched = players.map((p) =>
      Object.assign({}, p, { _normPos: normalizePosition(p.position || p.pos) })
    );
    enriched.sort((a, b) => {
      const order = { GK: 1, CB: 2, LB: 2, RB: 2, DF: 2, CM: 3, LW: 3, RW: 3, ST: 4 };
      const posA = order[a._normPos] || 5;
      const posB = order[b._normPos] || 5;
      if (posA !== posB) return posA - posB;
      return (b.skill || 0) - (a.skill || 0);
    });

    const groups = { GK: [], DEF: [], MID: [], ATT: [] };
    enriched.forEach((p) => {
      const np = p._normPos || normalizePosition(p.position || p.pos);
      if (np === 'GK') groups.GK.push(p);
      else if (np === 'CB' || np === 'LB' || np === 'RB' || np === 'DF') groups.DEF.push(p);
      else if (np === 'CM' || np === 'LW' || np === 'RW' || np === 'AM' || np === 'DM')
        groups.MID.push(p);
      else if (np === 'ST') groups.ATT.push(p);
      else groups.MID.push(p);
    });

    const groupLabels = { GK: 'Guarda-redes', DEF: 'Defesas', MID: 'Médios', ATT: 'Avançados' };
    let html = `<div class="players-cards" style="color:${teamFg};">`;
    const playerNameColor = teamFg;
    ['GK', 'DEF', 'MID', 'ATT'].forEach((k) => {
      const list = groups[k];
      if (!list || list.length === 0) return;
      html += `<div class="player-group">`;
      // Render a single group title for all lanes of this position
      html += `<h4 class="lane-title" style="margin:6px 0 8px 0;">${groupLabels[k]} (${list.length})</h4>`;
      // Render all players into a single wrapping container; CSS will ensure 5 per visual row
      html += `<div class="lane-slots" data-pos="${k}">`;
      (list || []).forEach((p) => {
        const skill = p.skill || 0;
        const barColor =
          skill >= 80 ? '#4CAF50' : skill >= 70 ? '#8BC34A' : skill >= 60 ? '#FFC107' : '#F44336';
        const salary = p.salary || 0;
        const contractLeft =
          typeof p.contractYearsLeft !== 'undefined'
            ? p.contractYearsLeft
            : typeof p.contractYears !== 'undefined'
              ? p.contractYears
              : 0;
        // Jogadores com contrato têm o * à frente. Jogadores sem contrato não têm nada.
        const contractMarker = Number(contractLeft) > 0 ? '*' : '';
        const displayPos = p._normPos || p.position || p.pos || '';
        html += `<div class="hub-box player-box" data-player-id="${p.id}">
                  <div class="player-header-row">
                    <div class="player-pos">${displayPos}</div>
                    <div class="player-name">${p.name}</div>
                  </div>
                  <div class="skill-bar"><div class="skill-fill" style="width:${skill}%;background:${barColor};"></div></div>
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.92em;">
                    <div style="font-weight:700;color:rgba(255,255,255,0.9);">${skill}</div>
                    <div class="player-salary" data-player-id="${p.id}">${formatMoney(salary)} <span style="color:#ffeb3b;font-weight:bold;">${contractMarker}</span></div>
                  </div>
                </div>`;
      });
      html += `</div>`; // .lane-slots
      html += `</div>`; // .player-group
    });
    html += `</div>`;
    // debug: log group counts so we can verify max-5-per-lane behavior in renderer logs
    try {
      const counts = {
        GK: (groups.GK || []).length,
        DEF: (groups.DEF || []).length,
        MID: (groups.MID || []).length,
        ATT: (groups.ATT || []).length,
      };
      console.debug('renderTeamRoster: groupCounts=', counts, 'displayedPerGroup=5');
    } catch (e) {
      /* ignore */
    }

    content.innerHTML = `<div class="hub-box team-roster-grid" style="color:${teamFg};"><h2 class="team-roster-title">PLANTEL (${enriched.length} jogadores)</h2>${html}</div>`;

    // attach handlers
    setTimeout(() => {
      try {
        const rowEls = content.querySelectorAll('.player-box');
        rowEls.forEach((r) => {
          r.replaceWith(r.cloneNode(true));
        });
        const freshRows = content.querySelectorAll('.player-box');
        freshRows.forEach((r) => {
          const pid = Number(r.dataset.playerId);
          const player = club.team && Array.isArray(club.team.players) ? club.team.players.find((p) => p.id === pid) : null;
          if (!player) return;
          
          const contractLeft = typeof player.contractYearsLeft !== 'undefined' ? player.contractYearsLeft : (player.contractYears || 0);
          const hasContract = Number(contractLeft) > 0;
          
          // Cursor e hint baseados no estado do contrato
          if (hasContract) {
            r.style.cursor = 'default';
            r.title = 'Jogador com contrato ativo.';
          } else {
            r.style.cursor = 'pointer';
            r.title = 'Sem contrato! Clique para negociar.';
          }

          r.addEventListener('click', (ev) => {
            if (hasContract) return; // Nada acontece se tiver contrato
            
            // Calcular salário mínimo exigido para renovação (Aumento percentual)
            const currentSalary = Number(player.salary || 300);
            const skillLvl = Number(player.skill || 40);
            
            // Aumento percentual justo: entre 5% (skill baixa) e 25% (skill alta)
            const raisePercentage = 0.05 + ((skillLvl / 100) * 0.20);
            let minDemanded = Math.round(currentSalary * (1 + raisePercentage));
            
            // Arredondar para a dezena mais próxima (ex: 342 -> 350)
            minDemanded = Math.ceil(minDemanded / 10) * 10;
            
            // Piso mínimo absoluto para garantir que não há valores absurdamente baixos
            const absoluteMin = Math.max(300, Math.round(skillLvl * 8)); 
            minDemanded = Math.max(minDemanded, absoluteMin);
              
            // Abre a janela personalizada de renovação
            showRenewContractMenu(player, club, minDemanded, formatMoney, renderTeamRoster);
          });
        });
      } catch (e) {
        try {
          const L = (window.FootLab && window.FootLab.Logger) || console;
          L.warn && L.warn('Failed to attach negotiation handlers', e);
        } catch (_) {
          /* ignore */
        }
      }
    }, 10);

    // create floating opponent box if available
    const createFloatingOpponentBox =
      (window.FootLab && window.FootLab.Hub && window.FootLab.Hub.createFloatingOpponentBox) ||
      window.createFloatingOpponentBox;
    try {
      if (typeof createFloatingOpponentBox === 'function') createFloatingOpponentBox(teamFg);
    } catch (e) {
      /* ignore */
    }
  } catch (e) {
    try {
      const L = (window.FootLab && window.FootLab.Logger) || console;
      L.warn && L.warn('renderTeamRoster failed', e);
    } catch (_) {
      /* ignore */
    }
  }
}

// Attach to global namespace for backwards compat when loaded as a script
if (typeof window !== 'undefined') {
  window.FootLab = window.FootLab || {};
  window.FootLab.Hub = window.FootLab.Hub || {};
  window.FootLab.Hub.renderTeamRoster = window.FootLab.Hub.renderTeamRoster || renderTeamRoster;
  // Backwards compat
  window.Elifoot = window.Elifoot || window.FootLab;
}