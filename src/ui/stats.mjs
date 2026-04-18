export function renderStats() {
  const content = document.getElementById('hub-main-content');
  if (!content) return;

  const allClubs = window.allClubs || [];
  const playerClub = window.playerClub;
  const myDiv = playerClub ? playerClub.division : 4;

  // 1. Agrupar e ordenar todos os jogadores pelos golos
  let allPlayers = [];
  allClubs.forEach(c => {
    if (c && c.team && Array.isArray(c.team.players)) {
      c.team.players.forEach(p => {
        if (p.goals > 0) {
          allPlayers.push({
            name: p.name,
            goals: p.goals || 0,
            clubName: c.team.name,
            clubBg: c.team.bgColor || '#333',
            clubFg: c.team.color || '#fff',
            division: c.division,
            isMine: c === playerClub
          });
        }
      });
    }
  });

  allPlayers.sort((a, b) => b.goals - a.goals);
  const globalTop10 = allPlayers.slice(0, 10);
  const divTop10 = allPlayers.filter(p => p.division === myDiv).slice(0, 10);

  // 2. Ordenar Clubes para Melhor Ataque e Defesa Global
  const sortedByAttack = [...allClubs].sort((a, b) => (b.goalsFor || 0) - (a.goalsFor || 0)).slice(0, 5);
  const sortedByDefense = [...allClubs].sort((a, b) => {
     const gaA = a.goalsAgainst || 0;
     const gaB = b.goalsAgainst || 0;
     if (gaA !== gaB) return gaA - gaB;
     return (b.goalsFor || 0) - (a.goalsFor || 0); // Desempate por golos marcados
  }).slice(0, 5);

  // Função Helper para as tabelas de Clubes
  const renderTeamList = (list, statKey, statName) => {
    let str = `<table style="width:100%; border-collapse: collapse; font-size:0.9em; text-align:left;">`;
    list.forEach((c, idx) => {
      const isMe = c === playerClub;
      const bgRow = isMe ? 'rgba(255,255,255,0.1)' : 'transparent';
      const badge = `<div style="width:14px;height:14px;border-radius:3px;background:${c.team.bgColor};border:1px solid ${c.team.color};display:inline-block;margin-right:6px;vertical-align:middle;"></div>`;
      str += `<tr style="background:${bgRow}; border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:8px 4px; color:#aaa; width:20px;">${idx+1}º</td>
                <td style="padding:8px 4px; color:#fff; font-weight:${isMe?'bold':'normal'};">${badge}${c.team.name}</td>
                <td style="padding:8px 4px; color:#ffeb3b; font-weight:bold; text-align:right;">${c[statKey] || 0}</td>
              </tr>`;
    });
    str += `</table>`;
    return str;
  };

  // Função Helper para a tabela de Jogadores
  const renderScorers = (list) => {
    if (list.length === 0) return `<div style="padding:20px; color:#888; text-align:center;">Ainda não há golos registados.</div>`;
    let str = `<table style="width:100%; border-collapse: collapse; font-size:0.95em; text-align:left; margin-top:10px;">
                 <thead><tr style="border-bottom:2px solid #444; color:#888;">
                   <th style="padding:10px 8px;">Pos</th><th style="padding:10px 8px;">Jogador</th><th style="padding:10px 8px;">Equipa</th><th style="padding:10px 8px; text-align:right;">Golos</th>
                 </tr></thead><tbody>`;
    list.forEach((p, idx) => {
      const bgRow = p.isMine ? 'rgba(255,255,255,0.1)' : 'transparent';
      const badge = `<div style="width:16px;height:16px;border-radius:3px;background:${p.clubBg};border:1px solid ${p.clubFg};display:inline-block;margin-right:8px;vertical-align:middle;"></div>`;
      str += `<tr style="background:${bgRow}; border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:10px 8px; color:#aaa; font-weight:bold;">${idx+1}º</td>
                <td style="padding:10px 8px; color:#fff; font-weight:bold;">${p.name}</td>
                <td style="padding:10px 8px; color:#bbb;">${badge}${p.clubName}</td>
                <td style="padding:10px 8px; color:#4CAF50; font-weight:bold; text-align:right; font-size:1.1em;">${p.goals}</td>
              </tr>`;
    });
    str += `</tbody></table>`;
    return str;
  };

  content.innerHTML = `
    <h2 style="margin-bottom:15px;">Estatísticas da Época</h2>
    <div style="display:flex; gap: 20px; flex-wrap: wrap;">
      
      <!-- Marcadores Box -->
      <div class="hub-box" style="flex: 2; min-width: 320px; background: rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content: space-between; align-items: center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
          <h3 style="margin:0; color:#ffeb3b;">Top 10 Marcadores</h3>
          <div style="display:flex; gap: 8px;">
            <button id="btn-tab-div" style="padding:6px 12px; background:#2196F3; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Divisão ${myDiv}</button>
            <button id="btn-tab-glob" style="padding:6px 12px; background:#444; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Global</button>
          </div>
        </div>
        <div id="scorers-table-container">${renderScorers(divTop10)}</div>
      </div>

      <!-- Clubes Box -->
      <div style="flex: 1; min-width: 250px; display:flex; flex-direction:column; gap:20px;">
        <div class="hub-box" style="background: rgba(0,0,0,0.3); padding:15px;"><h3 style="margin:0 0 10px 0; color:#4CAF50;">🏆 Melhor Ataque</h3>${renderTeamList(sortedByAttack, 'goalsFor')}</div>
        <div class="hub-box" style="background: rgba(0,0,0,0.3); padding:15px;"><h3 style="margin:0 0 10px 0; color:#2196F3;">🛡️ Melhor Defesa</h3>${renderTeamList(sortedByDefense, 'goalsAgainst')}</div>
      </div>
    </div>
  `;

  // Lógica das Abas
  setTimeout(() => {
    const btnDiv = document.getElementById('btn-tab-div');
    const btnGlob = document.getElementById('btn-tab-glob');
    const container = document.getElementById('scorers-table-container');
    
    if (btnDiv) btnDiv.onclick = () => {
      container.innerHTML = renderScorers(divTop10);
      btnDiv.style.background = '#2196F3'; btnGlob.style.background = '#444';
    };
    if (btnGlob) btnGlob.onclick = () => {
      container.innerHTML = renderScorers(globalTop10);
      btnGlob.style.background = '#2196F3'; btnDiv.style.background = '#444';
    };
  }, 10);
}