/* eslint-disable no-console */
import assert from 'assert';
import { getLogger } from './testLogger.js';

const logger = getLogger();

// Replicar a função exata de cálculo percentual que inserimos na UI (roster.mjs)
function calcularExigenciaRenovacao(salarioAtual, skill) {
  const currentSalary = Number(salarioAtual || 300);
  const skillLvl = Number(skill || 40);
  
  // Aumento percentual justo: entre 5% (skill baixa) e 25% (skill alta)
  const raisePercentage = 0.05 + ((skillLvl / 100) * 0.20);
  let minDemanded = Math.round(currentSalary * (1 + raisePercentage));
  
  // Arredondar para a dezena mais próxima (ex: 342 -> 350)
  minDemanded = Math.ceil(minDemanded / 10) * 10;
  
  // Piso mínimo absoluto para garantir que não há valores absurdamente baixos
  const absoluteMin = Math.max(300, Math.round(skillLvl * 5)); 
  return Math.max(minDemanded, absoluteMin);
}

try {
  logger.info('Iniciando teste de Matemática de Contratos (Renovações)...');

  // Caso 1: Jogador com salário baixo e skill medíocre (60) a ganhar 300€
  const dem1 = calcularExigenciaRenovacao(300, 60);
  // Raise = 5% + (0.60 * 20%) = 17%. 300 * 1.17 = 351 -> arredondado para 360.
  assert.strictEqual(dem1, 360, `Salário experado 360, obtido: ${dem1}`);
  logger.info('✔️  Caso 1: Jogador de base pede aumento de ~17% (360€).');

  // Caso 2: Super Craque (Skill 95) a ganhar 5.000€
  const dem2 = calcularExigenciaRenovacao(5000, 95);
  // Raise = 5% + (0.95 * 20%) = 24%. 5000 * 1.24 = 6200.
  assert.strictEqual(dem2, 6200, `Salário experado 6200, obtido: ${dem2}`);
  logger.info('✔️  Caso 2: Super craque pede aumento de ~24% (6200€).');

  // Caso 3: Jogador sem dados de salário ou skill (fallback)
  const dem3 = calcularExigenciaRenovacao(null, null);
  // Base 300, skill 40. Raise = 13%. 300 * 1.13 = 339 -> 340.
  // Mas absolute min (40 * 5 = 200 vs 300). 340 vence.
  assert.strictEqual(dem3, 340, `Salário experado 340, obtido: ${dem3}`);
  logger.info('✔️  Caso 3: Jogador vazio faz fallback e pede aumento razoável (340€).\n');

  logger.info('Teste de Matemática de Contratos: PASSOU com sucesso!');
  process.exit(0);

} catch (err) {
  logger.error('Teste de Matemática FALHOU:', err.message);
  process.exit(2);
}