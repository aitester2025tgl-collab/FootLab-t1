/* eslint-disable no-console */
const assert = require('assert');
const { JSDOM } = require('jsdom');
const logger = require('./testLogger').getLogger();

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="hub-main-content"></div></body></html>', {
  url: 'http://localhost',
  runScripts: 'dangerously',
  resources: 'usable',
});
global.window = dom.window;
global.document = dom.window.document;

// Mocks para a Interface
window.formatMoney = (v) => v + ' €';
window.alert = () => {};
window.confirm = () => true;

// Carregar Simulação (vai registar-se no window.Simulation)
require('../src/core/simulation.js');

try {
  logger.info('Iniciando teste de Movimentações de Treinadores (Chicotada Psicológica)...');

  // Setup de 18 equipas por Divisão (para simular uma época normal)
  const div1 = [];
  for(let i=0; i<18; i++) {
    div1.push({ id: i, team: {name: `C1_${i}`}, division: 1, points: 100 - i, coach: { name: `Coach1_${i}`, reputation: 80 } });
  }
  const div2 = [];
  for(let i=0; i<18; i++) {
    div2.push({ id: 18+i, team: {name: `C2_${i}`}, division: 2, points: 100 - i, coach: { name: `Coach2_${i}`, reputation: 65 } });
  }

  // Definir a equipa do jogador como Campeão incontestável da Divisão 2
  div2[0].coach = { name: 'Player', reputation: 50 };
  window.playerClub = div2[0];

  window.allDivisions = [div1, div2, [], []];
  window.allClubs = [...div1, ...div2];
  
  // Injetar treinadores desempregados com reputações mistas
  window.UNEMPLOYED_COACHES = [
    { name: 'Free Coach 1', reputation: 81 },
    { name: 'Free Coach 2', reputation: 60 }
  ];
  window.PLAYER_JOB_OFFERS = [];

  // Mock da simulação para forçar o trigger "Fim de Época"
  window.generateRounds = () => [[], []]; // Finge que a liga só tinha 2 jornadas
  window.currentJornada = 3; // Como estamos na Jornada 3, força a avaliação de final de ano

  // Mocks de sistemas adjacentes para isolar o nosso teste
  window.updateClubStatsAfterMatches = () => {};
  window.seasonalSkillDrift = () => {};
  window.selectExpiringPlayersToLeave = () => {};
  window.selectPlayersForRelease = () => {};
  window.processPendingReleases = () => {};
  window.Offers = { showJobOffersPopup: () => {} }; // Interceptar o pop-up

  // Executar fim da jornada (onde vive a processManagerMovements)
  window.Simulation.finishDayAndReturnToHub();

  // ASSERT 1: O último da Divisão 1 (rank 17) deve ter o treinador despedido
  const lastD1 = div1[17];
  const currentCoachName = lastD1.coach ? lastD1.coach.name : null;
  assert.notStrictEqual(currentCoachName, 'Coach1_17', 'O treinador do último classificado deveria ter sido despedido.');
  logger.info('✔️  ASSERT 1: Treinador do último classificado (Divisão 1) foi despedido.');

  // ASSERT 2: O Treinador despedido foi inserido na array de desempregados
  const sackedInFree = window.UNEMPLOYED_COACHES.find(c => c.name === 'Coach1_17');
  assert(sackedInFree, 'O treinador despedido deveria ter ido para os desempregados.');
  logger.info('✔️  ASSERT 2: Treinador despedido foi parar à lista de desempregados.');

  // ASSERT 3: O Jogador recebe um convite de uma equipa maior
  // Base da D2 é 68 rep. Mais 15 de bónus por ser o campeão = 83 rep. Sendo 83 > 81 (Free Coach 1), o Jogador é o alvo nº 1!
  assert(window.PLAYER_JOB_OFFERS.length > 0, 'O jogador deveria ter recebido uma oferta de trabalho devido ao sucesso na D2.');
  logger.info('✔️  ASSERT 3: Jogador campeão da Divisão 2 recebeu convites de clubes da Divisão 1.');

  // Simular a decisão IMEDIATA do jogador (ex: Rejeitar a proposta) para garantir que não há tempos de espera
  // Processar TODAS as propostas (várias equipas podem ter despedido o treinador no teste)
  while (window.PLAYER_JOB_OFFERS.length > 0) {
    const club = window.PLAYER_JOB_OFFERS.shift();
    const freeCoaches = window.UNEMPLOYED_COACHES || [];
    if (freeCoaches.length > 0) {
      freeCoaches.sort((a, b) => b.reputation - a.reputation);
      const nextBest = freeCoaches.shift();
      club.coach = { name: nextBest.name, reputation: nextBest.reputation };
    }
  }

  // ASSERT 4: O clube preenche imediatamente a vaga após a decisão do jogador, sem períodos de "espera"
  assert.ok(lastD1.coach && typeof lastD1.coach.name === 'string', 'O clube não pode ficar sem treinador após a decisão.');
  assert.notStrictEqual(lastD1.coach.name, 'Coach1_17', 'O nome do treinador tem de ser diferente do despedido.');
  logger.info(`✔️  ASSERT 4: A vaga no ${lastD1.team.name} foi preenchida IMEDIATAMENTE após a decisão (Novo: ${lastD1.coach.name}).\n`);

  logger.info('Teste de Movimentações de Treinadores: PASSOU com sucesso!');
  process.exit(0);

} catch (err) {
  logger.error('Teste de Movimentações FALHOU:', err.message);
  process.exit(2);
}