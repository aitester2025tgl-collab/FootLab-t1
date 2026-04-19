/* eslint-disable no-console, no-unused-vars */
import assert from 'assert';
import { generateFreeAgents } from '../src/players.js';

// Mock do ambiente Global
global.window = global.window || {};

try {
  console.log('Iniciando teste de Agentes Livres (generateFreeAgents)...');

  // Criar Divisões e Clubes Fictícios
  const clubA = { team: { name: 'Clube A', players: [] }, division: 1 };
  const clubB = { team: { name: 'Clube B', players: [] }, division: 1 };
  
  // Adicionar 5 jogadores a cada clube
  for(let i=1; i<=5; i++) {
    clubA.team.players.push({ id: `A${i}`, name: `Player A${i}`, salary: 1000, skill: 60 });
    clubB.team.players.push({ id: `B${i}`, name: `Player B${i}`, salary: 2000, skill: 70 });
  }
  
  const allDivisions = [[clubA, clubB]];
  
  // Forçar probabilidade 100% mas com limite de 2 por clube para testar os limites
  const freeAgents = generateFreeAgents(allDivisions, { probability: 1.0, maxPerClub: 2 });

  // ASSERT 1: Têm de haver exatamente 4 Agentes Livres (2 do Clube A + 2 do Clube B)
  assert.strictEqual(freeAgents.length, 4, 'Deveriam ter sido gerados exatamente 4 agentes livres.');
  console.log('✔️  ASSERT 1: O limite máximo por clube (maxPerClub: 2) foi respeitado.');

  // ASSERT 2: Os jogadores retirados não podem estar mais nos clubes
  assert.strictEqual(clubA.team.players.length, 3, 'O Clube A deveria ter ficado apenas com 3 jogadores.');
  assert.strictEqual(clubB.team.players.length, 3, 'O Clube B deveria ter ficado apenas com 3 jogadores.');
  console.log('✔️  ASSERT 2: Os jogadores foram corretamente removidos dos plantéis originais.');

  // ASSERT 3: Propriedades do Contrato atualizadas para 0
  const fa = freeAgents[0];
  assert.strictEqual(fa.contractYears, 0, 'O agente livre não pode ter anos de contrato.');
  assert(fa.minContract > 0, 'O agente livre deve exigir um salário mínimo.');
  assert.strictEqual(fa.previousClubName, 'Clube A', 'A origem do jogador deve ser memorizada.');
  console.log('✔️  ASSERT 3: As propriedades contratuais dos agentes livres (0 anos) estão corretas.\n');

  console.log('Teste de Agentes Livres: PASSOU com sucesso!');
  process.exit(0);

} catch (err) {
  console.error('Teste de Agentes Livres FALHOU:', err && err.stack ? err.stack : err.message);
  process.exit(2);
}