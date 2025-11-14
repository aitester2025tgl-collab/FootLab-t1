// ui/hub.js - hub rendering functions extracted from ui.js
(function(){
    // small helpers: delegate to shared ColorUtils when available
    function hexToRgb(hex) {
        if (window.ColorUtils && typeof window.ColorUtils.hexToRgb === 'function') return window.ColorUtils.hexToRgb(hex);
        if (!hex) return [46,46,46];
        let h = String(hex).replace('#','');
        if (h.length === 3) h = h.split('').map(c=>c+c).join('');
        const v = parseInt(h,16);
        if (isNaN(v)) return [46,46,46];
        return [(v>>16)&255, (v>>8)&255, v&255];
    }

    function luminance(rgb) {
        if (window.ColorUtils && typeof window.ColorUtils.luminance === 'function') return window.ColorUtils.luminance(rgb);
        if (!rgb) return 0;
        const s = rgb.map(v => { const c = v/255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); });
        return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
    }

    function getReadableTextColor(bg, pref) {
        if (window.ColorUtils && typeof window.ColorUtils.getReadableTextColor === 'function') return window.ColorUtils.getReadableTextColor(bg, pref);
        return pref || '#ffffff';
    }

    // compute contrast ratio between two hex colors (returns number >=1)
    function contrastRatio(hexA, hexB) {
        try {
            const a = luminance(hexToRgb(hexA || '#000'));
            const b = luminance(hexToRgb(hexB || '#fff'));
            const L1 = Math.max(a,b);
            const L2 = Math.min(a,b);
            return (L1 + 0.05) / (L2 + 0.05);
        } catch(e) { return 1; }
    }

    // compute average skill for a club (used in multiple places)
    function avgSkill(club){
        if (!club || !club.team || !Array.isArray(club.team.players) || club.team.players.length === 0) return 0;
        const sum = club.team.players.reduce((s,p)=> s + (p && typeof p.skill === 'number' ? p.skill : 0), 0);
        return Math.round(sum / club.team.players.length);
    }

    function initHubUI() {
        // Full implementation moved from ui.js into this module
        console.log('=== Inicializando Hub UI ===');
        console.log('playerClub:', window.Elifoot.playerClub);

        if (!window.Elifoot.playerClub) {
            console.error('ERRO: playerClub não existe!');
            alert('ERRO: playerClub não foi inicializado!');
            return;
        }

        console.log('playerClub.team:', window.Elifoot.playerClub.team);
        console.log('playerClub.team.players:', window.Elifoot.playerClub.team ? window.Elifoot.playerClub.team.players : 'N/A');
        console.log('Número de jogadores:', window.Elifoot.playerClub.team && window.Elifoot.playerClub.team.players ? window.Elifoot.playerClub.team.players.length : 0);

        // Aplicar cor de fundo e menu com contraste legível
        const hubScreen = document.getElementById('screen-hub');
        const hubMenu = document.getElementById('hub-menu');
    if (hubScreen && window.Elifoot.playerClub.team) {
            // derive team colors with safe fallbacks
            let bg = (window.Elifoot.playerClub.team && window.Elifoot.playerClub.team.bgColor) ? window.Elifoot.playerClub.team.bgColor : '#2e2e2e';
            let fg = (window.Elifoot.playerClub.team && window.Elifoot.playerClub.team.color) ? window.Elifoot.playerClub.team.color : '#ffffff';
            // If bg or fg are not valid hex, fallback
            if (!/^#([0-9a-f]{3}){1,2}$/i.test(bg)) bg = '#2e2e2e';
            if (!/^#([0-9a-f]{3}){1,2}$/i.test(fg)) fg = '#ffffff';

            // If background is too dark/light, adjust for comfort
            function adjustColor(hex, amt) {
                let c = hex.replace('#','');
                if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
                let num = parseInt(c,16);
                let r = Math.min(255, Math.max(0, ((num>>16)&0xFF) + amt));
                let g = Math.min(255, Math.max(0, ((num>>8)&0xFF) + amt));
                let b = Math.min(255, Math.max(0, (num&0xFF) + amt));
                return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
            }
            // Lighten if too dark, darken if too light
            const bgRgb = hexToRgb(bg);
            const bgLum = luminance(bgRgb);
            if (bgLum < 0.18) bg = adjustColor(bg, 32); // lighten dark
            if (bgLum > 0.85) bg = adjustColor(bg, -32); // darken light

            // Always use club's two main colors for menu
            let menuFg = fg;
            // If the club's color is white or black, fallback to the other for contrast
            if (/^#?fff?f?f?$/i.test(menuFg)) menuFg = '#000';
            if (/^#?000?0?0?$/i.test(menuFg)) menuFg = '#fff';
            // Pick best stroke (frame) color for text: black or white, whichever contrasts more with fg
            const fgRgb = hexToRgb(menuFg);
            const blackContrast = luminance(fgRgb) > 0.5 ? 21 : 1;
            const whiteContrast = luminance(fgRgb) > 0.5 ? 1 : 21;
            const stroke = blackContrast >= whiteContrast ? '#000' : '#fff';

            // Use solid background (no gradient) for better readability across the whole hub
            hubScreen.style.backgroundImage = 'none';
            hubScreen.style.backgroundColor = bg; // solid base color
            // expose CSS variables to unify panel styling
            hubScreen.style.setProperty('--hub-bg', bg);
            // derive a panel background by darkening or lightening slightly to stay distinct yet uniform
            const panelBgAdjust = bgLum < 0.35 ? 18 : -22; // dark bg -> lighten a bit; light bg -> darken a bit
            const panelBg = adjustColor(bg, panelBgAdjust);
            hubScreen.style.setProperty('--hub-panel-bg', panelBg);
            hubScreen.style.color = menuFg;
            // Set CSS vars for menu
            if (hubMenu) {
                hubMenu.style.setProperty('--team-menu-bg', panelBg);
                hubMenu.style.setProperty('--team-menu-fg', menuFg);
                hubMenu.style.setProperty('--team-menu-stroke', stroke);
            }
            console.log('Cor aplicada (gradiente):', bg, ' - texto:', menuFg, 'menu fg:', hubMenu ? hubMenu.style.getPropertyValue('--team-menu-fg') : '', 'stroke:', stroke);
        }

        // Apply team colors to tactic panel so tactics match the team identity
        const tacticPanel = document.getElementById('hub-tactic-panel');
            if (tacticPanel && window.Elifoot.playerClub && window.Elifoot.playerClub.team) {
                const tBg = window.Elifoot.playerClub.team.bgColor || '#2E7D32';
                const tFg = getReadableTextColor(tBg, window.Elifoot.playerClub.team.color || '#ffffff');
            tacticPanel.style.backgroundColor = tBg;
            tacticPanel.style.color = tFg;
            // slightly tweak local CSS variables if needed
            tacticPanel.style.borderColor = 'rgba(0,0,0,0.2)';
        }
        
    // Adicionar listener ao botão de simulação
        const simulateBtn = document.getElementById('simulateBtnHub');
            if (simulateBtn && typeof window.simulateDay === 'function') {
            simulateBtn.addEventListener('click', (e)=>{
                // show pending releases offers before simulation so user can propose/sign
                if (window.Elifoot && window.Elifoot.Offers && typeof window.Elifoot.Offers.showPendingReleasesPopup === 'function') {
                    window.Elifoot.Offers.showPendingReleasesPopup(() => { try{ window.simulateDay(); } catch(e){ console.warn('simulateDay failed after offers popup', e); } });
                } else {
                    window.simulateDay();
                }
            });
            console.log('Listener de simulação adicionado');
        }

        // Adicionar listeners aos botões do menu
        const menuButtons = document.querySelectorAll('#hub-menu .hub-menu-btn');
        console.log('Botões de menu encontrados:', menuButtons.length);
        
        menuButtons.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const menuId = e.target.id;
                // Remove active from all
                menuButtons.forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'rgba(255,255,255,0.07)';
                    b.style.color = getReadableTextColor(window.Elifoot.playerClub.team.bgColor, window.Elifoot.playerClub.team.color || '#008000');
                    b.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
                });
                // Add active to selected
                e.target.classList.add('active');
                e.target.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.13) 0%, rgba(0,0,0,0.13) 100%)';
                e.target.style.color = getReadableTextColor(window.Elifoot.playerClub.team.bgColor, window.Elifoot.playerClub.team.color || '#008000');
                e.target.style.boxShadow = '0 6px 18px rgba(0,0,0,0.16)';
                // If entering the team menu, allow pending release offers popup first
                if (menuId === 'menu-team' && window.Elifoot && window.Elifoot.Offers && typeof window.Elifoot.Offers.showPendingReleasesPopup === 'function') {
                    window.Elifoot.Offers.showPendingReleasesPopup(() => renderHubContent(menuId));
                } else {
                    renderHubContent(menuId);
                }
            });
        });

        // Expose a helper to keep budget displays in-sync across UI
        window.updateBudgetDisplays = function(club) {
            try {
                const headerBudget = document.getElementById('club-budget');
                const finBudget = document.getElementById('clubBudgetDisplay');
                const revEl = document.getElementById('club-revenue');
                const expEl = document.getElementById('club-expenses');
                const val = Number((club && (Number(club.budget) || 0)) || 0);
                if (headerBudget) headerBudget.textContent = formatMoney(val);
                if (finBudget) finBudget.textContent = formatMoney(val);
                try {
                    const rev = Number((club && (Number(club.revenue) || 0)) || 0);
                    const exp = Number((club && (Number(club.expenses) || 0)) || 0);
                    if (revEl) revEl.textContent = formatMoney(rev);
                    if (expEl) expEl.textContent = formatMoney(exp);
                } catch(e) { /* ignore */ }
            } catch (e) { /* ignore */ }
        };

        // Renderizar conteúdo padrão (EQUIPA)
        const defaultBtn = document.getElementById('menu-team');
        if (defaultBtn) {
            defaultBtn.classList.add('active');
            defaultBtn.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.13) 0%, rgba(0,0,0,0.13) 100%)';
            defaultBtn.style.color = getReadableTextColor(window.Elifoot.playerClub.team.bgColor, window.Elifoot.playerClub.team.color || '#008000');
            defaultBtn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.16)';
            renderHubContent('menu-team');
            try { if (typeof window.updateBudgetDisplays === 'function') window.updateBudgetDisplays(window.playerClub); } catch(e){}
        }
        
        // Inicializar painel de táticas
        if (typeof window.initTacticPanel === 'function') window.initTacticPanel();
        
        console.log('=== Hub UI inicializado com sucesso ===');
    }

    function renderHubContent(menuId) {
        // Implementation moved from ui.js
        const content = document.getElementById('hub-main-content');
        if (!content) return;
        
        content.innerHTML = '';
        
        switch (menuId) {
            case 'menu-team':
                renderTeamRoster(window.playerClub);
                break;
            case 'menu-load':
                try {
                    const raw = localStorage.getItem('elifoot_save_snapshot');
                    if (!raw) {
                        content.innerHTML = '<h2>Carregar Jogo</h2><p>Nenhum jogo salvo encontrado.</p>';
                        break;
                    }
                    const snap = JSON.parse(raw);
                    const html = `<h2>Jogo salvo</h2><div style="padding:12px;background:rgba(0,0,0,0.06);border-radius:8px;">
                        <div><strong>Jornada:</strong> ${snap.currentJornada || '-'} </div>
                        <div><strong>Clube do jogador:</strong> ${(snap.playerClub && snap.playerClub.team && snap.playerClub.team.name) || '-'}</div>
                        <div style="margin-top:10px;"><button id="loadSavedBtn" style="padding:8px 12px;border-radius:8px;border:none;">Carregar jogo salvo</button></div>
                    </div>`;
                    content.innerHTML = html;
                    const btn = document.getElementById('loadSavedBtn');
                    if (btn) btn.addEventListener('click', ()=>{
                        if (typeof window.loadSavedGame === 'function') window.loadSavedGame();
                    });
                } catch (err) {
                    content.innerHTML = '<h2>Carregar Jogo</h2><p>Erro ao ler o save.</p>';
                }
                break;
            case 'save-game':
                try {
                    content.innerHTML = `<h2>Gravar Jogo</h2><p>Guarde o estado atual do jogo para carregar mais tarde.</p><div style="margin-top:10px;"><button id="doSaveBtn" style="padding:8px 12px;border-radius:8px;border:none;">Gravar agora</button></div>`;
                    const btn = document.getElementById('doSaveBtn');
                    if (btn) btn.addEventListener('click', ()=>{
                        try {
                            const snap = { currentJornada: window.currentJornada, playerClub: window.playerClub, allDivisions: window.allDivisions, allClubs: window.allClubs, currentRoundMatches: window.currentRoundMatches };
                            localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
                            alert('Jogo gravado com sucesso.');
                        } catch (e) { alert('Erro ao gravar o jogo: ' + (e && e.message)); }
                    });
                } catch (e) { content.innerHTML = '<h2>Gravar Jogo</h2><p>Erro ao preparar gravação.</p>'; }
                break;
            case 'menu-liga':
                renderLeagueTable();
                break;
            case 'menu-next-match':
                content.innerHTML = `<h2>Próximo Jogo</h2><div id="nextMatchDetails">${buildNextOpponentHtml()}</div>`;
                break;
            case 'menu-standings':
                renderAllDivisionsTables();
                break;
            case 'menu-transfers':
                renderTransfers();
                break;
            case 'menu-finance':
                try {
                    const club = window.playerClub;
                    if (!club) { content.innerHTML = '<h2>Finanças</h2><p>Nenhum clube do jogador definido.</p>'; break; }
                    const stadiumCap = Number(club.stadiumCapacity || club.stadium || 10000) || 10000;
                    const ticketPrice = Number(club.ticketPrice || club.ticket || 20) || 20;
                    const bud = Number(club.budget || 0) || 0;
                    content.innerHTML = `
                        <h2>Finanças</h2>
                        <div style="display:flex;flex-direction:column;gap:10px;max-width:640px;">
                            <div><strong>Orçamento:</strong> <span id="clubBudgetDisplay">${formatMoney(bud)}</span></div>
                            <div><strong>Capacidade do Estádio (atual):</strong> <span id="stadiumCapacityDisplay">${stadiumCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.')}</span> lugares</div>
                            <div><strong>Limite atual do motor:</strong> 65.000 lugares (pode expandir até 100.000)</div>
                            <div style="display:flex;gap:12px;align-items:center;">
                                <label style="min-width:160px;">Aumentar estádio (%)</label>
                                <input id="upgradePercentInput" type="number" min="1" max="100" value="10" style="width:80px;padding:6px;border-radius:6px;border:1px solid #ccc;" />
                                <button id="upgradeStadiumBtn" style="padding:8px 12px;border-radius:8px;background:#2b7; border:none; cursor:pointer;">Aumentar</button>
                                <div id="upgradeCostDisplay" style="margin-left:8px;color:rgba(0,0,0,0.6)"></div>
                            </div>
                            <div style="display:flex;gap:12px;align-items:center;">
                                <label style="min-width:160px;">Preço do bilhete (€)</label>
                                <input id="ticketPriceInput" type="number" min="1" value="${ticketPrice}" style="width:100px;padding:6px;border-radius:6px;border:1px solid #ccc;" />
                                <button id="setTicketBtn" style="padding:8px 12px;border-radius:8px;background:#58a; border:none; cursor:pointer;color:#fff;">Guardar</button>
                                <div id="estRevenueDisplay" style="margin-left:8px;color:rgba(0,0,0,0.6)"></div>
                            </div>
                            <div style="opacity:0.9;font-size:0.92em;color:rgba(0,0,0,0.7);">Notas: o custo por lugar aumenta com o tamanho atual do estádio. A receita dos jogos entra no orçamento do clube após o fim de cada jogo.</div>
                        </div>
                    `;

                    // attach handlers
                    setTimeout(()=>{
                        const pctIn = document.getElementById('upgradePercentInput');
                        const upgradeBtn = document.getElementById('upgradeStadiumBtn');
                        const costDisp = document.getElementById('upgradeCostDisplay');
                        const capDisp = document.getElementById('stadiumCapacityDisplay');
                        const budDisp = document.getElementById('clubBudgetDisplay');
                        const priceIn = document.getElementById('ticketPriceInput');
                        const setTicket = document.getElementById('setTicketBtn');
                        const estDisp = document.getElementById('estRevenueDisplay');

                        function calcCostForPercent(pct) {
                            const currentCap = Number(club.stadiumCapacity || club.stadium || 10000);
                            const seatsAdded = Math.ceil(currentCap * (pct/100));
                            // cost per seat increases with stadium size
                            const costPerSeat = Math.round(20 + (currentCap / 1000) * 2); // base 20€, grows with size
                            const total = seatsAdded * costPerSeat;
                            return { seatsAdded, costPerSeat, total };
                        }

                        function updateCostDisplay() {
                            const pct = Math.max(1, Math.min(100, Number(pctIn.value || 10)));
                            const c = calcCostForPercent(pct);
                            costDisp.textContent = `${c.seatsAdded} lugares → custo aprox. ${formatMoney(c.total)} (${c.costPerSeat}€/lugar)`;
                            // estimated revenue per match at current ticket price
                            const estAttendance = (window.Finance && typeof window.Finance.computeMatchAttendance === 'function') ? window.Finance.computeMatchAttendance({ homeClub: club, awayClub: {} }).attendance : Math.min(Number(club.stadiumCapacity||10000), 10000);
                            estDisp.textContent = estAttendance ? `Estimativa por jogo: ${estAttendance} espectadores → receita ~ ${formatMoney(Math.round(estAttendance * Number(priceIn.value || club.ticketPrice || 20)))} ` : '';
                        }

                        pctIn.addEventListener('input', updateCostDisplay);
                        priceIn.addEventListener('input', updateCostDisplay);
                        updateCostDisplay();

                        upgradeBtn.addEventListener('click', ()=>{
                            const pct = Math.max(1, Math.min(100, Number(pctIn.value || 10)));
                            const c = calcCostForPercent(pct);
                            const currentBudget = Number(club.budget || 0);
                            if (c.total > currentBudget) { alert('Orçamento insuficiente para esta expansão.'); return; }
                            // apply upgrade: cannot exceed absolute max 100000
                            const currentCap = Number(club.stadiumCapacity || club.stadium || 10000);
                            const newCap = Math.min(100000, currentCap + c.seatsAdded);
                            club.stadiumCapacity = newCap;
                            club.budget = currentBudget - c.total;
                            // persist snapshot
                            try {
                                const snap = { currentJornada: currentJornada, playerClub: playerClub, allDivisions: allDivisions, allClubs: allClubs, currentRoundMatches: currentRoundMatches };
                                localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
                            } catch(e){ console.warn('Não foi possível guardar snapshot após upgrade', e); }
                            // update displays
                            capDisp.textContent = newCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');
                            budDisp.textContent = formatMoney(club.budget || 0);
                            updateCostDisplay();
                            alert(`Expansão aplicada: +${c.seatsAdded} lugares (novo total ${newCap}). Custo: ${formatMoney(c.total)}.`);
                        });

                        setTicket.addEventListener('click', ()=>{
                            const price = Math.max(1, Math.round(Number(priceIn.value || club.ticketPrice || 20)));
                            club.ticketPrice = price;
                            try {
                                const snap = { currentJornada: currentJornada, playerClub: playerClub, allDivisions: allDivisions, allClubs: allClubs, currentRoundMatches: currentRoundMatches };
                                localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
                            } catch(e){ console.warn('Não foi possível guardar snapshot após alteração de preço', e); }
                            alert('Preço do bilhete atualizado para ' + formatMoney(price));
                            updateCostDisplay();
                        });
                    }, 10);
                } catch (e) {
                    console.warn('Erro ao renderizar menu-finance:', e);
                    content.innerHTML = '<h2>Finanças</h2><p>Erro ao montar painel financeiro.</p>';
                }
                break;
            default:
                content.innerHTML = '<h2>Bem-vindo!</h2><p>Selecione uma opção no menu.</p>';
        }
    }

    function renderTeamRoster(club) {
        const content = document.getElementById('hub-main-content');
        if (!content) return;

        if (!club || !club.team || !club.team.players || club.team.players.length === 0) {
            content.innerHTML = '<h2>ERRO</h2><p>Equipa não tem jogadores!</p>';
            return;
        }

        const teamBg = (club.team && club.team.bgColor) || '#2e2e2e';
        // choose a readable text color for roster/menu elements (prefer team color but ensure contrast)
        let teamFg = getReadableTextColor(teamBg, (club.team && club.team.color) || '#ffffff');
        try {
            const c = contrastRatio(teamBg, (club.team && club.team.color) || teamFg);
            if (c < 4.5) {
                // fallback: pick black on light bg, white on dark bg
                const lum = luminance(hexToRgb(teamBg));
                teamFg = lum > 0.5 ? '#000000' : '#ffffff';
            }
        } catch (e) { /* ignore */ }

        // Ordenar jogadores por posição e skill
        const players = Array.isArray(club.team.players) ? club.team.players.slice() : [];

        // Normalize many possible position codes to canonical short codes used in UI
        function normalizePosition(pos) {
            if (!pos) return '';
            const p = String(pos || '').toUpperCase().trim();
            // common variants mapping
            if (p === 'GK' || p === 'GOALKEEPER') return 'GK';
            if (/^(CB|CENTERBACK|CENTREBACK|CEN|CTR|DC|DF)$/.test(p)) return 'CB';
            if (/^(LB|LWB|LEFTBACK|LEFTBACKWARD)$/.test(p)) return 'LB';
            if (/^(RB|RWB|RIGHTBACK|RIGHTBACKWARD)$/.test(p)) return 'RB';
            if (/^(CDM|DM|DEFMID|HOLDING)$/.test(p)) return 'CM';
            if (/^(CM|MC|MID|MF|MIDFIELDER|CENTRAL)$/.test(p)) return 'CM';
            // Treat attacking-mid (AM) as central-mid (CM) for UI normalization
            if (/^(AM|CAM|OM|SS|SH|ATT|AMF)$/.test(p)) return 'CM';
            if (/^(LW|LM|LEFTWING|LEFT)$/.test(p)) return 'LW';
            if (/^(RW|RM|RIGHTWING|RIGHT)$/.test(p)) return 'RW';
            if (/^(ST|CF|FW|FORWARD|STRIKER)$/.test(p)) return 'ST';
            // fallback: if starts with D -> defender, M -> midfield, A/F -> attacker
            if (/^D/.test(p)) return 'CB';
            if (/^M/.test(p)) return 'CM';
            if (/^F|^A|^S/.test(p)) return 'ST';
            return p; // unknown, return as-is so it sorts to the end
        }

    const positionOrder = { 'GK': 1, 'CB': 2, 'LB': 2, 'RB': 2, 'DF': 2, 'CM': 3, 'LW': 3, 'RW': 3, 'ST': 4 };

        // Attach normalizedPosition for display/sorting without mutating original
        const enriched = players.map(p => Object.assign({}, p, { _normPos: normalizePosition(p.position || p.pos) }));

        const sortedPlayers = enriched.sort((a, b) => {
            const posA = positionOrder[a._normPos] || 5;
            const posB = positionOrder[b._normPos] || 5;
            if (posA !== posB) return posA - posB;
            return (b.skill || 0) - (a.skill || 0);
        });

    // Calcular altura por linha para caber tudo sem scroll (tamanho similar às match lines)
    // Reduced headerSpace so the roster uses more vertical area and rows are smaller by default
    const headerSpace = 100;
        const availHeight = Math.max(300, window.innerHeight - headerSpace);
        const rowHeight = Math.max(18, Math.floor(availHeight / (sortedPlayers.length + 2)));

        // Build a roster table with position, name, skill bar, skill number and salary (+ contract star)
        let html = `<div class="hub-box team-roster-grid" style="color:${teamFg}; overflow:hidden;">
            <h2 style="margin:0 0 12px 0; font-size:1.3em;">PLANTEL (${sortedPlayers.length} jogadores)</h2>
            <div style="display:flex; flex-direction:column; gap:2px; font-size:0.85em;">`;

        // compute readable color for player names
        const playerNameColor = teamFg;
        sortedPlayers.forEach(p => {
            const skill = p.skill || 0;
            const barColor = skill >= 80 ? '#4CAF50' : skill >= 70 ? '#8BC34A' : skill >= 60 ? '#FFC107' : '#F44336';
            const salary = p.salary || 0;
            // Treat players with no contract (0 years) as 'free-to-sign' marker '*'
            const contractLeft = (typeof p.contractYearsLeft !== 'undefined') ? p.contractYearsLeft : (typeof p.contractYears !== 'undefined' ? p.contractYears : 0);
            const endsMarker = Number(contractLeft) === 0 ? '*' : '';
            const displayPos = p._normPos || (p.position || p.pos || '');
            html += `<div class="player-row" data-player-id="${p.id}" style="display:flex; gap:8px; align-items:center; padding:4px 6px; min-height:${rowHeight}px; background:rgba(0,0,0,0.04); border-radius:4px;">
                <div style="width:38px; font-weight:700; text-align:center;">${displayPos}</div>
                <div class="player-name" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; color:${playerNameColor};">${p.name}</div>
                <div style="width:80px;">
                    <div style="background:rgba(0,0,0,0.12); height:10px; border-radius:5px; overflow:hidden;">
                        <div style="width:${skill}%; background:${barColor}; height:100%;"></div>
                    </div>
                </div>
                <div style="width:36px; text-align:center; font-weight:700;">${skill}</div>
                <div class="player-salary" data-player-id="${p.id}" style="width:80px; text-align:right; color:rgba(255,255,255,0.9);">${formatMoney(salary)}${endsMarker ? ' ' + endsMarker : ''}</div>
            </div>`;
        });

        html += `</div></div>`;
        content.innerHTML = html;

        // Attach negotiation handlers to salary cells and full player rows so the user can propose offers
        setTimeout(() => {
            try {
                const salaryEls = content.querySelectorAll('.player-salary');
                salaryEls.forEach(el => {
                    el.style.cursor = 'pointer';
                    el.title = 'Clique para negociar contrato deste jogador';
                    // remove existing handler if re-render
                    el.replaceWith(el.cloneNode(true));
                });
                // need to re-query after cloning
                const fresh = content.querySelectorAll('.player-salary');
                fresh.forEach(el => {
                    el.addEventListener('click', () => {
                        const pid = Number(el.dataset.playerId);
                        const player = (club.team && Array.isArray(club.team.players)) ? club.team.players.find(p=>p.id === pid) : null;
                        if (!player) return alert('Jogador não encontrado');

                        const current = Number(player.salary || 0);
                        const proposedStr = window.prompt(`Negociar salário para ${player.name}\nSalário atual: ${formatMoney(current)}\nIntroduza salário mensal proposto (número):`, String(current));
                        if (proposedStr === null) return; // user cancelled
                        const proposed = Math.max(1, Math.round(Number(proposedStr) || 0));
                        const yearsStr = window.prompt('Duração do contrato em anos (ex: 1 ou 0):', String(Number(player.contractYears || 1)));
                        if (yearsStr === null) return;
                        const years = Math.max(0, Math.min(10, Number(yearsStr) || 1));

                        if (window.Finance && typeof window.Finance.negotiatePlayerContract === 'function') {
                            const res = window.Finance.negotiatePlayerContract(club, pid, proposed, years);
                            if (!res) return alert('Erro na negociação (resultado inválido).');
                            const prob = typeof res.acceptProb === 'number' ? res.acceptProb : 0;
                            if (res.accepted) {
                                alert(`${player.name} aceitou a oferta!\nNovo salário: ${formatMoney(player.salary)}\nProbabilidade estimada: ${(prob*100).toFixed(1)}%`);
                            } else {
                                alert(`${player.name} rejeitou a oferta.\nProbabilidade estimada: ${(prob*100).toFixed(1)}%`);
                            }
                            // re-render roster so salary display updates
                            renderTeamRoster(club);
                        } else {
                            alert('Serviço de negociação indisponível.');
                        }
                    });
                });
                // attach handlers to full player rows as well (click row to negotiate or offer contract)
                const rowEls = content.querySelectorAll('.player-row');
                rowEls.forEach(r => {
                    r.style.cursor = 'pointer';
                    r.title = 'Clique para negociar ou oferecer contrato';
                    r.replaceWith(r.cloneNode(true));
                });
                const freshRows = content.querySelectorAll('.player-row');
                freshRows.forEach(r => {
                    r.addEventListener('click', (ev) => {
                        // if user clicked directly on the salary cell, that handler will run first; avoid double-handling
                        if (ev.target && ev.target.classList && ev.target.classList.contains('player-salary')) return;
                        const pid = Number(r.dataset.playerId);
                        const player = (club.team && Array.isArray(club.team.players)) ? club.team.players.find(p=>p.id === pid) : null;
                        if (!player) return;
                        // Show action menu: Renew (only if contract ending) and Sell
                        showPlayerActionMenu(player, club);
                    });
                });
            } catch (e) { console.warn('Failed to attach negotiation handlers', e); }
        }, 10);

        // Floating opponent box (simplified)
        createFloatingOpponentBox(teamFg);
    }

    function createFloatingOpponentBox(teamFg) {
        // Prefer rendering into the inline next opponent box if present
        const inlineId = 'next-opponent-box';
        const detailsId = 'nextOpponentDetails';
        let inlineEl = document.getElementById(inlineId);
        let floatEl = document.getElementById('nextOpponentFloating');
        
        const matches = window.currentRoundMatches || [];
        const player = window.playerClub;
        let next = null;
        
        if (player) {
            next = matches.find(m => !m.isFinished && (m.homeClub === player || m.awayClub === player));
        }

        // determine the opponent club object and its display name
        let opponent = null;
        if (next) opponent = (next.homeClub === player ? next.awayClub : next.homeClub);

        const opponentName = next ? ((opponent && opponent.team && opponent.team.name) || (opponent && opponent.name) || '—') : '—';

        const positionText = (() => {
            if (!next) return '—';
            if (!opponent) return '—';
            const divIdx = (opponent.division || 1) - 1;
            const divisionClubs = (window.allDivisions && window.allDivisions[divIdx]) || [];
            const sorted = [...divisionClubs].sort((a,b) => (b.points||0) - (a.points||0));
            const pos = sorted.findIndex(c => c === opponent);
            return pos >= 0 ? `${pos+1}º` : '—';
        })();

        // Usar as mesmas cores do club-budget para consistência visual
        const bgColor = 'rgba(0,0,0,0.65)';
        const fgColor = '#fff';

        const opponentHtml = `<div style="text-align:left;">
            <div style="font-size:0.9em; font-weight:700; margin-bottom:6px;">${opponentName}</div>
            <div style="font-size:0.85em; opacity:0.95;">Posição: <strong>${positionText}</strong> · Avg: <strong>${avgSkill(opponent)}</strong></div>
        </div>`;

        if (inlineEl) {
            const det = document.getElementById(detailsId);
            if (det) det.innerHTML = opponentHtml;
            inlineEl.style.display = '';
            return;
        }

        // fallback to floating element if inline box not present
        if (!floatEl) {
            floatEl = document.createElement('div');
            floatEl.id = 'nextOpponentFloating';
            floatEl.className = 'finance-item floating-opponent hub-box';
            floatEl.style.cssText = 'position:fixed; bottom:14px; right:14px; width:var(--tactic-panel-width,280px); z-index:1200;';
            document.body.appendChild(floatEl);
        }
        floatEl.innerHTML = opponentHtml;
        floatEl.style.display = '';
    }

    // Helper: check whether a player object is still present in any club roster
    function isPlayerInAnyClub(player) {
        try {
            const all = window.ALL_CLUBS || window.allClubs || window.ALL_CLUBS || [];
            for (const c of all) {
                if (!c || !c.team || !Array.isArray(c.team.players)) continue;
                if (c.team.players.find(p => (p && p.id && player.id && p.id === player.id) || (p && p.name && p.name === player.name))) return true;
            }
        } catch (e) { /* ignore */ }
        return false;
    }

    // Show a small action menu for a player in our squad: Renew (if near contract end) and Sell
    function showPlayerActionMenu(player, club) {
        try {
            const overlayId = 'player-action-overlay';
            let overlay = document.getElementById(overlayId);
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = overlayId;
                overlay.style.position = 'fixed'; overlay.style.left='0'; overlay.style.top='0'; overlay.style.width='100vw'; overlay.style.height='100vh'; overlay.style.zIndex='70000'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.background='rgba(0,0,0,0.45)';
                document.body.appendChild(overlay);
            }
            overlay.innerHTML = '';
            const box = document.createElement('div');
            box.style.maxWidth = '520px'; box.style.width='90%'; box.style.background='var(--hub-panel-bg, #222)'; box.style.color='#fff'; box.style.padding='14px'; box.style.borderRadius='10px';
            const contractLeft = (typeof player.contractYearsLeft !== 'undefined') ? Number(player.contractYearsLeft) : Number(player.contractYears || 0);
            const showRenew = contractLeft <= 1; // consider 'end of contract' as <=1 year left
            let html = `<h3>${player.name}</h3><div style="margin-top:8px;">Posição: ${(player.position||player.pos||'–')} · Skill: ${(player.skill||0)} · Salário atual: ${formatMoney(player.salary||0)}</div><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">`;
            if (showRenew) html += `<button id="playerRenewBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#2b7;color:#fff;">Renovar contrato</button>`;
            html += `<button id="playerSellBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#d33;color:#fff;">Colocar à venda</button>`;
            html += `<button id="playerCancelBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#fff;color:#111;">Fechar</button></div>`;
            box.innerHTML = html;
            overlay.appendChild(box);

            setTimeout(()=>{
                const cancel = document.getElementById('playerCancelBtn');
                if (cancel) cancel.addEventListener('click', ()=>{ try{ if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }catch(e){} });
                const sell = document.getElementById('playerSellBtn');
                if (sell) sell.addEventListener('click', ()=>{
                    // Add to pending releases but keep player in roster until processed
                    window.PENDING_RELEASES = window.PENDING_RELEASES || [];
                    // compute a leaving fee if not present
                    let fee = Number(player.leavingFee || 0);
                    if (!fee || fee <= 0) {
                        const value = (typeof window.computePlayerMarketValue === 'function') ? window.computePlayerMarketValue(player, club.division) : ((player.skill || 50) * 1200);
                        fee = Math.round(value * 0.8);
                    }
                    const pending = Object.assign({}, player, { previousSalary: Number(player.salary || 0), leavingFee: fee, originalClubRef: club });
                    // avoid duplicates
                    if (!window.PENDING_RELEASES.find(p => (p.id && pending.id && p.id === pending.id) || (p.name && p.name === pending.name))) {
                        window.PENDING_RELEASES.push(pending);
                        alert(`${player.name} marcado como jogador para saír. Será exibido no popup de ofertas antes de processar.`);
                    } else {
                        alert(`${player.name} já se encontra como pending.`);
                    }
                    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                });
                const renew = document.getElementById('playerRenewBtn');
                if (renew) renew.addEventListener('click', ()=>{
                    const defaultSalary = Math.max(500, Number(player.salary || 500));
                    const salaryStr = prompt(`Renovar contrato para ${player.name}\nIntroduza salário mensal:`, String(defaultSalary));
                    if (salaryStr === null) return; const salary = Math.max(1, Math.round(Number(salaryStr) || 0));
                    const yearsStr = prompt('Duração do novo contrato (anos):', '1'); if (yearsStr === null) return; const years = Math.max(0, Math.min(10, Number(yearsStr) || 1));
                    // apply directly or use Finance negotiation if available
                    if (window.Finance && typeof window.Finance.negotiatePlayerContract === 'function') {
                        const res = window.Finance.negotiatePlayerContract(club, player.id, salary, years);
                        if (!res) { alert('Erro na negociação'); return; }
                        if (res.accepted) alert(`${player.name} renovou contrato: ${formatMoney(player.salary)} por ${player.contractYears} anos`);
                        else alert(`${player.name} rejeitou a renovação.`);
                    } else {
                        player.salary = salary; player.contractYears = years; player.contractYearsLeft = years;
                        alert(`${player.name} renovado para ${formatMoney(salary)} por ${years} anos.`);
                    }
                    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    renderTeamRoster(club);
                });
            },10);
        } catch (e) { console.warn('showPlayerActionMenu failed', e); }
    }

    // Overlay to buy a free player (improved menu)
    function showBuyFreePlayerMenu(pl, rawFreeAgents, idxInFiltered) {
        try {
            const overlayId = 'buy-free-overlay';
            let overlay = document.getElementById(overlayId);
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = overlayId;
                overlay.style.position = 'fixed'; overlay.style.left='0'; overlay.style.top='0'; overlay.style.width='100vw'; overlay.style.height='100vh'; overlay.style.zIndex='70010'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.background='rgba(0,0,0,0.5)';
                document.body.appendChild(overlay);
            }
            overlay.innerHTML = '';
            const box = document.createElement('div');
            box.style.maxWidth = '620px'; box.style.width='92%'; box.style.background='var(--hub-panel-bg, #222)'; box.style.color='#fff'; box.style.padding='14px'; box.style.borderRadius='10px';
            const skill = typeof pl.skill === 'number' ? pl.skill : (pl._skill || 0);
            const minC = Math.max(0, Number(pl.minContract || pl.minMonthly || pl.minSalary || 0));
            const prev = pl.previousClubName || ((pl.club && (pl.club.team ? pl.club.team.name : pl.club.name)) || pl.clubName || '—');
            const html = `
                <h3>Assinar jogador livre</h3>
                <div style="margin-top:6px;font-weight:700">${pl.name} <span style="font-weight:500;opacity:0.85">(${pl.position||''})</span></div>
                <div style="margin-top:6px;color:rgba(255,255,255,0.85)">Skill: ${skill} · Clube anterior: ${prev} · Salário mínimo: ${formatMoney(minC)}</div>
                <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
                    <label style="min-width:120px">Salário mensal</label>
                    <input id="buyFreeSalaryInput" type="number" min="${minC}" value="${minC || Math.max(500, Number(pl.salary||500))}" style="width:160px;padding:6px;border-radius:6px;border:1px solid #ccc;" />
                </div>
                <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:8px;">
                    <button id="buyFreeCancelBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#fff;color:#111">Cancelar</button>
                    <button id="buyFreeConfirmBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#2b7;color:#fff">Assinar (1 ano)</button>
                </div>`;
            box.innerHTML = html;
            overlay.appendChild(box);

            setTimeout(()=>{
                const cancel = document.getElementById('buyFreeCancelBtn');
                const confirm = document.getElementById('buyFreeConfirmBtn');
                const salaryIn = document.getElementById('buyFreeSalaryInput');
                if (cancel) cancel.addEventListener('click', ()=>{ try{ if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }catch(e){} });
                if (confirm) confirm.addEventListener('click', ()=>{
                    const salary = Math.max(minC, Math.round(Number(salaryIn.value || minC || 500)));
                    const buyer = window.playerClub; if (!buyer) return alert('Nenhum clube comprador definido (playerClub).');
                    // remove from global free list by matching id/name
                    const ridx = rawFreeAgents.findIndex(pp => (pp.id && pl.id && pp.id === pl.id) || (pp.name && pp.name === pl.name));
                    if (ridx >= 0) rawFreeAgents.splice(ridx,1);
                    // add to buyer with 1-year contract
                    const playerToAdd = Object.assign({}, pl);
                    playerToAdd.salary = salary; playerToAdd.contractYears = 1; playerToAdd.contractYearsLeft = 1;
                    buyer.team.players = buyer.team.players || [];
                    buyer.team.players.push(playerToAdd);
                    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    alert(`${pl.name} assinado por ${buyer.team.name} por ${formatMoney(salary)} /mês (1 ano).`);
                    renderTransfers(); renderTeamRoster(buyer);
                });
            },10);
        } catch (e) { console.warn('showBuyFreePlayerMenu failed', e); }
    }

    function buildNextOpponentHtml() {
        try {
            const matches = window.currentRoundMatches || [];
            const player = window.playerClub;
            if (!player) return '<div>Nenhuma equipa de jogador definida.</div>';
            // Provide robust matching helper that tolerates different shapes (object refs, nested .team, or plain names)
            function clubEquals(a, b) {
                if (!a || !b) return false;
                // same reference
                if (a === b) return true;
                // if one is a string name
                const aName = (typeof a === 'string') ? a : (a.team ? (a.team.name || a.name) : (a.name || null));
                const bName = (typeof b === 'string') ? b : (b.team ? (b.team.name || b.name) : (b.name || null));
                if (aName && bName && String(aName).trim() === String(bName).trim()) return true;
                return false;
            }

            if (!Array.isArray(matches)) {
                console.log('buildNextOpponentHtml: window.currentRoundMatches is not an array', matches);
            } else {
                console.log('buildNextOpponentHtml: matches length', matches.length, 'player', player && player.team && player.team.name);
            }

            let next = matches.find(m => !m.isFinished && (clubEquals(m.homeClub, player) || clubEquals(m.awayClub, player)));
            // If not found in this round, try the next jornada's matches (user expects next-round opponent after current match played)
            if (!next && Array.isArray(matches) && matches.length > 0) {
                try {
                    const divIdx = (player && player.division) ? player.division - 1 : 0;
                    const divisionClubs = (window.allDivisions && window.allDivisions[divIdx]) ? window.allDivisions[divIdx] : [];
                    if (divisionClubs && divisionClubs.length && typeof generateRounds === 'function') {
                        const rounds = generateRounds(divisionClubs);
                        const nextRoundIdx = (typeof currentJornada === 'number') ? currentJornada : 1; // currentJornada is 1-based; next round index = currentJornada
                        if (Array.isArray(rounds) && rounds.length > nextRoundIdx) {
                            const nextRoundMatches = rounds[nextRoundIdx];
                            next = (Array.isArray(nextRoundMatches) ? nextRoundMatches.find(m => (clubEquals(m.homeClub, player) || clubEquals(m.awayClub, player))) : null);
                            if (next) {
                                // mark indicator so UI shows it's next jornada
                                next._isNextJornada = true;
                            }
                        }
                    }
                } catch (e) { console.warn('buildNextOpponentHtml: next-jornada lookup failed', e); }
            }

            // fallback to checking serialized saved snapshot matches (older shape)
            if (!next || matches.length === 0) {
                try {
                    const raw = localStorage.getItem('elifoot_save_snapshot');
                    if (raw) {
                        const snap = JSON.parse(raw);
                        const savedMatches = snap && snap.currentRoundMatches ? snap.currentRoundMatches : [];
                        console.log('buildNextOpponentHtml: trying snapshot fallback, savedMatches length', savedMatches.length);
                        next = savedMatches.find(m => !m.isFinished && (clubEquals(m.homeClub, player) || clubEquals(m.awayClub, player)));
                    }
                } catch (e) { console.warn('buildNextOpponentHtml: snapshot parse failed', e); }
            }
            // fallback: try saved snapshot if in-memory matches empty
            if (!next || matches.length === 0) {
                try {
                    const raw = localStorage.getItem('elifoot_save_snapshot');
                    if (raw) {
                        const snap = JSON.parse(raw);
                        const savedMatches = snap && snap.currentRoundMatches ? snap.currentRoundMatches : [];
                        next = savedMatches.find(m => !m.isFinished && ((m.homeClub && m.homeClub.team && m.homeClub.team.name) === (player.team && player.team.name) || (m.awayClub && m.awayClub.team && m.awayClub.team.name) === (player.team && player.team.name)));
                    }
                } catch (e) { /* ignore */ }
            }
            let lastPlayedMatch = null;
            let showPlayed = false;
            if (!next) {
                // if there is no upcoming match, try to find the most recent played match for this team in the round
                try {
                    const rev = (matches || []).slice().reverse();
                    lastPlayedMatch = rev.find(m => m.isFinished && (clubEquals(m.homeClub, player) || clubEquals(m.awayClub, player)));
                    if (lastPlayedMatch) {
                        showPlayed = true;
                        next = lastPlayedMatch;
                    }
                } catch (e) { /* ignore */ }
            }
            if (!next) {
                // diagnostic: show first few matches so user can see shapes
                const sample = (matches || []).slice(0,6).map(m => {
                    const h = (m.homeClub && (m.homeClub.team ? m.homeClub.team.name : m.homeClub.name)) || (m.home && m.home.name) || String(m.homeClub || 'N/A');
                    const a = (m.awayClub && (m.awayClub.team ? m.awayClub.team.name : m.awayClub.name)) || (m.away && m.away.name) || String(m.awayClub || 'N/A');
                    return `${h} vs ${a} ${m.isFinished ? '(played)' : ''}`;
                }).join('<br>');
                return `<div>Sem jogo agendado nesta jornada.<br><small>Exemplo de jogos desta ronda:<br>${sample}</small></div>`;
            }
            const isHome = next.homeClub === player;
            const opponent = isHome ? next.awayClub : next.homeClub;
            // compute table position for opponent
            const divIdx = (opponent && opponent.division) ? opponent.division - 1 : (player.division ? player.division - 1 : 0);
            const divisionClubs = (window.allDivisions && window.allDivisions[divIdx]) ? window.allDivisions[divIdx] : [];
            const sorted = [...divisionClubs].sort((a,b)=>{
                if ((b.points||0) !== (a.points||0)) return (b.points||0) - (a.points||0);
                const ad = (a.goalsFor||0) - (a.goalsAgainst||0);
                const bd = (b.goalsFor||0) - (b.goalsAgainst||0);
                return bd - ad;
            });
            const pos = sorted.findIndex(c => c === opponent);
            const positionText = pos >= 0 ? `${pos+1}º` : '—';

            // top scorer for opponent (by player.goals, fallback to highest skill)
            let top = { name: '—', goals: 0, skill: 0 };
            if (opponent && opponent.team && Array.isArray(opponent.team.players)) {
                opponent.team.players.forEach(p => {
                    const g = p.goals || 0;
                    if (g > (top.goals || 0)) top = { name: p.name, goals: g };
                });
                if (!top.name || top.goals === 0) {
                    // fallback to highest skill
                    const best = opponent.team.players.reduce((a,b)=> (b.skill||0) > (a.skill||0) ? b : a, opponent.team.players[0] || {});
                    if (best) top = { name: best.name || '—', goals: best.goals || 0 };
                }
            }

            // Build a compact comparative table: player's team vs opponent
            const playerClubObj = player;
            const opponentClubObj = opponent;

            function safeStat(club, key){ return club && typeof club[key] === 'number' ? club[key] : 0; }
            function avgSkill(club){
                if (!club || !club.team || !Array.isArray(club.team.players) || club.team.players.length === 0) return 0;
                const sum = club.team.players.reduce((s,p)=>s + (p && typeof p.skill === 'number' ? p.skill : 0), 0);
                return Math.round(sum / club.team.players.length);
            }

            const playerPosText = (() => {
                const divIdx = (playerClubObj && playerClubObj.division) ? playerClubObj.division - 1 : 0;
                const divisionClubs = (window.allDivisions && window.allDivisions[divIdx]) ? window.allDivisions[divIdx] : [];
                const sorted = [...divisionClubs].sort((a,b)=> (b.points||0)-(a.points||0) || ((b.goalsFor||0)-(b.goalsAgainst||0)) - ((a.goalsFor||0)-(a.goalsAgainst||0)) );
                const idx = sorted.findIndex(c=>c===playerClubObj);
                return idx >= 0 ? `${idx+1}º` : '—';
            })();

            const opponentPosText = positionText || '—';

            const pdata = {
                name: playerClubObj.team.name,
                pts: safeStat(playerClubObj, 'points'),
                j: safeStat(playerClubObj, 'gamesPlayed') || 0,
                v: safeStat(playerClubObj, 'wins') || 0,
                e: safeStat(playerClubObj, 'draws') || 0,
                d: safeStat(playerClubObj, 'losses') || 0,
                gf: safeStat(playerClubObj, 'goalsFor'),
                ga: safeStat(playerClubObj, 'goalsAgainst'),
                gd: (safeStat(playerClubObj,'goalsFor') - safeStat(playerClubObj,'goalsAgainst')),
                top: (()=>{
                    if (!playerClubObj.team || !Array.isArray(playerClubObj.team.players)) return '—';
                    const best = playerClubObj.team.players.reduce((a,b)=> (b.goals||0) > (a.goals||0) ? b : a, playerClubObj.team.players[0] || {});
                    const sk = best && typeof best.skill === 'number' ? best.skill : 0;
                    const padded = String(sk).padStart(3,'0');
                    return `${best.name || '—'} ${padded} (${best.goals || 0})`;
                })(),
                avg: avgSkill(playerClubObj)
            };

            const odata = {
                name: opponentClubObj.team.name,
                pts: safeStat(opponentClubObj, 'points'),
                j: safeStat(opponentClubObj, 'gamesPlayed') || 0,
                v: safeStat(opponentClubObj, 'wins') || 0,
                e: safeStat(opponentClubObj, 'draws') || 0,
                d: safeStat(opponentClubObj, 'losses') || 0,
                gf: safeStat(opponentClubObj, 'goalsFor'),
                ga: safeStat(opponentClubObj, 'goalsAgainst'),
                gd: (safeStat(opponentClubObj,'goalsFor') - safeStat(opponentClubObj,'goalsAgainst')),
                top: (()=>{
                    const name = top.name || '—';
                    const goals = top.goals || 0;
                    // try to find skill for that player in opponent roster
                    let sk = 0;
                    if (opponentClubObj && opponentClubObj.team && Array.isArray(opponentClubObj.team.players)) {
                        const found = opponentClubObj.team.players.find(p => p.name === top.name);
                        if (found && typeof found.skill === 'number') sk = found.skill;
                    }
                    const padded = String(sk).padStart(3,'0');
                    return `${name} ${padded} (${goals})`;
                })(),
                avg: avgSkill(opponentClubObj)
            };

            const homeAway = isHome ? 'Casa' : 'Fora';

            // If this was a played match, compute the score lines to show the result prominently
            let scoreHtml = '';
            if (next && next.isFinished) {
                const homeGoals = (typeof next.homeGoals === 'number') ? next.homeGoals : (Array.isArray(next.goals) ? next.goals.filter(g=>g.team==='home').length : 0);
                const awayGoals = (typeof next.awayGoals === 'number') ? next.awayGoals : (Array.isArray(next.goals) ? next.goals.filter(g=>g.team==='away').length : 0);
                const homeName = (next.homeClub && next.homeClub.team && next.homeClub.team.name) || (next.home && next.home.name) || 'Casa';
                const awayName = (next.awayClub && next.awayClub.team && next.awayClub.team.name) || (next.away && next.away.name) || 'Fora';
                scoreHtml = `<div style="margin-bottom:8px; font-weight:800; font-size:1.02em;">Último jogo: ${homeName} ${homeGoals} - ${awayGoals} ${awayName}</div>`;
            }

            // Render as compact flex rows so each team's line stays on a single row and uses available space better
            // build swatch / pill style helper reused from classification rendering
            function makeStylesForClub(club) {
                // Use explicit team colors: background = team.bgColor, text = team.color (second color)
                const nameBg = (club.team && club.team.bgColor) || '#333';
                const pref = (club.team && club.team.color) || '#ffffff';
                // Ensure pref is a valid color; fallback to readable color if contrast is too low
                let textColor = pref;
                try {
                    if (typeof contrastRatio === 'function' && contrastRatio(nameBg, textColor) < 3.5) {
                        // if contrast is low, fall back to a readable color
                        textColor = getReadableTextColor(nameBg, textColor);
                    }
                } catch (e) {
                    textColor = getReadableTextColor(nameBg, textColor);
                }

                const swatchBorderColor = luminance(hexToRgb(nameBg)) > 0.5 ? '#000000' : '#ffffff';
                const swatchShadow = `rgba(${hexToRgb(swatchBorderColor).join(',')},0.12)`;
                const swatchStyle = `width:18px;height:18px;background:${nameBg};border:1px solid ${swatchBorderColor};border-radius:3px;box-shadow:0 0 0 3px ${swatchShadow};flex:0 0 auto;display:inline-block;`;

                // Name pill uses team background and the team's second color for text. Add a subtle semi-opaque outline
                // to improve legibility on similar backgrounds.
                const outlineRgb = hexToRgb(swatchBorderColor);
                const pillBoxShadow = `0 0 0 3px rgba(${outlineRgb.join(',')},0.08)`;
                const nameStyleInline = `background:${nameBg}; color:${textColor}; padding:4px 10px; border-radius:8px; display:inline-block; width:160px; box-sizing:border-box; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border:1px solid ${swatchBorderColor}; box-shadow:${pillBoxShadow}; font-weight:600;`;
                return { swatchStyle, nameStyleInline };
            }

            const playerStyles = makeStylesForClub(playerClubObj);
            const oppStyles = makeStylesForClub(opponentClubObj);

            // Render a compact single-line per team view with a header describing each field
            const headerStyle = 'display:flex;align-items:center;gap:12px;padding:6px 8px;border-radius:6px;background:rgba(0,0,0,0.04);font-weight:700;font-size:0.92em;';
            const rowStyle = 'display:flex;align-items:center;gap:12px;padding:8px;border-radius:6px;background:rgba(0,0,0,0.02);font-size:0.95em;';
            const colPos = 'width:40px;text-align:left;flex:0 0 auto;';
            const colSwatch = 'width:18px;flex:0 0 18px;';
            const colName = 'flex:1;min-width:120px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;';
            const colSmall = 'width:48px;text-align:center;flex:0 0 48px;';
            const colAvg = 'width:56px;text-align:center;flex:0 0 56px;';
            const colPts = 'width:64px;text-align:right;flex:0 0 64px;';

            const compact = `
                ${scoreHtml}
                <div class="hub-box" style="padding:10px;background:var(--hub-panel-bg,rgba(0,0,0,0.03));border-radius:10px;">
                    <div style="${headerStyle}">
                        <div style="${colPos}">POS</div>
                        <div style="${colSwatch}"></div>
                        <div style="${colName}">EQUIPA</div>
                        <div style="${colSmall}">J</div>
                        <div style="${colSmall}">V</div>
                        <div style="${colSmall}">E</div>
                        <div style="${colSmall}">D</div>
                        <div style="${colSmall}">GM</div>
                        <div style="${colSmall}">GS</div>
                        <div style="${colAvg}">AVG</div>
                        <div style="${colPts}">PTS</div>
                    </div>

                    <div style="${rowStyle}">
                        <div style="${colPos}">${playerPosText}</div>
                        <div style="${colSwatch}"><span title="${(playerClubObj.team && playerClubObj.team.bgColor) || ''}" style="${playerStyles.swatchStyle}"></span></div>
                        <div style="${colName}"><span class="team-name-label" style="${playerStyles.nameStyleInline}">${pdata.name}</span></div>
                        <div style="${colSmall}">${pdata.j}</div>
                        <div style="${colSmall}">${pdata.v}</div>
                        <div style="${colSmall}">${pdata.e}</div>
                        <div style="${colSmall}">${pdata.d}</div>
                        <div style="${colSmall}">${pdata.gf}</div>
                        <div style="${colSmall}">${pdata.ga}</div>
                        <div style="${colAvg}">${pdata.avg}</div>
                        <div style="${colPts}">${pdata.pts}</div>
                    </div>

                    <div style="height:6px"></div>

                    <div style="${rowStyle}">
                        <div style="${colPos}">${opponentPosText}</div>
                        <div style="${colSwatch}"><span title="${(opponentClubObj.team && opponentClubObj.team.bgColor) || ''}" style="${oppStyles.swatchStyle}"></span></div>
                        <div style="${colName}"><span class="team-name-label" style="${oppStyles.nameStyleInline}">${odata.name}</span></div>
                        <div style="${colSmall}">${odata.j}</div>
                        <div style="${colSmall}">${odata.v}</div>
                        <div style="${colSmall}">${odata.e}</div>
                        <div style="${colSmall}">${odata.d}</div>
                        <div style="${colSmall}">${odata.gf}</div>
                        <div style="${colSmall}">${odata.ga}</div>
                        <div style="${colAvg}">${odata.avg}</div>
                        <div style="${colPts}">${odata.pts}</div>
                    </div>

                    <div style="margin-top:8px; font-size:0.95em; opacity:0.95;">Clique em <em>Ver Plantel</em> na página da equipa para mais detalhes.</div>
                </div>
            `;
            const html = compact;
            return html;
        } catch (err) {
            console.warn('buildNextOpponentHtml failed', err);
            return '<div>Erro ao obter adversário.</div>';
        }
    }

    function renderAllDivisionsTables() {
        const content = document.getElementById('hub-main-content');
        if (!content) return;
        const all = window.allDivisions || [];
        // Render as 4-column grid similar to match board so user can see all divisions at once
        let html = `<h2>Classificações</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">`;
        for (let idx = 0; idx < 4; idx++) {
            const divisionClubs = all[idx] || [];
            const divNumber = idx + 1;
            const sorted = [...divisionClubs].sort((a,b)=>{
                if ((b.points||0) !== (a.points||0)) return (b.points||0) - (a.points||0);
                const ad = (a.goalsFor||0) - (a.goalsAgainst||0);
                const bd = (b.goalsFor||0) - (b.goalsAgainst||0);
                return bd - ad;
            });
            html += `<div class="division-board" style="min-height:200px;">
                <h3 class="division-title">Divisão ${divNumber}</h3>
                <table style="width:100%; border-collapse:collapse; font-size:0.9em;">
                    <thead><tr style="background:rgba(0,0,0,0.12);"><th style="width:28px">#</th><th>Equipa</th><th style="width:52px;text-align:center">PTS</th></tr></thead>
                    <tbody>`;
            sorted.forEach((club, i) => {
                const highlight = club === window.playerClub ? 'background:rgba(255,235,59,0.12); font-weight:700;' : '';
                const nameBg = (club.team && club.team.bgColor) || '#333';
                const pref = (club.team && club.team.color) || '#ffffff';
                let nameColor = getReadableTextColor(nameBg, pref);
                try { if (contrastRatio(nameBg, nameColor) < 4.5) { nameColor = luminance(hexToRgb(nameBg)) > 0.5 ? '#000000' : '#ffffff'; } } catch(e){}
                // compute a readable border/shadow for the swatch so the swatch is always legible without changing the team color
                const swatchBorderColor = luminance(hexToRgb(nameBg)) > 0.5 ? '#000000' : '#ffffff';
                const swatchShadow = `rgba(${hexToRgb(swatchBorderColor).join(',')},0.12)`;
                const swatchStyle = `width:14px;height:14px;background:${nameBg};border:1px solid ${swatchBorderColor};border-radius:3px;box-shadow:0 0 0 3px ${swatchShadow};flex:0 0 auto;display:inline-block;`;
                // Use the club's bgColor as the pill background and the club's color as text (with readable fallback)
                const textPrefLocal = (club.team && club.team.color) || '#ffffff';
                let textColorLocal = textPrefLocal;
                try { if (contrastRatio(nameBg, textColorLocal) < 3.5) textColorLocal = getReadableTextColor(nameBg, textColorLocal); } catch(e) { textColorLocal = getReadableTextColor(nameBg, textColorLocal); }
                const nameStroke = luminance(hexToRgb(nameBg)) > 0.5 ? '#000000' : '#ffffff';
                const pillBoxShadow = `0 0 0 3px rgba(${hexToRgb(nameStroke).join(',')},0.08)`;
                const nameStyleInline = `background:${nameBg}; color:${textColorLocal}; padding:2px 6px; border-radius:6px; display:inline-block; width:160px; box-sizing:border-box; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border:1px solid ${swatchBorderColor}; box-shadow:${pillBoxShadow}; font-weight:600;`;
                html += `<tr style="${highlight}"><td>${i+1}</td><td><div style="display:flex;align-items:center;gap:8px;"><span title="${nameBg}" style=\"${swatchStyle}\"></span><span class="team-name-label" style=\"${nameStyleInline}\">${club.team.name}</span></div></td><td style=\"text-align:center\">${club.points||0}</td></tr>`;
            });
            html += `</tbody></table></div>`;
        }
        html += '</div>';
        content.innerHTML = html;
    }

    function renderLeagueTable() {
        const content = document.getElementById('hub-main-content');
        if (!content) return;

        const playerDivision = window.playerClub.division;
        const divisionClubs = window.allDivisions[playerDivision - 1];
        
        if (!divisionClubs) {
            content.innerHTML = '<h2>Classificação</h2><p>Divisão não encontrada.</p>';
            return;
        }

        const sortedClubs = [...divisionClubs].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const aDiff = a.goalsFor - a.goalsAgainst;
            const bDiff = b.goalsFor - b.goalsAgainst;
            return bDiff - aDiff;
        });

        let html = `
            <h2 style="font-size:1.05em;margin-bottom:8px;">Classificação - Divisão ${playerDivision}</h2>
            <div style="max-height:80vh; overflow:auto;">
            <table style="width: 100%; border-collapse: collapse; background-color: rgba(0,0,0,0.08); margin-top: 8px; font-size:0.86em; line-height:1.08;">
                <thead>
                    <tr style="background-color: rgba(0,0,0,0.22);">
                        <th style="padding: 6px; text-align: left; width:36px">POS</th>
                        <th style="padding: 6px; text-align: left;">EQUIPA</th>
                        <th style="padding: 6px; text-align: center; width:40px">J</th>
                        <th style="padding: 6px; text-align: center; width:40px">V</th>
                        <th style="padding: 6px; text-align: center; width:40px">E</th>
                        <th style="padding: 6px; text-align: center; width:40px">D</th>
                        <th style="padding: 6px; text-align: center; width:48px">GM</th>
                        <th style="padding: 6px; text-align: center; width:48px">GS</th>
                        <th style="padding: 6px; text-align: center; width:56px">PTS</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sortedClubs.forEach((club, index) => {
            const isPlayerClub = club === window.playerClub;
            const rowStyle = isPlayerClub ? 'background-color: rgba(255,235,59,0.2); font-weight: bold;' : '';
            const nameBg = (club.team && club.team.bgColor) || '#333';
            const pref = (club.team && club.team.color) || '#ffffff';
            let nameColor = getReadableTextColor(nameBg, pref);
            try { if (contrastRatio(nameBg, nameColor) < 4.5) { nameColor = luminance(hexToRgb(nameBg)) > 0.5 ? '#000000' : '#ffffff'; } } catch(e){}
            // add high-contrast border/shadow to swatch for legibility (keeps original color intact)
            const swatchBorderColor = luminance(hexToRgb(nameBg)) > 0.5 ? '#000000' : '#ffffff';
            const swatchShadow = `rgba(${hexToRgb(swatchBorderColor).join(',')},0.12)`;
            const swatchStyle = `width:12px;height:12px;background:${nameBg};border:1px solid ${swatchBorderColor};border-radius:3px;display:inline-block;margin-right:6px;box-shadow:0 0 0 2px ${swatchShadow};`;

            // add readable stroke/outlines to the team name so blue-on-yellow and similar combos remain legible
            const nameStroke = luminance(hexToRgb(nameBg)) > 0.5 ? '#000000' : '#ffffff';
            const nameTextShadow = `text-shadow: -1px -1px 0 ${nameStroke}, 1px -1px 0 ${nameStroke}, -1px 1px 0 ${nameStroke}, 1px 1px 0 ${nameStroke}; -webkit-text-stroke:0.6px ${nameStroke};`;

            const strokeRgb3 = hexToRgb(nameStroke || '#000');
            // Use team bgColor for pill background and team.color for text (with readable fallback)
            const textPref = (club.team && club.team.color) || '#ffffff';
            let textColor3 = textPref;
            try {
                if (contrastRatio(nameBg, textColor3) < 3.5) textColor3 = getReadableTextColor(nameBg, textColor3);
            } catch (e) { textColor3 = getReadableTextColor(nameBg, textColor3); }
            const swatchBorderColor3 = luminance(hexToRgb(nameBg)) > 0.5 ? '#000000' : '#ffffff';
            const pillBoxShadow3 = `0 0 0 3px rgba(${hexToRgb(swatchBorderColor3).join(',')},0.08)`;
            const nameStyleInline3 = `background:${nameBg}; color:${textColor3}; padding:2px 6px; border-radius:6px; display:inline-block; width:140px; box-sizing:border-box; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border:1px solid ${swatchBorderColor3}; box-shadow:${pillBoxShadow3}; font-weight:600; font-size:0.95em;`;
            html += `
                <tr style="${rowStyle}">
                    <td style="padding: 6px;">${index + 1}</td>
                    <td style="padding: 6px;"><div style="display:flex;align-items:center;gap:6px;">${isPlayerClub ? '<span style="margin-right:6px;">⭐</span>' : ''}<span title="${nameBg}" style="${swatchStyle}"></span><span class="team-name-label" style="${nameStyleInline3}">${club.team.name}</span></div></td>
                    <td style="padding: 6px; text-align: center;">${club.gamesPlayed || 0}</td>
                    <td style="padding: 6px; text-align: center;">${club.wins || 0}</td>
                    <td style="padding: 6px; text-align: center;">${club.draws || 0}</td>
                    <td style="padding: 6px; text-align: center;">${club.losses || 0}</td>
                    <td style="padding: 6px; text-align: center;">${club.goalsFor || 0}</td>
                    <td style="padding: 6px; text-align: center;">${club.goalsAgainst || 0}</td>
                    <td style="padding: 6px; text-align: center; font-weight: bold;">${club.points || 0}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        content.innerHTML = html;
    }

    function renderTransfers() {
        const content = document.getElementById('hub-main-content');
        if (!content) return;
        // Enhanced transfers UI: tabs for Mercado and Jogadores Livres
        const market = window.transferMarket || window.availableTransfers || window.transferList || [];
        const rawFreeAgents = window.FREE_TRANSFERS || window.freeAgents || [];

        // Filter free agents to only those not currently present in any club
        const freeAgents = Array.isArray(rawFreeAgents) ? rawFreeAgents.filter(p => !isPlayerInAnyClub(p)) : [];

        if ((!Array.isArray(market) || market.length === 0) && (!Array.isArray(freeAgents) || freeAgents.length === 0)) {
            content.innerHTML = '<h2>Transferências</h2><p>Nenhum jogador disponível no mercado.</p>';
            return;
        }

        let html = `<h2>Transferências</h2><div class="hub-box" style="padding:8px;display:flex;flex-direction:column;gap:8px;">`;
        // tabs header
        html += `<div style="display:flex;gap:8px;margin-bottom:8px;"><button id="tab-market" style="padding:6px 10px;border-radius:8px;border:none;background:#eee;color:#111;font-weight:700;">Mercado</button><button id="tab-free" style="padding:6px 10px;border-radius:8px;border:none;background:transparent;color:#aaa;font-weight:700;">Jogadores Livres</button></div>`;

        // container for tab content
        html += `<div id="trans-tab-content" style="display:flex;flex-direction:column;gap:8px;">`;
        // default render market content
        html += `<div data-tab="market" class="trans-tab" style="display:block;">`;
        if (Array.isArray(market) && market.length) {
            market.forEach(p => {
                const pos = p.position || p.pos || '-';
                const name = p.name || p.playerName || '—';
                const club = (p.club && (p.club.team ? p.club.team.name : p.club.name)) || p.clubName || 'Livre';
                const price = p.price || p.minPrice || p.value || 0;
                html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:rgba(0,0,0,0.04);border-radius:6px;">
                    <div style="display:flex;gap:10px;align-items:center;"><div style="width:36px;font-weight:700;text-align:center">${pos}</div><div style="font-weight:600">${name}</div><div style="opacity:0.8;margin-left:8px">${club}</div></div>
                    <div style="display:flex;gap:8px;align-items:center;"><div style="font-weight:700;color:#FFEB3B">${formatMoney(price)}</div><button data-player-name="${name}" class="buy-market-btn" style="padding:6px 8px;border-radius:6px;border:none;background:#2b7;color:#fff;">Comprar</button></div>
                </div>`;
            });
        } else {
            html += `<div style="opacity:0.85;padding:8px">Nenhum item no mercado.</div>`;
        }
        html += `</div>`; // end market tab

        // free agents tab (hidden by default)
        html += `<div data-tab="free" class="trans-tab" style="display:none;">`;
        if (Array.isArray(freeAgents) && freeAgents.length) {
                freeAgents.forEach((p, idx) => {
                const pos = p.position || p.pos || '-';
                const name = p.name || p.playerName || '—';
                const prev = p.previousClubName || ((p.club && (p.club.team ? p.club.team.name : p.club.name)) || p.clubName || '—');
                const minContract = p.minContract || p.minMonthly || p.minSalary || 0;
                const skill = typeof p.skill === 'number' ? p.skill : (p._skill || 0);
                html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:rgba(0,0,0,0.03);border-radius:6px;">
                    <div style="display:flex;gap:10px;align-items:center;"><div style="width:36px;font-weight:700;text-align:center">${pos}</div><div style="font-weight:600">${name}</div><div style="opacity:0.8;margin-left:8px">${prev}</div><div style="opacity:0.75;margin-left:8px;font-size:0.9em;color:#ddd">Skill: ${skill}</div></div>
                    <div style="display:flex;gap:8px;align-items:center;"><div style="font-weight:700;color:#8BC34A">Mín: ${formatMoney(minContract)}</div><button data-free-idx="${idx}" class="buy-free-btn" style="padding:6px 8px;border-radius:6px;border:none;background:#2b7;color:#fff;">Comprar</button></div>
                </div>`;
            });
        } else {
            html += `<div style="opacity:0.85;padding:8px">Nenhum jogador livre disponível.</div>`;
        }
        html += `</div>`; // end free tab

        html += `</div>`; // end tab content
        html += `</div>`; // end box
        content.innerHTML = html;

        // attach tab handlers
        setTimeout(()=>{
            try {
                const tabMarket = document.getElementById('tab-market');
                const tabFree = document.getElementById('tab-free');
                const tabs = content.querySelectorAll('.trans-tab');
                function showTab(name) {
                    tabs.forEach(t => { t.style.display = (t.getAttribute('data-tab') === name) ? 'block' : 'none'; });
                    if (name === 'market') { tabMarket.style.background = '#eee'; tabMarket.style.color = '#111'; tabFree.style.background = 'transparent'; tabFree.style.color = '#aaa'; }
                    else { tabFree.style.background = '#eee'; tabFree.style.color = '#111'; tabMarket.style.background = 'transparent'; tabMarket.style.color = '#aaa'; }
                }
                if (tabMarket) tabMarket.addEventListener('click', ()=> showTab('market'));
                if (tabFree) tabFree.addEventListener('click', ()=> showTab('free'));

                // buy handlers for market items (simple)
                content.querySelectorAll('.buy-market-btn').forEach(b => {
                    b.addEventListener('click', ()=>{
                        const name = b.getAttribute('data-player-name');
                        alert('Comprar do mercado: ' + name + '. Implementar fluxo de transferência dependendo do tipo de listagem.');
                    });
                });

                // buy handlers for free agents
                content.querySelectorAll('.buy-free-btn').forEach(b => {
                    b.addEventListener('click', ()=>{
                        const idx = Number(b.getAttribute('data-free-idx'));
                        const freeList = Array.isArray(rawFreeAgents) ? rawFreeAgents.filter(p => !isPlayerInAnyClub(p)) : [];
                        const pl = freeList[idx];
                        if (!pl) return alert('Jogador livre não encontrado');
                        // Show a buy overlay with details and salary input, contract auto-1yr
                        showBuyFreePlayerMenu(pl, rawFreeAgents, idx);
                    });
                });

            } catch (e) { console.warn('attach transfer handlers failed', e); }
        }, 10);
    }

    // Offers / Pending releases popup
    window.Offers = window.Offers || {};
    window.Offers.showPendingReleasesPopup = function(cb) {
        const pending = window.PENDING_RELEASES || [];
        if (!Array.isArray(pending) || pending.length === 0) { if (typeof cb === 'function') cb(); return; }
        const overlayId = 'offers-overlay';
        let overlay = document.getElementById(overlayId);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = overlayId;
            overlay.style.position = 'fixed'; overlay.style.left='0'; overlay.style.top='0'; overlay.style.width='100vw'; overlay.style.height='100vh'; overlay.style.zIndex='60000'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.background='rgba(0,0,0,0.5)';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = '';
        const box = document.createElement('div');
        box.style.maxWidth = '760px'; box.style.width='90%'; box.style.maxHeight='80vh'; box.style.overflow='auto'; box.style.background='var(--hub-panel-bg, #222)'; box.style.color='#fff'; box.style.padding='14px'; box.style.borderRadius='10px';
        let html = `<h3>Jogadores a sair — Ofertas antes de processar</h3><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">`;
        pending.forEach((p, idx) => {
            const skill = p.skill || 0; const prev = Number(p.previousSalary || 0); const fee = Number(p.leavingFee || 0);
            html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:6px;background:rgba(255,255,255,0.02);">
                <div style="flex:1">
                    <div style="font-weight:700">${p.name} <span style='opacity:0.85;font-weight:500'>(${p.position||''})</span></div>
                    <div style="font-size:0.9em;opacity:0.9">Skill: ${skill} · Salário anterior: ${formatMoney(prev)} · Taxa para contratar agora: ${formatMoney(fee)}</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;margin-left:8px">
                    <button data-idx="${idx}" class="offer-propose-btn" style="padding:8px 10px;border-radius:6px;background:#2b7;color:#fff;border:none;">Propor</button>
                </div>
            </div>`;
        });
        html += `</div><div style="text-align:right;margin-top:12px;"><button id="offersCloseBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#fff;color:#111">Fechar</button></div>`;
        box.innerHTML = html;
        overlay.appendChild(box);

        // attach handlers
        setTimeout(()=>{
            box.querySelectorAll('.offer-propose-btn').forEach(btn => {
                btn.addEventListener('click', ()=>{
                    const idx = Number(btn.getAttribute('data-idx'));
                    const pl = (window.PENDING_RELEASES || [])[idx];
                    if (!pl) return alert('Jogador não encontrado.');
                    // Present a simple prompt to confirm paying the fee and offering a contract
                    const want = confirm(`${pl.name}\nSkill: ${pl.skill || 0}\nTaxa a pagar agora: ${formatMoney(pl.leavingFee || 0)}\nDeseja pagar a taxa e abrir o diálogo de contrato?`);
                    if (!want) return;
                    // Try to simulate paying fee: simply prompt for salary offer and years
                    const salaryStr = prompt('Introduza salário mensal proposto:', String(Math.max(1, pl.previousSalary || 500)));
                    if (salaryStr === null) return;
                    const salary = Math.max(1, Math.round(Number(salaryStr) || 0));
                    const years = 1; // auto 1-year contract on purchase
                    // Attempt to perform the transfer: pay leaving fee to seller, deduct from buyer budget, move player object
                    try {
                        const buyer = window.playerClub;
                        const seller = pl.originalClubRef || null;
                        const fee = Number(pl.leavingFee || 0);
                        if (!buyer) { alert('Nenhum clube comprador definido (playerClub).'); return; }
                        if (buyer.budget < fee) { alert('Orçamento insuficiente para pagar a taxa.'); return; }

                        // find actual player object in seller (if still there)
                        let realPlayer = null;
                        if (seller && seller.team && Array.isArray(seller.team.players)) {
                            realPlayer = seller.team.players.find(pp => (pp && (pp.id && pl.id && pp.id === pl.id)) || (pp && pp.name === pl.name));
                        }
                        // If not found, try to find by name across all clubs
                        if (!realPlayer) {
                            const all = window.ALL_CLUBS || window.allClubs || [];
                            for (let c of all) {
                                if (!c || !c.team || !Array.isArray(c.team.players)) continue;
                                const found = c.team.players.find(pp => (pp && (pp.id && pl.id && pp.id === pl.id)) || (pp && pp.name === pl.name));
                                if (found) { realPlayer = found; seller = c; break; }
                            }
                        }

                        // perform payments
                        buyer.budget = Math.max(0, Number(buyer.budget || 0) - fee);
                        if (seller) seller.budget = (Number(seller.budget || 0) + fee);

                        // move player object to buyer
                        if (realPlayer && seller && seller.team && Array.isArray(seller.team.players)) {
                            // remove from seller roster
                            const ridx = seller.team.players.findIndex(pp => pp === realPlayer || (pp && pl.id && pp.id === pl.id) || (pp && pp.name === pl.name));
                            if (ridx >= 0) seller.team.players.splice(ridx,1);
                        }
                        // If we didn't find the real player, create a new object from the pending clone
                        const playerToAdd = realPlayer || Object.assign({}, pl);
                        // apply contract and salary
                        playerToAdd.salary = salary;
                        playerToAdd.contractYears = years;
                        playerToAdd.contractYearsLeft = years;
                        // add to buyer team
                        buyer.team.players = buyer.team.players || [];
                        buyer.team.players.push(playerToAdd);

                        // remove from pending list
                        window.PENDING_RELEASES.splice(idx,1);

                        // update UI budgets
                        if (typeof window.updateBudgetDisplays === 'function') window.updateBudgetDisplays(buyer);

                        alert(`${pl.name} assinado com sucesso por ${buyer.team.name}. Taxa paga: ${formatMoney(fee)}.`);
                        // re-open popup to reflect removal
                        window.Offers.showPendingReleasesPopup(cb);
                    } catch (err) {
                        console.warn('Transfer failed', err);
                        alert('Erro ao processar transferência: ' + (err && err.message));
                    }
                });
            });
            const closeBtn = document.getElementById('offersCloseBtn');
            if (closeBtn) closeBtn.addEventListener('click', ()=>{
                try{ if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);}catch(e){}
                try {
                    if (typeof window.processPendingReleases === 'function') {
                        window.processPendingReleases();
                    }
                } catch (e) { console.warn('processPendingReleases failed', e); }
                if (typeof cb === 'function') cb();
            });
        },10);
    };

    // Expose the full hub implementation and mark migrated
    window.Hub = window.Hub || {};
    window.Hub.initHubUI = initHubUI;
    window.Hub.renderHubContent = renderHubContent;
    window.Hub.renderTeamRoster = renderTeamRoster;
    window.Hub.createFloatingOpponentBox = createFloatingOpponentBox;
    window.Hub.buildNextOpponentHtml = buildNextOpponentHtml;
    window.Hub.renderAllDivisionsTables = renderAllDivisionsTables;
    window.Hub.renderLeagueTable = renderLeagueTable;
    
    window.Hub._migrated = true;

    // Backwards compatibility: global functions used elsewhere
    window.initHubUI = initHubUI;
    window.renderHubContent = renderHubContent;
    window.renderTeamRoster = renderTeamRoster;
    window.buildNextOpponentHtml = buildNextOpponentHtml;
    window.renderAllDivisionsTables = renderAllDivisionsTables;
    window.renderLeagueTable = renderLeagueTable;

})();
