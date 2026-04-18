const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

// Criar a pasta se não existir
console.log(`📁 A verificar a pasta de destino: ${SCREENSHOTS_DIR}`);
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR);
  console.log('📁 Pasta "screenshots" criada com sucesso!');
} else {
  console.log('📁 Pasta "screenshots" já existe.');
}

(async () => {
  console.log('🚀 A iniciar o servidor local automaticamente...');
  // Corrige o aviso de deprecation do Node ao usar shell: true com arrays
  const command = process.platform === 'win32' ? 'npx.cmd http-server -p 0' : 'npx http-server -p 0';
  const server = spawn(command, { shell: true });
  
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
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_Setup.png') });
  console.log('📸 01_Setup.png');

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
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_Hub_Equipa.png') });
  console.log('📸 02_Hub_Equipa.png');

  // Função auxiliar para clicar num menu lateral e tirar foto
  const captureMenu = async (menuId, fileName) => {
    console.log(`🖱️ A navegar para: ${menuId}...`);
    await page.click(`#${menuId}`);
    await new Promise(r => setTimeout(r, 500)); // Esperar pelo render da página
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, fileName) });
    console.log(`📸 ${fileName}`);
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
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_MatchBoard.png') });
  console.log('📸 10_MatchBoard.png');

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

  // 11. Jogador Livre (Estilo Elifoot) / Comprar Jogador
  console.log('⏳ A gerar janela de Jogador Livre (Estilo Elifoot)...');
  await page.evaluate(() => {
    const mockPlayer = { 
        name: 'Ángel Di María', 
        position: 'RW', 
        skill: 86, 
        leavingFee: 1200000, 
        minContract: 35000, 
        previousClubName: 'SL Benfica' 
    };
    if (window.Simulation && typeof window.Simulation._showSingleReleasePopup === 'function') {
      window.Simulation._showSingleReleasePopup(mockPlayer, () => {});
    } else if (window.showBuyFreePlayerMenu) {
      window.showBuyFreePlayerMenu(mockPlayer, [mockPlayer], 0);
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_Popup_Jogador_Livre.png') });
  console.log('📸 11_Popup_Jogador_Livre.png');
  await page.evaluate(() => { 
    let btn = document.getElementById('btn-reject-free'); 
    if(!btn) btn = document.getElementById('buyFreeCancelBtn');
    if(btn) btn.click(); 
  });

  // 12. Convites de Treinadores (Despedimentos)
  console.log('⏳ A gerar janela de Convite de Treinador...');
  await page.evaluate(() => {
    // Apenas 1 convite para garantir que um único clique no botão de Rejeitar limpa o ecrã e destranca o sistema
    window.PLAYER_JOB_OFFERS = [
      { id: 99, division: 1, team: { name: 'Real Madrid', bgColor: '#ffffff', color: '#000064' } }
    ];
    if (window.Offers && typeof window.Offers.showJobOffersPopup === 'function') {
      window.Offers.showJobOffersPopup(() => {});
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_Popup_Convite_Treinador.png') });
  console.log('📸 12_Popup_Convite_Treinador.png');
  await page.evaluate(() => { const btn = document.getElementById('rejectJobBtn'); if(btn) btn.click(); });

  // 13. Notícias de Chicotadas Psicológicas
  console.log('⏳ A gerar janela de Chicotadas Psicológicas...');
  await page.evaluate(() => {
    const mockMovements = [
      { clubName: 'Chelsea', out: 'Enzo Maresca', in: 'Thomas Tuchel' },
      { clubName: 'AC Milan', out: 'Massimiliano Allegri', in: 'Sérgio Conceição' }
    ];
    if (window.Offers && typeof window.Offers.showManagerMovementsPopup === 'function') window.Offers.showManagerMovementsPopup(mockMovements, () => {});
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_Popup_Chicotadas.png') });
  console.log('📸 13_Popup_Chicotadas.png');
  await page.evaluate(() => { const btn = document.getElementById('close-movements-btn'); if(btn) btn.click(); });

  // 14. Renovação de Contrato
  console.log('⏳ A gerar janela de Renovação de Contrato...');
  await page.evaluate(() => {
    const p = window.playerClub.team.players[0];
    p.contractYearsLeft = 0; p.contractYears = 0; // Forçar o * a desaparecer para poder clicar
    if (typeof window.renderTeamRoster === 'function') window.renderTeamRoster(window.playerClub);
  });
  await new Promise(r => setTimeout(r, 600));
  await page.click('.player-box[data-player-id]'); // Clica no primeiro jogador
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_Popup_Renovacao.png') });
  console.log('📸 14_Popup_Renovacao.png');
  await page.evaluate(() => { const btn = document.getElementById('renewCancelBtn'); if(btn) btn.click(); });

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
    if (window.Offers && window.Offers.showEndSeasonAwardsPopup) window.Offers.showEndSeasonAwardsPopup(data, () => {});
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_Popup_Premios_Epoca.png') });
  console.log('📸 15_Popup_Premios_Epoca.png');
  await page.evaluate(() => { const btn = document.getElementById('close-awards-btn'); if(btn) btn.click(); });

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
    if (window.Offers && window.Offers.showPromotionsPopup) {
        window.Offers.showPromotionsPopup(data, () => {});
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16_Popup_Subidas_Descidas.png') });
  console.log('📸 16_Popup_Subidas_Descidas.png');

  await browser.close();
  console.log('✅ Concluído com sucesso!');
  console.log(`📂 Podes encontrar as tuas imagens exatamente aqui: ${SCREENSHOTS_DIR}`);

  console.log('🛑 A desligar o servidor local...');
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', server.pid, '/f', '/t']);
  } else {
    server.kill();
  }
  process.exit(0);
})();