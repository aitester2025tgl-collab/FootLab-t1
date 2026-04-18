/**
 * Lógica central de transferências de jogadores entre clubes.
 * Separado da UI para facilitar testes e reutilização na simulação automática.
 */

export function clubNeedsPosition(club, category) {
  const Lineups = window.FootLab && window.FootLab.Lineups;
  if (!Lineups) return true;

  const tacticName = club.team.tactic || '4-4-2';
  const formation = (typeof Lineups.parseFormation === 'function')
    ? Lineups.parseFormation(tacticName)
    : [4, 4, 2];

  const requirements = {
    GK: 1,
    DEF: formation[0] || 4,
    MID: formation[1] || 4,
    ATT: formation[2] || 2
  };

  const currentCount = (club.team.players || []).filter(p => Lineups.getPositionCategory(p.position) === category).length;
  const saturationLimit = Math.max(category === 'GK' ? 2 : 4, requirements[category] * 2);
  
  return currentCount < saturationLimit;
}

export function findPotentialBuyer(player, fee) {
  const sellerClub = player.originalClubRef;
  const Lineups = window.FootLab && window.FootLab.Lineups;
  const category = Lineups ? Lineups.getPositionCategory(player.position) : 'MID';

  const allClubs = window.ALL_CLUBS || [];
  const potentialBuyers = allClubs.filter(club => {
    if (club === sellerClub) return false;
    if (club.budget < fee) return false;
    if (!clubNeedsPosition(club, category)) return false;
    return true;
  });

  return potentialBuyers.length > 0 
    ? potentialBuyers[Math.floor(Math.random() * potentialBuyers.length)]
    : null;
}

export function executeTransfer(player, sellerClub, buyerClub, fee, salary) {
  sellerClub.budget = (sellerClub.budget || 0) + fee;
  buyerClub.budget = (buyerClub.budget || 0) - fee;

  const pIdx = sellerClub.team.players.findIndex((p) => p.id === player.id);
  if (pIdx > -1) {
    const [transferredPlayer] = sellerClub.team.players.splice(pIdx, 1);
    transferredPlayer.salary = salary;
    transferredPlayer.contractYears = 1;
    transferredPlayer.contractYearsLeft = 1;
    buyerClub.team.players.push(transferredPlayer);
    
    // Adicionar ao histórico global
    window.TRANSFER_HISTORY = window.TRANSFER_HISTORY || [];
    window.TRANSFER_HISTORY.push({
      player: transferredPlayer.name,
      from: sellerClub.team ? sellerClub.team.name : sellerClub.name,
      to: buyerClub.team ? buyerClub.team.name : buyerClub.name,
      fee: fee,
      salary: salary,
      type: 'purchase',
      jornada: typeof window.currentJornada !== 'undefined' ? window.currentJornada : null,
      time: Date.now()
    });

    return true;
  }
  return false;
}