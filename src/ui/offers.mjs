// This module re-implements the pending release offers popup that was
// previously in the legacy hub.js file.
import { findPotentialBuyer, executeTransfer } from '../logic/transfers.js';
  // small local logger shim
  const L =
    (typeof window !== 'undefined' && window.FootLab && window.FootLab.Logger) || console;
  // helper from main.js
  const formatMoney = function (value) {
    if (!value && value !== 0) return '0 €';
    return (
      Math.floor(value)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €'
    );
  };

  function handleOfferAccept(player, playerIndex, onClose) {
    const sellerClub = player.originalClubRef;
    const fee = player.leavingFee || 0;

    const buyerClub = findPotentialBuyer(player, fee);

    if (!buyerClub) {
      alert('Nenhum clube tem orçamento ou necessidade para contratar este jogador no momento.');
      return;
    }

    if (buyerClub.budget < fee) {
      alert(
        `${buyerClub.team.name} cannot afford the transfer fee of ${formatMoney(fee)}.`
      );
      return;
    }

    // Simulate the prompt for salary, using values the test expects
    const offerSalaryStr = prompt(
      `Propor salário para ${player.name} (mínimo: ${formatMoney(
        player.minContract || 0
      )})`,
      player.minContract || 500
    );
    const offerSalary = parseInt(offerSalaryStr, 10);

    if (isNaN(offerSalary) || offerSalary < (player.minContract || 0)) {
      alert('Salário inválido ou abaixo do mínimo.');
      return;
    }

    // Simulate confirmation
    const confirmed = confirm(
      `Confirmar transferência de ${player.name} para ${
        buyerClub.team.name
      } por ${formatMoney(fee)} com salário de ${formatMoney(offerSalary)}?`
    );

    if (confirmed) {
      // Efetua a transferência através da lógica centralizada
      executeTransfer(player, sellerClub, buyerClub, fee, offerSalary);

      window.PENDING_RELEASES.splice(playerIndex, 1);

      // Re-render the popup, which will close it if no more pending releases exist
      const overlay = document.getElementById('offers-overlay');
      if (overlay) document.body.removeChild(overlay);
      showPendingReleasesPopup(onClose);
    }
  }

  function showPendingReleasesPopup(onClose) {
    const pending = window.PENDING_RELEASES || [];
    if (!pending.length) {
      if (typeof onClose === 'function') onClose();
      return;
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'offers-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0,0,0,0.75)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
    });

    let html = `<div class="subs-panel" style="padding: 24px; background: #2e2e2e; color: #fff; border-radius: 10px; max-width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1);">`;
    html += `<h3 style="margin-top:0; color:#ffeb3b; font-size:1.3em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">Propostas Recebidas</h3>`;
    html += `<p style="font-size:0.95em; color:#ccc;">Os seguintes jogadores da sua equipa têm ofertas de outros clubes:</p>`;

    pending.forEach((p, idx) => {
      const fee = p.leavingFee || 0;
      html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(0,0,0,0.2);margin-bottom:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                  <div>
                      <strong style="font-size:1.1em;">${p.name}</strong> <span style="color:#aaa;">(${p.position})</span><br/>
                      <span style="color:#8BC34A; font-weight:bold; font-size:0.9em;">Oferta: ${formatMoney(fee)}</span>
                  </div>
                  <button id="offersDoProposeBtn" class="offer-propose-btn" data-player-idx="${idx}" style="padding:10px 16px;border:none;border-radius:6px;background:#2196F3;color:white;cursor:pointer;font-weight:bold;">Vender</button>
              </div>`;
    });

    html += `<div style="text-align:right;margin-top:20px;"><button id="close-offers-popup" style="padding:10px 16px;border-radius:6px;border:none;background:#555;color:#fff;cursor:pointer;font-weight:bold;">Fechar</button></div>`;
    html += `</div>`;
    overlay.innerHTML = html;

    document.body.appendChild(overlay);

    // Event Listeners
    document.getElementById('close-offers-popup').addEventListener('click', () => {
      document.body.removeChild(overlay);
      if (typeof onClose === 'function') onClose();
    });

    overlay.querySelectorAll('.offer-propose-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const playerIndex = parseInt(e.target.getAttribute('data-player-idx'), 10);
        const player = pending[playerIndex];
        handleOfferAccept(player, playerIndex, onClose);
      });
    });
  }

  function showJobOffersPopup(onClose) {
    const offers = window.PLAYER_JOB_OFFERS || [];
    if (!offers.length) {
      if (typeof onClose === 'function') onClose();
      return;
    }

    const club = offers.shift(); // Tira a primeira proposta da fila
    
    const overlay = document.createElement('div');
    overlay.id = 'job-offers-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', left: '0', top: '0', right: '0', bottom: '0',
      background: 'rgba(0,0,0,0.85)', zIndex: 10005,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
    });

    const currentCoachName = document.getElementById('coachNameDisplay') ? document.getElementById('coachNameDisplay').innerText : 'Treinador';

    let html = `<div class="subs-panel" style="padding: 30px; border-radius: 12px; width: 90%; max-width: 550px; text-align: center; border: 1px solid rgba(255,255,255,0.1); background: #2e2e2e; box-shadow: 0 15px 40px rgba(0,0,0,0.8);">`;
    html += `<h2 style="color: #4CAF50; margin-top: 0; font-size: 1.6em;">Proposta de Trabalho</h2>`;
    html += `<div style="width: 64px; height: 64px; margin: 20px auto; border-radius: 12px; background: ${club.team.bgColor}; border: 3px solid ${club.team.color}; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"></div>`;
    html += `<p style="font-size: 1.1em; line-height: 1.5; color: #ddd;">A direção do <strong>${club.team.name}</strong> (${club.division}ª Divisão) despediu o seu treinador.<br><br>Eles acompanharam o seu trabalho e oferecem-lhe o comando técnico. Aceita o desafio?</p>`;
    html += `<div style="margin-top: 30px; display: flex; justify-content: center; gap: 15px;">`;
    html += `<button id="rejectJobBtn" style="padding: 12px 24px; border-radius: 8px; border: none; background: #555; color: white; cursor: pointer; font-weight: bold; transition: background 0.2s;">Rejeitar Proposta</button>`;
    html += `<button id="acceptJobBtn" style="padding: 12px 24px; border-radius: 8px; border: none; background: #4CAF50; color: white; cursor: pointer; font-weight: bold; transition: background 0.2s;">Assinar Contrato</button>`;
    html += `</div></div>`;
    
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    document.getElementById('rejectJobBtn').addEventListener('click', () => {
      document.body.removeChild(overlay);
      showJobOffersPopup(onClose); // Verifica se há mais clubes a fazer ofertas
    });

    document.getElementById('acceptJobBtn').addEventListener('click', () => {
      window.playerClub.coach = { name: "Treinador Interino", reputation: 50 }; // O teu antigo clube fica com interino
      window.playerClub = club;
      club.coach = { name: currentCoachName, reputation: 80 }; // Tu assumes o novo clube
      window.PLAYER_JOB_OFFERS = []; // Cancela todas as outras ofertas pendentes
      document.body.removeChild(overlay);
      alert(`Parabéns! Assinou contrato com o ${club.team.name}!`);
      
      // Atualiza o texto do menu lateral com o nome do teu novo clube
      const playerTeamNameHub = document.getElementById('playerTeamNameHub');
      const playerTeamNameFooter = document.getElementById('playerTeamNameFooter');
      if (playerTeamNameHub) playerTeamNameHub.textContent = club.team.name;
      if (playerTeamNameFooter) playerTeamNameFooter.textContent = club.team.name;
      
      showJobOffersPopup(onClose);
    });
  }

  function showTransferNewsPopup(transfers, onClose) {
    if (!transfers || transfers.length === 0) {
      if (typeof onClose === 'function') onClose();
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'transfer-news-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', left: '0', top: '0', right: '0', bottom: '0',
      background: 'rgba(0,0,0,0.85)', zIndex: 10005,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
    });

    const fm = typeof window.formatMoney === 'function' ? window.formatMoney : (v) => v + ' €';

    let html = `<div class="subs-panel" style="padding: 24px; background: #2e2e2e; color: #fff; border-radius: 12px; width: 90%; max-width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1);">`;
    html += `<h3 style="margin-top:0; color:#4CAF50; font-size:1.4em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">💸 Mercado de Transferências</h3>`;
    html += `<p style="font-size:1em; color:#ccc; margin-bottom: 20px;">Resumo das principais transferências realizadas nesta jornada:</p>`;
    
    html += `<div style="max-height: 400px; overflow-y: auto; padding-right: 10px; display:flex; flex-direction:column; gap:10px;">`;
    transfers.forEach(t => {
      html += `<div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 6px;">
                 <div style="font-weight:bold; font-size:1.1em; color:#fff;">${t.player}</div>
                 <div style="display:flex; justify-content:space-between; font-size:0.95em;">
                   <span style="color:#aaa;">De: ${t.from} ➔ Para: ${t.to}</span>
                   <strong style="color:#ffeb3b;">${fm(t.fee)}</strong>
                 </div>
               </div>`;
    });
    html += `</div>`;
    html += `<div style="text-align:right; margin-top:24px;"><button id="close-transfer-news-btn" style="padding:10px 20px; border-radius:6px; border:none; background:#2196F3; color:white; font-weight:bold; cursor:pointer;">Continuar</button></div>`;
    html += `</div>`;
    
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    document.getElementById('close-transfer-news-btn').addEventListener('click', () => { document.body.removeChild(overlay); if (typeof onClose === 'function') onClose(); });
  }

  function showManagerMovementsPopup(movements, onClose) {
    if (!movements || movements.length === 0) {
      if (typeof onClose === 'function') onClose();
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'manager-movements-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', left: '0', top: '0', right: '0', bottom: '0',
      background: 'rgba(0,0,0,0.85)', zIndex: 10005,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
    });

    let html = `<div class="subs-panel" style="padding: 24px; background: #2e2e2e; color: #fff; border-radius: 12px; width: 90%; max-width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1);">`;
    html += `<h3 style="margin-top:0; color:#ffeb3b; font-size:1.4em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">📰 Chicotadas Psicológicas</h3>`;
    html += `<p style="font-size:1em; color:#ccc; margin-bottom: 20px;">Resumo das recentes movimentações de treinadores no futebol mundial:</p>`;
    
    html += `<div style="max-height: 400px; overflow-y: auto; padding-right: 10px; display:flex; flex-direction:column; gap:10px;">`;
    movements.forEach(m => {
      html += `<div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 6px;">
                 <div style="font-weight:bold; font-size:1.1em; color:#fff;">${m.clubName}</div>
                 <div style="display:flex; justify-content:space-between; font-size:0.95em;">
                   <span style="color:#F44336;">❌ Sai: ${m.out}</span>
                   <span style="color:#4CAF50;">✅ Entra: ${m.in}</span>
                 </div>
               </div>`;
    });
    html += `</div>`;
    html += `<div style="text-align:right; margin-top:24px;"><button id="close-movements-btn" style="padding:10px 20px; border-radius:6px; border:none; background:#2196F3; color:white; font-weight:bold; cursor:pointer;">Continuar</button></div>`;
    html += `</div>`;
    
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    document.getElementById('close-movements-btn').addEventListener('click', () => { document.body.removeChild(overlay); if (typeof onClose === 'function') onClose(); });
  }

  function showEndSeasonAwardsPopup(data, onClose) {
    if (!data) {
      if (typeof onClose === 'function') onClose();
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'end-season-awards-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', left: '0', top: '0', right: '0', bottom: '0',
      background: 'rgba(0,0,0,0.85)', zIndex: 10005,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
    });

    const fm = typeof window.formatMoney === 'function' ? window.formatMoney : (v) => v + ' €';

    let html = `<div class="subs-panel" style="padding: 30px; background: #2e2e2e; color: #fff; border-radius: 12px; width: 90%; max-width: 650px; box-shadow: 0 15px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1);">`;
    html += `<h2 style="margin-top:0; color:#ffeb3b; font-size:1.8em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; text-align:center;">🏆 Fim de Época - Prémios</h2>`;
    
    html += `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:20px;">`;
    
    const renderAward = (title, icon, name, sub) => `
      <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); text-align:center;">
        <div style="font-size:2em; margin-bottom:8px;">${icon}</div>
        <div style="color:#aaa; font-size:0.9em; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; font-weight:bold;">${title}</div>
        <strong style="font-size:1.2em; color:#fff;">${name}</strong>
        <div style="color:#4CAF50; font-size:0.9em; margin-top:4px; font-weight:bold;">${sub}</div>
      </div>
    `;

    if (data.championD1 && data.championD1.team) html += renderAward('Campeão 1ª Divisão', '🥇', data.championD1.team.name, `${data.championD1.points} Pts`);
    if (data.topScorer && data.topScorer.p) html += renderAward('Melhor Marcador', '👟', data.topScorer.p.name, `${data.topScorer.p.goals} Golos (${data.topScorer.club.team.name})`);
    if (data.bestAttack && data.bestAttack.team) html += renderAward('Melhor Ataque', '⚔️', data.bestAttack.team.name, `${data.bestAttack.goalsFor} Golos Marcados`);
    if (data.bestDefense && data.bestDefense.team) html += renderAward('Melhor Defesa', '🛡️', data.bestDefense.team.name, `${data.bestDefense.goalsAgainst} Golos Sofridos`);

    html += `</div>`;

    if (data.totalPrize > 0) {
       html += `<div style="margin-top:20px; background:rgba(76, 175, 80, 0.15); border:1px solid rgba(76, 175, 80, 0.3); padding:16px; border-radius:8px; text-align:center;">
                  <div style="color:#4CAF50; font-weight:bold; font-size:1.1em; margin-bottom:8px;">💰 Prémios Recebidos pela Sua Equipa:</div>
                  <div style="font-size:0.95em; color:#ddd; line-height:1.5;">${data.prizeMsg}</div>
                  <div style="margin-top:8px; font-size:1.2em; font-weight:900; color:#ffeb3b;">Total: ${fm(data.totalPrize)}</div>
                </div>`;
    }

    html += `<div style="text-align:center; margin-top:24px;"><button id="close-awards-btn" style="padding:12px 30px; border-radius:8px; border:none; background:#2196F3; color:white; font-weight:bold; cursor:pointer; font-size:1.1em; transition:transform 0.2s;">Continuar</button></div>`;
    html += `</div>`;
    
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    document.getElementById('close-awards-btn').addEventListener('click', () => { document.body.removeChild(overlay); if (typeof onClose === 'function') onClose(); });
  }

  function showPromotionsPopup(data, onClose) {
    if (!data || !data.promoted || !data.relegated) {
      if (typeof onClose === 'function') onClose();
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'promotions-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', left: '0', top: '0', right: '0', bottom: '0',
      background: 'rgba(0,0,0,0.85)', zIndex: 10005,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
    });

    let html = `<div class="subs-panel" style="padding: 30px; background: #2e2e2e; color: #fff; border-radius: 12px; width: 90%; max-width: 850px; box-shadow: 0 15px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1); max-height:95vh; overflow-y:auto;">`;
    html += `<h2 style="margin-top:0; color:#4CAF50; font-size:1.8em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; text-align:center;">📈 Subidas e Descidas</h2>`;
    
    const renderDivisionBlock = (divisionName, promoList, promoTitle, relegList, relegTitle) => {
      let block = `<div style="display:flex; flex-direction:column; gap:12px;">`;
      block += `<h3 style="margin:0; text-align:center; color:#FF9800; font-size:1.2em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">${divisionName}</h3>`;

      if (promoList && promoList.length > 0) {
        block += `<div style="display:flex; flex-direction:column; gap:6px;">`;
        block += `<h4 style="margin:0; color:#4CAF50; font-size:1em; text-align:center;">${promoTitle}</h4>`;
        promoList.forEach(c => {
          block += `<div style="background:rgba(0,0,0,0.3); padding:6px 10px; border-radius:4px; font-weight:bold; font-size:0.95em; display:flex; justify-content:space-between; align-items:center;">
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${c.team.name}">${c.team.name}</span><span style="flex-shrink:0;">🔺</span>
                    </div>`;
        });
        block += `</div>`;
      }

      if (relegList && relegList.length > 0) {
        block += `<div style="display:flex; flex-direction:column; gap:6px;">`;
        block += `<h4 style="margin:0; color:#F44336; font-size:1em; text-align:center;">${relegTitle}</h4>`;
        relegList.forEach(c => {
          block += `<div style="background:rgba(0,0,0,0.3); padding:6px 10px; border-radius:4px; font-weight:bold; font-size:0.95em; display:flex; justify-content:space-between; align-items:center;">
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${c.team.name}">${c.team.name}</span><span style="flex-shrink:0;">🔻</span>
                    </div>`;
        });
        block += `</div>`;
      }

      block += `</div>`;
      return block;
    };

    html += `<div class="promotions-grid" style="margin-top: 20px;">`;
    html += renderDivisionBlock('1ª Divisão', data.promoted[1], 'Promovidos à 1ª Div.', data.relegated[0], 'Despromovidos à 2ª Div.');
    html += renderDivisionBlock('2ª Divisão', data.promoted[2], 'Promovidos à 2ª Div.', data.relegated[1], 'Despromovidos à 3ª Div.');
    html += renderDivisionBlock('3ª Divisão', data.promoted[3], 'Promovidos à 3ª Div.', data.relegated[2], 'Despromovidos à 4ª Div.');
    html += renderDivisionBlock('4ª Divisão', data.promoted[3], 'Promovidos à 3ª Div.', null, '');
    html += `</div>`;

    html += `<div style="text-align:center; margin-top:30px;"><button id="close-promos-btn" style="padding:12px 30px; border-radius:8px; border:none; background:#2196F3; color:white; font-weight:bold; cursor:pointer; font-size:1.1em; transition:transform 0.2s;">Concluir Época</button></div>`;
    html += `</div>`;
    
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    document.getElementById('close-promos-btn').addEventListener('click', () => { document.body.removeChild(overlay); if (typeof onClose === 'function') onClose(); });
  }

  const Offers = {
    showPendingReleasesPopup,
    showJobOffersPopup,
    showTransferNewsPopup,
    showManagerMovementsPopup,
    showEndSeasonAwardsPopup,
    showPromotionsPopup,
  };
  if (typeof window !== 'undefined') window.Offers = Offers;

export {
  showPendingReleasesPopup,
  showJobOffersPopup,
  showTransferNewsPopup,
  showManagerMovementsPopup,
  showEndSeasonAwardsPopup,
  showPromotionsPopup,
};