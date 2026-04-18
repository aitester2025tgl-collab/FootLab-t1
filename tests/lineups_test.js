/* eslint-disable no-console, no-unused-vars */
// tests/lineups_test.js
// Testa a lógica de escolha do Onze Inicial e Suplentes (chooseStarters)
const assert = require('assert');
const { JSDOM } = require('jsdom');
const logger = require('./testLogger').getLogger();

// Mock do ambiente de browser
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  runScripts: 'dangerously',
  resources: 'usable',
});
global.window = dom.window;
global.document = dom.window.document;

// Carregar o ficheiro de lineups
require('../src/logic/lineups.js');

try {
  logger.info('A iniciar teste de Lineups (chooseStarters)...');

  const Lineups = window.FootLab.Lineups;
  if (!Lineups || typeof Lineups.chooseStarters !== 'function') {
    throw new Error('A função chooseStarters não está disponível no window.FootLab.Lineups');
  }

  // Criar um plantel fictício com 20 jogadores, incluindo 2 GKs e 1 jogador suspenso
  const mockPlayers = [];
  for (let i = 1; i <= 20; i++) {
    mockPlayers.push({
      id: i,
      name: `Player ${i}`,
      position: i === 1 || i === 2 ? 'GK' : i <= 8 ? 'CB' : i <= 14 ? 'CM' : 'ST',
      skill: 50 + i, // Skill de 51 a 70
      suspendedGames: i === 20 ? 1 : 0, // O jogador 20 (ST com skill 70) está suspenso
    });
  }

  const team = {
    name: 'Test FC',
    tactic: '4-3-3',
    players: mockPlayers
  };

  // Correr a lógica
  const result = Lineups.chooseStarters(team);

  logger.info(`\nResultados da escolha tática (${team.tactic}):`);
  logger.info(`- Titulares escolhidos: ${result.starters.length}`);
  logger.info(`- Suplentes escolhidos: ${result.subs.length}\n`);

  // ASSERT 1: Tem de retornar exatamente 11 titulares
  assert.strictEqual(result.starters.length, 11, 'O onze inicial deve ter exatamente 11 jogadores');
  logger.info('✔️  ASSERT 1: O onze inicial tem exatamente 11 jogadores.');

  // ASSERT 2: Tem de ter no máximo 7 suplentes
  assert(result.subs.length <= 7, 'O banco de suplentes não pode ter mais de 7 jogadores');
  logger.info('✔️  ASSERT 2: O banco tem no máximo 7 suplentes.');

  // ASSERT 3: O onze inicial TEM de ter exatamente 1 Guarda-Redes (GK)
  const startingGKs = result.starters.filter(p => p.position === 'GK');
  assert.strictEqual(startingGKs.length, 1, 'O onze inicial tem de ter exatamente 1 Guarda-Redes');
  logger.info('✔️  ASSERT 3: O onze inicial tem exatamente 1 Guarda-Redes.');

  // ASSERT 4: O jogador suspenso NÃO pode estar nos titulares nem nos suplentes
  const isSuspendedInStarters = result.starters.some(p => p.id === 20);
  const isSuspendedInSubs = result.subs.some(p => p.id === 20);
  assert.strictEqual(isSuspendedInStarters, false, 'O jogador suspenso não pode ser titular');
  assert.strictEqual(isSuspendedInSubs, false, 'O jogador suspenso não pode ir para o banco');
  logger.info('✔️  ASSERT 4: O jogador suspenso (ST com skill 70) foi deixado de fora com sucesso.');

  // ASSERT 5: O banco de suplentes não deve ter mais do que 1 GK extra
  const subGKs = result.subs.filter(p => p.position === 'GK');
  assert(subGKs.length <= 1, 'O banco de suplentes deve ter no máximo 1 Guarda-Redes extra');
  logger.info('✔️  ASSERT 5: O banco não tem demasiados Guarda-Redes.\n');

  logger.info('Teste de Lineups (chooseStarters): PASSOU com sucesso!');
  process.exit(0);

} catch (err) {
  logger.error('Teste de Lineups FALHOU:', err && err.stack ? err.stack : err.message);
  process.exit(2);
}