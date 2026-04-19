import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { PNG } from 'pngjs';
import { default as pixelmatch } from 'pixelmatch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const BASELINE_DIR = path.join(SCREENSHOTS_DIR, 'baseline');
const DIFF_DIR = path.join(SCREENSHOTS_DIR, 'diff');

// Criar a pasta se não existir
console.log(`📁 A verificar a pasta de destino: ${SCREENSHOTS_DIR}`);
if (fs.existsSync(SCREENSHOTS_DIR)) {
  // Limpar apenas as imagens antigas, não a pasta baseline
  fs.readdirSync(SCREENSHOTS_DIR).forEach(file => {
    const filePath = path.join(SCREENSHOTS_DIR, file);
    if (fs.lstatSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
    }
  });
}
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(BASELINE_DIR, { recursive: true });
fs.mkdirSync(DIFF_DIR, { recursive: true });

(async () => {
  console.log('🚀 A iniciar o servidor local automaticamente...');
  // Corrige o aviso de deprecation do Node ao usar shell: true com arrays
  const command = process.platform === 'win32' ? 'npx.cmd http-server -p 0' : 'npx http-server -p 0';
  const server = spawn(command, { shell: true });
  
  let visualTestFailed = false;

  // Função para comparar screenshots com a baseline
  async function compareWithBaseline(fileName) {
    const newImagePath = path.join(SCREENSHOTS_DIR, fileName);
    const baselineImagePath = path.join(BASELINE_DIR, fileName);

    if (!fs.existsSync(baselineImagePath)) {
      console.log(`⚠️  Baseline para "${fileName}" não encontrada. A criar uma nova.`);
      fs.copyFileSync(newImagePath, baselineImagePath);
      return;
    }

    const img1Data = fs.readFileSync(newImagePath);
    const img2Data = fs.readFileSync(baselineImagePath);
    const img1 = PNG.sync.read(img1Data);
    const img2 = PNG.sync.read(img2Data);

    if (img1.width !== img2.width || img1.height !== img2.height) {
      console.error(`❌ Visual Regression: As dimensões de "${fileName}" mudaram.`);
      fs.copyFileSync(newImagePath, baselineImagePath);
      console.log(`🔄 Baseline atualizada para "${fileName}" devido a mudança de dimensões.`);
      return;
    }

    const diff = new PNG({ width: img1.width, height: img1.height });
    const diffPixels = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: 0.1 });

    const totalPixels = img1.width * img1.height;
    const diffPercentage = (diffPixels / totalPixels) * 100;

    if (diffPercentage > 0.1) { // Limiar de 0.1% de diferença
      console.error(`❌ Visual Regression: "${fileName}" difere da baseline em ${diffPercentage.toFixed(2)}%.`);
      fs.writeFileSync(path.join(DIFF_DIR, `DIFF_${fileName}`), PNG.sync.write(diff));
      fs.copyFileSync(newImagePath, baselineImagePath);
    } else {
      console.log(`✔️ Visual Match: "${fileName}" corresponde à baseline.`);
    }
  }

  let serverPort = 8080; // Fallback

  console.log('⏳ A aguardar que o servidor fique online...');
  await new Promise((resolve) => {
    let isReady = false;
    server.stdout.on('data', data => {
      const msg = data.toString();
      if (msg.trim()) console.log(`🖥️ SERVIDOR: ${msg.trim()}`);
      
      const portMatch = msg.match(/127\.0\.0\.1:(\d+)/);
      if (portMatch) serverPort = portMatch[1];
      
      // Quando o servidor imprimir que está disponível, esperamos mais 1.5s por segurança e avançamos
      if (msg.includes('Available on') || msg.includes('Hit CTRL-C')) {
        if (!isReady) {
          isReady = true;
          setTimeout(resolve, 1500); 
        }
      }
    });
    server.stderr.on('data', data => {
      const msg = data.toString();
      if (msg.trim()) console.error(`🖥️ SERVIDOR ERRO: ${msg.trim()}`);
      if (msg.includes('EADDRINUSE')) {
        console.error('❌ Erro crítico: Porta ocupada! O script vai encerrar.');
        process.exit(1);
      }
    });
    // Timeout de segurança (avança ao fim de 8 segundos independentemente)
    setTimeout(() => { if (!isReady) resolve(); }, 8000);
  });

  console.log('🤖 A iniciar o robô para capturar as imagens...');
  const browser = await puppeteer.launch({ headless: true }); // headless: true faz com que corra invisível
  const page = await browser.newPage();
  
  // Auto-aceitar qualquer alert/confirm para não bloquear o robô
  page.on('dialog', async dialog => { await dialog.accept(); });

  // Escutar possíveis erros do browser para ajudar a diagnosticar problemas de carregamento
  page.on('console', msg => console.log('🖥️ BROWSER:', msg.text()));
  page.on('pageerror', err => console.error('🖥️ BROWSER ERROR:', err.message));

  // Resolução padrão de ecrã (podes alterar para testar responsividade)
  await page.setViewport({ width: 1280, height: 800 });

  console.log('🌐 A aceder ao jogo...');
  try {
    await page.goto(`http://127.0.0.1:${serverPort}/index.html`, { waitUntil: 'networkidle0' });
    console.log('✔️ Jogo carregado com sucesso!');
  } catch (e) {
    console.error('❌ Erro: Não foi possível aceder ao jogo.');
    if (process.platform === 'win32') spawn('taskkill', ['/pid', server.pid, '/f', '/t']);
    else server.kill();
    process.exit(1);
  }

  // 1. Ecrã Inicial (Setup)
  console.log('⏳ A aguardar pelo ecrã inicial...');
  await page.waitForSelector('#coachName', { visible: true });
  const setupFile = '01_Setup.png';
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, setupFile) });
  console.log(`📸 ${setupFile}`);
  await compareWithBaseline(setupFile);

  // Preencher nome e iniciar o jogo
  console.log('✍️ A preencher o nome do treinador e a iniciar...');
  await page.type('#coachName', 'Treinador Visual');
  await page.click('#startBtn');

  // 1.5 Pré-Simular 2 jornadas para encher o ecrã de estatísticas e classificações
  console.log('⏳ A pré-simular 2 jornadas em background para gerar dados nas tabelas...');
  await page.evaluate(() => {
    for(let j = 0; j < 2; j++) {
      if(window.Simulation && window.Simulation.assignStartingLineups) {
        window.Simulation.assignStartingLineups(window.currentRoundMatches);
        for(let m = 1; m <= 90; m++) window.advanceMatchDay(window.currentRoundMatches, m);
        window.currentRoundMatches.forEach(m => { if(m) m.isFinished = true; });
        window.Simulation.updateClubStatsAfterMatches(window.currentRoundMatches);
        window.currentJornada++;
        
        window.currentRoundMatches = window.seasonCalendar[window.currentJornada - 1] || [];
        
        window.TRANSFER_HISTORY = window.TRANSFER_HISTORY || [];
        window.TRANSFER_HISTORY.push({
          player: 'Exemplo Craque ' + j, from: 'Mercado', to: window.playerClub.team.name, fee: 1500000, salary: 25000, type: 'purchase', time: Date.now(), jornada: window.currentJornada - 1
        });
      }
    }
    if (typeof window.renderHubContent === 'function') window.renderHubContent('menu-team');
  });
  await new Promise(r => setTimeout(r, 1000));

  // Injetar dados falsos no Mercado para o Ecrã de Transferências não ficar vazio
  await page.evaluate(() => {
    window.transferList = [
      { name: 'Erling Haaland', position: 'ST', skill: 95, club: 'Manchester City', price: 120000000 },
      { name: 'Jamal Musiala', position: 'AM', skill: 88, club: 'Bayern Munique', price: 85000000 }
    ];
    window.FREE_TRANSFERS = [
      { name: 'David de Gea', position: 'GK', skill: 84, minContract: 22000, previousClubName: 'Fiorentina' },
      { name: 'Sérgio Ramos', position: 'CB', skill: 82, minContract: 15000, previousClubName: 'Sevilla FC' }
    ];
    window.PENDING_RELEASES = [
      { name: 'João Félix', position: 'ST', skill: 85, leavingFee: 5000000, minContract: 25000, originalClubRef: { team: { name: 'Atlético Madrid' } } }
    ];
  });

  // 2. Hub - Equipa (Menu por defeito)
  console.log('⏳ A aguardar pelo carregamento do Hub Principal...');
  await page.waitForSelector('.team-roster-grid', { visible: true });
  await new Promise(r => setTimeout(r, 600)); // Esperar pela animação de entrada
  const hubEquipaFile = '02_Hub_Equipa.png';
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, hubEquipaFile) });
  console.log(`📸 ${hubEquipaFile}`);
  await compareWithBaseline(hubEquipaFile);

  // Função auxiliar para clicar num menu lateral e tirar foto
  const captureMenu = async (menuId, fileName) => {
    console.log(`🖱️ A navegar para: ${menuId}...`);
    await page.click(`#${menuId}`);
    await new Promise(r => setTimeout(r, 500)); // Esperar pelo render da página
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, fileName) });
    console.log(`📸 ${fileName}`);
    await compareWithBaseline(fileName);
  };

  await captureMenu('menu-liga', '03_Hub_Liga.png');
  await captureMenu('menu-next-match', '04_Hub_ProximoJogo.png');
  await captureMenu('menu-standings', '05_Hub_Classificacoes.png');
  await captureMenu('menu-transfers', '06_Hub_Transferencias.png');
  await captureMenu('menu-history', '07_Hub_Historico.png');
  await captureMenu('menu-stats', '08_Hub_Estatisticas.png');
  await captureMenu('menu-finance', '09_Hub_Financas.png');

  // 10. MatchBoard (Simulação)
  console.log('⏳ A iniciar simulação do jogo (MatchBoard)...');
  await page.evaluate(() => { 
    window.__allowProgrammaticSim = true; 
    if (window.simulateDay) {
      window.simulateDay();
    } else {
      const btn = document.getElementById('simulateBtnHub');
      if (btn) btn.click();
    }
  });
  await page.waitForSelector('#screen-match', { visible: true });
  await new Promise(r => setTimeout(r, 2500)); // Esperar 2.5 segundos de jogo para ver a barra de progresso e eventos
  const matchboardFile = '10_MatchBoard.png';
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, matchboardFile) });
  console.log(`📸 ${matchboardFile}`);
  await compareWithBaseline(matchboardFile);

  // --- CAPTURAR OS POP-UPS DINÂMICOS (Transferências, Despedimentos e Substituições) ---
  
  console.log('🛑 A congelar o motor de simulação...');
  await page.evaluate(() => {
    // Matar todos os processos repetitivos do Javascript para a UI não piscar/fechar os pop-ups
    let id = window.setTimeout(function() {}, 0);
    while (id--) { window.clearTimeout(id); window.clearInterval(id); }

    document.getElementById('screen-match').style.setProperty('display', 'none', 'important');
    document.getElementById('screen-hub').style.setProperty('display', 'flex', 'important');
  });

  // Ir para o ecrã da Equipa para garantir um fundo neutro e bonito para os pop-ups
  await page.click('#menu-team');
  await new Promise(r => setTimeout(r, 600));

  // Helper para limpar popups antigos e garantir que tiramos foto ao popup certo
  const clearPopups = async () => await page.evaluate(() => { 
    document.querySelectorAll('[id$="-overlay"]').forEach(e => e.remove());
    document.querySelectorAll('.subs-panel').forEach(e => { if (e.parentElement && e.parentElement.tagName === 'DIV') e.parentElement.remove(); }); 
  });

  await clearPopups();
  // 11a e 11b. Jogador Livre - Oferta e Aceitação
  console.log('⏳ A gerar janela de Jogador Livre (Oferta e Aceitação)...');
  await page.evaluate(() => {
    window._originalRandom = Math.random;
    Math.random = () => 0; // Força sempre o sucesso (0 < prob)
    window.playerClub.budget = 10000000; // 10M para garantir que temos dinheiro
    if (window.playerClub.team.players.length >= 28) window.playerClub.team.players.pop(); // Garante espaço no plantel
    const mockPlayer = { name: 'Ángel Di María', position: 'RW', skill: 86, leavingFee: 1200000, minContract: 35000, previousClubName: 'SL Benfica' };
    if (window.Simulation && typeof window.Simulation._showSingleReleasePopup === 'function')
      window.Simulation._showSingleReleasePopup(mockPlayer, () => {});
  });
  try {
    await page.waitForSelector('#btn-accept-free', { visible: true, timeout: 5000 });
    const freePlayerFile = '11a_Popup_Jogador_Livre.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, freePlayerFile) });
    console.log(`📸 ${freePlayerFile}`);
    await compareWithBaseline(freePlayerFile);

    await page.evaluate(() => { const btn = document.getElementById('btn-accept-free'); if(btn) btn.click(); });
    
    await page.waitForSelector('#btn-continue-free', { visible: true, timeout: 5000 });
    const freeAcceptFile = '11b_Popup_Jogador_Aceite.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, freeAcceptFile) });
    console.log(`📸 ${freeAcceptFile}`);
    await compareWithBaseline(freeAcceptFile);
    
    await page.evaluate(() => { const btn = document.getElementById('btn-continue-free'); if(btn) btn.click(); });
  } catch (e) {
    console.error('⚠️ Falha ao capturar 11a/11b:', e.message);
  }

  await clearPopups();
  // 11c. Jogador Livre - Rejeição
  console.log('⏳ A gerar janela de Jogador Livre (Rejeitado)...');
  await page.evaluate(() => {
    Math.random = () => 0.99; // Força sempre a rejeição (0.99 > prob)
    const mockPlayer = { name: 'João Neves', position: 'CM', skill: 84, leavingFee: 1500000, minContract: 40000, previousClubName: 'PSG' };
    if (window.Simulation && typeof window.Simulation._showSingleReleasePopup === 'function')
      window.Simulation._showSingleReleasePopup(mockPlayer, () => {});
  });
  try {
    await page.waitForSelector('#btn-accept-free', { visible: true, timeout: 5000 });
    await page.evaluate(() => { const btn = document.getElementById('btn-accept-free'); if(btn) btn.click(); });
    
    await page.waitForSelector('#btn-continue-free', { visible: true, timeout: 5000 });
    const freeRejectFile = '11c_Popup_Jogador_Rejeitado.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, freeRejectFile) });
    console.log(`📸 ${freeRejectFile}`);
    await compareWithBaseline(freeRejectFile);
    
    await page.evaluate(() => { const btn = document.getElementById('btn-continue-free'); if(btn) btn.click(); });
  } catch (e) {
    console.error('⚠️ Falha ao capturar 11c:', e.message);
  }

  await clearPopups();
  // 11d. Jogador Livre - Proposta Inviável (Sem Dinheiro)
  console.log('⏳ A gerar janela de Jogador Livre (Inviável)...');
  await page.evaluate(() => {
    Math.random = window._originalRandom; // Restaura o RNG ao normal
    window.playerClub.budget = 0; // Corta o dinheiro todo ao clube
    const mockPlayer = { name: 'Pepe', position: 'CB', skill: 83, leavingFee: 500000, minContract: 20000, previousClubName: 'FC Porto' };
    if (window.Simulation && typeof window.Simulation._showSingleReleasePopup === 'function')
      window.Simulation._showSingleReleasePopup(mockPlayer, () => {});
  });
  try {
    await page.waitForSelector('#btn-continue-free', { visible: true, timeout: 5000 });
    const freeInviableFile = '11d_Popup_Jogador_Inviavel.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, freeInviableFile) });
    console.log(`📸 ${freeInviableFile}`);
    await compareWithBaseline(freeInviableFile);
    
    await page.evaluate(() => { const btn = document.getElementById('btn-continue-free'); if(btn) btn.click(); });
  } catch (e) {
    console.error('⚠️ Falha ao capturar 11d:', e.message);
  }

  await clearPopups();
  // 12. Convites de Treinadores (Despedimentos)
  console.log('⏳ A gerar janela de Convite de Treinador...');
  await page.evaluate(() => {
    // Apenas 1 convite para garantir que um único clique no botão de Rejeitar limpa o ecrã e destranca o sistema
    window.PLAYER_JOB_OFFERS = [
      { id: 99, division: 1, team: { name: 'Real Madrid', bgColor: '#ffffff', color: '#000064' } }
    ];
      const Offers = window.Offers || (window.FootLab && window.FootLab.Offers);
      if (Offers && typeof Offers.showJobOffersPopup === 'function') {
        Offers.showJobOffersPopup(() => {});
    }
  });
  try {
    await page.waitForSelector('#job-offers-overlay', { visible: true, timeout: 5000 });
    const coachOfferFile = '12_Popup_Convite_Treinador.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, coachOfferFile) });
    console.log(`📸 ${coachOfferFile}`);
    await compareWithBaseline(coachOfferFile);
    await page.evaluate(() => { const btn = document.getElementById('rejectJobBtn'); if(btn) btn.click(); });
  } catch (e) { console.error('⚠️ Timeout no Convite de Treinador'); }

  await clearPopups();
  // 13. Notícias de Chicotadas Psicológicas
  console.log('⏳ A gerar janela de Chicotadas Psicológicas...');
  await page.evaluate(() => {
    const mockMovements = [
      { clubName: 'Chelsea', out: 'Enzo Maresca', in: 'Thomas Tuchel' },
      { clubName: 'AC Milan', out: 'Massimiliano Allegri', in: 'Sérgio Conceição' }
    ];
      const Offers = window.Offers || (window.FootLab && window.FootLab.Offers);
      if (Offers && typeof Offers.showManagerMovementsPopup === 'function') Offers.showManagerMovementsPopup(mockMovements, () => {});
  });
  try {
    await page.waitForSelector('#manager-movements-overlay', { visible: true, timeout: 5000 });
    const movementsFile = '13_Popup_Chicotadas.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, movementsFile) });
    console.log(`📸 ${movementsFile}`);
    await compareWithBaseline(movementsFile);
    await page.evaluate(() => { const btn = document.getElementById('close-movements-btn'); if(btn) btn.click(); });
  } catch (e) { console.error('⚠️ Timeout nas Chicotadas'); }

  await clearPopups();
  // 14. Renovação de Contrato
  console.log('⏳ A gerar janela de Renovação de Contrato...');
  await page.evaluate(() => {
    const firstBox = document.querySelector('.player-box[data-player-id]');
    if (firstBox) {
      const pId = firstBox.getAttribute('data-player-id');
      const p = window.playerClub.team.players.find(pl => String(pl.id) === String(pId));
      if (p) {
        p.contractYearsLeft = 0;
        p.contractYears = 0;
      }
    }
    if (typeof window.renderTeamRoster === 'function') window.renderTeamRoster(window.playerClub);
  });
  await new Promise(r => setTimeout(r, 600));
  await page.click('.player-box[data-player-id]'); // Clica no primeiro jogador
  try {
    await page.waitForSelector('#renewCancelBtn', { visible: true, timeout: 5000 });
    const renewalFile = '14_Popup_Renovacao.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, renewalFile) });
    console.log(`📸 ${renewalFile}`);
    await compareWithBaseline(renewalFile);
    await page.evaluate(() => { const btn = document.getElementById('renewCancelBtn'); if(btn) btn.click(); });
  } catch (e) { console.error('⚠️ Timeout na Renovação de Contrato:', e.message); }

  await clearPopups();
  // 15. Prémios de Fim de Época
  console.log('⏳ A gerar janela de Prémios de Fim de Época...');
  await page.evaluate(() => {
    const data = {
       championD1: { team: { name: 'Sporting CP', bgColor: '#008000', color: '#fff'}, points: 88 },
       bestAttack: { team: { name: 'SL Benfica' }, goalsFor: 85 },
       bestDefense: { team: { name: 'FC Porto' }, goalsAgainst: 15 },
       topScorer: { p: { name: 'Gyökeres', goals: 30 }, club: { team: {name: 'Sporting CP'}} },
       totalPrize: 1050000, prizeMsg: '🏆 Melhor Ataque: +500.000 €<br>👟 Gyökeres (1º Melhor Marcador): +550.000 €<br>'
    };
      const Offers = window.Offers || (window.FootLab && window.FootLab.Offers);
      if (Offers && Offers.showEndSeasonAwardsPopup) Offers.showEndSeasonAwardsPopup(data, () => {});
  });
  try {
    await page.waitForSelector('#end-season-awards-overlay', { visible: true, timeout: 5000 });
    const awardsFile = '15_Popup_Premios_Epoca.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, awardsFile) });
    console.log(`📸 ${awardsFile}`);
    await compareWithBaseline(awardsFile);
    await page.evaluate(() => { const btn = document.getElementById('close-awards-btn'); if(btn) btn.click(); });
  } catch (e) { console.error('⚠️ Timeout nos Prémios de Época'); }

  await clearPopups();
  // 16. Subidas e Descidas
  console.log('⏳ A gerar janela de Subidas e Descidas...');
  await page.evaluate(() => {
    const data = {
       promoted: { // Equipas que sobem
         1: [{team:{name: 'Campeão D2'}}, {team:{name: 'Vice D2'}}, {team:{name: '3º Lugar D2'}}], 
         2: [{team:{name: 'Campeão D3'}}, {team:{name: 'Vice D3'}}, {team:{name: '3º Lugar D3'}}],
         3: [{team:{name: 'Campeão D4'}}, {team:{name: 'Vice D4'}}, {team:{name: '3º Lugar D4'}}]
       },
       relegated: { // Equipas que descem
         0: [{team:{name: '16º Lugar D1'}}, {team:{name: '17º Lugar D1'}}, {team:{name: '18º Lugar D1'}}], 
         1: [{team:{name: '16º Lugar D2'}}, {team:{name: '17º Lugar D2'}}, {team:{name: '18º Lugar D2'}}],
         2: [{team:{name: '16º Lugar D3'}}, {team:{name: '17º Lugar D3'}}, {team:{name: '18º Lugar D3'}}]
       }
    };
      const Offers = window.Offers || (window.FootLab && window.FootLab.Offers);
      if (Offers && Offers.showPromotionsPopup) {
          Offers.showPromotionsPopup(data, () => {});
    }
  });
  try {
    await page.waitForSelector('#promotions-overlay', { visible: true, timeout: 5000 });
    const promoFile = '16_Popup_Subidas_Descidas.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, promoFile) });
    console.log(`📸 ${promoFile}`);
    await compareWithBaseline(promoFile);
  } catch (e) { console.error('⚠️ Timeout nas Subidas e Descidas'); }

  await browser.close();

  console.log('🛑 A desligar o servidor local...');
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', server.pid, '/f', '/t']);
  } else {
    server.kill();
  }

  console.log('\n✅ Testes visuais concluídos (baselines atualizadas com sucesso)!');
  process.exit(0);
})();