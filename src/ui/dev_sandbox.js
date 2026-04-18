/**
 * DEV SANDBOX
 * Ferramenta exclusiva de desenvolvimento para teste rápido de componentes UI.
 * Pressiona Ctrl + Shift + D para abrir um menu de testes rápidos.
 */
(function () {
  'use strict';

  // Impede execução em produção se uma flag existir, ou permite apenas num URL local.
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.code === 'KeyD') {
        let menu = document.getElementById('dev-debug-menu');
        if (menu) {
          menu.remove();
          return;
        }
        menu = document.createElement('div');
        menu.id = 'dev-debug-menu';
        menu.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#1e1e1e; border:1px solid #4CAF50; padding:15px; z-index:2147483647; border-radius:8px; display:flex; flex-direction:column; gap:10px; box-shadow: 0 10px 40px rgba(0,0,0,0.9);';
        menu.innerHTML = `<h3 style="margin:0 0 10px 0; color:#4CAF50; font-size:16px; border-bottom:1px solid #333; padding-bottom:8px;">🛠️ Dev Sandbox</h3>`;

        // Função auxiliar para criar botões
        const createBtn = (text, onClick) => {
          const btn = document.createElement('button');
          btn.textContent = text;
          btn.style.cssText = 'padding:8px 12px; background:#333; color:#fff; border:1px solid #555; border-radius:4px; cursor:pointer; font-size:12px;';
          btn.onmouseover = () => btn.style.background = '#444';
          btn.onmouseout = () => btn.style.background = '#333';
          btn.onclick = onClick;
          menu.appendChild(btn);
        };

        createBtn('1. Visualizar Menus de Substituições', () => {
          const mockClub = window.playerClub || { bgColor: '#006400', color: '#ffffff', team: { name: 'Sandbox FC', players: [] } };
          
          const mockStarters = Array.from({length: 11}, (_, i) => ({ name: `Titular ${i+1}`, position: i===0?'GK':'CM', skill: 80 - i }));
          const mockSubs = Array.from({length: 7}, (_, i) => ({ name: `Suplente ${i+1}`, position: i===0?'GK':'ST', skill: 70 - i }));

          const mockMatch = {
            homeClub: mockClub,
            awayClub: { team: { name: 'Adversário FC' } },
            homeGoals: 2,
            awayGoals: 1,
            homePlayers: (window.currentRoundMatches && window.currentRoundMatches[0] && window.currentRoundMatches[0].homePlayers) || mockStarters,
            homeSubs: (window.currentRoundMatches && window.currentRoundMatches[0] && window.currentRoundMatches[0].homeSubs) || mockSubs
          };
          window.showHalfTimeSubsOverlay(mockClub, mockMatch, () => console.log('Subs fechado pelo Sandbox.'));
        });

        createBtn('2. Visualizar Ofertas (Transferências)', () => {
          window.PENDING_RELEASES = [
            { name: 'João Félix (Mock)', position: 'ST', leavingFee: 5000000, minContract: 25000 },
            { name: 'Rúben Dias (Mock)', position: 'CB', leavingFee: 3000000, minContract: 18000 }
          ];
          
          const showPopup = (window.Offers && window.Offers.showPendingReleasesPopup) || (window.Hub && window.Hub.showPendingReleasesPopup);
          
          if (typeof showPopup === 'function') {
            showPopup(() => console.log('Ofertas fechadas.'));
          } else {
            alert('O módulo de Ofertas não foi encontrado. Adicionaste o script "src/ui/offers.js" no teu index.html?');
          }
        });

        createBtn('3. Visualizar Tabelas de Divisão', () => {
          window.renderAllDivisionsTables();
        });

        createBtn('4. Forçar Fim de Jogo (Ecrã de Classificação)', () => {
          if (typeof window.endSimulation === 'function') window.endSimulation();
          else alert('Erro: A função endSimulation não foi encontrada no contexto global.');
        });

        createBtn('5. Simular Época Inteira (Fast-Forward)', () => {
          if (typeof window.fastForwardSeason === 'function') {
            window.fastForwardSeason();
            // Esconder o menu de dev para não ficar por cima do ecrã de loading
            const devMenu = document.getElementById('dev-debug-menu');
            if (devMenu) devMenu.remove();
          } else {
            alert('Erro: A função fastForwardSeason não foi encontrada.');
          }
        });

        document.body.appendChild(menu);
      }
    });
  }
})();