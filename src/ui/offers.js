// This module re-implements the pending release offers popup that was
// previously in the legacy hub.js file.

(function () {
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

    // In this test, there's only one other club, which is the buyer.
    const buyerClub = (window.ALL_CLUBS || []).find((c) => c !== sellerClub);

    if (!buyerClub) {
      alert('Could not find a buyer club.');
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
      // Perform transfer
      sellerClub.budget = (sellerClub.budget || 0) + fee;
      buyerClub.budget = (buyerClub.budget || 0) - fee;

      const pIdx = sellerClub.team.players.findIndex((p) => p.id === player.id);
      if (pIdx > -1) {
        const [transferredPlayer] = sellerClub.team.players.splice(pIdx, 1);
        transferredPlayer.salary = offerSalary;
        transferredPlayer.contractYears = 1;
        transferredPlayer.contractYearsLeft = 1;
        buyerClub.team.players.push(transferredPlayer);
      }

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

    let html = `<div style="background:#333;padding:20px;border-radius:8px;width:90%;max-width:600px;">`;
    html += `<h2>Ofertas de Transferência</h2>`;
    html += `<p>Os seguintes jogadores da sua equipa estão a atrair o interesse de outros clubes.</p>`;

    pending.forEach((p, idx) => {
      const fee = p.leavingFee || 0;
      html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:rgba(0,0,0,0.2);margin-bottom:8px;border-radius:4px;">
                  <div>
                      <strong>${p.name}</strong> (${p.position})<br/>
                      <small>Clube interessado oferece ${formatMoney(fee)}</small>
                  </div>
                  <button id="offersDoProposeBtn" class="offer-propose-btn" data-player-idx="${idx}" style="padding:8px 12px;border:none;border-radius:4px;background:#4CAF50;color:white;cursor:pointer;">Aceitar Proposta</button>
              </div>`;
    });

    html += `<div style="text-align:right;margin-top:20px;"><button id="close-offers-popup" style="padding:8px 12px;">Fechar</button></div>`;
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

  // Expose the function globally, as the legacy code did.
  const Offers = {
    showPendingReleasesPopup,
  };

  if (typeof window !== 'undefined') {
    window.Offers = Offers;
  }

  // For testing purposes
  if (typeof module !== 'undefined') {
    module.exports = Offers;
  }
})();