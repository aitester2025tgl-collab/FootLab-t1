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
        const endsMarker = Number(contractLeft) === 0 ? '*' : '';
        const displayPos = p._normPos || p.position || p.pos || '';
        html += `<div class="hub-box player-box" data-player-id="${p.id}">
                  <div class="player-header-row">
                    <div class="player-pos">${displayPos}</div>
                    <div class="player-name" style="color:${playerNameColor};">${p.name}</div>
                  </div>
                  <div class="skill-bar"><div class="skill-fill" style="width:${skill}%;background:${barColor};"></div></div>
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.92em;">
                    <div style="font-weight:700;color:rgba(255,255,255,0.9);">${skill}</div>
                    <div class="player-salary" data-player-id="${p.id}">${formatMoney(salary)}${endsMarker ? ' ' + endsMarker : ''}</div>
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
        const salaryEls = content.querySelectorAll('.player-salary');
        salaryEls.forEach((el) => {
          el.style.cursor = 'pointer';
          el.title = 'Clique para negociar contrato deste jogador';
          el.replaceWith(el.cloneNode(true));
        });
        const fresh = content.querySelectorAll('.player-salary');
        fresh.forEach((el) => {
          el.addEventListener('click', () => {
            const pid = Number(el.dataset.playerId);
            const player =
              club.team && Array.isArray(club.team.players)
                ? club.team.players.find((p) => p.id === pid)
                : null;
            if (!player) return alert('Jogador não encontrado');
            const current = Number(player.salary || 0);
            const proposedStr = window.prompt(
              `Negociar salário para ${player.name}\nSalário atual: ${formatMoney(current)}\nIntroduza salário mensal proposto (número):`,
              String(current)
            );
            if (proposedStr === null) return;
            const proposed = Math.max(1, Math.round(Number(proposedStr) || 0));
            const yearsStr = window.prompt(
              'Duração do contrato em anos (ex: 1 ou 0):',
              String(Number(player.contractYears || 1))
            );
            if (yearsStr === null) return;
            const years = Math.max(0, Math.min(10, Number(yearsStr) || 1));
            if (window.Finance && typeof window.Finance.negotiatePlayerContract === 'function') {
              const res = window.Finance.negotiatePlayerContract(club, pid, proposed, years);
              if (!res) return alert('Erro na negociação (resultado inválido).');
              const prob = typeof res.acceptProb === 'number' ? res.acceptProb : 0;
              if (res.accepted)
                alert(
                  `${player.name} aceitou a oferta!\nNovo salário: ${formatMoney(player.salary)}\nProbabilidade estimada: ${(prob * 100).toFixed(1)}%`
                );
              else
                alert(
                  `${player.name} rejeitou a oferta.\nProbabilidade estimada: ${(prob * 100).toFixed(1)}%`
                );
              renderTeamRoster(club);
            } else {
              alert('Serviço de negociação indisponível.');
            }
          });
        });
        const rowEls = content.querySelectorAll('.player-box');
        rowEls.forEach((r) => {
          r.style.cursor = 'pointer';
          r.title = 'Clique para negociar ou oferecer contrato';
          r.replaceWith(r.cloneNode(true));
        });
        const freshRows = content.querySelectorAll('.player-box');
        freshRows.forEach((r) => {
          r.addEventListener('click', (ev) => {
            if (ev.target && ev.target.classList && ev.target.classList.contains('player-salary'))
              return;
            const pid = Number(r.dataset.playerId);
            const player =
              club.team && Array.isArray(club.team.players)
                ? club.team.players.find((p) => p.id === pid)
                : null;
            if (!player) return;
            const showPlayerActionMenu =
              (window.FootLab && window.FootLab.Hub && window.FootLab.Hub.showPlayerActionMenu) ||
              window.showPlayerActionMenu;
            if (typeof showPlayerActionMenu === 'function') showPlayerActionMenu(player, club);
            else alert('Ação de jogador indisponível (showPlayerActionMenu).');
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
